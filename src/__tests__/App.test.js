import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock the JapaneseVocabTracker component
jest.mock('../components/JapaneseVocabTracker', () => {
  return function MockJapaneseVocabTracker() {
    return <div data-testid="japanese-vocab-tracker">Mocked Japanese Vocab Tracker</div>;
  };
});

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('japanese-vocab-tracker')).toBeInTheDocument();
  });

  test('renders the main application component', () => {
    render(<App />);
    expect(screen.getByText('Mocked Japanese Vocab Tracker')).toBeInTheDocument();
  });
});