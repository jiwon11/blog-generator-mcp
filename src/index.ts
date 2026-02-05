#!/usr/bin/env node
/**
 * Blog Generator MCP Server
 *
 * Gemini AI를 사용하여 블로그 초안을 생성하고,
 * Claude가 검수하여 품질 높은 기술 블로그 글을 자동 생성하는 MCP 서버입니다.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerGenerateDraftTool } from "./tools/generateDraft.js";
import { registerReviewPostTool } from "./tools/reviewPost.js";
import { registerSaveBlogTool } from "./tools/saveBlog.js";
import { registerDeployGithubTool } from "./tools/deployGithub.js";

// Create MCP server instance
const server = new McpServer({
  name: "blog-generator-mcp",
  version: "1.0.0"
});

// Register all tools
registerGenerateDraftTool(server);
registerReviewPostTool(server);
registerSaveBlogTool(server);
registerDeployGithubTool(server);

// Main function
async function main(): Promise<void> {
  // Validate environment variables
  if (!process.env.GEMINI_API_KEY) {
    console.error(
      "WARNING: GEMINI_API_KEY 환경변수가 설정되지 않았습니다.\n" +
      "blog_generate_draft 도구를 사용하려면 API 키가 필요합니다.\n" +
      "https://aistudio.google.com/app/apikey 에서 발급받을 수 있습니다."
    );
  }

  if (!process.env.GITHUB_TOKEN) {
    console.error(
      "WARNING: GITHUB_TOKEN 환경변수가 설정되지 않았습니다.\n" +
      "blog_deploy_github 도구를 사용하려면 토큰이 필요합니다."
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Blog Generator MCP Server is running");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
