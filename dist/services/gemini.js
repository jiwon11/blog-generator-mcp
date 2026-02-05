import { GoogleGenerativeAI } from "@google/generative-ai";
import { InputType, BlogStyle, Language } from "../types.js";
const GEMINI_MODEL = "gemini-1.5-flash";
function getPromptTemplate(inputType, style, language, content) {
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
    return `당신은 기술 블로그 작성 전문가입니다. ${languageInstruction}

${inputInstructions[inputType]}

글 스타일: ${style}
스타일 가이드라인:
${styleInstructions[style]}

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
}
function parseResponse(response) {
    // Extract metadata JSON from the response
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
            // Remove the JSON block from the draft
            draft = response.replace(/```json\s*[\s\S]*?\s*```\s*$/, "").trim();
        }
        catch {
            // Keep default metadata if parsing fails
        }
    }
    // Try to extract title from the first H1 if not in metadata
    if (metadata.title === "Untitled") {
        const titleMatch = draft.match(/^#\s+(.+)$/m);
        if (titleMatch) {
            metadata.title = titleMatch[1];
        }
    }
    return { draft, metadata };
}
export async function generateBlogDraft(inputType, content, style, language) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다. " +
            "Google AI Studio(https://aistudio.google.com/app/apikey)에서 API 키를 발급받아 설정해주세요.");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = getPromptTemplate(inputType, style, language, content);
    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        return parseResponse(response);
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("API_KEY")) {
                throw new Error("잘못된 GEMINI_API_KEY입니다. API 키를 확인해주세요.");
            }
            if (error.message.includes("quota")) {
                throw new Error("Gemini API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.");
            }
            throw new Error(`Gemini API 오류: ${error.message}`);
        }
        throw new Error("알 수 없는 오류가 발생했습니다.");
    }
}
//# sourceMappingURL=gemini.js.map