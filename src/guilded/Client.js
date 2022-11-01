import { WebSocket } from "ws";
import { EventEmitter } from "events";
export class Client {
  reconnectTimer = null;
  token;
  socket;
  emitter = new EventEmitter();
  mCollector = new Map();

  constructor(token) {
    this.token = token;
    this.connect();
  }

  on(event, data) {
    return this.emitter.on(event, data);
  }

  connect() {
    this.stopReconnect();
    this.socket = new WebSocket("wss://www.guilded.gg/websocket/v1", {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    this.socket.on("open", () => {
      this.emitter.emit("open");
    });

    this.socket.on("message", (data) => {
      const { t: eventType, d: payload } = JSON.parse(data);
      this.emitter.emit(eventType, payload);
    });

    this.socket.on("close", (data) => {
      this.emitter.emit("close", JSON.parse(data));
    });
  }

  stopReconnect() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
    }
  }

  reconnect() {
    console.log("Attempting to reconnect");
    this.socket.terminate();
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 5000);
  }

  disconnect() {
    this.socket.terminate();
  }
}
