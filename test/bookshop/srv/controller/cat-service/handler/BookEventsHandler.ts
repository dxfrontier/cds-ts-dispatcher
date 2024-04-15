/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  AfterRead,
  AfterReadDraft,
  EntityHandler,
  Inject,
  Next,
  NextEvent,
  OnCancelDraft,
  OnEditDraft,
  OnNewDraft,
  OnSaveDraft,
  Req,
  Request,
  Results,
  Service,
  SingleInstanceCapable,
  SingleInstanceSwitch,
  SRV,
  Use,
} from '../../../../../../lib';
import { BookEvent } from '../../../../@cds-models/CatalogService';

@EntityHandler(BookEvent)
class BookEventsHandler {
  @Inject(SRV) private readonly srv: Service;

  @OnNewDraft()
  public async newDraft(@Req() req: Request, @Next() next: NextEvent) {
    req.notify('On new draft');
    return next();
  }

  @OnCancelDraft()
  public async cancel(@Req() req: Request, @Next() next: NextEvent) {
    req.notify('On cancel draft');
    return next();
  }

  @OnEditDraft()
  public async edit(@Req() req: Request, @Next() next: NextEvent) {
    req.notify('On edit draft');
    return next();
  }

  @OnSaveDraft()
  public async save(@Req() req: Request, @Next() next: NextEvent) {
    req.notify('On save draft');
    return next();
  }

  @AfterRead()
  @AfterReadDraft()
  public async afterReadDraft(
    @Results() results: BookEvent[],
    @Req() req: Request,
    @SingleInstanceSwitch() isSingleInstance: boolean,
  ) {
    // handle single instance
    if (Array.isArray(results) && results.length === 0) {
      return;
    }

    if (isSingleInstance) {
      req.notify('Single instance');
    }

    // handle entity set
  }
}

export default BookEventsHandler;
