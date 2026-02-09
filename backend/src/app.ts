import { Hono } from "hono";
import { ZodError } from "zod";
import { DFlowNetworkError } from "./lib/dflow-client.js";
import { agentsRoutes } from "./routes/agents.js";
import { categoriesRoutes } from "./routes/categories.js";
import { eventsRoutes } from "./routes/events.js";
import { marketsRoutes } from "./routes/markets.js";
import { seriesRoutes } from "./routes/series.js";
import { sportsRoutes } from "./routes/sports.js";
import { searchRoutes } from "./routes/search.js";
import { tradingRoutes } from "./routes/trading.js";
import { leaderboardRoutes } from "./routes/leaderboard.js";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

app.route("/agents", agentsRoutes);
app.route("/categories", categoriesRoutes);
app.route("/events", eventsRoutes);
app.route("/series", seriesRoutes);
app.route("/sports", sportsRoutes);
app.route("/markets", marketsRoutes);
app.route("/search", searchRoutes);
app.route("/trading", tradingRoutes);
app.route("/leaderboard", leaderboardRoutes);

app.onError((err, c) => {
  if (err instanceof ZodError) {
    const first = err.errors[0];
    const message = first ? `${first.path.join(".") || "body"}: ${first.message}` : "Validation failed";
    return c.json({ error: message }, 400);
  }
  if (err instanceof DFlowNetworkError) {
    return c.json({ error: err.message }, 502);
  }
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

export { app };
