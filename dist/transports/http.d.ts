import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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
export declare function runHttpTransport(server: McpServer, port: number): Promise<void>;
//# sourceMappingURL=http.d.ts.map