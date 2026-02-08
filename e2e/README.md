# SkillHub E2E 테스트

Playwright 기반 End-to-End 테스트 환경입니다.

## 📁 구조

```
e2e/
├── README.md           # 이 문서
├── home.spec.ts        # 홈페이지 테스트
├── auth.spec.ts        # 인증 테스트
├── api/
│   └── analyze.spec.ts # API 테스트
├── fixtures/
│   └── frontmatter.ts  # 테스트 데이터
└── reporters/
    └── json-reporter.ts # 커스텀 리포터

e2e-dashboard/
├── index.html          # 대시보드 UI
├── results.json        # 최신 테스트 결과 (자동 생성)
└── history.json        # 테스트 히스토리 (자동 생성)
```

## 🚀 실행 방법

### 기본 테스트 실행
```bash
pnpm test:e2e
```

### UI 모드 (추천)
브라우저에서 테스트 과정을 실시간으로 확인:
```bash
pnpm test:e2e:ui
```

### 디버그 모드
중단점 설정 및 단계별 실행:
```bash
pnpm test:e2e:debug
```

### 특정 테스트만 실행
```bash
pnpm test:e2e -- e2e/home.spec.ts
pnpm test:e2e -- --grep "검색"
```

## 📊 대시보드

### 대시보드 서버 실행
```bash
pnpm test:e2e:dashboard
```
→ http://localhost:3001 에서 확인

### 대시보드 기능
- 📈 테스트 결과 요약 (성공/실패/스킵)
- 🍩 결과 분포 차트
- 📉 성공률 추이 그래프 (최근 10회)
- 📋 스위트별 상세 결과
- 🖥️ 실행 환경 정보

## 🔧 설정

`playwright.config.ts`:

| 설정 | 값 | 설명 |
|------|-----|------|
| baseURL | http://localhost:3000 | 테스트 대상 URL |
| timeout | 30초 | 테스트 타임아웃 |
| retries | 0 (로컬), 2 (CI) | 재시도 횟수 |
| workers | auto (로컬), 1 (CI) | 병렬 실행 수 |

## 📝 테스트 작성 가이드

### 기본 구조
```typescript
import { test, expect } from '@playwright/test';

test.describe('기능명', () => {
  test('테스트 케이스', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SkillHub/);
  });
});
```

### API 테스트
```typescript
test('API 테스트', async ({ request }) => {
  const response = await request.post('/api/analyze', {
    data: { frontmatter: 'name: test' },
  });
  expect(response.ok()).toBeTruthy();
});
```

### Fixtures 사용
```typescript
import { sGradeFrontmatter } from './fixtures/frontmatter';

test('S등급 테스트', async ({ request }) => {
  const response = await request.post('/api/analyze', {
    data: { frontmatter: sGradeFrontmatter },
  });
  const json = await response.json();
  expect(json.data.scores.grade).toBe('S');
});
```

## 🎯 테스트 커버리지 목표

| 영역 | 현재 | 목표 |
|------|------|------|
| 홈페이지 | 4 | 10 |
| 인증 | 4 | 8 |
| API | 7 | 20 |
| 스킬 CRUD | 0 | 15 |
| 사용자 공간 | 0 | 10 |

## 📌 CI/CD 연동

GitHub Actions 예시:
```yaml
- name: E2E Tests
  run: |
    pnpm exec playwright install --with-deps
    pnpm test:e2e

- name: Upload Report
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

---

Made with ❤️ by WooSGem & Thrall ⚡
