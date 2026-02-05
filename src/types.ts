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

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed"
}

export enum TaskType {
  DRAFT = "draft",
  REVIEW = "review",
  DRAFT_PRO = "draft_pro"
}

// Gemini 모델 선택
export enum GeminiModel {
  FLASH = "gemini-1.5-flash",
  FLASH_8B = "gemini-1.5-flash-8b",
  PRO = "gemini-1.5-pro",
  PRO_2 = "gemini-2.0-flash"
}

// ============ Zod Schemas ============

// 1. blog_start_draft
export const StartDraftInputSchema = z.object({
  input_type: z.nativeEnum(InputType)
    .describe("입력 유형: keyword, code, memo, git_push"),
  content: z.string()
    .min(1, "콘텐츠는 필수입니다")
    .max(50000, "콘텐츠가 너무 깁니다")
    .describe("블로그 글 생성에 사용할 입력 내용"),
  style: z.nativeEnum(BlogStyle)
    .default(BlogStyle.TUTORIAL)
    .describe("블로그 글 스타일"),
  language: z.nativeEnum(Language)
    .default(Language.KO)
    .describe("출력 언어"),
  model: z.nativeEnum(GeminiModel)
    .default(GeminiModel.FLASH)
    .describe("사용할 Gemini 모델: gemini-1.5-flash(기본), gemini-1.5-flash-8b, gemini-1.5-pro, gemini-2.0-flash"),
  instructions: z.string()
    .optional()
    .describe("상세 작성 지침 (skill.md 스타일). 글의 톤, 구조, 포함할 내용, 제외할 내용, 타겟 독자, 예시 스타일 등을 상세히 기술"),
  instructions_file: z.string()
    .optional()
    .describe("상세 작성 지침이 담긴 마크다운 파일 경로. instructions와 함께 사용하면 파일 내용 + 파라미터 내용이 병합됨"),
  custom_prompt: z.string()
    .optional()
    .describe("간단한 추가 요청 사항 (instructions보다 짧은 요청에 사용)"),
  gemini_api_key: z.string()
    .optional()
    .describe("Gemini API 키 (없으면 GEMINI_API_KEY 환경변수 사용)")
}).strict();

// 2. blog_get_status
export const GetStatusInputSchema = z.object({
  task_id: z.string()
    .min(1, "작업 ID는 필수입니다")
    .describe("조회할 작업 ID")
}).strict();

// 3. blog_apply_feedback
export const ApplyFeedbackInputSchema = z.object({
  task_id: z.string()
    .min(1, "작업 ID는 필수입니다")
    .describe("피드백을 적용할 작업 ID"),
  feedback: z.string()
    .min(1, "피드백 내용은 필수입니다")
    .describe("수정 요청 사항"),
  model: z.nativeEnum(GeminiModel)
    .default(GeminiModel.FLASH)
    .describe("사용할 Gemini 모델"),
  gemini_api_key: z.string()
    .optional()
    .describe("Gemini API 키 (없으면 GEMINI_API_KEY 환경변수 사용)")
}).strict();

// 4. blog_finalize_draft
export const FinalizeDraftInputSchema = z.object({
  task_id: z.string()
    .min(1, "작업 ID는 필수입니다")
    .describe("확정할 작업 ID")
}).strict();

// 5. blog_start_review
export const StartReviewInputSchema = z.object({
  task_id: z.string()
    .optional()
    .describe("기존 작업 ID (draft 결과 사용 시)"),
  draft: z.string()
    .optional()
    .describe("직접 입력할 초안 내용"),
  focus: z.nativeEnum(ReviewFocus)
    .default(ReviewFocus.ALL)
    .describe("검수 초점: accuracy, readability, seo, all"),
  model: z.nativeEnum(GeminiModel)
    .default(GeminiModel.FLASH)
    .describe("사용할 Gemini 모델"),
  instructions: z.string()
    .optional()
    .describe("상세 검수 지침. 검수 기준, 중점 사항, 스타일 가이드 등을 상세히 기술"),
  instructions_file: z.string()
    .optional()
    .describe("상세 검수 지침이 담긴 마크다운 파일 경로. instructions와 함께 사용하면 파일 내용 + 파라미터 내용이 병합됨"),
  custom_prompt: z.string()
    .optional()
    .describe("간단한 추가 검수 요청"),
  gemini_api_key: z.string()
    .optional()
    .describe("Gemini API 키 (없으면 GEMINI_API_KEY 환경변수 사용)")
}).strict().refine(
  (data) => data.task_id || data.draft,
  { message: "task_id 또는 draft 중 하나는 필수입니다" }
);

