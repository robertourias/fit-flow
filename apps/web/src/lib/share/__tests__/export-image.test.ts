/**
 * @jest-environment jsdom
 */
import { toBlob } from "html-to-image";

import { exportNodeToPngBlob, shareOrDownloadImage } from "../export-image";

jest.mock("html-to-image", () => ({
  toBlob: jest.fn(),
}));

const mockToBlob = toBlob as jest.Mock;

describe("exportNodeToPngBlob", () => {
  let fontsReadyResolved: boolean;
  let resolveFontsReady: () => void;

  beforeEach(() => {
    jest.clearAllMocks();
    fontsReadyResolved = false;

    const fontsReady = new Promise<FontFaceSet>((resolve) => {
      resolveFontsReady = () => {
        fontsReadyResolved = true;
        resolve({} as FontFaceSet);
      };
    });

    Object.defineProperty(document, "fonts", {
      value: { ready: fontsReady },
      configurable: true,
    });
  });

  it("awaits document.fonts.ready before capturing", async () => {
    mockToBlob.mockImplementation(async () => {
      expect(fontsReadyResolved).toBe(true);
      return new Blob(["png"], { type: "image/png" });
    });

    const node = document.createElement("div");
    resolveFontsReady();

    await exportNodeToPngBlob(node);

    expect(mockToBlob).toHaveBeenCalledTimes(1);
  });

  it("calls toBlob with pixelRatio: 2", async () => {
    const blob = new Blob(["png"], { type: "image/png" });
    mockToBlob.mockResolvedValue(blob);

    const node = document.createElement("div");
    resolveFontsReady();

    await exportNodeToPngBlob(node);

    expect(mockToBlob).toHaveBeenCalledWith(node, { pixelRatio: 2 });
  });

  it("throws when toBlob resolves null", async () => {
    mockToBlob.mockResolvedValue(null);

    const node = document.createElement("div");
    resolveFontsReady();

    await expect(exportNodeToPngBlob(node)).rejects.toThrow("Failed to export image");
  });
});

describe("shareOrDownloadImage", () => {
  const blob = new Blob(["png"], { type: "image/png" });
  const filename = "treino-exemplo.png";

  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => "blob:mock");
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "canShare", { value: undefined, configurable: true });
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
  });

  it("uses Web Share API and returns 'shared' when canShare is true", async () => {
    const shareMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "canShare", { value: jest.fn(() => true), configurable: true });
    Object.defineProperty(navigator, "share", { value: shareMock, configurable: true });

    const result = await shareOrDownloadImage(blob, filename);

    expect(navigator.canShare).toHaveBeenCalledWith({ files: [expect.any(File)] });
    expect(shareMock).toHaveBeenCalledWith({
      files: [expect.any(File)],
      title: filename,
    });
    expect(result).toBe("shared");
  });

  it("falls back to anchor download when canShare is unavailable", async () => {
    Object.defineProperty(navigator, "canShare", { value: undefined, configurable: true });

    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const result = await shareOrDownloadImage(blob, filename);

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    expect(result).toBe("downloaded");

    clickSpy.mockRestore();
  });

  it("falls back to anchor download when canShare returns false", async () => {
    Object.defineProperty(navigator, "canShare", { value: jest.fn(() => false), configurable: true });

    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const result = await shareOrDownloadImage(blob, filename);

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(result).toBe("downloaded");

    clickSpy.mockRestore();
  });
});
