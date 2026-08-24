export type LivePageSnapshot = { url: string; title: string; html: string };

/**
 * Run the DOM cleaner inside the page (MAIN world) and return its
 * url/title/cleaned body HTML, or null when the tab is restricted.
 */
export async function readLivePage(tabId: number): Promise<LivePageSnapshot | null> {
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: () => {
        function stripHtml(body: HTMLElement): string {
          // Clone so original DOM is untouched
          const root = body.cloneNode(true) as HTMLElement;

          // Map cloned elements to original elements
          const originalElements = [body, ...Array.from(body.querySelectorAll('*'))];
          const clonedElements = [root, ...Array.from(root.querySelectorAll('*'))];

          const originalMap = new Map<Element, Element>();

          clonedElements.forEach((clone, index) => {
            originalMap.set(clone, originalElements[index]);
          });

          // Remove comments
          const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_COMMENT
          );

          const comments: Comment[] = [];

          while (walker.nextNode()) {
            comments.push(walker.currentNode as Comment);
          }

          comments.forEach(comment => comment.remove());

          // Remove useless container elements entirely
          root.querySelectorAll(
            'meta, head, template, svg, canvas, iframe, object, embed'
          ).forEach(el => el.remove());

          // Empty script/style/noscript contents but keep tags
          root.querySelectorAll(
            'script, style, noscript'
          ).forEach(el => {
            el.textContent = '';
          });

          // Process cloned elements only
          root.querySelectorAll('*').forEach(el => {
            // Use ORIGINAL element for computed styles
            const originalEl = originalMap.get(el) || el;

            const computed = window.getComputedStyle(originalEl);

            const hidden =
              computed.display === 'none' ||
              computed.visibility === 'hidden' ||
              computed.opacity === '0' ||
              originalEl.hasAttribute('hidden') ||
              originalEl.getAttribute('aria-hidden') === 'true';

            // Remove hidden elements from CLONE only
            if (hidden) {
              el.remove();
              return;
            }

            // Remove inline handlers/styles from CLONE only
            [...el.attributes].forEach(attr => {
              if (
                attr.name.startsWith('on') ||
                attr.name === 'style'
              ) {
                el.removeAttribute(attr.name);
              }
            });

            // Detect clickable elements from ORIGINAL
            const tag = originalEl.tagName.toLowerCase();

            const clickable =
              tag === 'button';

            // Mutate CLONE only
            if (clickable) {
              el.setAttribute(
                'data-chatweb-clickable',
                'true'
              );
            }
          });

          return root.outerHTML;
        }
        const url = location.href;
        const title = document.title;
        const html = stripHtml(document.body);
        return { url, title, html };
      },
    });
    if (
      result &&
      typeof result === 'object' &&
      'html' in result &&
      typeof (result as LivePageSnapshot).html === 'string'
    ) {
      return result as LivePageSnapshot;
    }
  } catch {
    /* restricted or no access */
  }
  return null;
}
