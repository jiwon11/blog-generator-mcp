import { v4 as uuidv4 } from "uuid";
import { StartDraftInputSchema, TaskType, TaskStatus } from "../types.js";
import { createTask } from "../services/database.js";
import { runDraftGeneration } from "../services/taskRunner.js";
export function registerStartDraftTool(server) {
    server.registerTool("blog_start_draft", {
        title: "Start Blog Draft Generation",
        description: `블로그 초안 생성을 시작합니다 (백그라운드 실행).

다양한 입력 유형을 지원합니다:
- keyword: 키워드/주제로 글 생성
- code: 코드 스니펫을 설명하는 글 생성
- memo: 메모/노트를 완성된 글로 확장
- git_push: git 변경사항으로 개발일지 생성

스타일 옵션: tutorial, til, deep-dive, troubleshooting

Args:
  - input_type: 입력 유형
  - content: 블로그 글 생성에 사용할 입력 내용
  - style: 글 스타일 (기본: tutorial)
  - language: 출력 언어 ko/en (기본: ko)
  - custom_prompt: 사용자 추가 요청 사항
  - gemini_api_key: Gemini API 키 (필수)

Returns:
  - task_id: 작업 추적용 ID
  - status: "pending"
  - message: 안내 메시지

완료 시 알림이 전송됩니다. blog_get_status로 진행 상황을 확인하세요.`,
        inputSchema: StartDraftInputSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true
        }
    }, async (params) => {
        try {
            const taskId = uuidv4();
            // 작업 생성
            await createTask(taskId, TaskType.DRAFT, {
                input_type: params.input_type,
                content: params.content,
                style: params.style,
                language: params.language,
                custom_prompt: params.custom_prompt
            });
            // 백그라운드에서 실행 (await 하지 않음)
            runDraftGeneration(taskId, params.input_type, params.content, params.style, params.language, params.custom_prompt, params.gemini_api_key).catch(console.error);
            const output = {
                task_id: taskId,
                status: TaskStatus.PENDING,
                message: "블로그 초안 생성이 시작되었습니다. blog_get_status로 진행 상황을 확인하세요."
            };
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify(output, null, 2)
                    }],
                structuredContent: output
            };
        }
        catch (error) {
            return {
                content: [{
                        type: "text",
                        text: `Error: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
                    }],
                isError: true
            };
        }
    });
}
//# sourceMappingURL=startDraft.js.map