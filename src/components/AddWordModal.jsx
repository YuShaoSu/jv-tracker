import React, { useState } from 'react';

const AddWordModal = ({ isOpen, onClose, onAddWord }) => {
  const [newWord, setNewWord] = useState({
    kanji: '',
    reading: '',
    meaning: ''
  });

  const handleSubmit = () => {
    if (newWord.kanji && newWord.reading && newWord.meaning) {
      onAddWord(newWord);
      setNewWord({ kanji: '', reading: '', meaning: '' });
      onClose();
    }
  };

  const handleClose = () => {
    setNewWord({ kanji: '', reading: '', meaning: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Word</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kanji/Word
            </label>
            <input
              type="text"
              value={newWord.kanji}
              onChange={(e) => setNewWord({ ...newWord, kanji: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="漢字"
              style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reading (Hiragana/Katakana)
            </label>
            <input
              type="text"
              value={newWord.reading}
              onChange={(e) => setNewWord({ ...newWord, reading: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="かんじ"
              style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meaning (English)
            </label>
            <input
              type="text"
              value={newWord.meaning}
              onChange={(e) => setNewWord({ ...newWord, meaning: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="Chinese character"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Add Word
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWordModal;