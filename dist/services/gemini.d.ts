import { InputType, BlogStyle, Language, BlogMetadata } from "../types.js";
interface GenerateResult {
    draft: string;
    metadata: BlogMetadata;
}
export declare function generateBlogDraft(inputType: InputType, content: string, style: BlogStyle, language: Language): Promise<GenerateResult>;
export {};
//# sourceMappingURL=gemini.d.ts.map