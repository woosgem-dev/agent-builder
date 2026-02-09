# Agent Builder

> Find the right skills and build powerful agents.

AI 스킬을 찾고, 에이전트를 조립하는 플랫폼.

## 컨셉

**Skill Sommelier** — "이거 하고 싶어" → 최적의 스킬 추천

skills.sh 생태계의 메타데이터를 인덱싱하여, 이름 검색이 아닌 **의도 기반 검색**을 제공합니다.

## 로드맵

### Phase 1a: Skill Sommelier
- [ ] skills.sh 크롤러
- [ ] SKILL.md frontmatter 파싱
- [ ] 메타데이터 DB 인덱싱
- [ ] 자연어 검색 UI

### Phase 1b: Agent Builder
- [ ] 스킬 조합 에디터
- [ ] 페르소나 설정
- [ ] 채팅 플레이그라운드
- [ ] 저장 & 공유

### Phase 2: Squad
- [ ] 에이전트 조합
- [ ] 에이전트 간 협업 로직
- [ ] Squad 템플릿

## 스택

- **Frontend**: Next.js 14, Tailwind CSS
- **UI**: [@woosgem-dev/react](https://github.com/woosgem-dev/woosgem)
- **Database**: PostgreSQL + Prisma
- **Deployment**: TBD

## 개발

```bash
pnpm install
pnpm dev
```

http://localhost:3000

## 관련 링크

- [skills.sh](https://skills.sh) — The Open Agent Skills Ecosystem

## License

MIT
