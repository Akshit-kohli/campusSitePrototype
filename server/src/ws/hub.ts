import WebSocket, { WebSocketServer } from "ws";
import type { WsMessage } from "campus-shield-shared";

/** Manages WebSocket connections and broadcasts. */
export class Hub {
  private readonly clients = new Set<WebSocket>();

  register(wss: WebSocketServer): void {
    wss.on("connection", (ws: WebSocket) => {
      this.clients.add(ws);
      ws.on("close", () => this.clients.delete(ws));
    });
  }

  /** Broadcast a typed message to all connected clients. */
  broadcast(msg: WsMessage): void {
    const data = JSON.stringify(msg);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }
}
