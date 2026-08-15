/* ===================================================================
   index.js — starts the server.

   Run it with:   node server/index.js
   =================================================================== */

import { createServer } from "node:http";
import { openDatabase, DATA_DIR, STORAGE_IS_PERSISTENT } from "./db/client.js";
import { purgeExpiredSessions } from "./services/auth.js";
import { ensureTodayBrain } from "./services/beast-brain.js";
import { createApp } from "./app.js";

const PORT = Number(process.env.PORT) || 8899;

console.log("Astronomy site — starting up");

const db = openDatabase();
console.log(`  database ready  (${DATA_DIR})`);

if (!STORAGE_IS_PERSISTENT) {
  console.log(`
  ⚠  EPHEMERAL STORAGE
     No ASTRO_DATA_DIR is set, so on a hosting container this data
     directory will NOT survive a restart/redeploy — accounts would be
     wiped. Fine for local use; a real deploy needs a mounted disk.
`);
}

const purged = purgeExpiredSessions(db);
if (purged > 0) console.log(`  cleared ${purged} expired session(s)`);

ensureTodayBrain(db).catch(err => {
  console.error("  Beast daily learning failed:", err.message);
});

const server = createServer(createApp(db));

const HOST = process.env.HOST || "0.0.0.0";

server.listen(PORT, HOST, () => {
  console.log(`
  Running at  http://localhost:${PORT}

  http://localhost:${PORT}/               the site
  http://localhost:${PORT}/api/health     is everything alive?
  http://localhost:${PORT}/api/auth/me    am I signed in?
  http://localhost:${PORT}/account.html   sign in / create an account
  http://localhost:${PORT}/beast.html     chat with Beast

  Press Ctrl+C to stop.
`);
});

function shutdown(signal) {
  console.log(`\n  ${signal} received — shutting down…`);

  server.close(() => {
    db.close();
    console.log("  database closed. Bye.");
    process.exitCode = 0;
  });

  setTimeout(() => {
    console.log("  took too long — forcing exit.");
    process.exit(1);
  }, 8000).unref();
}

process.on("SIGINT",  () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
