/**
 * Notion 페이지 콘텐츠를 마크다운으로 변환하는 서비스
 */
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
/**
 * Notion URL 또는 ID에서 page ID를 추출합니다.
 * 지원하는 형식:
 * - https://www.notion.so/Page-Title-abc123def456...
 * - https://www.notion.so/workspace/Page-Title-abc123def456...
 * - abc123def456... (32자 hex)
 * - abc123de-f456-7890-abcd-ef1234567890 (UUID with dashes)
 */
export function extractPageId(notionUrl) {
    const input = notionUrl.trim();
    // UUID 형식 (대시 포함) - 직접 반환
    const uuidWithDashes = input.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    if (uuidWithDashes) {
        return input;
    }
    // 32자 hex (대시 미포함) - UUID 형식으로 변환
    const plainHex = input.match(/^([0-9a-f]{32})$/i);
    if (plainHex) {
        const id = plainHex[1];
        return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
    }
    // URL 형식 - 마지막 32자 hex 추출
    const urlMatch = input.match(/([0-9a-f]{32})(?:\?.*)?$/i);
    if (urlMatch) {
        const id = urlMatch[1];
        return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
    }
    // URL에서 UUID 형식 (대시 포함) 추출
    const urlUuidMatch = input.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (urlUuidMatch) {
        return urlUuidMatch[1];
    }
    throw new Error(`유효하지 않은 Notion URL 또는 페이지 ID입니다: ${notionUrl}\n` +
        "Notion 페이지 URL 또는 32자 페이지 ID를 입력하세요.");
}
/**
 * Notion 페이지를 마크다운으로 가져옵니다.
 */
export async function fetchNotionPageAsMarkdown(notionUrl, apiKey) {
    const pageId = extractPageId(notionUrl);
    const notion = new Client({ auth: apiKey });
    const n2m = new NotionToMarkdown({ notionClient: notion });
    // 페이지 제목 추출
    const page = await notion.pages.retrieve({ page_id: pageId });
    let title = "제목 없음";
    if ("properties" in page) {
        // 다양한 title 속성명 지원
        const titleProp = Object.values(page.properties).find((prop) => prop.type === "title");
        if (titleProp && "title" in titleProp) {
            const titleArray = titleProp.title;
            if (Array.isArray(titleArray) && titleArray.length > 0) {
                title = titleArray.map((t) => t.plain_text).join("");
            }
        }
    }
    // 페이지 내용을 마크다운으로 변환
    const mdBlocks = await n2m.pageToMarkdown(pageId);
    const mdString = n2m.toMarkdownString(mdBlocks);
    // notion-to-md v3에서는 .parent 속성에 본문이 있음
    const markdown = typeof mdString === "string" ? mdString : mdString.parent;
    return { markdown, title };
}
//# sourceMappingURL=notion.js.map