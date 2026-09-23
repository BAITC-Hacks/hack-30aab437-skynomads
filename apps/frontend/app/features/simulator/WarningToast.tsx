import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { TriangleAlert, X } from 'lucide-react';

export interface WarningNotice {
  id: number;
  message: string;
}

interface WarningToastProps {
  notice: WarningNotice | null;
  onDismiss: () => void;
  panel: string;
}

export const WarningToast = ({ notice, onDismiss, panel }: WarningToastProps) => {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    /* Native modal dialogs make the rest of the document inert. Host the toast inside it. */
    const frame = requestAnimationFrame(() => {
      setTarget(document.querySelector<HTMLDialogElement>('dialog[open]') ?? document.body);
    });
    return () => cancelAnimationFrame(frame);
  }, [panel, notice]);

  useEffect(() => {
    if (!notice || paused) return;
    const timer = window.setTimeout(onDismiss, 8000);
    return () => window.clearTimeout(timer);
  }, [notice, paused, onDismiss]);

  if (!notice || !target) return null;
  return createPortal(
    <aside className="warning-toast" aria-label="Предупреждение"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
      <TriangleAlert size={21} className="warning-toast__icon" aria-hidden="true" />
      <div role="status" aria-live="polite" aria-atomic="true"><strong>Внимание</strong><p>{notice.message}</p></div>
      <button type="button" onClick={onDismiss} aria-label="Закрыть предупреждение"><X size={17} /></button>
    </aside>, target,
  );
};
