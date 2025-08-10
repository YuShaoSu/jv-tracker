import { useState, useEffect } from 'react';

export const useVocabulary = () => {
  const [vocabulary, setVocabulary] = useState([]);

  // Sample initial data
  useEffect(() => {
    const sampleData = [
      {
        id: 1,
        kanji: '勉強',
        reading: 'べんきょう',
        meaning: 'study, learning',
        status: 'learning',
        addedDate: new Date().toISOString(),
        examples: []
      },
      {
        id: 2,
        kanji: '学校',
        reading: 'がっこう',
        meaning: 'school',
        status: 'know_well',
        addedDate: new Date().toISOString(),
        examples: []
      }
    ];

    // Try to load from localStorage first
    const savedVocabulary = localStorage.getItem('japaneseVocabulary');
    
    if (savedVocabulary) {
      setVocabulary(JSON.parse(savedVocabulary));
    } else {
      setVocabulary(sampleData);
    }
  }, []);

  // Save to localStorage whenever vocabulary changes
  useEffect(() => {
    localStorage.setItem('japaneseVocabulary', JSON.stringify(vocabulary));
  }, [vocabulary]);

  const addWord = (newWord) => {
    const word = {
      id: Date.now(),
      ...newWord,
      status: 'learning',
      addedDate: new Date().toISOString(),
      examples: []
    };
    setVocabulary(prev => [...prev, word]);
  };

  const updateWordStatus = (id, status) => {
    setVocabulary(prev => prev.map(word =>
      word.id === id ? { ...word, status } : word
    ));
  };

  const deleteWord = (id) => {
    setVocabulary(prev => prev.filter(word => word.id !== id));
  };

  const updateWordExamples = (id, newExample) => {
    setVocabulary(prev => prev.map(word => {
      if (word.id === id) {
        const updatedExamples = [...(word.examples || []), newExample];
        return { ...word, examples: updatedExamples };
      }
      return word;
    }));
  };

  const getStatusCounts = () => {
    return vocabulary.reduce((acc, word) => {
      acc[word.status] = (acc[word.status] || 0) + 1;
      return acc;
    }, {});
  };

  return {
    vocabulary,
    setVocabulary,
    addWord,
    updateWordStatus,
    deleteWord,
    updateWordExamples,
    getStatusCounts
  };
};