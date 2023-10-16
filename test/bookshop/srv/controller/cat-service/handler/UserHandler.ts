import {
  BeforeCreate,
  BeforeDelete,
  BeforeRead,
  BeforeUpdate,
  EntityHandler,
  Inject,
  OnAction,
  OnBoundAction,
  OnBoundFunction,
  OnCreate,
  OnDelete,
  OnFunction,
  OnRead,
  OnUpdate,
  ServiceHelper,
} from '../../../../../../lib';
import { Service } from '@sap/cds';
import { User, sendMail, submitOrder } from '../../../util/types/entities/CatalogService';
import { TypedActionRequest, TypedRequest } from '../../../../../../lib/util/types/types';
import UserService from '../../../service/UserService';

@EntityHandler(User)
class UserHandler {
  @Inject(ServiceHelper.SRV) private readonly srv: Service;
  @Inject(UserService) private UserService: UserService;

  @OnCreate()
  private async onCreateMethod(req: TypedRequest<User>, next: Function) {}

  @OnRead()
  private async onReadMethod(req: TypedRequest<User>, _: Function) {}

  @OnUpdate()
  private async onUpdateMethod(req: TypedRequest<User>, _: Function) {}

  @OnDelete()
  private async onDeleteMethod(req: TypedRequest<User>, _: Function) {}

  @OnAction(submitOrder)
  private async onActionMethod(req: TypedActionRequest<typeof submitOrder>, next: Function) {
    // return this.bookService.verifyStock(req);
  }

  @OnFunction(submitOrder)
  private async onFunctionMethod(req: TypedActionRequest<typeof submitOrder>, next: Function) {
    // return this.bookService.verifyStock(req);
  }

  @OnBoundAction(submitOrder)
  private async onBoundActionMethod(req: TypedActionRequest<typeof submitOrder>, next: Function) {
    // return this.bookService.verifyStock(req);
  }

  @OnBoundFunction(submitOrder)
  private async onBoundFunctionMethod(req: TypedActionRequest<typeof submitOrder>, next: Function) {
    // return this.bookService.verifyStock(req);
  }
}

export default UserHandler;
