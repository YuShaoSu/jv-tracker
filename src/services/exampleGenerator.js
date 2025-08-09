/**
 * Japanese Example Sentence Generator
 * Handles multiple AI services and fallback generation
 */

import { GoogleGenAI } from "@google/genai";

/**
 * Example Generation Service
 */
export class ExampleGenerator {
  constructor(config = {}) {
    this.config = {
      geminiApiKey: config.geminiApiKey || null,
      ...config
    };
    this.apiEndpoints = {
      gemini: 'https://generativelanguage.googleapis.com/v1beta/models/',
      anthropic: null, // Blocked by CORS
      openai: null,    // Requires API key
      huggingface: null // Requires auth
    };
  }

  /**
   * Update configuration (e.g., API keys)
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Set Gemini API key
   */
  setGeminiApiKey(apiKey) {
    this.config.geminiApiKey = apiKey;
  }

  /**
   * Generate example sentence for a vocabulary word
   */
  async generateExample(word, options = {}) {
    const { useAI = true, simulateDelay = true } = options;
    console.log('Generating example for:', word);
    console.log('Using AI:', useAI);
    try {
      // Simulate AI thinking time for better UX
      if (simulateDelay) {
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
      }

      let example = '';

      // Try AI generation first (if enabled and available)
      if (useAI) {
        console.log('Attempting AI generation...');
        example = await this.tryAIGeneration(word);
      }

      // Fallback to smart template generation
      if (!example) {
        example = this.generateSmartTemplate(word);
      }

      return {
        success: true,
        example: example,
        source: example.includes('[AI]') ? 'ai' : 'template'
      };

    } catch (error) {
      // Ultimate fallback
      const fallback = this.generateBasicTemplate(word);
      return {
        success: true,
        example: fallback,
        source: 'fallback',
        error: error.message
      };
    }
  }

