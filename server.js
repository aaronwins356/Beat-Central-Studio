const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// ---- Load sites config ----
const sitesConfigPath = path.join(__dirname, "../config/sites.json");
let sites = [];

function loadSites() {
  try {
    const raw = fs.readFileSync(sitesConfigPath, "utf8");
    sites = JSON.parse(raw);
    console.log("Loaded sites config:", sites);
  } catch (err) {
    console.error("Failed to load sites config:", err);
    sites = [];
  }
}

loadSites();

// ---- Simple logging middleware ----
const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const accessLogPath = path.join(logDir, "access.log");

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const line = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms host=${req.headers.host || ""}\n`;
    fs.appendFile(accessLogPath, line, (err) => {
      if (err) console.error("Failed to write log:", err);
    });
  });
  next();
});

// ---- Admin dashboard ----

// Simple guard: log that /admin is being accessed
app.use("/admin", (req, res, next) => {
  console.log("Admin access from", req.ip, "host", req.headers.host);
  next();
});

// Admin HTML UI
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// API: list sites
app.get("/api/sites", (req, res) => {
  res.json({
    sites,
    message: "Configured sites",
  });
});

// API: tail logs
app.get("/api/logs", (req, res) => {
  const lines = parseInt(req.query.lines || "100", 10);
  fs.readFile(accessLogPath, "utf8", (err, data) => {
    if (err) {
      return res.json({ error: "No logs yet or cannot read log file." });
    }
    const allLines = data.split(/\r?\n/);
    const tail = allLines.slice(-Math.abs(lines));
    res.json({ lines: tail });
  });
});

// API: reload config
app.post("/api/reload", express.json(), (req, res) => {
  loadSites();
  res.json({ ok: true, sites });
});

// ---- Multi-site static serving by host ----
app.use((req, res, next) => {
  const hostHeader = (req.headers.host || "").split(":")[0].toLowerCase();
  const site = sites.find(s => (s.domain || "").toLowerCase() === hostHeader);

  if (!site) {
    return next();
  }

  const rootPath = path.resolve(__dirname, site.root);
  express.static(rootPath)(req, res, next);
});

// Fallback root (optional)
app.get("/", (req, res) => {
  res.redirect("/admin");
});

app.listen(PORT, () => {
  console.log(`Self-host server listening on http://localhost:${PORT}`);
});