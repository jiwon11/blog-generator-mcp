import { ApplyFeedbackInputSchema, TaskStatus } from "../types.js";
import { getTask, addFeedbackToHistory } from "../services/database.js";
import { runFeedbackApplication } from "../services/taskRunner.js";
export function registerApplyFeedbackTool(server) {
    server.registerTool("blog_apply_feedback", {
        title: "Apply Feedback to Draft",
        description: `사용자 피드백을 초안에 반영합니다 (백그라운드 실행).

피드백 히스토리가 저장되어 이전 피드백들을 추적할 수 있습니다.

Args:
  - task_id: 피드백을 적용할 작업 ID
  - feedback: 수정 요청 사항
  - gemini_api_key: Gemini API 키 (필수)

Returns:
  - task_id: 작업 ID
  - status: "pending"
  - message: 안내 메시지

완료 시 알림이 전송됩니다.`,
        inputSchema: ApplyFeedbackInputSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true
        }
    }, async (params) => {
        try {
            const task = await getTask(params.task_id);
            if (!task) {
                return {
                    content: [{
                            type: "text",
                            text: `Error: 작업을 찾을 수 없습니다: ${params.task_id}`
                        }],
                    isError: true
                };
            }
            if (task.status !== TaskStatus.COMPLETED) {
                return {
                    content: [{
                            type: "text",
                            text: `Error: 완료된 작업에만 피드백을 적용할 수 있습니다. 현재 상태: ${task.status}`
                        }],
                    isError: true
                };
            }
            if (!task.result?.draft) {
                return {
                    content: [{
                            type: "text",
                            text: "Error: 초안을 찾을 수 없습니다."
                        }],
                    isError: true
                };
            }
            // 피드백 히스토리에 추가
            await addFeedbackToHistory(params.task_id, params.feedback);
            // 백그라운드에서 피드백 반영
            runFeedbackApplication(params.task_id, params.feedback, params.gemini_api_key).catch(console.error);
            const output = {
                task_id: params.task_id,
                status: TaskStatus.PENDING,
                message: "피드백 반영이 시작되었습니다. blog_get_status로 진행 상황을 확인하세요."
            };
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify(output, null, 2)
                    }],
                structuredContent: output
            };
        }
        catch (error) {
            return {
                content: [{
                        type: "text",
                        text: `Error: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
                    }],
                isError: true
            };
        }
    });
}
//# sourceMappingURL=applyFeedback.js.map