// 6. blog_apply_review_feedback
export const ApplyReviewFeedbackInputSchema = z.object({
  task_id: z.string()
    .min(1, "작업 ID는 필수입니다")
    .describe("피드백을 적용할 검수 작업 ID"),
  feedback: z.string()
    .min(1, "피드백 내용은 필수입니다")
    .describe("추가 검수 요청 사항"),
  model: z.nativeEnum(GeminiModel)
    .default(GeminiModel.FLASH)
    .describe("사용할 Gemini 모델"),
  gemini_api_key: z.string()
    .optional()
    .describe("Gemini API 키 (없으면 GEMINI_API_KEY 환경변수 사용)")
}).strict();

// 7. blog_save
export const SaveBlogInputSchema = z.object({
  task_id: z.string()
    .optional()
    .describe("저장할 작업 ID"),
  content: z.string()
    .optional()
    .describe("직접 저장할 마크다운 콘텐츠"),
  filename: z.string()
    .optional()
    .describe("파일명 (없으면 자동 생성)"),
  directory: z.string()
    .optional()
    .describe("저장 디렉토리 경로 (없으면 BLOG_SAVE_DIRECTORY 환경변수 또는 ./posts 사용)")
}).strict().refine(
  (data) => data.task_id || data.content,
  { message: "task_id 또는 content 중 하나는 필수입니다" }
);

// 8. blog_deploy_github
export const DeployGithubInputSchema = z.object({
  task_id: z.string()
    .optional()
    .describe("배포할 작업 ID"),
  content: z.string()
    .optional()
    .describe("직접 배포할 마크다운 콘텐츠"),
  filepath: z.string()
    .optional()
    .describe("배포할 로컬 파일 경로"),
  repo: z.string()
    .regex(/^[^/]+\/[^/]+$/, "형식: owner/repo")
    .describe("GitHub 저장소 (owner/repo 형식)"),
  branch: z.string()
    .default("main")
    .describe("배포할 브랜치"),
  target_path: z.string()
    .describe("저장소 내 저장 경로"),
  commit_message: z.string()
    .optional()
    .describe("커밋 메시지 (없으면 자동 생성)"),
  github_token: z.string()
    .min(1, "GitHub 토큰은 필수입니다")
    .describe("GitHub Personal Access Token")
}).strict().refine(
  (data) => data.task_id || data.content || data.filepath,
  { message: "task_id, content, filepath 중 하나는 필수입니다" }
);

// 9. blog_start_draft_pro (Pro Mode - HTTP 모드 전용)
export const StartDraftProInputSchema = z.object({
  code_diff: z.string()
    .min(1, "코드 변경사항은 필수입니다")
    .max(100000, "코드가 너무 깁니다")
    .describe("Git diff 또는 변경된 코드"),
  dev_log: z.string()
    .optional()
    .describe("개발자의 고민/메모/의사결정 과정"),
  request: z.string()
    .optional()
    .describe("최우선 제약조건 - 이 요청사항을 최우선으로 반영"),
  style: z.nativeEnum(BlogStyle)
    .default(BlogStyle.DEEP_DIVE)
    .describe("블로그 글 스타일"),
  language: z.nativeEnum(Language)
    .default(Language.KO)
    .describe("출력 언어"),
  instructions: z.string()
    .optional()
    .describe("상세 작성 지침"),
  instructions_file: z.string()
    .optional()
    .describe("상세 작성 지침이 담긴 마크다운 파일 경로. instructions와 함께 사용하면 파일 내용 + 파라미터 내용이 병합됨"),
  gemini_api_key: z.string()
    .optional()
    .describe("Gemini API 키 (없으면 GEMINI_API_KEY 환경변수 사용)"),
  anthropic_api_key: z.string()
    .optional()
    .describe("Anthropic API 키 (없으면 ANTHROPIC_API_KEY 환경변수 사용)")
}).strict();

// 10. blog_apply_feedback_pro (Pro Mode - HTTP 모드 전용)
export const ApplyFeedbackProInputSchema = z.object({
  task_id: z.string()
    .min(1, "작업 ID는 필수입니다")
    .describe("피드백을 적용할 Pro 작업 ID"),
  feedback: z.string()
    .min(1, "피드백 내용은 필수입니다")
    .describe("수정 요청 사항"),
  anthropic_api_key: z.string()
    .optional()
    .describe("Anthropic API 키 (없으면 ANTHROPIC_API_KEY 환경변수 사용)")
}).strict();

// ============ Type Exports ============
export type StartDraftInput = z.infer<typeof StartDraftInputSchema>;
export type GetStatusInput = z.infer<typeof GetStatusInputSchema>;
export type ApplyFeedbackInput = z.infer<typeof ApplyFeedbackInputSchema>;
export type FinalizeDraftInput = z.infer<typeof FinalizeDraftInputSchema>;
export type StartReviewInput = z.infer<typeof StartReviewInputSchema>;
export type ApplyReviewFeedbackInput = z.infer<typeof ApplyReviewFeedbackInputSchema>;
export type SaveBlogInput = z.infer<typeof SaveBlogInputSchema>;
export type DeployGithubInput = z.infer<typeof DeployGithubInputSchema>;
export type StartDraftProInput = z.infer<typeof StartDraftProInputSchema>;
export type ApplyFeedbackProInput = z.infer<typeof ApplyFeedbackProInputSchema>;

