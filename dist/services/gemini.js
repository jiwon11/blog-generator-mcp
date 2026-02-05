import { GoogleGenerativeAI } from "@google/generative-ai";
import { InputType, BlogStyle, Language, ReviewFocus } from "../types.js";
function getPromptTemplate(inputType, style, language, content, instructions, customPrompt) {
    const languageInstruction = language === Language.KO
        ? "한국어로 작성해주세요."
        : "Write in English.";
    const styleInstructions = {
        [BlogStyle.TUTORIAL]: `
      - 단계별로 명확하게 설명
      - 코드 예제 포함
      - 초보자도 따라할 수 있도록 상세히 설명
      - 실습 가능한 예제 제공
    `,
        [BlogStyle.TIL]: `
      - Today I Learned 형식
      - 짧고 간결하게 핵심만 정리
      - 배운 내용과 인사이트 중심
      - 실제 적용 사례 포함
    `,
        [BlogStyle.DEEP_DIVE]: `
      - 심층적인 기술 분석
      - 내부 동작 원리 설명
      - 성능 고려사항 포함
      - 고급 사용 패턴 소개
    `,
        [BlogStyle.TROUBLESHOOTING]: `
      - 문제 상황 명확히 설명
      - 원인 분석
      - 해결 과정 단계별 설명
      - 예방 방법 및 팁 제공
    `
    };
    const inputInstructions = {
        [InputType.KEYWORD]: `주제/키워드를 기반으로 블로그 글을 작성합니다.
입력된 키워드: ${content}`,
        [InputType.CODE]: `아래 코드를 분석하고 설명하는 블로그 글을 작성합니다.
\`\`\`
${content}
\`\`\``,
        [InputType.MEMO]: `아래 메모/노트를 바탕으로 완성된 블로그 글을 작성합니다.
메모:
${content}`,
        [InputType.GIT_PUSH]: `아래 git 변경사항을 기반으로 개발일지/TIL 스타일의 블로그 글을 작성합니다.
Git 변경사항:
${content}`
    };
    let prompt = `당신은 기술 블로그 작성 전문가입니다. ${languageInstruction}

${inputInstructions[inputType]}

글 스타일: ${style}
기본 스타일 가이드라인:
${styleInstructions[style]}`;
    // 상세 지침이 있으면 추가 (최우선 적용)
    if (instructions) {
        prompt += `

====== 상세 작성 지침 (반드시 따라야 함) ======
${instructions}
====== 지침 끝 ======`;
    }
    // 간단한 추가 요청
    if (customPrompt) {
        prompt += `

추가 요청사항:
${customPrompt}`;
    }
    prompt += `

출력 형식:
1. 마크다운 형식으로 작성
2. 적절한 제목(H1)으로 시작
3. 목차가 필요하면 포함
4. 코드 블록에는 언어 명시
5. 읽기 쉽게 단락 구분

마지막에 다음 형식으로 메타데이터를 JSON으로 제공해주세요:
\`\`\`json
{
  "title": "글 제목",
  "tags": ["태그1", "태그2", "태그3"],
  "estimatedReadTime": "X분"
}
\`\`\``;
    return prompt;
}
function parseResponse(response) {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```\s*$/);
    let metadata = {
        title: "Untitled",
        tags: [],
        estimatedReadTime: "5분"
    };
    let draft = response;
    if (jsonMatch) {
        try {
            metadata = JSON.parse(jsonMatch[1]);
            draft = response.replace(/```json\s*[\s\S]*?\s*```\s*$/, "").trim();
        }
        catch {
            // Keep default metadata if parsing fails
        }
    }
    if (metadata.title === "Untitled") {
        const titleMatch = draft.match(/^#\s+(.+)$/m);
        if (titleMatch) {
            metadata.title = titleMatch[1];
        }
    }
    return { draft, metadata };
}
function parseFeedbackResponse(response) {
    const { draft, metadata } = parseResponse(response);
    // Extract changes
    const changesMatch = response.match(/---CHANGES---\s*([\s\S]*?)\s*---END---/);
    let changes = [];
    if (changesMatch) {
        changes = changesMatch[1]
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.startsWith("-"))
            .map(line => line.substring(1).trim());
    }
    return { draft, metadata, changes };
}
export async function generateBlogDraft(inputType, content, style, language, model, instructions, customPrompt, apiKey) {
    if (!apiKey) {
        throw new Error("Gemini API 키가 필요합니다. " +
            "Google AI Studio(https://aistudio.google.com/app/apikey)에서 발급받아주세요.");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const genModel = genAI.getGenerativeModel({ model });
    const prompt = getPromptTemplate(inputType, style, language, content, instructions, customPrompt);
    try {
        const result = await genModel.generateContent(prompt);
        const response = result.response.text();
        return parseResponse(response);
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("API_KEY")) {
                throw new Error("잘못된 Gemini API 키입니다. API 키를 확인해주세요.");
            }
            if (error.message.includes("quota")) {
                throw new Error("Gemini API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.");
            }
            if (error.message.includes("not found") || error.message.includes("404")) {
                throw new Error(`모델을 찾을 수 없습니다: ${model}. 다른 모델을 선택해주세요.`);
            }
            throw new Error(`Gemini API 오류: ${error.message}`);
        }
        throw new Error("알 수 없는 오류가 발생했습니다.");
    }
}
export async function applyFeedbackToDraft(originalDraft, feedback, type, model, apiKey) {
    if (!apiKey) {
        throw new Error("Gemini API 키가 필요합니다.");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const genModel = genAI.getGenerativeModel({ model });
    const prompt = `당신은 기술 블로그 편집자입니다.

아래 블로그 ${type === "review" ? "검수 결과" : "초안"}에 사용자 피드백을 반영해주세요.

원본:
${originalDraft}

사용자 피드백:
${feedback}

요청사항:
1. 피드백을 최대한 반영하여 글을 수정해주세요
2. 기존 글의 톤과 스타일을 유지해주세요
3. 마크다운 형식을 유지해주세요

수정된 글 전체를 출력하고, 마지막에 변경 사항을 정리해주세요:

---CHANGES---
- 변경사항 1
- 변경사항 2
---END---

그리고 메타데이터도 업데이트해주세요:
\`\`\`json
{
  "title": "글 제목",
  "tags": ["태그1", "태그2"],
  "estimatedReadTime": "X분"
}
\`\`\``;
    try {
        const result = await genModel.generateContent(prompt);
        const response = result.response.text();
        return parseFeedbackResponse(response);
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`피드백 반영 오류: ${error.message}`);
        }
        throw new Error("알 수 없는 오류가 발생했습니다.");
    }
}
export async function reviewBlogDraft(draft, focus, model, instructions, customPrompt, apiKey) {
    if (!apiKey) {
        throw new Error("Gemini API 키가 필요합니다.");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const genModel = genAI.getGenerativeModel({ model });
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
    let prompt = `당신은 기술 블로그 편집자입니다. 아래 블로그 글을 검토하고 개선해주세요.

기본 검수 기준:
${focusInstructions[focus]}`;
    // 상세 검수 지침
    if (instructions) {
        prompt += `

====== 상세 검수 지침 (반드시 따라야 함) ======
${instructions}
====== 지침 끝 ======`;
    }
    // 간단한 추가 요청
    if (customPrompt) {
        prompt += `

추가 검수 요청:
${customPrompt}`;
    }
    prompt += `

원본 글:
${draft}

응답 형식:
1. 먼저 개선된 전체 글을 마크다운 형식으로 제공
2. 마지막에 변경 사항 목록을 제공:

---CHANGES---
- 변경사항 1
- 변경사항 2
---END---`;
    try {
        const result = await genModel.generateContent(prompt);
        const response = result.response.text();
        // Parse response
        const changesMatch = response.match(/---CHANGES---\s*([\s\S]*?)\s*---END---/);
        let changes = [];
        let improved = response;
        if (changesMatch) {
            changes = changesMatch[1]
                .split("\n")
                .map(line => line.trim())
                .filter(line => line.startsWith("-"))
                .map(line => line.substring(1).trim());
            improved = response.replace(/---CHANGES---[\s\S]*?---END---/, "").trim();
        }
        return { improved, changes };
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`검수 오류: ${error.message}`);
        }
        throw new Error("알 수 없는 오류가 발생했습니다.");
    }
}
//# sourceMappingURL=gemini.js.map