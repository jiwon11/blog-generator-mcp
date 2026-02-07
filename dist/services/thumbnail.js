/**
 * 썸네일 이미지 검색 서비스
 * 블로그 제목/태그를 기반으로 웹 검색을 통해 적합한 썸네일 이미지 URL을 찾는다.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
const THUMBNAIL_PROMPT = (title, tags) => `당신은 기술 블로그의 썸네일/커버 이미지를 찾는 전문가입니다.

아래 블로그 글의 주제에 적합한 고품질 이미지를 웹에서 검색하세요.

## 블로그 정보
- 제목: ${title}
- 태그: ${tags.join(", ")}

## 요구사항
- 블로그 주제와 직접적으로 관련된 기술 이미지를 찾으세요
- 아키텍처 다이어그램, 기술 로고, 개념도 등 기술 블로그에 어울리는 이미지를 우선하세요
- 이미지 URL은 직접 접근 가능한 것이어야 합니다 (.png, .jpg, .webp, .svg 등)
- 저작권에 문제가 적은 공식 문서, 기술 블로그의 이미지를 우선하세요

## 응답 형식
이미지 URL만 한 줄로 반환하세요. 다른 텍스트는 포함하지 마세요.
예: https://example.com/image.png`;
/**
 * Gemini + Google Search로 썸네일 이미지 검색
 */
export async function searchThumbnailWithGemini(title, tags, apiKey) {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const tools = [{ googleSearchRetrieval: {} }];
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: THUMBNAIL_PROMPT(title, tags) }] }],
            tools
        });
        const response = result.response;
        const text = response.text();
        return extractUrl(text);
    }
    catch (error) {
        console.error("Gemini 썸네일 검색 실패:", error instanceof Error ? error.message : error);
        return null;
    }
}
/**
 * Claude + web_search로 썸네일 이미지 검색
 */
export async function searchThumbnailWithClaude(title, tags, apiKey) {
    try {
        const anthropic = new Anthropic({ apiKey });
        const response = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 512,
            messages: [
                { role: "user", content: THUMBNAIL_PROMPT(title, tags) }
            ],
            system: "블로그 썸네일에 적합한 이미지를 웹에서 검색하여 URL만 반환하세요.",
            tools: [{ type: "web_search_20250305", name: "web_search" }]
        });
        const textBlocks = response.content.filter(b => b.type === "text");
        if (textBlocks.length === 0)
            return null;
        const text = textBlocks.map(b => b.text).join("\n");
        return extractUrl(text);
    }
    catch (error) {
        console.error("Claude 썸네일 검색 실패:", error instanceof Error ? error.message : error);
        return null;
    }
}
/**
 * 텍스트에서 이미지 URL 추출
 */
function extractUrl(text) {
    // 이미지 확장자가 있는 URL 우선
    const imageUrlMatch = text.match(/https?:\/\/[^\s"'<>)]+\.(png|jpg|jpeg|webp|svg|gif)(\?[^\s"'<>)]*)?/i);
    if (imageUrlMatch)
        return imageUrlMatch[0];
    // 일반 URL 추출
    const urlMatch = text.match(/https?:\/\/[^\s"'<>)]+/);
    if (urlMatch)
        return urlMatch[0];
    return null;
}
/**
 * draft의 YAML frontmatter에 thumbnail 이미지 URL 주입
 */
export function injectThumbnailToFrontmatter(draft, thumbnailUrl) {
    const frontmatterMatch = draft.match(/^(---\n)([\s\S]*?)(\n---)/);
    if (!frontmatterMatch)
        return draft;
    const [fullMatch, open, content, close] = frontmatterMatch;
    const imageBlock = `image:\n  path: "${thumbnailUrl}"\n  thumbnail: "${thumbnailUrl}"`;
    const newFrontmatter = `${open}${content}\n${imageBlock}${close}`;
    return draft.replace(fullMatch, newFrontmatter);
}
//# sourceMappingURL=thumbnail.js.map