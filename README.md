# Blog Generator MCP Server

Gemini AI를 사용하여 블로그 초안을 생성하고, Claude가 검수하여 품질 높은 기술 블로그 글을 자동 생성하는 MCP 서버입니다.

## 기능

- **blog_generate_draft**: Gemini AI로 블로그 초안 생성
  - 키워드, 코드, 메모, git 변경사항 등 다양한 입력 지원
  - 튜토리얼, TIL, 딥다이브, 트러블슈팅 스타일 지원
  - 한국어/영어 지원

- **blog_review_post**: Claude가 블로그 초안을 검수하고 개선
  - 기술적 정확성, 가독성, SEO 최적화 등 검토

- **blog_save**: 블로그 글을 로컬 마크다운 파일로 저장

- **blog_deploy_github**: GitHub 저장소에 블로그 글 배포

## 설치

```bash
npm install -g blog-generator-mcp
```

또는 npx로 직접 실행:

```bash
npx blog-generator-mcp
```

## 환경 변수

```bash
# Gemini API 키 (필수 - blog_generate_draft 사용 시)
export GEMINI_API_KEY="your_gemini_api_key"

# GitHub Personal Access Token (필수 - blog_deploy_github 사용 시)
export GITHUB_TOKEN="your_github_token"
```

### API 키 발급

- **Gemini API 키**: [Google AI Studio](https://aistudio.google.com/app/apikey)에서 발급
- **GitHub Token**: [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)에서 발급 (repo 권한 필요)

## Claude Desktop 설정

`~/.config/claude/claude_desktop_config.json` (macOS/Linux) 또는 `%APPDATA%\Claude\claude_desktop_config.json` (Windows)에 다음 설정 추가:

```json
{
  "mcpServers": {
    "blog-generator": {
      "command": "npx",
      "args": ["-y", "blog-generator-mcp"],
      "env": {
        "GEMINI_API_KEY": "your_gemini_api_key",
        "GITHUB_TOKEN": "your_github_token"
      }
    }
  }
}
```

## 사용 예시

### 1. 키워드로 블로그 글 생성

```
"React useEffect 훅에 대한 튜토리얼을 작성해줘"

1. blog_generate_draft 호출
   → input_type: "keyword"
   → content: "React useEffect 훅"
   → style: "tutorial"

2. blog_review_post 호출
   → Claude가 초안 검수 및 개선

3. blog_save 호출
   → 로컬에 마크다운 파일 저장

4. blog_deploy_github 호출 (선택)
   → GitHub 저장소에 배포
```

### 2. 코드 설명 블로그 글 생성

```
"이 코드를 설명하는 블로그 글을 작성해줘"

→ input_type: "code"
→ content: "<your code>"
```

### 3. Git 변경사항으로 개발일지 생성

```
"오늘 커밋한 내용으로 TIL 블로그 글을 작성해줘"

→ input_type: "git_push"
→ content: "git diff 또는 commit 내용"
→ style: "til"
```

### 4. 트러블슈팅 글 작성

```
"이 버그 해결 과정을 블로그 글로 작성해줘"

→ input_type: "memo"
→ content: "버그 상황과 해결 메모"
→ style: "troubleshooting"
```

## 개발

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run dev

# 빌드
npm run build

# 실행
npm start
```

## 라이선스

MIT
