// Simple test to verify Jest is working

describe('Basic Jest Setup', () => {
  test('Jest is working correctly', () => {
    expect(1 + 1).toBe(2);
  });

  test('Environment variables are set', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.NEOPLE_API_KEY).toBe('test_api_key');
  });

  test('EligibilityEngine basic functionality', () => {
    const EligibilityEngine = require('../../src/services/EligibilityEngine');
    
    const validRules = {
      nabeel: { minFame: 58000, maxSlots: 1 },
      nightmare: { minFame: 55000, maxSlots: 4 }
    };

    const parsedRules = EligibilityEngine.parseContentRules(validRules);
    expect(parsedRules).toBeDefined();
    expect(parsedRules.nabeel.minFame).toBe(58000);
  });

  test('EligibilityEngine eligibility calculation', async () => {
    const EligibilityEngine = require('../../src/services/EligibilityEngine');
    
    const character = { characterId: 'test', fame: 60000 };
    const eligibility = await EligibilityEngine.calculateEligibility(character);
    
    expect(eligibility).toBeDefined();
    expect(eligibility.nabeel).toBe(true);
    expect(eligibility.nightmare).toBe(true);
    expect(eligibility.venus).toBe(true);
  });
});