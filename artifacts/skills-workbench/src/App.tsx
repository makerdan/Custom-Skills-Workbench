import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, useRoute, Router as WouterRouter } from 'wouter';
import { useAuth } from '@workspace/replit-auth-web';
import { readZipTextFiles } from '@/lib/skillZip';
import {
  useCreateConversation, useContinueConversation, useBranchConversation,
  useDeleteConversation, useDuplicateConversation, useGetConversation,
  useListConversations, useRenameConversation, useResetConversationContext,
  useCreateSkill, useCreateSkillVersion, useGetWorkbenchSummary,
  useListSkills, useListSkillVersions, useRequestUploadUrl,
  useListPublicSkills, useUpdateSkillDetails, useUpdateSkillPublication,
  useListSkillVersionShares, useCreateOrRegenerateSkillVersionShare,
  useRevokeSkillVersionShare, useGetSharedSkillVersion,
  getListSkillVersionSharesQueryKey, getGetSharedSkillVersionQueryKey,
  getDownloadSharedSkillVersionUrl,
  getGetWorkbenchSummaryQueryKey, getListConversationsQueryKey,
  getGetConversationQueryKey, getListSkillsQueryKey,
  getListSkillVersionsQueryKey, getListPublicSkillsQueryKey,
} from '@workspace/api-client-react';
import type { Conversation, ConversationTurn, ListPublicSkillsParams, Skill, SkillFileInput, SkillVersionShare } from '@workspace/api-client-react';
import BatchSkillImport from '@/components/BatchSkillImport';
import {
  ArrowRight, ArrowUpRight, ArrowDownToLine, BookOpen, ChevronDown, CircleHelp,
  Clock3, Code2, FileArchive, FileCode2, Layers3, LogOut, Settings,
  MessageSquareText, Plus, ShieldCheck, Sparkles, Upload, X,
  Globe2, LockKeyhole, Search, SlidersHorizontal, Tag, LayoutGrid, List,
  Share2, Copy, RefreshCw, ExternalLink, GitBranch, Pencil, RotateCcw, Trash2,
} from 'lucide-react';
import NotFound from '@/pages/not-found';
import { buildDestinationHref, buildSharePageUrl, shareDestinations } from '@/lib/shareDestinations';
import SettingsPage from '@/pages/SettingsPage';
import {
  DEFAULT_USER_PREFERENCES,
  readUserPreferences,
  resetUserPreferences,
  writeUserPreferences,
} from '@/lib/userPreferences';
import type { UserPreferences } from '@/lib/userPreferences';

const queryClient = new QueryClient();

type UserPreferencesContextValue = {
  preferences: UserPreferences;
  onPreferenceChange: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  onReset: () => void;
};
const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

const dateLabel = (date: string) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
const firstName = (user?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null) =>
  user?.firstName || user?.email?.split('@')[0] || 'Developer';

async function uploadZip(file: File, requestUpload: ReturnType<typeof useRequestUploadUrl>['mutateAsync']) {
  const files = await readZipTextFiles(file);
  const signed = await requestUpload({ data: { name: file.name, size: file.size, contentType: 'application/zip' } });
  const response = await fetch(signed.uploadURL, { method: 'PUT', headers: { 'Content-Type': 'application/zip' }, body: file });
  if (!response.ok) throw new Error('The ZIP upload did not finish. Please try again.');
  return { fileName: file.name, objectPath: signed.objectPath, files };
}

