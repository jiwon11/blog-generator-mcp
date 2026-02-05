import { ApplyReviewFeedbackInputSchema, TaskStatus, TaskType, GeminiModel } from "../types.js";
import { getTask, addFeedbackToHistory } from "../services/database.js";
import { runFeedbackApplication } from "../services/taskRunner.js";
export function registerApplyReviewFeedbackTool(server) {
    server.registerTool("blog_apply_review_feedback", {
        title: "Apply Review Feedback",
        description: `검수 결과에 추가 피드백을 반영합니다 (백그라운드 실행).

## 모델 선택 (model)
- gemini-1.5-flash: 빠른 응답 (기본값)
- gemini-1.5-pro: 고품질 피드백 반영

Args:
  - task_id: 피드백을 적용할 검수 작업 ID
  - feedback: 추가 검수 요청 사항
  - model: Gemini 모델 (기본: gemini-1.5-flash)
  - gemini_api_key: Gemini API 키 (필수)

Returns:
  - task_id: 작업 ID
  - status: "pending"
  - message: 안내 메시지`,
        inputSchema: ApplyReviewFeedbackInputSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true
        }
    }, async (params) => {
        try {
            const task = await getTask(params.task_id);
            const model = params.model || GeminiModel.FLASH;
            if (!task) {
                return {
                    content: [{
                            type: "text",
                            text: `Error: 작업을 찾을 수 없습니다: ${params.task_id}`
                        }],
                    isError: true
                };
            }
            if (task.type !== TaskType.REVIEW) {
                return {
                    content: [{
                            type: "text",
                            text: `Error: 검수 작업에만 이 도구를 사용할 수 있습니다. 초안 피드백은 blog_apply_feedback을 사용하세요.`
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
            if (!task.result?.draft && !task.result?.improved) {
                return {
                    content: [{
                            type: "text",
                            text: "Error: 검수 결과를 찾을 수 없습니다."
                        }],
                    isError: true
                };
            }
            // 피드백 히스토리에 추가
            await addFeedbackToHistory(params.task_id, params.feedback);
            // 백그라운드에서 피드백 반영
            runFeedbackApplication(params.task_id, params.feedback, model, params.gemini_api_key).catch(console.error);
            const output = {
                task_id: params.task_id,
                status: TaskStatus.PENDING,
                model,
                message: `검수 피드백 반영이 시작되었습니다. (모델: ${model}) blog_get_status로 진행 상황을 확인하세요.`
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
//# sourceMappingURL=applyReviewFeedback.js.map