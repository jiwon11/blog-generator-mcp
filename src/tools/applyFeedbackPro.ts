import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApplyFeedbackProInputSchema, ApplyFeedbackProInput, TaskType, TaskStatus, StartDraftProOutputSchema } from "../types.js";
import { getTask, addFeedbackToHistory } from "../services/database.js";
import { runProFeedbackApplication } from "../services/taskRunner.js";
import { getAnthropicApiKey } from "../services/env.js";

export function registerApplyFeedbackProTool(server: McpServer): void {
  server.registerTool(
    "blog_apply_feedback_pro",
    {
      title: "Apply Feedback to Pro Draft",
      description: `[HTTP 모드 전용] Pro Mode로 생성된 블로그 초안에 피드백을 반영합니다.

⚠️ Claude Desktop/Code 사용자:
이 도구는 HTTP 모드에서만 필요합니다.
Claude Desktop/Code 환경에서는 Claude에게 직접 수정을 요청하세요.

Args:
  - task_id: Pro 작업 ID (필수)
  - feedback: 수정 요청 사항 (필수)
  - anthropic_api_key: Anthropic API 키 (환경변수로 대체 가능)

Returns:
  - task_id: 작업 ID
  - status: 작업 상태`,
      inputSchema: ApplyFeedbackProInputSchema,
      outputSchema: StartDraftProOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params: ApplyFeedbackProInput) => {
      try {
        const anthropicApiKey = getAnthropicApiKey(params.anthropic_api_key);

        // 기존 작업 확인
        const task = await getTask(params.task_id);
        if (!task) {
          throw new Error(`작업을 찾을 수 없습니다: ${params.task_id}`);
        }

        if (task.type !== TaskType.DRAFT_PRO) {
          throw new Error("이 도구는 Pro Mode 작업에만 사용할 수 있습니다. 일반 작업은 blog_apply_feedback을 사용하세요.");
        }

        if (task.status !== TaskStatus.COMPLETED) {
          throw new Error(`작업이 완료되지 않았습니다. 현재 상태: ${task.status}`);
        }

        // 피드백 기록
        await addFeedbackToHistory(params.task_id, params.feedback);

        // 백그라운드에서 피드백 반영
        runProFeedbackApplication(
          params.task_id,
          params.feedback,
          anthropicApiKey
        ).catch(err => console.error("Pro feedback application error:", err));

        const output = {
          task_id: params.task_id,
          status: TaskStatus.IN_PROGRESS,
          message: "Pro Mode 피드백 반영이 시작되었습니다. blog_get_status로 진행 상황을 확인하세요."
        };

        return {
          content: [{
            type: "text" as const,
            text: `Pro Mode 피드백 반영 시작됨\n\nTask ID: ${params.task_id}\n피드백: ${params.feedback}\n\n⏳ Claude가 피드백을 반영 중입니다...\nblog_get_status로 진행 상황을 확인하세요.`
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
