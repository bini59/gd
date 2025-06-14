// 테스트용 Mock 데이터

const mockCharacterData = {
  // 높은 명성 캐릭터 (모든 컨텐츠 입장 가능)
  highFameCharacter: {
    characterId: 'char_001',
    characterName: '테스트캐릭1',
    jobName: '귀검사(남)',
    adventureFame: 62000,
    serverId: 'bakal',
    accountId: 'account_001'
  },

  // 중간 명성 캐릭터 (일부 컨텐츠만 입장 가능)
  mediumFameCharacter: {
    characterId: 'char_002',
    characterName: '테스트캐릭2',
    jobName: '격투가(여)',
    adventureFame: 54000,
    serverId: 'bakal',
    accountId: 'account_001'
  },

  // 낮은 명성 캐릭터 (입장 불가)
  lowFameCharacter: {
    characterId: 'char_003',
    characterName: '테스트캐릭3',
    jobName: '마법사(여)',
    adventureFame: 48000,
    serverId: 'bakal',
    accountId: 'account_002'
  }
};

const mockAccountData = {
  account001: {
    accountId: 'account_001',
    characters: ['char_001', 'char_002']
  },
  account002: {
    accountId: 'account_002',
    characters: ['char_003']
  }
};

// Neople API 응답 Mock
const mockNeopleFameSearchResponse = {
  rows: [
    {
      characterId: 'char_001',
      characterName: '테스트캐릭1',
      jobName: '귀검사(남)',
      adventureFame: 62000,
      serverId: 'bakal'
    },
    {
      characterId: 'char_002',
      characterName: '테스트캐릭2',
      jobName: '격투가(여)',
      adventureFame: 54000,
      serverId: 'bakal'
    }
  ],
  next: null
};

const mockNeopleCharacterDetailResponse = {
  data: {
    characterId: 'char_001',
    characterName: '테스트캐릭1',
    jobName: '귀검사(남)',
    adventureFame: 62000,
    serverId: 'bakal',
    accountId: 'account_001'
  }
};

// 컨텐츠 룰 Mock
const mockContentRules = {
  nabeel: { minFame: 58000, maxSlots: 1 },
  nightmare: { minFame: 55000, maxSlots: 4 },
  goddess: { minFame: 52000, maxSlots: 2 },
  azure: { minFame: 50000, maxSlots: 2 },
  venus: { minFame: 60000, maxSlots: 1 }
};

module.exports = {
  mockCharacterData,
  mockAccountData,
  mockNeopleFameSearchResponse,
  mockNeopleCharacterDetailResponse,
  mockContentRules
};