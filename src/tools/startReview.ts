import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { v4 as uuidv4 } from "uuid";
import { StartReviewInputSchema, StartReviewInput, TaskType, TaskStatus } from "../types.js";
import { createTask, getTask } from "../services/database.js";
import { runReviewGeneration } from "../services/taskRunner.js";

export function registerStartReviewTool(server: McpServer): void {
  server.registerTool(
    "blog_start_review",
    {
      title: "Start Blog Review",
      description: `블로그 글 검수를 시작합니다 (백그라운드 실행).

기존 작업 ID를 사용하거나 직접 초안을 입력할 수 있습니다.

검수 초점 옵션:
- accuracy: 기술적 정확성
- readability: 가독성
- seo: SEO 최적화
- all: 전체 검수 (기본값)

Args:
  - task_id: 기존 작업 ID (선택)
  - draft: 직접 입력할 초안 내용 (선택)
  - focus: 검수 초점 (기본: all)
  - custom_prompt: 추가 검수 요청 사항
  - gemini_api_key: Gemini API 키 (필수)

Returns:
  - task_id: 검수 작업 ID
  - status: "pending"
  - message: 안내 메시지

완료 시 알림이 전송됩니다.`,
      inputSchema: StartReviewInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params: StartReviewInput) => {
      try {
        let draft: string;

        // 기존 작업에서 draft 가져오기 또는 직접 입력 사용
        if (params.task_id) {
          const existingTask = await getTask(params.task_id);
          if (!existingTask) {
            return {
              content: [{
                type: "text" as const,
                text: `Error: 작업을 찾을 수 없습니다: ${params.task_id}`
              }],
              isError: true
            };
          }
          if (!existingTask.result?.draft) {
            return {
              content: [{
                type: "text" as const,
                text: "Error: 해당 작업에서 초안을 찾을 수 없습니다."
              }],
              isError: true
            };
          }
          draft = existingTask.result.draft;
        } else if (params.draft) {
          draft = params.draft;
        } else {
          return {
            content: [{
              type: "text" as const,
              text: "Error: task_id 또는 draft 중 하나는 필수입니다."
            }],
            isError: true
          };
        }

        const taskId = uuidv4();

        // 검수 작업 생성
        await createTask(taskId, TaskType.REVIEW, {
          source_task_id: params.task_id,
          draft,
          focus: params.focus,
          custom_prompt: params.custom_prompt
        });

        // 백그라운드에서 실행
        runReviewGeneration(
          taskId,
          draft,
          params.focus,
          params.custom_prompt,
          params.gemini_api_key
        ).catch(console.error);

        const output = {
          task_id: taskId,
          status: TaskStatus.PENDING,
          message: "블로그 검수가 시작되었습니다. blog_get_status로 진행 상황을 확인하세요."
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
