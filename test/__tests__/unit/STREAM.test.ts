/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import { PassThrough, Readable, Writable } from 'node:stream';
import cds from '@sap/cds';

import { Jwt, OnFunction, Stream } from '../../../lib';
import { MetadataDispatcher } from '../../../lib/core/MetadataDispatcher';
import streamUtil from '../../../lib/util/stream/streamUtil';

import type { Constructable } from '../../../lib/types/internalTypes';
import type { Request } from '../../../lib/types/types';

/**
 * Minimal HTTP-response mock: a `Writable` that also exposes `setHeader` / `flushHeaders`,
 * collecting the piped body so assertions can inspect it.
 */
class MockResponse extends Writable {
  public headers: Record<string, string> = {};
  public flushed = false;
  public destroyed = false;
  private readonly received: Buffer[] = [];

  setHeader(key: string, value: string): void {
    this.headers[key] = value;
  }

  flushHeaders(): void {
    this.flushed = true;
  }

  override destroy(): this {
    this.destroyed = true;
    return this;
  }

  override _write(chunk: Buffer, _encoding: BufferEncoding, callback: () => void): void {
    this.received.push(Buffer.from(chunk));
    callback();
  }

  get body(): string {
    return Buffer.concat(this.received).toString();
  }
}

describe('STREAM (F5)', () => {
  describe('streamUtil.isReadableStream', () => {
    test('It should DETECT : readable streams (duck-typed by `.pipe`)', () => {
      expect(streamUtil.isReadableStream(new PassThrough())).toBe(true);
      expect(streamUtil.isReadableStream(Readable.from(['data']))).toBe(true);
    });

    test('It should REJECT : non-stream values', () => {
      expect(streamUtil.isReadableStream({})).toBe(false);
      expect(streamUtil.isReadableStream({ pipe: 'not-a-function' })).toBe(false);
      expect(streamUtil.isReadableStream(42)).toBe(false);
      expect(streamUtil.isReadableStream('a string')).toBe(false);
      expect(streamUtil.isReadableStream(null)).toBe(false);
      expect(streamUtil.isReadableStream(undefined)).toBe(false);
    });
  });

  describe('streamUtil.pipeToResponse', () => {
    test('It should PIPE : the stream to the response, set the content type and resolve on finish', async () => {
      const res = new MockResponse();
      const stream = Readable.from(['hello ', 'streamed ', 'world']);

      await streamUtil.pipeToResponse(res as any, stream, 'application/json');

      expect(res.headers['Content-Type']).toBe('application/json');
      expect(res.flushed).toBe(true);
      expect(res.body).toBe('hello streamed world');
    });

    test('It should DESTROY : the response and reject when the stream errors', async () => {
      const res = new MockResponse();
      const stream = new PassThrough();

      const promise = streamUtil.pipeToResponse(res as any, stream, 'application/octet-stream');
      stream.emit('error', new Error('stream boom'));

      await expect(promise).rejects.toThrow('stream boom');
      expect(res.destroyed).toBe(true);
      expect(stream.destroyed).toBe(true);
    });

    test('It should DESTROY : the source stream when the client disconnects (response `close`)', async () => {
      const res = new MockResponse();
      const stream = new PassThrough();

      const promise = streamUtil.pipeToResponse(res as any, stream, 'application/json');

      // Simulate a client disconnect: the response closes before it finishes.
      res.emit('close');

      // Resolve semantics unchanged (no hang, no rejection) AND the source is torn down.
      await expect(promise).resolves.toBeUndefined();
      expect(stream.destroyed).toBe(true);
    });
  });

  describe('@Stream passthrough', () => {
    class StreamHandler {
      @OnFunction('nonStreamFunction')
      @Stream()
      public async nonStream(req: Request) {
        return { stock: 5 };
      }
    }

    const instanceOf = (Handler: Constructable) => new Handler();
    const handlers = MetadataDispatcher.getMetadataHandlers(instanceOf(StreamHandler));

    test('It should PASS THROUGH : non-stream return values unchanged', async () => {
      const handler = handlers.find((item) => item.type === 'ACTION_FUNCTION' && item.event === 'FUNC');
      const instance = new StreamHandler();

      const req = { inbound: {}, event: 'nonStreamFunction', data: {}, headers: {} };
      const result = await handler!.callback.call(instance, req);

      expect(result).toEqual({ stock: 5 });
    });
  });

  describe('streamUtil.isRootHttpRequest', () => {
    // Shapes as built by CAP 10: the protocol adapter passes the (sub-)request's own `{ req, res }` to the
    // cds.Request, while `req.http` is propagated from the root context (the HTTP request that hit the server).
    const rootContextFor = (httpReq: object, httpRes: object) => {
      const context = new cds.EventContext();
      context.http = { req: httpReq, res: httpRes } as any;
      return context;
    };

    test('It should ACCEPT : the event dispatched straight from the root HTTP request', () => {
      const httpReq = { originalUrl: '/odata/v4/error-stream/streamFn()' };
      const httpRes = new MockResponse();
      const req = new cds.Request({ req: httpReq, res: httpRes } as any);
      req.context = rootContextFor(httpReq, httpRes);

      expect(streamUtil.isRootHttpRequest(req as any)).toBe(true);
    });

    test('It should REJECT : a $batch part (its own sub-request differs from the root $batch request)', () => {
      const batchReq = { originalUrl: '/odata/v4/error-stream/$batch' };
      const req = new cds.Request({ req: { url: '/streamFn()', _subrequest: true }, res: new MockResponse() } as any);
      req.context = rootContextFor(batchReq, new MockResponse());

      expect(streamUtil.isRootHttpRequest(req as any)).toBe(false);
    });

    test('It should REJECT : a nested srv.send request (no HTTP request of its own)', () => {
      const req = new cds.Request({ event: 'streamFn' } as any);
      req.context = rootContextFor({ originalUrl: '/odata/v4/error-stream/nestedStreamFn()' }, new MockResponse());

      expect(streamUtil.isRootHttpRequest(req as any)).toBe(false);
    });

    test('It should REJECT : a request without any HTTP context', () => {
      expect(streamUtil.isRootHttpRequest(new cds.Request({ event: 'streamFn' } as any) as any)).toBe(false);
    });
  });

  describe('streamUtil.isBatchRequest', () => {
    test('It should DETECT : an OData $batch HTTP request', () => {
      expect(streamUtil.isBatchRequest({ originalUrl: '/odata/v4/error-stream/$batch' })).toBe(true);
      expect(streamUtil.isBatchRequest({ url: '/$batch?sap-client=100' })).toBe(true);
    });

    test('It should DETECT : $batch URLs that express still routes to the batch handler (trailing slash, any case)', () => {
      expect(streamUtil.isBatchRequest({ originalUrl: '/odata/v4/error-stream/$batch/' })).toBe(true);
      expect(streamUtil.isBatchRequest({ originalUrl: '/odata/v4/error-stream/$BATCH' })).toBe(true);
      expect(streamUtil.isBatchRequest({ originalUrl: '/odata/v4/error-stream/$Batch/?sap-client=100' })).toBe(true);
    });

    test('It should REJECT : any other or missing HTTP request', () => {
      expect(streamUtil.isBatchRequest({ originalUrl: '/odata/v4/error-stream/streamFn()' })).toBe(false);
      expect(streamUtil.isBatchRequest({ originalUrl: '/odata/v4/error-stream/Books?$filter=batch' })).toBe(false);
      expect(streamUtil.isBatchRequest(undefined)).toBe(false);
    });

    test('It should REJECT : a query string that ends in /$batch on a non-$batch pathname', () => {
      expect(streamUtil.isBatchRequest({ originalUrl: '/odata/v4/error-stream/Books?$search=/$batch' })).toBe(false);
      expect(streamUtil.isBatchRequest({ originalUrl: '/odata/v4/error-stream/Books?$search=/$BATCH' })).toBe(false);
    });
  });

  describe('streamUtil.isBatchPart', () => {
    test('It should REJECT : an own HTTP (sub-)request with no root HTTP request at all (programmatic dispatch)', () => {
      // e.g. `srv.dispatch(new cds.Request({ req: someHttpReq }))` from inside `cds.spawn` or a test - there
      // is no root HTTP request on `cds.context`, so this is not a `$batch` part.
      const req = new cds.Request({ req: { originalUrl: '/streamFn()' } } as any);

      expect(streamUtil.isBatchPart(req as any)).toBe(false);
    });

    test('It should REJECT : an own HTTP (sub-)request whose root request differs but does not target $batch', () => {
      // The event owns a sub-request that differs from the root (e.g. a handler serving a root request
      // dispatches another event under its own sub-request) - the root itself is a plain request, not
      // `$batch`, so this must not be mistaken for a `$batch` part.
      const req = new cds.Request({ req: { url: '/streamFn()' } } as any);
      const context = new cds.EventContext();
      context.http = { req: { originalUrl: '/odata/v4/error-stream/other()' } } as any;
      req.context = context;

      expect(streamUtil.isBatchPart(req as any)).toBe(false);
    });
  });

  describe('@Stream root / $batch / nested', () => {
    class RootStreamHandler {
      public produced?: Readable;

      @OnFunction('streamFn')
      @Stream('text/plain')
      public async streamFn(req: Request) {
        this.produced = Readable.from(['line-1\n', 'line-2']);
        return this.produced;
      }
    }

    const handler = MetadataDispatcher.getMetadataHandlers(new RootStreamHandler()).find(
      (item) => item.type === 'ACTION_FUNCTION' && item.event === 'FUNC',
    )!;

    const withContext = (req: any, httpReq: object, httpRes: object) => {
      const context = new cds.EventContext();
      context.http = { req: httpReq, res: httpRes } as any;
      req.context = context;
      return req;
    };

    test('It should PIPE : a root HTTP request into its response', async () => {
      const httpReq = { originalUrl: '/odata/v4/error-stream/streamFn()' };
      const httpRes = new MockResponse();
      const req = withContext(new cds.Request({ req: httpReq, res: httpRes } as any), httpReq, httpRes);

      const result = await handler.callback.call(new RootStreamHandler(), req);

      expect(result).toBeUndefined();
      expect(httpRes.headers['Content-Type']).toBe('text/plain');
      expect(httpRes.body).toBe('line-1\nline-2');
    });

    test('It should REJECT with 400 : a $batch part, destroying the Readable and leaving the responses untouched', async () => {
      const batchRes = new MockResponse();
      const partRes = new MockResponse();
      const part = new cds.Request({ req: { url: '/streamFn()', _subrequest: true }, res: partRes } as any);
      const req = withContext(part, { originalUrl: '/odata/v4/error-stream/$batch' }, batchRes);
      const instance = new RootStreamHandler();

      await expect(handler.callback.call(instance, req)).rejects.toMatchObject({
        status: 400,
        message: '@Stream is not supported inside $batch',
      });

      expect(instance.produced?.destroyed).toBe(true);
      expect(batchRes.headers).toEqual({});
      expect(batchRes.body).toBe('');
      expect(partRes.headers).toEqual({});
      expect(partRes.body).toBe('');
    });

    test('It should RETURN the Readable : for a programmatic dispatch with no root HTTP request at all', async () => {
      // e.g. `srv.dispatch(new cds.Request({ req: someHttpReq }))` from inside `cds.spawn` - the request owns
      // an HTTP (sub-)request, but there is no root HTTP request (no `cds.context`, no `req.http`) to compare
      // it against, so this must not be mistaken for a `$batch` part.
      const req = new cds.Request({ req: { originalUrl: '/streamFn()' } } as any);

      const result = await handler.callback.call(new RootStreamHandler(), req);

      expect(streamUtil.isReadableStream(result)).toBe(true);
      expect(result.mimetype).toBe('text/plain');
    });

    test('It should RETURN the Readable : for a nested srv.send inside a $batch part', async () => {
      const batchRes = new MockResponse();
      const nested = new cds.Request({ event: 'streamFn' } as any);
      const req = withContext(nested, { originalUrl: '/odata/v4/error-stream/$batch' }, batchRes);

      const result = await handler.callback.call(new RootStreamHandler(), req);

      expect(streamUtil.isReadableStream(result)).toBe(true);
      expect(result.mimetype).toBe('text/plain');
      expect(batchRes.body).toBe('');
    });

    test('It should RETURN the Readable : for an own HTTP request whose root request does not target $batch', async () => {
      const rootRes = new MockResponse();
      const own = new cds.Request({ req: { url: '/streamFn()' } } as any);
      const req = withContext(own, { originalUrl: '/odata/v4/error-stream/other()' }, rootRes);

      const result = await handler.callback.call(new RootStreamHandler(), req);

      expect(streamUtil.isReadableStream(result)).toBe(true);
      expect(result.mimetype).toBe('text/plain');
      expect(rootRes.headers).toEqual({});
      expect(rootRes.body).toBe('');
    });

    test('It should RETURN the Readable : for a nested srv.send, leaving the root response untouched', async () => {
      const rootRes = new MockResponse();
      const nested = new cds.Request({ event: 'streamFn' } as any);
      const req = withContext(nested, { originalUrl: '/odata/v4/error-stream/nestedStreamFn()' }, rootRes);

      const result = await handler.callback.call(new RootStreamHandler(), req);

      expect(streamUtil.isReadableStream(result)).toBe(true);
      expect(rootRes.headers).toEqual({});
      expect(rootRes.body).toBe('');
    });

    test('It should KEEP : a mimetype the handler already set on the returned Readable', async () => {
      class TaggedStreamHandler {
        @OnFunction('streamFn')
        @Stream('text/plain')
        public async streamFn(req: Request) {
          return Object.assign(Readable.from(['x']), { mimetype: 'text/csv' });
        }
      }

      const tagged = MetadataDispatcher.getMetadataHandlers(new TaggedStreamHandler()).find(
        (item) => item.type === 'ACTION_FUNCTION' && item.event === 'FUNC',
      )!;

      const result = await tagged.callback.call(
        new TaggedStreamHandler(),
        new cds.Request({ event: 'streamFn' } as any),
      );

      expect(result.mimetype).toBe('text/csv');
    });

    test('It should RETURN the Readable : when neither the handler request nor cds.context is available', async () => {
      class NoRequestStreamHandler {
        @OnFunction('streamFn')
        @Stream('text/plain')
        public async streamFn(@Jwt() jwt: string | undefined) {
          return Readable.from(['x']);
        }
      }

      const noRequest = MetadataDispatcher.getMetadataHandlers(new NoRequestStreamHandler()).find(
        (item) => item.type === 'ACTION_FUNCTION' && item.event === 'FUNC',
      )!;

      // `@Jwt()` replaces the argument list, so the wrapper sees no request and falls back to `cds.context`.
      const httpRes = new MockResponse();
      const req = new cds.Request({ req: { headers: {} }, res: httpRes } as any);
      const result = await noRequest.callback.call(new NoRequestStreamHandler(), req);

      expect(streamUtil.isReadableStream(result)).toBe(true);
      expect(httpRes.body).toBe('');
    });
  });

  describe('@Stream without the handler request (falls back to cds.context)', () => {
    class JwtStreamHandler {
      public produced?: Readable;

      @OnFunction('streamFn')
      @Stream('text/plain')
      public async streamFn(@Jwt() jwt: string | undefined) {
        this.produced = Readable.from(['line-1\n', 'line-2']);
        return this.produced;
      }
    }

    const handler = MetadataDispatcher.getMetadataHandlers(new JwtStreamHandler()).find(
      (item) => item.type === 'ACTION_FUNCTION' && item.event === 'FUNC',
    )!;

    // `@Jwt()` replaces the argument list, so the wrapper only sees the root context in `cds.context`.
    const callWithin = (originalUrl: string, httpRes: MockResponse, instance: JwtStreamHandler) => {
      const context = new cds.EventContext();
      context.http = { req: { originalUrl, headers: {} }, res: httpRes } as any;
      const req = new cds.Request({ req: { headers: {} }, res: new MockResponse() } as any);

      return cds._with(context, () => handler.callback.call(instance, req));
    };

    test('It should PIPE : a root HTTP request into its response', async () => {
      const httpRes = new MockResponse();

      const result = await callWithin('/odata/v4/error-stream/streamFn()', httpRes, new JwtStreamHandler());

      expect(result).toBeUndefined();
      expect(httpRes.headers['Content-Type']).toBe('text/plain');
      expect(httpRes.body).toBe('line-1\nline-2');
    });

    test('It should REJECT with 400 : a call inside a $batch request, leaving the $batch response untouched', async () => {
      const batchRes = new MockResponse();
      const instance = new JwtStreamHandler();

      await expect(callWithin('/odata/v4/error-stream/$batch', batchRes, instance)).rejects.toMatchObject({
        status: 400,
        message: '@Stream is not supported inside $batch',
      });

      expect(instance.produced?.destroyed).toBe(true);
      expect(batchRes.headers).toEqual({});
      expect(batchRes.body).toBe('');
    });
  });
});
