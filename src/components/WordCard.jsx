import React from 'react';
import { X, Eye } from 'lucide-react';
import { STATUS_COLORS, STATUS_LABELS } from '../constants/vocabulary';

const WordCard = ({ word, onDelete, onUpdateStatus, onShowExample }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 break-words" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
            {word.kanji}
          </div>
          <div className="text-base sm:text-lg text-gray-600 mb-2 break-words" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
            {word.reading}
          </div>
          <div className="text-sm sm:text-base text-gray-700 mb-3 break-words">
            {word.meaning}
          </div>
          {word.examples && word.examples.length > 0 && (
            <div className="text-xs text-blue-600 mb-2">
              {word.examples.length} cached example{word.examples.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
        <button
          onClick={() => onDelete(word.id)}
          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
        >
          <X size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
      </div>

      <div className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border mb-3 ${STATUS_COLORS[word.status]}`}>
        {STATUS_LABELS[word.status]}
      </div>

      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 mb-3">
        <button
          onClick={() => onUpdateStatus(word.id, 'often_forget')}
          className="flex-1 py-1.5 sm:py-2 px-2 sm:px-3 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-xs sm:text-sm"
        >
          Often Forget
        </button>
        <button
          onClick={() => onUpdateStatus(word.id, 'learning')}
          className="flex-1 py-1.5 sm:py-2 px-2 sm:px-3 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors text-xs sm:text-sm"
        >
          Learning
        </button>
        <button
          onClick={() => onUpdateStatus(word.id, 'know_well')}
          className="flex-1 py-1.5 sm:py-2 px-2 sm:px-3 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-xs sm:text-sm"
        >
          Know Well
        </button>
      </div>

      <button
        onClick={() => onShowExample(word)}
        className="w-full py-2 px-3 sm:px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
      >
        <Eye size={14} className="sm:w-4 sm:h-4" />
        {word.examples && word.examples.length > 0 ? 'Show Example' : 'Generate Example'}
      </button>
    </div>
  );
};

export default WordCard;