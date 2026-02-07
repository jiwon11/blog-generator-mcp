/**
 * 썸네일 이미지 검색 서비스
 * 블로그 제목/태그를 기반으로 웹 검색을 통해 적합한 썸네일 이미지 URL을 찾는다.
 */
/**
 * Gemini + Google Search로 썸네일 이미지 검색
 */
export declare function searchThumbnailWithGemini(title: string, tags: string[], apiKey: string): Promise<string | null>;
/**
 * Claude + web_search로 썸네일 이미지 검색
 */
export declare function searchThumbnailWithClaude(title: string, tags: string[], apiKey: string): Promise<string | null>;
/**
 * draft의 YAML frontmatter에 thumbnail 이미지 URL 주입
 */
export declare function injectThumbnailToFrontmatter(draft: string, thumbnailUrl: string): string;
//# sourceMappingURL=thumbnail.d.ts.map