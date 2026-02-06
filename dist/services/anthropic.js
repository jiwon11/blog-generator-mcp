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
    const styleGuide = getStyleGuide(style);
    const langGuide = language === Language.KO ? "한국어로 작성하세요." : "Write in English.";
    let systemPrompt = `당신은 뛰어난 기술 블로그 작가입니다.
코드 분석 인사이트를 바탕으로 매력적인 기술 블로그 글을 작성합니다.

${styleGuide}
${langGuide}

시각적 요소 (필수 - 반드시 따르세요):
- 글 전체에 최소 3개 이상의 시각적 요소를 반드시 포함하세요
- Mermaid 다이어그램을 적극 활용하세요 (sequenceDiagram, flowchart, stateDiagram-v2, classDiagram, erDiagram 등)
- 비교/분석 내용은 반드시 표(Table)로 정리하세요
- 주요 개념은 Mermaid 다이어그램으로 시각화하세요
- Before/After 비교 시 코드 블록을 나란히 배치하고 ❌/✅ 이모지로 구분하세요
- 핵심 포인트, 주의사항, 팁은 인용 블록(>)과 이모지(💡, ⚠️, 🔥, 📝)로 강조하세요
- 시스템 흐름이나 프로세스는 반드시 시퀀스 다이어그램 또는 플로우차트로 표현하세요

${instructions ? `\n추가 지침:\n${instructions}` : ""}`;
    if (webSearch) {
        systemPrompt += `\n\n웹 검색 활용 지시:
- 웹 검색을 통해 최신 정보, 통계, 공식 문서 링크를 적극 활용하세요
- 검색 결과를 바탕으로 정확한 버전 정보, 최신 동향, 참고 자료를 포함하세요
- 출처가 있는 정보는 링크를 함께 제공하세요`;
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
function getStyleGuide(style) {
    const guides = {
        [BlogStyle.TUTORIAL]: "단계별로 따라할 수 있는 튜토리얼 형식으로 작성하세요. 코드 예제와 설명을 번갈아 배치하세요. 각 단계의 흐름을 Mermaid 플로우차트로 시각화하고, 전체 아키텍처를 다이어그램으로 제시하세요.",
        [BlogStyle.TIL]: "오늘 배운 것(TIL) 형식으로 간결하게 작성하세요. 핵심 인사이트에 집중하세요. 핵심 개념을 Mermaid 다이어그램으로 시각화하고 Before/After 비교 블록을 활용하세요.",
        [BlogStyle.DEEP_DIVE]: "기술적 깊이가 있는 분석 글을 작성하세요. 왜 이런 결정을 했는지, 트레이드오프는 무엇인지 설명하세요. 시스템 아키텍처와 데이터 흐름을 Mermaid 다이어그램으로 시각화하고, 성능 비교를 표로 정리하세요.",
        [BlogStyle.TROUBLESHOOTING]: "문제 해결 과정을 서술하세요. 문제 상황, 시도한 방법, 최종 해결책 순서로 작성하세요. 디버깅 흐름을 Mermaid 플로우차트로 시각화하고 Before/After 코드 비교 블록을 반드시 포함하세요."
    };
    return guides[style];
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
        systemPrompt += "\n웹 검색을 활용하여 관련 기술의 최신 정보와 모범 사례를 참고하세요.";
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