import { SocketClient } from "./SocketClient";

let client: SocketClient | null = null;

export function getSocketClient(url: string) {
  if (!client) {
    client = new SocketClient({ url });
    client.connect();
  }
  return client;
}