function Sidebar({ path, user, logout }: { path: string; user: any; logout: () => void }) {
  const links = [
    { href: '/', label: 'Overview', icon: Layers3 },
    { href: '/skills', label: 'Your skills', icon: BookOpen },
    { href: '/gallery', label: 'Public gallery', icon: Globe2 },
    { href: '/ask', label: 'Ask for help', icon: MessageSquareText },
    { href: '/questions', label: 'Conversations', icon: Clock3 },
  ];
  return <aside className="workbench-sidebar">
    <Link href="/" className="flex items-center gap-3 px-2 mb-12" data-testid="link-brand-home">
      <span className="grid place-items-center w-9 h-9 rounded-xl bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]"><Code2 size={19}/></span>
      <span><span className="block text-[15px] font-semibold tracking-tight">Skills Workbench</span><span className="block text-[10px] tracking-[.12em] uppercase opacity-55 mt-0.5">private workspace</span></span>
    </Link>
    <p className="eyebrow !text-[hsl(var(--sidebar-foreground)/.42)] px-3 mb-3">Workspace</p>
    <nav className="space-y-1" aria-label="Primary navigation">
      {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-link ${path === href ? 'active' : ''}`} data-testid={`link-nav-${href === '/' ? 'overview' : href.slice(1)}`}><Icon size={16}/><span>{label}</span>{href === '/ask' && <ArrowUpRight size={13} className="ml-auto opacity-45"/>}</Link>)}
    </nav>
    <div className="mt-auto">
      <div className="rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.52)] p-4 mb-5">
        <div className="flex items-center gap-2 text-[hsl(var(--sidebar-primary))]"><ShieldCheck size={15}/><span className="text-[11px] font-semibold">Version-grounded help</span></div>
        <p className="mt-2 text-xs leading-5 opacity-60">Every answer is anchored to the exact skill version you select.</p>
      </div>
      <div className="border-t border-[hsl(var(--sidebar-border))] pt-4 flex items-center gap-3">
        <div className="w-9 h-9 grid place-items-center rounded-full bg-[hsl(var(--sidebar-accent))] text-xs font-semibold uppercase" data-testid="text-user-initials">{(user?.firstName?.[0] || user?.email?.[0] || 'D').toUpperCase()}</div>
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium" data-testid="text-user-name">{firstName(user)}</p><p className="truncate text-[10px] opacity-45">{user?.email || 'Personal workspace'}</p></div>
        <Link href="/settings" className={`grid h-8 w-8 place-items-center rounded-lg opacity-70 hover:opacity-100 hover:bg-[hsl(var(--sidebar-accent))] ${path === '/settings' ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]' : ''}`} aria-label="Settings" title="Settings" data-testid="link-settings"><Settings size={15}/></Link>
        <button onClick={logout} className="grid h-8 w-8 place-items-center rounded-lg opacity-60 hover:opacity-100 hover:bg-[hsl(var(--sidebar-accent))]" aria-label="Log out" data-testid="button-logout"><LogOut size={15}/></button>
      </div>
    </div>
  </aside>;
}

function Shell({ children }: { children: ReactNode }) {
  const [path] = useLocation();
  const auth = useAuth();
  const userId = auth.isAuthenticated ? auth.user?.id ?? '' : '';
  const [preferenceState, setPreferenceState] = useState(() => ({
    userId,
    preferences: readUserPreferences(userId),
  }));
  const preferences = preferenceState.userId === userId
    ? preferenceState.preferences
    : readUserPreferences(userId);

  useLayoutEffect(() => {
    setPreferenceState({ userId, preferences: readUserPreferences(userId) });
  }, [userId]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.typeface = preferences.typeface;
    root.dataset.textSize = preferences.textSize;
    root.classList.toggle('dark', preferences.appearance === 'dark' ||
      (preferences.appearance === 'system' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches));

    const shell = document.querySelector<HTMLElement>('.workbench-shell');
    if (shell) shell.dataset.density = preferences.density;
  }, [preferences]);

  useEffect(() => {
    if (preferences.appearance !== 'system' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const updateAppearance = () => document.documentElement.classList.toggle('dark', media.matches);
    media.addEventListener?.('change', updateAppearance);
    return () => media.removeEventListener?.('change', updateAppearance);
  }, [preferences.appearance]);

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    if (!userId) return;
    const next = { ...preferences, [key]: value };
    setPreferenceState({ userId, preferences: next });
    writeUserPreferences(userId, next);
  };

  const resetPreferences = () => {
    if (!userId) return;
    resetUserPreferences(userId);
    setPreferenceState({ userId, preferences: { ...DEFAULT_USER_PREFERENCES } });
  };

  if (auth.isLoading) return <div className="min-h-[100dvh] grid place-items-center"><div className="w-64 space-y-3"><div className="skeleton h-7 w-36"/><div className="skeleton h-4 w-52"/></div></div>;
  if (!auth.isAuthenticated) return <main className="min-h-[100dvh] grid place-items-center p-6"><section className="panel p-9 max-w-md w-full text-center shadow-sm">
    <div className="mx-auto w-12 h-12 rounded-2xl bg-[hsl(var(--accent))] grid place-items-center"><Code2 size={22}/></div>
    <p className="eyebrow mt-6">A private workspace for your practice</p><h1 className="display text-4xl mt-3">Your skills.<br/>Your exact context.</h1>
    <p className="text-sm leading-6 text-muted-foreground mt-4">Keep your custom skill versions organized and get implementation help grounded in the ZIP you uploaded.</p>
    <button className="btn-primary mt-7 w-full" onClick={auth.login} data-testid="button-login">Continue to workspace <ArrowRight size={15}/></button>
    <Link href="/gallery" className="inline-flex items-center gap-1.5 mt-5 text-xs font-semibold text-primary hover:underline" data-testid="link-public-gallery">Explore public skills <ArrowUpRight size={13}/></Link>
  </section></main>;
  return <UserPreferencesContext.Provider value={{ preferences, onPreferenceChange: updatePreference, onReset: resetPreferences }}>
    <div className="workbench-shell" data-density={preferences.density}>
    <Sidebar path={path} user={auth.user} logout={auth.logout}/>
    <header className="mobile-top !flex-wrap"><div className="w-full flex items-center justify-between"><Link href="/" className="flex items-center gap-2 font-semibold text-sm" data-testid="link-mobile-brand"><span className="grid place-items-center w-8 h-8 rounded-lg bg-primary text-primary-foreground"><Code2 size={17}/></span> Skills Workbench</Link><div className="flex items-center gap-1.5"><Link href="/settings" className={`btn-subtle !p-2 ${path === '/settings' ? 'border-primary text-primary' : ''}`} aria-label="Settings" title="Settings" data-testid="link-mobile-settings"><Settings size={16}/></Link><button className="btn-subtle !p-2" onClick={auth.logout} aria-label="Log out" data-testid="button-mobile-logout"><LogOut size={16}/></button></div></div><nav className="flex w-full gap-1 overflow-x-auto pt-2 pb-0.5" aria-label="Mobile navigation">{[{href:'/', label:'Overview'},{href:'/skills',label:'Skills'},{href:'/gallery',label:'Gallery'},{href:'/ask',label:'Ask'},{href:'/questions',label:'Conversations'}].map(item=><Link key={item.href} href={item.href} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold ${path===item.href ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`} data-testid={`link-mobile-nav-${item.href==='/'?'overview':item.href.slice(1)}`}>{item.label}</Link>)}</nav></header>
    <main className="workbench-content page-enter">{children}</main>
    </div>
  </UserPreferencesContext.Provider>;
}

function SettingsRoute() {
  const settings = useContext(UserPreferencesContext);
  if (!settings) return <NotFound/>;
  return <SettingsPage
    preferences={settings.preferences}
    onPreferenceChange={settings.onPreferenceChange}
    onReset={settings.onReset}
  />;
}

function Topline({ section, title, description, action }: { section: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="pt-11 pb-8 border-b border-border/80 mb-8">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">{section}</p><h1 className="display text-[40px] sm:text-[48px] leading-[1.04] mt-2">{title}</h1><p className="text-sm text-muted-foreground mt-3 max-w-2xl">{description}</p></div>{action}</div>
  </header>;
}

function SkeletonLines({ count = 3 }: { count?: number }) { return <div className="space-y-3" aria-label="Loading"><div className="skeleton h-16 w-full"/>{count > 1 && <div className="skeleton h-16 w-full"/>}{count > 2 && <div className="skeleton h-16 w-full"/>}</div>; }
function ErrorNotice({ retry }: { retry: () => void }) { return <div className="panel p-6 flex flex-col sm:flex-row sm:items-center gap-4"><div className="w-9 h-9 rounded-full bg-destructive/10 text-destructive grid place-items-center"><CircleHelp size={18}/></div><div className="flex-1"><p className="text-sm font-semibold">We couldn't load this just now.</p><p className="text-xs text-muted-foreground mt-1">Your workspace is unchanged. Try again in a moment.</p></div><button onClick={retry} className="btn-subtle" data-testid="button-retry">Retry</button></div>; }
function EmptyState({ title, detail, action, testId }: { title: string; detail: string; action: React.ReactNode; testId: string }) { return <div className="panel py-12 px-5 text-center" data-testid={testId}><div className="w-12 h-12 rounded-full bg-[hsl(var(--accent)/.55)] text-primary grid place-items-center mx-auto"><FileCode2 size={20}/></div><h3 className="display text-2xl mt-4">{title}</h3><p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">{detail}</p><div className="mt-5">{action}</div></div>; }

function Overview() {
  const summary = useGetWorkbenchSummary();
  const conversationsQuery = useListConversations();
  const data = summary.data;
  const conversations = conversationsQuery.data?.conversations ?? [];
  return <>
    <Topline section="Your workspace" title={`Good to see you${new Date().getHours() < 12 ? ' this morning' : ''}.`} description="A focused home for the skills you rely on and your private, version-grounded conversations." action={<Link href="/ask" className="btn-primary" data-testid="button-ask-top"><Plus size={16}/> Start a conversation</Link>}/>
    {summary.isLoading || conversationsQuery.isLoading ? <><div className="grid sm:grid-cols-3 gap-3">{[1,2,3].map(n=><div key={n} className="panel p-5"><div className="skeleton h-3 w-20"/><div className="skeleton h-8 w-14 mt-5"/></div>)}</div><SkeletonLines/></> :
      summary.isError || conversationsQuery.isError ? <ErrorNotice retry={() => { void summary.refetch(); void conversationsQuery.refetch(); }}/> : <>
        <div className="grid sm:grid-cols-3 gap-3 mb-9">
          {[
            { label: 'Skills in your library', value: data?.skillCount ?? 0, icon: BookOpen, color: 'text-primary' },
            { label: 'Uploaded versions', value: data?.versionCount ?? 0, icon: FileArchive, color: 'text-[hsl(26_43%_54%)]' },
            { label: 'Saved conversations', value: conversations.length >= 300 ? '300+' : conversations.length, icon: MessageSquareText, color: 'text-[hsl(203_31%_52%)]' },
          ].map(item => <div className="panel p-5 sm:p-6" key={item.label}><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{item.label}</span><item.icon size={16} className={item.color}/></div><p className="display text-4xl mt-5" data-testid={`metric-${item.label.toLowerCase().replaceAll(' ', '-')}`}>{item.value}</p></div>)}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4"><div><p className="eyebrow">Keep your momentum</p><h2 className="display text-3xl mt-1">Recent conversations</h2></div><Link href="/questions" className="text-xs font-semibold text-primary flex items-center gap-1 hover:gap-2 transition-all" data-testid="link-all-questions">View history <ArrowRight size={14}/></Link></div>
        {conversations.length ? <ConversationOverviewRows conversations={conversations.slice(0, 5)}/> : <EmptyState testId="empty-recent-conversations" title="A clean slate." detail="Your private conversations and version-specific answers will gather here as you work." action={<Link href="/ask" className="btn-subtle" data-testid="button-first-question">Start your first conversation <ArrowRight size={14}/></Link>}/>}
        <div className="mt-7 rounded-2xl bg-primary text-primary-foreground px-6 py-7 sm:px-8 sm:flex items-center justify-between gap-8 overflow-hidden relative">
          <div className="absolute right-[-12px] top-[-36px] opacity-[.08]"><Code2 size={210}/></div>
          <div className="relative"><p className="eyebrow !text-primary-foreground/60">Start with the source</p><h2 className="display text-3xl mt-2">Bring the right version<br className="hidden sm:block"/> into the conversation.</h2></div>
          <Link href="/skills" className="btn-subtle !border-primary-foreground/20 !text-primary-foreground mt-5 sm:mt-0 relative" data-testid="button-browse-skills">Browse your skills <ArrowRight size={15}/></Link>
        </div>
      </>}
  </>;
}

function ConversationOverviewRows({ conversations }: { conversations: Conversation[] }) {
  return <div className="panel divide-y divide-border overflow-hidden" data-testid="list-recent-conversations">{conversations.map(conversation=><Link key={conversation.id} href={`/ask/${conversation.id}`} className="block px-5 py-4 sm:px-6 hover:bg-muted/40 transition-colors" data-testid={`recent-conversation-${conversation.id}`}>
    <div className="flex flex-wrap justify-between gap-2"><span className="text-sm font-semibold leading-5">{conversation.title}</span><span className="text-[10px] text-muted-foreground">{dateLabel(conversation.updatedAt)}</span></div>
    <span className="flex flex-wrap gap-x-2 gap-y-1 mt-2 text-[11px] text-muted-foreground"><span>{conversation.skillName}</span><span>/</span><span className="font-mono">v{conversation.versionLabel}</span>{conversation.projectName && <><span>/</span><span>{conversation.projectName}</span></>}</span>
    {conversation.lastMessage && <span className="block text-xs text-muted-foreground mt-2 line-clamp-2">{conversation.lastMessage}</span>}
  </Link>)}</div>;
}

function ZipPicker({ value, onChange, id = 'zip-file', disabled = false }: { value: File | null; onChange: (f: File | null) => void; id?: string; disabled?: boolean }) {
  return <label htmlFor={id} className={`block rounded-xl border border-dashed border-[hsl(var(--input))] bg-[hsl(var(--background)/.5)] p-5 text-center cursor-pointer transition-colors hover:border-primary/60 hover:bg-accent/20 ${disabled ? 'opacity-55 pointer-events-none' : ''}`} data-testid={`dropzone-zip-${id}`}>
    <input id={id} type="file" accept=".zip,application/zip" className="sr-only" onChange={e => { onChange(e.currentTarget.files?.[0] || null); e.currentTarget.value = ''; }} disabled={disabled} data-testid={`input-zip-file-${id}`}/>
    <span className="mx-auto grid place-items-center w-10 h-10 rounded-xl bg-accent/60 text-primary"><Upload size={18}/></span>
    {value ? <><span className="block text-sm font-semibold mt-3" data-testid="text-selected-zip">{value.name}</span><span className="block text-xs text-muted-foreground mt-1">{(value.size / 1024 / 1024).toFixed(2)} MB · click to replace</span></> :
      <><span className="block text-sm font-semibold mt-3">Choose a ZIP archive</span><span className="block text-xs text-muted-foreground mt-1">Markdown, docs and source files are indexed · up to 20 MB</span><span className="block text-[10px] text-muted-foreground mt-2">Remove credentials before upload. Common secrets are rejected.</span></>}
  </label>;
}

function SkillsPage() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const skillsQuery = useListSkills();
  const createSkill = useCreateSkill();
  const createVersion = useCreateSkillVersion();
  const requestUpload = useRequestUploadUrl();
  const [showCreate, setShowCreate] = useState(false);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [zip, setZip] = useState<File | null>(null);
  const [newVersion, setNewVersion] = useState('1.1.0');
  const [versionZip, setVersionZip] = useState<File | null>(null);
  const [uploadingTo, setUploadingTo] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private'>('all');
  const [sort, setSort] = useState<'recent' | 'oldest' | 'name'>('recent');
  const [display, setDisplay] = useState<'grid' | 'list'>('list');
  const skills = skillsQuery.data?.skills ?? [];
  const visibleSkills = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return skills
      .filter(skill => visibility === 'all' || skill.isPublic === (visibility === 'public'))
      .filter(skill => !needle || `${skill.name}\n${skill.description ?? ''}`.toLocaleLowerCase().includes(needle))
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });
        const dateOrder = Date.parse(a.createdAt) - Date.parse(b.createdAt);
        return sort === 'recent' ? -dateOrder : dateOrder;
      });
  }, [search, skills, sort, visibility]);
  useEffect(() => {
    if (selectedSkill && !skills.some(skill => skill.id === selectedSkill)) setSelectedSkill(null);
  }, [selectedSkill, skills]);
  const refreshSkills = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: getListSkillsQueryKey() }),
    queryClient.invalidateQueries({ queryKey: getGetWorkbenchSummaryQueryKey() }),
  ]);
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    if (!zip) { setError('Add a ZIP archive to create your skill.'); return; }
    setCreating(true);
    try {
      const uploaded = await uploadZip(zip, requestUpload.mutateAsync);
      await createSkill.mutateAsync({ data: { name: name.trim(), description: description.trim() || undefined, versionLabel: version.trim(), fileName: uploaded.fileName, objectPath: uploaded.objectPath, files: uploaded.files } });
      await refreshSkills(); setName(''); setDescription(''); setVersion('1.0.0'); setZip(null); setShowCreate(false);
    } catch (err) { setError(err instanceof Error ? err.message : 'We could not create this skill. Try again.'); }
    finally { setCreating(false); }
  };
  const handleVersion = async (e: FormEvent, skillId: string) => {
    e.preventDefault(); setError('');
    if (!versionZip) { setError('Choose a ZIP archive for this version.'); return; }
    setUploadingTo(skillId);
    try {
      const uploaded = await uploadZip(versionZip, requestUpload.mutateAsync);
      await createVersion.mutateAsync({ skillId, data: { versionLabel: newVersion.trim(), fileName: uploaded.fileName, objectPath: uploaded.objectPath, files: uploaded.files } });
      await Promise.all([refreshSkills(), queryClient.invalidateQueries({ queryKey: getListSkillVersionsQueryKey(skillId) })]);
      setVersionZip(null); setUploadingTo(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'We could not upload this version. Try again.'); setUploadingTo(null); }
  };
  const resetBrowsing = () => {
    setSearch('');
    setVisibility('all');
    setSort('recent');
    setDisplay('list');
  };
  return <>
    <Topline section="Skill library" title="Your skills." description="Each upload is preserved as a distinct version, ready to ground your next implementation question." action={<div className="flex flex-wrap gap-2"><button className="btn-subtle" onClick={() => { setShowCreate(false); setShowBatchImport(v => !v); }} data-testid="button-toggle-bulk-import"><FileArchive size={15}/>{showBatchImport ? 'Close bulk import' : 'Bulk import ZIPs'}</button><button className="btn-primary" onClick={() => { setShowBatchImport(false); setShowCreate(v=>!v); }} data-testid="button-create-skill"><Plus size={16}/>{showCreate ? 'Close form' : 'New skill'}</button></div>}/>
    {showBatchImport && <div className="mb-8"><BatchSkillImport onClose={() => setShowBatchImport(false)} onComplete={() => { void refreshSkills(); }}/></div>}
    {showCreate && <form onSubmit={handleCreate} className="panel p-5 sm:p-7 mb-8 page-enter" data-testid="form-create-skill">
      <div className="flex justify-between gap-3 mb-5"><div><p className="eyebrow">A new source of truth</p><h2 className="display text-2xl mt-1">Create a skill</h2></div><button type="button" className="p-2 rounded-lg hover:bg-muted h-fit" onClick={()=>setShowCreate(false)} aria-label="Close" data-testid="button-close-create"><X size={17}/></button></div>
      <div className="grid md:grid-cols-2 gap-4"><label className="text-xs font-semibold">Skill name<input className="field mt-2 text-sm font-normal" value={name} onChange={e=>setName(e.target.value)} maxLength={120} required placeholder="e.g. API integration patterns" data-testid="input-skill-name"/></label>
        <label className="text-xs font-semibold">Version label<input className="field mt-2 text-sm font-normal" value={version} onChange={e=>setVersion(e.target.value)} maxLength={80} required placeholder="1.0.0" data-testid="input-skill-version"/></label>
        <label className="text-xs font-semibold md:col-span-2">Description <span className="font-normal text-muted-foreground">optional</span><textarea className="field mt-2 text-sm font-normal min-h-[76px] resize-y" value={description} onChange={e=>setDescription(e.target.value)} maxLength={1000} placeholder="What this skill helps you build" data-testid="input-skill-description"/></label>
        <div className="md:col-span-2"><p className="text-xs font-semibold mb-2">First version archive</p><ZipPicker value={zip} onChange={setZip} disabled={creating}/></div>
      </div>
      {error && <p className="text-sm text-destructive mt-4" role="alert" data-testid="status-upload-error">{error}</p>}
      <div className="flex justify-end mt-5"><button disabled={creating || createSkill.isPending || requestUpload.isPending} className="btn-primary" data-testid="button-submit-create">{creating || createSkill.isPending || requestUpload.isPending ? 'Uploading and indexing…' : 'Create skill'} <ArrowRight size={15}/></button></div>
    </form>}
     {skillsQuery.isLoading ? <SkeletonLines count={3}/> : skillsQuery.isError ? <ErrorNotice retry={()=>skillsQuery.refetch()}/> : skills.length === 0 ?
      <EmptyState testId="empty-skills" title="Your library starts here." detail="Upload a skill ZIP and make the guidance inside it available for future questions." action={<button className="btn-primary" onClick={()=>setShowCreate(true)} data-testid="button-create-first-skill"><Plus size={15}/> Create your first skill</button>}/> :
       <section aria-label="Your skill library" data-testid="skills-library">
         <div className="panel p-4 sm:p-5 mb-4">
           <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto] lg:items-end">
             <label className="text-xs font-semibold" htmlFor="skills-search">Search your skills
               <span className="relative block mt-2"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input id="skills-search" type="search" className="field !py-2.5 !pl-9 text-sm font-normal" value={search} onChange={event=>setSearch(event.currentTarget.value)} placeholder="Name or description" data-testid="input-search-skills"/></span>
             </label>
             <label className="text-xs font-semibold" htmlFor="skills-visibility">Publication
               <select id="skills-visibility" className="field mt-2 !py-2.5 text-sm font-normal" value={visibility} onChange={event=>setVisibility(event.currentTarget.value as typeof visibility)} data-testid="select-skill-visibility">
                 <option value="all">All skills</option><option value="public">Public</option><option value="private">Private</option>
               </select>
             </label>
             <label className="text-xs font-semibold" htmlFor="skills-sort">Sort
               <select id="skills-sort" className="field mt-2 !py-2.5 text-sm font-normal" value={sort} onChange={event=>setSort(event.currentTarget.value as typeof sort)} data-testid="select-skill-sort">
                 <option value="recent">Recently added</option><option value="oldest">Oldest added</option><option value="name">Name A–Z</option>
               </select>
             </label>
             <div className="flex items-center gap-1 lg:justify-end" role="group" aria-label="Skill display mode">
               <button type="button" className={`btn-subtle !p-2.5 ${display === 'grid' ? 'border-primary text-primary' : ''}`} aria-label="Grid view" aria-pressed={display === 'grid'} onClick={()=>setDisplay('grid')} data-testid="button-skills-grid-view"><LayoutGrid size={16}/></button>
               <button type="button" className={`btn-subtle !p-2.5 ${display === 'list' ? 'border-primary text-primary' : ''}`} aria-label="List view" aria-pressed={display === 'list'} onClick={()=>setDisplay('list')} data-testid="button-skills-list-view"><List size={16}/></button>
             </div>
           </div>
         </div>
         <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-muted-foreground">
           <p aria-live="polite" data-testid="skills-result-count">Showing {visibleSkills.length} of {skills.length} {skills.length === 1 ? 'skill' : 'skills'}</p>
           {(search || visibility !== 'all' || sort !== 'recent' || display !== 'list') && <button type="button" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline" onClick={resetBrowsing} data-testid="button-reset-skill-browsing"><RotateCcw size={13}/> Reset controls</button>}
         </div>
         {visibleSkills.length === 0 ? <EmptyState testId="empty-skill-results" title="No skills match these controls." detail="Try a different search or publication filter, or reset the controls to see your full library." action={<button type="button" className="btn-subtle" onClick={resetBrowsing} data-testid="button-reset-empty-skill-results">Reset search and filters</button>}/> :
           <div className={display === 'grid' ? 'grid gap-3 md:grid-cols-2 2xl:grid-cols-3 items-start' : 'space-y-3'} data-testid="list-skills" data-view-mode={display}>
             {visibleSkills.map(skill=><SkillCard key={skill.id} skill={skill} selected={selectedSkill===skill.id} onToggle={()=>setSelectedSkill(current => current===skill.id ? null : skill.id)} onStartConversation={()=>navigate(`/ask?skillId=${encodeURIComponent(skill.id)}`)} version={newVersion} setVersion={setNewVersion} zip={versionZip} setZip={setVersionZip} busy={uploadingTo===skill.id} onUpload={e=>handleVersion(e,skill.id)} error={error} onDetailsUpdated={refreshSkills}/>)}
           </div>}
       </section>}
  </>;
}

function VersionShareControl({
  skillId,
  versionId,
  versionLabel,
  skillName,
  activeShare,
  sharesLoading,
  sharesError,
  onRetryShares,
  triggerLabel,
  testId,
}: {
  skillId: string;
  versionId: string;
  versionLabel: string;
  skillName: string;
  activeShare?: SkillVersionShare;
  sharesLoading: boolean;
  sharesError: boolean;
  onRetryShares: () => void;
  triggerLabel: string;
  testId: string;
}) {
  const queryClient = useQueryClient();
  const createShare = useCreateOrRegenerateSkillVersionShare();
  const revokeShare = useRevokeSkillVersionShare();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const shareUrl = activeShare
    ? buildSharePageUrl(activeShare.token, window.location.origin, import.meta.env.BASE_URL)
    : '';

  const refreshShares = async () => {
    await queryClient.invalidateQueries({
      queryKey: getListSkillVersionSharesQueryKey(skillId),
    });
  };
  const generateLink = async () => {
    setError('');
    try {
      await createShare.mutateAsync({ skillId, versionId });
      await refreshShares();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The share link could not be created.');
    }
  };
  const revokeLink = async () => {
    setError('');
    try {
      await revokeShare.mutateAsync({ skillId, versionId });
      await refreshShares();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The share link could not be revoked.');
    }
  };
  const copyUrl = async (label: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(`${label} copied.`);
    } catch {
      setCopied('Copy failed. Select and copy the link above.');
    }
  };

  return <div className="relative" data-testid={`share-controls-${testId}`}>
    <button
      type="button"
      className="btn-subtle !px-2.5 !py-2 text-[11px]"
      onClick={() => setOpen(value => !value)}
      aria-expanded={open}
      data-testid={`button-${testId}`}
    >
      <Share2 size={13}/>{triggerLabel}
    </button>
    {open && <section className="absolute right-0 top-full z-20 mt-2 w-[min(22rem,calc(100vw-2.5rem))] rounded-xl border border-border bg-card p-4 shadow-lg sm:w-96" aria-label={`Share version ${versionLabel}`}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="eyebrow">Unlisted version link</p><p className="text-xs font-semibold mt-1">{skillName} · v{versionLabel}</p></div>
        <button type="button" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" onClick={() => setOpen(false)} aria-label="Close share controls"><X size={14}/></button>
      </div>
      <p className="text-[11px] leading-5 text-muted-foreground mt-2">This link shares only this version’s details and ZIP. It does not publish the skill to the gallery.</p>
      {sharesLoading && <p className="text-[11px] text-muted-foreground mt-3" role="status">Checking active links…</p>}
      {sharesError && <div className="mt-3 text-[11px] text-destructive" role="alert"><p>Active link status could not be checked.</p><button type="button" className="underline mt-1" onClick={onRetryShares}>Try again</button></div>}
      {activeShare && <div className="mt-3">
        <label className="block text-[10px] font-semibold" htmlFor={`share-url-${testId}`}>Active share URL</label>
        <input id={`share-url-${testId}`} className="field mt-1 !py-2 text-[11px] font-normal" value={shareUrl} readOnly onFocus={event => event.currentTarget.select()} data-testid={`input-share-url-${testId}`}/>
        <div className="flex flex-wrap gap-1.5 mt-2" aria-label="Share destinations">
          {shareDestinations.map(destination => destination.kind === 'copy'
            ? <button type="button" key={destination.id} className="btn-subtle !px-2 !py-1.5 text-[10px]" onClick={() => { void copyUrl(destination.label); }} data-testid={`button-destination-${destination.id}-${testId}`}><Copy size={12}/>{destination.label}</button>
            : <a key={destination.id} className="btn-subtle !px-2 !py-1.5 text-[10px]" href={buildDestinationHref(destination.id, shareUrl, skillName) ?? undefined} target="_blank" rel="noopener noreferrer" data-testid={`link-destination-${destination.id}-${testId}`}>{destination.label}<ExternalLink size={11}/></a>)}
        </div>
        {copied && <p className="text-[10px] text-primary mt-2" role="status">{copied}</p>}
        <p className="text-[10px] text-muted-foreground mt-2">Regenerating replaces this URL and immediately disables the old one.</p>
      </div>}
      {error && <p className="text-[11px] text-destructive mt-3" role="alert" data-testid={`status-share-error-${testId}`}>{error}</p>}
      <div className="flex flex-wrap justify-end gap-2 mt-3">
        {activeShare && <button type="button" className="btn-subtle !px-2.5 !py-2 text-[11px] text-destructive" disabled={revokeShare.isPending || sharesLoading || sharesError} onClick={() => { void revokeLink(); }} data-testid={`button-revoke-share-${testId}`}>Revoke link</button>}
        <button type="button" className="btn-primary !px-2.5 !py-2 text-[11px]" disabled={createShare.isPending || sharesLoading || sharesError} onClick={() => { void generateLink(); }} data-testid={`button-generate-share-${testId}`}>
          {createShare.isPending ? 'Saving…' : activeShare ? <><RefreshCw size={12}/>Regenerate link</> : 'Create share link'}
        </button>
      </div>
    </section>}
  </div>;
}

function SkillCard({ skill, selected, onToggle, onStartConversation, version, setVersion, zip, setZip, busy, onUpload, error, onDetailsUpdated }: { skill: Skill; selected: boolean; onToggle: () => void; onStartConversation: () => void; version: string; setVersion: (v: string) => void; zip: File | null; setZip: (v: File|null) => void; busy: boolean; onUpload: (e: FormEvent) => void; error: string; onDetailsUpdated: () => Promise<unknown> }) {
  const queryClient = useQueryClient();
  const updateSkillDetails = useUpdateSkillDetails();
  const updatePublication = useUpdateSkillPublication();
  const sharesQuery = useListSkillVersionShares(skill.id);
  const activeShares = sharesQuery.data?.shares ?? [];
  const [editing, setEditing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [publicEnabled, setPublicEnabled] = useState(skill.isPublic);
  const [publicCategory, setPublicCategory] = useState(skill.category ?? '');
  const [publicLanguage, setPublicLanguage] = useState(skill.language ?? '');
  const [publicFramework, setPublicFramework] = useState(skill.framework ?? '');
  const [publicUseCase, setPublicUseCase] = useState(skill.useCase ?? '');
  const [publicTags, setPublicTags] = useState(skill.tags.join(', '));
  const [publicCreator, setPublicCreator] = useState(skill.creatorLabel ?? '');
  const [publicationError, setPublicationError] = useState('');
  const [editName, setEditName] = useState(skill.name);
  const [editDescription, setEditDescription] = useState(skill.description ?? '');
  const [detailsError, setDetailsError] = useState('');
  const [detailsMessage, setDetailsMessage] = useState('');
  const hasUnsavedPublicationChanges =
    publicEnabled !== skill.isPublic ||
    publicCategory !== (skill.category ?? '') ||
    publicLanguage !== (skill.language ?? '') ||
    publicFramework !== (skill.framework ?? '') ||
    publicUseCase !== (skill.useCase ?? '') ||
    publicTags !== skill.tags.join(', ') ||
    publicCreator !== (skill.creatorLabel ?? '');
  useEffect(() => {
    setPublicEnabled(skill.isPublic);
    setPublicCategory(skill.category ?? '');
    setPublicLanguage(skill.language ?? '');
    setPublicFramework(skill.framework ?? '');
    setPublicUseCase(skill.useCase ?? '');
    setPublicTags(skill.tags.join(', '));
    setPublicCreator(skill.creatorLabel ?? '');
  }, [skill]);
  const versionsQuery = useListSkillVersions(skill.id, { query: { queryKey: getListSkillVersionsQueryKey(skill.id), enabled: selected } });
  const versions = versionsQuery.data?.versions ?? skill.versions ?? [];
  const saveDetails = async (event: FormEvent) => {
    event.preventDefault();
    setDetailsError('');
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setDetailsError('Skill name cannot be empty.');
      return;
    }
    try {
      await updateSkillDetails.mutateAsync({
        skillId: skill.id,
        data: { name: trimmedName, description: editDescription.trim() || null },
      });
      await onDetailsUpdated();
      setEditing(false);
      setDetailsMessage('Skill details saved.');
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'Skill details could not be saved. Try again.');
    }
  };
  const savePublication = async (event: FormEvent) => {
    event.preventDefault();
    setPublicationError('');
    const tags = [...new Set(publicTags.split(',').map(tag => tag.trim()).filter(Boolean))];
    if (tags.length > 12 || tags.some(tag => tag.length > 32)) {
      setPublicationError('Use up to 12 tags, each 32 characters or fewer.');
      return;
    }
    try {
      await updatePublication.mutateAsync({
        skillId: skill.id,
        data: {
          isPublic: publicEnabled,
          category: publicCategory.trim() || null,
          language: publicLanguage.trim() || null,
          framework: publicFramework.trim() || null,
          useCase: publicUseCase.trim() || null,
          tags,
          creatorLabel: publicCreator.trim() || null,
        },
      });
      await Promise.all([
        onDetailsUpdated(),
        queryClient.invalidateQueries({ queryKey: getListPublicSkillsQueryKey() }),
      ]);
      setShareOpen(false);
    } catch (err) {
      setPublicationError(err instanceof Error ? err.message : 'Sharing settings could not be saved. Try again.');
    }
  };
  const cancelDetails = () => {
    setEditing(false);
    setEditName(skill.name);
    setEditDescription(skill.description ?? '');
    setDetailsError('');
    setDetailsMessage('Edit cancelled. Unsaved changes were discarded.');
  };
  const toggleShareSettings = () => {
    if (shareOpen) {
      if (hasUnsavedPublicationChanges && !window.confirm('Discard unsaved sharing settings?')) return;
      setShareOpen(false);
      return;
    }
    setPublicEnabled(skill.isPublic);
    setPublicCategory(skill.category ?? '');
    setPublicLanguage(skill.language ?? '');
    setPublicFramework(skill.framework ?? '');
    setPublicUseCase(skill.useCase ?? '');
    setPublicTags(skill.tags.join(', '));
    setPublicCreator(skill.creatorLabel ?? '');
    setPublicationError('');
    setShareOpen(true);
  };
  return <article className="panel overflow-visible" data-testid={`card-skill-${skill.id}`}>
    <div className="w-full p-5 sm:p-6 flex items-start gap-4">
      <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left flex items-start gap-4 hover:opacity-90 transition-opacity" aria-expanded={selected} aria-controls={`skill-details-${skill.id}`} aria-label={`${selected ? 'Collapse' : 'Expand'} ${skill.name} details`} data-testid={`button-expand-skill-${skill.id}`}>
        <span className="grid place-items-center w-11 h-11 rounded-xl bg-accent/65 text-primary shrink-0"><FileCode2 size={19}/></span>
        <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-[15px]" data-testid={`text-skill-name-${skill.id}`}>{skill.name}</span><span className="text-[10px] font-mono rounded-full px-2 py-1 bg-muted text-muted-foreground">v{skill.versions.find(v=>v.id===skill.currentVersionId)?.versionLabel || versions[0]?.versionLabel || 'current'}</span></span>
          <span className="block text-xs text-muted-foreground mt-1.5 max-w-2xl">{skill.description || 'No description added.'}</span><span className="flex flex-wrap items-center gap-2 mt-3 text-[10px] text-muted-foreground"><span>{skill.versions.length || versions.length} {(skill.versions.length || versions.length) === 1 ? 'version' : 'versions'}</span><span>Added {dateLabel(skill.createdAt)}</span><span className={`rounded-full px-2 py-1 font-semibold ${skill.isPublic ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`} data-testid={`status-gallery-public-${skill.id}`}>{skill.isPublic ? 'Public gallery' : 'Private'}</span></span></span>
        <ChevronDown size={17} className={`text-muted-foreground mt-1 transition-transform ${selected ? 'rotate-180' : ''}`}/>
      </button>
       <div className="flex flex-wrap justify-end gap-2 shrink-0">
          {skill.currentVersionId && <VersionShareControl
            skillId={skill.id}
            versionId={skill.currentVersionId}
            versionLabel={skill.versions.find(v => v.id === skill.currentVersionId)?.versionLabel ?? 'current'}
            skillName={skill.name}
            activeShare={activeShares.find(share => share.versionId === skill.currentVersionId)}
            sharesLoading={sharesQuery.isLoading}
            sharesError={sharesQuery.isError}
            onRetryShares={() => { void sharesQuery.refetch(); }}
            triggerLabel="Unlisted link"
            testId={`share-current-${skill.id}`}
          />}
         <button type="button" className="btn-subtle !px-2.5 !py-2 text-[11px]" onClick={toggleShareSettings} aria-expanded={shareOpen} data-testid={`button-share-skill-${skill.id}`}><Globe2 size={13}/>{shareOpen ? 'Close settings' : skill.isPublic ? 'Public settings' : 'Share'}</button>
          <button type="button" className="btn-subtle !px-2.5 !py-2 text-[11px]" disabled={editing || updateSkillDetails.isPending} onClick={() => { if (!selected) onToggle(); setEditName(skill.name); setEditDescription(skill.description ?? ''); setDetailsError(''); setDetailsMessage(''); setEditing(true); }} data-testid={`button-edit-skill-details-${skill.id}`}>Edit details</button>
         <button type="button" className="btn-primary !px-2.5 !py-2 text-[11px]" onClick={onStartConversation} data-testid={`button-start-conversation-${skill.id}`}><MessageSquareText size={13}/>Start conversation</button>
       </div>
    </div>
    {shareOpen && <form onSubmit={savePublication} className="border-t border-border bg-[hsl(var(--background)/.45)] px-5 py-5 sm:px-6" data-testid={`form-skill-publication-${skill.id}`}>
      <div className="flex items-start gap-3 mb-4"><span className="grid place-items-center w-9 h-9 rounded-xl bg-accent/60 text-primary shrink-0"><Globe2 size={16}/></span><div><p className="eyebrow">Public discovery</p><h3 className="font-semibold text-sm mt-1">Choose what to share</h3><p className="text-xs leading-5 text-muted-foreground mt-1">When enabled, this skill’s name, description, category, technologies, tags, and optional creator label appear in the public gallery. ZIP contents, file paths, account details, and question history stay private. Unpublishing removes it from gallery results immediately. Gallery publication is separate from unlisted links for individual versions.</p></div></div>
      <div className="rounded-lg border border-border bg-card px-3.5 py-3 mb-4 text-xs">
        <p data-testid={`status-gallery-saved-${skill.id}`}>Saved gallery status: <strong>{skill.isPublic ? 'Public' : 'Private'}</strong></p>
        <p className="mt-1" data-testid={`status-gallery-draft-${skill.id}`}>Current choice: <strong>{publicEnabled ? 'Public' : 'Private'}</strong>{hasUnsavedPublicationChanges ? ' · unsaved changes' : ' · saved'}</p>
      </div>
      <label className="flex items-start gap-3 rounded-lg border border-border p-3.5 cursor-pointer">
        <input type="checkbox" className="mt-0.5 accent-[hsl(var(--primary))]" checked={publicEnabled} onChange={event => setPublicEnabled(event.currentTarget.checked)} data-testid={`checkbox-publish-skill-${skill.id}`}/>
        <span><span className="block text-xs font-semibold">{publicEnabled ? 'Listed in the public gallery' : 'Keep this skill private'}</span><span className="block text-[11px] text-muted-foreground mt-1">Skills are private by default. You can change this at any time.</span></span>
      </label>
      <div className="grid md:grid-cols-2 gap-3 mt-4">
         <label className="text-xs font-semibold">Category<input className="field mt-1.5 text-sm font-normal" maxLength={64} value={publicCategory} onChange={event => setPublicCategory(event.currentTarget.value)} placeholder="e.g. Data engineering" data-testid={`input-public-category-${skill.id}`}/></label>
         <label className="text-xs font-semibold">Language<input className="field mt-1.5 text-sm font-normal" maxLength={64} value={publicLanguage} onChange={event => setPublicLanguage(event.currentTarget.value)} placeholder="e.g. TypeScript" data-testid={`input-public-language-${skill.id}`}/></label>
         <label className="text-xs font-semibold">Framework or tool<input className="field mt-1.5 text-sm font-normal" maxLength={80} value={publicFramework} onChange={event => setPublicFramework(event.currentTarget.value)} placeholder="e.g. React, PostgreSQL" data-testid={`input-public-framework-${skill.id}`}/></label>
         <label className="text-xs font-semibold">Use case<input className="field mt-1.5 text-sm font-normal" maxLength={80} value={publicUseCase} onChange={event => setPublicUseCase(event.currentTarget.value)} placeholder="e.g. API integration" data-testid={`input-public-use-case-${skill.id}`}/></label>
         <label className="text-xs font-semibold">Tags <span className="font-normal text-muted-foreground">comma-separated, up to 12</span><input className="field mt-1.5 text-sm font-normal" maxLength={500} value={publicTags} onChange={event => setPublicTags(event.currentTarget.value)} placeholder="testing, backend, security" data-testid={`input-public-tags-${skill.id}`}/></label>
         <label className="text-xs font-semibold">Creator label <span className="font-normal text-muted-foreground">optional</span><input className="field mt-1.5 text-sm font-normal" maxLength={60} value={publicCreator} onChange={event => setPublicCreator(event.currentTarget.value)} placeholder="A name shown on this skill" data-testid={`input-public-creator-${skill.id}`}/></label>
      </div>
      {publicationError && <p className="text-xs text-destructive mt-3" role="alert" data-testid={`status-publication-error-${skill.id}`}>{publicationError}</p>}
      <div className="flex justify-end gap-2 mt-4"><button type="button" className="btn-subtle" onClick={() => setShareOpen(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={updatePublication.isPending} data-testid={`button-save-publication-${skill.id}`}>{updatePublication.isPending ? 'Saving…' : 'Save sharing settings'} <ArrowRight size={14}/></button></div>
    </form>}
    <div id={`skill-details-${skill.id}`} hidden={!selected}>
    {selected && <div role="region" aria-label={`${skill.name} details`} className="border-t border-border px-5 py-5 sm:px-6 sm:py-6 bg-[hsl(var(--background)/.45)] page-enter">
      {detailsMessage && <p role="status" className="text-xs text-primary mb-4" data-testid={`status-edit-skill-details-${skill.id}`}>{detailsMessage}</p>}
      {editing && <form onSubmit={saveDetails} className="panel p-4 sm:p-5 mb-6" data-testid={`form-edit-skill-details-${skill.id}`}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4"><div><p className="eyebrow">Skill details</p><h3 className="font-semibold text-sm mt-1">Edit name and description</h3></div><button type="button" className="p-2 rounded-lg hover:bg-muted" onClick={cancelDetails} aria-label="Cancel editing skill details" disabled={updateSkillDetails.isPending} data-testid={`button-cancel-edit-skill-details-${skill.id}`}><X size={16}/></button></div>
        <div className="grid md:grid-cols-2 gap-4"><label className="text-xs font-semibold">Skill name<input className="field mt-2 text-sm font-normal" value={editName} onChange={event => setEditName(event.currentTarget.value)} maxLength={120} required disabled={updateSkillDetails.isPending} data-testid={`input-edit-skill-name-${skill.id}`}/></label><label className="text-xs font-semibold md:col-span-2">Description <span className="font-normal text-muted-foreground">optional</span><textarea className="field mt-2 text-sm font-normal min-h-[76px] resize-y" value={editDescription} onChange={event => setEditDescription(event.currentTarget.value)} maxLength={1000} disabled={updateSkillDetails.isPending} data-testid={`input-edit-skill-description-${skill.id}`}/></label></div>
        {detailsError && <p className="text-xs text-destructive mt-3" role="alert" data-testid={`status-edit-skill-error-${skill.id}`}>{detailsError}</p>}
        <div className="flex justify-end gap-2 mt-4"><button type="button" className="btn-subtle" onClick={cancelDetails} disabled={updateSkillDetails.isPending} data-testid={`button-cancel-edit-details-${skill.id}`}>Cancel</button><button type="submit" className="btn-primary" disabled={updateSkillDetails.isPending} data-testid={`button-save-edit-details-${skill.id}`}>{updateSkillDetails.isPending ? 'Saving…' : 'Save details'} <ArrowRight size={14}/></button></div>
      </form>}
      <div className="grid lg:grid-cols-[1fr_300px] gap-7">
        <div><p className="eyebrow mb-3">Uploaded versions</p>{versionsQuery.isLoading ? <SkeletonLines count={2}/> : versionsQuery.isError ? <ErrorNotice retry={()=>versionsQuery.refetch()}/> :
          <div className="space-y-2">{versions.map(v=><div key={v.id} className="flex flex-wrap gap-3 items-center rounded-lg border border-border bg-card p-3" data-testid={`row-version-${v.id}`}><span className="w-8 h-8 grid place-items-center rounded-lg bg-muted text-primary"><FileArchive size={15}/></span><div className="flex-1 min-w-0"><p className="text-xs font-semibold font-mono" data-testid={`text-version-label-${v.id}`}>v{v.versionLabel}{v.id===skill.currentVersionId && <span className="ml-2 font-sans text-[9px] uppercase tracking-wider text-primary">Current</span>}</p><p className="text-[10px] text-muted-foreground mt-1 truncate">{v.fileName} · {v.fileCount} files · {dateLabel(v.uploadedAt)}</p></div><span title={v.filePaths.join(', ')} className="text-[10px] text-muted-foreground hidden sm:block">{v.filePaths.length} paths</span><VersionShareControl skillId={skill.id} versionId={v.id} versionLabel={v.versionLabel} skillName={skill.name} activeShare={activeShares.find(share => share.versionId === v.id)} sharesLoading={sharesQuery.isLoading} sharesError={sharesQuery.isError} onRetryShares={() => { void sharesQuery.refetch(); }} triggerLabel="Unlisted link" testId={`share-version-${v.id}`}/></div>)}</div>}
        </div>
        <form onSubmit={onUpload} className="lg:border-l lg:border-border lg:pl-6" data-testid={`form-upload-version-${skill.id}`}>
          <p className="eyebrow">Keep it current</p><h3 className="font-semibold text-sm mt-1 mb-4">Upload a new version</h3>
          <label className="text-xs font-semibold">Version label<input className="field mt-2 mb-4 text-sm font-normal" required maxLength={80} value={version} onChange={e=>setVersion(e.target.value)} placeholder="1.1.0" data-testid={`input-version-label-${skill.id}`}/></label>
          <ZipPicker value={zip} onChange={setZip} id={`zip-${skill.id}`} disabled={busy}/>
          {error && <p className="text-xs text-destructive mt-2" role="alert" data-testid="status-version-error">{error}</p>}
          <button className="btn-primary w-full mt-3" disabled={busy} data-testid={`button-upload-version-${skill.id}`}>{busy ? 'Uploading and indexing…' : 'Add version'} <ArrowUpRight size={14}/></button>
        </form>
      </div>
    </div>}
    </div>
  </article>;
}

type GalleryFilters = {
  q: string;
  category: string;
  language: string;
  framework: string;
  useCase: string;
  creator: string;
  tags: string[];
  sort: 'newest' | 'oldest';
  days: string;
  page: string;
};

function readGalleryFilters(): GalleryFilters {
  const params = new URLSearchParams(window.location.search);
  const sort = params.get('sort');
  return {
    q: params.get('q') ?? '',
    category: params.get('category') ?? '',
    language: params.get('language') ?? '',
    framework: params.get('framework') ?? '',
    useCase: params.get('useCase') ?? '',
    creator: params.get('creator') ?? '',
    tags: (params.get('tags') ?? '').split(',').map(tag => tag.trim()).filter(Boolean),
    sort: sort === 'oldest' ? 'oldest' : 'newest',
    days: params.get('days') ?? '',
    page: params.get('page') ?? '1',
  };
}

function PublicGallery() {
  const [filters, setFilters] = useState<GalleryFilters>(readGalleryFilters);
  const queryParams = useMemo<ListPublicSkillsParams>(() => ({
    q: filters.q || undefined,
    category: filters.category || undefined,
    language: filters.language || undefined,
    framework: filters.framework || undefined,
    useCase: filters.useCase || undefined,
    creator: filters.creator || undefined,
    tags: filters.tags.length ? filters.tags.join(',') : undefined,
    sort: filters.sort,
    days: filters.days || undefined,
    page: filters.page,
  }), [filters]);
  const gallery = useListPublicSkills(queryParams);
  const data = gallery.data;
  const facets = data?.facets;
  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 24)));
  const hasActiveFilters = Boolean(
    filters.q || filters.category || filters.language || filters.framework ||
    filters.useCase || filters.creator || filters.tags.length || filters.days ||
    filters.sort !== 'newest' || filters.page !== '1',
  );
  const updateFilter = <K extends keyof GalleryFilters>(key: K, value: GalleryFilters[K]) =>
    setFilters(previous => ({ ...previous, [key]: value, page: '1' }));

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.category) params.set('category', filters.category);
    if (filters.language) params.set('language', filters.language);
    if (filters.framework) params.set('framework', filters.framework);
    if (filters.useCase) params.set('useCase', filters.useCase);
    if (filters.creator) params.set('creator', filters.creator);
    if (filters.tags.length) params.set('tags', filters.tags.join(','));
    if (filters.sort !== 'newest') params.set('sort', filters.sort);
    if (filters.days) params.set('days', filters.days);
    if (filters.page !== '1') params.set('page', filters.page);
    const query = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, [filters]);

  useEffect(() => {
    const onPopState = () => setFilters(readGalleryFilters());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const facetSelect = (label: string, value: string, values: string[], key: 'category' | 'language' | 'framework' | 'useCase' | 'creator') =>
    <label className="text-[11px] font-semibold text-muted-foreground">{label}
      <select className="field mt-1.5 text-xs font-normal py-2.5" value={value} onChange={event => updateFilter(key, event.currentTarget.value)} data-testid={`select-gallery-${key}`}>
        <option value="">All {label.toLowerCase()}s</option>
        {values.map(option => <option value={option} key={option}>{option}</option>)}
      </select>
    </label>;

  return <main className="min-h-[100dvh]">
    <header className="border-b border-border bg-card/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/gallery" className="flex items-center gap-3" data-testid="link-gallery-brand">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-foreground"><Globe2 size={18}/></span>
          <span><span className="block text-sm font-semibold">Skills Workbench</span><span className="block text-[10px] uppercase tracking-[.12em] text-muted-foreground mt-0.5">Public gallery</span></span>
        </Link>
        <Link href="/" className="btn-subtle !py-2 !px-3 text-xs" data-testid="link-gallery-workspace">Your workspace <ArrowRight size={13}/></Link>
      </div>
    </header>
    <div className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
      <section className="py-11 sm:py-14 border-b border-border/80">
        <p className="eyebrow flex items-center gap-2"><Sparkles size={13}/> Shared by skill creators</p>
        <h1 className="display text-4xl sm:text-6xl leading-[1.02] mt-3 max-w-3xl">Find a skill for what you’re building.</h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-6 mt-4 max-w-2xl">Explore custom skills that their owners chose to share. Only public descriptions and discovery details are shown; uploaded archives and private workspaces stay private.</p>
        <label className="relative block mt-7 max-w-3xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input className="field !rounded-xl !py-4 !pl-12 !pr-4 text-sm" type="search" value={filters.q} onChange={event => updateFilter('q', event.currentTarget.value)} placeholder="Search skill names and descriptions" aria-label="Search skill names and descriptions" data-testid="input-gallery-search"/>
        </label>
      </section>

      <section className="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-7 pt-7">
        <aside className="panel p-4 sm:p-5 h-fit">
          <div className="flex items-center gap-2"><SlidersHorizontal size={15} className="text-primary"/><h2 className="text-sm font-semibold">Filters</h2></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-3 mt-4">
            {facetSelect('Category', filters.category, facets?.categories ?? [], 'category')}
            {facetSelect('Language', filters.language, facets?.languages ?? [], 'language')}
            {facetSelect('Framework / tool', filters.framework, facets?.frameworks ?? [], 'framework')}
            {facetSelect('Use case', filters.useCase, facets?.useCases ?? [], 'useCase')}
            {facetSelect('Creator label', filters.creator, facets?.creators ?? [], 'creator')}
            <label className="text-[11px] font-semibold text-muted-foreground">Published
              <select className="field mt-1.5 text-xs font-normal py-2.5" value={filters.days} onChange={event => updateFilter('days', event.currentTarget.value)} data-testid="select-gallery-days">
                <option value="">Any time</option><option value="7">Past 7 days</option><option value="30">Past 30 days</option><option value="90">Past 90 days</option><option value="365">Past year</option>
              </select>
            </label>
            <label className="text-[11px] font-semibold text-muted-foreground">Sort by
              <select className="field mt-1.5 text-xs font-normal py-2.5" value={filters.sort} onChange={event => updateFilter('sort', event.currentTarget.value as GalleryFilters['sort'])} data-testid="select-gallery-sort">
                <option value="newest">Most recently published</option><option value="oldest">Oldest published</option>
              </select>
            </label>
          </div>
          {(facets?.tags.length ?? 0) > 0 && <fieldset className="mt-5">
            <legend className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5"><Tag size={12}/> Tags <span className="font-normal">(match all selected)</span></legend>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {facets!.tags.map((tag, index) => {
                const selected = filters.tags.includes(tag);
                return <button type="button" key={tag} aria-pressed={selected} onClick={() => updateFilter('tags', selected ? filters.tags.filter(item => item !== tag) : [...filters.tags, tag])} className={`rounded-full border px-2.5 py-1 text-[10px] transition-colors ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/50 text-muted-foreground hover:text-foreground'}`} data-testid={`button-gallery-tag-${index}`}>{tag}</button>;
              })}
            </div>
          </fieldset>}
          <button type="button" className="btn-subtle w-full mt-5 !py-2.5 text-xs" onClick={() => setFilters({ ...readGalleryFilters(), q: '', category: '', language: '', framework: '', useCase: '', creator: '', tags: [], sort: 'newest', days: '', page: '1' })} data-testid="button-clear-gallery-filters">Clear filters</button>
        </aside>

        <section aria-label="Public skills">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <p className="text-xs text-muted-foreground" aria-live="polite">{gallery.isLoading ? 'Loading public skills…' : `${data?.total ?? 0} ${data?.total === 1 ? 'skill' : 'skills'} found`}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5"><LockKeyhole size={12}/> Private archives are never shown</p>
          </div>
          {gallery.isLoading ? <div className="grid md:grid-cols-2 gap-3" aria-label="Loading public skills">{[1,2,3,4].map(item => <div className="panel p-5" key={item}><div className="skeleton h-4 w-2/3"/><div className="skeleton h-3 w-full mt-4"/><div className="skeleton h-3 w-4/5 mt-2"/></div>)}</div>
            : gallery.isError ? <ErrorNotice retry={() => gallery.refetch()}/>
            : (data?.skills.length ?? 0) === 0 ? <EmptyState testId="empty-public-gallery" title={hasActiveFilters ? 'No skills match these filters.' : 'No skills have been shared yet.'} detail={hasActiveFilters ? 'Try a broader search or clear one or more filters.' : 'When a skill owner opts in to public discovery, it will appear here.'} action={<button className="btn-subtle" onClick={() => setFilters({ ...filters, q: '', category: '', language: '', framework: '', useCase: '', creator: '', tags: [], sort: 'newest', days: '', page: '1' })} data-testid="button-clear-empty-gallery">Clear filters</button>}/>
            : <div className="grid md:grid-cols-2 gap-3" data-testid="list-public-skills">
              {data!.skills.map((skill, index) => <article key={`${skill.name}-${skill.publishedAt}-${index}`} className="panel p-5 sm:p-6 flex flex-col min-h-[220px]" data-testid={`card-public-skill-${index}`}>
                <div className="flex items-start gap-3"><span className="grid place-items-center w-10 h-10 rounded-xl bg-accent/65 text-primary shrink-0"><BookOpen size={18}/></span><div className="min-w-0 flex-1"><h2 className="font-semibold text-[15px] leading-5">{skill.name}</h2>{skill.creatorLabel && <p className="text-[10px] text-muted-foreground mt-1">Shared by {skill.creatorLabel}</p>}</div></div>
                <p className="text-xs leading-5 text-muted-foreground mt-4 line-clamp-4">{skill.description || 'No public description provided.'}</p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {skill.category && <span className="rounded-full bg-accent/60 text-primary px-2.5 py-1 text-[10px] font-semibold">{skill.category}</span>}
                  {skill.language && <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground">{skill.language}</span>}
                  {skill.framework && <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground">{skill.framework}</span>}
                  {skill.useCase && <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground">{skill.useCase}</span>}
                  {skill.tags.map(tag => <span key={tag} className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground">{tag}</span>)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-auto pt-5 flex items-center gap-1.5"><Clock3 size={12}/> Published {dateLabel(skill.publishedAt)}</p>
              </article>)}
            </div>}
          {!gallery.isLoading && !gallery.isError && data && data.total > data.pageSize && <nav className="flex items-center justify-between mt-5" aria-label="Gallery pages">
            <button className="btn-subtle !py-2 text-xs" disabled={Number(filters.page) <= 1} onClick={() => setFilters(previous => ({ ...previous, page: String(Math.max(1, Number(previous.page) - 1)) }))} data-testid="button-gallery-previous">Previous</button>
            <span className="text-xs text-muted-foreground">Page {filters.page} of {pageCount}</span>
            <button className="btn-subtle !py-2 text-xs" disabled={Number(filters.page) >= pageCount} onClick={() => setFilters(previous => ({ ...previous, page: String(Math.min(pageCount, Number(previous.page) + 1)) }))} data-testid="button-gallery-next">Next</button>
          </nav>}
        </section>
      </section>
    </div>
  </main>;
}

function AskPage() {
  const queryClient = useQueryClient();
  const [matchedConversation, routeParams] = useRoute('/ask/:conversationId');
  const conversationId = matchedConversation ? routeParams?.conversationId ?? '' : '';
  const [, navigate] = useLocation();
  const skillsQuery = useListSkills();
  const conversationQuery = useGetConversation(conversationId, {
    query: {
      queryKey: getGetConversationQueryKey(conversationId),
      enabled: Boolean(conversationId),
    },
  });
  const createConversation = useCreateConversation();
  const continueConversation = useContinueConversation();
  const branchConversation = useBranchConversation();
  const duplicateConversation = useDuplicateConversation();
  const renameConversation = useRenameConversation();
  const resetContext = useResetConversationContext();
  const deleteConversation = useDeleteConversation();
  const [skillId, setSkillId] = useState('');
  const [versionId, setVersionId] = useState('');
  const [project, setProject] = useState('');
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const skills = skillsQuery.data?.skills ?? [];
  const requestedSkillId = new URLSearchParams(window.location.search).get('skillId') ?? '';
  const appliedSkillSeed = useRef('');
  const selected = skills.find(s=>s.id===skillId);
  const versionsQuery = useListSkillVersions(skillId, { query: { queryKey: getListSkillVersionsQueryKey(skillId), enabled: !!skillId } });
  const versions = useMemo(() => versionsQuery.data?.versions ?? selected?.versions ?? [], [versionsQuery.data?.versions, selected?.versions]);
  const conversation = conversationQuery.data;
  useEffect(() => {
    if (!requestedSkillId) {
      appliedSkillSeed.current = '';
      return;
    }
    if (skillsQuery.isLoading || appliedSkillSeed.current === requestedSkillId) return;
    const requestedSkill = skills.find(skill => skill.id === requestedSkillId);
    if (!requestedSkill) return;
    appliedSkillSeed.current = requestedSkillId;
    const currentVersion = requestedSkill.versions.find(version => version.id === requestedSkill.currentVersionId);
    setSkillId(requestedSkill.id);
    setVersionId(currentVersion?.id ?? '');
    setError('');
  }, [requestedSkillId, skills, skillsQuery.isLoading]);
  const refreshConversations = async (id?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetWorkbenchSummaryQueryKey() }),
      ...(id ? [queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(id) })] : []),
    ]);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (conversationId) {
      if (!question.trim()) { setError('Write a follow-up question first.'); return; }
      try {
        const updated = await continueConversation.mutateAsync({
          conversationId,
          data: { question: question.trim(), codeContext: context.trim() || undefined },
        });
        queryClient.setQueryData(getGetConversationQueryKey(conversationId), updated);
        setQuestion('');
        setContext('');
        await refreshConversations(conversationId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Your follow-up could not be submitted. Try again.');
      }
      return;
    }
    if (!versionId) { setError('Select a skill version before asking.'); return; }
    try {
      const created = await createConversation.mutateAsync({
        data: {
          skillVersionId: versionId,
          projectName: project.trim() || undefined,
          question: question.trim(),
          codeContext: context.trim() || undefined,
        },
      });
      queryClient.setQueryData(getGetConversationQueryKey(created.id), created);
      setQuestion('');
      setContext('');
      await refreshConversations(created.id);
      navigate(`/ask/${created.id}`);
    } catch (err) { setError(err instanceof Error ? err.message : 'Your question could not be submitted. Try again.'); }
  };

  const branchAtTurn = async (turn: ConversationTurn) => {
    if (!conversation) return;
    setActionError('');
    setActionMessage('');
    try {
      const branch = await branchConversation.mutateAsync({
        conversationId: conversation.id,
        data: { turnId: turn.id },
      });
      queryClient.setQueryData(getGetConversationQueryKey(branch.id), branch);
      await refreshConversations(branch.id);
      navigate(`/ask/${branch.id}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'The branch could not be created.');
    }
  };

  const duplicateCurrent = async () => {
    if (!conversation) return;
    setActionError('');
    try {
      const copy = await duplicateConversation.mutateAsync({ conversationId: conversation.id });
      queryClient.setQueryData(getGetConversationQueryKey(copy.id), copy);
      await refreshConversations(copy.id);
      navigate(`/ask/${copy.id}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'The conversation could not be duplicated.');
    }
  };

  const renameCurrent = async () => {
    if (!conversation) return;
    const title = window.prompt('Rename this conversation', conversation.title);
    if (title === null || !title.trim()) return;
    setActionError('');
    try {
      await renameConversation.mutateAsync({
        conversationId: conversation.id,
        data: { title: title.trim() },
      });
      await refreshConversations(conversation.id);
      setActionMessage('Conversation renamed.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'The conversation could not be renamed.');
    }
  };

  const resetCurrentContext = async () => {
    if (!conversation || !window.confirm('Reset future answer context? The full transcript will remain visible, but earlier turns will not be sent with new questions.')) return;
    setActionError('');
    try {
      await resetContext.mutateAsync({ conversationId: conversation.id });
      await refreshConversations(conversation.id);
      setActionMessage('Future answers will start without the earlier transcript.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Answer context could not be reset.');
    }
  };

  const deleteCurrent = async () => {
    if (!conversation || !window.confirm('Delete this conversation? Its branches will remain saved.')) return;
    setActionError('');
    try {
      await deleteConversation.mutateAsync({ conversationId: conversation.id });
      await refreshConversations();
      navigate('/questions');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'The conversation could not be deleted.');
    }
  };

  return <>
    <Topline section="Implementation help" title={conversationId ? 'Continue the conversation.' : 'Start a conversation.'} description={conversationId ? 'The selected skill version stays fixed. Follow-ups use this conversation’s active answer context.' : 'Choose the exact skill version to ground the conversation, then describe the project and where you are stuck.'} action={conversationId ? <Link href="/ask" className="btn-subtle" data-testid="button-new-conversation"><Plus size={15}/> New conversation</Link> : undefined}/>
    {conversationId ? conversationQuery.isLoading ? <div className="panel p-6"><SkeletonLines count={3}/></div> : conversationQuery.isError || !conversation ? <div className="space-y-4"><ErrorNotice retry={()=>conversationQuery.refetch()}/><Link href="/questions" className="btn-subtle" data-testid="link-back-to-history">Back to history</Link></div> :
      <div className="space-y-5">
        <section className="panel p-5 sm:p-7" data-testid="conversation-view">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0"><p className="eyebrow">{conversation.skillName} · v{conversation.versionLabel}{conversation.projectName ? ` · ${conversation.projectName}` : ''}</p><h2 className="display text-3xl mt-2 break-words" data-testid="text-conversation-title">{conversation.title}</h2><p className="text-xs text-muted-foreground mt-2">{conversation.turnCount} transcript turns{conversation.parentConversationId ? ' · branched conversation' : ''}</p></div>
            <div className="flex flex-wrap gap-2" aria-label="Conversation actions">
              <button className="btn-subtle !py-2 !px-2.5 text-xs" onClick={()=>void renameCurrent()} data-testid="button-rename-conversation" aria-label="Rename conversation"><Pencil size={13}/> Rename</button>
              <button className="btn-subtle !py-2 !px-2.5 text-xs" onClick={()=>void duplicateCurrent()} disabled={duplicateConversation.isPending} data-testid="button-duplicate-conversation" aria-label="Duplicate conversation"><Copy size={13}/> Duplicate</button>
              <button className="btn-subtle !py-2 !px-2.5 text-xs" onClick={()=>void resetCurrentContext()} disabled={resetContext.isPending} data-testid="button-reset-conversation-context" aria-label="Reset future answer context"><RotateCcw size={13}/> Reset context</button>
              <button className="btn-subtle !py-2 !px-2.5 text-xs text-destructive" onClick={()=>void deleteCurrent()} disabled={deleteConversation.isPending} data-testid="button-delete-conversation" aria-label="Delete conversation"><Trash2 size={13}/> Delete</button>
            </div>
          </div>
          {conversation.contextStartSequence > 0 && <p className="mt-4 rounded-lg bg-accent/35 px-3 py-2 text-xs text-muted-foreground" role="status" data-testid="status-context-reset">Earlier turns remain visible but are excluded from future answers.</p>}
          {actionError && <p className="text-sm text-destructive mt-4" role="alert" data-testid="status-conversation-action-error">{actionError}</p>}
          {actionMessage && <p className="text-sm text-primary mt-4" role="status" data-testid="status-conversation-action-success">{actionMessage}</p>}
          <div className="mt-6 border-t border-border pt-2">
            <ConversationTranscript turns={conversation.turns} onBranch={turn=>void branchAtTurn(turn)} branching={branchConversation.isPending}/>
          </div>
        </section>
        <form className="panel p-5 sm:p-7" onSubmit={submit} data-testid="form-continue-conversation">
          <label className="block text-sm font-semibold" htmlFor="follow-up-question">Continue this conversation</label>
          <textarea id="follow-up-question" className="field mt-3 min-h-[120px] resize-y text-sm leading-6" minLength={1} maxLength={8000} required value={question} onChange={event=>setQuestion(event.target.value)} placeholder="Ask a follow-up about the same skill version…" data-testid="input-follow-up-question"/>
          <details className="group mt-3 border border-border rounded-lg">
            <summary className="list-none p-3 flex items-center gap-2 cursor-pointer text-xs font-semibold" data-testid="toggle-follow-up-code-context"><Code2 size={14}/> Add code context <span className="font-normal text-muted-foreground">optional</span><ChevronDown size={14} className="ml-auto"/></summary>
            <div className="px-3 pb-3"><textarea className="field min-h-[100px] resize-y font-mono text-xs leading-5" maxLength={12000} value={context} onChange={event=>setContext(event.target.value)} placeholder="Paste a relevant snippet, configuration, or error message…" data-testid="input-follow-up-code-context"/></div>
          </details>
          {error && <p className="text-sm text-destructive mt-3" role="alert" data-testid="status-ask-error">{error}</p>}
          <div className="flex justify-end mt-4"><button className="btn-primary" disabled={continueConversation.isPending || !question.trim()} data-testid="button-submit-follow-up">{continueConversation.isPending ? 'Working from your skill…' : 'Send follow-up'} <ArrowRight size={15}/></button></div>
        </form>
      </div>
      : skillsQuery.isLoading ? <div className="panel p-6"><SkeletonLines count={3}/></div> : skillsQuery.isError ? <ErrorNotice retry={()=>skillsQuery.refetch()}/> : skills.length === 0 ?
      <EmptyState testId="empty-ask-skills" title="No skills to ask about yet." detail="Create a skill and upload its first ZIP before starting an implementation question." action={<Link href="/skills" className="btn-primary" data-testid="button-add-skill-from-ask"><Plus size={15}/> Add a skill</Link>}/> :
      <div className="grid xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
        <form className="panel p-5 sm:p-7" onSubmit={submit} data-testid="form-ask-question">
          <div className="flex items-start gap-3 mb-6"><span className="grid place-items-center w-9 h-9 rounded-lg bg-accent/70 text-primary"><Sparkles size={17}/></span><div><h2 className="font-semibold">Set the context</h2><p className="text-xs text-muted-foreground mt-1">Answers stay attached to this exact version.</p></div></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-xs font-semibold">Skill<select className="field mt-2 text-sm font-normal" value={skillId} onChange={e=>{setSkillId(e.target.value);setVersionId('');}} required data-testid="select-skill"><option value="">Choose a skill…</option>{skills.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
            <label className="text-xs font-semibold">Skill version<select className="field mt-2 text-sm font-normal" value={versionId} onChange={e=>setVersionId(e.target.value)} required disabled={!skillId || versionsQuery.isLoading} data-testid="select-skill-version"><option value="">{versionsQuery.isLoading ? 'Loading versions…' : 'Choose a version…'}</option>{versions.map(v=><option key={v.id} value={v.id}>{v.versionLabel}{v.id===selected?.currentVersionId ? ' · current' : ''}</option>)}</select></label>
          </div>
          {versionsQuery.isError && <p className="text-xs text-destructive mt-2" data-testid="status-versions-error">Could not load versions for this skill.</p>}
          <label className="block text-xs font-semibold mt-5">Project name <span className="font-normal text-muted-foreground">optional</span><input className="field mt-2 text-sm font-normal" maxLength={120} value={project} onChange={e=>setProject(e.target.value)} placeholder="The project separate from this skill" data-testid="input-project-name"/></label>
          <label className="block text-xs font-semibold mt-5">What are you implementing?<textarea className="field mt-2 min-h-[145px] resize-y text-sm font-normal leading-6" minLength={10} maxLength={8000} required value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Describe the behavior you're trying to build, what you've tried, and what is blocking you…" data-testid="input-question"/></label>
          <div className="flex justify-end text-[10px] text-muted-foreground mt-1">{question.length.toLocaleString()} / 8,000</div>
          <details className="group mt-4 border border-border rounded-lg">
            <summary className="list-none p-3.5 flex items-center gap-2 cursor-pointer text-xs font-semibold hover:bg-muted/40 rounded-lg" data-testid="toggle-code-context"><Code2 size={15} className="text-primary"/> Add code context <span className="text-[10px] font-normal text-muted-foreground">optional</span><ChevronDown size={14} className="ml-auto text-muted-foreground transition-transform group-open:rotate-180"/></summary>
            <div className="px-3 pb-3"><textarea className="field min-h-[130px] resize-y font-mono text-xs leading-5" maxLength={12000} value={context} onChange={e=>setContext(e.target.value)} placeholder="Paste a relevant snippet, config, or error message…" data-testid="input-code-context"/><p className="text-right text-[10px] text-muted-foreground mt-1">{context.length.toLocaleString()} / 12,000</p><p className="text-[10px] text-muted-foreground mt-2">Remove API keys, passwords, and tokens before submitting. Common credential patterns are rejected.</p></div>
          </details>
          {error && <p className="text-sm text-destructive mt-4" role="alert" data-testid="status-ask-error">{error}</p>}
          <div className="mt-6 pt-5 border-t border-border flex flex-wrap justify-between items-center gap-4"><span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><ShieldCheck size={14}/> Private to your workspace</span><button className="btn-primary" disabled={createConversation.isPending || !versionId || question.trim().length < 10} data-testid="button-submit-question">{createConversation.isPending ? 'Working from your skill…' : 'Start conversation'} <ArrowRight size={15}/></button></div>
          {error && <p className="text-sm text-destructive mt-4" role="alert" data-testid="status-ask-error">{error}</p>}
        </form>
        <aside className="space-y-4">
          <div className="panel p-5"><p className="eyebrow">How answers stay grounded</p><ol className="mt-4 space-y-4">{[
            ['01','Pick the precise skill version','Your uploaded files become the reference, not a nearby or latest version.'],
            ['02','Describe the other project','Give the implementation issue enough detail to bridge skill guidance into your codebase.'],
            ['03','Keep the answer for later','Each answer is saved with the selected skill and version in your history.'],
          ].map(([n,title,copy])=><li className="flex gap-3" key={n}><span className="font-mono text-[10px] text-primary pt-0.5">{n}</span><span><strong className="block text-xs">{title}</strong><span className="block text-[11px] leading-5 text-muted-foreground mt-1">{copy}</span></span></li>)}</ol></div>
          {selected && <div className="rounded-xl border border-[hsl(var(--primary)/.2)] bg-[hsl(var(--accent)/.22)] p-4" data-testid="card-selected-skill"><p className="eyebrow">Selected skill</p><p className="font-semibold text-sm mt-2">{selected.name}</p><p className="text-xs text-muted-foreground mt-1">{selected.description || 'No description added.'}</p></div>}
        </aside>
      </div>}
  </>;
}

