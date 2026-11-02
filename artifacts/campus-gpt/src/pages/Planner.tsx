import { GraduationCap, Plus } from 'lucide-react';
import { useListPlannerItems } from '@workspace/api-client-react';
import { PageHeader } from '../components/layout/PageHeader';

export default function Planner() {
  const { data: items, isLoading } = useListPlannerItems();

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <PageHeader
        title="Academic Planner"
        icon={<GraduationCap className="h-[18px] w-[18px] text-muted-foreground" aria-hidden />}
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New item
          </button>
        }
      />

      <div className="p-6 overflow-y-auto">
        {isLoading ? (
          <div className="text-muted-foreground">Loading planner...</div>
        ) : items?.length ? (
          <div className="flex flex-col gap-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4 border border-border bg-card rounded-xl hover:border-foreground/30 transition-colors">
                <input type="checkbox" className="w-5 h-5 rounded border-border text-foreground focus:ring-ring" checked={item.done} readOnly />
                <div className="flex-1">
                  <h3 className={`font-medium ${item.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.moduleCode} · Due {new Date(item.dueAt).toLocaleDateString()}</p>
                </div>
                {item.urgency === 'high' && !item.done && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-danger/10 text-danger">Urgent</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-sidebar rounded-full flex items-center justify-center mb-4 text-muted-foreground">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Your planner is empty</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">Ask CampusGPT to extract deadlines from your syllabus and add them here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
