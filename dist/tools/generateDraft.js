import { GenerateDraftInputSchema, BlogStyle, Language } from "../types.js";
import { generateBlogDraft } from "../services/gemini.js";
export function registerGenerateDraftTool(server) {
    server.registerTool("blog_generate_draft", {
        title: "Generate Blog Draft",
        description: `Gemini AI를 사용하여 블로그 초안을 생성합니다.

다양한 입력 유형을 지원합니다:
- keyword: 키워드/주제로 글 생성
- code: 코드 스니펫을 설명하는 글 생성
- memo: 메모/노트를 완성된 글로 확장
- git_push: git 변경사항으로 개발일지 생성

스타일 옵션:
- tutorial: 단계별 튜토리얼
- til: Today I Learned 형식
- deep-dive: 심층 기술 분석
- troubleshooting: 문제 해결 과정

Args:
  - input_type (string): 입력 유형 (keyword, code, memo, git_push)
  - content (string): 블로그 글 생성에 사용할 입력 내용
  - style (string): 글 스타일 (기본: tutorial)
  - language (string): 출력 언어 ko/en (기본: ko)

Returns:
  {
    "draft": string,           // 마크다운 형식의 블로그 초안
    "metadata": {
      "title": string,         // 글 제목
      "tags": string[],        // 태그 목록
      "estimatedReadTime": string  // 예상 읽기 시간
    }
  }

Examples:
  - "React hooks 사용법" -> input_type="keyword", content="React hooks 사용법"
  - 코드 설명 -> input_type="code", content="<your code>"
  - 개발일지 -> input_type="git_push", content="<git diff output>"`,
        inputSchema: GenerateDraftInputSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true
        }
    }, async (params) => {
        try {
            const result = await generateBlogDraft(params.input_type, params.content, (params.style || BlogStyle.TUTORIAL), (params.language || Language.KO));
            const output = {
                draft: result.draft,
                metadata: result.metadata
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
//# sourceMappingURL=generateDraft.js.map