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
/** True until the user has sent at least one message in this ChatGPT session. */
let isFirstMessage = true;

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

  if (isFirstMessage) {
    // Full system prompt + scrape URL
    setComposerText(composer, `${prefix}\n\nUser question: ${userQuestion}`);
  } else {
    // Only a short re-fetch hint keep follow-up messages clean
    // Extract the real scrape URL from the "Scrape URL: ..." line at the end of the prefix
    const urlMatch = prefix.match(/^Scrape URL:\s*(https?:\/\/\S+)/m);
    const refreshLine = urlMatch
      ? `[Re-read current page before answering: ${urlMatch[1]}]`
      : `[${prefix}]`;
    setComposerText(composer, `${refreshLine}\n\n${userQuestion}`);
  }

  await new Promise((r) => setTimeout(r, 250));
  return true;
}

async function handleSend(): Promise<void> {
  rewriting = true;
  try {
    await prefixComposer();
    isFirstMessage = false;

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
  if (rewriting) return;
  if (!isSendButton(e.target)) return;

  e.preventDefault();
  e.stopImmediatePropagation();
  void handleSend();
}

function onKeydownCapture(e: KeyboardEvent): void {
  if (rewriting) return;
  if (e.key !== 'Enter' || e.shiftKey) return;

  const composer = findComposer();
  if (!composer) return;
  const target = e.target as Node | null;
  if (!target || (!composer.contains(target) && target !== composer)) return;

  e.preventDefault();
  e.stopImmediatePropagation();
  void handleSend();
}

export function startFirstSendPrefix(): void {
  document.addEventListener('click', onClickCapture, true);
  document.addEventListener('keydown', onKeydownCapture, true);
}
