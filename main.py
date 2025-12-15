from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import paho.mqtt.client as mqtt
import json
import os

app = FastAPI()

# Allow your frontend (wherever it is hosted) to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- STORAGE ---
latest_data = {}
users = {
    "admin": {"password": "admin123", "role": "admin"},
    "user": {"password": "user123", "role": "user"}
}

# --- MQTT SETUP ---
# We use the public HiveMQ broker for easiest "from scratch" connection
MQTT_BROKER = "broker.hivemq.com"
DATA_TOPIC = "iot/pi/data"
CMD_TOPIC = "iot/pi/command"

def on_message(client, userdata, msg):
    global latest_data
    try:
        raw = msg.payload.decode()
        # Your specific parsing logic
        start = raw.find("[") + 1
        end = raw.find("]")
        node = raw[start:end]
        latest_data[node] = {"raw_payload": raw, "status": "online"}
    except:
        pass

mqtt_client = mqtt.Client()
mqtt_client.on_message = on_message
mqtt_client.connect(MQTT_BROKER, 1883, 60)
mqtt_client.subscribe(DATA_TOPIC)
mqtt_client.loop_start()

# --- ROUTES ---
class UserLogin(BaseModel):
    username: str
    password: str

class Command(BaseModel):
    username: str
    device: str
    action: str

@app.get("/")
def home():
    return {"status": "Smart Home API Live"}

@app.post("/login")
def login(u: UserLogin):
    if u.username in users and users[u.username]["password"] == u.password:
        return {"status": "ok", "role": users[u.username]["role"]}
    raise HTTPException(status_code=401, detail="Invalid Credentials")

@app.get("/realtime")
def get_data():
    return latest_data

@app.post("/command")
def send_command(cmd: Command):
    # SECURITY: Check if user is admin
    if users.get(cmd.username, {}).get("role") != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized: Admin only")
    
    message = f"{cmd.device}:{cmd.action}"
    mqtt_client.publish(CMD_TOPIC, message)
    return {"status": "command_sent", "payload": message}
