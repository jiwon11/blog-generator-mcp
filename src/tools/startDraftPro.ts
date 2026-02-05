import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { v4 as uuidv4 } from "uuid";
import { StartDraftProInputSchema, StartDraftProInput, TaskType, TaskStatus, StartDraftProOutputSchema } from "../types.js";
import { createTask } from "../services/database.js";
import { runProDraftGeneration } from "../services/taskRunner.js";
import { getAnthropicApiKey } from "../services/env.js";
import { mergeInstructions } from "../services/instructions.js";

export function registerStartDraftProTool(server: McpServer): void {
  server.registerTool(
    "blog_start_draft_pro",
    {
      title: "Start Pro Blog Draft Generation",
      description: `[HTTP 모드 전용] Claude Opus(분석 + 작성) 파이프라인으로 고품질 블로그 생성을 시작합니다.

⚠️ Claude Desktop/Code 사용자:
이 도구는 HTTP 모드에서만 필요합니다.
Claude Desktop/Code 환경에서는 Claude에게 직접 "이 코드로 블로그 써줘"라고 요청하세요.
Claude가 직접 코드를 분석하고 블로그를 작성합니다.

## 작동 방식 (HTTP 모드)
1. Claude Opus가 코드를 분석하여 인사이트 추출
2. Claude Opus가 분석 결과를 바탕으로 블로그 작성
3. blog_get_status로 완료 확인

Args:
  - code_diff: Git diff 또는 변경된 코드 (필수)
  - dev_log: 개발자의 고민/메모/의사결정 과정 (선택)
  - request: 최우선 제약조건 (선택)
  - style: 글 스타일 (기본: deep-dive)
  - language: 언어 (기본: ko)
  - instructions: 상세 작성 지침 (선택)
  - instructions_file: 상세 작성 지침 마크다운 파일 경로 (선택, instructions와 병합 가능)
  - anthropic_api_key: Anthropic API 키 (환경변수로 대체 가능)

Returns:
  - task_id: 작업 추적용 ID
  - status: 작업 상태`,
      inputSchema: StartDraftProInputSchema,
      outputSchema: StartDraftProOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params: StartDraftProInput) => {
      try {
        const anthropicApiKey = getAnthropicApiKey(params.anthropic_api_key);

        const taskId = uuidv4();

        // instructions 병합 (파일 + 파라미터)
        const mergedInstructions = await mergeInstructions(
          params.instructions_file,
          params.instructions
        );

        // 작업 생성
        await createTask(taskId, TaskType.DRAFT_PRO, {
          code_diff: params.code_diff,
          dev_log: params.dev_log,
          request: params.request,
          style: params.style,
          language: params.language,
          instructions: mergedInstructions
        });

        // 백그라운드에서 생성 시작
        runProDraftGeneration(
          taskId,
          params.code_diff,
          params.dev_log,
          params.request,
          params.style,
          params.language,
          mergedInstructions,
          anthropicApiKey
        ).catch(err => console.error("Pro draft generation error:", err));

        const output = {
          task_id: taskId,
          status: TaskStatus.PENDING,
          message: "Pro Mode 블로그 생성이 시작되었습니다. blog_get_status로 진행 상황을 확인하세요."
        };

        return {
          content: [{
            type: "text" as const,
            text: `Pro Mode 블로그 생성 시작됨\n\nTask ID: ${taskId}\n\n⏳ Claude Opus가 코드를 분석 중입니다...\nblog_get_status로 진행 상황을 확인하세요.`
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
