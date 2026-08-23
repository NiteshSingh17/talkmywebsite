import { SELECTORS } from './selectors';

export function findComposer(): HTMLElement | null {
  const candidates: HTMLElement[] = [];

  const push = (el: Element | null) => {
    if (el instanceof HTMLElement) candidates.push(el);
  };

  for (const sel of SELECTORS.composer.split(',')) {
    push(document.querySelector(sel.trim()));
  }

  push(document.getElementById('prompt-textarea'));
  document.querySelectorAll('[contenteditable="true"]').forEach((el) => push(el));
  document.querySelectorAll('.ProseMirror').forEach((el) => push(el));

  const scored = candidates
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 40 && r.height > 16 && r.bottom > window.innerHeight * 0.4;
    })
    .sort((a, b) => b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom);

  return scored[0] ?? candidates[0] ?? null;
}

export function getComposerText(el: HTMLElement): string {
  if (el instanceof HTMLTextAreaElement) return el.value;
  return (el.innerText ?? el.textContent ?? '').trim();
}

function dispatchInput(el: HTMLElement, text: string): void {
  el.dispatchEvent(
    new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: text,
    }),
  );
  el.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      inputType: 'insertText',
      data: text,
    }),
  );
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

/** Insert text in a way React / ProseMirror recognizes. */
export function setComposerText(el: HTMLElement, text: string): void {
  el.focus();

  if (el instanceof HTMLTextAreaElement) {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    )?.set;
    setter?.call(el, text);
    dispatchInput(el, text);
    return;
  }

  try {
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    sel?.removeAllRanges();
    sel?.addRange(range);
    document.execCommand('insertText', false, text);
  } catch {
    /* fallback below */
  }

  if (!el.textContent?.includes(text.slice(0, Math.min(20, text.length)))) {
    try {
      const dt = new DataTransfer();
      dt.setData('text/plain', text);
      el.dispatchEvent(
        new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: dt,
        }),
      );
    } catch {
      el.textContent = text;
    }
  }

  dispatchInput(el, text);
}

export function findSendButton(): HTMLButtonElement | null {
  for (const sel of SELECTORS.sendButton.split(',')) {
    const btn = document.querySelector(sel.trim());
    if (btn instanceof HTMLButtonElement) return btn;
  }
  const buttons = document.querySelectorAll('button');
  for (const btn of buttons) {
    if (!(btn instanceof HTMLButtonElement)) continue;
    const label = (btn.getAttribute('aria-label') ?? btn.textContent ?? '').toLowerCase();
    if (label.includes('send') && !btn.disabled) return btn;
  }
  return null;
}

export function isSendButton(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const btn = target.closest('button');
  if (!btn) return false;
  const send = findSendButton();
  return send === btn || btn.matches(SELECTORS.sendButton);
}
