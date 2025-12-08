#!/usr/bin/env node
// cli.ts
// run index.js

import("./index.js").catch((err) => {
  console.error("Failed to start IndexMeNow MCP Server:", err);
  process.exit(1);
});