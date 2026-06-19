import { useGetDailyDigest, useGetUserProfile, useCreateThread } from '@workspace/api-client-react';
import { Clock, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { Composer } from '../components/chat/Composer';
import { useLocation } from 'wouter';

const SUGGESTIONS = [
  "How do I register my courses on MIS Web?",
  "What's my week look like?",
  "How do I check plagiarism on Sakai?",
  "Tell me about SLTF student loans",
];

export default function Home() {
  const { data: profile } = useGetUserProfile();
  const { data: digest } = useGetDailyDigest();
  const [, setLocation] = useLocation();
  const createThread = useCreateThread();

  const handleSend = async (content: string) => {
    try {
      const thread = await createThread.mutateAsync({
        data: { title: content.slice(0, 60), space: 'academic' }
      });
      setLocation(`/chat/${thread.id}`);
    } catch {
      setLocation('/chat/1');
    }
  };

  const handleSuggestion = (s: string) => {
    handleSend(s);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = profile?.name?.split(' ')[0] || 'there';

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="flex-1 overflow-y-auto pt-6 md:pt-16 px-4 md:px-8 pb-36 md:pb-40">
        <div className="max-w-3xl mx-auto space-y-8 md:space-y-12">

          {/* Greeting */}
          <div className="space-y-1 md:space-y-2">
            <h1 className="text-2xl md:text-3xl font-semibold text-text-primary tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-brand-500" />
              {greeting}, {firstName}
            </h1>
            <p className="text-base md:text-lg text-text-secondary">Your campus, in conversation.</p>
          </div>

          {/* Quick suggestions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="text-left px-4 py-3 rounded-xl border border-border bg-card hover:bg-background hover:border-brand-500 transition-colors text-text-secondary hover:text-brand-600 text-sm font-medium shadow-sm active:scale-[0.98]"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Dashboard widgets */}
          {digest && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-2">
              {/* Today's schedule */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-text-primary font-semibold text-sm">
                  <Clock className="w-4 h-4 text-brand-500" />
                  Today's Schedule
                </div>
                <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm">
                  {digest.todayEntries?.length > 0 ? (
                    digest.todayEntries.map((entry: any) => (
                      <div key={entry.id} className="flex gap-3 items-start">
                        <div className="w-1 rounded-full bg-brand-500 self-stretch shrink-0 min-h-[32px]" />
                        <div>
                          <div className="text-sm font-medium text-text-primary">{entry.moduleCode}</div>
                          <div className="text-xs text-text-secondary">{entry.startTime} – {entry.endTime} · {entry.venue}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-text-secondary py-2">No classes today — enjoy the break! 🎉</div>
                  )}
                </div>
              </div>

              {/* Upcoming deadlines */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-text-primary font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-warning" />
                  Upcoming Deadlines
                </div>
                <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm">
                  {digest.upcomingDeadlines?.length > 0 ? (
                    digest.upcomingDeadlines.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center group cursor-pointer" onClick={() => setLocation('/planner')}>
                        <div className="min-w-0 flex-1 mr-2">
                          <div className="text-sm font-medium group-hover:text-brand-500 transition-colors truncate">{item.title}</div>
                          <div className="text-xs text-text-secondary">{item.moduleCode} · {new Date(item.dueAt).toLocaleDateString()}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-brand-500 transition-colors shrink-0" />
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-text-secondary py-2">No upcoming deadlines this week.</div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Floating composer */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-10 pb-14 md:pb-0">
        <Composer onSend={handleSend} placeholder="Ask me anything about UG campus..." />
      </div>
    </div>
  );
}
