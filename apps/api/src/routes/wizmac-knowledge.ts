// WIZMAC Knowledge Core — Structured Registry API
// Phase 1: Vision, Products, Domains, Architecture, Identity, Operations,
//           Planning, Incidents, Regional, Documentation
// RALD Institutional Memory — admin.rald.cloud | LILCKY STUDIO LIMITED

import { Hono } from "hono";
import type { Env } from "../lib/db.ts";
import { verifyToken } from "../lib/auth.ts";

const knowledge = new Hono<{ Bindings: Env }>();

// ── Middleware: require auth ──────────────────────────────────────────────────
async function requireAuth(c: any, next: any) {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Unauthorized" }, 401);
  const user = await verifyToken(token, c.env);
  if (!user) return c.json({ error: "Invalid token" }, 401);
  c.set("user", user);
  await next();
}

// ── Init table (idempotent) ───────────────────────────────────────────────────
async function ensureTable(db: D1Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS wizmac_registry (
      id TEXT PRIMARY KEY,
      registry TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      priority INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_wizmac_reg ON wizmac_registry(registry);
    CREATE INDEX IF NOT EXISTS idx_wizmac_status ON wizmac_registry(status);
  `);
}

function nanoid() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  const arr = new Uint8Array(21);
  crypto.getRandomValues(arr);
  arr.forEach(b => id += chars[b % chars.length]);
  return id;
}

// ── GET /api/admin/knowledge/migrate ─────────────────────────────────────────
knowledge.get("/api/admin/knowledge/migrate", requireAuth, async (c) => {
  await ensureTable(c.env.DB);
  return c.json({ ok: true, message: "wizmac_registry table ready" });
});

// ── GET /api/admin/knowledge/seed ────────────────────────────────────────────
knowledge.post("/api/admin/knowledge/seed", requireAuth, async (c) => {
  await ensureTable(c.env.DB);
  const db = c.env.DB;

  const seeds = [
    // ── VISION REGISTRY ──────────────────────────────────────────────────────
    { id: nanoid(), registry: "vision", priority: 10, title: "RALD Mission Statement",
      content: JSON.stringify({
        text: "RALD exists to build the digital infrastructure of African communities — starting with identity, voice, and connection. We are building a platform where every African can participate in civic life, entertainment, commerce, and communication using tools built for their context: voice-first, low-bandwidth, mobile-first, and community-rooted.",
        category: "mission", type: "statement"
      })
    },
    { id: nanoid(), registry: "vision", priority: 9, title: "African First",
      content: JSON.stringify({ text: "Every design decision, infrastructure choice, and product feature is evaluated through an African-first lens. If it doesn't work in Lagos, Nairobi, or Accra, it doesn't ship.", category: "principle", type: "design_principle" })
    },
    { id: nanoid(), registry: "vision", priority: 9, title: "Voice First",
      content: JSON.stringify({ text: "Voice is the primary interface. Text is secondary. Our products must be operable by someone who cannot read or write.", category: "principle", type: "design_principle" })
    },
    { id: nanoid(), registry: "vision", priority: 9, title: "Relationship First",
      content: JSON.stringify({ text: "Community, trust, and real relationships are the foundation. We build for groups, not individuals. Products that isolate people fail RALD's mission.", category: "principle", type: "design_principle" })
    },
    { id: nanoid(), registry: "vision", priority: 9, title: "Mobile First",
      content: JSON.stringify({ text: "Desktop is a luxury. Mobile is the primary device. Every interface is designed for a 6-inch touchscreen on 3G.", category: "principle", type: "design_principle" })
    },
    { id: nanoid(), registry: "vision", priority: 9, title: "Low Bandwidth First",
      content: JSON.stringify({ text: "Features must work on 2G. Data costs money. Every kilobyte is a decision. Lazy loading, compression, and offline-first design are mandatory.", category: "principle", type: "design_principle" })
    },
    { id: nanoid(), registry: "vision", priority: 9, title: "Community First",
      content: JSON.stringify({ text: "Products are built for communities, not users. A user is a member of a group. A group is a community. A community is RALD's customer.", category: "principle", type: "design_principle" })
    },
    { id: nanoid(), registry: "vision", priority: 9, title: "Simplicity Before Complexity",
      content: JSON.stringify({ text: "If a 60-year-old market trader in Onitsha cannot use it in 30 seconds, it is too complex. Complexity is a failure mode, not a feature.", category: "principle", type: "design_principle" })
    },
    // ── PRODUCT REGISTRY ─────────────────────────────────────────────────────
    { id: nanoid(), registry: "products", priority: 10, title: "Profiles",
      content: JSON.stringify({ purpose: "Universal RALD identity hub. One account, one identity for the entire ecosystem.", status: "production", owner: "Platform Team", domain: "profiles.rald.cloud", phase: "Production — Phase G.12", dependencies: ["rald-auth-core"], app_id: "profiles", description: "The canonical identity provider for RALD. Every user authenticates here. All products trust Profiles as the source of identity truth." })
    },
    { id: nanoid(), registry: "products", priority: 10, title: "Loop",
      content: JSON.stringify({ purpose: "Voice-first civic, community, and entertainment participation platform.", status: "production", owner: "Loop Team", domain: "loop.rald.cloud", phase: "Production", dependencies: ["Profiles", "Auth", "Messenger", "loop-api"], app_id: "loop", description: "RALD's flagship community platform. Rooms, live audio, civic engagement, trending content." })
    },
    { id: nanoid(), registry: "products", priority: 9, title: "Messenger",
      content: JSON.stringify({ purpose: "Real-time community messaging platform optimized for African mobile networks.", status: "production", owner: "Messenger Team", domain: "messenger.rald.cloud", phase: "Production", dependencies: ["Profiles", "Auth", "rald-realtime"], app_id: "messenger", description: "RALD's messaging product. Chats, groups, voice messages, file sharing." })
    },
    { id: nanoid(), registry: "products", priority: 8, title: "WIZMAC",
      content: JSON.stringify({ purpose: "Operational brain and knowledge core of the RALD ecosystem.", status: "production", owner: "Platform Team", domain: "admin.rald.cloud", phase: "Phase 1 — Knowledge Core", dependencies: ["rald-control-center-api"], app_id: "wizmac", description: "The institutional memory of RALD. Every decision, product, service, incident, and plan is recorded here. Future AI will learn exclusively from WIZMAC data." })
    },
    { id: nanoid(), registry: "products", priority: 7, title: "PayRald",
      content: JSON.stringify({ purpose: "African-first payments and financial infrastructure.", status: "planned", owner: "TBD", domain: "pay.rald.cloud", phase: "Future — Not Started", dependencies: ["Profiles", "Auth"], app_id: "payrald", description: "RALD's payment layer. Mobile money, wallet, peer-to-peer transfers optimized for African payment systems." })
    },
    { id: nanoid(), registry: "products", priority: 6, title: "GitRald",
      content: JSON.stringify({ purpose: "African developer infrastructure and code hosting.", status: "planned", owner: "TBD", domain: "git.rald.cloud", phase: "Future — Not Started", dependencies: ["Profiles", "Auth"], app_id: "gitrald", description: "Code hosting, collaboration, and CI/CD for African developers." })
    },
    { id: nanoid(), registry: "products", priority: 5, title: "RALD TV",
      content: JSON.stringify({ purpose: "Streaming and live video for African communities.", status: "planned", owner: "TBD", domain: "tv.rald.cloud", phase: "Future — Not Started", dependencies: ["Profiles", "Auth", "Loop"], app_id: "rald-tv", description: "Community video, live streams, African-produced content." })
    },
    // ── DOMAIN REGISTRY ──────────────────────────────────────────────────────
    { id: nanoid(), registry: "domains", priority: 10, title: "auth.rald.cloud",
      content: JSON.stringify({ product: "rald-auth-core", environment: "production", status: "active", owner: "Platform Team", purpose: "RALD Identity API — OTP, SSO, sessions, JWT issuance", health_endpoint: "https://auth.rald.cloud/health", redirects: [], notes: "Cloudflare Worker. JWT secret shared with all RALD services." })
    },
    { id: nanoid(), registry: "domains", priority: 10, title: "profiles.rald.cloud",
      content: JSON.stringify({ product: "rald-auth-ui", environment: "production", status: "active", owner: "Platform Team", purpose: "RALD Identity UI — login, registration, profile management, app launcher", health_endpoint: "https://profiles.rald.cloud/", redirects: [], notes: "Cloudflare Pages. React SPA. Serves as the visual face of RALD Identity." })
    },
    { id: nanoid(), registry: "domains", priority: 9, title: "loop.rald.cloud",
      content: JSON.stringify({ product: "loop", environment: "production", status: "active", owner: "Loop Team", purpose: "Loop community platform frontend", health_endpoint: "https://loop.rald.cloud/", redirects: [], notes: "Cloudflare Pages. React SPA with Vite." })
    },
    { id: nanoid(), registry: "domains", priority: 9, title: "loop-api.rald.cloud",
      content: JSON.stringify({ product: "loop", environment: "production", status: "active", owner: "Loop Team", purpose: "Loop API — rooms, auth, trending, RALD SSO bridge", health_endpoint: "https://loop-api.rald.cloud/api/health", redirects: [], notes: "Cloudflare Worker. Hono framework. Has RALD SSO bridge at /api/auth/rald-sso." })
    },
    { id: nanoid(), registry: "domains", priority: 9, title: "messenger.rald.cloud",
      content: JSON.stringify({ product: "messenger", environment: "production", status: "active", owner: "Messenger Team", purpose: "Messenger frontend", health_endpoint: "https://messenger.rald.cloud/", redirects: [], notes: "Cloudflare Pages. Returns 401 without auth token. Does NOT implement RALD SSO token pickup." })
    },
    { id: nanoid(), registry: "domains", priority: 8, title: "admin.rald.cloud",
      content: JSON.stringify({ product: "rald-control-center", environment: "production", status: "active", owner: "Platform Team", purpose: "WIZMAC — RALD operational brain and knowledge core", health_endpoint: "https://admin.rald.cloud/", redirects: [], notes: "Cloudflare Pages + Worker. Admin authentication required." })
    },
    // ── ARCHITECTURE REGISTRY ────────────────────────────────────────────────
    { id: nanoid(), registry: "architecture", priority: 10, title: "RALD Service Dependency Map",
      content: JSON.stringify({
        type: "dependency_map",
        description: "Critical service dependencies across the RALD ecosystem. Failure of auth.rald.cloud breaks all products.",
        critical_path: ["auth.rald.cloud → All products (JWT validation)"],
        layers: {
          identity: ["rald-auth-core (auth.rald.cloud)", "rald-auth-ui (profiles.rald.cloud)"],
          community: ["loop (loop.rald.cloud)", "messenger (messenger.rald.cloud)"],
          platform: ["rald-notify (notification.rald.cloud)", "rald-search (search.rald.cloud)", "rald-inbox (inbox.rald.cloud)", "rald-realtime (realtime.rald.cloud)"],
          control: ["rald-control-center (admin.rald.cloud)"]
        },
        runtime: "Cloudflare Workers + Pages",
        database: "Supabase (PostgreSQL) + Cloudflare D1 + Cloudflare KV",
        notes: "All services use RALD_JWT_SECRET for token validation. Changing this secret invalidates all active sessions."
      })
    },
    { id: nanoid(), registry: "architecture", priority: 9, title: "JWT Architecture",
      content: JSON.stringify({
        type: "auth_architecture",
        algorithm: "HS256",
        issuer: "auth.rald.cloud",
        master_token_ttl: "86400s (24h) for login, 300s for handoff",
        app_token_ttl: "3600s (1h) for SSO exchange",
        storage: "localStorage — domain-isolated",
        shared_secret: "RALD_JWT_SECRET — shared across all services",
        critical_flaw: "No cross-domain cookie. SSO requires explicit redirect flow. Silent SSO not implemented.",
        token_keys: {
          profiles: "rald_token",
          loop: "loop_token + rald_master_token",
          messenger: "messenger_rald_token"
        }
      })
    },
    { id: nanoid(), registry: "architecture", priority: 9, title: "Cloudflare Architecture",
      content: JSON.stringify({
        type: "infrastructure",
        workers: ["rald-auth-core", "loop-api", "rald-notify", "rald-search", "rald-inbox", "rald-realtime", "rald-control-center-api"],
        pages: ["rald-auth-ui (profiles.rald.cloud)", "loop (loop.rald.cloud)", "messenger (messenger.rald.cloud)", "rald-control-center (admin.rald.cloud)"],
        kv_namespaces: ["RATE_LIMIT_KV", "RALD_SESSION_KV", "CACHE"],
        d1_databases: ["rald-control-center DB"],
        durable_objects: ["RoomSession (loop)"],
        r2_buckets: ["MEDIA (loop)"],
        queues: ["TASK_QUEUE (loop)"]
      })
    },
    // ── IDENTITY REGISTRY ────────────────────────────────────────────────────
    { id: nanoid(), registry: "identity", priority: 10, title: "RALD Identity Rules",
      content: JSON.stringify({
        rule: "One Account. One Identity. One Login. Many Products.",
        principles: [
          "A user authenticates ONCE on profiles.rald.cloud",
          "That session must propagate to all RALD products silently",
          "No product should ask for OTP if the user has an active RALD session",
          "A RALD account is the user — not a loop account or a messenger account",
          "Product-specific tokens are derived from the RALD master token, not issued independently"
        ],
        current_status: "PARTIALLY IMPLEMENTED — SSO infrastructure exists but silent propagation is missing",
        audit_reference: "SSO_SESSION_AUDIT_2026_06_04"
      })
    },
    { id: nanoid(), registry: "identity", priority: 9, title: "SSO Architecture",
      content: JSON.stringify({
        endpoints: {
          "POST /sso/exchange": "Exchange master JWT for app-scoped token (1h TTL). Requires Bearer auth.",
          "POST /sso/handoff": "Generate 5-min handoff token + redirect URL. For browser-based SSO.",
          "POST /sso/verify": "Verify any RALD token — for inter-service validation.",
          "GET /session": "Ecosystem session validator — checks KV suspension, returns user payload.",
          "GET /sso/apps": "List all registered ecosystem apps."
        },
        missing: [
          "GET /sso/silent — read .rald.cloud cookie and issue app token (NOT YET BUILT)",
          "Set-Cookie on login with domain=.rald.cloud (NOT YET BUILT)"
        ],
        audit_reference: "SSO_SESSION_AUDIT_2026_06_04"
      })
    },
    // ── INCIDENT REGISTRY ────────────────────────────────────────────────────
    { id: nanoid(), registry: "incidents", priority: 10, title: "SSO_SESSION_AUDIT_2026_06_04",
      content: JSON.stringify({
        incident_id: "SSO_SESSION_AUDIT_2026_06_04",
        severity: "P1",
        status: "ROOT_CAUSE_IDENTIFIED",
        title: "Authenticated users must re-authenticate on each RALD product",
        impact: "100% of users — every product transition requires a new OTP",
        root_cause: "RALD master token stored in localStorage (domain-isolated). No cross-domain cookie. No silent SSO check on product startup.",
        evidence: {
          auth_login_response: "c.json({ token, user }) — no Set-Cookie header",
          token_storage: "localStorage.setItem('rald_token', t) — profiles.rald.cloud only",
          messenger_startup: "useGetMe() → 401 → /auth (no RALD session check)",
          loop_startup: "rald_token check in URL only — not automatic on cold start",
          production_confirmed: "curl -sI auth.rald.cloud/health — no Set-Cookie in response"
        },
        resolution_required: [
          "1. Add Set-Cookie with domain=.rald.cloud to all login responses in rald-auth-core",
          "2. Add GET /sso/silent endpoint to auth.rald.cloud",
          "3. Add silent SSO check to loop, messenger, and all future products on startup",
          "4. Add ?rald_token= handler to Messenger (Loop already has this)"
        ],
        lessons: [
          "localStorage is domain-isolated — cannot be used for cross-product sessions",
          "CORS allow-credentials=true is not enough — a cookie must actually be set",
          "Each product independently building auth leads to N separate login experiences",
          "Identity infrastructure must be centralized before products launch, not after"
        ],
        fix_status: "NOT YET IMPLEMENTED — no code changes made (audit only)",
        verified: false,
        created_at: "2026-06-04"
      })
    },
    // ── OPERATIONS REGISTRY ──────────────────────────────────────────────────
    { id: nanoid(), registry: "operations", priority: 9, title: "CI/CD Status",
      content: JSON.stringify({
        type: "ci_status",
        note: "All 9 repos green as of 2026-06-04",
        repos: [
          { name: "rald-auth-core", ci: "green", node: "22" },
          { name: "rald-auth-ui", ci: "green", node: "22" },
          { name: "loop", ci: "green", node: "22" },
          { name: "messenger", ci: "green", node: "22" },
          { name: "rald-notify", ci: "green", node: "22" },
          { name: "rald-search", ci: "green", node: "22" },
          { name: "rald-inbox", ci: "green", node: "22" },
          { name: "rald-realtime", ci: "green", node: "22" },
          { name: "rald-control-center", ci: "green", node: "22" }
        ]
      })
    },
    { id: nanoid(), registry: "operations", priority: 8, title: "Fail-Fast 503 Coverage",
      content: JSON.stringify({
        type: "deployment_policy",
        policy: "All workers fail fast with HTTP 503 if required secrets are absent on startup",
        covered: ["rald-auth-core", "rald-notify", "rald-search", "rald-inbox", "rald-realtime", "loop-api"],
        pending: ["messenger — not yet implemented"],
        implementation: "Check all required env vars at top of fetch handler, return 503 with missing list if any absent"
      })
    },
    // ── WEEKLY PLANNING REGISTRY ─────────────────────────────────────────────
    { id: nanoid(), registry: "planning", priority: 10, title: "Week 2026-06-04 — SSO Sprint",
      content: JSON.stringify({
        week: "2026-06-04",
        p0: [
          "Implement cookie-based SSO (domain=.rald.cloud) in rald-auth-core",
          "Add GET /sso/silent endpoint",
          "Add silent SSO startup check to Loop and Messenger",
          "Add ?rald_token= handler to Messenger"
        ],
        p1: [
          "Build WIZMAC Knowledge Core Phase 1 (10 registries)",
          "Add messenger fail-fast 503",
          "Verify production SSO end-to-end"
        ],
        p2: [
          "Document all RALD API contracts",
          "Build RALD TV planning spec",
          "PayRald architecture draft"
        ],
        focus: "SSO fix is P0. Nothing ships until a user can login once and access all products.",
        updated: "2026-06-04"
      })
    },
    // ── REGIONAL EXPANSION REGISTRY ──────────────────────────────────────────
    { id: nanoid(), registry: "regional", priority: 10, title: "Nigeria",
      content: JSON.stringify({
        country: "Nigeria", flag: "🇳🇬", status: "ACTIVE — Primary Market",
        languages: ["Yoruba", "Igbo", "Hausa", "Pidgin", "English"],
        launch_status: "Live — profiles, loop, messenger",
        partnerships: [], community_growth: "Primary focus",
        campus_growth: "University campuses — Lagos, Ibadan, Abuja, Port Harcourt, Enugu",
        notes: "Nigeria is RALD's home market. All product decisions are validated here first."
      })
    },
    { id: nanoid(), registry: "regional", priority: 8, title: "Ghana",
      content: JSON.stringify({
        country: "Ghana", flag: "🇬🇭", status: "PLANNED — Next Market",
        languages: ["Twi", "Ga", "Ewe", "Dagbani", "English"],
        launch_status: "Not yet launched",
        partnerships: [], community_growth: "Planned",
        campus_growth: "University of Ghana, KNUST", notes: ""
      })
    },
    { id: nanoid(), registry: "regional", priority: 8, title: "Kenya",
      content: JSON.stringify({
        country: "Kenya", flag: "🇰🇪", status: "PLANNED — East Africa Anchor",
        languages: ["Swahili", "English", "Kikuyu"],
        launch_status: "Not yet launched",
        partnerships: [], community_growth: "Planned",
        campus_growth: "University of Nairobi, Strathmore", notes: ""
      })
    },
    { id: nanoid(), registry: "regional", priority: 7, title: "South Africa",
      content: JSON.stringify({
        country: "South Africa", flag: "🇿🇦", status: "FUTURE",
        languages: ["Zulu", "Xhosa", "Afrikaans", "English", "Sotho"],
        launch_status: "Not yet launched",
        partnerships: [], community_growth: "Future",
        campus_growth: "UCT, Wits, Stellenbosch", notes: ""
      })
    },
    // ── DOCUMENTATION REGISTRY ───────────────────────────────────────────────
    { id: nanoid(), registry: "documentation", priority: 10, title: "RALD API Contract",
      content: JSON.stringify({
        type: "api_contract",
        base_url: "https://auth.rald.cloud",
        version: "2.1.0",
        authentication: "Bearer JWT",
        key_endpoints: {
          "POST /auth/login": "Email + password → { token, user }",
          "POST /auth/send-otp": "Phone → { pinId }",
          "POST /auth/verify-otp": "pinId + pin → { token, user } or { newUser: true }",
          "GET /auth/me": "Bearer → user profile",
          "POST /sso/exchange": "Bearer + { appId } → { token, appId, expiresIn }",
          "POST /sso/handoff": "Bearer + { appId, redirect_to } → { handoff_token, redirect_to }",
          "GET /session": "Bearer → { valid, user } or { valid: false, redirect }",
          "GET /sso/apps": "→ { apps[], ecosystem }"
        },
        notes: "All tokens are HS256 JWTs. RALD_JWT_SECRET is shared. No public key infrastructure."
      })
    },
    { id: nanoid(), registry: "documentation", priority: 9, title: "Engineer Onboarding",
      content: JSON.stringify({
        type: "onboarding",
        overview: "RALD is a multi-product ecosystem built on Cloudflare Workers + Pages, Supabase, and Hono. Every product is a separate Cloudflare deployment.",
        getting_started: [
          "1. Clone the relevant repo from Ostinato-Loop GitHub org",
          "2. Copy .env.example to .env and fill in secrets",
          "3. pnpm install",
          "4. pnpm dev (for local development)",
          "5. Read WIZMAC Knowledge Core for ecosystem context"
        ],
        key_concepts: [
          "RALD_JWT_SECRET — shared secret for JWT signing/verification across ALL services",
          "auth.rald.cloud — the identity hub, all auth goes through here",
          "profiles.rald.cloud — the visual identity UI",
          "Supabase — postgres DB, row-level security, realtime",
          "Cloudflare D1 — SQLite for control center",
          "Cloudflare KV — rate limiting and session management"
        ],
        never_do: [
          "Never issue JWTs with a different secret than RALD_JWT_SECRET",
          "Never build product-specific auth that bypasses profiles.rald.cloud",
          "Never deploy without fail-fast 503 on missing secrets",
          "Never use words like Fixed/Completed/Resolved/Done without production evidence"
        ]
      })
    }
  ];

  let inserted = 0;
  let skipped = 0;

  for (const seed of seeds) {
    try {
      const exists = await db.prepare(
        "SELECT id FROM wizmac_registry WHERE registry = ? AND title = ? LIMIT 1"
      ).bind(seed.registry, seed.title).first();

      if (!exists) {
        await db.prepare(`
          INSERT INTO wizmac_registry (id, registry, title, content, status, priority, tags, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'active', ?, '[]', datetime('now'), datetime('now'))
        `).bind(seed.id, seed.registry, seed.title, seed.content, seed.priority).run();
        inserted++;
      } else {
        skipped++;
      }
    } catch (e) {
      console.error("Seed error:", seed.title, String(e));
    }
  }

  return c.json({ ok: true, inserted, skipped, total: seeds.length });
});

// ── GET /api/admin/knowledge/:registry — list entries ────────────────────────
knowledge.get("/api/admin/knowledge/:registry", requireAuth, async (c) => {
  const registry = c.req.param("registry");
  await ensureTable(c.env.DB);
  const { results } = await c.env.DB.prepare(
    "SELECT id, registry, title, content, status, priority, tags, created_at, updated_at FROM wizmac_registry WHERE registry = ? ORDER BY priority DESC, created_at DESC"
  ).bind(registry).all();

  const entries = (results || []).map((r: any) => ({
    ...r,
    content: (() => { try { return JSON.parse(r.content); } catch { return r.content; } })(),
    tags: (() => { try { return JSON.parse(r.tags); } catch { return []; } })(),
  }));

  return c.json({ registry, entries, count: entries.length });
});

// ── GET /api/admin/knowledge/all — all registries summary ────────────────────
knowledge.get("/api/admin/knowledge", requireAuth, async (c) => {
  await ensureTable(c.env.DB);
  const { results } = await c.env.DB.prepare(
    "SELECT registry, COUNT(*) as count FROM wizmac_registry WHERE status != 'deleted' GROUP BY registry"
  ).all();
  const counts: Record<string, number> = {};
  (results || []).forEach((r: any) => { counts[r.registry] = Number(r.count); });
  return c.json({ registries: counts, total: Object.values(counts).reduce((a, b) => a + b, 0) });
});

// ── POST /api/admin/knowledge/:registry — create entry ───────────────────────
knowledge.post("/api/admin/knowledge/:registry", requireAuth, async (c) => {
  const registry = c.req.param("registry");
  const body = await c.req.json<{
    title: string; content: unknown; priority?: number; tags?: string[]; status?: string;
  }>().catch(() => null);
  if (!body?.title || body.content === undefined) {
    return c.json({ error: "title and content are required" }, 400);
  }
  await ensureTable(c.env.DB);
  const id = nanoid();
  await c.env.DB.prepare(`
    INSERT INTO wizmac_registry (id, registry, title, content, status, priority, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    id, registry, body.title.trim(),
    typeof body.content === 'string' ? body.content : JSON.stringify(body.content),
    body.status ?? 'active',
    body.priority ?? 0,
    JSON.stringify(body.tags ?? [])
  ).run();
  return c.json({ ok: true, id, registry }, 201);
});

