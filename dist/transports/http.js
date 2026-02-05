import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
export async function runHttpTransport(server, port) {
    const app = express();
    app.use(express.json());
    // Health check endpoint
    app.get("/health", (_req, res) => {
        res.json({ status: "ok", version: "2.0.0" });
    });
    // MCP endpoint
    app.post("/mcp", async (req, res) => {
        try {
            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
                enableJsonResponse: true
            });
            res.on("close", () => transport.close());
            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
        }
        catch (error) {
            console.error("MCP request error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });
    // Handle other HTTP methods for /mcp
    app.all("/mcp", (_req, res) => {
        res.status(405).json({ error: "Method not allowed. Use POST." });
    });
    app.listen(port, () => {
        console.error(`Blog Generator MCP Server running on http://localhost:${port}/mcp`);
        console.error(`Health check: http://localhost:${port}/health`);
    });
}
//# sourceMappingURL=http.js.map