// ============ Response Types ============
export interface BlogMetadata {
  [key: string]: unknown;
  title: string;
  tags: string[];
  estimatedReadTime: string;
}

export interface TaskResult {
  [key: string]: unknown;
  draft?: string;
  improved?: string;
  metadata?: BlogMetadata;
  changes?: string[];
  analysis?: Record<string, unknown>;  // Pro Mode 분석 결과
}

export interface FeedbackEntry {
  feedback: string;
  appliedAt: string;
}

export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  progress: number;
  input: Record<string, unknown>;
  result: TaskResult | null;
  history: FeedbackEntry[];
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartTaskOutput {
  [key: string]: unknown;
  task_id: string;
  status: TaskStatus;
  message: string;
}

export interface GetStatusOutput {
  [key: string]: unknown;
  task_id: string;
  status: TaskStatus;
  progress: number;
  result?: TaskResult;
  error?: string;
}

export interface FinalizeOutput {
  [key: string]: unknown;
  draft: string;
  metadata: BlogMetadata;
  message: string;
}

export interface SaveOutput {
  [key: string]: unknown;
  filepath: string;
  message: string;
}

export interface DeployOutput {
  [key: string]: unknown;
  url: string;
  deployed: boolean;
  message: string;
}

// ============ Output Zod Schemas (for MCP outputSchema) ============

// 블로그 메타데이터 스키마
export const BlogMetadataOutputSchema = z.object({
  title: z.string().describe("블로그 글 제목"),
  tags: z.array(z.string()).describe("태그 목록"),
  estimatedReadTime: z.string().describe("예상 읽기 시간")
}).passthrough();

// 작업 결과 스키마
export const TaskResultOutputSchema = z.object({
  draft: z.string().optional().describe("생성된 초안"),
  improved: z.string().optional().describe("개선된 글"),
  metadata: BlogMetadataOutputSchema.optional().describe("메타데이터"),
  changes: z.array(z.string()).optional().describe("변경 사항 목록"),
  analysis: z.record(z.unknown()).optional().describe("Pro Mode 분석 결과")
}).passthrough();

// blog_start_draft, blog_apply_feedback 출력 스키마
export const StartTaskOutputSchema = z.object({
  task_id: z.string().describe("작업 추적용 고유 ID"),
  status: z.nativeEnum(TaskStatus).describe("작업 상태"),
  model: z.string().optional().describe("사용된 AI 모델"),
  message: z.string().describe("안내 메시지")
}).passthrough();

// blog_get_status 출력 스키마
export const GetStatusOutputSchema = z.object({
  task_id: z.string().describe("작업 ID"),
  status: z.nativeEnum(TaskStatus).describe("작업 상태: pending, in_progress, completed, failed"),
  progress: z.number().min(0).max(100).describe("진행률 (0-100)"),
  result: TaskResultOutputSchema.optional().describe("완료 시 결과"),
  error: z.string().optional().describe("실패 시 오류 메시지")
}).passthrough();

// blog_finalize_draft 출력 스키마
export const FinalizeOutputSchema = z.object({
  draft: z.string().describe("최종 확정된 블로그 초안"),
  metadata: BlogMetadataOutputSchema.describe("블로그 메타데이터"),
  message: z.string().describe("안내 메시지")
}).passthrough();

// blog_save 출력 스키마
export const SaveOutputSchema = z.object({
  filepath: z.string().describe("저장된 파일의 전체 경로"),
  message: z.string().describe("안내 메시지")
}).passthrough();

// blog_deploy_github 출력 스키마
export const DeployOutputSchema = z.object({
  url: z.string().describe("GitHub 커밋 URL"),
  deployed: z.boolean().describe("배포 성공 여부"),
  message: z.string().describe("안내 메시지")
}).passthrough();

// blog_start_review, blog_apply_review_feedback 출력 스키마
export const ReviewOutputSchema = z.object({
  task_id: z.string().describe("작업 ID"),
  status: z.nativeEnum(TaskStatus).describe("작업 상태"),
  model: z.string().optional().describe("사용된 AI 모델"),
  message: z.string().describe("안내 메시지")
}).passthrough();

// blog_start_draft_pro 출력 스키마
export const StartDraftProOutputSchema = z.object({
  task_id: z.string().describe("작업 추적용 고유 ID"),
  status: z.nativeEnum(TaskStatus).describe("작업 상태"),
  message: z.string().describe("안내 메시지")
}).passthrough();

// Pro Mode 분석 결과 (Gemini Researcher 출력)
export interface GeminiAnalysis {
  [key: string]: unknown;
  summary: string;
  problem: string;
  approach: string;
  key_decisions: string[];
  technical_insights: string[];
  narrative_hooks: string[];
}
