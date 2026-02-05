import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FinalizeDraftInputSchema, FinalizeDraftInput, TaskStatus, FinalizeOutput, FinalizeOutputSchema } from "../types.js";
import { getTask } from "../services/database.js";

export function registerFinalizeDraftTool(server: McpServer): void {
  server.registerTool(
    "blog_finalize_draft",
    {
      title: "Finalize Blog Draft",
      description: `블로그 초안을 확정합니다.

완료된 작업의 최종 결과를 반환합니다.
이후 blog_save 또는 blog_deploy_github로 저장/배포할 수 있습니다.

Args:
  - task_id: 확정할 작업 ID

Returns:
  - draft: 최종 확정된 초안
  - metadata: { title, tags, estimatedReadTime }
  - message: 안내 메시지`,
      inputSchema: FinalizeDraftInputSchema,
      outputSchema: FinalizeOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: FinalizeDraftInput) => {
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

        if (task.status !== TaskStatus.COMPLETED) {
          return {
            content: [{
              type: "text" as const,
              text: `Error: 완료된 작업만 확정할 수 있습니다. 현재 상태: ${task.status}`
            }],
            isError: true
          };
        }

        if (!task.result?.draft) {
          return {
            content: [{
              type: "text" as const,
              text: "Error: 초안을 찾을 수 없습니다."
            }],
            isError: true
          };
        }

        const output: FinalizeOutput = {
          draft: task.result.draft,
          metadata: task.result.metadata || {
            title: "제목 없음",
            tags: [],
            estimatedReadTime: "5분"
          },
          message: "초안이 확정되었습니다. blog_save 또는 blog_deploy_github로 저장/배포하세요."
        };

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
