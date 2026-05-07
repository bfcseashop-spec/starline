/**
 * PM2 process definitions — always cwd = repo root so:
 * - `backend/dist/src/main.js` (tsc mirrors `src/`) resolves shared `node_modules`
 * - `uploads/` and other paths keyed off process.cwd() match StorageController
 */
const path = require("path");

const ROOT = path.resolve(__dirname);

module.exports = {
  apps: [
    {
      name: "starline",
      cwd: ROOT,
      script: path.join(ROOT, "node_modules", "serve", "build", "main.js"),
      args: ["-s", "dist", "-l", "5174"],
      interpreter: "node",
      autorestart: true,
      max_restarts: 30,
      min_uptime: "5s",
    },
    {
      name: "starline-api",
      cwd: ROOT,
      script: path.join(ROOT, "backend", "dist", "src", "main.js"),
      interpreter: "node",
      autorestart: true,
      max_restarts: 25,
      min_uptime: "10s",
    },
  ],
};
