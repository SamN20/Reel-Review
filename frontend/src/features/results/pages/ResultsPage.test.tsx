import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import ResultsPage from './ResultsPage';

// Mock axios
vi.mock('axios');

// Mock AuthContext hook
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'tester', is_admin: false },
    loading: false,
  }),
  AuthProvider: ({ children }: any) => <div>{children}</div>,
}));

const mockResultsData = {
  drop_id: 13,
  movie: {
    id: 1,
    title: 'Test Movie',
    release_date: '2024-01-01',
    backdrop_path: '/path.jpg',
  },
  official_score: 90,
  user_score: null, // User hasn't voted
  total_votes: 10,
  sub_categories: {
    story: 85,
    performances: 95,
  },
  reviews: [
    {
      id: 1,
      user_name: 'test_user',
      overall_score: 95,
      review_text: 'Loved it!',
      is_spoiler: false,
    }
  ]
};

describe('ResultsPage', () => {
  it('renders loading state initially', () => {
    vi.mocked(axios.get).mockImplementation(() => new Promise(() => {})); // Never resolves
    render(
      <MemoryRouter initialEntries={['/results/13']}>
        <Routes>
          <Route path="/results/:id" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('renders results and Rate Now button when user has not voted', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: mockResultsData });
    
    render(
      <MemoryRouter initialEntries={['/results/13']}>
        <Routes>
          <Route path="/results/:id" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the movie title to be rendered
    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeInTheDocument();
    });

    // Check for Official Score
    expect(screen.getByText('90')).toBeInTheDocument();

    // Check for Rate Now button since user hasn't voted
    expect(screen.getByRole('button', { name: /Rate Now/i })).toBeInTheDocument();

    // Check review
    expect(screen.getByText('Loved it!')).toBeInTheDocument();
  });

  it('renders user score when user has voted', async () => {
    const votedData = { ...mockResultsData, user_score: 85 };
    vi.mocked(axios.get).mockResolvedValue({ data: votedData });
    
    render(
      <MemoryRouter initialEntries={['/results/13']}>
        <Routes>
          <Route path="/results/:id" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Your Vote')).toBeInTheDocument();
    });

    // Score comparison text
    expect(screen.getByText(/lower/i)).toBeInTheDocument();
    
    // Rate Now should NOT be there
    expect(screen.queryByRole('button', { name: /Rate Now/i })).not.toBeInTheDocument();
  });
});
