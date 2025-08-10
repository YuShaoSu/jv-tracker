import React, { useState, useEffect } from 'react';
import { ChevronRight, RotateCcw, Eye, CheckCircle2, XCircle, SkipForward, Filter, Play } from 'lucide-react';
import { STATUS_COLORS, STATUS_LABELS } from '../constants/vocabulary';

const LearnView = ({ vocabulary, onUpdateWordStatus }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    skipped: 0,
    total: 0
  });
  const [completedWords, setCompletedWords] = useState(new Set());
  const [shuffledVocabulary, setShuffledVocabulary] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState({
    'often_forget': true,
    'learning': true,
    'know_well': false
  });
  const [sessionStarted, setSessionStarted] = useState(false);

  // Filter vocabulary based on selected statuses
  const getFilteredVocabulary = () => {
    return vocabulary.filter(word => selectedStatuses[word.status]);
  };

  // Initialize shuffled vocabulary when filters change (only for filter preview, not for active sessions)
  useEffect(() => {
    if (!sessionStarted) {
      const filteredVocabulary = vocabulary.filter(word => selectedStatuses[word.status]);
      if (filteredVocabulary.length > 0) {
        const shuffled = [...filteredVocabulary].sort(() => Math.random() - 0.5);
        setShuffledVocabulary(shuffled);
      } else {
        setShuffledVocabulary([]);
      }
      setCurrentIndex(0);
      setShowAnswer(false);
      setCompletedWords(new Set());
      setSessionStats({ correct: 0, incorrect: 0, skipped: 0, total: 0 });
    }
  }, [vocabulary, selectedStatuses, sessionStarted]);

  const currentWord = shuffledVocabulary[currentIndex];
  const totalWords = shuffledVocabulary.length;
  const progress = totalWords > 0 ? ((currentIndex / totalWords) * 100) : 0;

  const handleRevealAnswer = () => {
    setShowAnswer(true);
  };

  const handleNext = (result = 'skip') => {
    if (currentWord && !completedWords.has(currentWord.id)) {
      setCompletedWords(prev => new Set([...prev, currentWord.id]));
      setSessionStats(prev => ({
        ...prev,
        [result]: prev[result] + 1,
        total: prev.total + 1
      }));
    }

    if (currentIndex < shuffledVocabulary.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      // Session complete - just hide the answer so completion message shows
      setShowAnswer(false);
    }
  };

  const handleCorrect = () => {
    if (currentWord) {
      // Always update to "know_well" when user gets it right
      onUpdateWordStatus(currentWord.id, 'know_well');
    }
    handleNext('correct');
  };

  const handleIncorrect = () => {
    if (currentWord) {
      // Always update to "often_forget" when user doesn't know
      onUpdateWordStatus(currentWord.id, 'often_forget');
    }
    handleNext('incorrect');
  };

  const handleSkip = () => {
    if (currentWord) {
      // Set to "learning" status when skipped (neutral progress)
      onUpdateWordStatus(currentWord.id, 'learning');
    }
    handleNext('skip');
  };

  const handleStatusToggle = (status) => {
    setSelectedStatuses(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const startSession = () => {
    const filteredVocabulary = vocabulary.filter(word => selectedStatuses[word.status]);
    if (filteredVocabulary.length > 0) {
      const shuffled = [...filteredVocabulary].sort(() => Math.random() - 0.5);
      setShuffledVocabulary(shuffled);
      setCurrentIndex(0);
      setShowAnswer(false);
      setCompletedWords(new Set());
      setSessionStats({ correct: 0, incorrect: 0, skipped: 0, total: 0 });
      setSessionStarted(true);
    }
  };

  const restartSession = () => {
    const filteredVocabulary = vocabulary.filter(word => selectedStatuses[word.status]);
    if (filteredVocabulary.length > 0) {
      const shuffled = [...filteredVocabulary].sort(() => Math.random() - 0.5);
      setShuffledVocabulary(shuffled);
      setCurrentIndex(0);
      setShowAnswer(false);
      setCompletedWords(new Set());
      setSessionStats({ correct: 0, incorrect: 0, skipped: 0, total: 0 });
      setSessionStarted(true);
    }
  };

  const backToFilters = () => {
    setSessionStarted(false);
  };

  if (vocabulary.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Vocabulary to Learn</h3>
        <p className="text-gray-600 mb-6">Add some vocabulary words to start your learning session.</p>
        <div className="text-sm text-gray-500">
          Go to the Vocabulary tab to add new words.
        </div>
      </div>
    );
  }

  const filteredCount = getFilteredVocabulary().length;
  const hasSelectedStatuses = Object.values(selectedStatuses).some(selected => selected);

  // Show filter interface if session hasn't started
  if (!sessionStarted) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Choose What to Study</h3>
            <p className="text-gray-600">Select which vocabulary statuses you want to practice with</p>
          </div>

          <div className="max-w-md mx-auto space-y-4">
            <div className="text-sm font-medium text-gray-700 mb-3">Select Status Types:</div>
            
            {Object.entries(STATUS_LABELS).map(([status, label]) => {
              const count = vocabulary.filter(word => word.status === status).length;
              return (
                <label
                  key={status}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedStatuses[status] 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedStatuses[status]}
                      onChange={() => handleStatusToggle(status)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border mr-2 ${STATUS_COLORS[status]}`}>
                        {label}
                      </span>
                      <span className="text-sm text-gray-600">({count} words)</span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <div className="mb-4">
              <span className="text-lg font-medium text-gray-700">
                Selected: {filteredCount} words
              </span>
            </div>
            
            {!hasSelectedStatuses ? (
              <div className="text-red-600 text-sm mb-4">
                Please select at least one status type to study.
              </div>
            ) : filteredCount === 0 ? (
              <div className="text-orange-600 text-sm mb-4">
                No words found with the selected statuses.
              </div>
            ) : (
              <button
                onClick={startSession}
                className="flex items-center gap-2 mx-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
              >
                <Play size={20} />
                Start Learning Session
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h3>
      </div>
    );
  }

  const isSessionComplete = currentIndex >= shuffledVocabulary.length - 1 && currentWord && completedWords.has(currentWord.id);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Learning Session</h3>
            <button
              onClick={backToFilters}
              className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Filter size={12} />
              <span className="hidden sm:inline">Change Filters</span>
            </button>
          </div>
          <button
            onClick={restartSession}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">Restart</span>
          </button>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            Card {currentIndex + 1} of {totalWords}
          </span>
          <span className="text-sm text-gray-600">
            {Math.round(progress)}% Complete
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          <div>
            <div className="text-lg font-semibold text-green-600">{sessionStats.correct}</div>
            <div className="text-gray-500">Correct</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-red-600">{sessionStats.incorrect}</div>
            <div className="text-gray-500">Incorrect</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-600">{sessionStats.skipped}</div>
            <div className="text-gray-500">Skipped</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600">{sessionStats.total}</div>
            <div className="text-gray-500">Total</div>
          </div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 sm:p-8">
          {/* Word Status Badge */}
          <div className="flex justify-center mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[currentWord.status]}`}>
              {STATUS_LABELS[currentWord.status]}
            </span>
          </div>

          {/* Kanji Display */}
          <div className="text-center mb-6">
            <div className="text-4xl sm:text-6xl font-bold text-gray-900 mb-3 font-japanese">
              {currentWord.kanji}
            </div>
            <div className="text-lg sm:text-xl text-gray-600 mb-2">
              {currentWord.reading}
            </div>
          </div>

          {/* Answer Section */}
          <div className="text-center mb-8">
            {!showAnswer ? (
              <div>
                <div className="text-gray-500 mb-4">
                  Think about the meaning, then reveal the answer
                </div>
                <button
                  onClick={handleRevealAnswer}
                  className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Eye size={20} />
                  Reveal Answer
                </button>
              </div>
            ) : (
              <div>
                <div className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4">
                  {currentWord.meaning}
                </div>
                {currentWord.examples && currentWord.examples.length > 0 && (
                  <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="font-medium mb-1">Example:</div>
                    <div>{currentWord.examples[0]}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {showAnswer && (
            <div className="space-y-3">
              <div className="text-center text-sm text-gray-600 mb-4">
                How well did you know this word?
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleIncorrect}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  <XCircle size={20} />
                  <div className="text-left">
                    <div>Didn't Know</div>
                    <div className="text-xs opacity-75">→ Often Forget</div>
                  </div>
                </button>
                <button
                  onClick={handleSkip}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  <SkipForward size={20} />
                  <div className="text-left">
                    <div>Skip</div>
                    <div className="text-xs opacity-75">→ Learning</div>
                  </div>
                </button>
                <button
                  onClick={handleCorrect}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  <CheckCircle2 size={20} />
                  <div className="text-left">
                    <div>Got It Right</div>
                    <div className="text-xs opacity-75">→ Know Well</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Next Button for non-answer state */}
          {!showAnswer && (
            <div className="text-center">
              <button
                onClick={handleSkip}
                className="flex items-center justify-center gap-2 mx-auto px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Skip this word
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Session Complete Message */}
        {isSessionComplete && (
          <div className="border-t border-gray-200 p-6 bg-green-50">
            <div className="text-center">
              <div className="text-2xl mb-2">🎉</div>
              <div className="text-lg font-semibold text-green-800 mb-2">Session Complete!</div>
              <div className="text-sm text-green-600 mb-4">
                You've completed all {totalWords} cards in this session.
              </div>
              <button
                onClick={restartSession}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Start New Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnView;