import { serve, type Server } from "bun";
import pkg from "../package.json";
import indexHTML from "./index.html";
// import favicon from "favicon.ico" with { type: "file" };

const inDev = () => process.env.NODE_ENV === "development";
const DEFAULT_PORT = pkg.serverConfig.port;

const parsePort = (value: string): number | null => {
  const trimmed = value.trim();

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > 65535) {
    return null;
  }

  return parsed;
};

const resolveServerPort = () => {
  const envPort = process.env.PORT;

  if (envPort === undefined) {
    return DEFAULT_PORT;
  }

  const parsedPort = parsePort(envPort);

  if (parsedPort !== null) {
    return parsedPort;
  }

  console.warn(
    `Ignoring invalid PORT value ${JSON.stringify(envPort)}. Falling back to ${DEFAULT_PORT}.`,
  );

  return DEFAULT_PORT;
};

// const staticRoutes: Record<string, Blob> = {};
// for (const blob of embeddedFiles) {
//   console.log((blob as FileBlob).name);
//   staticRoutes[`/${(blob as FileBlob).name}`] = blob;
// }

export type WebSocketData = {
  channelId: string | null;
  username: string | null;
  action?: string;
  value?: number;
};

export type IndexProps = {
  request: Request;
  server: Server<WebSocketData>;
  config: Record<string, string | number | boolean>;
};

process.on("SIGINT", () => {
  console.log("Ctrl-C was pressed");
  process.exit();
});
process.on("exit", (code) => {
  console.log(`Process is exiting with code ${code}`);
});

(async () => {
  const port = resolveServerPort();
  const server = serve<WebSocketData>({
    ...{
      development: inDev(),
      // static: {
      //   "/favicon.ico": "",
      // },
      tls: {
        cert: Bun.file("src/cert.pem"),
        key: Bun.file("src/key.pem"),
      },
      routes: {
        "/": indexHTML,
        "/demo": indexHTML,
        "/render/*": indexHTML,
        "/api/hello": {
          GET: () => Response.json({ ok: "List posts" }),
          PUT: async (req: any) => {
            console.log(req);
            return Response.json({ created: true, body: req.header });
          },
        },
      },
      websocket: {
        perMessageDeflate: true,
        data: {} as WebSocketData,
        message(ws, message) {
          server.publish(
            "the-group-chat",
            `${ws.data.username}:   ${ws.data.action}: ${ws.data.value} ${message}`,
          );
          console.log(ws.subscriptions);
        },
        open(ws) {
          const msg = `${ws.data.username} has entered the chat`;
          ws.subscribe("the-group-chat");
          server.publish("the-group-chat", msg);

          console.log("OPEN", msg);
        },
        close(ws, code, message) {
          const msg = `${ws.data.username} has left the chat`;
          ws.unsubscribe("the-group-chat");
          server.publish("the-group-chat", msg);
        },
        drain(ws) {
          ws.send("DRAIN !!!!");
        },
      },
    },
    ...pkg.serverConfig,
    port,
  });

  console.log(`${pkg.name} server running at https://localhost:${server.port}`);
})();
