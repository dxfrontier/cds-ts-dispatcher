/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AfterAll,
  AfterCreate,
  AfterDelete,
  AfterRead,
  AfterReadEachInstance,
  AfterUpdate,
  BeforeRead,
  CDS_DISPATCHER,
  EntityHandler,
  Env,
  // Env,
  GetRequest,
  Inject,
  IsColumnSupplied,
  IsPresent,
  IsRole,
  // Jwt,
  Prepend,
  Req,
  Res,
  Result,
  Results,
  Service,
  SingleInstanceSwitch,
  Use,
} from '@dxfrontier/cds-ts-dispatcher';

import { Book } from '#cds-models/CatalogService';
import { MiddlewareMethodAfterRead1 } from '../../../middleware/MiddlewareAfterRead1';
import { MiddlewareMethodAfterRead2 } from '../../../middleware/MiddlewareAfterRead2';
import { MiddlewareMethodBeforeRead } from '../../../middleware/MiddlewareBeforeRead';
import { MiddlewareEntity1 } from '../../../middleware/MiddlewareEntity1';
import { MiddlewareEntity2 } from '../../../middleware/MiddlewareEntity2';
import BookService from '../../../service/BookService';
import { CDS_ENV } from '#dispatcher';

import type { RequestResponse, Request } from '@dxfrontier/cds-ts-dispatcher';

import { StatusCodes, getReasonPhrase } from 'http-status-codes';

import axios from 'axios';

type StatusCodeMapping = {
  [K in keyof typeof StatusCodes as `${K}-${Extract<(typeof StatusCodes)[K], number>}`]: (typeof StatusCodes)[K];
};

function handleError(options: { req: Request; message?: string; code?: string }): Error | undefined {
  const { req, message, code } = options;

  // Case 1: If only `code` is provided (ErrorCode decorator)
  if (code && !message) {
    const statusCode = code.split('-')[1];
    return req.reject({ code: statusCode, message: getReasonPhrase(statusCode) });
  }

  // Case 2: If both `message` and `code` are provided (ErrorMessage decorator with status code)
  if (code && message) {
    const statusCode = code.split('-')[1];
    return req.reject({ code: statusCode, message });
  }

  // Case 3: If only `message` is provided (ErrorMessage decorator without status code)
  if (message) {
    return req.reject(message);
  }
}

async function handleAsyncErrors<T>(fn: () => Promise<T>) {
  const result = await Promise.allSettled([fn()]);
  const rejected = result.find((response) => response.status === 'rejected');

  return rejected;
}

/**
 * Use `@ErrorCode` decorator to catch errors and provide new status code.
 * @param newCode - The new status code.
 * @example
 * "@ErrorCode('BAD_REQUEST-400')"
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#onerrormessage | CDS-TS-Dispatcher - @ErrorCode}
 */

function ErrorCode(newStatusCode: keyof StatusCodeMapping) {
  return function (_: any, __: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req: Request = args.find((arg) => arg?.reject instanceof Function);

      try {
        const result = await handleAsyncErrors(originalMethod.bind(this, ...args));
        if (result) {
          throw result.reason;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error: any) {
        return handleError({ req, code: newStatusCode });
      }
    };

    return descriptor;
  };
}

/**
 * Use `@ErrorMessage` decorator to catch errors and provide a new message and status code.
 * @param newMessage - The new error message.
 * @param newStatus - `[Optional]` The new status code.
 * @example
 * "@ErrorMessage('Bad request of the call', 'BAD_REQUEST-400')"
 *
 * @see {@link https://github.com/dxfrontier/cds-ts-dispatcher?tab=readme-ov-file#onerrormessage | CDS-TS-Dispatcher - @ErrorMessage}
 */

function ErrorMessage(newMessage: string, newStatusCode?: keyof StatusCodeMapping) {
  return function (_: any, __: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req: Request = args.find((arg) => arg?.reject instanceof Function);

      try {
        const result = await handleAsyncErrors(originalMethod.bind(this, ...args));
        if (result) {
          throw result.reason;
        }
      } catch (error: any) {
        return handleError({ req, message: newMessage, code: newStatusCode });
      }
    };

    return descriptor;
  };
}

@EntityHandler(Book)
@Use(MiddlewareEntity1, MiddlewareEntity2)
class BookHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;
  @Inject(BookService) private readonly bookService: BookService;

  @Prepend({ eventDecorator: 'AfterReadSingleInstance' })
  public async prepend(@Req() req: Request): Promise<void> {
    req.locale = 'DE_de';
  }

  @AfterReadEachInstance()
  private async afterReadEachInstance(
    @Req() req: Request,
    @Res() res: RequestResponse,
    @Result() result: Book,
  ): Promise<void> {
    //
  }

  @AfterAll()
  private async afterAll(
    @Req() req: Request,
    @Res() res: RequestResponse,
    @Result() result: Book | Book[] | boolean,
  ): Promise<void> {
    if (Array.isArray(result)) {
      // when after `read` event was triggered
      console.log('READ');
    } else if (typeof result === 'boolean') {
      // when after `delete` event was triggered
      console.log('DELETE');
    } else {
      // when after `create`, `update` as triggered
      console.log('CREATE and UPDATE');
    }

    res.setHeader('CustomHeader', 'AfterAllTriggered');
  }

  @AfterCreate()
  private async afterCreate(@Result() result: Book, @Req() req: Request): Promise<void> {
    this.bookService.validateData(result, req);
  }

  @BeforeRead()
  @Use(MiddlewareMethodBeforeRead)
  private async beforeRead(@Req() req: Request<Book>): Promise<void> {
    this.bookService.showConsoleLog();
  }

  @AfterRead()
  @Use(MiddlewareMethodAfterRead1, MiddlewareMethodAfterRead2)
  @ErrorMessage('new Message', 'BAD_REQUEST-400')
  // @ErrorCode('EXPECTATION_FAILED-417')
  private async afterRead(
    @Req() req: Request,
    @Results() results: Book[],
    @SingleInstanceSwitch() singleInstance: boolean,
    @IsColumnSupplied<Book>('price') hasPrice: boolean,
    @IsPresent('SELECT', 'columns') hasColumns: boolean,
    @IsRole('Developer', 'AnotherRole') role: boolean,
    @GetRequest('locale') locale: Request['locale'],
    @Env<CDS_ENV>('requires.auth.users') users: any[],
  ) {
    await this.bookService.manageAfterReadMethods({ req, results, singleInstance, users });
  }

  @AfterUpdate()
  private async afterUpdate(@Result() result: Book, @Req() req: Request<Book>): Promise<void> {
    await this.bookService.addDefaultTitleText(result, req);
  }

  @AfterDelete()
  private async afterDelete(@Result() deleted: boolean, @Req() req: Request): Promise<void> {
    this.bookService.notifyItemDeleted(req, deleted);
  }
}

export default BookHandler;
