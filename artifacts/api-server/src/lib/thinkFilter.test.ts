import { describe, expect, it } from "vitest";
import { makeThinkFilter } from "./thinkFilter.js";

function run(chunks: string[]): string {
  const f = makeThinkFilter();
  return chunks.map((c) => f.filter(c)).join("") + f.flush();
}

describe("makeThinkFilter", () => {
  it("passes plain text through, including the held-back tail on flush", () => {
    expect(run(["Hello ", "world"])).toBe("Hello world");
  });

  it("strips a complete think block", () => {
    expect(run(["<think>secret</think>Answer"])).toBe("Answer");
  });

  it("strips a think block split across chunks", () => {
    expect(run(["Hi <thi", "nk>hidden rea", "soning</th", "ink> there"])).toBe("Hi  there");
  });

  it("drops an unterminated think block on flush", () => {
    expect(run(["Before<think>never closed"])).toBe("Before");
  });

  it("does not lose a short reply (tail must be flushed)", () => {
    expect(run(["ok"])).toBe("ok");
  });
});
