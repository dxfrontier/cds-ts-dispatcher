import {
  ActionRequest,
  ActionReturn,
  CDS_DISPATCHER,
  Error,
  FieldsFormatter,
  GetRequest,
  Inject,
  Next,
  NextEvent,
  OnAction,
  OnError,
  OnEvent,
  OnFunction,
  Prepend,
  Req,
  RequestResponse,
  Res,
  Service,
  Request,
  UnboundActions,
  Use,
  Validate,
  OnSubscribe,
  Msg,
} from '../../../../../../../lib';
import {
  changeBookProperties,
  event_2,
  OrderedBook,
  submitOrder,
  submitOrderFunction,
  submitQuantity,
} from '../../../../@cds-models/CatalogService';
import { MiddlewareEntity1 } from '../../../middleware/MiddlewareEntity1';
import { MiddlewareEntity2 } from '../../../middleware/MiddlewareEntity2';

import type { ExposeFields } from '../../../../../../../lib/types/validator';
import { SubscriberType } from '../../../../../../../lib';

@UnboundActions()
@Use(MiddlewareEntity1, MiddlewareEntity2)
class UnboundActionsHandler {
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  @OnAction('changeBookProperties')
  @FieldsFormatter<ExposeFields<typeof changeBookProperties>>({ action: 'toLower' }, 'language')
  @FieldsFormatter<ExposeFields<typeof changeBookProperties>>({ action: 'ltrim' }, 'language')
  @Validate<ExposeFields<typeof changeBookProperties>>({ action: 'isIn', values: ['PDF', 'E-Kindle'] }, 'format')
  public async changeBookProperties(
    @Req() req: ActionRequest<typeof changeBookProperties>,
    @Next() next: NextEvent,
  ): ActionReturn<typeof changeBookProperties> {
    return {
      language: req.data.language,
      format: req.data.format,
    };
  }

  @Prepend({ eventDecorator: 'OnAction', actionName: 'submitOrder' })
  public async prependAction(
    @Req() req: ActionRequest<typeof submitOrder>,
    @Next() next: NextEvent,
  ): Promise<Function> {
    req.locale = 'DE_de';
    return next();
  }

  @Prepend({ eventDecorator: 'OnEvent', eventName: OrderedBook })
  public async prependEvent(@Req() req: Request<OrderedBook>): Promise<void> {
    req.locale = 'DE_de';
  }

  @OnAction(submitQuantity)
  @Validate<ExposeFields<typeof submitQuantity>>({ action: 'isEmpty', mandatoryFieldValidation: true }, 'quantity')
  public async submitQuantity(
    @Req() req: ActionRequest<typeof submitQuantity>,
    @Res() res: RequestResponse,
    @GetRequest('locale') locale: Request['locale'],
    @Next() next: NextEvent,
  ): ActionReturn<typeof submitOrder> {
    req.reject('It will not reach here, as Validate will be executed first !');
  }

  @OnAction('submitOrder')
  @Validate<ExposeFields<typeof submitOrder>>(
    { action: 'equals', comparison: '3', mandatoryFieldValidation: true },
    'quantity',
  )
  public async submitOrder(
    @Req() req: ActionRequest<typeof submitOrder>,
    @Res() res: RequestResponse,
    @GetRequest('locale') locale: Request['locale'],
    @Next() next: NextEvent,
  ): ActionReturn<typeof submitOrder> {
    res.setHeader('Content-Language', locale);

    return {
      stock: req.data.quantity! + 1,
    };
  }

  @OnFunction('submitOrderFunction')
  public async submitOrderFunction(
    @Req() req: ActionRequest<typeof submitOrderFunction>,
    @Next() next: NextEvent,
  ): ActionReturn<typeof submitOrderFunction> {
    return {
      stock: req.data.quantity! + 1,
    };
  }

  @OnEvent(OrderedBook)
  public async orderedBook(@Req() req: Request<OrderedBook>, @Res() res: RequestResponse): Promise<void> {
    res.setHeader('Content-Language', 'DE_de');
    if (req.event !== 'OrderedBook') {
      req.reject(400, 'Not OrderedBook: check @OnEvent decorator');
    }
  }

  @OnError()
  public error(@Error() err: Error, @Req() req: Request): void {
    if (req.entity === 'CatalogService.Publishers') {
      err.message = 'OnError';
    }
  }

  @OnSubscribe({
    eventName: event_2,
    type: 'MESSAGE_BROKER',
    showReceiverMessage: true,
  })
  // private async onProductMessaging(@Msg() msg: SubscriberType<{ foo: number; bar: string }>): Promise<void> {
  private async onProductMessaging(@Req() req: Request): Promise<void> {
    const bla = req.data;
    // TODO: how I can check if this was executed using POSTMAN
  }

  @OnSubscribe({
    eventName: 'event_1',
    type: 'SAME_NODE_PROCESS',
    showReceiverMessage: true,
    consoleStyle: 'table',
  })
  private async onProductSubscribe(@Req() req: Request<any>, @Res() res: RequestResponse): Promise<void> {
    res.setHeader('CustomHeader', 'OnSubscribeTriggered_event_1');
  }

  @OnSubscribe({
    eventName: 'event_3',
    type: 'SAME_NODE_PROCESS_DIFFERENT_SERVICE',
    externalServiceName: 'ProductsService',
    showReceiverMessage: true,
  })
  private async onProductMessaging3(
    @Req() req: SubscriberType<{ foo: number; bar: string }>,
    @Res() res: RequestResponse,
  ): Promise<void> {
    res.setHeader('CustomHeader', 'OnSubscribeTriggered_event_3');
  }

  @OnEvent('event_1')
  private async bla(@Req() req: SubscriberType<{ foo: number; bar: string }>): Promise<void> {
    const bla = req.data;
  }
}

export default UnboundActionsHandler;
