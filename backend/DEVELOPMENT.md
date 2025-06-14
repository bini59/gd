# TDD 개발 가이드

## 🎯 현재 상태

✅ **완료된 구현:**
- Express 앱 기본 구조 및 보안 미들웨어
- FameScanner 서비스 (Neople API 연동)
- CharacterMapping 서비스 (DB UPSERT)
- EligibilityEngine 서비스 (룰 엔진)
- Accounts API 컨트롤러 (REST 엔드포인트)
- Sync API 컨트롤러 (관리자 기능)
- Health Check API
- 전체 테스트 스위트 (122개 테스트)

## 🧪 테스트 실행 방법

### 1. 의존성 설치
```bash
cd backend
yarn install
```

### 2. 환경 설정
```bash
# 개발용 환경변수 설정
cp .env.example .env

# 테스트용 환경변수는 이미 설정됨
# .env.test 파일 확인
```

### 3. 단위 테스트 실행 (DB 없이도 가능)
```bash
# EligibilityEngine 테스트만 실행
yarn test tests/unit/services/eligibilityEngine.test.js

# Health Check API 테스트만 실행  
yarn test tests/integration/api/health.test.js
```

### 4. 전체 테스트 실행 (PostgreSQL 필요)
```bash
# PostgreSQL 설정 후
yarn test
```

## 📊 구현된 API 엔드포인트

### Health Check
- `GET /api/health` - 서버 상태 확인

### Accounts API
- `GET /api/accounts` - 전체 계정 목록
- `GET /api/accounts/search?q=검색어` - 계정 검색
- `GET /api/accounts/:id/eligibles` - 계정별 컨텐츠 입장 가능 캐릭터
- `GET /api/accounts/:id/summary` - 계정 요약 정보

### Admin API (Bearer 토큰 필요)
- `POST /api/sync/run` - 수동 데이터 동기화
- `GET /api/sync/logs` - 동기화 로그 조회
- `GET /api/sync/status` - 현재 동기화 상태
- `GET /api/sync/fail-logs` - 실패 로그 조회

## 🔧 주요 서비스

### FameScanner
Neople API를 호출하여 캐릭터 명성 데이터를 수집합니다.
```javascript
const FameScanner = require('./src/services/FameScanner');

// 수동 동기화 실행
await FameScanner.startManualSync({ role: 'admin' });

// Fame 구간별 스캔
await FameScanner.scanFameRange(40000, 50000);
```

### EligibilityEngine  
컨텐츠별 입장 조건을 계산합니다.
```javascript
const EligibilityEngine = require('./src/services/EligibilityEngine');

// 단일 캐릭터 입장 가능 여부 계산
const eligibility = await EligibilityEngine.calculateEligibility(character);

// 계정별 슬롯 제한 적용
const accountEligibility = EligibilityEngine.calculateAccountEligibility(characters);
```

### CharacterMapping
캐릭터 데이터를 DB에 저장하고 관리합니다.
```javascript
const CharacterMapping = require('./src/services/CharacterMapping');

// 캐릭터 상세 정보 조회
const character = await CharacterMapping.getCharacterDetail(characterId);

// 배치 UPSERT
await CharacterMapping.upsertBatch(charactersData);
```

## 🧪 TDD 사이클

### 현재 테스트 상태
- **Red ➜ Green**: 기본 기능 구현 완료
- **Green ➜ Refactor**: 코드 품질 개선 단계

### 테스트 커버리지 목표
- Branches: 80%
- Functions: 80% 
- Lines: 80%
- Statements: 80%

## 🚀 개발 서버 실행

```bash
# 개발 모드 (nodemon)
yarn dev

# 프로덕션 모드
yarn start
```

서버가 실행되면 `http://localhost:3000`에서 접근 가능합니다.

## 🎮 API 테스트 예시

### Health Check
```bash
curl http://localhost:3000/api/health
```

### 계정 목록 조회
```bash
curl http://localhost:3000/api/accounts
```

### 수동 동기화 (관리자)
```bash
curl -X POST http://localhost:3000/api/sync/run \
  -H "Authorization: Bearer valid_admin_token"
```

## 📈 다음 단계

1. **PostgreSQL 설정**: 실제 DB 연결을 위한 PostgreSQL 설치 및 설정
2. **통합 테스트**: DB와 함께하는 전체 플로우 테스트  
3. **성능 최적화**: 대량 데이터 처리 최적화
4. **인증 시스템**: JWT 기반 실제 인증 구현
5. **배포 설정**: Docker 및 CI/CD 파이프라인
6. **모니터링**: 로깅 및 에러 추적 시스템

## 🏗️ 프로젝트 구조

```
src/
├── app.js              # Express 앱 설정
├── index.js            # 서버 시작점
├── config/
│   ├── database.js     # DB 연결 설정
│   └── logger.js       # 로깅 설정
├── controllers/        # API 컨트롤러
├── services/           # 비즈니스 로직
├── routes/            # 라우터 설정
└── middleware/        # 미들웨어

tests/
├── unit/              # 단위 테스트
├── integration/       # 통합 테스트
├── e2e/              # E2E 테스트
└── helpers/          # 테스트 헬퍼
```

TDD 방식으로 테스트 우선 개발이 완료되었습니다! 🎉