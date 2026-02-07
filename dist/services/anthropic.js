/**
 * Anthropic Claude API 서비스
 * Pro Mode (HTTP 모드 전용)에서 블로그 작성에 사용
 */
import Anthropic from "@anthropic-ai/sdk";
import { BlogStyle, Language } from "../types.js";
const CLAUDE_MODEL = "claude-opus-4-6";
/**
 * Claude로 블로그 글 작성
 */
export async function writeBlogWithClaude(analysis, codeDiff, style, language, instructions, apiKey, webSearch = false) {
    const anthropic = new Anthropic({ apiKey });
    const styleNames = {
        [BlogStyle.TUTORIAL]: "Tutorial (튜토리얼)",
        [BlogStyle.TIL]: "TIL (Today I Learned)",
        [BlogStyle.DEEP_DIVE]: "Deep-dive (심층 분석)",
        [BlogStyle.TROUBLESHOOTING]: "Troubleshooting (문제 해결)"
    };
    const langGuide = language === Language.KO ? "한국어로 작성하세요." : "Write in English.";
    let systemPrompt = `당신은 뛰어난 기술 블로그 작가입니다.
코드 분석 인사이트를 바탕으로 매력적인 기술 블로그 글을 작성합니다.

글 스타일: ${styleNames[style]}
${langGuide}

${instructions ? `\n====== 상세 작성 지침 (반드시 따라야 함) ======\n${instructions}\n====== 지침 끝 ======\n\n위 지침에 포함된 글 유형별 구조, 톤, 분량, 시각 자료 가이드를 반드시 따르세요.` : ""}`;
    if (webSearch) {
        systemPrompt += `\n\n웹 검색 활용 지시:

1. **시각 자료 검색 및 삽입 (최우선)**
   - 관련 기술 블로그, 공식 문서에서 **아키텍처 다이어그램, 프로세스 플로우, 성능 비교 그래프** 등의 이미지를 검색하세요
   - 찾은 이미지는 \`![설명](이미지URL)\` 형식으로 본문의 적절한 위치에 삽입하세요
   - 이미지 바로 아래에 출처를 명시하세요 (예: *출처: [사이트명](URL)*)
   - 각 주요 섹션마다 최소 1개의 시각 자료(이미지 또는 다이어그램)를 포함하도록 노력하세요

2. **인라인 참조 링크**
   - 기술 용어, 개념, 라이브러리 언급 시 공식 문서 또는 권위 있는 블로그로 연결하세요
   - \`[용어](참조URL)\` 형식으로 본문 흐름에 자연스럽게 삽입하세요
   - 단순 나열이 아닌, 독자가 더 깊이 학습할 수 있는 맥락에서 제공하세요

3. **참고 자료 섹션 구성**
   글 말미에 참고 자료를 아래 분류로 정리하세요:
   - 📚 **공식 문서**: 프레임워크/라이브러리 공식 문서 링크
   - 📝 **기술 블로그**: 관련 기술 블로그 글 링크
   - 🎓 **튜토리얼·가이드**: 학습용 자료 링크
   - 📊 **성능 사례·벤치마크**: 성능 비교 자료 링크

4. **정확성**
   - 최신 버전 정보, 릴리스 날짜, 통계 수치를 웹 검색으로 확인하여 포함하세요
   - 출처가 있는 정보는 반드시 링크를 함께 제공하세요`;
    }
    systemPrompt += `

응답 형식:
---
title: [제목]
tags: [태그1, 태그2, 태그3]
---

[본문 내용...]`;
    const userPrompt = `## 코드 분석 결과

### 핵심 요약
${analysis.summary}

### 해결한 문제
${analysis.problem}

### 접근 방식
${analysis.approach}

### 주요 결정 사항
${analysis.key_decisions.map(d => `- ${d}`).join('\n')}

### 기술적 인사이트
${analysis.technical_insights.map(i => `- ${i}`).join('\n')}

### 블로그에서 강조할 포인트
${analysis.narrative_hooks.map(h => `- ${h}`).join('\n')}

## 원본 코드
\`\`\`
${codeDiff.slice(0, 10000)}
\`\`\`

위 분석을 바탕으로 ${style} 스타일의 기술 블로그 글을 작성해주세요.`;
    const tools = webSearch
        ? [{ type: "web_search_20250305", name: "web_search" }]
        : undefined;
    const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 8192,
        messages: [
            { role: "user", content: userPrompt }
        ],
        system: systemPrompt,
        ...(tools && { tools })
    });
    // 웹 검색 시 TextBlock, ServerToolUseBlock, WebSearchToolResultBlock이 섞여 나올 수 있으므로 텍스트만 추출
    const textBlocks = response.content.filter(b => b.type === "text");
    if (textBlocks.length === 0) {
        throw new Error("예상치 못한 응답 형식입니다");
    }
    const draft = textBlocks.map(b => b.text).join("\n\n");
    const metadata = extractMetadata(draft, style);
    return { draft, metadata };
}
/**
 * Claude로 피드백 반영
 */
