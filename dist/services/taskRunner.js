import { getTask, updateTaskStatus, updateTaskResult, updateTaskError } from "./database.js";
import { generateBlogDraft, applyFeedbackToDraft } from "./gemini.js";
import { TaskStatus, TaskType } from "../types.js";
let notificationCallback = null;
export function setNotificationCallback(callback) {
    notificationCallback = callback;
}
function sendNotification(taskId, status, message) {
    // 로그 출력 (stderr로 출력하여 stdio 통신 방해 안함)
    const logLevel = status === TaskStatus.FAILED ? "ERROR" : "INFO";
    console.error(`[${logLevel}] Task ${taskId}: ${message}`);
    // 콜백이 설정되어 있으면 호출
    if (notificationCallback) {
        try {
            notificationCallback(taskId, status, message);
        }
        catch (error) {
            console.error("Notification callback error:", error);
        }
    }
}
export async function runDraftGeneration(taskId, inputType, content, style, language, customPrompt, apiKey) {
    try {
        // 상태 업데이트: 진행 중
        await updateTaskStatus(taskId, TaskStatus.IN_PROGRESS, 10);
        // 진행 상황 알림
        sendNotification(taskId, TaskStatus.IN_PROGRESS, "블로그 초안 생성을 시작합니다...");
        // 진행률 업데이트
        await updateTaskStatus(taskId, TaskStatus.IN_PROGRESS, 30);
        // Gemini로 초안 생성
        const result = await generateBlogDraft(inputType, content, style, language, customPrompt, apiKey);
        await updateTaskStatus(taskId, TaskStatus.IN_PROGRESS, 90);
        // 결과 저장
        const taskResult = {
            draft: result.draft,
            metadata: result.metadata
        };
        await updateTaskResult(taskId, taskResult);
        // 완료 알림
        sendNotification(taskId, TaskStatus.COMPLETED, `블로그 초안 생성이 완료되었습니다: "${result.metadata.title}"`);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
        await updateTaskError(taskId, errorMessage);
        sendNotification(taskId, TaskStatus.FAILED, `초안 생성 실패: ${errorMessage}`);
    }
}
export async function runFeedbackApplication(taskId, feedback, apiKey) {
    try {
        const task = await getTask(taskId);
        if (!task || !task.result?.draft) {
            throw new Error("기존 초안을 찾을 수 없습니다");
        }
        await updateTaskStatus(taskId, TaskStatus.IN_PROGRESS, 10);
        sendNotification(taskId, TaskStatus.IN_PROGRESS, "피드백을 반영 중입니다...");
        // 피드백 반영
        const result = await applyFeedbackToDraft(task.result.draft, feedback, task.type === TaskType.REVIEW ? "review" : "draft", apiKey);
        await updateTaskStatus(taskId, TaskStatus.IN_PROGRESS, 90);
        // 결과 업데이트
        const taskResult = {
            draft: result.draft,
            metadata: result.metadata,
            changes: result.changes
        };
        await updateTaskResult(taskId, taskResult);
        sendNotification(taskId, TaskStatus.COMPLETED, "피드백이 반영되었습니다. blog_get_status로 결과를 확인하세요.");
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
        await updateTaskError(taskId, errorMessage);
        sendNotification(taskId, TaskStatus.FAILED, `피드백 반영 실패: ${errorMessage}`);
    }
}
export async function runReviewGeneration(taskId, draft, focus, customPrompt, apiKey) {
    try {
        await updateTaskStatus(taskId, TaskStatus.IN_PROGRESS, 10);
        sendNotification(taskId, TaskStatus.IN_PROGRESS, "블로그 글 검수를 시작합니다...");
        // Gemini로 검수 수행
        const result = await generateReview(draft, focus, customPrompt, apiKey);
        await updateTaskStatus(taskId, TaskStatus.IN_PROGRESS, 90);
        const taskResult = {
            draft: result.improved,
            improved: result.improved,
            changes: result.changes
        };
        await updateTaskResult(taskId, taskResult);
        sendNotification(taskId, TaskStatus.COMPLETED, `검수가 완료되었습니다. ${result.changes.length}개의 개선사항이 반영되었습니다.`);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
        await updateTaskError(taskId, errorMessage);
        sendNotification(taskId, TaskStatus.FAILED, `검수 실패: ${errorMessage}`);
    }
}
// 검수 함수
async function generateReview(draft, focus, customPrompt, apiKey) {
    const { reviewBlogDraft } = await import("./gemini.js");
    return reviewBlogDraft(draft, focus, customPrompt, apiKey);
}
//# sourceMappingURL=taskRunner.js.map