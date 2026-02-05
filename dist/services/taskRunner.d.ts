import { TaskStatus, InputType, BlogStyle, Language, ReviewFocus, GeminiModel } from "../types.js";
type NotificationCallback = (taskId: string, status: TaskStatus, message: string) => void;
export declare function setNotificationCallback(callback: NotificationCallback): void;
export declare function runDraftGeneration(taskId: string, inputType: InputType, content: string, style: BlogStyle, language: Language, model: GeminiModel, instructions: string | undefined, customPrompt: string | undefined, apiKey: string): Promise<void>;
export declare function runFeedbackApplication(taskId: string, feedback: string, model: GeminiModel, apiKey: string): Promise<void>;
export declare function runReviewGeneration(taskId: string, draft: string, focus: ReviewFocus, model: GeminiModel, instructions: string | undefined, customPrompt: string | undefined, apiKey: string): Promise<void>;
/**
 * Pro Mode: Gemini(분석) → Claude(작성) 파이프라인
 */
export declare function runProDraftGeneration(taskId: string, codeDiff: string, devLog: string | undefined, request: string | undefined, style: BlogStyle, language: Language, instructions: string | undefined, geminiApiKey: string, anthropicApiKey: string): Promise<void>;
/**
 * Pro Mode: Claude로 피드백 반영
 */
export declare function runProFeedbackApplication(taskId: string, feedback: string, anthropicApiKey: string): Promise<void>;
export {};
//# sourceMappingURL=taskRunner.d.ts.map