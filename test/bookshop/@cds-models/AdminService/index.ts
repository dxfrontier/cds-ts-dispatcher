// This is an automatically generated file. Please do not change its contents manually!
import * as _ from './..';
import * as __ from './../_';
import * as _sap_capire_bookshop from './../sap/capire/bookshop';
export default { name: 'AdminService' }
export function _UserActivityLogAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class UserActivityLog extends Base {
        declare createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare createdBy?: _.User | null;
        declare modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare modifiedBy?: _.User | null;
        declare ID?: number;
        declare actionType?: string | null;
      declare static readonly actions: Record<never, never>
  };
}
export class UserActivityLog extends _UserActivityLogAspect(__.Entity) {static drafts: typeof UserActivityLog}
Object.defineProperty(UserActivityLog, 'name', { value: 'AdminService.UserActivityLog' })
Object.defineProperty(UserActivityLog, 'is_singular', { value: true })
export class UserActivityLog_ extends Array<UserActivityLog> {static drafts: typeof UserActivityLog
$count?: number}
Object.defineProperty(UserActivityLog_, 'name', { value: 'AdminService.UserActivityLog' })

export function _PromotionAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Promotion extends Base {
        declare ID?: number;
        declare name?: string | null;
        declare description?: string | null;
        declare startDate?: __.CdsDate | null;
        declare endDate?: __.CdsDate | null;
        declare discount?: number | null;
        declare books?: __.Association.to.many<_sap_capire_bookshop.Books>;
      declare static readonly actions: Record<never, never>
  };
}
export class Promotion extends _PromotionAspect(__.Entity) {static drafts: typeof Promotion}
Object.defineProperty(Promotion, 'name', { value: 'AdminService.Promotions' })
Object.defineProperty(Promotion, 'is_singular', { value: true })
export class Promotions extends Array<Promotion> {static drafts: typeof Promotion
$count?: number}
Object.defineProperty(Promotions, 'name', { value: 'AdminService.Promotions' })

export function _UserAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class User extends Base {
        declare createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare createdBy?: _.User | null;
        declare modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        declare modifiedBy?: _.User | null;
        declare ID?: number;
        declare username?: string | null;
        declare email?: string | null;
        declare role?: _.Roles | null;
        declare reviews?: __.Association.to.many<_sap_capire_bookshop.Reviews>;
      declare static readonly actions: Record<never, never>
  };
}
export class User extends _UserAspect(__.Entity) {}
Object.defineProperty(User, 'name', { value: 'AdminService.Users' })
Object.defineProperty(User, 'is_singular', { value: true })
export class Users extends Array<User> {$count?: number}
Object.defineProperty(Users, 'name', { value: 'AdminService.Users' })

export declare const sendMail: { (request: _.HelloRequest | null): _.HelloResponse | null, __parameters: {request: _.HelloRequest | null}, __returns: _.HelloResponse | null, kind: 'action'};