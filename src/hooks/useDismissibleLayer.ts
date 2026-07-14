import { useEffect, type RefObject } from 'react';

interface UseDismissibleLayerOptions<TElement extends HTMLElement> {
  enabled: boolean;
  ref: RefObject<TElement | null>;
  onDismiss: () => void;
}

export const useDismissibleLayer = <TElement extends HTMLElement>({
  enabled,
  ref,
  onDismiss,
}: UseDismissibleLayerOptions<TElement>): void => {
  useEffect(() => {
    if (!enabled) return;

    const ownerDocument = ref.current?.ownerDocument ?? document;

    const handlePointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (ref.current?.contains(target)) return;

      onDismiss();
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    ownerDocument.addEventListener('pointerdown', handlePointerDown);
    ownerDocument.addEventListener('keydown', handleKeyDown);

    return () => {
      ownerDocument.removeEventListener('pointerdown', handlePointerDown);
      ownerDocument.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onDismiss, ref]);
};
