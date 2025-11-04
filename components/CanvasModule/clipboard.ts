// export type ClipboardPayload<S> = {
//   kind: "shapes-v1";
//   createdAt: number;
//   anchor: { x: number; y: number }; // top-left of copied bbox
//   shapes: S[]; // full shape objects
// };

// const LOCAL_KEY = "__canvas_clipboard__";

// export async function writeClipboard(payload: ClipboardPayload<any>) {
//   const text = JSON.stringify(payload);
//   try {
//     const item = new ClipboardItem({
//       "text/plain": new Blob([text], { type: "text/plain" }),
//     } as any);
//     await (navigator.clipboard as any).write([item]);
//   } catch {}
//   try {
//     localStorage.setItem(LOCAL_KEY, text);
//   } catch {}
// }

// export async function readClipboard<
//   T = ClipboardPayload<any>
// >(): Promise<T | null> {
//   try {
//     const txt = await navigator.clipboard.readText();
//     const data = JSON.parse(txt);
//     if (data?.kind === "shapes-v1") return data as T;
//   } catch {}
//   try {
//     const txt = localStorage.getItem(LOCAL_KEY);
//     if (!txt) return null;
//     const data = JSON.parse(txt);
//     if (data?.kind === "shapes-v1") return data as T;
//   } catch {}
//   return null;
// }

// --- types ----------------------------------------------------
export type ShapesClipboardPayload<S = any> = {
  kind: "shapes-v1";
  createdAt: number;
  anchor: { x: number; y: number }; // top-left of copied bbox (world coords)
  shapes: S[]; // full shape objects (top-level shapes)
};

export type ScreenChildrenClipboardPayload<C = any, G = any> = {
  kind: "screen-children-v1";
  createdAt: number;
  screenId: string; // source screen id
  anchor: { x: number; y: number }; // top-left in *local screen coords*
  children: C[]; // child shapes (screen.children items)
  groups?: G[]; // minimal group subtree that owns the children
};

// Union of allowable payloads
export type AnyClipboardPayload =
  | ShapesClipboardPayload
  | ScreenChildrenClipboardPayload;

// --- impl -----------------------------------------------------
const LOCAL_KEY = "__canvas_clipboard__";

export async function writeClipboard(payload: AnyClipboardPayload) {
  const text = JSON.stringify(payload);
  try {
    const item = new ClipboardItem({
      "text/plain": new Blob([text], { type: "text/plain" }),
    } as any);
    await (navigator.clipboard as any).write([item]);
  } catch {}
  try {
    localStorage.setItem(LOCAL_KEY, text);
  } catch {}
}

export async function readClipboard<
  T = AnyClipboardPayload
>(): Promise<T | null> {
  // Helper: validate kind
  const isAllowed = (data: any) =>
    data?.kind === "shapes-v1" || data?.kind === "screen-children-v1";

  try {
    const txt = await navigator.clipboard.readText();
    const data = JSON.parse(txt);
    if (isAllowed(data)) return data as T;
  } catch {}
  try {
    const txt = localStorage.getItem(LOCAL_KEY);
    if (!txt) return null;
    const data = JSON.parse(txt);
    if (isAllowed(data)) return data as T;
  } catch {}
  return null;
}
