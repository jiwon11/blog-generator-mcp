import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// Import tool registrations
import { registerStartDraftTool } from "./tools/startDraft.js";
import { registerGetStatusTool } from "./tools/getStatus.js";
import { registerApplyFeedbackTool } from "./tools/applyFeedback.js";
import { registerFinalizeDraftTool } from "./tools/finalizeDraft.js";
import { registerStartReviewTool } from "./tools/startReview.js";
import { registerApplyReviewFeedbackTool } from "./tools/applyReviewFeedback.js";
import { registerSaveBlogTool } from "./tools/saveBlog.js";
import { registerDeployGithubTool } from "./tools/deployGithub.js";
// Pro Mode (HTTP 모드 전용)
import { registerStartDraftProTool } from "./tools/startDraftPro.js";
import { registerApplyFeedbackProTool } from "./tools/applyFeedbackPro.js";
export function createServer() {
    const server = new McpServer({
        name: "blog-generator-mcp",
        version: "4.1.0"
    });
    // Register all tools
    registerStartDraftTool(server);
    registerGetStatusTool(server);
    registerApplyFeedbackTool(server);
    registerFinalizeDraftTool(server);
    registerStartReviewTool(server);
    registerApplyReviewFeedbackTool(server);
    registerSaveBlogTool(server);
    registerDeployGithubTool(server);
    // Pro Mode (HTTP 모드 전용 - Anthropic API 필요)
    registerStartDraftProTool(server);
    registerApplyFeedbackProTool(server);
    return server;
}
//# sourceMappingURL=server.js.map