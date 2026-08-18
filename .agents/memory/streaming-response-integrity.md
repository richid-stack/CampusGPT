---
name: Streaming Response Integrity
description: The end-of-stream contract for CampusGPT's streamed AI responses
---

Any response-stream filter that holds a safety/tag-detection buffer must expose an explicit flush step and emit that tail before persisting the assistant message or closing SSE.

**Why:** A buffered tail was never emitted, making every assistant response appear cut short even though the provider had completed normally.

**How to apply:** When changing model stream filtering or SSE parsing, test the final event and verify the persisted assistant content exactly matches the provider output after filtering.