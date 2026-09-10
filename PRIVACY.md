# Privacy Policy

**Effective Date:** September 10, 2026

This Privacy Policy describes how TalkMyWebsite ("we", "our", "us") collects, uses, stores, and shares information in connection with the Chrome extension **TalkMyWebsite – Free** (the "Extension"). By installing and using the Extension, you agree to the practices described in this policy.

## 1. Overview

TalkMyWebsite – Free is a browser extension that lets you chat with private and authenticated web pages (such as LinkedIn, Gmail, Twitter, and other sites) using ChatGPT. When you use the Extension, the content of the page you are viewing may be made available to ChatGPT so it can answer questions about that page.

This policy explains what data the Extension accesses, how that data is used, how it is stored and retained, and with whom it is shared. Every section of this policy is required by the Chrome Web Store Developer Program Policies and is provided in full.

## 2. What Data We Collect

The Extension collects and processes the following categories of data:

### 2.1 Scraped Page Content

When you choose to use the Extension on a page, the Extension captures the visible content of your currently active browser tab in order to let ChatGPT answer questions about it. This captured content may include:

- The fully rendered HTML content of the active page (including text, links, buttons, and other visible page elements). Content that is hidden, non-visual, or embedded (such as scripts, styles, iframes, canvases, SVGs, metadata, and comments) is removed before transmission.
- The page URL (`location.href`).
- The page title (`document.title`).

This capture is performed **only when you initiate it** by opening the Extension's side panel (via the popup button or the keyboard shortcut `Alt+Shift+W`) and sending a message to ChatGPT. The Extension does not capture page content in the background or without your action.

### 2.2 Identifiers and Connection Data

The Extension generates and stores a small set of identifiers used to operate and secure the connection between the Extension and its companion API server:

- A unique room identifier (`roomId`), generated automatically as a UUID on first run.
- A room secret (`roomSecret`), generated automatically as a UUID on first run, used to authenticate communication with the API server.
- A registry of tracked browser tabs/pages, which includes, for each page you engage with: a generated page ID, the Chrome tab ID, the page URL, the page title, and the hostname.

These identifiers exist solely to route, authenticate, and track sessions between the Extension, the API server, and an active chat session.

### 2.3 What We Do NOT Collect

The Extension does **not** collect, access, or process any of the following:

- Search history or browsing history (beyond the momentary page you choose to engage with).
- Cookies, `localStorage`, `sessionStorage`, or IndexedDB data.
- Personally identifying information such as your name, email address (unless it is visibly part of content you choose to chat about), phone number, or government identifiers.
- Passwords, credentials, or payment card data (unless such data is visibly rendered on the page you choose to chat about, in which case it is part of the page content described in Section 2.1).
- Location data, calling data, or contact database contents.
- Keyboard input, except for the message you type in the ChatGPT interface.
- Audio, video, or camera data.

## 3. How We Use the Data

The data described in Section 2 is used exclusively for the following purposes:

- To provide the core functionality of the Extension: capturing your chosen page's content and transmitting it to ChatGPT so that ChatGPT can understand and answer questions about that page.
- To establish and maintain the authenticated connection between the Extension and our API server.
- To route and fulfill requests between the Extension, the API server, and ChatGPT.
- To maintain, improve, and troubleshoot the Extension's functionality and reliability.

We do **not** use the data for advertising, marketing, profiling, or any purpose unrelated to the Extension's functionality. The Extension contains **no analytics, telemetry, tracking, or advertising** technologies of any kind.

## 4. Data Storage and Retention

### 4.1 Local Storage

The Extension stores data only in your browser's own storage area, specifically `chrome.storage.local`. Stored items are limited to:

- The `roomId` and `roomSecret` identifiers.
- The registry of actively tracked pages (`webchat_pages`), which exists only while pages are being used in a chat session.

No page content is persistently stored locally. Captured page content exists only in memory for the duration of the request and is not written to disk by the Extension.

