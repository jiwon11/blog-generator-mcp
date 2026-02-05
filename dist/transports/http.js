import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
/**
 * HTTP 전송 모드
 *
 * 설계 결정: Stateless JSON 모드 사용
 * - sessionIdGenerator: undefined → 세션 없이 각 요청을 독립적으로 처리
 * - enableJsonResponse: true → 스트리밍 대신 단일 JSON 응답 반환
 *
 * 이유:
 * 1. 확장성: 세션 상태를 유지하지 않아 수평 확장이 용이
 * 2. 단순성: 세션 관리 로직 불필요
 * 3. 신뢰성: 요청 간 상태 공유로 인한 버그 방지
 *
 * 작업 상태는 SQLite 데이터베이스로 별도 관리하므로 세션 불필요
 */
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