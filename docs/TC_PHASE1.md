# SkillHub Phase 1 Test Cases

> 📋 작성일: 2026-02-08
> 
> **Phase 1 범위**: Database, Authentication, Quality Score System
> 
> **작성자**: QA Lead (Thrall)

---

## 목차

1. [Database (DB)](#1-database-db)
2. [Authentication (AUTH)](#2-authentication-auth)
3. [Quality Score (SCORE)](#3-quality-score-score)
4. [API Endpoints (API)](#4-api-endpoints-api)

---

## 1. Database (DB)

### TC-DB-001: Prisma 마이그레이션 성공

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- PostgreSQL 데이터베이스 실행 중
- DATABASE_URL 환경 변수 설정됨
- 이전 마이그레이션 없는 클린 상태

#### 테스트 단계
1. `npx prisma migrate dev --name init` 실행
2. 마이그레이션 완료 확인
3. 데이터베이스에 테이블 생성 확인

#### 예상 결과
- 마이그레이션 성공 메시지 출력
- 모든 모델 테이블 생성: User, Skill, Tag, SkillTag, Tool, SkillTool, UseCase, TargetRole, QualityScore, Review, Bookmark, Install
- Enum 타입 생성: SkillStatus, Grade
- 인덱스 생성 확인

#### 엣지 케이스
- 기존 테이블이 있는 경우 충돌 처리
- 마이그레이션 중 연결 끊김 시 롤백

---

### TC-DB-002: User 모델 CRUD 동작

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- 마이그레이션 완료
- Prisma Client 생성됨

#### 테스트 단계
1. User 생성 (githubId, username 필수)
2. User 조회 (id, githubId, username으로)
3. User 수정 (email, avatarUrl)
4. User 삭제

#### 예상 결과
- CREATE: cuid() 형식 id 자동 생성, createdAt/updatedAt 자동 설정
- READ: 정확한 데이터 반환
- UPDATE: updatedAt 자동 갱신
- DELETE: 성공

#### 엣지 케이스
- githubId 중복 시 unique constraint 에러
- username 중복 시 unique constraint 에러
- 존재하지 않는 User 삭제 시 에러

---

### TC-DB-003: Skill 모델 unique 제약 조건

**우선순위**: P0
**유형**: Unit

#### 사전 조건
- User 1명 생성됨

#### 테스트 단계
1. Skill 생성 (name: "test-skill", authorId: userId)
2. 동일 authorId + name으로 두 번째 Skill 생성 시도
3. 다른 authorId로 동일 name Skill 생성 시도
4. 동일 sourceOwner + sourceRepo + sourcePath로 Skill 생성 시도

#### 예상 결과
- 1번: 성공
- 2번: unique constraint 에러 (@@unique([authorId, name]))
- 3번: 성공 (다른 저자는 같은 이름 사용 가능)
- 4번: unique constraint 에러 (@@unique([sourceOwner, sourceRepo, sourcePath]))

#### 엣지 케이스
- name에 특수문자 포함 시 처리
- sourcePath가 빈 문자열인 경우

---

### TC-DB-004: Skill 소프트 삭제 동작

**우선순위**: P1
**유형**: Unit

#### 사전 조건
- Skill 1개 생성됨

#### 테스트 단계
1. Skill의 deletedAt 필드를 현재 시간으로 업데이트
2. deletedAt이 null인 스킬만 조회하는 쿼리 실행
3. 삭제된 스킬 복구 (deletedAt을 null로)

#### 예상 결과
- deletedAt 설정 시 해당 스킬 조회에서 제외
- deletedAt null로 설정 시 다시 조회 가능

#### 엣지 케이스
- 이미 삭제된 스킬 재삭제 시도
- deletedAt 인덱스 활용 확인

---

### TC-DB-005: QualityScore - Skill 1:1 관계

**우선순위**: P0
**유형**: Unit

#### 사전 조건
- Skill 1개 생성됨

#### 테스트 단계
1. Skill에 QualityScore 생성
2. 동일 Skill에 두 번째 QualityScore 생성 시도
3. Skill 삭제 시 QualityScore cascade 삭제 확인

#### 예상 결과
- 1번: 성공
- 2번: unique constraint 에러 (skillId @unique)
- 3번: QualityScore도 함께 삭제 (onDelete: Cascade)

#### 엣지 케이스
- QualityScore 없는 Skill 조회 시 null 처리

---

### TC-DB-006: Review rating 범위 제약

**우선순위**: P0
**유형**: Unit

#### 사전 조건
- User, Skill 생성됨
- `ALTER TABLE "Review" ADD CONSTRAINT rating_range CHECK (rating >= 1 AND rating <= 5)` 실행됨

#### 테스트 단계
1. rating: 1 리뷰 생성
2. rating: 5 리뷰 생성
3. rating: 0 리뷰 생성 시도
4. rating: 6 리뷰 생성 시도
5. rating: -1 리뷰 생성 시도

#### 예상 결과
- 1-2번: 성공
- 3-5번: CHECK constraint 위반 에러

#### 엣지 케이스
- 소수점 rating (예: 3.5) 시도 → Int 타입이므로 타입 에러

---

### TC-DB-007: Review 스킬당 1리뷰 제약

**우선순위**: P0
**유형**: Unit

#### 사전 조건
- User 1명, Skill 1개 생성됨

#### 테스트 단계
1. User가 Skill에 리뷰 작성
2. 동일 User가 동일 Skill에 두 번째 리뷰 시도
3. 다른 User가 동일 Skill에 리뷰 작성

#### 예상 결과
- 1번: 성공
- 2번: unique constraint 에러 (@@unique([skillId, authorId]))
- 3번: 성공

#### 엣지 케이스
- 리뷰 삭제 후 동일 유저 재작성 가능 여부

---

### TC-DB-008: Cascade 삭제 동작

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- User 생성
- 해당 User가 등록한 Skill 생성
- Skill에 SkillTag, UseCase, QualityScore, Review, Bookmark, Install 연결

#### 테스트 단계
1. Skill 삭제
2. 연관된 SkillTag, UseCase, TargetRole, QualityScore 삭제 확인
3. Review, Bookmark, Install 삭제 확인

#### 예상 결과
- Skill 삭제 시 onDelete: Cascade 설정된 모든 관계 데이터 삭제
- 부모 테이블(User, Tag, Tool)은 유지

#### 엣지 케이스
- User 삭제 시 해당 User의 Skill, Review, Bookmark, Install 처리

---

### TC-DB-009: 인덱스 성능 확인

**우선순위**: P1
**유형**: Integration

#### 사전 조건
- 대량 테스트 데이터 (Skill 1000개 이상)

#### 테스트 단계
1. `EXPLAIN ANALYZE`로 다음 쿼리 실행:
   - `SELECT * FROM "Skill" WHERE status = 'ACTIVE'`
   - `SELECT * FROM "Skill" WHERE "authorId" = ?`
   - `SELECT * FROM "Skill" ORDER BY "createdAt" DESC LIMIT 20`
   - `SELECT * FROM "QualityScore" WHERE grade = 'S'`
2. 인덱스 사용 여부 확인

#### 예상 결과
- 모든 쿼리에서 Index Scan 사용
- Full Table Scan 없음

#### 엣지 케이스
- 인덱스가 사용되지 않는 조건 조합

---

### TC-DB-010: SkillTool 관계 정확성

**우선순위**: P1
**유형**: Unit

#### 사전 조건
- Skill 1개, Tool 3개 생성

#### 테스트 단계
1. Skill에 required Tool 2개 연결
2. Skill에 optional Tool 1개 연결
3. Skill 조회 시 requiredTools, optionalTools 분리 확인

#### 예상 결과
- requiredTools에 2개 Tool
- optionalTools에 1개 Tool
- 중복 연결 방지 (@@id([skillId, toolId]))

#### 엣지 케이스
- 동일 Tool을 required와 optional 모두 연결 시도

---

## 2. Authentication (AUTH)

### TC-AUTH-001: GitHub OAuth 로그인 플로우 성공

**우선순위**: P0
**유형**: E2E

#### 사전 조건
- GitHub OAuth App 설정 완료
- GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET 환경 변수 설정
- 테스트용 GitHub 계정 준비

#### 테스트 단계
1. `/auth/github` 접근
2. GitHub 로그인 페이지 리다이렉트 확인
3. GitHub에서 인증 완료
4. 콜백 URL로 리다이렉트
5. 세션 쿠키 생성 확인

#### 예상 결과
- GitHub 인증 후 앱으로 리다이렉트
- HTTP-only secure 쿠키 생성
- 새 사용자인 경우 User 레코드 생성
- 기존 사용자인 경우 세션만 생성

#### 엣지 케이스
- GitHub 인증 취소 시 `/auth/github/error`로 리다이렉트
- GitHub API 장애 시 에러 처리

---

### TC-AUTH-002: 기존 사용자 재로그인

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- 이미 등록된 User (githubId 존재)

#### 테스트 단계
1. 동일 GitHub 계정으로 로그인
2. User 레코드 중복 생성 여부 확인
3. 기존 User 정보 업데이트 확인 (avatarUrl 변경 등)

#### 예상 결과
- 새 User 생성 안 함
- 기존 User의 updatedAt 갱신
- GitHub에서 변경된 정보 반영

#### 엣지 케이스
- GitHub username 변경 시 처리

---

### TC-AUTH-003: 세션 토큰 HTTP-only 쿠키 저장

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- 로그인 완료

#### 테스트 단계
1. 브라우저 개발자 도구에서 쿠키 확인
2. JavaScript로 쿠키 접근 시도 (`document.cookie`)
3. 쿠키 속성 확인

#### 예상 결과
- 세션 쿠키가 HttpOnly 플래그 설정
- Secure 플래그 설정 (HTTPS)
- JavaScript에서 접근 불가

#### 엣지 케이스
- localhost 개발 환경에서 Secure 플래그 처리

---

### TC-AUTH-004: 세션 만료 처리

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- 로그인된 세션 존재

#### 테스트 단계
1. 세션 만료 시간 경과 (7일)
2. 인증 필요 API 호출
3. 세션 갱신 시나리오 테스트

#### 예상 결과
- 만료된 세션으로 요청 시 401 Unauthorized
- 만료 전 활동 시 세션 갱신 동작 확인

#### 엣지 케이스
- 세션 만료 직전 요청 처리
- 시간대(timezone) 차이로 인한 문제

---

### TC-AUTH-005: 로그아웃 동작

**우선순위**: P0
**유형**: E2E

#### 사전 조건
- 로그인된 상태

#### 테스트 단계
1. 로그아웃 API/버튼 실행
2. 세션 쿠키 삭제 확인
3. 인증 필요 페이지 접근 시도

#### 예상 결과
- 세션 쿠키 삭제됨
- 인증 필요 페이지 접근 시 로그인 리다이렉트

#### 엣지 케이스
- 이미 로그아웃된 상태에서 재로그아웃
- 다중 탭에서 로그아웃 시 다른 탭 상태

---

### TC-AUTH-006: 비인증 사용자 보호 라우트 접근

**우선순위**: P0
**유형**: E2E

#### 사전 조건
- 로그인하지 않은 상태

#### 테스트 단계
1. `/me` 접근 시도
2. `/me/skills` 접근 시도
3. `/submit` 접근 시도

#### 예상 결과
- 모든 보호 라우트에서 로그인 페이지로 리다이렉트
- 원래 접근하려던 URL 저장 (로그인 후 리다이렉트용)

#### 엣지 케이스
- 딥링크로 보호 라우트 직접 접근 시

---

### TC-AUTH-007: 스킬 소유자 권한 검증

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- User A가 등록한 Skill 존재
- User B 로그인 상태

#### 테스트 단계
1. User B가 User A의 스킬 수정 시도 (PUT /api/skills/:id)
2. User B가 User A의 스킬 삭제 시도 (DELETE /api/skills/:id)
3. User A가 자신의 스킬 수정/삭제

#### 예상 결과
- 1-2번: 403 Forbidden, "본인의 스킬만 수정할 수 있습니다"
- 3번: 성공

#### 엣지 케이스
- 존재하지 않는 스킬에 대한 수정/삭제 시도 (404 vs 403 순서)

---

### TC-AUTH-008: OAuth 콜백 에러 처리

**우선순위**: P0
**유형**: E2E

#### 사전 조건
- GitHub OAuth 설정 완료

#### 테스트 단계
1. 잘못된 state 파라미터로 콜백 호출
2. 만료된 code로 콜백 호출
3. access_denied 에러 파라미터로 콜백

#### 예상 결과
- `/auth/github/error`로 리다이렉트
- 적절한 에러 메시지 표시
- 세션 생성 안 됨

#### 엣지 케이스
- CSRF 공격 시도 (state 불일치)

---

### TC-AUTH-009: 동시 세션 처리

**우선순위**: P1
**유형**: Integration

#### 사전 조건
- 동일 사용자가 여러 기기에서 로그인

#### 테스트 단계
1. 기기 A에서 로그인
2. 기기 B에서 동일 계정 로그인
3. 기기 A에서 인증 필요 요청

#### 예상 결과
- 두 세션 모두 유효 (다중 세션 허용)
- 또는 정책에 따라 기존 세션 무효화

#### 엣지 케이스
- 세션 수 제한이 있는 경우 처리

---

### TC-AUTH-010: 토큰 탈취 방어

**우선순위**: P0
**유형**: Security

#### 사전 조건
- 유효한 세션 토큰

#### 테스트 단계
1. 다른 IP에서 동일 토큰으로 요청
2. 세션 정보와 요청 정보 불일치 감지

#### 예상 결과
- 의심스러운 요청 로깅
- 정책에 따라 세션 무효화 또는 추가 인증 요구

#### 엣지 케이스
- VPN/프록시 사용자 오탐 방지

---

## 3. Quality Score (SCORE)

### TC-SCORE-001: Core 필드 완성도 점수 계산

**우선순위**: P0
**유형**: Unit

#### 사전 조건
- 품질 점수 계산 모듈 구현됨

#### 테스트 단계
1. 모든 Core 필드 (name, description, version, tags, author) 있는 경우
2. 1개 필드 누락
3. 모든 필드 누락
4. 빈 문자열/빈 배열 필드

#### 예상 결과
- 모든 필드 존재: 25점
- 필드당 5점씩 감점
- 모든 필드 누락: 0점
- 빈 값은 누락과 동일 처리

#### 엣지 케이스
- tags가 빈 배열인 경우
- author가 null vs 빈 문자열

---

### TC-SCORE-002: Description 품질 점수 계산

**우선순위**: P0
**유형**: Unit

#### 사전 조건
- AI 분석 모듈 또는 규칙 기반 분석

#### 테스트 단계
1. 50자 미만 description
2. 50-100자 일반 description
3. 문제-해결 구조가 명확한 description
4. 200자 이상 상세한 description

#### 예상 결과
- 50자 미만: 0점
- 기본 점수 + 문제-해결 구조: +10점
- 최대 20점

#### 엣지 케이스
- 마크다운 포함 시 문자 수 계산
- 비ASCII 문자(한글 등) 처리

---

### TC-SCORE-003: Runtime 명세 점수 계산

**우선순위**: P0
**유형**: Unit

#### 사전 조건
- Frontmatter에 runtime 관련 필드 존재

#### 테스트 단계
1. minModel만 있는 경우 → 5점
2. tools.required만 있는 경우 → 5점
3. tools.optional만 있는 경우 → 5점
4. 모두 있는 경우 → 15점
5. 아무것도 없는 경우 → 0점

#### 예상 결과
- minModel: +5점
- tools.required: +5점
- tools.optional: +5점
- 총 15점 만점

#### 엣지 케이스
- tools가 빈 배열인 경우
- 유효하지 않은 모델명

---

### TC-SCORE-004: Resources 힌트 점수 계산

**우선순위**: P0
**유형**: Unit

#### 사전 조건
- Frontmatter에 resources 관련 필드

#### 테스트 단계
1. baseTokens만 있는 경우 → 8점
2. contextHint만 있는 경우 → 7점
3. 둘 다 있는 경우 → 15점
4. 둘 다 없는 경우 → 0점

#### 예상 결과
- baseTokens: +8점
- contextHint: +7점
- 총 15점 만점

#### 엣지 케이스
- baseTokens가 0인 경우
- contextHint가 빈 문자열인 경우

---

### TC-SCORE-005: Use-cases 명확성 점수 계산

**우선순위**: P0
**유형**: Unit

#### 사전 조건
- Frontmatter에 useCases 배열

#### 테스트 단계
1. use-cases 0개 → 0점
2. use-cases 1개 → 5점
3. use-cases 2개 → 10점
4. use-cases 3개 이상 → 15점

#### 예상 결과
- 개수에 따른 점수 차등 적용
- 최대 15점

#### 엣지 케이스
- 중복된 use-case 처리
- 빈 문자열 use-case 처리

---

### TC-SCORE-006: Dependencies 관리 점수 계산

**우선순위**: P0
**유형**: Unit

#### 사전 조건
- Frontmatter에 dependencies 섹션

#### 테스트 단계
1. dependencies 없는 경우 → 10점 (만점)
2. dependencies 명시만 된 경우 → 5점
3. dependencies + 버전 범위까지 명시 → 10점
4. dependencies 있지만 버전 없는 경우

#### 예상 결과
- 의존성 없음: 10점 (완전 독립적)
- 의존성 명시: +5점
- 버전 범위: +5점

#### 엣지 케이스
- 잘못된 버전 포맷 (semver 아닌 경우)
- 순환 의존성 언급

---

### TC-SCORE-007: 총점 및 등급 산출

**우선순위**: P0
**유형**: Unit

#### 사전 조건
- 각 항목별 점수 계산 완료

#### 테스트 단계
1. 총점 95점 → S등급
2. 총점 85점 → A등급
3. 총점 75점 → B등급
4. 총점 65점 → C등급
5. 총점 55점 → D등급
6. 경계값 테스트 (90, 80, 70, 60)

#### 예상 결과
- 90-100: S (Premium)
- 80-89: A (Verified)
- 70-79: B (Standard)
- 60-69: C (Basic)
- 0-59: D (Incomplete)

#### 엣지 케이스
- 정확히 경계값인 경우 (90점 → S? A?)
- 소수점 점수 처리

---

### TC-SCORE-008: 점수 개선 팁 생성

**우선순위**: P1
**유형**: Unit

#### 사전 조건
- 점수 분석 완료

#### 테스트 단계
1. Description 점수 낮을 때 팁 확인
2. Runtime 점수 낮을 때 팁 확인
3. 모든 영역 만점일 때 팁 없음 확인

#### 예상 결과
- 각 부족한 영역에 대한 구체적 개선 제안
- "Resources에 contextHint 추가하면 +3점" 형식
- 만점 시 빈 배열

#### 엣지 케이스
- 여러 개선점이 있을 때 우선순위

---

### TC-SCORE-009: Frontmatter 파싱 성공

**우선순위**: P0
**유형**: Unit

#### 사전 조건
- 유효한 YAML Frontmatter 포함 마크다운

#### 테스트 단계
1. 표준 Frontmatter 파싱
```yaml
---
name: test-skill
description: Test description
version: 1.0.0
tags: [test, demo]
---
```
2. 중첩 객체 파싱
3. 배열 필드 파싱

#### 예상 결과
- 모든 필드 정확히 파싱
- 타입 변환 정확 (string, number, array, object)

#### 엣지 케이스
- Frontmatter 구분자(---) 없는 경우
- 잘못된 YAML 문법
- 빈 Frontmatter

---

### TC-SCORE-010: Frontmatter 파싱 실패 처리

**우선순위**: P0
**유형**: Unit

#### 사전 조건
- 잘못된 형식의 Frontmatter

#### 테스트 단계
1. YAML 문법 오류 (들여쓰기 오류)
2. 지원하지 않는 데이터 타입
3. 과도하게 깊은 중첩 (보안)
4. Frontmatter 없는 경우

#### 예상 결과
- 명확한 에러 메시지 반환
- 오류 위치(줄 번호) 포함
- safe mode로 악의적 YAML 차단

#### 엣지 케이스
- YAML 인젝션 시도 차단

---

### TC-SCORE-011: 분석 완료 시간 5초 이내

**우선순위**: P0
**유형**: Performance

#### 사전 조건
- 평균 크기의 Frontmatter (약 50줄)

#### 테스트 단계
1. 분석 시작 시간 기록
2. 파싱 + 점수 계산 + 팁 생성
3. 완료 시간 기록
4. 100회 반복 평균 측정

#### 예상 결과
- 평균 완료 시간 < 5초
- 95 percentile < 5초

#### 엣지 케이스
- 매우 큰 Frontmatter (1000줄)
- AI 분석 포함 시 타임아웃 처리

---

### TC-SCORE-012: QualityScore 저장 및 조회

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- Skill 생성됨
- 분석 완료

#### 테스트 단계
1. 분석 결과 QualityScore 테이블에 저장
2. Skill 조회 시 QualityScore include
3. QualityScore 업데이트 (재분석 시)

#### 예상 결과
- 모든 항목별 점수 저장
- 총점, 등급 저장
- analysisComment, improvementTips 저장
- analyzedAt 타임스탬프

#### 엣지 케이스
- 재분석 시 기존 QualityScore 업데이트 vs 새로 생성

---

## 4. API Endpoints (API)

### TC-API-001: GET /api/skills 목록 조회

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- ACTIVE 상태 스킬 10개 존재
- PENDING, ARCHIVED 상태 스킬 각 1개

#### 테스트 단계
1. 기본 요청 (파라미터 없이)
2. page, limit 파라미터 테스트
3. 응답 형식 확인

#### 예상 결과
- ACTIVE 상태 스킬만 반환
- 기본 limit: 20
- meta에 page, limit, total 포함
- author, qualityScore 포함

#### 엣지 케이스
- 스킬 0개일 때 빈 배열 반환
- limit 100 초과 시 100으로 제한

---

### TC-API-002: GET /api/skills 필터링

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- 다양한 태그, 등급의 스킬 존재

#### 테스트 단계
1. q 파라미터로 검색
2. tags 파라미터로 필터
3. grade 파라미터로 최소 등급 필터
4. model 파라미터로 필터
5. author 파라미터로 필터
6. 복합 필터

#### 예상 결과
- 각 필터 조건에 맞는 결과만 반환
- 복합 필터 시 AND 조건

#### 엣지 케이스
- 존재하지 않는 태그로 필터 → 빈 배열
- 특수문자 포함 검색어

---

### TC-API-003: GET /api/skills 정렬

**우선순위**: P1
**유형**: Integration

#### 사전 조건
- 다양한 점수, 생성일의 스킬 존재

#### 테스트 단계
1. sort=score (품질 점수 내림차순)
2. sort=recent (최신순)
3. sort=popular (인기순 - 설치 수)

#### 예상 결과
- 지정된 기준으로 정렬
- 기본값은 score

#### 엣지 케이스
- 동일 점수 시 2차 정렬 기준

---

### TC-API-004: GET /api/skills/:author/:name 상세 조회

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- woosgem/code-reviewer 스킬 존재

#### 테스트 단계
1. GET /api/skills/woosgem/code-reviewer
2. 모든 관련 데이터 포함 확인

#### 예상 결과
- 스킬 상세 정보 반환
- tags, requiredTools, optionalTools, useCases, qualityScore 포함
- author 정보 포함

#### 엣지 케이스
- 존재하지 않는 스킬 → 404
- 삭제된 스킬(deletedAt not null) → 404

---

### TC-API-005: POST /api/skills 스킬 등록

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- 인증된 사용자
- 유효한 GitHub URL

#### 테스트 단계
1. 유효한 githubUrl로 요청
2. Frontmatter 자동 파싱 확인
3. status: PENDING으로 생성 확인
4. 분석 완료 후 ACTIVE 전환 확인

#### 예상 결과
- 스킬 생성 성공
- 201 Created 응답
- 생성된 스킬 데이터 반환

#### 엣지 케이스
- 비공개 저장소 URL
- 존재하지 않는 저장소
- Frontmatter 없는 파일

---

### TC-API-006: POST /api/skills 입력 검증

**우선순위**: P0
**유형**: Unit

#### 사전 조건
- 인증된 사용자

#### 테스트 단계
1. githubUrl 없이 요청 → 400
2. 잘못된 URL 형식 → 400
3. GitHub 외 URL (gitlab 등) → 400
4. URL 500자 초과 → 400

#### 예상 결과
- VALIDATION_ERROR 코드
- 명확한 에러 메시지
- 어떤 필드가 문제인지 details에 포함

#### 엣지 케이스
- github.com 서브도메인 (raw.githubusercontent.com)
- 특수문자 포함 저장소명

---

### TC-API-007: POST /api/skills 중복 방지

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- 이미 등록된 스킬 존재

#### 테스트 단계
1. 동일 GitHub 소스로 재등록 시도
2. 동일 author/name으로 다른 소스 등록 시도

#### 예상 결과
- 409 Conflict
- "이 스킬은 이미 등록되어 있습니다" 메시지

#### 엣지 케이스
- 삭제된 스킬과 동일 소스 재등록

---

### TC-API-008: PUT /api/skills/:id 스킬 수정

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- 본인이 등록한 스킬 존재
- 인증된 상태

#### 테스트 단계
1. 유효한 수정 요청
2. 부분 수정 (일부 필드만)
3. 본인 스킬이 아닌 경우

#### 예상 결과
- 1-2번: 성공, updatedAt 갱신
- 3번: 403 Forbidden

#### 엣지 케이스
- 비어있는 body로 요청

---

### TC-API-009: DELETE /api/skills/:id 스킬 삭제

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- 본인이 등록한 스킬 존재

#### 테스트 단계
1. 본인 스킬 삭제
2. 삭제 후 조회 시도
3. 타인 스킬 삭제 시도

#### 예상 결과
- 1번: 성공 (soft delete - deletedAt 설정)
- 2번: 404 Not Found
- 3번: 403 Forbidden

#### 엣지 케이스
- 이미 삭제된 스킬 재삭제

---

### TC-API-010: POST /api/recommend AI 추천

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- 분석 완료된 스킬 다수 존재

#### 테스트 단계
1. 자연어 쿼리로 추천 요청
```json
{
  "query": "코드 리뷰 도와줄 스킬 찾아줘",
  "limit": 5
}
```
2. 필터 조건 추가
3. 응답 스트리밍 확인

#### 예상 결과
- 추천 결과 1-10개 반환
- 각 결과에 추천 근거 포함
- 응답 시작 3초 이내

#### 엣지 케이스
- 매칭되는 스킬 없는 경우
- 쿼리 500자 초과

---

### TC-API-011: POST /api/recommend Rate Limit

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- 비회원 상태

#### 테스트 단계
1. 10회 연속 추천 요청
2. 11번째 요청

#### 예상 결과
- 1-10번: 성공
- 11번: 429 Rate Limited
- "요청이 너무 많습니다. 1시간 후 다시 시도해주세요."

#### 엣지 케이스
- IP 변경으로 우회 시도
- 회원 로그인 시 제한 리셋

---

### TC-API-012: POST /api/analyze Frontmatter 분석

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- Rate Limit 내

#### 테스트 단계
1. Frontmatter 문자열로 분석 요청
2. 품질 점수 미리보기 확인
3. 개선 제안 확인

#### 예상 결과
- 점수 breakdown 반환
- 등급 반환
- improvementTips 포함

#### 엣지 케이스
- 빈 Frontmatter
- 잘못된 형식

---

### TC-API-013: POST /api/analyze/url GitHub URL 분석

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- 유효한 GitHub 저장소

#### 테스트 단계
1. GitHub URL로 분석 요청
2. 저장소에서 Frontmatter 추출
3. 분석 결과 반환

#### 예상 결과
- 저장소 접근 성공
- Frontmatter 파싱 성공
- 품질 점수 반환

#### 엣지 케이스
- private 저장소 (GITHUB_ERROR)
- 네트워크 타임아웃
- Frontmatter 없는 저장소

---

### TC-API-014: GET /api/me 내 정보 조회

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- 인증된 사용자

#### 테스트 단계
1. /api/me 요청
2. 반환된 사용자 정보 확인

#### 예상 결과
- id, username, email, avatarUrl 반환
- 민감 정보(githubId 등) 제외 또는 포함 정책 확인

#### 엣지 케이스
- 비인증 시 401

---

### TC-API-015: Bookmark API CRUD

**우선순위**: P1
**유형**: Integration

#### 사전 조건
- 인증된 사용자
- 스킬 존재

#### 테스트 단계
1. POST /api/me/bookmarks/:skillId 북마크 추가
2. GET /api/me/bookmarks 북마크 목록
3. DELETE /api/me/bookmarks/:skillId 북마크 삭제
4. 중복 북마크 시도

#### 예상 결과
- 1번: 201 Created
- 2번: 북마크한 스킬 목록 반환
- 3번: 204 No Content
- 4번: 409 Conflict 또는 idempotent 처리

#### 엣지 케이스
- 존재하지 않는 스킬 북마크 시도
- 삭제된 스킬 북마크 조회 시 처리

---

### TC-API-016: 공통 에러 응답 형식

**우선순위**: P0
**유형**: Unit

#### 사전 조건
- 다양한 에러 상황

#### 테스트 단계
1. 400 에러 응답 형식 확인
2. 401 에러 응답 형식 확인
3. 404 에러 응답 형식 확인
4. 500 에러 응답 형식 확인

#### 예상 결과
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자 친화적 메시지",
    "details": []
  }
}
```

#### 엣지 케이스
- 예상치 못한 예외 시 민감 정보 노출 방지

---

### TC-API-017: SQL Injection 방어

**우선순위**: P0
**유형**: Security

#### 사전 조건
- API 엔드포인트 접근 가능

#### 테스트 단계
1. 검색 쿼리에 SQL 인젝션 시도
   - `q='; DROP TABLE users;--`
2. 필터 파라미터에 인젝션 시도

#### 예상 결과
- Prisma 파라미터 바인딩으로 차단
- 일반 문자열로 처리됨
- 데이터베이스 영향 없음

#### 엣지 케이스
- 중첩된 인젝션 시도
- Unicode 인코딩 우회

---

### TC-API-018: XSS 방어 (Description)

**우선순위**: P0
**유형**: Security

#### 사전 조건
- 스킬 등록 권한

#### 테스트 단계
1. description에 스크립트 삽입
   - `<script>alert('xss')</script>`
2. 등록 후 상세 페이지에서 확인
3. 목록에서 확인

#### 예상 결과
- DOMPurify로 새니타이징
- 스크립트 태그 제거 또는 이스케이프
- 실행되지 않음

#### 엣지 케이스
- 이벤트 핸들러 (`<img onerror="alert('xss')">`)
- SVG 기반 XSS

---

### TC-API-019: SSRF 방어

**우선순위**: P0
**유형**: Security

#### 사전 조건
- 스킬 등록 또는 분석 API

#### 테스트 단계
1. 내부 IP로 요청 시도
   - `https://github.com.192.168.1.1/...`
   - `https://127.0.0.1/...`
   - `https://localhost/...`
2. 허용되지 않은 호스트로 요청

#### 예상 결과
- GitHub URL만 허용
- 내부망 주소 차단
- 400 Bad Request

#### 엣지 케이스
- DNS 리바인딩 공격
- 리다이렉트를 통한 우회

---

### TC-API-020: Rate Limit 전역 설정

**우선순위**: P0
**유형**: Integration

#### 사전 조건
- Redis 연결 (Upstash)

#### 테스트 단계
1. 비회원: 100회/분 요청 후 초과
2. 회원: 1000회/분 요청 후 초과
3. Rate Limit 리셋 확인 (1분 후)

#### 예상 결과
- 제한 초과 시 429 응답
- `X-RateLimit-Remaining` 헤더
- `X-RateLimit-Reset` 헤더

#### 엣지 케이스
- Redis 연결 실패 시 동작 (fail open vs fail close)

---

## 부록: 테스트 커버리지 목표

| 영역 | 목표 커버리지 |
|------|--------------|
| 단위 테스트 | 80%+ |
| 통합 테스트 | 주요 API 100% |
| E2E 테스트 | 핵심 플로우 5개+ |
| 보안 테스트 | 주요 취약점 100% |

---

## 체크리스트

### Phase 1 테스트 완료 기준

- [ ] 모든 P0 테스트 케이스 통과
- [ ] P1 테스트 케이스 90% 이상 통과
- [ ] 보안 테스트 100% 통과
- [ ] 성능 목표 충족 (분석 < 5초)
- [ ] 접근성 자동 테스트 통과 (axe-core)

---

*작성: QA Lead (Thrall)*
*버전: v1.0*
*작성일: 2026-02-08*
