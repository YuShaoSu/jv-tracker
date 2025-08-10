import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LearnView from '../LearnView';

// Mock data
const mockVocabulary = [
  {
    id: 1,
    kanji: '学校',
    reading: 'がっこう',
    meaning: 'school',
    status: 'learning',
    addedDate: '2024-01-01',
    examples: ['私は学校に行きます。']
  },
  {
    id: 2,
    kanji: '本',
    reading: 'ほん',
    meaning: 'book',
    status: 'often_forget',
    addedDate: '2024-01-01',
    examples: []
  },
  {
    id: 3,
    kanji: '水',
    reading: 'みず',
    meaning: 'water',
    status: 'know_well',
    addedDate: '2024-01-01',
    examples: []
  }
];

const mockOnUpdateWordStatus = jest.fn();

describe('LearnView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders empty state when no vocabulary', () => {
    render(<LearnView vocabulary={[]} onUpdateWordStatus={mockOnUpdateWordStatus} />);
    
    expect(screen.getByText('No Vocabulary to Learn')).toBeInTheDocument();
    expect(screen.getByText('Add some vocabulary words to start your learning session.')).toBeInTheDocument();
  });

  test('shows filter selection interface initially', () => {
    render(<LearnView vocabulary={mockVocabulary} onUpdateWordStatus={mockOnUpdateWordStatus} />);
    
    // Should show filter selection interface
    expect(screen.getByText('Choose What to Study')).toBeInTheDocument();
    expect(screen.getByText('Select which vocabulary statuses you want to practice with')).toBeInTheDocument();
    
    // Should show status options
    expect(screen.getByText('Often Forget')).toBeInTheDocument();
    expect(screen.getByText('Learning')).toBeInTheDocument();
    expect(screen.getByText('Know Well')).toBeInTheDocument();
    
    // Should show start session button
    expect(screen.getByText('Start Learning Session')).toBeInTheDocument();
  });

  test('can start learning session with default filters', () => {
    render(<LearnView vocabulary={mockVocabulary} onUpdateWordStatus={mockOnUpdateWordStatus} />);
    
    // Click start session
    fireEvent.click(screen.getByText('Start Learning Session'));
    
    // Should show learning session interface
    expect(screen.getByText('Learning Session')).toBeInTheDocument();
    expect(screen.getByText('Reveal Answer')).toBeInTheDocument();
  });

  test('can filter vocabulary by status', () => {
    render(<LearnView vocabulary={mockVocabulary} onUpdateWordStatus={mockOnUpdateWordStatus} />);
    
    // By default, "Often Forget" and "Learning" are selected (2 words)
    expect(screen.getByText('Selected: 2 words')).toBeInTheDocument();
    
    // Uncheck "Learning" status
    const learningCheckbox = screen.getByLabelText(/Learning/);
    fireEvent.click(learningCheckbox);
    
    // Should now show only 1 word (Often Forget)
    expect(screen.getByText('Selected: 1 words')).toBeInTheDocument();
  });

  test('can reveal answer', () => {
    render(<LearnView vocabulary={mockVocabulary} onUpdateWordStatus={mockOnUpdateWordStatus} />);
    
    // Start session first
    fireEvent.click(screen.getByText('Start Learning Session'));
    
    // Click reveal answer
    fireEvent.click(screen.getByText('Reveal Answer'));
    
    // Should show action buttons
    expect(screen.getByText('Got It Right')).toBeInTheDocument();
    expect(screen.getByText('Didn\'t Know')).toBeInTheDocument();
    expect(screen.getByText('Skip')).toBeInTheDocument();
  });

  test('can mark word as correct and updates status', () => {
    render(<LearnView vocabulary={mockVocabulary} onUpdateWordStatus={mockOnUpdateWordStatus} />);
    
    // Start session first
    fireEvent.click(screen.getByText('Start Learning Session'));
    
    // Reveal answer first
    fireEvent.click(screen.getByText('Reveal Answer'));
    
    // Click "Got It Right"
    fireEvent.click(screen.getByText('Got It Right'));
    
    // Should have called onUpdateWordStatus with 'know_well' status
    expect(mockOnUpdateWordStatus).toHaveBeenCalledWith(expect.any(Number), 'know_well');
  });

  test('can mark word as incorrect and updates status', () => {
    render(<LearnView vocabulary={mockVocabulary} onUpdateWordStatus={mockOnUpdateWordStatus} />);
    
    // Start session first
    fireEvent.click(screen.getByText('Start Learning Session'));
    
    // Reveal answer first
    fireEvent.click(screen.getByText('Reveal Answer'));
    
    // Click "Didn't Know"
    fireEvent.click(screen.getByText('Didn\'t Know'));
    
    // Should have called onUpdateWordStatus with 'often_forget' status
    expect(mockOnUpdateWordStatus).toHaveBeenCalledWith(expect.any(Number), 'often_forget');
  });

  test('can skip word and updates status to learning', () => {
    render(<LearnView vocabulary={mockVocabulary} onUpdateWordStatus={mockOnUpdateWordStatus} />);
    
    // Start session first
    fireEvent.click(screen.getByText('Start Learning Session'));
    
    // Reveal answer first
    fireEvent.click(screen.getByText('Reveal Answer'));
    
    // Click "Skip"
    fireEvent.click(screen.getByText('Skip'));
    
    // Should have called onUpdateWordStatus with 'learning' status
    expect(mockOnUpdateWordStatus).toHaveBeenCalledWith(expect.any(Number), 'learning');
  });

  test('can restart session', () => {
    render(<LearnView vocabulary={mockVocabulary} onUpdateWordStatus={mockOnUpdateWordStatus} />);
    
    // Start session first
    fireEvent.click(screen.getByText('Start Learning Session'));
    
    // Find and click restart button
    const restartButton = screen.getByText('Restart');
    fireEvent.click(restartButton);
    
    // Should reset to first card
    expect(screen.getByText(/Card 1 of 2/)).toBeInTheDocument();
    expect(screen.getByText('Reveal Answer')).toBeInTheDocument();
  });

  test('can navigate back to filters', () => {
    render(<LearnView vocabulary={mockVocabulary} onUpdateWordStatus={mockOnUpdateWordStatus} />);
    
    // Start session first
    fireEvent.click(screen.getByText('Start Learning Session'));
    
    // Click change filters button
    fireEvent.click(screen.getByText('Change Filters'));
    
    // Should be back to filter selection
    expect(screen.getByText('Choose What to Study')).toBeInTheDocument();
  });

  test('can navigate through multiple cards without returning to filter selection', () => {
    render(<LearnView vocabulary={mockVocabulary} onUpdateWordStatus={mockOnUpdateWordStatus} />);
    
    // Start session first
    fireEvent.click(screen.getByText('Start Learning Session'));
    
    // Should be on card 1 of 2
    expect(screen.getByText(/Card 1 of 2/)).toBeInTheDocument();
    
    // Reveal and answer first card
    fireEvent.click(screen.getByText('Reveal Answer'));
    fireEvent.click(screen.getByText('Got It Right'));
    
    // Should now be on card 2 of 2 (not back to filter selection)
    expect(screen.getByText(/Card 2 of 2/)).toBeInTheDocument();
    expect(screen.getByText('Reveal Answer')).toBeInTheDocument();
    
    // Complete second card
    fireEvent.click(screen.getByText('Reveal Answer'));
    fireEvent.click(screen.getByText('Got It Right'));
    
    // Should now show session complete message
    expect(screen.getByText('Session Complete!')).toBeInTheDocument();
    expect(screen.getByText('You\'ve completed all 2 cards in this session.')).toBeInTheDocument();
  });

  test('can restart session after completion', () => {
    render(<LearnView vocabulary={mockVocabulary} onUpdateWordStatus={mockOnUpdateWordStatus} />);
    
    // Start session first
    fireEvent.click(screen.getByText('Start Learning Session'));
    
    // Complete both cards quickly
    fireEvent.click(screen.getByText('Reveal Answer'));
    fireEvent.click(screen.getByText('Got It Right'));
    fireEvent.click(screen.getByText('Reveal Answer'));
    fireEvent.click(screen.getByText('Got It Right'));
    
    // Should show session complete message
    expect(screen.getByText('Session Complete!')).toBeInTheDocument();
    
    // Click restart session
    fireEvent.click(screen.getByText('Start New Session'));
    
    // Should be back to learning interface with a new session
    expect(screen.getByText('Learning Session')).toBeInTheDocument();
    expect(screen.getByText(/Card 1 of 2/)).toBeInTheDocument();
    expect(screen.getByText('Reveal Answer')).toBeInTheDocument();
    
    // Session stats should be reset - check that there are multiple zeros (all stats reset)
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(4); // Correct, Incorrect, Skipped, Total should all be 0
  });
});