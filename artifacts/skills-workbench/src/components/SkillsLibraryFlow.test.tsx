import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const mockApi = vi.hoisted(() => ({
  skills: [] as Array<any>,
  createConversation: vi.fn(),
  updateDetails: vi.fn(),
  updatePublication: vi.fn(),
}));

vi.mock('@workspace/replit-auth-web', () => ({
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: true,
    user: { id: 'test-user', firstName: 'Test', email: 'test@example.test' },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('@workspace/api-client-react', async importOriginal => {
  const actual = await importOriginal<typeof import('@workspace/api-client-react')>();
  const mutation = () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false });
  const query = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: vi.fn() });
  return {
    ...actual,
    useListSkills: () => query({ skills: mockApi.skills }),
    useListSkillVersions: (skillId: string) => query({
      versions: mockApi.skills.find(skill => skill.id === skillId)?.versions ?? [],
    }),
    useListSkillVersionShares: () => query({ shares: [] }),
    useCreateSkill: mutation,
    useCreateSkillVersion: mutation,
    useRequestUploadUrl: mutation,
    useUpdateSkillDetails: () => ({ mutateAsync: mockApi.updateDetails, isPending: false }),
    useUpdateSkillPublication: () => ({ mutateAsync: mockApi.updatePublication, isPending: false }),
    useCreateOrRegenerateSkillVersionShare: mutation,
    useRevokeSkillVersionShare: mutation,
    useGetWorkbenchSummary: () => query({ skillCount: mockApi.skills.length, versionCount: 0 }),
    useCreateConversation: () => ({ mutateAsync: mockApi.createConversation, isPending: false }),
    useContinueConversation: mutation,
    useBranchConversation: mutation,
    useDeleteConversation: mutation,
    useDuplicateConversation: mutation,
    useGetConversation: () => query(undefined),
    useListConversations: () => query({ conversations: [] }),
    useRenameConversation: mutation,
    useResetConversationContext: mutation,
    useListPublicSkills: () => query({ skills: [], total: 0 }),
    useGetSharedSkillVersion: () => query(undefined),
  };
});

import App from '../App';

function makeVersion(id: string, versionLabel: string, uploadedAt: string) {
  return {
    id,
    versionLabel,
    fileName: `${id}.zip`,
    fileCount: 1,
    filePaths: ['README.md'],
    uploadedAt,
  };
}

function makeSkill({
  id,
  name,
  description,
  isPublic,
  createdAt,
}: {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
}) {
  const older = makeVersion(`${id}-v1`, '1.0.0', '2026-01-01T00:00:00.000Z');
  const current = makeVersion(`${id}-v2`, '2.0.0', '2026-04-01T00:00:00.000Z');
  return {
    id,
    name,
    description,
    isPublic,
    category: null,
    language: null,
    framework: null,
    useCase: null,
    tags: [],
    creatorLabel: null,
    publishedAt: isPublic ? createdAt : null,
    currentVersionId: current.id,
    versions: [older, current],
    createdAt,
  };
}

function renderSkillsPage() {
  window.history.replaceState({}, '', '/skills');
  return render(<App/>);
}

