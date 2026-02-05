import { ReviewPostInputSchema, ReviewFocus } from "../types.js";
function getReviewPrompt(draft, focus) {
    const focusInstructions = {
        [ReviewFocus.ACCURACY]: `
기술적 정확성에 집중하여 검토해주세요:
- 기술적 오류나 잘못된 설명 수정
- 코드 예제의 정확성 확인
- 최신 버전/방식 반영
- 잘못된 용어 수정`,
        [ReviewFocus.READABILITY]: `
가독성에 집중하여 검토해주세요:
- 문장 구조 개선
- 단락 구분 최적화
- 복잡한 설명 단순화
- 흐름과 연결성 개선`,
        [ReviewFocus.SEO]: `
SEO 최적화에 집중하여 검토해주세요:
- 제목과 부제목 최적화
- 키워드 자연스럽게 포함
- 메타 설명용 요약 추가
- 내부 링크 제안`,
        [ReviewFocus.ALL]: `
전체적으로 검토해주세요:
- 기술적 정확성
- 가독성과 흐름
- SEO 최적화
- 문법 및 오타 수정`
    };
    return `당신은 기술 블로그 편집자입니다. 아래 블로그 초안을 검토하고 개선해주세요.

${focusInstructions[focus]}

원본 초안:
${draft}

응답 형식:
1. 먼저 개선된 전체 글을 마크다운 형식으로 제공
2. 마지막에 변경 사항 목록을 다음 형식으로 제공:

---CHANGES---
- 변경사항 1
- 변경사항 2
- 변경사항 3
---END---`;
}
function parseReviewResponse(response) {
    const changesMatch = response.match(/---CHANGES---\s*([\s\S]*?)\s*---END---/);
    let changes = [];
    let improved = response;
    if (changesMatch) {
        // Extract changes
        changes = changesMatch[1]
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.startsWith("-"))
            .map(line => line.substring(1).trim());
        // Remove changes section from improved content
        improved = response.replace(/---CHANGES---[\s\S]*?---END---/, "").trim();
    }
    return { improved, changes };
}
export function registerReviewPostTool(server) {
    server.registerTool("blog_review_post", {
        title: "Review Blog Post",
        description: `블로그 초안을 검수하고 개선합니다.

이 도구는 Claude가 직접 검토를 수행합니다. 초안의 품질을 높이기 위해:
- 기술적 정확성 검증
- 가독성 향상
- SEO 최적화
- 문법 및 오타 수정

Args:
  - draft (string): 검수할 블로그 초안 (마크다운 형식)
  - focus (string): 검수 초점 - accuracy, readability, seo, all (기본: all)

Returns:
  {
    "improved": string,    // 개선된 블로그 글
    "changes": string[]    // 변경 사항 목록
  }

Example:
  draft="# React Hooks\\n...", focus="accuracy"`,
        inputSchema: ReviewPostInputSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false
        }
    }, async (params) => {
        try {
            const focus = (params.focus || ReviewFocus.ALL);
            // Generate review prompt for Claude to process
            const reviewPrompt = getReviewPrompt(params.draft, focus);
            // Since this tool is called within Claude's context,
            // we return the prompt and let Claude do the actual review
            // This is a pattern where the MCP tool prepares the context
            // and Claude (the LLM calling this tool) performs the review
            const output = {
                reviewPrompt,
                instructions: "Claude가 위 프롬프트를 사용하여 초안을 검토해주세요. " +
                    "검토 후 improved와 changes 필드로 결과를 반환합니다."
            };
            return {
                content: [{
                        type: "text",
                        text: `검토 요청이 준비되었습니다.

**검토 초점**: ${focus}

**원본 초안**:
${params.draft}

---

위 초안을 검토하고 다음을 수행해주세요:
1. 개선된 글 작성
2. 변경 사항 목록 정리

Claude가 직접 검토를 수행합니다.`
                    }]
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
//# sourceMappingURL=reviewPost.js.map