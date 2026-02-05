import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeployGithubInputSchema, DeployGithubInput, DeployOutput, TaskStatus, DeployOutputSchema } from "../types.js";
import { deployToGithub, readLocalFile } from "../services/github.js";
import { getTask } from "../services/database.js";

export function registerDeployGithubTool(server: McpServer): void {
  server.registerTool(
    "blog_deploy_github",
    {
      title: "Deploy to GitHub",
      description: `블로그 글을 GitHub 저장소에 배포합니다.

기존 작업 ID, 직접 콘텐츠 입력, 또는 로컬 파일 경로를 사용할 수 있습니다.
Jekyll, Hugo 등의 정적 사이트 생성기를 사용하는 블로그에 직접 커밋합니다.

Args:
  - task_id: 배포할 작업 ID (선택)
  - content: 직접 배포할 마크다운 콘텐츠 (선택)
  - filepath: 배포할 로컬 파일 경로 (선택)
  - repo: GitHub 저장소 (owner/repo 형식, 필수)
  - branch: 배포할 브랜치 (기본: main)
  - target_path: 저장소 내 저장 경로 (필수)
  - commit_message: 커밋 메시지 (선택)
  - github_token: GitHub Personal Access Token (필수)

Returns:
  - url: 커밋 URL
  - deployed: 배포 성공 여부
  - message: 안내 메시지`,
      inputSchema: DeployGithubInputSchema,
      outputSchema: DeployOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: DeployGithubInput) => {
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
                text: `Error: 완료된 작업만 배포할 수 있습니다. 현재 상태: ${task.status}`
              }],
              isError: true
            };
          }
          const draft = task.result?.draft || task.result?.improved;
          if (!draft) {
            return {
              content: [{
                type: "text" as const,
                text: "Error: 배포할 콘텐츠를 찾을 수 없습니다."
              }],
              isError: true
            };
          }
          content = draft;
        } else if (params.content) {
          content = params.content;
        } else if (params.filepath) {
          content = await readLocalFile(params.filepath);
        } else {
          return {
            content: [{
              type: "text" as const,
              text: "Error: task_id, content, filepath 중 하나는 필수입니다."
            }],
            isError: true
          };
        }

        const result = await deployToGithub(
          content,
          params.repo,
          params.branch,
          params.target_path,
          params.commit_message,
          params.github_token
        );

        const output: DeployOutput = {
          url: result.url,
          deployed: result.deployed,
          message: `GitHub 배포 완료! 커밋 URL: ${result.url}`
        };

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(output, null, 2)
          }],
          structuredContent: output
        };
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
          }],
          isError: true
        };
      }
    }
  );
}
