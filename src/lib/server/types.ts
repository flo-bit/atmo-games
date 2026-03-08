/** Shared types for the atplace AT Protocol backend and SvelteKit frontend. */

/** Canvas data returned to the frontend. */
export interface CanvasData {
  canvas: ArrayBuffer;
  cursor: number;
}

/** A pixel placement event from Jetstream. */
export interface PixelEvent {
  did: string;
  x: number;
  y: number;
  color: number;
  time_us: number;
  operation: "create" | "update" | "delete";
}
