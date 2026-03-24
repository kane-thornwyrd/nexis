import { serve } from "bun";
import pkg from "../package.json";
import indexHTML from "./index.html";
import { createAppRoutes } from "@/infrastructure/http/app-routes";
import { resolveServerPort } from "@/infrastructure/http/server-port";
import {
  createGroupChatWebsocket,
  type GroupChatSocketData,
} from "@/infrastructure/realtime/group-chat";
// import favicon from "favicon.ico" with { type: "file" };

const inDev = () => process.env.NODE_ENV === "development";

// const staticRoutes: Record<string, Blob> = {};
// for (const blob of embeddedFiles) {
//   console.log((blob as FileBlob).name);
//   staticRoutes[`/${(blob as FileBlob).name}`] = blob;
// }

process.on("SIGINT", () => {
  console.log("Ctrl-C was pressed");
  process.exit();
});
process.on("exit", (code) => {
  console.log(`Process is exiting with code ${code}`);
});

(async () => {
  const port = resolveServerPort();
  let publishServer:
    | { publish: (channel: string, message: string) => void }
    | undefined;
  const server = serve<GroupChatSocketData>({
    development: inDev(),
    // static: {
    //   "/favicon.ico": "",
    // },
    tls: {
      cert: Bun.file("src/cert.pem"),
      key: Bun.file("src/key.pem"),
    },
    routes: createAppRoutes(indexHTML),
    websocket: createGroupChatWebsocket(() => {
      if (!publishServer) {
        throw new Error("WebSocket publisher is not ready yet.");
      }

      return publishServer;
    }),
    ...pkg.serverConfig,
    port,
  });
  publishServer = server;

  console.log(`${pkg.name} server running at https://localhost:${server.port}`);
})();
