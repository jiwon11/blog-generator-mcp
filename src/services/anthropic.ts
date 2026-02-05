/**
 * Anthropic Claude API 서비스
 * Pro Mode (HTTP 모드 전용)에서 블로그 작성에 사용
 */

import Anthropic from "@anthropic-ai/sdk";
import { GeminiAnalysis, BlogMetadata, BlogStyle, Language } from "../types.js";

/**
 * Claude로 블로그 글 작성
 */
export async function writeBlogWithClaude(
  analysis: GeminiAnalysis,
  codeDiff: string,
  style: BlogStyle,
  language: Language,
  instructions: string | undefined,
  apiKey: string
): Promise<{ draft: string; metadata: BlogMetadata }> {
  const anthropic = new Anthropic({ apiKey });

  const styleGuide = getStyleGuide(style);
  const langGuide = language === Language.KO ? "한국어로 작성하세요." : "Write in English.";

  const systemPrompt = `당신은 뛰어난 기술 블로그 작가입니다.
Gemini가 분석한 코드 인사이트를 바탕으로 매력적인 기술 블로그 글을 작성합니다.

${styleGuide}
${langGuide}

${instructions ? `\n추가 지침:\n${instructions}` : ""}

응답 형식:
---
title: [제목]
tags: [태그1, 태그2, 태그3]
---

[본문 내용...]`;

  const userPrompt = `## Gemini 분석 결과

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

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5-20251101",
    max_tokens: 8192,
    messages: [
      { role: "user", content: userPrompt }
    ],
    system: systemPrompt
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("예상치 못한 응답 형식입니다");
  }

  const draft = content.text;
  const metadata = extractMetadata(draft, style);

  return { draft, metadata };
}

/**
 * Claude로 피드백 반영
 */
export async function applyFeedbackWithClaude(
  currentDraft: string,
  feedback: string,
  apiKey: string
): Promise<{ draft: string; metadata: BlogMetadata }> {
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5-20251101",
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

function getStyleGuide(style: BlogStyle): string {
  const guides: Record<BlogStyle, string> = {
    [BlogStyle.TUTORIAL]: "단계별로 따라할 수 있는 튜토리얼 형식으로 작성하세요. 코드 예제와 설명을 번갈아 배치하세요.",
    [BlogStyle.TIL]: "오늘 배운 것(TIL) 형식으로 간결하게 작성하세요. 핵심 인사이트에 집중하세요.",
    [BlogStyle.DEEP_DIVE]: "기술적 깊이가 있는 분석 글을 작성하세요. 왜 이런 결정을 했는지, 트레이드오프는 무엇인지 설명하세요.",
    [BlogStyle.TROUBLESHOOTING]: "문제 해결 과정을 서술하세요. 문제 상황, 시도한 방법, 최종 해결책 순서로 작성하세요."
  };
  return guides[style];
}

function extractMetadata(draft: string, style: BlogStyle): BlogMetadata {
  let title = "제목 없음";
  let tags: string[] = [];

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
