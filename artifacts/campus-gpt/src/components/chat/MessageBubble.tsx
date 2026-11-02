import type { CampusMessage } from '../../lib/chatTypes';

interface MessageBubbleProps {
  message: CampusMessage;
}

/** What the student sent: their words, plus any photos attached in this session. */
export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role !== 'user') return null;

  const text = message.parts.map((p) => (p.type === 'text' ? p.text : '')).join('');
  const images = message.parts.filter((p) => p.type === 'file' && p.mediaType.startsWith('image/'));

  return (
    <div className="flex w-full justify-end px-2 md:px-4">
      <div className="flex max-w-[85%] flex-col items-end gap-2 md:max-w-[75%]">
        {images.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2">
            {images.map((img, i) =>
              img.type === 'file' ? (
                <img
                  key={i}
                  src={img.url}
                  alt={img.filename ?? 'Attached photo'}
                  className="max-h-48 max-w-full rounded-2xl border border-border object-cover"
                />
              ) : null,
            )}
          </div>
        )}
        {text && text !== '[image]' && (
          <div className="whitespace-pre-wrap break-words rounded-3xl rounded-br-lg bg-card px-4 py-2.5 text-[15px] leading-relaxed text-foreground">
            {text}
          </div>
        )}
        {text === '[image]' && images.length === 0 && (
          <div className="rounded-3xl rounded-br-lg bg-card px-4 py-2.5 text-[15px] italic text-muted-foreground">Photo</div>
        )}
      </div>
    </div>
  );
}
