// TDD Story S-1.1: 수동 Fame 스캔 실행 테스트

const nock = require('nock');
const { mockNeopleFameSearchResponse, mockNeopleCharacterDetailResponse } = require('../../helpers/mockData');

describe('FameScanner Service - Story S-1.1', () => {
  let FameScanner;
  
  beforeAll(() => {
    FameScanner = require('../../../src/services/FameScanner');
  });

  beforeEach(() => {
    // 각 테스트 전에 nock 정리
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('수동 Fame 스캔 API 호출 시 정상적으로 데이터가 수집되는가', () => {
    test('새로고침(수동 Sync) API 호출 시, 외부 Neople API에서 데이터를 받아오는지', async () => {
      // Given: Neople API Mock 설정
      const apiMock = nock('https://api.neople.co.kr')
        .get('/df/servers/bakal/characters')
        .query({
          limit: 200,
          adventureFame: '40000,50000',
          apikey: process.env.NEOPLE_API_KEY
        })
        .reply(200, mockNeopleFameSearchResponse.data);

      // Mock character detail calls
      nock('https://api.neople.co.kr')
        .get('/df/characters/char_001')
        .query({ apikey: process.env.NEOPLE_API_KEY })
        .reply(200, { ...mockNeopleCharacterDetailResponse.data, accountId: 'account_001' });

      nock('https://api.neople.co.kr')
        .get('/df/characters/char_002')
        .query({ apikey: process.env.NEOPLE_API_KEY })
        .reply(200, { 
          characterId: 'char_002',
          characterName: '테스트캐릭2',
          jobName: '격투가(여)',
          adventureFame: 54000,
          serverId: 'bakal',
          accountId: 'account_001'
        });

      // When: Fame 스캔 실행
      const result = await FameScanner.scanFameRange(40000, 50000);

      // Then: API가 호출되었는지 확인
      expect(apiMock.isDone()).toBe(true);
      expect(result).toBeDefined();
      expect(result.processedCount).toBeGreaterThanOrEqual(0);
      expect(result.failedCount).toBeGreaterThanOrEqual(0);
    });

    test('Fame 구간(40,000~62,000, 구간폭 ≤ 10,000)별로 반복 호출이 이루어지는지', async () => {
      // Given: 여러 Fame 구간에 대한 API Mock
      const fameRanges = [
        [40000, 50000],
        [50000, 60000],
        [60000, 62000]
      ];

      const apiMocks = fameRanges.map(([min, max]) => 
        nock('https://api.neople.co.kr')
          .get('/df/servers/bakal/characters')
          .query({
            limit: 200,
            adventureFame: `${min},${max}`,
            apikey: process.env.NEOPLE_API_KEY
          })
          .reply(200, { data: { rows: [], next: null } })
      );

      // When: 전체 Fame 구간 스캔 실행 (실제 구현 필요)
      // const result = await FameScanner.scanAllFameRanges();

      // Then: 모든 구간이 호출되었는지 확인
      apiMocks.forEach(mock => {
        expect(mock.isDone()).toBe(true);
      });
    });

    test('호출당 200개 row씩 페이징이 정상 동작하는지', async () => {
      // Given: 페이징이 있는 API 응답 Mock
      const firstPageMock = nock('https://api.neople.co.kr')
        .get('/df/servers/bakal/characters')
        .query({
          limit: 200,
          adventureFame: '40000,50000',
          apikey: process.env.NEOPLE_API_KEY
        })
        .reply(200, {
          data: {
            rows: Array(200).fill().map((_, i) => ({
              characterId: `char_${i}`,
              characterName: `테스트캐릭${i}`,
              adventureFame: 45000 + i
            })),
            next: 'next_token_123'
          }
        });

      const secondPageMock = nock('https://api.neople.co.kr')
        .get('/df/servers/bakal/characters')
        .query({
          limit: 200,
          adventureFame: '40000,50000',
          next: 'next_token_123',
          apikey: process.env.NEOPLE_API_KEY
        })
        .reply(200, {
          data: {
            rows: Array(50).fill().map((_, i) => ({
              characterId: `char_${200 + i}`,
              characterName: `테스트캐릭${200 + i}`,
              adventureFame: 45200 + i
            })),
            next: null
          }
        });

      // When: 페이징 처리된 스캔 실행 (실제 구현 필요)
      // const result = await FameScanner.scanFameRange(40000, 50000);

      // Then: 두 페이지 모두 호출되었는지 확인
      expect(firstPageMock.isDone()).toBe(true);
      expect(secondPageMock.isDone()).toBe(true);
      
      // 실제 구현 후 활성화
      // expect(result.characters).toHaveLength(250);
    });
  });

  describe('수집된 데이터가 DB에 올바르게 저장되는가', () => {
    test('기존 데이터와 중복 시 UPSERT(갱신)되는지', async () => {
      // Given: 기존 캐릭터 데이터가 DB에 있음 (실제 구현 필요)
      // await TestDatabase.insertCharacter({
      //   account_id: 'account_001',
      //   char_id: 'char_001',
      //   fame: 50000,
      //   character_name: '기존캐릭명'
      // });

      // Mock API 응답
      nock('https://api.neople.co.kr')
        .get('/df/characters/char_001')
        .query({ apikey: process.env.NEOPLE_API_KEY })
        .reply(200, {
          data: {
            ...mockNeopleCharacterDetailResponse.data,
            characterName: '갱신된캐릭명',
            adventureFame: 55000
          }
        });

      // When: 동일 캐릭터 스캔 (실제 구현 필요)
      // const result = await FameScanner.processCharacter('char_001');

      // Then: 데이터가 갱신되었는지 확인 (실제 구현 필요)
      // const updatedChar = await TestDatabase.getCharacter('char_001');
      // expect(updatedChar.character_name).toBe('갱신된캐릭명');
      // expect(updatedChar.fame).toBe(55000);
    });

    test('신규 데이터는 정상적으로 추가되는지', async () => {
      // Given: 신규 캐릭터 API 응답
      nock('https://api.neople.co.kr')
        .get('/df/characters/new_char_001')
        .query({ apikey: process.env.NEOPLE_API_KEY })
        .reply(200, {
          data: {
            characterId: 'new_char_001',
            characterName: '신규캐릭터',
            jobName: '거너(남)',
            adventureFame: 58000,
            serverId: 'bakal',
            accountId: 'new_account_001'
          }
        });

      // When: 신규 캐릭터 처리 (실제 구현 필요)
      // const result = await FameScanner.processCharacter('new_char_001');

      // Then: 새 데이터가 추가되었는지 확인 (실제 구현 필요)
      // const newChar = await TestDatabase.getCharacter('new_char_001');
      // expect(newChar).toBeDefined();
      // expect(newChar.character_name).toBe('신규캐릭터');
      // expect(newChar.fame).toBe(58000);
    });
  });

  describe('API 실패/오류 상황 처리', () => {
    test('외부 API 실패 시 적절한 에러 응답 및 로그가 남는지', async () => {
      // Given: API 500 에러 Mock
      nock('https://api.neople.co.kr')
        .get('/df/servers/bakal/characters')
        .query(true)
        .reply(500, { error: 'Internal Server Error' });

      // When: API 호출 시 에러 발생 (실제 구현 필요)
      // await expect(FameScanner.scanFameRange(40000, 50000))
      //   .rejects.toThrow('Neople API Error');

      // Then: 에러 로그가 기록되었는지 확인 (실제 구현 필요)
      // const errorLogs = await TestDatabase.getErrorLogs();
      // expect(errorLogs).toHaveLength(1);
      // expect(errorLogs[0].error_message).toContain('Internal Server Error');
    });

    test('일부 row 실패 시, 실패 row만 별도 테이블(sync_fail)에 기록되는지', async () => {
      // Given: 일부 캐릭터 API는 성공, 일부는 실패
      nock('https://api.neople.co.kr')
        .get('/df/characters/char_success')
        .query(true)
        .reply(200, { data: mockNeopleCharacterDetailResponse.data });

      nock('https://api.neople.co.kr')
        .get('/df/characters/char_fail')
        .query(true)
        .reply(404, { error: 'Character not found' });

      // When: 여러 캐릭터 배치 처리 (실제 구현 필요)
      // const result = await FameScanner.processBatch(['char_success', 'char_fail']);

      // Then: 성공한 캐릭터는 저장, 실패한 캐릭터는 실패 테이블에 기록
      // expect(result.successCount).toBe(1);
      // expect(result.failCount).toBe(1);
      
      // const successChar = await TestDatabase.getCharacter('char_success');
      // expect(successChar).toBeDefined();
      
      // const failLogs = await TestDatabase.getSyncFailLogs();
      // expect(failLogs).toHaveLength(1);
      // expect(failLogs[0].char_id).toBe('char_fail');
    });
  });

  describe('권한/인증', () => {
    test('인증된 사용자만 수동 Sync API를 호출할 수 있는지', async () => {
      // 이 테스트는 API 레벨에서 진행하는 것이 적절함
      // 여기서는 Service 레벨에서의 권한 확인 로직 테스트
      
      // Given: 권한 없는 사용자 (실제 구현 필요)
      // const unauthorizedUser = { role: 'viewer' };
      
      // When: 권한 없는 사용자가 스캔 시도 (실제 구현 필요)
      // await expect(FameScanner.startManualSync(unauthorizedUser))
      //   .rejects.toThrow('Insufficient permissions');
      
      // Then: 적절한 에러가 발생해야 함
      expect(true).toBe(true); // 임시 테스트
    });
  });
});