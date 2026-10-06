import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createElement } from 'react';

const authState = vi.hoisted(() => ({ isAuthenticated: true }));

vi.mock('@workspace/replit-auth-web', () => ({
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: authState.isAuthenticated,
    user: authState.isAuthenticated ? { id: 'test-user', firstName: 'Test', email: 'test@example.test' } : null,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('@workspace/api-client-react', async importOriginal => {
  const actual = await importOriginal();
  const query = data => ({ data, isLoading: false, isError: false, refetch: vi.fn() });
  const mutation = () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false });

  return {
    ...actual,
    useListPublicSkills: () => query({
      skills: [],
      total: 0,
      pageSize: 24,
      facets: { categories: [], languages: [], frameworks: [], useCases: [], creators: [], tags: [] },
    }),
    useListSkills: () => query({ skills: [] }),
    useCreateSkill: mutation,
    useCreateSkillVersion: mutation,
    useRequestUploadUrl: mutation,
  };
});

import App from '../App.tsx';

const expectedDestinations = ['/', '/skills', '/gallery', '/ask', '/questions'];

function openPath(path) {
  window.history.replaceState({}, '', path);
  return render(createElement(App));
}

describe('public Gallery navigation', () => {
  beforeEach(() => {
    authState.isAuthenticated = true;
  });

  afterEach(() => {
    cleanup();
    window.history.replaceState({}, '', '/');
  });

  it('keeps all primary destinations available and marks Gallery active after navigating from the workspace', async () => {
    openPath('/skills');
    fireEvent.click(screen.getByTestId('link-nav-gallery'));

    let navigation = await screen.findByTestId('gallery-primary-navigation');
    expect(screen.getByRole('heading', { name: 'Find a skill for what you’re building.' })).toBeTruthy();
    expect(within(navigation).getAllByRole('link').map(link => link.getAttribute('href'))).toEqual(expectedDestinations);
    expect(within(navigation).getByTestId('link-gallery-nav-gallery').getAttribute('aria-current')).toBe('page');

    fireEvent.click(within(navigation).getByTestId('link-gallery-nav-skills'));
    expect(await screen.findByRole('heading', { name: 'Your skills.' })).toBeTruthy();

    fireEvent.click(screen.getByTestId('link-nav-gallery'));
    navigation = await screen.findByTestId('gallery-primary-navigation');
    expect(within(navigation).getByTestId('link-gallery-nav-gallery').getAttribute('aria-current')).toBe('page');
  });

  it('renders the public Gallery while signed out and keeps private destinations behind sign-in', async () => {
    authState.isAuthenticated = false;
    openPath('/gallery');

    let navigation = await screen.findByTestId('gallery-primary-navigation');
    expect(screen.getByRole('heading', { name: 'Find a skill for what you’re building.' })).toBeTruthy();
    expect(screen.queryByTestId('button-login')).toBeNull();
    expect(within(navigation).getAllByRole('link').map(link => link.getAttribute('href'))).toEqual(expectedDestinations);

    fireEvent.click(within(navigation).getByTestId('link-gallery-nav-skills'));
    expect(await screen.findByTestId('button-login')).toBeTruthy();
    fireEvent.click(screen.getByTestId('link-public-gallery'));

    navigation = await screen.findByTestId('gallery-primary-navigation');
    expect(screen.getByRole('heading', { name: 'Find a skill for what you’re building.' })).toBeTruthy();
    expect(within(navigation).getByTestId('link-gallery-nav-gallery').getAttribute('aria-current')).toBe('page');
  });
});
