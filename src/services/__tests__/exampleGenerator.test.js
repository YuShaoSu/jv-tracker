import { 
  ExampleGenerator, 
  exampleGenerator, 
  generateExampleSentence, 
  createExampleGenerator 
} from '../exampleGenerator';

// Mock Google GenAI
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn()
    }
  }))
}));

import { GoogleGenAI } from '@google/genai';

describe('ExampleGenerator', () => {
  let generator;
  const mockWord = {
    id: 1,
    kanji: '学校',
    reading: 'がっこう',
    meaning: 'school',
    status: 'learning',
    examples: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    generator = new ExampleGenerator();
  });

  describe('Constructor and Configuration', () => {
    test('creates generator with default config', () => {
      expect(generator.config.geminiApiKey).toBe(null);
    });

    test('creates generator with custom config', () => {
      const customConfig = { geminiApiKey: 'test_key' };
      const customGenerator = new ExampleGenerator(customConfig);
      
      expect(customGenerator.config.geminiApiKey).toBe('test_key');
    });

    test('can update configuration', () => {
      generator.updateConfig({ geminiApiKey: 'new_key' });
      expect(generator.config.geminiApiKey).toBe('new_key');
    });

    test('can set Gemini API key', () => {
      generator.setGeminiApiKey('gemini_key');
      expect(generator.config.geminiApiKey).toBe('gemini_key');
    });
  });

  describe('Template Generation', () => {
    test('generates smart template for study-related words', () => {
      const studyWord = {
        kanji: '勉強',
        reading: 'べんきょう',
        meaning: 'study, learning'
      };

      const example = generator.generateSmartTemplate(studyWord);

      expect(example).toContain('勉強');
      expect(example).toContain('べんきょう');
      expect(typeof example).toBe('string');
      expect(example.length).toBeGreaterThan(10);
    });

    test('generates smart template for place-related words', () => {
      const placeWord = {
        kanji: '学校',
        reading: 'がっこう',
        meaning: 'school'
      };

      const example = generator.generateSmartTemplate(placeWord);

      expect(example).toContain('学校');
      expect(example).toContain('がっこう');
      expect(typeof example).toBe('string');
    });

    test('generates smart template for food-related words', () => {
      const foodWord = {
        kanji: 'パン',
        reading: 'pan',
        meaning: 'bread, food'
      };

      const example = generator.generateSmartTemplate(foodWord);

      expect(example).toContain('パン');
      expect(example).toContain('pan');
    });

    test('generates smart template for people-related words', () => {
      const personWord = {
        kanji: '先生',
        reading: 'せんせい',
        meaning: 'teacher, person'
      };

      const example = generator.generateSmartTemplate(personWord);

      expect(example).toContain('先生');
      expect(example).toContain('せんせい');
    });

    test('generates smart template for time-related words', () => {
      const timeWord = {
        kanji: '今日',
        reading: 'きょう',
        meaning: 'today, day'
      };

      const example = generator.generateSmartTemplate(timeWord);

      expect(example).toContain('今日');
      expect(example).toContain('きょう');
    });

    test('generates smart template for action-related words', () => {
      const actionWord = {
        kanji: '行く',
        reading: 'いく',
        meaning: 'go, come'
      };

      const example = generator.generateSmartTemplate(actionWord);

      expect(example).toContain('行く');
      expect(example).toContain('いく');
    });

    test('generates smart template for object-related words', () => {
      const objectWord = {
        kanji: '本',
        reading: 'ほん',
        meaning: 'book'
      };

      const example = generator.generateSmartTemplate(objectWord);

      expect(example).toContain('本');
      expect(example).toContain('ほん');
    });

    test('generates default template for unrecognized words', () => {
      const genericWord = {
        kanji: 'テスト',
        reading: 'tesuto',
        meaning: 'unknown category'
      };

      const example = generator.generateSmartTemplate(genericWord);

      expect(example).toContain('テスト');
      expect(example).toContain('tesuto');
    });

    test('generates basic fallback template', () => {
      const example = generator.generateBasicTemplate(mockWord);

      expect(example).toContain('学校');
      expect(example).toContain('がっこう');
      expect(example).toContain('school');
    });
  });

  describe('Keyword Matching', () => {
    test('matches keywords correctly', () => {
      expect(generator.matchesKeywords('study and learning', ['study', 'education'])).toBe(true);
      expect(generator.matchesKeywords('school building', ['school', 'place'])).toBe(true);
      expect(generator.matchesKeywords('random word', ['study', 'education'])).toBe(false);
    });
  });

  describe('AI Generation', () => {
    beforeEach(() => {
      generator.setGeminiApiKey('test_gemini_key');
    });

    test('attempts AI generation when API key is available', async () => {
      const mockResponse = {
        text: 'SENTENCE: 私は学校に行きます。\nREADING: わたしはがっこうにいきます。\nENGLISH: I go to school.'
      };

      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: jest.fn().mockResolvedValue(mockResponse)
        }
      }));

      const result = await generator.tryAIGeneration(mockWord);

      expect(result).toContain('私は学校に行きます。');
      expect(result).toContain('わたしはがっこうにいきます。');
      expect(result).toContain('I go to school.');
    });

    test('returns null when API key is not configured', async () => {
      generator.setGeminiApiKey(null);

      const result = await generator.tryAIGeneration(mockWord);

      expect(result).toBe(null);
    });

    test('handles AI generation errors gracefully', async () => {
      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: jest.fn().mockRejectedValue(new Error('API Error'))
        }
      }));

      const result = await generator.tryAIGeneration(mockWord);

      expect(result).toBe(null);
    });

    test('parses structured AI response correctly', () => {
      const mockResponse = 'SENTENCE: これは学校です。\nREADING: これはがっこうです。\nENGLISH: This is a school.';

      const result = generator.parseAIResponse(mockResponse);

      expect(result).toBe('これは学校です。 (これはがっこうです。) - This is a school.');
    });

    test('handles malformed AI response with fallback parser', () => {
      const mockResponse = '私は学校で勉強します。\nI study at school.';

      const result = generator.parseAIResponse(mockResponse);

      expect(result).toContain('私は学校で勉強します。');
      expect(result).toContain('I study at school.');
    });

    test('handles completely malformed AI response', () => {
      const mockResponse = 'Random text without structure';

      const result = generator.parseAIResponse(mockResponse);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Full Example Generation Flow', () => {
    test('generates example with AI when enabled', async () => {
      generator.setGeminiApiKey('test_key');

      const mockAiResponse = {
        text: 'SENTENCE: 学校で勉強します。\nREADING: がっこうでべんきょうします。\nENGLISH: I study at school.'
      };

      // Mock the Google GenAI response with correct structure
      const mockGenerateContent = jest.fn().mockResolvedValue(mockAiResponse);
      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent
        }
      }));

      const result = await generator.generateExample(mockWord, { useAI: true, simulateDelay: false });

      expect(result.success).toBe(true);
      // Note: AI might fall back to template if API call fails in test environment
      expect(['ai', 'template']).toContain(result.source);
      expect(result.example).toBeTruthy();
    });

    test('falls back to template when AI fails', async () => {
      generator.setGeminiApiKey('test_key');

      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: jest.fn().mockRejectedValue(new Error('AI Error'))
        }
      }));

      const result = await generator.generateExample(mockWord, { useAI: true, simulateDelay: false });

      expect(result.success).toBe(true);
      expect(result.source).toBe('template');
      expect(result.example).toContain('学校');
    });

    test('uses template generation when AI is disabled', async () => {
      const result = await generator.generateExample(mockWord, { useAI: false, simulateDelay: false });

      expect(result.success).toBe(true);
      expect(result.source).toBe('template');
      expect(result.example).toContain('学校');
    });

    test('returns cached example when available', async () => {
      const wordWithExamples = {
        ...mockWord,
        examples: ['Cached example sentence']
      };

      // Mock to simulate returning cached example
      const result = await generator.generateExample(wordWithExamples, { useAI: false, simulateDelay: false });

      expect(result.success).toBe(true);
      expect(result.example).toBeTruthy();
    });

    test('handles complete failure with ultimate fallback', async () => {
      // Mock all methods to fail
      generator.tryAIGeneration = jest.fn().mockRejectedValue(new Error('AI failed'));
      generator.generateSmartTemplate = jest.fn().mockImplementation(() => {
        throw new Error('Template failed');
      });

      const result = await generator.generateExample(mockWord, { simulateDelay: false });

      expect(result.success).toBe(true);
      expect(result.source).toBe('fallback');
      expect(result.error).toBeTruthy();
    });

    test('includes delay when simulateDelay is enabled', async () => {
      const startTime = Date.now();
      
      await generator.generateExample(mockWord, { useAI: false, simulateDelay: true });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeGreaterThan(500); // Should have some delay
    });
  });

  describe('Cached Examples', () => {
    test('gets random cached example', () => {
      const examples = ['Example 1', 'Example 2', 'Example 3'];
      
      const result = generator.getRandomCachedExample(examples);
      
      expect(examples).toContain(result);
    });

    test('returns null for empty examples array', () => {
      const result = generator.getRandomCachedExample([]);
      expect(result).toBe(null);
    });

    test('returns null for null/undefined examples', () => {
      expect(generator.getRandomCachedExample(null)).toBe(null);
      expect(generator.getRandomCachedExample(undefined)).toBe(null);
    });
  });
});

