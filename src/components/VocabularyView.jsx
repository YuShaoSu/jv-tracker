import React from 'react';
import { Plus } from 'lucide-react';
import WordCard from './WordCard';

const VocabularyView = ({ vocabulary, onShowAddForm, onDeleteWord, onUpdateWordStatus, onShowExample }) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900">All Vocabulary</h2>
        <button
          onClick={onShowAddForm}
          className="flex items-center gap-2 bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
          Add Word
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {vocabulary.map(word => (
          <WordCard
            key={word.id}
            word={word}
            onDelete={onDeleteWord}
            onUpdateStatus={onUpdateWordStatus}
            onShowExample={onShowExample}
          />
        ))}
      </div>
    </div>
  );
};

export default VocabularyView;