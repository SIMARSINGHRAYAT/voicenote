import { describe, expect, it } from "vitest";
import {
  appendCommittedTranscript,
  applySpokenPunctuation,
  buildExportPayload,
  formatDuration,
  normalizeTranscript,
} from "@/lib/transcript";

describe("transcript utilities", () => {
  it("normalizes whitespace safely", () => {
    expect(normalizeTranscript("  hello   world \n  there  ")).toBe("hello world there");
  });

  it("appends committed segments without losing previous text", () => {
    expect(appendCommittedTranscript("Hello", "world")).toBe("Hello world");
    expect(appendCommittedTranscript("Hello ", " world")).toBe("Hello world");
  });

  it("capitalizes sentence continuation after full stop", () => {
    expect(appendCommittedTranscript("this is one.", "next sentence")).toBe("this is one. Next sentence");
    expect(appendCommittedTranscript("Ends here!", "another thought")).toBe("Ends here! Another thought");
  });

  it("does not append empty strings", () => {
    expect(appendCommittedTranscript("Hello", "   ")).toBe("Hello");
  });

  it("converts spoken punctuation words to symbols", () => {
    expect(applySpokenPunctuation("hello comma world full stop")).toBe("hello, world.");
    expect(applySpokenPunctuation("this is single quote nice single quote")).toBe("this is 'nice'");
    expect(applySpokenPunctuation("say double cute hello double cute colon done")).toBe('say "hello": done');
  });

  it("formats duration in mm:ss", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(65_000)).toBe("01:05");
  });

  it("builds stable JSON export payload", () => {
    const payload = buildExportPayload({
      id: "abc",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:01:00.000Z",
      language: "en-US",
      status: "ready",
      transcript: "Hello world",
      durationMs: 60_000,
    });

    expect(JSON.parse(payload)).toMatchObject({
      id: "abc",
      language: "en-US",
      transcript: "Hello world",
      durationMs: 60_000,
    });
  });
});