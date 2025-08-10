import React from 'react';
import WordCard from './WordCard';

const ReviewView = ({ vocabulary, onDeleteWord, onUpdateWordStatus, onShowExample }) => {
  const wordsToReview = vocabulary.filter(word => word.status === 'often_forget');

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Words to Review</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {wordsToReview.map(word => (
          <WordCard
            key={word.id}
            word={word}
            onDelete={onDeleteWord}
            onUpdateStatus={onUpdateWordStatus}
            onShowExample={onShowExample}
          />
        ))}
        {wordsToReview.length === 0 && (
          <div className="col-span-full text-center py-8 sm:py-12">
            <div className="text-gray-400 text-base sm:text-lg">Great job! No words need review right now.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewView;