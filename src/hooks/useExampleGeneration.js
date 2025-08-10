import { useState, useEffect } from 'react';
import { exampleGenerator } from '../services/exampleGenerator';

export const useExampleGeneration = () => {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Load Gemini API key from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('appsScriptSettings');
    
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      const apiKey = settings.geminiApiKey || '';
      setGeminiApiKey(apiKey);
      
      if (apiKey) {
        exampleGenerator.setGeminiApiKey(apiKey);
      }
    }
  }, []);

  const updateGeminiApiKey = (apiKey) => {
    setGeminiApiKey(apiKey);
    
    if (apiKey) {
      exampleGenerator.setGeminiApiKey(apiKey);
    } else {
      exampleGenerator.setGeminiApiKey(null);
    }

    // Update localStorage
    const savedSettings = localStorage.getItem('appsScriptSettings');
    const settings = savedSettings ? JSON.parse(savedSettings) : {};
    settings.geminiApiKey = apiKey;
    localStorage.setItem('appsScriptSettings', JSON.stringify(settings));
  };

  const generateExample = async (word, updateWordExamples) => {
    // Check if we already have cached examples
    if (word.examples && word.examples.length > 0) {
      const randomExample = word.examples[Math.floor(Math.random() * word.examples.length)];
      return { success: true, example: randomExample, fromCache: true };
    }

    setIsGenerating(true);
    try {
      // Use the ExampleGenerator service
      const result = await exampleGenerator.generateExample(word, {
        useAI: !!geminiApiKey, // Enable AI only if API key is configured
        simulateDelay: true
      });

      if (result.success) {
        // Cache the example sentence
        if (updateWordExamples) {
          updateWordExamples(word.id, result.example);
        }
        
        return { success: true, example: result.example, fromCache: false };
      } else {
        return { 
          success: false, 
          example: 'Sorry, could not generate example sentence at this time.',
          fromCache: false
        };
      }
    } catch (error) {
      console.error('Example generation failed:', error);
      return { 
        success: false, 
        example: 'Sorry, could not generate example sentence at this time.',
        fromCache: false
      };
    } finally {
      setIsGenerating(false);
    }
  };

  const clearGeminiApiKey = () => {
    setGeminiApiKey('');
    exampleGenerator.setGeminiApiKey(null);
    
    // Update localStorage
    const savedSettings = localStorage.getItem('appsScriptSettings');
    const settings = savedSettings ? JSON.parse(savedSettings) : {};
    delete settings.geminiApiKey;
    localStorage.setItem('appsScriptSettings', JSON.stringify(settings));
  };

  return {
    geminiApiKey,
    isGenerating,
    updateGeminiApiKey,
    generateExample,
    clearGeminiApiKey
  };
};