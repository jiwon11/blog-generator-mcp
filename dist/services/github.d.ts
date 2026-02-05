export interface DeployResult {
    [key: string]: unknown;
    url: string;
    deployed: boolean;
}
export declare function deployToGithub(filepath: string, repo: string, branch: string, commitMessage?: string, targetPath?: string): Promise<DeployResult>;
//# sourceMappingURL=github.d.ts.map