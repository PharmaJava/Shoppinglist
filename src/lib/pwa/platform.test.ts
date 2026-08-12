import { describe, expect, it } from "vitest";
import { detectPlatform, isInAppBrowser } from "./platform";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPAD_MODERNO =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
const MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

describe("detectPlatform", () => {
  it("reconoce el iPhone", () => {
    expect(detectPlatform(IPHONE)).toBe("ios");
  });

  // El caso que se escapa siempre: desde iPadOS 13 el iPad miente y dice ser
  // un Mac. Sin `maxTouchPoints` acabaríamos enseñándole instrucciones de
  // «pantalla de inicio» a quien está en un portátil.
  it("distingue el iPad moderno de un Mac por el táctil", () => {
    expect(detectPlatform(IPAD_MODERNO, 5)).toBe("ios");
    expect(detectPlatform(MAC, 0)).toBe("other");
    expect(detectPlatform(IPAD_MODERNO, 0)).toBe("other");
  });

  it("reconoce Android", () => {
    expect(detectPlatform(ANDROID)).toBe("android");
  });

  // Chrome en iOS sigue siendo WebKit y también instala desde su menú de
  // compartir, así que cuenta como iOS.
  it("Chrome y Firefox en iOS siguen siendo iOS", () => {
    expect(detectPlatform(`${IPHONE} CriOS/126.0`)).toBe("ios");
    expect(detectPlatform(`${IPHONE} FxiOS/126.0`)).toBe("ios");
  });
});

describe("isInAppBrowser", () => {
  it.each([
    ["Instagram", `${IPHONE} Instagram 300.0.0.0`],
    ["Facebook", `${IPHONE} [FBAN/FBIOS;FBAV/450.0]`],
    ["TikTok", `${ANDROID} musical_ly_30.0.0 TikTok`],
  ])("detecta el navegador incrustado de %s", (_nombre, ua) => {
    expect(isInAppBrowser(ua)).toBe(true);
  });

  it("un navegador de verdad no lo es", () => {
    expect(isInAppBrowser(IPHONE)).toBe(false);
    expect(isInAppBrowser(ANDROID)).toBe(false);
  });
});