describe('Skills library user flows', () => {
  beforeEach(() => {
    mockApi.skills = [
      makeSkill({
        id: 'zebra',
        name: 'Zebra Runner',
        description: 'Build orchestration pipelines',
        isPublic: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
      makeSkill({
        id: 'alpha',
        name: 'Alpha Helper',
        description: 'Database migration guidance',
        isPublic: false,
        createdAt: '2026-02-01T00:00:00.000Z',
      }),
      makeSkill({
        id: 'beta',
        name: 'Beta Helper',
        description: 'More orchestration advice',
        isPublic: true,
        createdAt: '2026-03-01T00:00:00.000Z',
      }),
    ];
    mockApi.createConversation.mockReset().mockResolvedValue({});
    mockApi.updateDetails.mockReset().mockResolvedValue({});
    mockApi.updatePublication.mockReset().mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
    window.history.replaceState({}, '', '/');
  });

  it('searches by name and description, filters publication, sorts, switches layout, and resets empty results', () => {
    renderSkillsPage();
    expect(screen.getByTestId('skills-result-count').textContent).toContain('Showing 3 of 3 skills');

    const search = screen.getByTestId('input-search-skills');
    fireEvent.change(search, { target: { value: 'migration' } });
    expect(screen.getByTestId('card-skill-alpha')).toBeTruthy();
    expect(screen.queryByTestId('card-skill-zebra')).toBeNull();

    fireEvent.change(search, { target: { value: 'Zebra' } });
    expect(screen.getByTestId('card-skill-zebra')).toBeTruthy();
    expect(screen.queryByTestId('card-skill-alpha')).toBeNull();

    fireEvent.change(search, { target: { value: '' } });
    fireEvent.change(screen.getByTestId('select-skill-visibility'), { target: { value: 'public' } });
    expect(screen.getByTestId('skills-result-count').textContent).toContain('Showing 2 of 3 skills');
    fireEvent.change(screen.getByTestId('select-skill-visibility'), { target: { value: 'private' } });
    expect(screen.getByTestId('skills-result-count').textContent).toContain('Showing 1 of 3 skills');
    expect(screen.getByTestId('card-skill-alpha')).toBeTruthy();
    expect(screen.queryByTestId('card-skill-zebra')).toBeNull();
    fireEvent.change(screen.getByTestId('select-skill-visibility'), { target: { value: 'public' } });
    fireEvent.change(screen.getByTestId('select-skill-sort'), { target: { value: 'oldest' } });
    let names = within(screen.getByTestId('list-skills'))
      .getAllByTestId(/^text-skill-name-/)
      .map(element => element.textContent);
    expect(names).toEqual(['Zebra Runner', 'Beta Helper']);
    fireEvent.change(screen.getByTestId('select-skill-sort'), { target: { value: 'name' } });
    names = within(screen.getByTestId('list-skills'))
      .getAllByTestId(/^text-skill-name-/)
      .map(element => element.textContent);
    expect(names).toEqual(['Beta Helper', 'Zebra Runner']);

    fireEvent.click(screen.getByTestId('button-skills-grid-view'));
    expect(screen.getByTestId('button-skills-grid-view').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('list-skills').getAttribute('data-view-mode')).toBe('grid');
    fireEvent.click(screen.getByTestId('button-skills-list-view'));
    expect(screen.getByTestId('list-skills').getAttribute('data-view-mode')).toBe('list');

    fireEvent.change(screen.getByTestId('input-search-skills'), { target: { value: 'README.md' } });
    expect(screen.getByTestId('empty-skill-results')).toBeTruthy();
    expect(screen.getByTestId('skills-result-count').textContent).toContain('Showing 0 of 3 skills');
    fireEvent.change(screen.getByTestId('input-search-skills'), { target: { value: 'no matching skill' } });
    expect(screen.getByTestId('empty-skill-results')).toBeTruthy();
    fireEvent.click(screen.getByTestId('button-reset-empty-skill-results'));
    expect(screen.getByTestId('skills-result-count').textContent).toContain('Showing 3 of 3 skills');
    expect(screen.getByTestId('select-skill-visibility')).toHaveProperty('value', 'all');
    expect(screen.getByTestId('select-skill-sort')).toHaveProperty('value', 'recent');
    expect(screen.getByTestId('list-skills').getAttribute('data-view-mode')).toBe('list');
  });

  it('opens and closes the matching skill details with accurate expanded state', async () => {
    renderSkillsPage();
    const card = screen.getByTestId('card-skill-alpha');
    const expand = within(card).getByRole('button', { name: 'Expand Alpha Helper details' });
    expect(expand.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(expand);

    const versionRow = await within(card).findByTestId('row-version-alpha-v2');
    expect(versionRow).toBeTruthy();
    expect(expand.getAttribute('aria-expanded')).toBe('true');
    expect(within(card).getByRole('region', { name: 'Alpha Helper details' })).toBeTruthy();

    fireEvent.click(within(card).getByRole('button', { name: 'Collapse Alpha Helper details' }));
    await waitFor(() => expect(expand.getAttribute('aria-expanded')).toBe('false'));
    expect(within(card).queryByRole('region', { name: 'Alpha Helper details' })).toBeNull();
  });

  it('opens the new composer with this skill and its current version without submitting', async () => {
    renderSkillsPage();
    fireEvent.click(screen.getByTestId('button-start-conversation-zebra'));

    await waitFor(() => expect(screen.getByTestId('select-skill')).toHaveProperty('value', 'zebra'));
    expect(screen.getByTestId('select-skill-version')).toHaveProperty('value', 'zebra-v2');
    expect(screen.getByTestId('input-question')).toHaveProperty('value', '');
    expect(screen.getByTestId('button-submit-question').hasAttribute('disabled')).toBe(true);
    expect(mockApi.createConversation).not.toHaveBeenCalled();
  });

  it('keeps edit feedback clear from collapsed and expanded cards and separates saved sharing state', async () => {
    renderSkillsPage();
    const card = screen.getByTestId('card-skill-alpha');
    expect(screen.getByTestId('status-gallery-public-alpha').textContent).toBe('Private');

    fireEvent.click(within(card).getByTestId('button-edit-skill-details-alpha'));
    let editForm = await within(card).findByTestId('form-edit-skill-details-alpha');
    const nameInput = within(editForm).getByTestId('input-edit-skill-name-alpha');
    fireEvent.change(nameInput, { target: { value: '   ' } });
    fireEvent.submit(editForm);
    expect((await within(editForm).findByRole('alert')).textContent).toContain('Skill name cannot be empty.');

    mockApi.updateDetails.mockRejectedValueOnce(new Error('Save failed.'));
    fireEvent.change(nameInput, { target: { value: 'Renamed but not saved' } });
    fireEvent.submit(editForm);
    await waitFor(() => expect(within(editForm).getByRole('alert').textContent).toContain('Save failed.'));
    expect(nameInput).toHaveProperty('value', 'Renamed but not saved');
    fireEvent.click(within(editForm).getByTestId('button-cancel-edit-details-alpha'));
    expect((await within(card).findByTestId('status-edit-skill-details-alpha')).textContent).toContain('Unsaved changes were discarded.');

    fireEvent.click(within(card).getByTestId('button-edit-skill-details-alpha'));
    editForm = await within(card).findByTestId('form-edit-skill-details-alpha');
    fireEvent.change(within(editForm).getByTestId('input-edit-skill-name-alpha'), { target: { value: 'Alpha Skill Updated' } });
    fireEvent.submit(editForm);
    await waitFor(() => expect(within(card).getByTestId('status-edit-skill-details-alpha').textContent).toContain('Skill details saved.'));
    expect(mockApi.updateDetails).toHaveBeenLastCalledWith({
      skillId: 'alpha',
      data: { name: 'Alpha Skill Updated', description: 'Database migration guidance' },
    });

    fireEvent.click(within(card).getByTestId('button-share-skill-alpha'));
    expect(screen.getByTestId('status-gallery-saved-alpha').textContent).toContain('Saved gallery status: Private');
    fireEvent.click(screen.getByTestId('checkbox-publish-skill-alpha'));
    expect(screen.getByTestId('status-gallery-draft-alpha').textContent).toContain('Current choice: Public · unsaved changes');
    expect(screen.getByTestId('status-gallery-saved-alpha').textContent).toContain('Saved gallery status: Private');

    const confirmDiscard = vi.spyOn(window, 'confirm').mockReturnValue(false);
    fireEvent.click(within(card).getByTestId('button-share-skill-alpha'));
    expect(confirmDiscard).toHaveBeenCalled();
    expect(screen.getByTestId('form-skill-publication-alpha')).toBeTruthy();
    confirmDiscard.mockReturnValue(true);
    fireEvent.click(within(card).getByTestId('button-share-skill-alpha'));
    expect(screen.queryByTestId('form-skill-publication-alpha')).toBeNull();
    confirmDiscard.mockRestore();

    fireEvent.click(within(card).getByTestId('button-share-current-alpha'));
    expect(screen.getByText('Unlisted version link')).toBeTruthy();
    expect(screen.getByText(/does not publish the skill to the gallery/)).toBeTruthy();
    expect(screen.getByTestId('status-gallery-public-alpha').textContent).toBe('Private');
  });
});
