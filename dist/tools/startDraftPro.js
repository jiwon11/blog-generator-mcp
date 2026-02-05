import { v4 as uuidv4 } from "uuid";
import { StartDraftProInputSchema, TaskType, TaskStatus } from "../types.js";
import { createTask } from "../services/database.js";
import { runProDraftGeneration } from "../services/taskRunner.js";
import { mergeInstructions } from "../services/instructions.js";
import { getGeminiApiKey, getAnthropicApiKey } from "../services/env.js";
export function registerStartDraftProTool(server) {
    server.registerTool("blog_start_draft_pro", {
        title: "Start Pro Mode Blog Draft",
        description: `Pro Mode: Gemini(분석) + Claude(작성) 파이프라인으로 고품질 블로그 생성.

## 작동 방식
1. Gemini 3 Pro가 코드와 개발 로그를 분석 (Researcher)
2. Claude Opus 4.5가 분석 결과로 마스터피스급 글 작성 (Writer)

## 입력 파라미터
- code_diff: Git diff 또는 변경된 코드 (필수)
- dev_log: 개발자의 고민/메모/의사결정 과정 (선택)
- request: 최우선 제약조건 - 이 요청을 최우선으로 반영 (선택)
- style: 글 스타일 (기본: deep-dive)
- language: 출력 언어 (기본: ko)
- instructions: 상세 작성 지침 (선택)
- instructions_file: 상세 작성 지침 마크다운 파일 경로 (선택, 병합 지원)
- gemini_api_key: Gemini API 키 (없으면 GEMINI_API_KEY 환경변수 사용)
- anthropic_api_key: Anthropic API 키 (없으면 ANTHROPIC_API_KEY 환경변수 사용)

## 워크플로우
1. blog_start_draft_pro → 초안 생성
2. blog_get_status → 완료 확인
3. blog_apply_feedback_pro → (선택) Claude로 피드백 반영
4. blog_start_review → (선택) Gemini로 교차 검토
5. blog_save → 파일 저장

Returns:
  - task_id: 작업 추적용 ID
  - status: "pending"
  - message: 안내 메시지`,
        inputSchema: StartDraftProInputSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true
        }
    }, async (params) => {
        try {
            const taskId = uuidv4();
            const geminiApiKey = getGeminiApiKey(params.gemini_api_key);
            const anthropicApiKey = getAnthropicApiKey(params.anthropic_api_key);
            // instructions 병합 (파일 + 파라미터)
            const mergedInstructions = await mergeInstructions(params.instructions_file, params.instructions);
            // 작업 생성
            await createTask(taskId, TaskType.DRAFT_PRO, {
                code_diff: params.code_diff,
                dev_log: params.dev_log,
                request: params.request,
                style: params.style,
                language: params.language,
                instructions: mergedInstructions
            });
            // 백그라운드에서 Pro Mode 실행
            runProDraftGeneration(taskId, params.code_diff, params.dev_log, params.request, params.style, params.language, mergedInstructions, geminiApiKey, anthropicApiKey).catch(console.error);
            const output = {
                task_id: taskId,
                status: TaskStatus.PENDING,
                mode: "pro",
                message: "Pro Mode 블로그 생성이 시작되었습니다. (Gemini 분석 → Claude 작성) blog_get_status로 진행 상황을 확인하세요."
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
//# sourceMappingURL=startDraftPro.js.map