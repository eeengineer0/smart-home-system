from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time

app = FastAPI()

# 🚨 TEMP: allow all origins (fixes CORS + 405 confusion)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- MODELS ----------------
class LoginData(BaseModel):
    username: str
    password: str

class Command(BaseModel):
    node: str
    command: str

class Limits(BaseModel):
    node: str
    temp_th: float
    gas_th: float

class User(BaseModel):
    username: str
    password: str
    role: str

# ---------------- MOCK DATA ----------------
users = {
    "admin": {"password": "admin123", "role": "admin"},
    "user": {"password": "user123", "role": "user"},
}

devices = {
    "Node-1": {
        "t": 24,
        "h": 55,
        "ao_v": 0.3,
        "led": "OFF",
        "fan": "OFF",
        "temp_th": 30,
        "gas_th": 0.6,
        "time": "",
        "_timestamp": 0,
    }
}

history = {
    "Node-1": {
        "time": [],
        "temp": [],
        "gas": [],
    }
}

# ---------------- ROUTES ----------------
@app.get("/")
def root():
    return {"message": "Backend working!"}

@app.post("/login")
def login(data: LoginData):
    if data.username not in users:
        return {"status": "error", "msg": "User not found"}

    if users[data.username]["password"] != data.password:
        return {"status": "error", "msg": "Wrong password"}

    return {
        "status": "ok",
        "user": {
            "username": data.username,
            "role": users[data.username]["role"],
        }
    }

@app.get("/data")
def get_data():
    now = time.strftime("%H:%M:%S")
    for node in devices:
        devices[node]["time"] = now
        devices[node]["_timestamp"] = int(time.time() * 1000)

        history[node]["time"].append(now)
        history[node]["temp"].append(devices[node]["t"])
        history[node]["gas"].append(devices[node]["ao_v"])

        history[node]["time"] = history[node]["time"][-20:]
        history[node]["temp"] = history[node]["temp"][-20:]
        history[node]["gas"] = history[node]["gas"][-20:]

    return devices

@app.get("/history")
def get_history():
    return history

@app.post("/command")
def command(cmd: Command):
    if cmd.node in devices:
        if cmd.command == "LED_ON":
            devices[cmd.node]["led"] = "ON"
        if cmd.command == "LED_OFF":
            devices[cmd.node]["led"] = "OFF"
        if cmd.command == "FAN_ON":
            devices[cmd.node]["fan"] = "ON"
        if cmd.command == "FAN_OFF":
            devices[cmd.node]["fan"] = "OFF"
    return {"status": "ok"}

@app.post("/update_limits")
def update_limits(l: Limits):
    devices[l.node]["temp_th"] = l.temp_th
    devices[l.node]["gas_th"] = l.gas_th
    return {"status": "ok"}

@app.get("/users")
def get_users():
    return {u: {"role": users[u]["role"]} for u in users}

@app.post("/add_user")
def add_user(u: User):
    if u.username in users:
        return {"status": "error", "msg": "User exists"}
    users[u.username] = {"password": u.password, "role": u.role}
    return {"status": "ok"}

@app.post("/update_user")
def update_user(u: User):
    if u.username not in users:
        return {"status": "error", "msg": "User not found"}
    if u.password:
        users[u.username]["password"] = u.password
    users[u.username]["role"] = u.role
    return {"status": "ok"}

@app.post("/delete_user")
def delete_user(u: dict):
    users.pop(u["username"], None)
    return {"status": "ok"}
