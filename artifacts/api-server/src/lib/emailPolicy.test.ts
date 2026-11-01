import { describe, expect, it } from "vitest";
import { isAllowedEmail, parseAllowedDomains } from "./emailPolicy.js";

const allowed = parseAllowedDomains("st.ug.edu.gh, @UG.edu.gh");

describe("parseAllowedDomains", () => {
  it("trims, lowercases, strips @ and drops empties", () => {
    expect(allowed).toEqual(["st.ug.edu.gh", "ug.edu.gh"]);
    expect(parseAllowedDomains(undefined)).toEqual([]);
    expect(parseAllowedDomains(" , ")).toEqual([]);
  });
});

describe("isAllowedEmail", () => {
  it("accepts allowed domains, case-insensitively", () => {
    expect(isAllowedEmail("abc123@st.ug.edu.gh", allowed)).toBe(true);
    expect(isAllowedEmail("ABC123@ST.UG.EDU.GH", allowed)).toBe(true);
    expect(isAllowedEmail("staff@ug.edu.gh", allowed)).toBe(true);
  });

  it("rejects look-alike and other domains", () => {
    expect(isAllowedEmail("a@evil-st.ug.edu.gh", allowed)).toBe(false);
    expect(isAllowedEmail("a@st.ug.edu.gh.evil.com", allowed)).toBe(false);
    expect(isAllowedEmail("a@gmail.com", allowed)).toBe(false);
    expect(isAllowedEmail("a@sub.st.ug.edu.gh", allowed)).toBe(false);
  });

  it("rejects malformed addresses", () => {
    expect(isAllowedEmail("no-at-sign", allowed)).toBe(false);
    expect(isAllowedEmail("@st.ug.edu.gh", allowed)).toBe(false);
  });

  it("allows everything when no domains are configured", () => {
    expect(isAllowedEmail("anyone@gmail.com", [])).toBe(true);
  });
});
