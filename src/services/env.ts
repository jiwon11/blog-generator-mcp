/**
 * 환경변수 관리
 */

export const ENV_KEYS = {
  GEMINI_API_KEY: "GEMINI_API_KEY",
  ANTHROPIC_API_KEY: "ANTHROPIC_API_KEY",
  BLOG_SAVE_DIRECTORY: "BLOG_SAVE_DIRECTORY"
} as const;

/**
 * Gemini API 키를 가져옵니다 (파라미터 우선, 없으면 환경변수)
 */
export function getGeminiApiKey(paramValue?: string): string {
  const key = paramValue || process.env[ENV_KEYS.GEMINI_API_KEY];
  if (!key) {
    throw new Error(
      "Gemini API 키가 필요합니다. " +
      "gemini_api_key 파라미터로 전달하거나 GEMINI_API_KEY 환경변수를 설정하세요."
    );
  }
  return key;
}

/**
 * Anthropic API 키를 가져옵니다 (파라미터 우선, 없으면 환경변수)
 */
export function getAnthropicApiKey(paramValue?: string): string {
  const key = paramValue || process.env[ENV_KEYS.ANTHROPIC_API_KEY];
  if (!key) {
    throw new Error(
      "Anthropic API 키가 필요합니다. " +
      "anthropic_api_key 파라미터로 전달하거나 ANTHROPIC_API_KEY 환경변수를 설정하세요."
    );
  }
  return key;
}

/**
 * 블로그 저장 디렉토리를 가져옵니다 (파라미터 우선, 없으면 환경변수, 기본값 ./posts)
 */
export function getBlogSaveDirectory(paramValue?: string): string {
  return paramValue || process.env[ENV_KEYS.BLOG_SAVE_DIRECTORY] || "./posts";
}
