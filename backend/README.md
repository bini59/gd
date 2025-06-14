# 던파 캐릭터 분류·컨텐츠 추천 Backend

TDD(Test-Driven Development) 방식으로 개발하는 Node.js Express 백엔드 서버입니다.

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
cd backend
yarn install
```

### 2. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 편집하여 실제 값들을 입력
```

### 3. 데이터베이스 설정
```bash
# PostgreSQL 스키마 생성
psql -d your_database < database/schema.sql
```

### 4. 테스트 실행
```bash
# 모든 테스트 실행
yarn test

# 단위 테스트만
yarn test:unit

# 통합 테스트만
yarn test:integration

# E2E 테스트만
yarn test:e2e

# 커버리지 포함 테스트
yarn test:coverage
```

### 5. 개발 서버 실행
```bash
yarn dev
```

## 📋 TDD 개발 가이드

### 현재 작성된 테스트

✅ **Story S-1.1: 수동 Fame 스캔 테스트** (`tests/unit/services/fameScanner.test.js`)
- 외부 Neople API 호출 테스트
- Fame 구간별 스캔 테스트  
- 페이징 처리 테스트
- DB UPSERT 동작 테스트
- 에러 처리 및 권한 테스트

✅ **Story S-1.2: 캐릭터-Account 매핑 테스트** (`tests/unit/services/characterMapping.test.js`)
- 캐릭터 상세 API 연동 테스트
- AccountId 기준 그룹핑 테스트
- DB 트랜잭션 및 배치 처리 테스트

✅ **Story S-2.1: 컨텐츠 Fame 룰 엔진 테스트** (`tests/unit/services/eligibilityEngine.test.js`)
- JSON 룰 파싱 테스트
- Fame 조건 연산 테스트
- Boolean 필드 생성 테스트
- 성능 최적화 테스트

✅ **Story S-3.1: REST API 엔드포인트 테스트** (`tests/integration/api/accounts.test.js`)
- `/accounts/:id/eligibles` API 테스트
- SQL Join 및 데이터 정합성 테스트
- 캐싱 동작 테스트
- 권한/인증 테스트

✅ **Integration & Health Check 테스트** (`tests/integration/api/health.test.js`)
- Health Check API 테스트
- Admin Console API 테스트
- 기본 Express 설정 테스트

✅ **E2E 전체 플로우 테스트** (`tests/e2e/fullFlow.test.js`)
- 수동 Sync → Eligibility → API 응답 전체 플로우
- 외부 API 장애 시 안정성 테스트
- 성능 테스트 (동시 사용자, 대량 데이터)

### 다음 단계: 실제 구현

1. **Red Phase**: 모든 테스트가 현재 실패 상태입니다 (구현이 없음)

2. **Green Phase**: 각 Story별로 최소한의 구현을 진행하세요:
   ```bash
   # 각 서비스별 구현 파일 생성
   src/services/FameScanner.js
   src/services/CharacterMapping.js  
   src/services/EligibilityEngine.js
   src/controllers/AccountsController.js
   src/controllers/SyncController.js
   src/app.js
   src/index.js
   ```

3. **Refactor Phase**: 테스트가 통과한 후 코드 품질 개선

### TDD 개발 순서

1. **Epic E-1: 데이터 수집 & 저장**
   - Story S-1.1: FameScanner 서비스 구현
   - Story S-1.2: CharacterMapping 서비스 구현
   - Story S-1.3: Retry 로직 구현

2. **Epic E-2: Eligibility 연산**
   - Story S-2.1: EligibilityEngine 서비스 구현
   - Story S-2.2: 슬롯 필터 로직 구현
   - Story S-2.3: Materialized View 관리

3. **Epic E-3: API & Backend 서비스**
   - Story S-3.1: REST API 컨트롤러 구현
   - Story S-3.2: Admin Console API 구현

## 🧪 테스트 구조

```
tests/
├── unit/           # 단위 테스트
│   └── services/
│       ├── fameScanner.test.js
│       ├── characterMapping.test.js
│       └── eligibilityEngine.test.js
├── integration/    # 통합 테스트
│   └── api/
│       ├── accounts.test.js
│       └── health.test.js
├── e2e/           # End-to-End 테스트
│   └── fullFlow.test.js
└── helpers/       # 테스트 헬퍼
    ├── testDb.js
    └── mockData.js
```

## 🎯 커버리지 목표

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## 📊 테스트 실행 결과

```bash
# 현재 상태 (구현 전)
yarn test
# 모든 테스트가 pending 또는 주석 처리된 상태

# 구현 후 예상 결과
✓ FameScanner Service - 15개 테스트
✓ CharacterMapping Service - 12개 테스트  
✓ EligibilityEngine Service - 18개 테스트
✓ Accounts API - 22개 테스트
✓ Health Check API - 8개 테스트
✓ E2E Flow - 10개 테스트

Total: 85개 테스트, 커버리지 >80%
```

## 🔧 개발 도구

- **테스트 프레임워크**: Jest
- **HTTP 테스트**: Supertest
- **외부 API Mock**: nock
- **데이터베이스**: PostgreSQL (테스트용 별도 DB)
- **로깅**: Winston
- **코드 품질**: ESLint, Prettier (설정 예정)

## 📝 API 명세

### 데이터 조회 API
- `GET /api/accounts` - 전체 계정 목록
- `GET /api/accounts/:id/eligibles` - 계정별 컨텐츠 입장 가능 캐릭터

### 관리자 API  
- `POST /api/sync/run` - 수동 데이터 동기화
- `GET /api/sync/logs` - 동기화 로그 조회

### 시스템 API
- `GET /api/health` - 서버 상태 확인

## 🚀 배포

```bash
# 프로덕션 빌드
yarn build

# Docker 빌드
docker build -t gd-backend .

# 배포
docker run -p 3000:3000 gd-backend
```

## 📋 TODO

- [ ] FameScanner 서비스 구현
- [ ] CharacterMapping 서비스 구현  
- [ ] EligibilityEngine 서비스 구현
- [ ] REST API 컨트롤러 구현
- [ ] Express 앱 설정
- [ ] 에러 처리 미들웨어
- [ ] 로깅 시스템 완성
- [ ] Docker 설정
- [ ] CI/CD 파이프라인

---

**TDD 철학**: 🔴 Red → 🟢 Green → 🔄 Refactor

모든 기능은 테스트를 먼저 작성하고, 테스트를 통과하는 최소한의 코드를 구현한 후, 리팩토링을 통해 코드 품질을 개선합니다.