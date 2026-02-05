import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SaveBlogInputSchema, SaveBlogInput } from "../types.js";
import * as fs from "fs/promises";
import * as path from "path";

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

파일명이 제공되지 않으면 글 제목과 날짜를 기반으로 자동 생성합니다.
디렉토리가 없으면 자동으로 생성합니다.

Args:
  - content (string): 저장할 마크다운 콘텐츠
  - filename (string, optional): 파일명 (없으면 자동 생성)
  - directory (string): 저장 디렉토리 경로 (기본: ./posts)

Returns:
  {
    "filepath": string    // 저장된 파일의 전체 경로
  }

Example:
  content="# My Blog Post\\n...", directory="./posts"
  -> filepath="./posts/2024-01-15-my-blog-post.md"`,
      inputSchema: SaveBlogInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: SaveBlogInput) => {
      try {
        const directory = params.directory || "./posts";
        const filename = params.filename || generateFilename(params.content);

        // Ensure filename ends with .md
        const finalFilename = filename.endsWith(".md") ? filename : `${filename}.md`;

        // Create directory if it doesn't exist
        await fs.mkdir(directory, { recursive: true });

        // Full file path
        const filepath = path.join(directory, finalFilename);

        // Write file
        await fs.writeFile(filepath, params.content, "utf-8");

        const output = { filepath };

        return {
          content: [{
            type: "text" as const,
            text: `블로그 글이 저장되었습니다: ${filepath}`
          }],
          structuredContent: output
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";

        if (errorMessage.includes("permission")) {
          return {
            content: [{
              type: "text" as const,
              text: `Error: 파일 저장 권한이 없습니다. 디렉토리 권한을 확인해주세요.`
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
