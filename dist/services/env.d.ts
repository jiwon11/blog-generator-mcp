/**
 * 환경변수 관리
 */
export declare const ENV_KEYS: {
    readonly GEMINI_API_KEY: "GEMINI_API_KEY";
    readonly ANTHROPIC_API_KEY: "ANTHROPIC_API_KEY";
    readonly BLOG_SAVE_DIRECTORY: "BLOG_SAVE_DIRECTORY";
};
/**
 * Gemini API 키를 가져옵니다 (파라미터 우선, 없으면 환경변수)
 */
export declare function getGeminiApiKey(paramValue?: string): string;
/**
 * Anthropic API 키를 가져옵니다 (파라미터 우선, 없으면 환경변수)
 * Pro Mode (HTTP 모드)에서만 필요
 */
export declare function getAnthropicApiKey(paramValue?: string): string;
/**
 * 블로그 저장 디렉토리를 가져옵니다 (파라미터 우선, 없으면 환경변수, 기본값 ./posts)
 */
export declare function getBlogSaveDirectory(paramValue?: string): string;
//# sourceMappingURL=env.d.ts.map