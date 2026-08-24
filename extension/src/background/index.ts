import { whenReady } from './boot';
import { listenRuntimeMessages, prepareSidepanel } from './extension-messages';
import { watchTabRemoval } from './page-registration';

// Alt+Shift+W opens the side panel directly (bypasses the popup)
chrome.commands.onCommand.addListener((command) => {
  if (command !== 'open-sidebar') return;
  void (async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url?.startsWith('http')) return;
    await whenReady();
    await prepareSidepanel(tab.id);
    await chrome.sidePanel.open({ tabId: tab.id });
  })();
});

// Chrome event listeners must be registered synchronously at worker startup
listenRuntimeMessages();
watchTabRemoval();

void whenReady();