// ── PATCH /api/admin/knowledge/:registry/:id — update entry ──────────────────
knowledge.patch("/api/admin/knowledge/:registry/:id", requireAuth, async (c) => {
  const { registry, id } = c.req.param();
  const body = await c.req.json<{
    title?: string; content?: unknown; priority?: number; tags?: string[]; status?: string;
  }>().catch(() => null);
  if (!body) return c.json({ error: "Invalid body" }, 400);

  const fields: string[] = [];
  const values: unknown[] = [];
  if (body.title !== undefined) { fields.push("title = ?"); values.push(body.title); }
  if (body.content !== undefined) { fields.push("content = ?"); values.push(typeof body.content === 'string' ? body.content : JSON.stringify(body.content)); }
  if (body.priority !== undefined) { fields.push("priority = ?"); values.push(body.priority); }
  if (body.tags !== undefined) { fields.push("tags = ?"); values.push(JSON.stringify(body.tags)); }
  if (body.status !== undefined) { fields.push("status = ?"); values.push(body.status); }
  if (fields.length === 0) return c.json({ error: "No fields to update" }, 400);
  fields.push("updated_at = datetime('now')");
  values.push(registry, id);

  await c.env.DB.prepare(
    `UPDATE wizmac_registry SET ${fields.join(", ")} WHERE registry = ? AND id = ?`
  ).bind(...values).run();
  return c.json({ ok: true });
});

// ── DELETE /api/admin/knowledge/:registry/:id — soft delete ──────────────────
knowledge.delete("/api/admin/knowledge/:registry/:id", requireAuth, async (c) => {
  const { registry, id } = c.req.param();
  await c.env.DB.prepare(
    "UPDATE wizmac_registry SET status = 'deleted', updated_at = datetime('now') WHERE registry = ? AND id = ?"
  ).bind(registry, id).run();
  return c.json({ ok: true });
});

export default knowledge;
