import { GraduationCap, Plus } from 'lucide-react';
import { useListPlannerItems } from '@workspace/api-client-react';

export default function Planner() {
  const { data: items, isLoading } = useListPlannerItems();

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="h-14 border-b border-border flex items-center px-6 shrink-0 bg-background/80 backdrop-blur-sm z-10 sticky top-0 justify-between">
        <h1 className="font-semibold text-text-primary flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-brand-500" />
          Academic Planner
        </h1>
        <button className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          New Item
        </button>
      </div>

      <div className="p-6 overflow-y-auto">
        {isLoading ? (
          <div className="text-text-tertiary">Loading planner...</div>
        ) : items?.length ? (
          <div className="flex flex-col gap-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4 border border-border bg-card rounded-xl hover:border-brand-500 transition-colors">
                <input type="checkbox" className="w-5 h-5 rounded border-border text-brand-500 focus:ring-brand-500" checked={item.done} readOnly />
                <div className="flex-1">
                  <h3 className={`font-medium ${item.done ? 'text-text-tertiary line-through' : 'text-text-primary'}`}>{item.title}</h3>
                  <p className="text-xs text-text-secondary mt-0.5">{item.moduleCode} · Due {new Date(item.dueAt).toLocaleDateString()}</p>
                </div>
                {item.urgency === 'high' && !item.done && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-danger/10 text-danger">Urgent</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-sidebar rounded-full flex items-center justify-center mb-4 text-text-tertiary">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">Your planner is empty</h3>
            <p className="text-sm text-text-secondary max-w-sm mb-6">Ask CampusGPT to extract deadlines from your syllabus and add them here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
