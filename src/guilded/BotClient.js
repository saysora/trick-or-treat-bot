import { WebSocket } from "ws";
import { EventEmitter } from "events";
export class BotClient {
  reconnectTimer = null;
  token;
  socket;
  emitter = new EventEmitter();

  constructor(token) {
    this.token = token;
    this.connect();
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

    this.socket.on("close", () => {
      this.emitter.emit("close");
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
