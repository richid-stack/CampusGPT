import { useRef, useState } from 'react';
import { Book, FileText, Upload, Trash2, Loader2, Plus } from 'lucide-react';
import { useListDocuments, useCreateDocument, useDeleteDocument } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

function getFileType(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    pdf: 'PDF', doc: 'Word', docx: 'Word',
    ppt: 'PowerPoint', pptx: 'PowerPoint',
    xls: 'Excel', xlsx: 'Excel',
    txt: 'Text', md: 'Markdown',
    png: 'Image', jpg: 'Image', jpeg: 'Image',
  };
  return map[ext] || ext.toUpperCase() || 'File';
}

function estimatePages(file: File): number {
  const mb = file.size / (1024 * 1024);
  if (file.type.includes('pdf')) return Math.max(1, Math.round(mb * 10));
  if (file.name.match(/\.(doc|docx)$/i)) return Math.max(1, Math.round(mb * 20));
  return 1;
}

export default function Documents() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { data: documents, isLoading } = useListDocuments();
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();
  const queryClient = useQueryClient();

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    try {
      for (const file of files) {
        await createDocument.mutateAsync({
          data: {
            name: file.name,
            type: getFileType(file),
            pageCount: estimatePages(file),
          },
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
    try {
      await deleteDocument.mutateAsync({ documentId: id });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.png,.jpg,.jpeg"
        onChange={handleFileChange}
      />

      <div className="h-14 border-b border-border flex items-center px-4 md:px-6 shrink-0 bg-background/80 backdrop-blur-sm z-10 sticky top-0 justify-between">
        <h1 className="font-semibold text-text-primary flex items-center gap-2">
          <Book className="w-5 h-5 text-brand-500" />
          Documents
        </h1>
        <button
          onClick={handleUploadClick}
          disabled={uploading}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-text-tertiary py-10 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading documents…
          </div>
        ) : documents?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Upload tile */}
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className="p-4 border-2 border-dashed border-border hover:border-brand-500 bg-card rounded-xl transition-colors flex flex-col items-center justify-center gap-2 text-text-tertiary hover:text-brand-500 min-h-[120px] group"
            >
              <Plus className="w-7 h-7" />
              <span className="text-sm font-medium">Add document</span>
            </button>

            {documents.map(doc => (
              <div key={doc.id} className="p-4 border border-border bg-card rounded-xl hover:border-brand-500 transition-colors group relative">
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleteId === doc.id}
                  className="absolute top-3 right-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 text-text-tertiary transition-all"
                >
                  {deleteId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
                <div className="flex items-start gap-3 mb-3 pr-6">
                  <div className="p-2 bg-brand-50 rounded-lg text-brand-600 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-text-primary line-clamp-2 text-sm leading-snug">{doc.name}</h3>
                    <p className="text-xs text-text-secondary mt-1">{doc.type} · {doc.pageCount || 0} pages</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                  ${doc.status === 'ready' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}
                >
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-sidebar rounded-full flex items-center justify-center mb-4 text-text-tertiary">
              <Book className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">No documents yet</h3>
            <p className="text-sm text-text-secondary max-w-sm mb-6">
              Upload your syllabus, lecture notes, or reading materials. CampusGPT will reference them when answering questions.
            </p>
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Uploading…' : 'Upload your first document'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
