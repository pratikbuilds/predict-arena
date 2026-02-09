import "dotenv/config";
import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { env } from "./config.js";

const port = env.PORT;

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, (info) => {
  console.log(`Server listening on http://0.0.0.0:${info.port} (PORT=${port})`);
});
