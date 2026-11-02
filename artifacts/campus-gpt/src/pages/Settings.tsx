import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Command, Gauge, LogOut, Monitor, Moon, Settings as SettingsIcon, Sparkles, Sun, Zap,
  type LucideIcon,
} from 'lucide-react';
import { getGetUserProfileQueryKey, useGetUserProfile, useUpdateUserProfile } from '@workspace/api-client-react';
import type { UserProfile, UserProfileUpdate } from '@workspace/api-client-react';
import { authClient } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '../components/layout/PageHeader';
import { useAppStore, type ChatMode, type ThemePreference } from '../store/appStore';
import { isMac } from '../lib/platform';

const THEMES: Array<{ value: ThemePreference; label: string; icon: LucideIcon }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

const MODES: Array<{ value: ChatMode; label: string; hint: string; icon: LucideIcon }> = [
  { value: 'auto', label: 'Auto', hint: 'Picks the right model for each question', icon: Sparkles },
  { value: 'default', label: 'Smart', hint: 'Thinks deeper before answering — best for hard questions', icon: Gauge },
  { value: 'fast', label: 'Fast', hint: 'Quicker answers for simple questions', icon: Zap },
];

const YEARS = [1, 2, 3, 4, 5, 6, 7, 8];

interface FormState {
  name: string;
  degree: string;
  faculty: string;
  year: string;
  hall: string;
  interests: string;
}

function toForm(p?: {
  name?: string | null; degree?: string | null; faculty?: string | null;
  year?: number | null; hall?: string | null; interests?: string[] | null;
}): FormState {
  return {
    name: p?.name ?? '',
    degree: p?.degree ?? '',
    faculty: p?.faculty ?? '',
    year: p?.year ? String(p.year) : '',
    hall: p?.hall ?? '',
    interests: (p?.interests ?? []).join(', '),
  };
}

