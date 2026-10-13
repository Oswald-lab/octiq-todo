import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

type ConfirmDialogProps = {
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly cancelLabel?: string;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

/**
 * Minimal destructive-action confirmation. Portaled, closes on Escape and
 * backdrop click, restores focus to the control that opened it.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancelRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const first = cancelRef.current;
      const last = confirmRef.current;
      if (!first || !last) return;
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || active === document.body) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-popover p-6 text-popover-foreground"
      >
        <h2 id="confirm-dialog-title" className="text-xl font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-medium text-foreground transition-opacity hover:bg-muted"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="inline-flex h-11 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
