/* eslint-disable @typescript-eslint/explicit-function-return-type */
import 'reflect-metadata';

import { PassThrough, Readable, Writable } from 'node:stream';

import { OnFunction, Stream } from '../../../lib';
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
});
