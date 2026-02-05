import { z } from "zod";

// Enums
export enum InputType {
  KEYWORD = "keyword",
  CODE = "code",
  MEMO = "memo",
  GIT_PUSH = "git_push"
}

export enum BlogStyle {
  TUTORIAL = "tutorial",
  TIL = "til",
  DEEP_DIVE = "deep-dive",
  TROUBLESHOOTING = "troubleshooting"
}

export enum Language {
  KO = "ko",
  EN = "en"
}

export enum ReviewFocus {
  ACCURACY = "accuracy",
  READABILITY = "readability",
  SEO = "seo",
  ALL = "all"
}

// Zod Schemas
export const GenerateDraftInputSchema = z.object({
  input_type: z.nativeEnum(InputType)
    .describe("입력 유형: keyword(키워드), code(코드), memo(메모), git_push(git 변경사항)"),
  content: z.string()
    .min(1, "콘텐츠는 필수입니다")
    .max(50000, "콘텐츠가 너무 깁니다")
    .describe("블로그 글 생성에 사용할 입력 내용"),
  style: z.nativeEnum(BlogStyle)
    .default(BlogStyle.TUTORIAL)
    .describe("블로그 글 스타일: tutorial, til, deep-dive, troubleshooting"),
  language: z.nativeEnum(Language)
    .default(Language.KO)
    .describe("출력 언어: ko(한국어), en(영어)")
}).strict();

export const ReviewPostInputSchema = z.object({
  draft: z.string()
    .min(1, "초안은 필수입니다")
    .describe("검수할 블로그 초안 (마크다운 형식)"),
  focus: z.nativeEnum(ReviewFocus)
    .default(ReviewFocus.ALL)
    .describe("검수 초점: accuracy(정확성), readability(가독성), seo(SEO), all(전체)")
}).strict();

export const SaveBlogInputSchema = z.object({
  content: z.string()
    .min(1, "콘텐츠는 필수입니다")
    .describe("저장할 마크다운 콘텐츠"),
  filename: z.string()
    .optional()
    .describe("파일명 (없으면 제목에서 자동 생성)"),
  directory: z.string()
    .default("./posts")
    .describe("저장 디렉토리 경로")
}).strict();

export const DeployGithubInputSchema = z.object({
  filepath: z.string()
    .min(1, "파일 경로는 필수입니다")
    .describe("배포할 파일의 로컬 경로"),
  repo: z.string()
    .regex(/^[^/]+\/[^/]+$/, "형식: owner/repo")
    .describe("GitHub 저장소 (owner/repo 형식)"),
  branch: z.string()
    .default("main")
    .describe("배포할 브랜치"),
  commit_message: z.string()
    .optional()
    .describe("커밋 메시지 (없으면 자동 생성)"),
  target_path: z.string()
    .optional()
    .describe("저장소 내 저장 경로 (없으면 파일명 그대로)")
}).strict();

// Type exports
export type GenerateDraftInput = z.infer<typeof GenerateDraftInputSchema>;
export type ReviewPostInput = z.infer<typeof ReviewPostInputSchema>;
export type SaveBlogInput = z.infer<typeof SaveBlogInputSchema>;
export type DeployGithubInput = z.infer<typeof DeployGithubInputSchema>;

// Response types with index signature for MCP SDK compatibility
export interface BlogMetadata {
  [key: string]: unknown;
  title: string;
  tags: string[];
  estimatedReadTime: string;
}

export interface GenerateDraftOutput {
  [key: string]: unknown;
  draft: string;
  metadata: BlogMetadata;
}

export interface ReviewPostOutput {
  [key: string]: unknown;
  improved: string;
  changes: string[];
}

export interface SaveBlogOutput {
  [key: string]: unknown;
  filepath: string;
}

export interface DeployGithubOutput {
  [key: string]: unknown;
  url: string;
  deployed: boolean;
}