  /**
   * Try AI-based generation with Google Gemini
   */
  async tryAIGeneration(word) {
    // Check if we have API key configured
    if (!this.config.geminiApiKey) {
      console.warn('Gemini API key not configured');
      return null;
    }

    const ai = new GoogleGenAI({ apiKey: this.config.geminiApiKey });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Create a simple, natural Japanese example sentence using the word "${word.kanji}" (${word.reading}) which means "${word.meaning}". 

Please format your response EXACTLY like this:
SENTENCE: [Japanese sentence here]
READING: [Same sentence with all kanji converted to hiragana/katakana]
ENGLISH: [Natural English translation]

Requirements:
- Make the sentence practical for daily conversation  
- Include the word naturally in context
- Keep it under 30 characters in Japanese
- Don't add extra explanations or formatting`,
      });

      console.log('AI response:', response);

      if (response && response.text) {
        // Parse and format the AI response
        const formattedExample = this.parseAIResponse(response.text);
        return formattedExample;
      }

      return null;
    } catch (error) {
      console.error('AI generation failed:', error);
      return null;
    }
  }

  /**
   * Parse and format AI response into clean example sentence
   */
  parseAIResponse(rawText) {
    try {
      console.log('Parsing AI response:', rawText);

      // Clean up the response text
      const cleanText = rawText.trim();

      // Extract sections using regex patterns
      const sentenceMatch = cleanText.match(/SENTENCE:\s*(.+?)(?=\n|READING:|$)/i);
      const readingMatch = cleanText.match(/READING:\s*(.+?)(?=\n|ENGLISH:|$)/i);
      const englishMatch = cleanText.match(/ENGLISH:\s*(.+?)(?=\n|$)/i);

      // Fallback to simpler parsing if structured format fails
      if (!sentenceMatch || !englishMatch) {
        console.warn('Structured parsing failed, trying fallback parsing');
        return this.parseAIResponseFallback(cleanText);
      }

      const sentence = sentenceMatch[1].trim();
      const reading = readingMatch ? readingMatch[1].trim() : sentence;
      const english = englishMatch[1].trim();

      // Format as our standard example format
      const formattedExample = `${sentence} (${reading}) - ${english}`;

      console.log('Parsed example:', formattedExample);
      return formattedExample;

    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.parseAIResponseFallback(rawText);
    }
  }

  /**
   * Fallback parser for when structured format fails
   */
  parseAIResponseFallback(rawText) {
    try {
      // Try to extract any Japanese text and English translation
      const lines = rawText.split('\n').filter(line => line.trim());

      let japaneseLine = '';
      let englishLine = '';

      for (const line of lines) {
        // Look for Japanese characters
        if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(line)) {
          japaneseLine = line.trim();
        }
        // Look for English translation (usually has "is", "are", "I", etc.)
        else if (/\b(is|are|I|you|he|she|they|the|a|an)\b/i.test(line)) {
          englishLine = line.trim();
        }
      }

      if (japaneseLine && englishLine) {
        // Clean up any formatting
        japaneseLine = japaneseLine.replace(/^[^:\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]*:?\s*/, '');
        englishLine = englishLine.replace(/^[^a-zA-Z]*:?\s*/, '');

        return `${japaneseLine} - ${englishLine}`;
      }

      // Ultimate fallback - return cleaned raw text
      const cleanedText = rawText.replace(/^[^:\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]*:?\s*/, '').trim();
      return cleanedText.substring(0, 200) + (cleanedText.length > 200 ? '...' : '');

    } catch (error) {
      console.error('Fallback parsing failed:', error);
      return rawText.substring(0, 100) + '...';
    }
  }

  /**
   * Generate context-aware example using smart templates
   */
  generateSmartTemplate(word) {
    const meaning = word.meaning.toLowerCase();

    // Analyze the word meaning for context-appropriate templates
    const templates = this.getContextualTemplates(word, meaning);

    // Pick a random template
    const template = templates[Math.floor(Math.random() * templates.length)];

    return template;
  }

  /**
   * Get contextual templates based on word meaning
   */
  getContextualTemplates(word, meaning) {
    const { kanji, reading } = word;

    // Study/Learning related words
    if (this.matchesKeywords(meaning, ['study', 'learn', 'practice', 'education'])) {
      return [
        `毎日${kanji}をします。(Mainichi ${reading} wo shimasu.) - I ${word.meaning} every day.`,
        `${kanji}は大切です。(${reading} wa taisetsu desu.) - ${word.meaning} is important.`,
        `一緒に${kanji}しましょう。(Issho ni ${reading} shimashou.) - Let's ${word.meaning} together.`,
        `${kanji}が好きです。(${reading} ga suki desu.) - I like ${word.meaning}.`
      ];
    }

    // Places and locations
    if (this.matchesKeywords(meaning, ['school', 'place', 'building', 'room', 'house', 'shop', 'store'])) {
      return [
        `私は${kanji}に行きます。(Watashi wa ${reading} ni ikimasu.) - I go to the ${word.meaning}.`,
        `${kanji}はどこですか？(${reading} wa doko desu ka?) - Where is the ${word.meaning}?`,
        `この${kanji}は大きいです。(Kono ${reading} wa ookii desu.) - This ${word.meaning} is big.`,
        `新しい${kanji}です。(Atarashii ${reading} desu.) - It's a new ${word.meaning}.`
      ];
    }

    // Food and eating
    if (this.matchesKeywords(meaning, ['food', 'eat', 'drink', 'meal', 'rice', 'bread', 'meat', 'vegetable'])) {
      return [
        `${kanji}を食べます。(${reading} wo tabemasu.) - I eat ${word.meaning}.`,
        `${kanji}はおいしいです。(${reading} wa oishii desu.) - ${word.meaning} is delicious.`,
        `私は${kanji}が好きです。(Watashi wa ${reading} ga suki desu.) - I like ${word.meaning}.`,
        `${kanji}を作ります。(${reading} wo tsukurimasu.) - I make ${word.meaning}.`
      ];
    }

    // People and relationships
    if (this.matchesKeywords(meaning, ['person', 'people', 'friend', 'family', 'teacher', 'student', 'mother', 'father'])) {
      return [
        `あの${kanji}は誰ですか？(Ano ${reading} wa dare desu ka?) - Who is that ${word.meaning}?`,
        `${kanji}と話します。(${reading} to hanashimasu.) - I talk with the ${word.meaning}.`,
        `優しい${kanji}です。(Yasashii ${reading} desu.) - They are a kind ${word.meaning}.`,
        `私の${kanji}です。(Watashi no ${reading} desu.) - It's my ${word.meaning}.`
      ];
    }

    // Time and temporal concepts
    if (this.matchesKeywords(meaning, ['time', 'day', 'year', 'month', 'week', 'morning', 'evening', 'night'])) {
      return [
        `${kanji}はいつですか？(${reading} wa itsu desu ka?) - When is ${word.meaning}?`,
        `毎${kanji}します。(Mai ${reading} shimasu.) - I do it every ${word.meaning}.`,
        `この${kanji}は忙しいです。(Kono ${reading} wa isogashii desu.) - This ${word.meaning} is busy.`,
        `${kanji}になりました。(${reading} ni narimashita.) - It became ${word.meaning}.`
      ];
    }

    // Actions and verbs
    if (this.matchesKeywords(meaning, ['go', 'come', 'see', 'watch', 'read', 'write', 'speak', 'listen'])) {
      return [
        `私は${kanji}ます。(Watashi wa ${reading}masu.) - I ${word.meaning}.`,
        `${kanji}ましょう。(${reading}mashou.) - Let's ${word.meaning}.`,
        `${kanji}たいです。(${reading}tai desu.) - I want to ${word.meaning}.`,
        `${kanji}ることができます。(${reading}ru koto ga dekimasu.) - I can ${word.meaning}.`
      ];
    }

    // Objects and things
    if (this.matchesKeywords(meaning, ['book', 'pen', 'paper', 'computer', 'phone', 'car', 'train', 'bag'])) {
      return [
        `新しい${kanji}を買いました。(Atarashii ${reading} wo kaimashita.) - I bought a new ${word.meaning}.`,
        `${kanji}はどこにありますか？(${reading} wa doko ni arimasu ka?) - Where is the ${word.meaning}?`,
        `この${kanji}は便利です。(Kono ${reading} wa benri desu.) - This ${word.meaning} is convenient.`,
        `${kanji}を使います。(${reading} wo tsukai masu.) - I use the ${word.meaning}.`
      ];
    }

    // Default general templates
    return [
      `これは${kanji}です。(Kore wa ${reading} desu.) - This is ${word.meaning}.`,
      `${kanji}について話しましょう。(${reading} ni tsuite hanashimashou.) - Let's talk about ${word.meaning}.`,
      `私は${kanji}が必要です。(Watashi wa ${reading} ga hitsuyou desu.) - I need ${word.meaning}.`,
      `${kanji}はとても便利です。(${reading} wa totemo benri desu.) - ${word.meaning} is very useful.`,
      `${kanji}が分かりません。(${reading} ga wakarimasen.) - I don't understand ${word.meaning}.`
    ];
  }

  /**
   * Check if meaning matches any of the keywords
   */
  matchesKeywords(meaning, keywords) {
    return keywords.some(keyword => meaning.includes(keyword));
  }

  /**
   * Generate basic fallback template
   */
  generateBasicTemplate(word) {
    const templates = [
      `${word.kanji}は大切です。(${word.reading} wa taisetsu desu.) - ${word.meaning} is important.`,
      `これは${word.kanji}です。(Kore wa ${word.reading} desu.) - This is ${word.meaning}.`,
      `${word.kanji}について勉強します。(${word.reading} ni tsuite benkyou shimasu.) - I study about ${word.meaning}.`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Get a random example from cached examples
   */
  getRandomCachedExample(examples) {
    if (!examples || examples.length === 0) return null;
    return examples[Math.floor(Math.random() * examples.length)];
  }
}

/**
 * Default export - singleton instance
 */
export const exampleGenerator = new ExampleGenerator();

/**
 * Convenience function for quick usage
 */
export async function generateExampleSentence(word, options = {}) {
  return await exampleGenerator.generateExample(word, options);
}

/**
 * Create a configured example generator
 */
export function createExampleGenerator(config = {}) {
  return new ExampleGenerator(config);
}