### 4.2 Retention

- **Local data:** Identifiers and the page registry are retained on your device only for as long as you keep the Extension installed. They are deleted automatically when you uninstall the Extension or clear the Extension's data from Chrome's settings.
- **Server data:** The Extension itself does not store your page content or personal data on its own servers. Scraped page content is passed through momentarily so it can be delivered to ChatGPT, and our API server does not retain scraped page content beyond what is necessary to fulfill the request. If you have questions about data handled by our API server, contact us at the address in Section 10.

### 4.3 Deletion

You can delete all locally stored Extension data at any time by:

- Uninstalling the Extension from Chrome, or
- Removing the Extension's data via `chrome://settings` → Extensions → TalkMyWebsite – Free → Remove, or via the Extension details page ("Clear data").

## 5. Data Sharing and Disclosure

The Extension shares data only in the specific ways required to operate, and never sells or rents your data. Named recipients are:

### 5.1 OpenAI (ChatGPT)

When you use the Extension, the captured page content (as described in Section 2.1) is presented to ChatGPT, operated by OpenAI, so that ChatGPT can answer your questions about the page. Your interaction with ChatGPT is subject to OpenAI's own privacy policy and terms of service. When you use ChatGPT in a side panel, you may be directed through the Extension to ChatGPT in a temporary (non-persistent) chat mode.

### 5.2 TalkMyWebsite API Server

The Extension communicates with our own API server (`talkmywebsite.bitsmall.in`) over a secure WebSocket connection to coordinate chat sessions and content delivery between the Extension and ChatGPT. Communication with this server includes the identifiers described in Section 2.2 and the page content you choose to share.

### 5.3 Parties With Whom We Do NOT Share Data

We do **not** share your data with:

- Advertising networks, ad exchanges, or measurement partners.
- Data brokers or analytics providers.
- Government authorities (except as required by law).
- Any other third party, except as described above or as required to comply with applicable law, protect rights and safety, or respond to lawful requests.

## 6. Security

We take reasonable measures to help protect the data handled by the Extension:

- All network communication between the Extension and our API server uses secure, encrypted connections (WSS/HTTPS).
- Communication between the Extension and the API server is authenticated using the per-installation `roomSecret`, which acts as a bearer token.
- The Extension follows Manifest V3 best practices, including a restrictive Content Security Policy and no remote code execution.
- The Extension requests only the minimum host permissions (`http://*/*` and `https://*/*`) needed to read the content of the page you actively choose to chat about.

No method of transmission or storage is 100% secure. Because the Extension enables ChatGPT to read page content that may include sensitive information, you should use it only on pages you are comfortable sharing with ChatGPT and OpenAI.

## 7. Your Choices and Controls

- **Opt-in operation:** The Extension only captures page content when you actively open the side panel and use the Extension on a page. Uninstalling the Extension, or simply not using it, means no page content is captured.
- **You choose the page:** Only the active tab you engage with is captured; we do not capture background tabs or other pages.
- **Temporary chats:** The Extension loads ChatGPT in a temporary chat mode, which is designed not to persist your conversation history.
- **Reviewing Chrome permissions:** You can review or revoke the Extension's permissions at any time via `chrome://settings` → Extensions → TalkMyWebsite – Free.
- **Deleting data:** See Section 4.3 for how to delete all locally stored Extension data.

## 8. Children's Privacy

The Extension is not directed to, and is not intended for, children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us at the address in Section 10 so we can take appropriate action.

## 9. Changes to This Privacy Policy

We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or the Extension's functionality. When we make material changes, we will update the "Effective Date" at the top of this policy and, where appropriate, post a notice within the Chrome Web Store listing. We encourage you to review this policy periodically.

## 10. Contact Us

If you have questions, concerns, or requests regarding this Privacy Policy or how the Extension handles data, you can contact us at:

**TalkMyWebsite**
Email: info@bitsmall.in

We will make reasonable efforts to respond to your inquiry in a timely manner.