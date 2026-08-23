import { MSG, STORAGE_KEYS } from '@src/shared/protocol';

const frame = document.getElementById('chatgpt-frame') as HTMLIFrameElement;
const loading = document.getElementById('loading') as HTMLDivElement;
const loadingText = document.getElementById('loading-text') as HTMLSpanElement;
const pageTitle = document.getElementById('page-title') as HTMLSpanElement;
const statusDot = document.getElementById('status-dot') as HTMLSpanElement;

/** Poll API connection status and update the dot */
async function pollStatus(): Promise<void> {
  try {
    const res = await chrome.runtime.sendMessage({ type: MSG.GET_STATUS });
    if (res?.connected) {
      statusDot.className = 'online';
      statusDot.title = 'API connected';
    } else {
      statusDot.className = '';
      statusDot.title = 'API disconnected';
    }
  } catch {
    statusDot.className = '';
  }
}

/** Hide the loading overlay once the iframe has content */
frame.addEventListener('load', () => {
  loading.classList.add('hidden');
});

/** Build the ChatGPT URL, embedding the first message via the ?q= param */
async function boot(): Promise<void> {
  void pollStatus();
  setInterval(() => void pollStatus(), 5000);

    loadingText.textContent = 'Opening ChatGPT…';
    pageTitle.textContent = 'ChatGPT Sidebar';
    frame.src = 'https://chatgpt.com/';
}

void boot();
