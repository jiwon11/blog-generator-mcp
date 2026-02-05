import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as fs from "fs/promises";
import * as path from "path";
import { SaveBlogInputSchema, SaveBlogInput, SaveOutput, TaskStatus, SaveOutputSchema } from "../types.js";
import { getTask } from "../services/database.js";
import { getBlogSaveDirectory } from "../services/env.js";

function generateFilename(content: string): string {
  // Try to extract title from content
  const titleMatch = content.match(/^#\s+(.+)$/m);
  let title = titleMatch ? titleMatch[1] : "untitled";

  // Sanitize filename
  title = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50);

  // Add date prefix
  const date = new Date().toISOString().split("T")[0];

  return `${date}-${title}.md`;
}

export function registerSaveBlogTool(server: McpServer): void {
  server.registerTool(
    "blog_save",
    {
      title: "Save Blog Post",
      description: `블로그 글을 로컬 마크다운 파일로 저장합니다.

기존 작업 ID를 사용하거나 직접 콘텐츠를 입력할 수 있습니다.
파일명이 제공되지 않으면 글 제목과 날짜를 기반으로 자동 생성합니다.

Args:
  - task_id: 저장할 작업 ID (선택)
  - content: 직접 저장할 마크다운 콘텐츠 (선택)
  - filename: 파일명 (선택, 없으면 자동 생성)
  - directory: 저장 디렉토리 경로 (없으면 BLOG_SAVE_DIRECTORY 환경변수 또는 ./posts)

Returns:
  - filepath: 저장된 파일의 전체 경로
  - message: 안내 메시지`,
      inputSchema: SaveBlogInputSchema,
      outputSchema: SaveOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: SaveBlogInput) => {
      try {
        let content: string;

        // 콘텐츠 결정
        if (params.task_id) {
          const task = await getTask(params.task_id);
          if (!task) {
            return {
              content: [{
                type: "text" as const,
                text: `Error: 작업을 찾을 수 없습니다: ${params.task_id}`
              }],
              isError: true
            };
          }
          if (task.status !== TaskStatus.COMPLETED) {
            return {
              content: [{
                type: "text" as const,
                text: `Error: 완료된 작업만 저장할 수 있습니다. 현재 상태: ${task.status}`
              }],
              isError: true
            };
          }
          const draft = task.result?.draft || task.result?.improved;
          if (!draft) {
            return {
              content: [{
                type: "text" as const,
                text: "Error: 저장할 콘텐츠를 찾을 수 없습니다."
              }],
              isError: true
            };
          }
          content = draft;
        } else if (params.content) {
          content = params.content;
        } else {
          return {
            content: [{
              type: "text" as const,
              text: "Error: task_id 또는 content 중 하나는 필수입니다."
            }],
            isError: true
          };
        }

        const directory = getBlogSaveDirectory(params.directory);
        const filename = params.filename || generateFilename(content);

        // Ensure filename ends with .md
        const finalFilename = filename.endsWith(".md") ? filename : `${filename}.md`;

        // Create directory if it doesn't exist
        await fs.mkdir(directory, { recursive: true });

        // Full file path
        const filepath = path.join(directory, finalFilename);

        // Write file
        await fs.writeFile(filepath, content, "utf-8");

        const output: SaveOutput = {
          filepath,
          message: `블로그 글이 저장되었습니다: ${filepath}`
        };

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(output, null, 2)
          }],
          structuredContent: output
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";

        if (errorMessage.includes("permission")) {
          return {
            content: [{
              type: "text" as const,
              text: "Error: 파일 저장 권한이 없습니다. 디렉토리 권한을 확인해주세요."
            }],
            isError: true
          };
        }

        return {
          content: [{
            type: "text" as const,
            text: `Error: 파일 저장 실패 - ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );
}
