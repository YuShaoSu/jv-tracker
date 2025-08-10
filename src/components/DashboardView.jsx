import React from 'react';
import { Brain, BookOpen, RotateCcw } from 'lucide-react';
import WordCard from './WordCard';

const DashboardView = ({ statusCounts, vocabulary, onDeleteWord, onUpdateWordStatus, onShowExample }) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Brain size={16} className="text-white sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-green-700">
                {statusCounts.know_well || 0}
              </div>
              <div className="text-green-600 text-xs sm:text-sm">Know Well</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500 rounded-full flex items-center justify-center">
              <BookOpen size={16} className="text-white sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-yellow-700">
                {statusCounts.learning || 0}
              </div>
              <div className="text-yellow-600 text-xs sm:text-sm">Learning</div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-full flex items-center justify-center">
              <RotateCcw size={16} className="text-white sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-red-700">
                {statusCounts.often_forget || 0}
              </div>
              <div className="text-red-600 text-xs sm:text-sm">Need Review</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Words</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {vocabulary.slice(0, 6).map(word => (
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
    </div>
  );
};

export default DashboardView;