function ConversationTranscript({ turns, onBranch, branching }: { turns: ConversationTurn[]; onBranch: (turn: ConversationTurn) => void; branching: boolean }) {
  return <div className="space-y-4" aria-label="Conversation transcript" data-testid="list-conversation-turns">
    {turns.map(turn=><article key={turn.id} className={`rounded-xl p-4 sm:p-5 ${turn.role === 'assistant' ? 'bg-muted/55 border border-border/70' : 'bg-[hsl(var(--accent)/.2)] border border-[hsl(var(--accent)/.45)]'}`} data-testid={`conversation-turn-${turn.sequence}`}>
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="eyebrow !text-[11px]">{turn.role === 'assistant' ? 'Assistant' : 'You'}</p><button className="text-[10px] font-semibold text-primary hover:underline inline-flex items-center gap-1" onClick={()=>onBranch(turn)} disabled={branching} data-testid={`button-branch-turn-${turn.sequence}`} aria-label={`Branch from turn ${turn.sequence + 1}`}><GitBranch size={12}/> Branch from here</button></div>
      <div className="prose prose-sm max-w-none mt-3 whitespace-pre-wrap leading-6 text-foreground" data-testid={`text-turn-content-${turn.sequence}`}>{turn.content}</div>
      {turn.codeContext && <details className="mt-3"><summary className="text-xs text-muted-foreground cursor-pointer">Code context included</summary><pre className="mt-2 overflow-x-auto rounded-lg bg-background p-3 text-[11px] leading-5 whitespace-pre-wrap">{turn.codeContext}</pre></details>}
    </article>)}
    {turns.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">This conversation has no turns yet. Add a follow-up below.</p>}
  </div>;
}

function QuestionsPage() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const conversationsQuery = useListConversations();
  const duplicateConversation = useDuplicateConversation();
  const renameConversation = useRenameConversation();
  const resetContext = useResetConversationContext();
  const deleteConversation = useDeleteConversation();
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState('');
  const conversations = conversationsQuery.data?.conversations ?? [];
  const filtered = useMemo(() => conversations.filter(item=>`${item.title} ${item.lastMessage || ''} ${item.skillName} ${item.versionLabel} ${item.projectName || ''}`.toLowerCase().includes(search.toLowerCase())), [conversations, search]);
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetWorkbenchSummaryQueryKey() }),
    ]);
  };
  const duplicate = async (item: Conversation) => {
    setActionError('');
    try {
      const copy = await duplicateConversation.mutateAsync({ conversationId: item.id });
      await refresh();
      navigate(`/ask/${copy.id}`);
    } catch (err) { setActionError(err instanceof Error ? err.message : 'The conversation could not be duplicated.'); }
  };
  const rename = async (item: Conversation) => {
    const title = window.prompt('Rename this conversation', item.title);
    if (title === null || !title.trim()) return;
    setActionError('');
    try {
      await renameConversation.mutateAsync({ conversationId: item.id, data: { title: title.trim() } });
      await refresh();
    } catch (err) { setActionError(err instanceof Error ? err.message : 'The conversation could not be renamed.'); }
  };
  const reset = async (item: Conversation) => {
    if (!window.confirm('Reset future answer context? The transcript stays visible, but new answers will not use earlier turns.')) return;
    setActionError('');
    try {
      await resetContext.mutateAsync({ conversationId: item.id });
      await refresh();
    } catch (err) { setActionError(err instanceof Error ? err.message : 'Answer context could not be reset.'); }
  };
  const remove = async (item: Conversation) => {
    if (!window.confirm('Delete this conversation? Its branches will remain saved.')) return;
    setActionError('');
    try {
      await deleteConversation.mutateAsync({ conversationId: item.id });
      await refresh();
    } catch (err) { setActionError(err instanceof Error ? err.message : 'The conversation could not be deleted.'); }
  };
  return <>
    <Topline section="Saved work" title="Conversations." description="Continue version-specific implementation help or manage saved transcripts and independent branches." action={<Link href="/ask" className="btn-primary" data-testid="button-ask-another"><Plus size={15}/> New conversation</Link>}/>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5"><p className="text-xs text-muted-foreground" data-testid="text-conversation-count">{conversations.length} {conversations.length===1 ? 'conversation' : 'conversations'} saved</p><label className="relative w-full sm:w-72"><span className="sr-only">Search conversations</span><input className="field !py-2.5 !pl-9 text-xs" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search saved conversations" data-testid="input-search-conversations"/><MessageSquareText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/></label></div>
    {actionError && <p className="text-sm text-destructive mb-4" role="alert" data-testid="status-history-action-error">{actionError}</p>}
    {conversationsQuery.isLoading ? <SkeletonLines count={3}/> : conversationsQuery.isError ? <ErrorNotice retry={()=>conversationsQuery.refetch()}/> : filtered.length === 0 ?
      <EmptyState testId="empty-conversation-history" title={conversations.length ? 'No matching conversations.' : 'Nothing saved yet.'} detail={conversations.length ? 'Try a different phrase to find a saved transcript.' : 'Start an implementation conversation and its full transcript will stay here.'} action={conversations.length ? <button className="btn-subtle" onClick={()=>setSearch('')} data-testid="button-clear-conversation-search">Clear search <X size={14}/></button> : <Link href="/ask" className="btn-primary" data-testid="button-start-question"><MessageSquareText size={15}/> Start a conversation</Link>}/> :
      <div className="space-y-3" data-testid="list-conversations">{filtered.map(item=><article key={item.id} className="panel p-4 sm:p-5" data-testid={`conversation-row-${item.id}`}>
        <Link href={`/ask/${item.id}`} className="block group" data-testid={`link-open-conversation-${item.id}`}>
          <div className="flex flex-wrap justify-between items-start gap-3"><div className="min-w-0"><h2 className="font-semibold leading-5 group-hover:text-primary" data-testid={`text-history-title-${item.id}`}>{item.title}</h2><p className="text-[11px] text-muted-foreground mt-2">{item.skillName} <span>/</span> <span className="font-mono">v{item.versionLabel}</span>{item.projectName && <> <span>/</span> {item.projectName}</>}</p></div><span className="text-[10px] text-muted-foreground shrink-0">{item.turnCount} turns</span></div>
          {item.lastMessage && <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{item.lastMessage}</p>}
          {item.parentConversationId && <span className="inline-flex items-center gap-1 text-[10px] text-primary mt-3"><GitBranch size={12}/> Branch</span>}
        </Link>
        <div className="flex flex-wrap gap-1.5 border-t border-border mt-4 pt-3" aria-label={`Actions for ${item.title}`}>
          <button className="btn-subtle !py-1.5 !px-2 text-[10px]" onClick={()=>void rename(item)} data-testid={`button-history-rename-${item.id}`}><Pencil size={12}/> Rename</button>
          <button className="btn-subtle !py-1.5 !px-2 text-[10px]" onClick={()=>void duplicate(item)} data-testid={`button-history-duplicate-${item.id}`}><Copy size={12}/> Duplicate</button>
          <button className="btn-subtle !py-1.5 !px-2 text-[10px]" onClick={()=>void reset(item)} data-testid={`button-history-reset-${item.id}`}><RotateCcw size={12}/> Reset context</button>
          <button className="btn-subtle !py-1.5 !px-2 text-[10px] text-destructive" onClick={()=>void remove(item)} data-testid={`button-history-delete-${item.id}`}><Trash2 size={12}/> Delete</button>
        </div>
      </article>)}</div>}
  </>;
}

