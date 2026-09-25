import util from '../util';

import type { Readable } from 'stream';
import type { ServerResponse } from 'http';
import type { Request } from '../../types/types';

/**
 * The event's OWN HTTP request (`req._.req`, set by the protocol adapter), if any.
 * @param req The event's request.
 * @returns The HTTP request the event was dispatched from, or `undefined` for a nested `srv.send`.
 */
const ownHttpRequestOf = (req: Request): unknown => (req as unknown as { _?: { req?: unknown } })._?.req;

/**
 * Utility object for handling `@Stream` streaming operations (`@sap/cds` 10 streaming reads).
 */
const streamUtil = {
  /**
   * Duck-type check whether a value is a `Readable` stream (an object exposing a `.pipe` function).
   * @param value The value to check.
   * @returns True if the value is a readable stream, otherwise false.
   */
  isReadableStream(value: unknown): value is Readable {
    return (
      !util.lodash.isNil(value) && typeof value === 'object' && typeof (value as { pipe?: unknown }).pipe === 'function'
    );
  },

  /**
   * Checks whether `req` was dispatched straight from the ROOT HTTP request (not a `$batch` part, not a nested
   * `srv.send`).
   *
   * Every request inherits the root `req.http` from `cds.context`, but only the root event's OWN HTTP request
   * (`req._.req`, set by the protocol adapter) is that same request: a `$batch` part owns its sub-request, and
   * a nested `srv.send` owns none.
   * @param req The event's request.
   * @returns True if the request is the root HTTP request, otherwise false.
   */
  isRootHttpRequest(req: Request): boolean {
    const ownHttpRequest = ownHttpRequestOf(req);

    return !util.lodash.isNil(ownHttpRequest) && ownHttpRequest === req.http?.req;
  },

  /**
   * Checks whether `req` was dispatched from an OData `$batch` part: it owns an HTTP (sub-)request that
   * differs from the root HTTP request, AND that root HTTP request itself targets `$batch`.
   *
   * A nested `srv.send` inherits the root's `req.http` but owns no HTTP request of its own, so the first
   * conjunct alone already excludes it. A programmatic dispatch with no root HTTP request at all (e.g.
   * inside `cds.spawn`, or a test calling `srv.dispatch(...)` directly) is excluded the same way. Neither
   * counts as a `$batch` part on its own, and an own request whose root targets something other than
   * `$batch` is excluded by the last conjunct.
   * @param req The event's request.
   * @returns True if the request is a `$batch` part, otherwise false.
   */
  isBatchPart(req: Request): boolean {
    const ownHttpRequest = ownHttpRequestOf(req);
    const rootHttpRequest = req.http?.req;

    return (
      !util.lodash.isNil(ownHttpRequest) &&
      !util.lodash.isNil(rootHttpRequest) &&
      ownHttpRequest !== rootHttpRequest &&
      streamUtil.isBatchRequest(rootHttpRequest as { originalUrl?: string; url?: string })
    );
  },

  /**
   * Checks whether an HTTP request is an OData `$batch` request - matched like express routes it (any case,
   * optional trailing slash) against the PATHNAME only, ignoring the query string.
   * @param httpReq The HTTP (express) request.
   * @returns True if the request targets `$batch`, otherwise false.
   */
  isBatchRequest(httpReq: { originalUrl?: string; url?: string } | undefined): boolean {
    const url = httpReq?.originalUrl ?? httpReq?.url ?? '';
    const pathname = url.split('?')[0];

    return /\/\$batch\/?$/i.test(pathname);
  },

  /**
   * Pipes a `Readable` stream to the HTTP response, setting the content type and wiring up error handling.
   *
   * Headers are flushed `synchronously` (so the protocol adapter observes `res.headersSent` and does not
   * write its own response), and the returned promise resolves only once the stream has been fully piped -
   * this keeps the handler's promise pending until streaming completes.
   *
   * `Source teardown is guaranteed`: `stream.pipe(res)` does NOT propagate destination `close` / `error`
   * back to the source, so the source is destroyed explicitly on both a stream `'error'` (which also
   * destroys the response, so a broken producer does not hang the connection) and a response `'close'`
   * (e.g. the client disconnected mid-stream) - otherwise a long-running database stream would keep its
   * cursor/connection open on every aborted download.
   * @param res The HTTP (express) response object.
   * @param stream The readable stream to pipe.
   * @param contentType The `Content-Type` header to set on the response.
   * @returns A promise that resolves when the response finishes (or rejects on stream error).
   */
  pipeToResponse(res: ServerResponse, stream: Readable, contentType: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      res.setHeader('Content-Type', contentType);
      res.flushHeaders();

      stream.on('error', (error) => {
        stream.destroy();
        res.destroy();
        reject(error);
      });

      // `finish` = response fully sent.
      res.on('finish', () => resolve());

      // `close` = connection closed (e.g. client disconnected mid-stream). Destroy the source to free
      // its underlying resource (e.g. a database cursor); resolving keeps the handler promise from hanging.
      res.on('close', () => {
        stream.destroy();
        resolve();
      });

      stream.pipe(res);
    });
  },
};

export default streamUtil;