function parseInterests(text: string): string[] {
  const seen = new Set<string>();
  for (const part of text.split(',')) {
    const value = part.trim().slice(0, 60);
    if (value) seen.add(value);
  }
  return [...seen].slice(0, 20);
}

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading, isError } = useGetUserProfile();
  const {
    themePreference, setThemePreference, chatMode, setChatMode,
    voiceOutputEnabled, setVoiceOutputEnabled, setCommandPaletteOpen,
  } = useAppStore();

  async function signOut() {
    await authClient.signOut();
    queryClient.clear(); // don't leak this user's cached data to the next sign-in
  }

  const mod = isMac() ? '⌘' : 'Ctrl';
  const shortcuts: Array<{ label: string; keys: string[] }> = [
    { label: 'Open the command palette', keys: [mod, 'K'] },
    { label: 'Start a new chat', keys: [mod, '⇧', 'O'] },
    { label: 'Show or hide the sidebar', keys: [mod, '\\'] },
    { label: 'Open settings', keys: [mod, ','] },
    { label: 'Send a message', keys: ['Enter'] },
    { label: 'New line in a message', keys: ['⇧', 'Enter'] },
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      <PageHeader title="Settings" icon={<SettingsIcon className="h-[18px] w-[18px] text-muted-foreground" aria-hidden />} />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-4 py-8 md:px-6">
          {/* Profile */}
          <Section title="Profile" description="CampusGPT uses this to tailor answers to your course and year.">
            {isError ? (
              <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
                Your profile could not be loaded. Refresh the page to try again.
              </p>
            ) : isLoading || !profile ? (
              <div className="flex flex-col gap-3" aria-busy>
                {[0, 1, 2].map((i) => <div key={i} className="h-11 animate-shimmer rounded-xl" />)}
              </div>
            ) : (
              <ProfileForm key={profile.id} profile={profile} />
            )}
          </Section>

          {/* Appearance */}
          <Section title="Appearance" description="System follows your device and switches with it.">
            <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-3">
              {THEMES.map(({ value, label, icon: Icon }) => {
                const active = themePreference === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setThemePreference(value)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm transition-colors',
                      active ? 'border-foreground bg-card font-medium text-foreground' : 'border-border text-muted-foreground hover:bg-card hover:text-foreground',
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden /> {label}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Chat */}
          <Section title="Chat" description="How CampusGPT answers. You can also switch per message from the chat box.">
            <div role="radiogroup" aria-label="Answer mode" className="flex flex-col gap-2">
              {MODES.map(({ value, label, hint, icon: Icon }) => {
                const active = chatMode === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setChatMode(value)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                      active ? 'border-foreground bg-card' : 'border-border hover:bg-card',
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">{label}</span>
                      <span className="block text-[13px] text-muted-foreground">{hint}</span>
                    </span>
                    <span
                      className={cn(
                        'h-4 w-4 shrink-0 rounded-full border-2',
                        active ? 'border-foreground bg-foreground shadow-[inset_0_0_0_2px_var(--color-card)]' : 'border-border',
                      )}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
              <div className="min-w-0">
                <Label htmlFor="voice-replies" className="text-sm font-medium text-foreground">Voice replies</Label>
                <p className="text-[13px] text-muted-foreground">Read answers aloud during voice sessions.</p>
              </div>
              <Switch id="voice-replies" checked={voiceOutputEnabled} onCheckedChange={setVoiceOutputEnabled} />
            </div>
          </Section>

          {/* Shortcuts */}
          <Section title="Commands & shortcuts" description="Jump to any chat or page without leaving the keyboard.">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-card"
            >
              <Command className="h-[18px] w-[18px] text-muted-foreground" aria-hidden />
              <span className="flex-1">Open the command palette</span>
              <KbdGroup><Kbd>{mod}</Kbd><Kbd>K</Kbd></KbdGroup>
            </button>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {shortcuts.map(({ label, keys }) => (
                <li key={label} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                  <span className="text-foreground">{label}</span>
                  <KbdGroup>{keys.map((k) => <Kbd key={k}>{k}</Kbd>)}</KbdGroup>
                </li>
              ))}
            </ul>
          </Section>

          {/* Account */}
          <Section title="Account">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Sign out</p>
                <p className="truncate text-[13px] text-muted-foreground">{profile?.email ?? 'Leave this device'}</p>
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card"
              >
                <LogOut className="h-4 w-4" aria-hidden /> Sign out
              </button>
            </div>
          </Section>

          <p className="pb-4 text-center text-xs text-muted-foreground">
            CampusGPT — an unofficial assistant for University of Ghana students. For anything important, confirm with the official office.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfileForm({ profile }: { profile: UserProfile }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateProfile = useUpdateUserProfile();

  // Starts from the loaded profile so every field (the year select included)
  // mounts with its real value instead of being filled in a moment later.
  const [baseline, setBaseline] = useState(() => toForm(profile));
  const [form, setForm] = useState(baseline);

  const dirty = (Object.keys(baseline) as Array<keyof FormState>).some((k) => baseline[k] !== form[k]);
  const nameMissing = form.name.trim().length === 0;
  const set = (key: keyof FormState) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || nameMissing) return;
    const data: UserProfileUpdate = {
      name: form.name.trim(),
      degree: form.degree.trim(),
      faculty: form.faculty.trim(),
      hall: form.hall.trim(),
      interests: parseInterests(form.interests),
    };
    if (form.year) data.year = Number(form.year);
    try {
      const updated = await updateProfile.mutateAsync({ data });
      const next = toForm(updated);
      setBaseline(next);
      setForm(next);
      await queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
      toast({ title: 'Profile saved' });
    } catch {
      toast({ title: 'Could not save your profile', description: 'Please try again.', variant: 'destructive' });
    }
  }

  return (
      <form onSubmit={save} className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-foreground text-xl font-semibold text-background"
            aria-hidden
          >
            {(form.name.trim() || profile?.name || 'S').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{profile.name}</p>
            <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="name" label="Name" className="sm:col-span-2">
            <Input id="name" value={form.name} maxLength={120} autoComplete="name" onChange={(e) => set('name')(e.target.value)} />
          </Field>
          <Field id="degree" label="Degree">
            <Input id="degree" value={form.degree} maxLength={160} placeholder="e.g. BSc Computer Science" onChange={(e) => set('degree')(e.target.value)} />
          </Field>
          <Field id="faculty" label="Faculty">
            <Input id="faculty" value={form.faculty} maxLength={160} placeholder="e.g. School of Physical & Mathematical Sciences" onChange={(e) => set('faculty')(e.target.value)} />
          </Field>
          <Field id="year" label="Year of study">
            <Select value={form.year} onValueChange={(v) => v && set('year')(v)}>
              <SelectTrigger id="year"><SelectValue placeholder="Select year" /></SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field id="hall" label="Hall or residence">
            <Input id="hall" value={form.hall} maxLength={160} placeholder="e.g. Commonwealth Hall" onChange={(e) => set('hall')(e.target.value)} />
          </Field>
          <Field id="interests" label="Interests" hint="Separate with commas" className="sm:col-span-2">
            <Input id="interests" value={form.interests} placeholder="e.g. robotics, football, debate" onChange={(e) => set('interests')(e.target.value)} />
          </Field>
          <Field id="email" label="Student email" hint="Comes from your verified account" className="sm:col-span-2">
            <Input id="email" value={profile.email} readOnly disabled />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3">
          {dirty && (
            <button
              type="button"
              onClick={() => setForm(baseline)}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Discard
            </button>
          )}
          <button
            type="submit"
            disabled={!dirty || nameMissing || updateProfile.isPending}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {updateProfile.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby={`settings-${title}`}>
      <div>
        <h2 id={`settings-${title}`} className="text-base font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ id, label, hint, className, children }: { id: string; label: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="text-[13px] font-medium text-foreground">
        {label}
        {hint && <span className="ml-2 font-normal text-muted-foreground">{hint}</span>}
      </Label>
      {children}
    </div>
  );
}
