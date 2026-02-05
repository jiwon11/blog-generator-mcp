export interface DeployResult {
    [key: string]: unknown;
    url: string;
    deployed: boolean;
}
export declare function deployToGithub(content: string, repo: string, branch: string, targetPath: string, commitMessage: string | undefined, token: string): Promise<DeployResult>;
export declare function readLocalFile(filepath: string): Promise<string>;
//# sourceMappingURL=github.d.ts.map