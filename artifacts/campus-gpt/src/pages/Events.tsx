import { CalendarRange, MapPin } from 'lucide-react';
import { useListEvents } from '@workspace/api-client-react';

export default function Events() {
  const { data: events, isLoading } = useListEvents();

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="h-14 border-b border-border flex items-center px-6 shrink-0 bg-background/80 backdrop-blur-sm z-10 sticky top-0">
        <h1 className="font-semibold text-text-primary flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-brand-500" />
          Events
        </h1>
      </div>

      <div className="p-6 overflow-y-auto">
        {isLoading ? (
          <div className="text-text-tertiary">Loading events...</div>
        ) : events?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map(event => (
              <div key={event.id} className="p-5 border border-border bg-card rounded-xl flex flex-col gap-3 hover:border-brand-500 transition-colors">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-text-primary">{event.title}</h3>
                  {event.category && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-brand-50 text-brand-600">
                      {event.category}
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary line-clamp-2">{event.description}</p>
                <div className="mt-auto pt-4 flex items-center gap-4 text-xs text-text-tertiary">
                  <div className="flex items-center gap-1.5">
                    <CalendarRange className="w-4 h-4" />
                    {new Date(event.startAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate max-w-[120px]">{event.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-sidebar rounded-full flex items-center justify-center mb-4 text-text-tertiary">
              <CalendarRange className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">No upcoming events</h3>
            <p className="text-sm text-text-secondary max-w-sm">There are no events matching your interests right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
