import { z } from "zod";
export declare enum InputType {
    KEYWORD = "keyword",
    CODE = "code",
    MEMO = "memo",
    GIT_PUSH = "git_push"
}
export declare enum BlogStyle {
    TUTORIAL = "tutorial",
    TIL = "til",
    DEEP_DIVE = "deep-dive",
    TROUBLESHOOTING = "troubleshooting"
}
export declare enum Language {
    KO = "ko",
    EN = "en"
}
export declare enum ReviewFocus {
    ACCURACY = "accuracy",
    READABILITY = "readability",
    SEO = "seo",
    ALL = "all"
}
export declare const GenerateDraftInputSchema: z.ZodObject<{
    input_type: z.ZodNativeEnum<typeof InputType>;
    content: z.ZodString;
    style: z.ZodDefault<z.ZodNativeEnum<typeof BlogStyle>>;
    language: z.ZodDefault<z.ZodNativeEnum<typeof Language>>;
}, "strict", z.ZodTypeAny, {
    input_type: InputType;
    content: string;
    style: BlogStyle;
    language: Language;
}, {
    input_type: InputType;
    content: string;
    style?: BlogStyle | undefined;
    language?: Language | undefined;
}>;
export declare const ReviewPostInputSchema: z.ZodObject<{
    draft: z.ZodString;
    focus: z.ZodDefault<z.ZodNativeEnum<typeof ReviewFocus>>;
}, "strict", z.ZodTypeAny, {
    draft: string;
    focus: ReviewFocus;
}, {
    draft: string;
    focus?: ReviewFocus | undefined;
}>;
export declare const SaveBlogInputSchema: z.ZodObject<{
    content: z.ZodString;
    filename: z.ZodOptional<z.ZodString>;
    directory: z.ZodDefault<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    content: string;
    directory: string;
    filename?: string | undefined;
}, {
    content: string;
    filename?: string | undefined;
    directory?: string | undefined;
}>;
export declare const DeployGithubInputSchema: z.ZodObject<{
    filepath: z.ZodString;
    repo: z.ZodString;
    branch: z.ZodDefault<z.ZodString>;
    commit_message: z.ZodOptional<z.ZodString>;
    target_path: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    filepath: string;
    repo: string;
    branch: string;
    commit_message?: string | undefined;
    target_path?: string | undefined;
}, {
    filepath: string;
    repo: string;
    branch?: string | undefined;
    commit_message?: string | undefined;
    target_path?: string | undefined;
}>;
export type GenerateDraftInput = z.infer<typeof GenerateDraftInputSchema>;
export type ReviewPostInput = z.infer<typeof ReviewPostInputSchema>;
export type SaveBlogInput = z.infer<typeof SaveBlogInputSchema>;
export type DeployGithubInput = z.infer<typeof DeployGithubInputSchema>;
export interface BlogMetadata {
    [key: string]: unknown;
    title: string;
    tags: string[];
    estimatedReadTime: string;
}
export interface GenerateDraftOutput {
    [key: string]: unknown;
    draft: string;
    metadata: BlogMetadata;
}
export interface ReviewPostOutput {
    [key: string]: unknown;
    improved: string;
    changes: string[];
}
export interface SaveBlogOutput {
    [key: string]: unknown;
    filepath: string;
}
export interface DeployGithubOutput {
    [key: string]: unknown;
    url: string;
    deployed: boolean;
}
//# sourceMappingURL=types.d.ts.map