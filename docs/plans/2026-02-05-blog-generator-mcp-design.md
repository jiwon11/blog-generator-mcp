# Blog Generator MCP Server 설계

## 개요
Gemini로 블로그 초안을 생성하고 Claude로 검수하여 개인 기술 블로그 글을 자동 생성하는 MCP 서버

## 요구사항
- **목적**: 개인 기술 블로그 (TIL, 튜토리얼, 기술 정리, 트러블슈팅)
- **AI 역할**: Gemini 초안 생성 → Claude 검수/개선
- **입력 소스**: 키워드, 코드 스니펫, 메모, git push 내역
- **출력**: Markdown 생성 + 선택적 GitHub 배포
- **구현 언어**: TypeScript/Node.js

## 프로젝트 구조
```
blog-generator-mcp/
├── src/
│   ├── index.ts          # MCP 서버 진입점
│   ├── tools/
│   │   ├── generateDraft.ts    # Gemini 초안 생성
│   │   ├── reviewPost.ts       # Claude 검수/개선
│   │   ├── saveBlog.ts         # 로컬 Markdown 저장
│   │   └── deployGithub.ts     # GitHub 배포
│   ├── services/
│   │   ├── gemini.ts           # Gemini API 클라이언트
│   │   └── github.ts           # GitHub API 클라이언트
│   └── types.ts          # 타입 정의
├── package.json
├── tsconfig.json
└── README.md
```

## MCP 도구 스펙

### 1. generate_draft (Gemini 초안 생성)
```typescript
입력:
- input_type: "keyword" | "code" | "memo" | "git_push"
- content: string
- style?: "tutorial" | "til" | "deep-dive" | "troubleshooting"
- language?: "ko" | "en" (기본: ko)

출력:
- draft: string
- metadata: { title, tags, estimatedReadTime }
```

### 2. review_post (Claude 검수)
```typescript
입력:
- draft: string
- focus?: "accuracy" | "readability" | "seo" | "all"

출력:
- improved: string
- changes: string[]
```

### 3. save_blog (로컬 저장)
```typescript
입력:
- content: string
- filename?: string
- directory?: string (기본: ./posts)

출력:
- filepath: string
```

### 4. deploy_github (GitHub 배포)
```typescript
입력:
- filepath: string
- repo: string
- branch?: string (기본: main)
- commitMessage?: string

출력:
- url: string
- deployed: boolean
```

## API 연동

### 환경 변수
```bash
GEMINI_API_KEY=your_gemini_api_key
GITHUB_TOKEN=your_github_token
```

### 패키지 의존성
- `@google/generative-ai`: Gemini API
- `@octokit/rest`: GitHub API
- `@modelcontextprotocol/sdk`: MCP SDK

## 사용 예시
```
사용자: "React useEffect 훅에 대한 튜토리얼 블로그 글 작성해줘"

1. generate_draft → Gemini 초안 생성
2. review_post → Claude 검수/개선
3. save_blog → 로컬 저장
4. deploy_github → GitHub 배포 (선택)
```
