from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import paho.mqtt.client as mqtt
import json
import os

# =====================================================
# FILE STORAGE
# =====================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
USERS_FILE = os.path.join(BASE_DIR, "users.json")


def load_users():
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, "r") as f:
                return json.load(f)
        except:
            pass

    default_users = {
        "admin": {"password": "admin123", "role": "admin"},
        "user": {"password": "user123", "role": "user"},
    }

    try:
        with open(USERS_FILE, "w") as f:
            json.dump(default_users, f, indent=4)
    except:
        pass

    return default_users


def save_users(users_dict):
    try:
        with open(USERS_FILE, "w") as f:
            json.dump(users_dict, f, indent=4)
    except:
        pass


users = load_users()

# =====================================================
# FASTAPI APP
# =====================================================
app = FastAPI()

# 🔥 FINAL CORS CONFIG (WORKS WITH VERCEL)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://smart-home-system-2qcl.vercel.app/",  # 
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# GLOBAL STORAGE
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

    users.pop(u.username, None)
    save_users(users)
    return {"status": "ok"}

# =====================================================
# SENSOR PARSER
# =====================================================
def parse_sensor_message(raw):
    result = {}
    try:
        start = raw.find("[") + 1
        end = raw.find("]")
        result["node"] = raw[start:end]

        parts = raw.split("] - ")[1]
        time_str = parts.split()[0]
        result["time"] = time_str

        sensors = parts[len(time_str):].strip().split("|")
        for s in sensors:
            if ":" in s:
                k, v = s.split(":")
                v = v.replace("C", "").replace("%", "").replace("V", "").strip()
                try:
                    v = float(v)
                except:
                    pass
                result[k.strip().lower()] = v
    except:
        pass

    return result

# =====================================================
# MQTT CALLBACKS
# =====================================================
def on_connect(client, userdata, flags, rc):
    client.subscribe("iot/pi/data")


def on_message(client, userdata, msg):
    global latest_data, system_limits

    raw = msg.payload.decode()
    parsed = parse_sensor_message(raw)

    if parsed:
        node = parsed["node"]

        if node not in system_limits:
            system_limits[node] = {"temp_th": 30.0, "gas_th": 1.2}

        parsed["temp_th"] = system_limits[node]["temp_th"]
        parsed["gas_th"] = system_limits[node]["gas_th"]

        latest_data[node] = parsed

# =====================================================
# MQTT SETUP
# =====================================================
mqtt_client = mqtt.Client()
mqtt_client.username_pw_set("p_user", "P_user123")
mqtt_client.tls_set()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

mqtt_client.connect(
    "08d5c716cf9f46518abcda4d565e5141.s1.eu.hivemq.cloud",
    8883
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
    return {"status": "ok"}


@app.post("/set_limits")
def set_limits(l: LimitUpdate):
    if l.device not in system_limits:
        system_limits[l.device] = {"temp_th": 30.0, "gas_th": 1.2}

    if l.temp_th is not None:
        system_limits[l.device]["temp_th"] = l.temp_th
        mqtt_client.publish("iot/pi/command", f"{l.device}:TEMP={l.temp_th}")

    if l.gas_th is not None:
        system_limits[l.device]["gas_th"] = l.gas_th
        mqtt_client.publish("iot/pi/command", f"{l.device}:GAS={l.gas_th}")

    return {"status": "ok", "limits": system_limits[l.device]}
