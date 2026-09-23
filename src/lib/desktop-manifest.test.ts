import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("desktop packaging for microphone access", () => {
  it("declares the microphone device capability required by WebView2", () => {
    const manifestPath = path.resolve(process.cwd(), "desktop/Package.appxmanifest");
    const manifest = fs.readFileSync(manifestPath, "utf8");

    expect(manifest).toContain('<DeviceCapability Name="microphone" />');
  });
});
