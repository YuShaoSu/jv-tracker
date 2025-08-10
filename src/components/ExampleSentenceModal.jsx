import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ExampleSentenceModal = ({
  isOpen,
  onClose,
  selectedWord,
  exampleHook,
  updateWordExamples
}) => {
  const [generatedSentence, setGeneratedSentence] = useState('');
  const { isGenerating, generateExample } = exampleHook;

  useEffect(() => {
    if (isOpen && selectedWord) {
      handleGenerateExample();
    }
  }, [isOpen, selectedWord]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerateExample = async () => {
    if (!selectedWord) return;

    const result = await generateExample(selectedWord, updateWordExamples);
    setGeneratedSentence(result.example);
  };

  const handleShowAnotherExample = () => {
    if (selectedWord?.examples && selectedWord.examples.length > 0) {
      const randomExample = selectedWord.examples[Math.floor(Math.random() * selectedWord.examples.length)];
      setGeneratedSentence(randomExample);
    }
  };

  const handleClose = () => {
    setGeneratedSentence('');
    onClose();
  };

  if (!isOpen || !selectedWord) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl mx-3 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 pr-2">
            Example for: {selectedWord.kanji} ({selectedWord.reading})
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="mb-4">
          <div className="text-gray-600 mb-2 text-sm sm:text-base">Meaning: {selectedWord.meaning}</div>
          {selectedWord.examples && selectedWord.examples.length > 0 && (
            <div className="text-blue-600 text-sm">
              {selectedWord.examples.length} cached example{selectedWord.examples.length > 1 ? 's' : ''} available
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 min-h-24">
          {isGenerating ? (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600 text-sm sm:text-base">Generating example sentence...</span>
            </div>
          ) : generatedSentence ? (
            <div className="text-gray-800 whitespace-pre-wrap text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
              {generatedSentence}
            </div>
          ) : (
            <div className="text-gray-500 text-sm sm:text-base">
              {selectedWord.examples && selectedWord.examples.length > 0
                ? 'Click "Show Another Example" to see a different example.'
                : 'Click "Generate New Example" to see an example sentence.'
              }
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
          <button
            onClick={handleGenerateExample}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            {selectedWord.examples && selectedWord.examples.length > 0
              ? (isGenerating ? 'Generating...' : 'Generate New Example')
              : (isGenerating ? 'Generating...' : 'Generate Example')
            }
          </button>
          {selectedWord.examples && selectedWord.examples.length > 0 && (
            <button
              onClick={handleShowAnotherExample}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Show Another Example
            </button>
          )}
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExampleSentenceModal;