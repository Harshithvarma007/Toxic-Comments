/**
 * Shared Google Fonts loader for the whole render project, backing the three families named by
 * tokens.css (--font-display, --font-body, --font-mono). Plain CSS `@import` is not reliable
 * inside Remotion's headless-Chrome render pipeline — `@remotion/google-fonts`'s `loadFont()`
 * injects the actual `@font-face` and its promise resolves only once the font data is fetched,
 * so awaiting `fontsReady` before rendering text guarantees the fonts are present instead of
 * racing a fallback system font onto the frame.
 *
 * Note: each package's *registered* family name doesn't always match the CSS string in
 * tokens.css (e.g. the `SourceSans3` module registers as "Source Sans Three") — tokens.css lists
 * the registered name first in each font-family stack so the loaded webfont is actually what
 * resolves, not a fallback.
 */
import { loadFont as loadArchivo } from "@remotion/google-fonts/Archivo";
import { loadFont as loadSourceSansThree } from "@remotion/google-fonts/SourceSans3";
import { loadFont as loadSourceCodePro } from "@remotion/google-fonts/SourceCodePro";

const archivo = loadArchivo("normal", { weights: ["400", "600", "700", "800"] });
const sourceSansThree = loadSourceSansThree("normal", { weights: ["400", "600"] });
const sourceCodePro = loadSourceCodePro("normal", { weights: ["400", "500"] });

/** Resolves once every family used by the render project has finished loading. Await this before
 * a `<Composition/>` that renders text is captured (e.g. inside a `delayRender`/`continueRender`
 * pair, or simply awaited at module scope in a still/render script). */
export const fontsReady: Promise<unknown> = Promise.all([
  archivo.waitUntilDone(),
  sourceSansThree.waitUntilDone(),
  sourceCodePro.waitUntilDone(),
]);
