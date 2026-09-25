import { Readable } from 'node:stream';

import {
  CDS_DISPATCHER,
  Error,
  Inject,
  OnError,
  OnFunction,
  Req,
  Service,
  Stream,
  UnboundActions,
} from '../../../../../../../lib';

import type { Request } from '../../../../../../../lib';

/** Messages `failFn(mode)` raises; each selects one @OnError variant below. */
const THROW_SYNC = 'onerror-throws-sync';
const THROW_ASYNC = 'onerror-throws-async';

/** `largeStreamFn` rows: 4096 rows of 50 bytes = 200 KiB. */
const LARGE_ROWS = 4096;
const largeRow = (index: number): string => `row-${String(index).padStart(5, '0')},${'x'.repeat(39)}\n`;

@UnboundActions()
class ErrorStreamHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  @OnFunction('failFn')
  public async failFn(@Req() req: Request): Promise<void> {
    req.reject(400, req.data.mode);
  }

  @OnFunction('streamFn')
  @Stream('text/plain')
  public async streamFn(): Promise<Readable> {
    return Readable.from(['stream-line-1\n', 'stream-line-2']);
  }

  @OnFunction('largeStreamFn')
  @Stream('text/csv')
  public async largeStreamFn(): Promise<Readable> {
    return Readable.from(Array.from({ length: LARGE_ROWS }, (_, index) => largeRow(index)));
  }

  @OnFunction('plainFn')
  public async plainFn(): Promise<string> {
    return 'plain-ok';
  }

  @OnFunction('nestedStreamFn')
  public async nestedStreamFn(): Promise<string> {
    const result: unknown = await this.srv.send('streamFn');

    if (result instanceof Readable) {
      const chunks: Buffer[] = [];

      for await (const chunk of result) {
        chunks.push(Buffer.from(chunk));
      }

      return `readable:${Buffer.concat(chunks).toString()}`;
    }

    return `value:${String(result)}`;
  }

  // Synchronous error handler that throws while CAP runs the service's error handlers.
  @OnError()
  public onErrorSync(@Error() err: Error): void {
    if (err.message === THROW_SYNC) {
      throw new globalThis.Error('thrown synchronously inside @OnError');
    }
  }

  // Asynchronous error handler whose returned promise rejects.
  @OnError()
  public async onErrorAsync(@Error() err: Error): Promise<void> {
    if (err.message === THROW_ASYNC) {
      await Promise.resolve();
      throw new globalThis.Error('thrown asynchronously inside @OnError');
    }
  }
}

export default ErrorStreamHandler;
