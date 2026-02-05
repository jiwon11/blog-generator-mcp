import { TaskStatus, InputType, BlogStyle, Language, ReviewFocus } from "../types.js";
type NotificationCallback = (taskId: string, status: TaskStatus, message: string) => void;
export declare function setNotificationCallback(callback: NotificationCallback): void;
export declare function runDraftGeneration(taskId: string, inputType: InputType, content: string, style: BlogStyle, language: Language, customPrompt: string | undefined, apiKey: string): Promise<void>;
export declare function runFeedbackApplication(taskId: string, feedback: string, apiKey: string): Promise<void>;
export declare function runReviewGeneration(taskId: string, draft: string, focus: ReviewFocus, customPrompt: string | undefined, apiKey: string): Promise<void>;
export {};
//# sourceMappingURL=taskRunner.d.ts.map