import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { v4 as uuidv4 } from "uuid";
import { StartDraftInputSchema, StartDraftInput, TaskType, TaskStatus, GeminiModel } from "../types.js";
import { createTask } from "../services/database.js";
import { runDraftGeneration } from "../services/taskRunner.js";
import { mergeInstructions } from "../services/instructions.js";
import { getGeminiApiKey } from "../services/env.js";

export function registerStartDraftTool(server: McpServer): void {
  server.registerTool(
    "blog_start_draft",
    {
      title: "Start Blog Draft Generation",
      description: `블로그 초안 생성을 시작합니다 (백그라운드 실행).

## 입력 유형 (input_type)
- keyword: 키워드/주제로 글 생성
- code: 코드 스니펫을 설명하는 글 생성
- memo: 메모/노트를 완성된 글로 확장
- git_push: git 변경사항으로 개발일지 생성

## 글 스타일 (style)
- tutorial: 단계별 튜토리얼 (기본값)
- til: Today I Learned 형식
- deep-dive: 심층 기술 분석
- troubleshooting: 문제 해결 과정

## 모델 선택 (model)
- gemini-1.5-flash: 빠른 응답, 일반 용도 (기본값)
- gemini-1.5-flash-8b: 더 빠른 응답, 간단한 작업
- gemini-1.5-pro: 고품질, 복잡한 작업
- gemini-2.0-flash: 최신 모델

## 상세 지침 (instructions / instructions_file)
skill.md 스타일로 상세한 작성 지침을 제공할 수 있습니다:
- 글의 톤과 문체
- 반드시 포함할 섹션
- 타겟 독자층
- 예시 스타일 참조
- 금지 표현
- 코드 스타일 가이드
등을 상세히 기술하면 모델이 지침을 따릅니다.

instructions_file로 마크다운 파일 경로를 지정하면 파일에서 지침을 읽어옵니다.
둘 다 제공하면 파일 내용 + 파라미터 내용이 병합됩니다.

Args:
  - input_type: 입력 유형
  - content: 블로그 글 생성에 사용할 입력 내용
  - style: 글 스타일 (기본: tutorial)
  - language: 출력 언어 ko/en (기본: ko)
  - model: Gemini 모델 (기본: gemini-1.5-flash)
  - instructions: 상세 작성 지침 (선택)
  - instructions_file: 상세 작성 지침 마크다운 파일 경로 (선택)
  - custom_prompt: 간단한 추가 요청 (선택)
  - gemini_api_key: Gemini API 키 (없으면 GEMINI_API_KEY 환경변수 사용)

Returns:
  - task_id: 작업 추적용 ID
  - status: "pending"
  - message: 안내 메시지`,
      inputSchema: StartDraftInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params: StartDraftInput) => {
      try {
        const taskId = uuidv4();
        const model = params.model || GeminiModel.FLASH;
        const apiKey = getGeminiApiKey(params.gemini_api_key);

        // instructions 병합 (파일 + 파라미터)
        const mergedInstructions = await mergeInstructions(
          params.instructions_file,
          params.instructions
        );

        // 작업 생성
        await createTask(taskId, TaskType.DRAFT, {
          input_type: params.input_type,
          content: params.content,
          style: params.style,
          language: params.language,
          model,
          instructions: mergedInstructions,
          custom_prompt: params.custom_prompt
        });

        // 백그라운드에서 실행 (await 하지 않음)
        runDraftGeneration(
          taskId,
          params.input_type,
          params.content,
          params.style,
          params.language,
          model,
          mergedInstructions,
          params.custom_prompt,
          apiKey
        ).catch(console.error);

        const output = {
          task_id: taskId,
          status: TaskStatus.PENDING,
          model,
          message: `블로그 초안 생성이 시작되었습니다. (모델: ${model}) blog_get_status로 진행 상황을 확인하세요.`
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
