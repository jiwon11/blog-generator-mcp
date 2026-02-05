import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApplyFeedbackInputSchema, ApplyFeedbackInput, TaskStatus, GeminiModel } from "../types.js";
import { getTask, addFeedbackToHistory } from "../services/database.js";
import { runFeedbackApplication } from "../services/taskRunner.js";
import { getGeminiApiKey } from "../services/env.js";

export function registerApplyFeedbackTool(server: McpServer): void {
  server.registerTool(
    "blog_apply_feedback",
    {
      title: "Apply Feedback to Draft",
      description: `사용자 피드백을 초안에 반영합니다 (백그라운드 실행).

피드백 히스토리가 저장되어 이전 피드백들을 추적할 수 있습니다.

## 모델 선택 (model)
- gemini-1.5-flash: 빠른 응답 (기본값)
- gemini-1.5-pro: 고품질 피드백 반영

Args:
  - task_id: 피드백을 적용할 작업 ID
  - feedback: 수정 요청 사항
  - model: Gemini 모델 (기본: gemini-1.5-flash)
  - gemini_api_key: Gemini API 키 (없으면 GEMINI_API_KEY 환경변수 사용)

Returns:
  - task_id: 작업 ID
  - status: "pending"
  - message: 안내 메시지`,
      inputSchema: ApplyFeedbackInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params: ApplyFeedbackInput) => {
      try {
        const task = await getTask(params.task_id);
        const model = params.model || GeminiModel.FLASH;
        const apiKey = getGeminiApiKey(params.gemini_api_key);

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

        // 백그라운드에서 피드백 반영
        runFeedbackApplication(
          params.task_id,
          params.feedback,
          model,
          apiKey
        ).catch(console.error);

        const output = {
          task_id: params.task_id,
          status: TaskStatus.PENDING,
          model,
          message: `피드백 반영이 시작되었습니다. (모델: ${model}) blog_get_status로 진행 상황을 확인하세요.`
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
