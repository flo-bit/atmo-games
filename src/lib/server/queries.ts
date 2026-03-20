/**
 * Read-only query functions for the SvelteKit frontend.
 */
import type { CanvasData } from "./types";

/** Canvas blob + cursor for initial page load. */
export async function getCanvas(
  kv: KVNamespace,
): Promise<CanvasData | null> {
  const result = await kv.getWithMetadata<{ cursor: string }>("canvas:latest", "arrayBuffer");

  if (!result.value) return null;

  // Prefer cursor from metadata (new format), fall back to legacy key
  let cursor = 0;
  if (result.metadata?.cursor) {
    cursor = parseInt(result.metadata.cursor, 10);
  } else {
    const legacyCursor = await kv.get("cursor:latest", "text");
    if (legacyCursor) cursor = parseInt(legacyCursor, 10);
  }

  return { canvas: result.value, cursor };
}
