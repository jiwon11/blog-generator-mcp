import { InputType, BlogStyle, Language, BlogMetadata, ReviewFocus, GeminiModel } from "../types.js";
interface GenerateResult {
    draft: string;
    metadata: BlogMetadata;
}
interface FeedbackResult {
    draft: string;
    metadata: BlogMetadata;
    changes: string[];
}
interface ReviewResult {
    improved: string;
    changes: string[];
}
export declare function generateBlogDraft(inputType: InputType, content: string, style: BlogStyle, language: Language, model: GeminiModel, instructions: string | undefined, customPrompt: string | undefined, apiKey: string): Promise<GenerateResult>;
export declare function applyFeedbackToDraft(originalDraft: string, feedback: string, type: "draft" | "review", model: GeminiModel, apiKey: string): Promise<FeedbackResult>;
export declare function reviewBlogDraft(draft: string, focus: ReviewFocus, model: GeminiModel, instructions: string | undefined, customPrompt: string | undefined, apiKey: string): Promise<ReviewResult>;
export {};
//# sourceMappingURL=gemini.d.ts.map