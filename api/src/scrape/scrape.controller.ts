import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import { RoomsService } from '../rooms/rooms.service';
import { applyScrapeNoCacheHeaders, buildScrapeBody } from './scrape-cache';

/** Keep under ~15s so ngrok / ChatGPT browsing does not time out first */
const SCRAPE_TIMEOUT_MS = Number(process.env.SCRAPE_TIMEOUT_MS ?? 12000);
const MAX_HTML_BYTES = 2000000 * 1024 * 1024;

@Controller('scrape')
export class ScrapeController {
  constructor(private readonly rooms: RoomsService) {}

  /** Preferred: cache bust in path (proxies/Claude often ignore ?cb= query) */
  @Get(':roomId/:pageId/:secret/b/:clientBust')
  async scrapeWithPathBust(
    @Param('roomId') roomId: string,
    @Param('pageId') pageId: string,
    @Param('secret') secret: string,
    @Param('clientBust') clientBust: string,
    @Query('sidebar') sidebar: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    return this.handleScrape(roomId, pageId, secret, res, clientBust, isSidebarQuery(sidebar));
  }

  /** Token in path — survives better than ?t= when ChatGPT fetches URLs */
  @Get(':roomId/:pageId/:secret')
  async scrapeWithPathToken(
    @Param('roomId') roomId: string,
    @Param('pageId') pageId: string,
    @Param('secret') secret: string,
    @Query('cb') queryBust: string | undefined,
    @Query('sidebar') sidebar: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    return this.handleScrape(
      roomId,
      pageId,
      secret,
      res,
      queryBust,
      isSidebarQuery(sidebar),
    );
  }

  private async handleScrape(
    roomId: string,
    pageId: string,
    secret: string,
    res: Response,
    clientBust?: string,
    fromSidebar = false,
  ): Promise<void> {
    console.log("scrpe content ", roomId, pageId, secret, clientBust)
    if (!secret) {
      res
        .status(HttpStatus.UNAUTHORIZED)
        .type('text/plain')
        .send(
          'Webchat: missing access token. Copy a new scrape URL from the Webchat extension (token is in the URL path or ?t= query).',
        );
      return;
    }

    if (!this.rooms.validateSecret(roomId, secret)) {
      res
        .status(HttpStatus.UNAUTHORIZED)
        .type('text/plain')
        .send(
          `Webchat: invalid or expired access token for room ${roomId}.\n${this.rooms.getAuthHint(roomId)}`,
        );
      return;
    }

    if (!this.rooms.isExtensionOnline(roomId)) {
      res
        .status(HttpStatus.SERVICE_UNAVAILABLE)
        .type('text/plain')
        .send(
          'Webchat extension is offline. Open the extension popup, confirm green Connected, then copy a new scrape URL.\n' +
            this.rooms.getAuthHint(roomId),
        );
      return;
    }

    const page = this.rooms.getPage(roomId, pageId);
    if (!page) {
      res
        .status(424)
        .type('text/plain')
        .send(
          `Page not registered (${pageId}). Open the target site in your browser and copy a fresh Webchat URL from the extension.`,
        );
      return;
    }

    try {
      let html = await this.rooms.requestHtml(
        roomId,
        pageId,
        SCRAPE_TIMEOUT_MS,
        clientBust,
        fromSidebar,
      );

      if (html.includes('<!-- WEBCHAT_PAGE_NOT_OPEN -->')) {
        res
          .status(424)
          .type('text/plain')
          .send(
            `Target page is not open in the browser: ${page.url}. Open that tab or use the extension to open it, then try again.`,
          );
        return;
      }

      const bytes = Buffer.byteLength(html, 'utf8');
      if (bytes > MAX_HTML_BYTES) {
        html =
          html.slice(0, MAX_HTML_BYTES) + '\n<!-- truncated by Webchat API -->';
      }

      const scrapedAt = new Date().toISOString();
      const requestId = randomUUID();
      const body = buildScrapeBody(html, {
        requestId,
        scrapedAt,
        clientBust,
      });

      applyScrapeNoCacheHeaders(res, { requestId, scrapedAt, clientBust });
      console.log("body ");
      res.status(HttpStatus.OK).type('text/html; charset=utf-8').send(body);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to scrape page';
      if (message.includes('not open') || message.includes('WEBCHAT')) {
        res.status(424).type('text/plain').send(message);
        return;
      }
      res
        .status(HttpStatus.GATEWAY_TIMEOUT)
        .type('text/plain')
        .send(
          `${message}\n\nTip: Extension popup must show Connected, target tab must stay open, then copy a fresh scrape URL with a new /b/<timestamp> path.`,
        );
    }
  }
}

function isSidebarQuery(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}
