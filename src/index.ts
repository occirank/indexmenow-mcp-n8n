// index.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { configureServer } from "./tools.js";
import { storeApiKey, getApiKey, deleteApiKey } from "./sessionStore.js";

// Setup Express
const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// Enable Cors
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", (_req, res) => res.sendStatus(200));

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === "/messages") return next();
  express.json()(req, res, next);
});

// Create MCP server
const server = new McpServer({ name: "IndexMeNow MCP", version: "1.0.0" });
configureServer(server);

// Track active transports
const transports: Record<string, SSEServerTransport> = {};

// SSE endpoint
app.get("/sse", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers["authorization"];
    let apiKey: string | null = null;
    
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      apiKey = authHeader.slice("Bearer ".length).trim();
    }
    
    if (!apiKey) {
      return res.status(400).send("Missing Authorization Header");
    }

    const transport = new SSEServerTransport("/messages", res);
    transports[transport.sessionId] = transport;

    // Store API key in Redis
    await storeApiKey(transport.sessionId, apiKey);

    res.on("close", async () => {
      delete transports[transport.sessionId];
      await deleteApiKey(transport.sessionId);
    });

    server.connect(transport);
  } catch (error) {
    console.error("Error setting up SSE connection:", error);
    res.sendStatus(500);
  }
});

// Raw message endpoint
app.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId;
  if (typeof sessionId !== "string") return res.status(400).send("Invalid sessionId");

  const transport = transports[sessionId];
  if (!transport) return res.status(400).send("No transport found for sessionId");

  try {
    transport.handlePostMessage(req, res);
  } catch (err) {
    console.error("handlePostMessage error:", err);
    res.status(500).send("Internal server error");
  }
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).send({ status: "ok", server: "IndexMeNow MCP Server", version: "1.0.0" });
});

// Start server
app.listen(PORT, () => {
  console.log(`IndexMeNow MCP Server running on http://localhost:${PORT}`);
  console.log(`Connect to /sse for SSE transport`);
});
