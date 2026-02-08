import { Hono } from "hono";
import { ZodError } from "zod";
import { agentsRoutes } from "./routes/agents.js";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

app.route("/agents", agentsRoutes);

app.onError((err, c) => {
  if (err instanceof ZodError) {
    const first = err.errors[0];
    const message = first ? `${first.path.join(".") || "body"}: ${first.message}` : "Validation failed";
    return c.json({ error: message }, 400);
  }
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

export { app };
