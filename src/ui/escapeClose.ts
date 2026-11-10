type Listenable = {
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
};

export function isEscapeKey(e: { key?: string }): boolean {
  return e.key === 'Escape';
}

/** Close a popover/sheet when Escape is pressed. */
export function bindEscapeClose(target: Listenable | null | undefined, onClose: () => void): () => void {
  if (!target) return () => undefined;
  const onKey: EventListener = (e) => {
    if (!isEscapeKey(e as unknown as { key?: string })) return;
    const ke = e as unknown as { preventDefault?: () => void };
    ke.preventDefault?.();
    onClose();
  };
  target.addEventListener('keydown', onKey);
  return () => target.removeEventListener('keydown', onKey);
}

type NodeLike = { contains: (node: Node | null) => boolean };

/** Close when a pointer lands outside `root`. */
export function bindOutsidePointerClose(
  root: NodeLike | null | undefined,
  target: Listenable | null | undefined,
  onClose: () => void
): () => void {
  if (!target) return () => undefined;
  const onPointer: EventListener = (e) => {
    const node = e.target as Node | null;
    if (root && node && root.contains(node)) return;
    onClose();
  };
  target.addEventListener('pointerdown', onPointer);
  return () => target.removeEventListener('pointerdown', onPointer);
}
