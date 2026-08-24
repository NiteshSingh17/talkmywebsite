import { startFirstSendPrefix } from './send-prefix';

/** Only the ChatGPT sidebar iframe leave a normal chatgpt.com tab alone. */
if (window !== window.top) {
  startFirstSendPrefix();
}
