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
export declare enum TaskStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare enum TaskType {
    DRAFT = "draft",
    REVIEW = "review",
    DRAFT_PRO = "draft_pro"
}
export declare enum GeminiModel {
    FLASH = "gemini-1.5-flash",
    FLASH_8B = "gemini-1.5-flash-8b",
    PRO = "gemini-1.5-pro",
    PRO_2 = "gemini-2.0-flash"
}
export declare const StartDraftInputSchema: z.ZodObject<{
    input_type: z.ZodNativeEnum<typeof InputType>;
    content: z.ZodString;
    style: z.ZodDefault<z.ZodNativeEnum<typeof BlogStyle>>;
    language: z.ZodDefault<z.ZodNativeEnum<typeof Language>>;
    model: z.ZodDefault<z.ZodNativeEnum<typeof GeminiModel>>;
    instructions: z.ZodOptional<z.ZodString>;
    custom_prompt: z.ZodOptional<z.ZodString>;
    gemini_api_key: z.ZodString;
}, "strict", z.ZodTypeAny, {
    input_type: InputType;
    content: string;
    style: BlogStyle;
    language: Language;
    model: GeminiModel;
    gemini_api_key: string;
    instructions?: string | undefined;
    custom_prompt?: string | undefined;
}, {
    input_type: InputType;
    content: string;
    gemini_api_key: string;
    style?: BlogStyle | undefined;
    language?: Language | undefined;
    model?: GeminiModel | undefined;
    instructions?: string | undefined;
    custom_prompt?: string | undefined;
}>;
export declare const GetStatusInputSchema: z.ZodObject<{
    task_id: z.ZodString;
}, "strict", z.ZodTypeAny, {
    task_id: string;
}, {
    task_id: string;
}>;
export declare const ApplyFeedbackInputSchema: z.ZodObject<{
    task_id: z.ZodString;
    feedback: z.ZodString;
    model: z.ZodDefault<z.ZodNativeEnum<typeof GeminiModel>>;
    gemini_api_key: z.ZodString;
}, "strict", z.ZodTypeAny, {
    model: GeminiModel;
    gemini_api_key: string;
    task_id: string;
    feedback: string;
}, {
    gemini_api_key: string;
    task_id: string;
    feedback: string;
    model?: GeminiModel | undefined;
}>;
export declare const FinalizeDraftInputSchema: z.ZodObject<{
    task_id: z.ZodString;
}, "strict", z.ZodTypeAny, {
    task_id: string;
}, {
    task_id: string;
}>;
export declare const StartReviewInputSchema: z.ZodEffects<z.ZodObject<{
    task_id: z.ZodOptional<z.ZodString>;
    draft: z.ZodOptional<z.ZodString>;
    focus: z.ZodDefault<z.ZodNativeEnum<typeof ReviewFocus>>;
    model: z.ZodDefault<z.ZodNativeEnum<typeof GeminiModel>>;
    instructions: z.ZodOptional<z.ZodString>;
    custom_prompt: z.ZodOptional<z.ZodString>;
    gemini_api_key: z.ZodString;
}, "strict", z.ZodTypeAny, {
    model: GeminiModel;
    gemini_api_key: string;
    focus: ReviewFocus;
    draft?: string | undefined;
    instructions?: string | undefined;
    custom_prompt?: string | undefined;
    task_id?: string | undefined;
}, {
    gemini_api_key: string;
    draft?: string | undefined;
    model?: GeminiModel | undefined;
    instructions?: string | undefined;
    custom_prompt?: string | undefined;
    task_id?: string | undefined;
    focus?: ReviewFocus | undefined;
}>, {
    model: GeminiModel;
    gemini_api_key: string;
    focus: ReviewFocus;
    draft?: string | undefined;
    instructions?: string | undefined;
    custom_prompt?: string | undefined;
    task_id?: string | undefined;
}, {
    gemini_api_key: string;
    draft?: string | undefined;
    model?: GeminiModel | undefined;
    instructions?: string | undefined;
    custom_prompt?: string | undefined;
    task_id?: string | undefined;
    focus?: ReviewFocus | undefined;
}>;
export declare const ApplyReviewFeedbackInputSchema: z.ZodObject<{
    task_id: z.ZodString;
    feedback: z.ZodString;
    model: z.ZodDefault<z.ZodNativeEnum<typeof GeminiModel>>;
    gemini_api_key: z.ZodString;
}, "strict", z.ZodTypeAny, {
    model: GeminiModel;
    gemini_api_key: string;
    task_id: string;
    feedback: string;
}, {
    gemini_api_key: string;
    task_id: string;
    feedback: string;
    model?: GeminiModel | undefined;
}>;
export declare const SaveBlogInputSchema: z.ZodEffects<z.ZodObject<{
    task_id: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    filename: z.ZodOptional<z.ZodString>;
    directory: z.ZodDefault<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    directory: string;
    content?: string | undefined;
    task_id?: string | undefined;
    filename?: string | undefined;
}, {
    content?: string | undefined;
    task_id?: string | undefined;
    filename?: string | undefined;
    directory?: string | undefined;
}>, {
    directory: string;
    content?: string | undefined;
    task_id?: string | undefined;
    filename?: string | undefined;
}, {
    content?: string | undefined;
    task_id?: string | undefined;
    filename?: string | undefined;
    directory?: string | undefined;
}>;
export declare const DeployGithubInputSchema: z.ZodEffects<z.ZodObject<{
    task_id: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    filepath: z.ZodOptional<z.ZodString>;
    repo: z.ZodString;
    branch: z.ZodDefault<z.ZodString>;
    target_path: z.ZodString;
    commit_message: z.ZodOptional<z.ZodString>;
    github_token: z.ZodString;
}, "strict", z.ZodTypeAny, {
    repo: string;
    branch: string;
    target_path: string;
    github_token: string;
    content?: string | undefined;
    task_id?: string | undefined;
    filepath?: string | undefined;
    commit_message?: string | undefined;
}, {
    repo: string;
    target_path: string;
    github_token: string;
    content?: string | undefined;
    task_id?: string | undefined;
    filepath?: string | undefined;
    branch?: string | undefined;
    commit_message?: string | undefined;
}>, {
    repo: string;
    branch: string;
    target_path: string;
    github_token: string;
    content?: string | undefined;
    task_id?: string | undefined;
    filepath?: string | undefined;
    commit_message?: string | undefined;
}, {
    repo: string;
    target_path: string;
    github_token: string;
    content?: string | undefined;
    task_id?: string | undefined;
    filepath?: string | undefined;
    branch?: string | undefined;
    commit_message?: string | undefined;
}>;
export declare const StartDraftProInputSchema: z.ZodObject<{
    code_diff: z.ZodString;
    dev_log: z.ZodOptional<z.ZodString>;
    request: z.ZodOptional<z.ZodString>;
    style: z.ZodDefault<z.ZodNativeEnum<typeof BlogStyle>>;
    language: z.ZodDefault<z.ZodNativeEnum<typeof Language>>;
    instructions: z.ZodOptional<z.ZodString>;
    gemini_api_key: z.ZodString;
    anthropic_api_key: z.ZodString;
}, "strict", z.ZodTypeAny, {
    style: BlogStyle;
    language: Language;
    gemini_api_key: string;
    code_diff: string;
    anthropic_api_key: string;
    instructions?: string | undefined;
    dev_log?: string | undefined;
    request?: string | undefined;
}, {
    gemini_api_key: string;
    code_diff: string;
    anthropic_api_key: string;
    style?: BlogStyle | undefined;
    language?: Language | undefined;
    instructions?: string | undefined;
    dev_log?: string | undefined;
    request?: string | undefined;
}>;
export declare const ApplyFeedbackProInputSchema: z.ZodObject<{
    task_id: z.ZodString;
    feedback: z.ZodString;
    anthropic_api_key: z.ZodString;
}, "strict", z.ZodTypeAny, {
    task_id: string;
    feedback: string;
    anthropic_api_key: string;
}, {
    task_id: string;
    feedback: string;
    anthropic_api_key: string;
}>;
export type StartDraftInput = z.infer<typeof StartDraftInputSchema>;
export type GetStatusInput = z.infer<typeof GetStatusInputSchema>;
export type ApplyFeedbackInput = z.infer<typeof ApplyFeedbackInputSchema>;
export type FinalizeDraftInput = z.infer<typeof FinalizeDraftInputSchema>;
export type StartReviewInput = z.infer<typeof StartReviewInputSchema>;
export type ApplyReviewFeedbackInput = z.infer<typeof ApplyReviewFeedbackInputSchema>;
export type SaveBlogInput = z.infer<typeof SaveBlogInputSchema>;
export type DeployGithubInput = z.infer<typeof DeployGithubInputSchema>;
export type StartDraftProInput = z.infer<typeof StartDraftProInputSchema>;
export type ApplyFeedbackProInput = z.infer<typeof ApplyFeedbackProInputSchema>;
export interface BlogMetadata {
    [key: string]: unknown;
    title: string;
    tags: string[];
    estimatedReadTime: string;
}
export interface TaskResult {
    [key: string]: unknown;
    draft?: string;
    improved?: string;
    metadata?: BlogMetadata;
    changes?: string[];
    analysis?: Record<string, unknown>;
}
export interface FeedbackEntry {
    feedback: string;
    appliedAt: string;
}
export interface Task {
    id: string;
    type: TaskType;
    status: TaskStatus;
    progress: number;
    input: Record<string, unknown>;
    result: TaskResult | null;
    history: FeedbackEntry[];
    error: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface StartTaskOutput {
    [key: string]: unknown;
    task_id: string;
    status: TaskStatus;
    message: string;
}
export interface GetStatusOutput {
    [key: string]: unknown;
    task_id: string;
    status: TaskStatus;
    progress: number;
    result?: TaskResult;
    error?: string;
}
export interface FinalizeOutput {
    [key: string]: unknown;
    draft: string;
    metadata: BlogMetadata;
    message: string;
}
export interface SaveOutput {
    [key: string]: unknown;
    filepath: string;
    message: string;
}
export interface DeployOutput {
    [key: string]: unknown;
    url: string;
    deployed: boolean;
    message: string;
}
export interface GeminiAnalysis {
    [key: string]: unknown;
    summary: string;
    problem: string;
    approach: string;
    key_decisions: string[];
    technical_insights: string[];
    narrative_hooks: string[];
}
//# sourceMappingURL=types.d.ts.map