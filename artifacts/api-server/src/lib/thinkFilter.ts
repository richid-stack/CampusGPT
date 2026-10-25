/** Strip Qwen <think>…</think> chain-of-thought from stream output.
 * The final few characters are held back to detect a split `<think>` tag,
 * so callers must flush the filter after the provider closes the stream.
 */
export function makeThinkFilter() {
  let buf = "";
  let inThink = false;
  function filter(delta: string): string {
    buf += delta;
    let out = "";
    while (true) {
      if (!inThink) {
        const start = buf.indexOf("<think>");
        if (start === -1) {
          const guard = Math.max(0, buf.length - 7);
          out += buf.slice(0, guard);
          buf = buf.slice(guard);
          break;
        }
        out += buf.slice(0, start);
        buf = buf.slice(start + 7);
        inThink = true;
      } else {
        const end = buf.indexOf("</think>");
        if (end === -1) {
          // Keep a possible partial "</think>" so a closing tag split across
          // chunks is still recognised; discard the reasoning before it.
          buf = buf.slice(Math.max(0, buf.length - 7));
          break;
        }
        buf = buf.slice(end + 8);
        inThink = false;
      }
    }
    return out;
  }
  function flush(): string {
    if (inThink) {
      buf = "";
      return "";
    }
    const out = buf;
    buf = "";
    return out;
  }
  return { filter, flush };
}
