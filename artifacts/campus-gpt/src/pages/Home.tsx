import { useGetDailyDigest, useGetUserProfile } from '@workspace/api-client-react';
import { Clock, Calendar, CheckCircle2, ChevronRight } from 'lucide-react';
import { Composer } from '../components/chat/Composer';
import { useLocation } from 'wouter';

export default function Home() {
  const { data: profile } = useGetUserProfile();
  const { data: digest } = useGetDailyDigest();
  const [, setLocation] = useLocation();

  const handleSend = (content: string) => {
    // Ideally this creates a thread then navigates to it.
    // For now we just mock navigating to a new thread.
    setLocation('/chat/1'); // Mock ID
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      <div className="flex-1 overflow-y-auto pt-20 px-8 pb-32">
        <div className="max-w-3xl mx-auto space-y-12">
          
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-text-primary tracking-tight">
              ✨ Good morning, {profile?.name || 'Aisha'}
            </h1>
            <p className="text-lg text-text-secondary">Your campus, in conversation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "Plan my semester",
              "What's my week look like?",
              "Upload my syllabus",
              "Tell me about King Edward VII Hall"
            ].map(suggestion => (
              <button 
                key={suggestion}
                className="text-left px-4 py-3 rounded-xl border border-border bg-card hover:bg-background hover:border-brand-500 transition-colors text-text-secondary hover:text-brand-600 text-sm font-medium shadow-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {digest && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-text-primary font-semibold text-sm">
                  <Clock className="w-4 h-4 text-brand-500" />
                  Today's Schedule
                </div>
                <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm">
                  {digest.todayEntries?.length > 0 ? (
                    digest.todayEntries.map(entry => (
                      <div key={entry.id} className="flex gap-3">
                        <div className="w-1 h-full bg-brand-500 rounded-full" />
                        <div>
                          <div className="text-sm font-medium">{entry.moduleCode}</div>
                          <div className="text-xs text-text-secondary">{entry.startTime} - {entry.endTime} · {entry.venue}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-text-secondary">No classes today.</div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-text-primary font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-warning" />
                  Upcoming Deadlines
                </div>
                <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm">
                  {digest.upcomingDeadlines?.length > 0 ? (
                    digest.upcomingDeadlines.slice(0,3).map(item => (
                      <div key={item.id} className="flex justify-between items-center group cursor-pointer">
                        <div>
                          <div className="text-sm font-medium group-hover:text-brand-500 transition-colors">{item.title}</div>
                          <div className="text-xs text-text-secondary">{item.moduleCode} · {new Date(item.dueAt).toLocaleDateString()}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-brand-500 transition-colors" />
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-text-secondary">No upcoming deadlines.</div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/90 to-transparent pt-10">
        <Composer onSend={handleSend} />
      </div>
    </div>
  );
}
