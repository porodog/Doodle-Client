import { io } from "socket.io-client";


// export const socket = io("http://localhost:4000");

export const socket = io("doodle-production.up.railway.app", {
  transports: ["websocket"]
});
