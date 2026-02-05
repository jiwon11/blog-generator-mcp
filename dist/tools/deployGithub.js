import { DeployGithubInputSchema } from "../types.js";
import { deployToGithub } from "../services/github.js";
export function registerDeployGithubTool(server) {
    server.registerTool("blog_deploy_github", {
        title: "Deploy to GitHub",
        description: `블로그 글을 GitHub 저장소에 배포합니다.

Jekyll, Hugo 등의 정적 사이트 생성기를 사용하는 블로그에 직접 커밋합니다.
파일이 이미 존재하면 업데이트합니다.

Args:
  - filepath (string): 배포할 파일의 로컬 경로
  - repo (string): GitHub 저장소 (owner/repo 형식)
  - branch (string): 배포할 브랜치 (기본: main)
  - commit_message (string, optional): 커밋 메시지
  - target_path (string, optional): 저장소 내 저장 경로

Returns:
  {
    "url": string,        // 커밋 URL
    "deployed": boolean   // 배포 성공 여부
  }

Requirements:
  - GITHUB_TOKEN 환경변수 필요 (repo 권한)

Example:
  filepath="./posts/my-post.md", repo="user/blog", target_path="_posts/my-post.md"`,
        inputSchema: DeployGithubInputSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true
        }
    }, async (params) => {
        try {
            const result = await deployToGithub(params.filepath, params.repo, params.branch || "main", params.commit_message, params.target_path);
            return {
                content: [{
                        type: "text",
                        text: `GitHub 배포 완료!\n\n커밋 URL: ${result.url}`
                    }],
                structuredContent: result
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
//# sourceMappingURL=deployGithub.js.map