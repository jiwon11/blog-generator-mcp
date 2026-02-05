import { Task, TaskStatus, TaskType, TaskResult } from "../types.js";
export declare function initDatabase(customPath?: string): Promise<void>;
export declare function createTask(id: string, type: TaskType, input: Record<string, unknown>): Promise<Task>;
export declare function getTask(id: string): Promise<Task | null>;
export declare function updateTaskStatus(id: string, status: TaskStatus, progress?: number): Promise<void>;
export declare function updateTaskResult(id: string, result: TaskResult): Promise<void>;
export declare function updateTaskError(id: string, error: string): Promise<void>;
export declare function addFeedbackToHistory(id: string, feedback: string): Promise<void>;
export declare function cleanupOldTasks(daysOld?: number): Promise<number>;
export declare function closeDatabase(): void;
//# sourceMappingURL=database.d.ts.map