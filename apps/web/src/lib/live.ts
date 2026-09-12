import { io, type Socket } from 'socket.io-client';
let socket: Socket | undefined;

/** One connection carries the matchday board and the current detailed match. */
export function getLiveSocket(): Socket {
  socket ??= io({ path: '/socket.io', withCredentials: true, autoConnect: false });
  return socket;
}
