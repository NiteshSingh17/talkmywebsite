/** ChatGPT DOM selectors update when UI changes */
export const SELECTORS = {
  composer:
    '#prompt-textarea, div#prompt-textarea[contenteditable="true"], textarea[data-id="root"], div[contenteditable="true"].ProseMirror, form textarea',
  sendButton:
    'button[data-testid="send-button"], button[data-testid="composer-send-button"], button[aria-label="Send prompt"], button[aria-label="Send"], form button[type="submit"]',
} as const;
