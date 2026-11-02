import type { UIMessage } from 'ai';
import type { Message } from '@workspace/api-client-react';
import { parseNavTag, stripNavTag, type NavDestination } from '../services/navigationService';

/** Extra info the server attaches to each assistant message. */
export type ChatMetadata = {
  model?: string;
  modelLabel?: string;
  /** Whole seconds the model spent thinking before it answered. */
  thinkingSeconds?: number;
};

export type CampusMessage = UIMessage<ChatMetadata>;
export type CampusPart = CampusMessage['parts'][number];

/** The step the assistant shows when it looks up a campus place. */
export const CAMPUS_LOOKUP_TOOL = 'findCampusLocation';
export const CAMPUS_LOOKUP_PART = `tool-${CAMPUS_LOOKUP_TOOL}`;

const MODEL_LABELS: Record<string, string> = {
  'openai/gpt-oss-120b': 'GPT OSS · 120B',
  'openai/gpt-oss-20b': 'GPT OSS · 20B',
  'qwen/qwen3.6-27b': 'Qwen 3.6 · 27B',
};

export function modelLabelFor(model?: string | null): string | undefined {
  if (!model) return undefined;
  return MODEL_LABELS[model] ?? model.split('/').pop();
}

/** A saved row as the chat screen shows it. Older rows have no `parts`. */
export function rowToUIMessage(row: Message): CampusMessage {
  const id = String(row.id);

  if (row.role === 'user') {
    return { id, role: 'user', parts: [{ type: 'text', text: row.content }] };
  }

  const metadata: ChatMetadata = {
    model: row.model ?? undefined,
    modelLabel: modelLabelFor(row.model),
    thinkingSeconds: row.thinkingSeconds ?? undefined,
  };

  const stored = row.parts as CampusPart[] | null | undefined;
  if (stored && stored.length > 0) return { id, role: 'assistant', metadata, parts: stored };

  // Rows saved before parts existed: plain text, an optional place card hidden
  // in the text, and a separate list of source links.
  const parts: CampusPart[] = [{ type: 'text', text: stripNavTag(row.content) }];
  const place = parseNavTag(row.content);
  if (place) {
    parts.push({
      type: CAMPUS_LOOKUP_PART,
      toolCallId: `legacy-${id}`,
      state: 'output-available',
      input: { query: place.name },
      output: place,
    } as unknown as CampusPart);
  }
  // Saved citations carry their excerpt as `snippet` (older rows used `excerpt`).
  ((row.citations ?? []) as Array<{ url: string; title: string; snippet?: string | null; excerpt?: string | null }>).forEach((c, i) => {
    parts.push({
      type: 'source-url',
      sourceId: `legacy-${id}-${i}`,
      url: c.url,
      title: c.title,
      providerMetadata: { campusgpt: { snippet: c.snippet ?? c.excerpt ?? '' } },
    } as CampusPart);
  });
  return { id, role: 'assistant', metadata, parts };
}

/** All the text of a message, joined. */
export function messageText(message: CampusMessage): string {
  return message.parts.map((p) => (p.type === 'text' ? p.text : '')).join('');
}

export type LookupPart = {
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  output?: NavDestination | null;
};

export function isToolPart(part: CampusPart): boolean {
  return part.type.startsWith('tool-') || part.type === 'dynamic-tool';
}

/** The text of an error thrown by the chat request, without raw JSON. */
export function friendlyChatError(error: Error | undefined): string {
  const raw = error?.message?.trim() ?? '';
  if (!raw) return 'Something went wrong. Please try again.';
  try {
    const parsed = JSON.parse(raw) as { error?: unknown };
    if (typeof parsed.error === 'string') return parsed.error;
  } catch {
    /* not JSON — fall through */
  }
  if (/failed to fetch|networkerror|load failed/i.test(raw)) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  return raw.length > 200 ? 'Something went wrong. Please try again.' : raw;
}
