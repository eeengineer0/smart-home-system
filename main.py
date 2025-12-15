from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import paho.mqtt.client as mqtt
import json
import os

# =====================================================
# FILE STORAGE (SAFE FOR RAILWAY)
# =====================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
USERS_FILE = os.path.join(BASE_DIR, "users.json")


def load_users():
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass

    # fallback users (always exists)
    users = {
        "admin": {"password": "admin123", "role": "admin"},
        "user": {"password": "user123", "role": "user"},
    }

    try:
        with open(USERS_FILE, "w") as f:
            json.dump(users, f, indent=4)
    except Exception:
        pass

    return users


def save_users(users):
    try:
        with open(USERS_FILE, "w") as f:
            json.dump(users, f, indent=4)
    except Exception:
        pass


users = load_users()

# =====================================================
# FASTAPI APP
# =====================================================

app = FastAPI(title="IoT Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://YOUR-FRONTEND.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# DATA STORAGE
# =====================================================

latest_data = {}
system_limits = {}

# =====================================================
# MODELS
# =====================================================

class UserCreate(BaseModel):
    username: str
    password: str
    role: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    username: str
    password: str | None = None
    role: str | None = None


class UserDelete(BaseModel):
    username: str


class Command(BaseModel):
    device: str
    action: str


class LimitUpdate(BaseModel):
    device: str
    temp_th: float | None = None
    gas_th: float | None = None

# =====================================================
# USER ROUTES
# =====================================================

@app.post("/login")
def login(u: UserLogin):
    if u.username not in users:
        return {"status": "error", "msg": "Invalid credentials"}

    if users[u.username]["password"] != u.password:
        return {"status": "error", "msg": "Invalid credentials"}

    return {
        "status": "ok",
        "user": {
            "username": u.username,
            "role": users[u.username]["role"],
        },
    }


@app.get("/users")
def list_users():
    return users


@app.post("/add_user")
def add_user(u: UserCreate):
    if u.username in users:
        return {"status": "error", "msg": "User exists"}

    users[u.username] = {"password": u.password, "role": u.role}
    save_users(users)
    return {"status": "ok"}


@app.post("/update_user")
def update_user(u: UserUpdate):
    if u.username not in users:
        return {"status": "error"}

    if u.password:
        users[u.username]["password"] = u.password
    if u.role:
        users[u.username]["role"] = u.role

    save_users(users)
    return {"status": "ok"}


@app.post("/delete_user")
def delete_user(u: UserDelete):
    if u.username == "admin":
        return {"status": "error", "msg": "Cannot delete admin"}

    if u.username not in users:
        return {"status": "error"}

    del users[u.username]
    save_users(users)
    return {"status": "ok"}

# =====================================================
# MQTT LOGIC
# =====================================================

def parse_sensor_message(raw: str):
    result = {}
    try:
        node = raw[raw.find("[") + 1 : raw.find("]")]
        result["node"] = node

        body = raw.split("] - ")[1]
        time = body.split()[0]
        result["time"] = time

        sensors = body[len(time):].strip().split("|")
        for s in sensors:
            if ":" in s:
                k, v = s.split(":", 1)
                v = v.replace("C", "").replace("%", "").replace("V", "").strip()
                try:
                    v = float(v) if "." in v else int(v)
                except:
                    pass
                result[k.lower()] = v
    except:
        pass

    return result


def on_connect(client, userdata, flags, rc):
    print("MQTT connected:", rc)
    client.subscribe("iot/pi/data")


def on_message(client, userdata, msg):
    raw = msg.payload.decode()
    parsed = parse_sensor_message(raw)

    if not parsed:
        return

    node = parsed["node"]

    if node not in system_limits:
        system_limits[node] = {"temp_th": 30.0, "gas_th": 1.2}

    parsed["temp_th"] = system_limits[node]["temp_th"]
    parsed["gas_th"] = system_limits[node]["gas_th"]

    latest_data[node] = parsed


mqtt_client = mqtt.Client()
mqtt_client.username_pw_set("p_user", "P_user123")
mqtt_client.tls_set()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message


@app.on_event("startup")
def start_mqtt():
    mqtt_client.connect(
        "08d5c716cf9f46518abcda4d565e5141.s1.eu.hivemq.cloud",
        port=8883,
    )
    mqtt_client.loop_start()

# =====================================================
# API ROUTES
# =====================================================

@app.get("/")
def root():
    return {"message": "Backend working!"}


@app.get("/realtime")
def realtime():
    return latest_data


@app.post("/command")
def send_command(cmd: Command):
    msg = f"{cmd.device}:{cmd.action.replace('_', ' ')}"
    mqtt_client.publish("iot/pi/command", msg)
    return {"status": "ok", "sent": msg}


@app.post("/set_limits")
def set_limits(limit: LimitUpdate):
    if limit.device not in system_limits:
        system_limits[limit.device] = {"temp_th": 30.0, "gas_th": 1.2}

    if limit.temp_th is not None:
        system_limits[limit.device]["temp_th"] = limit.temp_th
        mqtt_client.publish("iot/pi/command", f"{limit.device}:TEMP={limit.temp_th}")

    if limit.gas_th is not None:
        system_limits[limit.device]["gas_th"] = limit.gas_th
        mqtt_client.publish("iot/pi/command", f"{limit.device}:GAS={limit.gas_th}")

    return {"status": "ok", "limits": system_limits[limit.device]}
