export function ContextPanel() {
  return (
    <aside className="w-[360px] h-full bg-sidebar border-l border-border transition-all duration-220 ease-out transform translate-x-0 flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-sm">Context</h2>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <p className="text-sm text-text-secondary">Context panel content will appear here.</p>
      </div>
    </aside>
  );
}