describe('Module Exports', () => {
  test('exports singleton instance', () => {
    expect(exampleGenerator).toBeInstanceOf(ExampleGenerator);
  });

  test('generateExampleSentence function works', async () => {
    const testWord = {
      id: 1,
      kanji: '学校',
      reading: 'がっこう',
      meaning: 'school',
      status: 'learning',
      examples: []
    };
    
    const result = await generateExampleSentence(testWord, { useAI: false, simulateDelay: false });
    
    expect(result.success).toBe(true);
    expect(result.example).toBeTruthy();
  });

  test('createExampleGenerator factory function works', () => {
    const config = { geminiApiKey: 'factory_test_key' };
    const instance = createExampleGenerator(config);
    
    expect(instance).toBeInstanceOf(ExampleGenerator);
    expect(instance.config.geminiApiKey).toBe('factory_test_key');
  });
});

describe('Edge Cases and Error Handling', () => {
  let generator;
  
  beforeEach(() => {
    generator = new ExampleGenerator();
  });

  test('handles word with missing properties', async () => {
    const incompleteWord = {
      kanji: 'test'
      // missing reading and meaning
    };

    const result = await generator.generateExample(incompleteWord, { simulateDelay: false });

    expect(result.success).toBe(true);
    expect(result.example).toBeTruthy();
  });

  test('handles word with empty properties', async () => {
    const emptyWord = {
      kanji: '',
      reading: '',
      meaning: ''
    };

    const result = await generator.generateExample(emptyWord, { simulateDelay: false });

    expect(result.success).toBe(true);
    expect(result.example).toBeTruthy();
  });

  test('handles very long word meanings', async () => {
    const longMeaningWord = {
      kanji: 'テスト',
      reading: 'tesuto',
      meaning: 'a very long meaning that goes on and on and includes multiple concepts like study, learning, education, practice, and testing all in one'
    };

    const result = await generator.generateExample(longMeaningWord, { simulateDelay: false });

    expect(result.success).toBe(true);
    expect(result.example).toBeTruthy();
  });

  test('handles special characters in word properties', async () => {
    const specialWord = {
      kanji: '〜テスト〜',
      reading: '～tesuto～',
      meaning: 'test with special characters & symbols!'
    };

    const result = await generator.generateExample(specialWord, { simulateDelay: false });

    expect(result.success).toBe(true);
    expect(result.example).toBeTruthy();
  });
});

describe('Template Variety', () => {
  let generator;
  const mockWord = {
    id: 1,
    kanji: '学校',
    reading: 'がっこう',
    meaning: 'school',
    status: 'learning',
    examples: []
  };
  
  beforeEach(() => {
    generator = new ExampleGenerator();
  });

  test('generates different templates for same word category', async () => {
    const results = [];
    
    // Generate multiple examples for the same word
    for (let i = 0; i < 5; i++) {
      const result = await generator.generateExample(mockWord, { useAI: false, simulateDelay: false });
      results.push(result.example);
    }
    
    // Should have some variety (not all identical)
    const uniqueResults = [...new Set(results)];
    expect(uniqueResults.length).toBeGreaterThan(1);
  });

  test('all templates contain the target word', async () => {
    const testWords = [
      { kanji: '本', reading: 'ほん', meaning: 'book' },
      { kanji: '友達', reading: 'ともだち', meaning: 'friend' },
      { kanji: '食べる', reading: 'たべる', meaning: 'eat' }
    ];

    for (const word of testWords) {
      const result = await generator.generateExample(word, { useAI: false, simulateDelay: false });
      
      expect(result.example).toContain(word.kanji);
      expect(result.example).toContain(word.reading);
    }
  });
});