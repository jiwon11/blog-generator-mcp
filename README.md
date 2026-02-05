# Blog Generator MCP Server v2

Gemini AI를 사용하여 블로그 초안을 생성하고, Claude가 검수하여 품질 높은 기술 블로그 글을 자동 생성하는 MCP 서버입니다.

## v2 주요 기능

- **다중 플랫폼 지원**: stdio (로컬) + HTTP (원격 서버)
- **다중 사용자 지원**: API 키를 파라미터로 전달
- **인터랙티브 워크플로우**: 단계별 도구로 피드백 반영 가능
- **백그라운드 실행**: 긴 작업은 백그라운드에서 실행, 완료 시 알림

## 설치 및 실행

```bash
# npm에서 직접 실행
npx blog-generator-mcp

# stdio 모드 (기본값, Claude Desktop용)
npx blog-generator-mcp --stdio

# HTTP 서버 모드 (원격 서버용)
npx blog-generator-mcp --http --port 3000

# 데이터베이스 경로 지정
npx blog-generator-mcp --db ./my-data/tasks.db
```

## MCP 도구 목록

### 초안 생성 워크플로우
| 도구명 | 설명 |
|--------|------|
| `blog_start_draft` | 블로그 초안 생성 시작 (백그라운드) |
| `blog_get_status` | 작업 상태 조회 |
| `blog_apply_feedback` | 사용자 피드백 반영 |
| `blog_finalize_draft` | 최종 초안 확정 |

### 검수 워크플로우
| 도구명 | 설명 |
|--------|------|
| `blog_start_review` | 블로그 검수 시작 (백그라운드) |
| `blog_apply_review_feedback` | 검수 피드백 반영 |

### 저장 및 배포
| 도구명 | 설명 |
|--------|------|
| `blog_save` | 로컬 마크다운 파일로 저장 |
| `blog_deploy_github` | GitHub 저장소에 배포 |

## 사용 예시

### 1. 블로그 초안 생성

```
User: "React hooks에 대한 튜토리얼 블로그 글을 작성해줘"

1. blog_start_draft 호출
   → input_type: "keyword"
   → content: "React hooks"
   → style: "tutorial"
   → gemini_api_key: "your_key"
   → 반환: { task_id: "abc123", status: "pending" }

2. blog_get_status 호출 (작업 완료 확인)
   → task_id: "abc123"
   → 반환: { status: "completed", result: { draft: "...", metadata: {...} } }
```

### 2. 피드백 반영

```
User: "코드 예제를 더 추가해줘"

3. blog_apply_feedback 호출
   → task_id: "abc123"
   → feedback: "코드 예제를 더 추가해주세요"
   → gemini_api_key: "your_key"

4. blog_get_status로 결과 확인
```

### 3. 검수 및 저장

```
5. blog_start_review 호출
   → task_id: "abc123"
   → focus: "all"
   → gemini_api_key: "your_key"

6. blog_save 호출
   → task_id: "review_task_id"
   → directory: "./posts"

7. blog_deploy_github 호출 (선택)
   → task_id: "review_task_id"
   → repo: "user/blog"
   → target_path: "_posts/2024-01-15-react-hooks.md"
   → github_token: "your_token"
```

## 입력 유형

| 유형 | 설명 | 예시 |
|------|------|------|
| `keyword` | 키워드/주제 | "React hooks 사용법" |
| `code` | 코드 스니펫 | 코드를 설명하는 글 생성 |
| `memo` | 메모/노트 | 불릿포인트를 완성된 글로 |
| `git_push` | Git 변경사항 | 커밋 내역으로 개발일지 생성 |

## 글 스타일

| 스타일 | 설명 |
|--------|------|
| `tutorial` | 단계별 튜토리얼 (기본값) |
| `til` | Today I Learned 형식 |
| `deep-dive` | 심층 기술 분석 |
| `troubleshooting` | 문제 해결 과정 |

## 검수 초점

| 초점 | 설명 |
|------|------|
| `accuracy` | 기술적 정확성 |
| `readability` | 가독성 |
| `seo` | SEO 최적화 |
| `all` | 전체 검수 (기본값) |

## Claude Desktop 설정

`~/.config/claude/claude_desktop_config.json` (macOS/Linux):

```json
{
  "mcpServers": {
    "blog-generator": {
      "command": "npx",
      "args": ["-y", "blog-generator-mcp"]
    }
  }
}
```

## HTTP 서버로 배포

```bash
# 서버 실행
npx blog-generator-mcp --http --port 3000

# 헬스 체크
curl http://localhost:3000/health

# MCP 요청
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

## API 키 발급

- **Gemini API 키**: [Google AI Studio](https://aistudio.google.com/app/apikey)
- **GitHub Token**: [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens) (repo 권한 필요)

## 개발

```bash
# 의존성 설치
npm install

# 개발 모드
npm run dev

# 빌드
npm run build

# 실행
npm start
```

## 라이선스

MIT
