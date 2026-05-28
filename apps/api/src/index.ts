import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Env } from "./lib/db.ts";

import auth from "./routes/auth.ts";
import github from "./routes/github.ts";
import aiProviders from "./routes/ai-providers.ts";
import aiRegistry from "./routes/ai-registry.ts";
import n8n from "./routes/n8n.ts";
import infra from "./routes/infrastructure.ts";
import langs from "./routes/languages.ts";
import audit from "./routes/audit.ts";
import dashboard from "./routes/dashboard.ts";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use("*", cors({
  origin: [
    "https://control.rald.cloud",
    "https://rald-control-center.pages.dev",
    "http://localhost:5173",
    "http://localhost:3000",
  ],
  allowHeaders: ["Authorization", "Content-Type"],
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
}));

app.get("/", c => c.json({ service: "RALD Control Center API", version: "2.0.0", db: "d1", status: "operational" }));
app.get("/health", c => c.json({ status: "ok", ts: new Date().toISOString() }));

app.route("/", auth);
app.route("/", github);
app.route("/", aiProviders);
app.route("/", aiRegistry);
app.route("/", n8n);
app.route("/", infra);
app.route("/", langs);
app.route("/", audit);
app.route("/", dashboard);

app.notFound(c => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error("[Worker Error]", err.message);
  return c.json({ error: "Internal server error", message: err.message }, 500);
});

export default app;
