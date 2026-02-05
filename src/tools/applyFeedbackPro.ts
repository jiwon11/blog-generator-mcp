import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApplyFeedbackProInputSchema, ApplyFeedbackProInput, TaskStatus, TaskType } from "../types.js";
import { getTask, addFeedbackToHistory } from "../services/database.js";
import { runProFeedbackApplication } from "../services/taskRunner.js";

export function registerApplyFeedbackProTool(server: McpServer): void {
  server.registerTool(
    "blog_apply_feedback_pro",
    {
      title: "Apply Feedback (Pro Mode)",
      description: `Pro Mode: Claude Opus 4.5로 피드백을 반영합니다 (백그라운드 실행).

blog_start_draft_pro로 생성된 초안에만 사용할 수 있습니다.

Args:
  - task_id: 피드백을 적용할 Pro 작업 ID
  - feedback: 수정 요청 사항
  - anthropic_api_key: Anthropic API 키 (필수)

Returns:
  - task_id: 작업 ID
  - status: "pending"
  - message: 안내 메시지`,
      inputSchema: ApplyFeedbackProInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params: ApplyFeedbackProInput) => {
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

        if (task.type !== TaskType.DRAFT_PRO) {
          return {
            content: [{
              type: "text" as const,
              text: `Error: Pro Mode 작업에만 이 도구를 사용할 수 있습니다. 일반 초안 피드백은 blog_apply_feedback을 사용하세요.`
            }],
            isError: true
          };
        }

        if (task.status !== TaskStatus.COMPLETED) {
          return {
            content: [{
              type: "text" as const,
              text: `Error: 완료된 작업에만 피드백을 적용할 수 있습니다. 현재 상태: ${task.status}`
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

        // 피드백 히스토리에 추가
        await addFeedbackToHistory(params.task_id, params.feedback);

        // 백그라운드에서 Claude로 피드백 반영
        runProFeedbackApplication(
          params.task_id,
          params.feedback,
          params.anthropic_api_key
        ).catch(console.error);

        const output = {
          task_id: params.task_id,
          status: TaskStatus.PENDING,
          mode: "pro",
          message: "Pro Mode 피드백 반영이 시작되었습니다. (Claude Opus 4.5) blog_get_status로 진행 상황을 확인하세요."
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
