import { GoogleGenerativeAI } from "@google/generative-ai";
import { InputType, BlogStyle, Language, ReviewFocus, GeminiModel } from "../types.js";
function getPromptTemplate(inputType, style, language, content, instructions, customPrompt) {
    const languageInstruction = language === Language.KO
        ? "한국어로 작성해주세요."
        : "Write in English.";
    const styleNames = {
        [BlogStyle.TUTORIAL]: "Tutorial (튜토리얼)",
        [BlogStyle.TIL]: "TIL (Today I Learned)",
        [BlogStyle.DEEP_DIVE]: "Deep-dive (심층 분석)",
        [BlogStyle.TROUBLESHOOTING]: "Troubleshooting (문제 해결)"
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
${content}`,
        [InputType.NOTION]: `아래 Notion 페이지 내용을 바탕으로 더 풍성하고 완성도 높은 블로그 글을 작성합니다.

중요 지침:
- 원본 Notion 콘텐츠의 모든 내용을 반드시 포함하세요. 내용을 생략하지 마세요.
- 원본의 핵심 메시지와 구조를 유지하면서 더 상세한 기술적 설명을 추가하세요
- 코드 예제가 있다면 더 상세한 설명과 추가 예제를 제공하세요
- 심층 분석, 팁/주의사항, 관련 배경 지식을 추가하여 글을 풍부하게 만드세요

원본 Notion 콘텐츠:
${content}`
    };
    let prompt = `당신은 기술 블로그 작성 전문가입니다. ${languageInstruction}

${inputInstructions[inputType]}

글 스타일: ${styleNames[style]}
아래 "상세 작성 지침"에 포함된 글 유형별 구조, 톤, 분량 가이드를 반드시 따르세요.`;
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

시각적 요소 (필수):
- 글 전체에 최소 3개 이상의 시각적 요소를 반드시 포함하세요
- Mermaid 다이어그램을 적극 활용하세요 (sequenceDiagram, flowchart, stateDiagram-v2, classDiagram, erDiagram 등)
- 비교/분석 내용은 반드시 표(Table)로 정리하세요
- 주요 개념은 Mermaid 다이어그램으로 시각화하세요
- Before/After 비교 시 코드 블록을 나란히 배치하고 ❌/✅ 이모지로 구분하세요
- 핵심 포인트, 주의사항, 팁은 인용 블록(>)과 이모지(💡, ⚠️, 🔥, 📝)로 강조하세요
- 시스템 흐름이나 프로세스는 반드시 시퀀스 다이어그램 또는 플로우차트로 표현하세요

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
        title: "제목 없음",
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
export async function generateBlogDraft(inputType, content, style, language, model, instructions, customPrompt, apiKey, webSearch = false) {
    if (!apiKey) {
        throw new Error("Gemini API 키가 필요합니다. " +
            "Google AI Studio(https://aistudio.google.com/app/apikey)에서 발급받아주세요.");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const genModel = genAI.getGenerativeModel({ model });
    let prompt = getPromptTemplate(inputType, style, language, content, instructions, customPrompt);
    if (webSearch) {
        prompt += `\n\n웹 검색 활용 지시:

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
    const tools = webSearch
        ? [{ googleSearchRetrieval: {} }]
        : undefined;
    try {
        const result = await genModel.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            ...(tools && { tools })
        });
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
/**
 * Pro Mode: Gemini로 코드 분석 (Researcher 역할)
 */
export async function analyzeCodeWithGemini(codeDiff, devLog, request, apiKey) {
    if (!apiKey) {
        throw new Error("Gemini API 키가 필요합니다.");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    // Pro Mode에서는 gemini-1.5-pro 사용 (더 정확한 분석)
    const genModel = genAI.getGenerativeModel({ model: GeminiModel.PRO });
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
    try {
        const result = await genModel.generateContent(prompt);
        const response = result.response.text();
        // JSON 파싱
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (!jsonMatch) {
            // JSON 블록이 없으면 전체를 JSON으로 파싱 시도
            try {
                return JSON.parse(response.trim());
            }
            catch {
                throw new Error("분석 결과 파싱 실패: JSON 형식이 아닙니다.");
            }
        }
        const analysis = JSON.parse(jsonMatch[1]);
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
    catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("API_KEY")) {
                throw new Error("잘못된 Gemini API 키입니다.");
            }
            if (error.message.includes("quota")) {
                throw new Error("Gemini API 할당량이 초과되었습니다.");
            }
            throw new Error(`코드 분석 오류: ${error.message}`);
        }
        throw new Error("코드 분석 중 알 수 없는 오류가 발생했습니다.");
    }
}
//# sourceMappingURL=gemini.js.map