import { Calendar as CalendarIcon } from 'lucide-react';
import { useListTimetableEntries } from '@workspace/api-client-react';

export default function Timetable() {
  const { data: entries, isLoading } = useListTimetableEntries();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="h-14 border-b border-border flex items-center px-6 shrink-0 bg-background/80 backdrop-blur-sm z-10 sticky top-0">
        <h1 className="font-semibold text-text-primary flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-brand-500" />
          Timetable
        </h1>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        {isLoading ? (
          <div className="text-text-tertiary">Loading timetable...</div>
        ) : entries?.length ? (
          <div className="grid grid-cols-5 gap-4 h-full min-h-[600px]">
            {days.map((day, idx) => (
              <div key={day} className="flex flex-col border border-border rounded-xl overflow-hidden bg-card/30">
                <div className="p-3 border-b border-border bg-sidebar font-medium text-sm text-center text-text-secondary">
                  {day}
                </div>
                <div className="flex-1 p-2 flex flex-col gap-2 relative">
                  {entries.filter(e => e.dayOfWeek === idx + 1).map(entry => (
                    <div 
                      key={entry.id} 
                      className="p-2 text-xs rounded-md border border-brand-500/20 bg-brand-50 text-brand-600 hover:bg-brand-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="font-bold mb-1">{entry.moduleCode}</div>
                      <div>{entry.type}</div>
                      <div className="opacity-80">{entry.startTime} - {entry.endTime}</div>
                      <div className="opacity-80 truncate">{entry.venue}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-sidebar rounded-full flex items-center justify-center mb-4 text-text-tertiary">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">No classes scheduled</h3>
            <p className="text-sm text-text-secondary max-w-sm mb-6">Your timetable is empty. Add your modules via chat or settings.</p>
          </div>
        )}
      </div>
    </div>
  );
}
