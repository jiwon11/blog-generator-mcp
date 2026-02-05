import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetStatusInputSchema, GetStatusInput, GetStatusOutput, GetStatusOutputSchema } from "../types.js";
import { getTask } from "../services/database.js";

export function registerGetStatusTool(server: McpServer): void {
  server.registerTool(
    "blog_get_status",
    {
      title: "Get Task Status",
      description: `작업 상태를 조회합니다.

Args:
  - task_id: 조회할 작업 ID

Returns:
  - task_id: 작업 ID
  - status: pending | in_progress | completed | failed
  - progress: 진행률 (0-100)
  - result: 완료 시 결과 (draft, metadata 등)
  - error: 실패 시 오류 메시지`,
      inputSchema: GetStatusInputSchema,
      outputSchema: GetStatusOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: GetStatusInput) => {
      try {
        const task = await getTask(params.task_id);

        if (!task) {
          return {
            content: [{
              type: "text" as const,
              text: `Error: 작업을 찾을 수 없습니다: ${params.task_id}`
            }],
            isError: true
          };
        }

        const output: GetStatusOutput = {
          task_id: task.id,
          status: task.status,
          progress: task.progress
        };

        if (task.result) {
          output.result = task.result;
        }

        if (task.error) {
          output.error = task.error;
        }

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(output, null, 2)
          }],
          structuredContent: output
        };
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
          }],
          isError: true
        };
      }
    }
  );
}
