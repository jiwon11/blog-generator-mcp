import { v4 as uuidv4 } from "uuid";
import { StartReviewInputSchema, TaskType, TaskStatus, GeminiModel } from "../types.js";
import { createTask, getTask } from "../services/database.js";
import { runReviewGeneration } from "../services/taskRunner.js";
import { mergeInstructions } from "../services/instructions.js";
export function registerStartReviewTool(server) {
    server.registerTool("blog_start_review", {
        title: "Start Blog Review",
        description: `블로그 글 검수를 시작합니다 (백그라운드 실행).

기존 작업 ID를 사용하거나 직접 초안을 입력할 수 있습니다.

## 검수 초점 (focus)
- accuracy: 기술적 정확성
- readability: 가독성
- seo: SEO 최적화
- all: 전체 검수 (기본값)

## 모델 선택 (model)
- gemini-1.5-flash: 빠른 검수 (기본값)
- gemini-1.5-pro: 심층 검수

## 상세 검수 지침 (instructions / instructions_file)
검수 기준을 상세히 지정할 수 있습니다:
- 회사/팀 스타일 가이드
- 용어 사용 규칙
- 코드 컨벤션
- 타겟 독자 수준
- 금지 표현
등을 명시하면 해당 기준으로 검수합니다.

instructions_file로 마크다운 파일 경로를 지정하면 파일에서 지침을 읽어옵니다.
둘 다 제공하면 파일 내용 + 파라미터 내용이 병합됩니다.

Args:
  - task_id: 기존 작업 ID (선택)
  - draft: 직접 입력할 초안 내용 (선택)
  - focus: 검수 초점 (기본: all)
  - model: Gemini 모델 (기본: gemini-1.5-flash)
  - instructions: 상세 검수 지침 (선택)
  - instructions_file: 상세 검수 지침 마크다운 파일 경로 (선택)
  - custom_prompt: 간단한 추가 검수 요청 (선택)
  - gemini_api_key: Gemini API 키 (필수)

Returns:
  - task_id: 검수 작업 ID
  - status: "pending"
  - message: 안내 메시지`,
        inputSchema: StartReviewInputSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true
        }
    }, async (params) => {
        try {
            let draft;
            const model = params.model || GeminiModel.FLASH;
            // 기존 작업에서 draft 가져오기 또는 직접 입력 사용
            if (params.task_id) {
                const existingTask = await getTask(params.task_id);
                if (!existingTask) {
                    return {
                        content: [{
                                type: "text",
                                text: `Error: 작업을 찾을 수 없습니다: ${params.task_id}`
                            }],
                        isError: true
                    };
                }
                if (!existingTask.result?.draft) {
                    return {
                        content: [{
                                type: "text",
                                text: "Error: 해당 작업에서 초안을 찾을 수 없습니다."
                            }],
                        isError: true
                    };
                }
                draft = existingTask.result.draft;
            }
            else if (params.draft) {
                draft = params.draft;
            }
            else {
                return {
                    content: [{
                            type: "text",
                            text: "Error: task_id 또는 draft 중 하나는 필수입니다."
                        }],
                    isError: true
                };
            }
            const taskId = uuidv4();
            // instructions 병합 (파일 + 파라미터)
            const mergedInstructions = await mergeInstructions(params.instructions_file, params.instructions);
            // 검수 작업 생성
            await createTask(taskId, TaskType.REVIEW, {
                source_task_id: params.task_id,
                draft,
                focus: params.focus,
                model,
                instructions: mergedInstructions,
                custom_prompt: params.custom_prompt
            });
            // 백그라운드에서 실행
            runReviewGeneration(taskId, draft, params.focus, model, mergedInstructions, params.custom_prompt, params.gemini_api_key).catch(console.error);
            const output = {
                task_id: taskId,
                status: TaskStatus.PENDING,
                model,
                message: `블로그 검수가 시작되었습니다. (모델: ${model}) blog_get_status로 진행 상황을 확인하세요.`
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
//# sourceMappingURL=startReview.js.map