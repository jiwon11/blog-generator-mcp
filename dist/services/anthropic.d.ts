import { BlogStyle, Language, GeminiAnalysis, BlogMetadata } from "../types.js";
export interface ClaudeGenerateResult {
    draft: string;
    metadata: BlogMetadata;
}
/**
 * Claude Opus 4.5로 블로그 글 작성 (Writer 역할)
 */
export declare function writeBlogWithClaude(analysisResult: GeminiAnalysis, codeDiff: string, style: BlogStyle, language: Language, instructions: string | undefined, apiKey: string): Promise<ClaudeGenerateResult>;
/**
 * Claude로 피드백 반영
 */
export declare function applyFeedbackWithClaude(currentDraft: string, feedback: string, apiKey: string): Promise<ClaudeGenerateResult>;
//# sourceMappingURL=anthropic.d.ts.map