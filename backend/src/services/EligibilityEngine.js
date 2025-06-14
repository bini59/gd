const logger = require('../config/logger');

class EligibilityEngine {
  constructor() {
    // Default content rules based on PRD
    this.defaultRules = {
      nabeel: { minFame: 58000, maxSlots: 1 },
      nightmare: { minFame: 55000, maxSlots: 4 },
      goddess: { minFame: 52000, maxSlots: 2 },
      azure: { minFame: 50000, maxSlots: 2 },
      venus: { minFame: 60000, maxSlots: 1 }
    };
  }

  parseContentRules(rulesData) {
    try {
      if (!rulesData || typeof rulesData !== 'object') {
        throw new Error('Invalid content rules: must be an object');
      }

      const parsedRules = {};

      for (const [contentName, rule] of Object.entries(rulesData)) {
        if (!rule || typeof rule !== 'object') {
          throw new Error(`Invalid rule for ${contentName}: must be an object`);
        }

        if (!rule.minFame || typeof rule.minFame !== 'number' || rule.minFame < 0) {
          throw new Error(`Invalid minFame for ${contentName}: must be a positive number`);
        }

        if (rule.maxSlots !== undefined && (typeof rule.maxSlots !== 'number' || rule.maxSlots < 0)) {
          throw new Error(`Invalid maxSlots for ${contentName}: must be a positive number`);
        }

        parsedRules[contentName] = {
          minFame: rule.minFame,
          maxSlots: rule.maxSlots
        };
      }

      if (Object.keys(parsedRules).length === 0) {
        throw new Error('Invalid content rules: at least one rule required');
      }

      return parsedRules;

    } catch (error) {
      logger.error('Failed to parse content rules:', error);
      throw new Error(`Invalid content rules: ${error.message}`);
    }
  }

  async calculateEligibility(character, contentRules = null) {
    const rules = contentRules || this.defaultRules;
    
    if (!character || typeof character.fame !== 'number') {
      throw new Error('Invalid character data: fame must be a number');
    }

    const eligibility = {};

    for (const [contentName, rule] of Object.entries(rules)) {
      eligibility[contentName] = character.fame >= rule.minFame;
    }

    return eligibility;
  }

  async calculateBatchEligibility(characters, contentRules = null) {
    const rules = contentRules || this.defaultRules;
    const results = [];

    for (const character of characters) {
      try {
        const eligibility = await this.calculateEligibility(character, rules);
        results.push({
          characterId: character.characterId,
          ...eligibility
        });
      } catch (error) {
        logger.error(`Failed to calculate eligibility for character ${character.characterId}:`, error);
        // Continue processing other characters
        results.push({
          characterId: character.characterId,
          error: error.message
        });
      }
    }

    return results;
  }

  // Apply slot limits to eligible characters per account
  applySlotLimits(characters, contentType, contentRules = null) {
    const rules = contentRules || this.defaultRules;
    const rule = rules[contentType];

    if (!rule) {
      throw new Error(`Unknown content type: ${contentType}`);
    }

    // Filter characters that meet the fame requirement
    const eligibleCharacters = characters.filter(char => 
      char.fame >= rule.minFame
    );

    // Sort by fame descending
    eligibleCharacters.sort((a, b) => b.fame - a.fame);

    // Apply slot limit if specified
    if (rule.maxSlots) {
      return eligibleCharacters.slice(0, rule.maxSlots);
    }

    return eligibleCharacters;
  }

  // Calculate eligibility with slot ranking for a single account
  calculateAccountEligibility(characters, contentRules = null) {
    const rules = contentRules || this.defaultRules;
    const accountEligibility = {
      characters: [],
      slotStatus: {}
    };

    // Sort characters by fame descending for ranking
    const sortedCharacters = [...characters].sort((a, b) => b.fame - a.fame);

    for (const character of sortedCharacters) {
      const charEligibility = {
        characterId: character.characterId,
        characterName: character.characterName,
        fame: character.fame,
        jobName: character.jobName,
        eligibility: {},
        slotStatus: {}
      };

      // Calculate basic eligibility for each content
      for (const [contentName, rule] of Object.entries(rules)) {
        charEligibility.eligibility[contentName] = character.fame >= rule.minFame;
      }

      // Calculate slot rankings
      for (const [contentName, rule] of Object.entries(rules)) {
        if (rule.maxSlots && charEligibility.eligibility[contentName]) {
          const eligibleChars = sortedCharacters.filter(c => c.fame >= rule.minFame);
          const rank = eligibleChars.findIndex(c => c.characterId === character.characterId) + 1;
          
          charEligibility.slotStatus[`${contentName}Rank`] = rank;
          charEligibility.slotStatus[`${contentName}Eligible`] = rank <= rule.maxSlots;
        }
      }

      accountEligibility.characters.push(charEligibility);
    }

    // Calculate account-level slot status
    for (const [contentName, rule] of Object.entries(rules)) {
      if (rule.maxSlots) {
        const eligibleCount = accountEligibility.characters.filter(c => 
          c.eligibility[contentName] && c.slotStatus[`${contentName}Eligible`]
        ).length;
        
        accountEligibility.slotStatus[contentName] = {
          eligible: eligibleCount,
          limit: rule.maxSlots
        };
      }
    }

    return accountEligibility;
  }

  // Get content rules (for API exposure)
  getContentRules() {
    return { ...this.defaultRules };
  }

  // Update content rules (for admin functionality)
  updateContentRules(newRules) {
    const parsedRules = this.parseContentRules(newRules);
    this.defaultRules = { ...this.defaultRules, ...parsedRules };
    
    logger.info('Content rules updated:', parsedRules);
    return this.defaultRules;
  }

  // Validate character data for eligibility calculation
  validateCharacterData(character) {
    const required = ['characterId', 'fame'];
    const missing = required.filter(field => character[field] === undefined);
    
    if (missing.length > 0) {
      throw new Error(`Missing required character fields: ${missing.join(', ')}`);
    }

    if (typeof character.fame !== 'number' || character.fame < 0) {
      throw new Error('Character fame must be a positive number');
    }

    return true;
  }
}

module.exports = new EligibilityEngine();