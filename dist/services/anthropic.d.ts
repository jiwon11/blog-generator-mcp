/**
 * Anthropic Claude API 서비스
 * Pro Mode (HTTP 모드 전용)에서 블로그 작성에 사용
 */
import { CodeAnalysis, BlogMetadata, BlogStyle, Language } from "../types.js";
/**
 * Claude로 블로그 글 작성
 */
export declare function writeBlogWithClaude(analysis: CodeAnalysis, codeDiff: string, style: BlogStyle, language: Language, instructions: string | undefined, apiKey: string, webSearch?: boolean): Promise<{
    draft: string;
    metadata: BlogMetadata;
}>;
/**
 * Claude로 피드백 반영
 */
export declare function applyFeedbackWithClaude(currentDraft: string, feedback: string, apiKey: string): Promise<{
    draft: string;
    metadata: BlogMetadata;
}>;
/**
 * Pro Mode: Claude로 코드 분석 (Researcher 역할)
 */
export declare function analyzeCodeWithClaude(codeDiff: string, devLog: string | undefined, request: string | undefined, apiKey: string, webSearch?: boolean): Promise<CodeAnalysis>;
//# sourceMappingURL=anthropic.d.ts.map