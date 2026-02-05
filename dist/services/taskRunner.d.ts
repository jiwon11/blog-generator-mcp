import { TaskStatus, InputType, BlogStyle, Language, ReviewFocus, GeminiModel } from "../types.js";
type NotificationCallback = (taskId: string, status: TaskStatus, message: string) => void;
export declare function setNotificationCallback(callback: NotificationCallback): void;
export declare function runDraftGeneration(taskId: string, inputType: InputType, content: string, style: BlogStyle, language: Language, model: GeminiModel, instructions: string | undefined, customPrompt: string | undefined, apiKey: string): Promise<void>;
export declare function runFeedbackApplication(taskId: string, feedback: string, model: GeminiModel, apiKey: string): Promise<void>;
export declare function runReviewGeneration(taskId: string, draft: string, focus: ReviewFocus, model: GeminiModel, instructions: string | undefined, customPrompt: string | undefined, apiKey: string): Promise<void>;
export {};
//# sourceMappingURL=taskRunner.d.ts.map