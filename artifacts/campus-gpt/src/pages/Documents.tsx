import { Book, FileText, Upload } from 'lucide-react';
import { useListDocuments } from '@workspace/api-client-react';

export default function Documents() {
  const { data: documents, isLoading } = useListDocuments();

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="h-14 border-b border-border flex items-center px-6 shrink-0 bg-background/80 backdrop-blur-sm z-10 sticky top-0 justify-between">
        <h1 className="font-semibold text-text-primary flex items-center gap-2">
          <Book className="w-5 h-5 text-brand-500" />
          Documents
        </h1>
        <button className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
          <Upload className="w-4 h-4" />
          Upload
        </button>
      </div>

      <div className="p-6 overflow-y-auto">
        {isLoading ? (
          <div className="text-text-tertiary">Loading documents...</div>
        ) : documents?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(doc => (
              <div key={doc.id} className="p-4 border border-border bg-card rounded-xl hover:border-brand-500 cursor-pointer transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-brand-50 rounded-lg text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                    ${doc.status === 'ready' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}
                  >
                    {doc.status}
                  </span>
                </div>
                <h3 className="font-medium text-text-primary line-clamp-1">{doc.name}</h3>
                <p className="text-xs text-text-secondary mt-1">{doc.type} · {doc.pageCount || 0} pages</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-sidebar rounded-full flex items-center justify-center mb-4 text-text-tertiary">
              <Book className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">No documents yet</h3>
            <p className="text-sm text-text-secondary max-w-sm mb-6">Upload syllabus, reading materials, or notes. CampusGPT will read them and answer your questions.</p>
            <button className="flex items-center gap-2 bg-card border border-border hover:border-brand-500 text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
