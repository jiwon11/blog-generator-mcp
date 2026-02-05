# Blog Generator MCP Server v2 설계

## 변경 요구사항
1. 다중 플랫폼 지원 (stdio + HTTP)
2. 다중 사용자 지원 (API 키 파라미터 전달)
3. 인터랙티브 워크플로우 (단계별 도구 분리)
4. 백그라운드 실행 + 알림

## 아키텍처

### 트랜스포트
- `--stdio`: 로컬 Claude Desktop/CLI용 (기본값)
- `--http --port 3000`: 원격 서버용

### 도구 구조 (8개)
| 도구명 | 설명 | 실행 방식 |
|--------|------|-----------|
| `blog_start_draft` | 초안 생성 시작 | 비동기 |
| `blog_get_status` | 작업 상태 조회 | 동기 |
| `blog_apply_feedback` | 사용자 피드백 반영 | 비동기 |
| `blog_finalize_draft` | 최종 초안 확정 | 동기 |
| `blog_start_review` | 검수 시작 | 비동기 |
| `blog_apply_review_feedback` | 검수 피드백 반영 | 비동기 |
| `blog_save` | 로컬 저장 | 동기 |
| `blog_deploy_github` | GitHub 배포 | 동기 |

### 상태 저장소
- SQLite 사용
- 서버 재시작에도 작업 상태 유지

### 배포 방식
- npm 패키지 + CLI

## 도구 상세 스펙

### 공통 파라미터
```typescript
gemini_api_key?: string
github_token?: string
```

### blog_start_draft
```typescript
입력:
- input_type: "keyword" | "code" | "memo" | "git_push"
- content: string
- style?: "tutorial" | "til" | "deep-dive" | "troubleshooting"
- language?: "ko" | "en"
- custom_prompt?: string
- gemini_api_key: string

출력:
- task_id: string
- status: "pending"
```

### blog_get_status
```typescript
입력:
- task_id: string

출력:
- task_id: string
- status: "pending" | "in_progress" | "completed" | "failed"
- progress?: number
- result?: { draft, metadata }
- error?: string
```

### blog_apply_feedback
```typescript
입력:
- task_id: string
- feedback: string
- gemini_api_key: string

출력:
- task_id: string
- status: "pending"
```

### blog_finalize_draft
```typescript
입력:
- task_id: string

출력:
- draft: string
- metadata: { title, tags, estimatedReadTime }
```

### blog_start_review
```typescript
입력:
- task_id?: string
- draft?: string
- focus?: "accuracy" | "readability" | "seo" | "all"
- custom_prompt?: string
- gemini_api_key: string

출력:
- task_id: string
- status: "pending"
```

## SQLite 스키마
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  input JSON NOT NULL,
  result JSON,
  history JSON,
  error TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 프로젝트 구조
```
blog-generator-mcp/
├── src/
│   ├── index.ts
│   ├── server.ts
│   ├── transports/
│   ├── tools/
│   ├── services/
│   └── types.ts
├── data/
└── package.json
```
