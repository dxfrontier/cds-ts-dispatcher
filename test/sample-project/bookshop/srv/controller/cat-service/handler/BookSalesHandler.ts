import { BookSale } from '#cds-models/CatalogService';

import {
  AfterCreate,
  AfterRead,
  AfterUpdate,
  CDS_DISPATCHER,
  EntityHandler,
  Exclude,
  ExecutionAllowedForRole,
  GetQuery,
  GetRequest,
  Inject,
  IsColumnSupplied,
  IsPresent,
  IsRole,
  Jwt,
  Mask,
  Req,
  Request,
  Results,
  Service,
  SingleInstanceSwitch,
} from '../../../../../../../lib';
import BookSalesService from '../../../service/BookSalesService';

import type { GetQueryType } from '../../../../../../../lib';
import { SharedService } from './SharedService';

@EntityHandler(BookSale)
class BookSalesHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;
  @Inject(BookSalesService) private readonly bookSalesService: BookSalesService;

  @Inject(SharedService) private readonly sharedService: SharedService;

  @AfterRead()
  @ExecutionAllowedForRole('Manager', 'User', 'CEO')
  private async afterRead(
    @IsColumnSupplied<BookSale>('quantity') hasQuantity: boolean,
    @IsColumnSupplied<BookSale>('saleDate') hasSaleDate: boolean,

    @Req() req: Request,
    @Results() results: BookSale[],

    @IsPresent('SELECT', 'from') hasFrom: boolean,
    @IsPresent('SELECT', 'orderBy') hasOrderBy: boolean,

    @IsRole('Manager', 'User') hasRoles: boolean,
    @IsRole('CEO') isRole: boolean,

    @GetQuery('SELECT', 'columns') columns: GetQueryType['columns']['forSelect'],
    @GetQuery('SELECT', 'orderBy') orderBy: GetQueryType['orderBy'],

    @GetRequest('locale') locale: Request['locale'],

    @SingleInstanceSwitch() isSingleInstance: boolean,

    @Jwt() token: string | undefined,
  ): Promise<void> {
    const message = this.sharedService.getMessage();

    this.bookSalesService.showAfterReadNotifies({
      req,
      hasRoles,
      isRole,
      isSingleInstance,
      token,
      locale,
      columns,
      orderBy,
      hasQuantity,
      hasSaleDate,
      hasFrom,
      hasOrderBy,
      message,
    });
  }

  // C5 probes: `@Exclude` / `@Mask` on write-AFTER events (`@AfterCreate` / `@AfterUpdate`).
  //
  // Each transformer probe is paired with a plain observer registered on the SAME event. CAP's `.after`
  // handlers for one event run in PARALLEL (`Promise.all(handlers.map(...))` - `@sap/cds/lib/srv/srv-
  // dispatch.js`), NOT sequentially by registration order: a same-tick observer would read `req.results`
  // BEFORE the transformer's own continuation (one microtask deeper, through the `@AfterCreate`/`@Exclude`
  // wrapper chain) has run. Each observer defers one macrotask (`setImmediate`) before reading
  // `req.results` so it reliably observes the SETTLED, post-transformer state instead of racing it.
  //
  // VERIFIED (this cds 10.0.3 + `@cap-js/db-service` runtime, `db: sql` / sqlite, DEFAULT feature flags):
  // the generic CREATE handler's `req.results` only ever carries the entity's KEY column(s) -
  // `InsertResults#materialize()` (`@cap-js/db-service/lib/InsertResults.js`) extracts just the keys of
  // the inserted row, discarding everything else - and the generic UPDATE handler's `req.results` is an
  // empty array plus `.affected` (the `new_behavior` branch of `@sap/cds/libx/_runtime/common/generic/
  // crud.js`, gated by `features.legacy_srv_results: false`, the cds-10 default; the legacy flag yields a
  // bare number instead). So neither 'quantity' nor 'saleDate' can ever be OBSERVED in `req.results`
  // here, fix or no fix. `@Exclude`'s 'quantity' target (the leak-shaped business-field probe, matching
  // the docs' password/ssn hiding theme) is joined by 'ID' - the one field the generic CREATE handler
  // DOES surface - so the probe has something observable to remove; `@Mask`'s 'saleDate' target has no
  // such counterpart on UPDATE (nothing survives there at all), so that probe is a no-crash/no-op
  // regression guard here and is covered for real at the unit level (FORMATTER-UTIL.test.ts).

  @AfterCreate()
  @Exclude<BookSale>('quantity', 'ID')
  private async afterCreate(@Results() results: BookSale, @Req() req: Request): Promise<void> {
    // Must strip 'quantity' (leak-shaped target) and 'ID' (see block comment above) from `req.results` -
    // see `afterCreateObserver`.
  }

  @AfterCreate()
  private async afterCreateObserver(@Results() results: BookSale, @Req() req: Request): Promise<void> {
    await new Promise((resolve) => setImmediate(resolve));
    console.log(
      `[BookSalesAfterCreateObserver] results=${JSON.stringify(req.results)} dataHasQuantity=${'quantity' in req.data}`,
    );
  }

  @AfterUpdate()
  @Mask<BookSale>(['saleDate'])
  private async afterUpdate(@Results() results: BookSale, @Req() req: Request): Promise<void> {
    // Must mask 'saleDate' on `req.results` IF present (verified: never is, for a generic UPDATE - see
    // block comment above) - see `afterUpdateObserver`.
  }

  @AfterUpdate()
  private async afterUpdateObserver(@Results() results: BookSale, @Req() req: Request): Promise<void> {
    await new Promise((resolve) => setImmediate(resolve));
    console.log(`[BookSalesAfterUpdateObserver] results=${JSON.stringify(req.results)}`);
  }
}

export default BookSalesHandler;
