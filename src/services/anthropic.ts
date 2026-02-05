import Anthropic from "@anthropic-ai/sdk";
import { BlogStyle, Language, GeminiAnalysis, BlogMetadata } from "../types.js";

export interface ClaudeGenerateResult {
  draft: string;
  metadata: BlogMetadata;
}

const STYLE_GUIDES: Record<BlogStyle, string> = {
  [BlogStyle.TUTORIAL]: "단계별로 따라할 수 있는 실습 중심의 튜토리얼 형식으로 작성하세요.",
  [BlogStyle.TIL]: "Today I Learned 형식으로, 배운 내용과 깨달음을 개인적인 톤으로 작성하세요.",
  [BlogStyle.DEEP_DIVE]: "기술적 깊이가 있는 심층 분석 글로, 내부 동작 원리와 설계 결정을 상세히 다루세요.",
  [BlogStyle.TROUBLESHOOTING]: "문제 해결 과정을 서사적으로 풀어내며, 시행착오와 최종 해결책을 다루세요."
};

const LANGUAGE_INSTRUCTIONS: Record<Language, string> = {
  [Language.KO]: "한국어로 작성하세요. 기술 용어는 영어를 병기할 수 있습니다.",
  [Language.EN]: "Write in English."
};

/**
 * Claude Opus 4.5로 블로그 글 작성 (Writer 역할)
 */
export async function writeBlogWithClaude(
  analysisResult: GeminiAnalysis,
  codeDiff: string,
  style: BlogStyle,
  language: Language,
  instructions: string | undefined,
  apiKey: string
): Promise<ClaudeGenerateResult> {
  const client = new Anthropic({ apiKey });

  const systemPrompt = `당신은 주니어 개발자를 위한 기술 블로그 작가입니다.
Gemini의 분석을 바탕으로 마스터피스급 아티클을 작성하세요.

## 작성 원칙
- 단순한 코드 설명이 아닌 '해결 과정의 서사'를 담을 것
- 문체는 유려하고 통찰력 있게
- 주니어 개발자가 배울 수 있는 인사이트 포함
- 실제 코드와 함께 "왜 이렇게 했는지" 설명
- ${STYLE_GUIDES[style]}
- ${LANGUAGE_INSTRUCTIONS[language]}

## 출력 형식
마크다운 형식으로 블로그 글을 작성하세요.
- 제목은 # 으로 시작
- 섹션은 ## 또는 ### 사용
- 코드 블록에는 언어 명시
- 글 마지막에 핵심 요약 포함`;

  const userPrompt = `## Gemini 분석 결과
${JSON.stringify(analysisResult, null, 2)}

## 원본 코드 변경사항
\`\`\`
${codeDiff}
\`\`\`

${instructions ? `## 추가 작성 지침\n${instructions}` : ""}

위 분석 결과를 바탕으로 블로그 글을 작성해주세요.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [
      { role: "user", content: userPrompt }
    ],
    system: systemPrompt
  });

  const textContent = response.content.find(block => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Claude 응답에서 텍스트를 찾을 수 없습니다.");
  }

  const draft = textContent.text;
  const metadata = extractMetadata(draft, language);

  return { draft, metadata };
}

/**
 * Claude로 피드백 반영
 */
export async function applyFeedbackWithClaude(
  currentDraft: string,
  feedback: string,
  apiKey: string
): Promise<ClaudeGenerateResult> {
  const client = new Anthropic({ apiKey });

  const systemPrompt = `당신은 기술 블로그 편집자입니다.
사용자의 피드백을 반영하여 글을 개선하세요.

## 원칙
- 피드백 내용을 정확히 반영
- 기존 글의 톤과 스타일 유지
- 전체적인 흐름이 자연스럽게 유지되도록 수정
- 마크다운 형식 유지`;

  const userPrompt = `## 현재 초안
${currentDraft}

## 피드백
${feedback}

피드백을 반영하여 개선된 전체 글을 작성해주세요.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [
      { role: "user", content: userPrompt }
    ],
    system: systemPrompt
  });

  const textContent = response.content.find(block => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Claude 응답에서 텍스트를 찾을 수 없습니다.");
  }

  const draft = textContent.text;
  const metadata = extractMetadata(draft, Language.KO);

  return { draft, metadata };
}

/**
 * 블로그 글에서 메타데이터 추출
 */
function extractMetadata(draft: string, language: Language): BlogMetadata {
  // 제목 추출 (첫 번째 # 헤더)
  const titleMatch = draft.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : "Untitled";

  // 태그 추출 (코드 블록의 언어, 기술 키워드)
  const codeBlockLangs = [...draft.matchAll(/```(\w+)/g)].map(m => m[1]);
  const techKeywords = extractTechKeywords(draft);
  const tags = [...new Set([...codeBlockLangs, ...techKeywords])].slice(0, 5);

  // 읽기 시간 추정 (한국어 기준 분당 500자, 영어 기준 분당 200단어)
  const charCount = draft.length;
  const wordCount = draft.split(/\s+/).length;
  const readTime = language === Language.KO
    ? Math.ceil(charCount / 500)
    : Math.ceil(wordCount / 200);

  return {
    title,
    tags,
    estimatedReadTime: `${readTime}분`
  };
}

/**
 * 기술 키워드 추출
 */
function extractTechKeywords(text: string): string[] {
  const techTerms = [
    "React", "Vue", "Angular", "TypeScript", "JavaScript", "Node.js",
    "Python", "Go", "Rust", "Java", "Kotlin", "Swift",
    "Docker", "Kubernetes", "AWS", "GCP", "Azure",
    "PostgreSQL", "MySQL", "MongoDB", "Redis",
    "GraphQL", "REST", "API", "WebSocket",
    "Git", "CI/CD", "DevOps", "Microservices"
  ];

  return techTerms.filter(term =>
    text.toLowerCase().includes(term.toLowerCase())
  );
}
