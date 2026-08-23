import { MSG } from '@src/shared/protocol';
import {
  findComposer,
  findSendButton,
  getComposerText,
  isSendButton,
  setComposerText,
} from './composer';

/** Skip our own re-click / re-Enter after rewriting the composer. */
let rewriting = false;

function hasUserMessage(): boolean {
  return !!document.querySelector('[data-message-author-role="user"]');
}

async function prefixComposer(): Promise<boolean> {
  const composer = findComposer();
  if (!composer) return false;

  const userQuestion = getComposerText(composer);
  if (!userQuestion) return false;

  let prefix = '';
  try {
    const res = await chrome.runtime.sendMessage({ type: MSG.GET_INITIAL_PREFIX });
    if (res?.error || !res?.prefix) return false;
    prefix = res.prefix as string;
  } catch {
    return false;
  }

  setComposerText(composer, `${prefix}\n\nUser question: ${userQuestion}`);
  await new Promise((r) => setTimeout(r, 250));
  return true;
}

async function handleFirstSend(): Promise<void> {
  rewriting = true;
  try {
    await prefixComposer();

    const btn = findSendButton();
    if (btn && !btn.disabled) {
      btn.click();
      return;
    }

    const composer = findComposer();
    composer?.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
      }),
    );
  } finally {
    rewriting = false;
  }
}

function onClickCapture(e: MouseEvent): void {
  if (rewriting || hasUserMessage()) return;
  if (!isSendButton(e.target)) return;

  e.preventDefault();
  e.stopImmediatePropagation();
  void handleFirstSend();
}

function onKeydownCapture(e: KeyboardEvent): void {
  if (rewriting || hasUserMessage()) return;
  if (e.key !== 'Enter' || e.shiftKey) return;

  const composer = findComposer();
  if (!composer) return;
  const target = e.target as Node | null;
  if (!target || (!composer.contains(target) && target !== composer)) return;

  e.preventDefault();
  e.stopImmediatePropagation();
  void handleFirstSend();
}

export function startFirstSendPrefix(): void {
  document.addEventListener('click', onClickCapture, true);
  document.addEventListener('keydown', onKeydownCapture, true);
}