export async function applyFeedbackWithClaude(currentDraft, feedback, apiKey) {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 8192,
        messages: [
            {
                role: "user",
                content: `다음 블로그 글에 피드백을 반영해주세요.

## 현재 글
${currentDraft}

## 피드백
${feedback}

피드백을 반영하여 수정된 전체 글을 출력해주세요. 기존 형식(title, tags 포함)을 유지하세요.`
            }
        ],
        system: "당신은 뛰어난 기술 블로그 편집자입니다. 피드백을 반영하여 글을 개선합니다."
    });
    const content = response.content[0];
    if (content.type !== "text") {
        throw new Error("예상치 못한 응답 형식입니다");
    }
    const draft = content.text;
    const metadata = extractMetadata(draft, BlogStyle.DEEP_DIVE);
    return { draft, metadata };
}
/**
 * Pro Mode: Claude로 코드 분석 (Researcher 역할)
 */
export async function analyzeCodeWithClaude(codeDiff, devLog, request, apiKey, webSearch = false) {
    const anthropic = new Anthropic({ apiKey });
    const prompt = `당신은 코드 분석 전문가입니다. 개발자의 작업 내용을 분석하여
Writer AI가 블로그 글을 작성할 수 있도록 구조화된 분석을 제공하세요.

## 분석할 내용
1. 코드 변경사항의 목적과 의도
2. 아키텍처적 결정과 그 이유
3. 해결한 문제와 접근 방식
4. 주목할 만한 기술적 패턴이나 트릭

## 입력

### Code Diff
\`\`\`
${codeDiff}
\`\`\`

${devLog ? `### Dev Log (개발자 메모)\n${devLog}` : ""}

${request ? `### 최우선 제약조건 (반드시 반영)\n${request}` : ""}

## 출력 형식
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:

\`\`\`json
{
  "summary": "핵심 요약 (1-2문장)",
  "problem": "해결한 문제",
  "approach": "접근 방식과 이유",
  "key_decisions": ["주요 결정 사항 1", "주요 결정 사항 2"],
  "technical_insights": ["기술적 인사이트 1", "기술적 인사이트 2"],
  "narrative_hooks": ["글에서 강조할 포인트 1", "글에서 강조할 포인트 2"]
}
\`\`\``;
    let systemPrompt = "당신은 코드 분석 전문가입니다. 반드시 요청된 JSON 형식으로만 응답하세요.";
    if (webSearch) {
        systemPrompt += `\n웹 검색을 활용하여 관련 기술의 최신 정보와 모범 사례를 참고하세요.
또한 분석 결과의 narrative_hooks에 다음을 포함하세요:
- 관련 공식 문서, 기술 블로그의 이미지 URL (아키텍처 다이어그램, 플로우차트, 성능 그래프 등)
- Writer가 블로그 본문에 삽입할 수 있는 \`![설명](이미지URL)\` 형태의 시각 자료 링크
- 참고할 만한 외부 기술 블로그/문서 링크`;
    }
    const tools = webSearch
        ? [{ type: "web_search_20250305", name: "web_search" }]
        : undefined;
    const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        messages: [
            { role: "user", content: prompt }
        ],
        system: systemPrompt,
        ...(tools && { tools })
    });
    // 웹 검색 시 여러 블록이 섞여 나올 수 있으므로 텍스트만 추출
    const textBlocks = response.content.filter(b => b.type === "text");
    if (textBlocks.length === 0) {
        throw new Error("예상치 못한 응답 형식입니다");
    }
    const responseText = textBlocks.map(b => b.text).join("\n");
    // JSON 파싱
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    let analysis;
    if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
    }
    else {
        // JSON 블록이 없으면 전체를 JSON으로 파싱 시도
        try {
            analysis = JSON.parse(responseText.trim());
        }
        catch {
            throw new Error("분석 결과 파싱 실패: JSON 형식이 아닙니다.");
        }
    }
    // 필수 필드 검증
    if (!analysis.summary || !analysis.problem || !analysis.approach) {
        throw new Error("분석 결과에 필수 필드가 누락되었습니다.");
    }
    // 배열 필드 기본값 설정
    analysis.key_decisions = analysis.key_decisions || [];
    analysis.technical_insights = analysis.technical_insights || [];
    analysis.narrative_hooks = analysis.narrative_hooks || [];
    return analysis;
}
function extractMetadata(draft, style) {
    let title = "제목 없음";
    let tags = [];
    // YAML frontmatter에서 추출
    const frontmatterMatch = draft.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        const titleMatch = frontmatter.match(/title:\s*(.+)/);
        if (titleMatch) {
            title = titleMatch[1].trim().replace(/^["']|["']$/g, "");
        }
        const tagsMatch = frontmatter.match(/tags:\s*\[([^\]]+)\]/);
        if (tagsMatch) {
            tags = tagsMatch[1].split(",").map(t => t.trim().replace(/^["']|["']$/g, ""));
        }
    }
    // 읽기 시간 계산
    const wordCount = draft.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));
    return {
        title,
        tags,
        estimatedReadTime: `${readTime}분`
    };
}
//# sourceMappingURL=anthropic.js.map