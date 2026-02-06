/**
 * 환경변수 관리
 */

export const ENV_KEYS = {
  GEMINI_API_KEY: "GEMINI_API_KEY",
  ANTHROPIC_API_KEY: "ANTHROPIC_API_KEY",
  NOTION_API_KEY: "NOTION_API_KEY",
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
 * Pro Mode (HTTP 모드)에서만 필요
 */
export function getAnthropicApiKey(paramValue?: string): string {
  const key = paramValue || process.env[ENV_KEYS.ANTHROPIC_API_KEY];
  if (!key) {
    throw new Error(
      "Anthropic API 키가 필요합니다. " +
      "anthropic_api_key 파라미터로 전달하거나 ANTHROPIC_API_KEY 환경변수를 설정하세요. " +
      "(Pro Mode는 HTTP 모드에서만 필요합니다. Claude Desktop/Code 환경에서는 Claude에게 직접 요청하세요.)"
    );
  }
  return key;
}

/**
 * Notion API 키를 가져옵니다 (파라미터 우선, 없으면 환경변수)
 */
export function getNotionApiKey(paramValue?: string): string {
  const key = paramValue || process.env[ENV_KEYS.NOTION_API_KEY];
  if (!key) {
    throw new Error(
      "Notion API 키가 필요합니다. " +
      "notion_api_key 파라미터로 전달하거나 NOTION_API_KEY 환경변수를 설정하세요. " +
      "https://www.notion.so/my-integrations 에서 발급받을 수 있습니다."
    );
  }
  return key;
}

/**
 * 블로그 저장 디렉토리를 가져옵니다 (BLOG_SAVE_DIRECTORY 환경변수 필수)
 */
export function getBlogSaveDirectory(): string {
  const dir = process.env[ENV_KEYS.BLOG_SAVE_DIRECTORY];
  if (!dir) {
    throw new Error(
      "블로그 저장 디렉토리가 설정되지 않았습니다. " +
      "BLOG_SAVE_DIRECTORY 환경변수를 설정하세요."
    );
  }
  return dir;
}
