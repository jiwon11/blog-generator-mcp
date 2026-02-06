/**
 * Notion 페이지 콘텐츠를 마크다운으로 변환하는 서비스
 */
/**
 * Notion URL 또는 ID에서 page ID를 추출합니다.
 * 지원하는 형식:
 * - https://www.notion.so/Page-Title-abc123def456...
 * - https://www.notion.so/workspace/Page-Title-abc123def456...
 * - abc123def456... (32자 hex)
 * - abc123de-f456-7890-abcd-ef1234567890 (UUID with dashes)
 */
export declare function extractPageId(notionUrl: string): string;
/**
 * Notion 페이지를 마크다운으로 가져옵니다.
 */
export declare function fetchNotionPageAsMarkdown(notionUrl: string, apiKey: string): Promise<{
    markdown: string;
    title: string;
}>;
//# sourceMappingURL=notion.d.ts.map