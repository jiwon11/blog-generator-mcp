import { Octokit } from "@octokit/rest";
import * as fs from "fs/promises";
import * as path from "path";

export interface DeployResult {
  [key: string]: unknown;
  url: string;
  deployed: boolean;
}

export async function deployToGithub(
  content: string,
  repo: string,
  branch: string,
  targetPath: string,
  commitMessage: string | undefined,
  token: string
): Promise<DeployResult> {
  if (!token) {
    throw new Error(
      "GitHub 토큰이 필요합니다. " +
      "GitHub Personal Access Token을 생성해주세요. " +
      "(필요 권한: repo, contents)"
    );
  }

  const octokit = new Octokit({ auth: token });

  // Parse owner and repo name
  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    throw new Error("저장소 형식이 올바르지 않습니다. 'owner/repo' 형식으로 입력해주세요.");
  }

  // Generate commit message if not provided
  const message = commitMessage || `Add blog post: ${path.basename(targetPath)}`;

  try {
    // Check if file already exists
    let sha: string | undefined;
    try {
      const { data: existingFile } = await octokit.repos.getContent({
        owner,
        repo: repoName,
        path: targetPath,
        ref: branch
      });

      if (!Array.isArray(existingFile) && existingFile.type === "file") {
        sha = existingFile.sha;
      }
    } catch {
      // File doesn't exist, that's fine
    }

    // Create or update file
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path: targetPath,
      message,
      content: Buffer.from(content).toString("base64"),
      branch,
      sha
    });

    return {
      url: data.commit.html_url || `https://github.com/${repo}/commit/${data.commit.sha}`,
      deployed: true
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Bad credentials")) {
        throw new Error("GitHub 토큰이 유효하지 않습니다. 토큰을 확인해주세요.");
      }
      if (error.message.includes("Not Found")) {
        throw new Error(`저장소를 찾을 수 없습니다: ${repo}. 저장소 이름과 권한을 확인해주세요.`);
      }
      if (error.message.includes("branch")) {
        throw new Error(`브랜치를 찾을 수 없습니다: ${branch}`);
      }
      throw new Error(`GitHub API 오류: ${error.message}`);
    }
    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
}

export async function readLocalFile(filepath: string): Promise<string> {
  try {
    return await fs.readFile(filepath, "utf-8");
  } catch {
    throw new Error(`파일을 읽을 수 없습니다: ${filepath}`);
  }
}
