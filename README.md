# Blog Generator MCP

AI를 활용한 기술 블로그 자동 생성 MCP 서버입니다.

---

## 빠른 시작

### 1. 설치

```bash
npx blog-generator-mcp
```

### 2. API 키 준비

- **Gemini API 키**: [Google AI Studio](https://aistudio.google.com/app/apikey)에서 발급
- **Anthropic API 키** (Pro Mode용): [Anthropic Console](https://console.anthropic.com/)에서 발급

### 환경변수 설정 (선택)

API 키를 매번 입력하지 않으려면 환경변수로 설정하세요:

```bash
export GEMINI_API_KEY="your-gemini-key"
export ANTHROPIC_API_KEY="your-anthropic-key"
export BLOG_SAVE_DIRECTORY="./my-posts"  # 기본 저장 경로
```

환경변수가 설정되면 파라미터 없이도 도구를 사용할 수 있습니다.

### 3. Claude Desktop 설정

`~/.config/claude/claude_desktop_config.json`:

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

Claude Desktop을 재시작하면 사용 준비 완료!

---

## 사용법

### 기본 워크플로우

```
1. blog_start_draft    → 초안 생성 시작
2. blog_get_status     → 완료 확인
3. blog_apply_feedback → (선택) 피드백 반영
4. blog_start_review   → 검수 시작
5. blog_save           → 파일 저장
```

### Pro Mode 워크플로우

**Gemini(분석) + Claude(작성)** 파이프라인으로 고품질 블로그 생성:

```
1. blog_start_draft_pro    → Gemini 분석 → Claude 작성
2. blog_get_status         → 완료 확인
3. blog_apply_feedback_pro → (선택) Claude로 피드백 반영
4. blog_start_review       → (선택) Gemini로 교차 검토
5. blog_save               → 파일 저장
```

---

## Pro Mode (v3.0)

Pro Mode는 **Gemini**와 **Claude**의 역할을 분담하여 마스터피스급 기술 블로그를 생성합니다.

### 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    blog_start_draft_pro                      │
│  ┌─────────────────┐         ┌─────────────────┐           │
│  │ Gemini Pro      │ ──────> │ Claude Opus     │           │
│  │ (Researcher)    │ 분석결과 │ (Writer)        │           │
│  │                 │         │                 │           │
│  │ - code_diff     │         │ - 분석 기반     │           │
│  │ - dev_log 분석  │         │ - 서사적 글쓰기 │           │
│  │ - 아키텍처 해석 │         │ - 인사이트 도출 │           │
│  └─────────────────┘         └─────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### blog_start_draft_pro - Pro 초안 생성

**필수 파라미터:**
```json
{
  "code_diff": "git diff 또는 변경된 코드",
  "gemini_api_key": "YOUR_GEMINI_KEY",
  "anthropic_api_key": "YOUR_ANTHROPIC_KEY"
}
```

**선택 파라미터:**
| 파라미터 | 설명 | 기본값 |
|---------|------|-------|
| `dev_log` | 개발자의 고민/메모/의사결정 과정 | - |
| `request` | 최우선 제약조건 (이 요청을 최우선으로 반영) | - |
| `style` | 글 스타일 | `deep-dive` |
| `language` | 언어 | `ko` |
| `instructions` | 상세 작성 지침 | - |

### blog_apply_feedback_pro - Pro 피드백 반영

**파라미터:**
```json
{
  "task_id": "Pro 작업 ID",
  "feedback": "수정 요청 사항",
  "anthropic_api_key": "YOUR_ANTHROPIC_KEY"
}
```

### Pro Mode 사용 예시

```
User: "오늘 인증 로직 리팩토링한 내용으로 블로그 써줘"

1. blog_start_draft_pro
   - code_diff: "<git diff 내용>"
   - dev_log: "기존 세션 기반에서 JWT로 전환. 보안 강화가 목표..."
   - request: "보안 관점에서 왜 이 방식을 선택했는지 강조"
   - gemini_api_key: "..."
   - anthropic_api_key: "..."

2. blog_get_status (완료 확인)

3. blog_apply_feedback_pro (선택)
   - feedback: "코드 예제에 주석을 더 추가해줘"
   - anthropic_api_key: "..."

4. blog_start_review (Gemini 교차 검토)
   - focus: "accuracy"

5. blog_save
   - directory: "./posts"
```

---

## 도구 상세 가이드

### blog_start_draft - 초안 생성

**필수 파라미터:**
```json
{
  "input_type": "keyword",
  "content": "React useEffect 훅 사용법",
  "gemini_api_key": "YOUR_API_KEY"
}
```

**선택 파라미터:**
| 파라미터 | 설명 | 기본값 |
|---------|------|-------|
| `style` | 글 스타일 | `tutorial` |
| `language` | 언어 | `ko` |
| `model` | Gemini 모델 | `gemini-1.5-flash` |
| `instructions` | 상세 작성 지침 | - |
| `custom_prompt` | 간단한 추가 요청 | - |

**입력 유형 (input_type):**
| 값 | 용도 | 예시 |
|----|------|------|
| `keyword` | 키워드로 글 생성 | "React hooks" |
| `code` | 코드 설명 글 | 코드 스니펫 |
| `memo` | 메모를 글로 확장 | 불릿포인트 메모 |
| `git_push` | 개발일지 생성 | git diff 내용 |

**글 스타일 (style):**
| 값 | 설명 |
|----|------|
| `tutorial` | 단계별 튜토리얼 |
| `til` | Today I Learned |
| `deep-dive` | 심층 분석 |
| `troubleshooting` | 문제 해결 과정 |

**사용 예시:**
```
"React hooks에 대한 튜토리얼을 작성해줘"

→ blog_start_draft 호출:
  - input_type: "keyword"
  - content: "React hooks"
  - style: "tutorial"
  - gemini_api_key: "YOUR_KEY"
```

---

### blog_get_status - 상태 확인

**파라미터:**
```json
{
  "task_id": "작업 ID"
}
```

**응답 예시:**
```json
{
  "task_id": "abc-123",
  "status": "completed",
  "progress": 100,
  "result": {
    "draft": "# React Hooks 완벽 가이드\n...",
    "metadata": {
      "title": "React Hooks 완벽 가이드",
      "tags": ["React", "Hooks", "JavaScript"],
      "estimatedReadTime": "10분"
    }
  }
}
```

**상태 값:**
| 상태 | 설명 |
|------|------|
| `pending` | 대기 중 |
| `in_progress` | 진행 중 |
| `completed` | 완료 |
| `failed` | 실패 |

---

### blog_apply_feedback - 피드백 반영

**파라미터:**
```json
{
  "task_id": "작업 ID",
  "feedback": "코드 예제를 더 추가해주세요",
  "gemini_api_key": "YOUR_KEY"
}
```

**사용 예시:**
```
"코드 예제를 더 추가하고, 초보자도 이해할 수 있게 설명을 보충해줘"

→ blog_apply_feedback 호출:
  - task_id: "이전 작업 ID"
  - feedback: "코드 예제를 더 추가하고, 초보자도 이해할 수 있게 설명을 보충해주세요"
```

---

### blog_start_review - 검수

**파라미터:**
```json
{
  "task_id": "초안 작업 ID",
  "focus": "all",
  "gemini_api_key": "YOUR_KEY"
}
```

**검수 초점 (focus):**
| 값 | 설명 |
|----|------|
| `accuracy` | 기술적 정확성 |
| `readability` | 가독성 |
| `seo` | SEO 최적화 |
| `all` | 전체 검수 (기본값) |

---

### blog_save - 파일 저장

**파라미터:**
```json
{
  "task_id": "작업 ID",
  "directory": "./posts"
}
```

**결과:**
```json
{
  "filepath": "./posts/2024-01-15-react-hooks-완벽-가이드.md"
}
```

---

### blog_deploy_github - GitHub 배포

**파라미터:**
```json
{
  "task_id": "작업 ID",
  "repo": "username/blog",
  "target_path": "_posts/2024-01-15-react-hooks.md",
  "github_token": "YOUR_GITHUB_TOKEN"
}
```

---

## 상세 지침 (instructions) 활용하기

`instructions` 파라미터 또는 `instructions_file`로 마크다운 파일 경로를 지정하여 AI가 따라야 할 상세한 작성 규칙을 지정할 수 있습니다.

### 파일로 관리하기

```
blog_start_draft 호출:
- input_type: "keyword"
- content: "Kubernetes 배포 전략"
- instructions_file: "./my-style-guide.md"
```

**둘 다 제공하면 병합됩니다:**
```
- instructions_file: "./my-style-guide.md"  // 기본 스타일 가이드
- instructions: "이번 글은 특히 보안에 집중해줘"  // 추가 요청
```

→ 파일 내용 + 파라미터 내용이 합쳐져서 적용됩니다.

### 예시: 회사 블로그 스타일 가이드

```
blog_start_draft 호출:
- input_type: "keyword"
- content: "Kubernetes 배포 전략"
- instructions: |
    ## 작성 스타일
    - 경어체 사용 (~합니다, ~입니다)
    - 문장은 짧고 명확하게
    - 한 단락은 3-4문장 이내

    ## 필수 포함 섹션
    1. 개요 (왜 이 주제가 중요한지)
    2. 핵심 개념 설명
    3. 실습 예제 (복사해서 바로 실행 가능)
    4. 주의사항 및 팁
    5. 마무리 및 다음 단계

    ## 코드 스타일
    - 모든 코드 블록에 언어 명시
    - 주석은 한국어로
    - 실제 동작하는 완전한 예제 제공

    ## 타겟 독자
    - 백엔드 개발 경력 1-3년차
    - Docker 기본 지식 보유
    - Kubernetes 입문자

    ## 금지 사항
    - "쉽습니다", "간단합니다" 등의 표현 금지
    - 불필요한 영어 표현 자제
```

### 예시: TIL 스타일

```
instructions: |
    ## 형식
    - 날짜와 제목으로 시작
    - 배운 내용을 불릿포인트로 정리
    - 실제 코드나 명령어 포함

    ## 톤
    - 개인적이고 솔직한 톤
    - 시행착오 과정도 포함
    - 다음에 더 알아볼 것 메모
```

---

## 모델 선택 가이드

| 모델 | 용도 | 특징 |
|------|------|------|
| `gemini-1.5-flash` | 일반 용도 (기본값) | 빠른 응답, 비용 효율적 |
| `gemini-1.5-flash-8b` | 간단한 작업 | 가장 빠름 |
| `gemini-1.5-pro` | 고품질 필요 시 | 복잡한 주제, 긴 글 |
| `gemini-2.0-flash` | 최신 기능 | 최신 모델 |

**추천:**
- 일반 블로그 글: `gemini-1.5-flash`
- 기술 심층 분석: `gemini-1.5-pro`
- 짧은 TIL: `gemini-1.5-flash-8b`

---

## 실전 예시

### 예시 1: 튜토리얼 작성

```
User: "Next.js App Router에 대한 튜토리얼을 작성해줘"

1. blog_start_draft
   - input_type: "keyword"
   - content: "Next.js App Router"
   - style: "tutorial"
   - model: "gemini-1.5-pro"
   - gemini_api_key: "..."

2. blog_get_status (완료 확인)

3. blog_apply_feedback
   - feedback: "서버 컴포넌트와 클라이언트 컴포넌트 차이를 더 자세히 설명해줘"

4. blog_start_review
   - focus: "accuracy"

5. blog_save
   - directory: "./content/posts"
```

### 예시 2: 개발일지 자동 생성

```
User: "오늘 커밋 내용으로 개발일지 써줘"

1. blog_start_draft
   - input_type: "git_push"
   - content: "<git diff 또는 commit log>
   - style: "til"
   - gemini_api_key: "..."

2. blog_get_status → blog_save
```

### 예시 3: 코드 설명 블로그

```
User: "이 코드를 설명하는 블로그 글을 작성해줘"

1. blog_start_draft
   - input_type: "code"
   - content: "<코드 내용>"
   - style: "deep-dive"
   - instructions: "코드의 동작 원리를 시각적으로 설명하고, 성능 관점에서 분석해줘"
```

---

## HTTP 서버 모드

여러 사용자가 공유하는 서버로 배포할 수 있습니다.

```bash
# HTTP 서버 시작
npx blog-generator-mcp --http --port 3000

# 헬스 체크
curl http://localhost:3000/health

# MCP 요청
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

---

## 문제 해결

### "Gemini API 키가 필요합니다"
→ `gemini_api_key` 파라미터에 API 키를 전달했는지 확인

### "작업을 찾을 수 없습니다"
→ `task_id`가 올바른지 확인. 서버 재시작 시 이전 작업은 유지됨

### "모델을 찾을 수 없습니다"
→ 지원되는 모델명 확인: `gemini-1.5-flash`, `gemini-1.5-pro` 등

### 응답이 느림
→ `gemini-1.5-flash` 대신 `gemini-1.5-flash-8b` 사용

---

## 라이선스

MIT