function SharedSkillPage() {
  const [matched, params] = useRoute('/share/:token');
  const token = matched ? params?.token ?? '' : '';
  const sharedQuery = useGetSharedSkillVersion(token, {
    query: {
      queryKey: getGetSharedSkillVersionQueryKey(token),
      enabled: Boolean(token),
      retry: false,
    },
  });
  const shared = sharedQuery.data;
  useEffect(() => {
    const robotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previousRobots = robotsMeta?.content;
    if (robotsMeta) robotsMeta.content = 'noindex, nofollow';
    const previousTitle = document.title;
    document.title = shared ? `${shared.name} · Skills Workbench` : 'Shared skill · Skills Workbench';
    return () => {
      if (robotsMeta && previousRobots !== undefined) robotsMeta.content = previousRobots;
      document.title = previousTitle;
    };
  }, [shared]);

  return <main className="min-h-[100dvh] px-5 py-10 sm:px-8 sm:py-16">
    <div className="mx-auto max-w-3xl">
      <Link href="/gallery" className="inline-flex items-center gap-2 text-sm font-semibold" data-testid="link-shared-brand">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-foreground"><Code2 size={18}/></span>
        Skills Workbench
      </Link>
      {sharedQuery.isLoading ? <section className="panel mt-10 p-7"><SkeletonLines count={2}/></section> :
        sharedQuery.isError || !shared ? <section className="panel mt-10 p-7 sm:p-10 text-center" data-testid="shared-link-unavailable">
          <div className="mx-auto grid place-items-center w-12 h-12 rounded-full bg-muted text-muted-foreground"><LockKeyhole size={20}/></div>
          <p className="eyebrow mt-5">Unlisted skill version</p>
          <h1 className="display text-3xl mt-2">This link is unavailable.</h1>
          <p className="text-sm text-muted-foreground mt-3">It may have been revoked or is no longer valid.</p>
          <Link href="/gallery" className="btn-subtle mt-6" data-testid="link-unavailable-gallery">Explore public skills <ArrowRight size={14}/></Link>
        </section> : <article className="panel mt-10 overflow-hidden" data-testid="shared-skill-page">
          <div className="bg-[hsl(var(--accent)/.32)] px-6 py-7 sm:px-10 sm:py-9">
            <p className="eyebrow">Unlisted version share</p>
            <h1 className="display text-4xl sm:text-5xl mt-3" data-testid="text-shared-skill-name">{shared.name}</h1>
            <p className="mt-3 text-sm text-muted-foreground">Version <span className="font-mono font-semibold">v{shared.versionLabel}</span> · {shared.fileCount} files</p>
          </div>
          <div className="px-6 py-6 sm:px-10 sm:py-8">
            <p className="text-xs text-muted-foreground">Uploaded {dateLabel(shared.uploadedAt)}</p>
            {shared.description && <p className="text-sm leading-6 mt-4 whitespace-pre-wrap" data-testid="text-shared-skill-description">{shared.description}</p>}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-7 border-t border-border pt-6">
              <p className="text-xs leading-5 text-muted-foreground">This link provides access only to the selected version’s ZIP archive.</p>
              <a className="btn-primary shrink-0" href={getDownloadSharedSkillVersionUrl(token)} data-testid="link-download-shared-version"><FileArchive size={15}/> Download version ZIP <ArrowDownToLine size={14}/></a>
            </div>
          </div>
        </article>}
      <p className="text-[11px] text-muted-foreground text-center mt-6">This page is unlisted and does not appear in the public gallery.</p>
    </div>
  </main>;
}

function Router() {
  return <Switch>
    <Route path="/gallery" component={PublicGallery}/>
    <Route path="/share/:token" component={SharedSkillPage}/>
    <Route><Shell><Switch>
      <Route path="/" component={Overview}/>
      <Route path="/skills" component={SkillsPage}/>
      <Route path="/ask/:conversationId" component={AskPage}/>
      <Route path="/ask" component={AskPage}/>
      <Route path="/questions" component={QuestionsPage}/>
      <Route path="/settings" component={SettingsRoute}/>
      <Route component={NotFound}/>
    </Switch></Shell></Route>
  </Switch>;
}

function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router/></WouterRouter></QueryClientProvider>;
}

export default App;