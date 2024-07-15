// This is an automatically generated file. Please do not change its contents manually!
import * as _ from './..';
import * as __ from './../_';
import * as _sap_capire_bookshop from './../sap/capire/bookshop';
export default { name: 'AdminService' }
export function _UserActivityLogAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class extends _._managedAspect(Base) {
        createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: _.User | null;
        ID?: number;
        actionType?: string | null;
      static readonly actions: Record<never, never>
  };
}
export class UserActivityLog extends _UserActivityLogAspect(__.Entity) {static drafts: typeof UserActivityLog}
Object.defineProperty(UserActivityLog, 'name', { value: 'AdminService.UserActivityLog' })
Object.defineProperty(UserActivityLog, 'is_singular', { value: true })
export class UserActivityLog_ extends Array<UserActivityLog> {static drafts: typeof UserActivityLog
$count?: number}
Object.defineProperty(UserActivityLog_, 'name', { value: 'AdminService.UserActivityLog' })

export function _PromotionAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class extends Base {
        ID?: number;
        name?: string | null;
        description?: string | null;
        startDate?: __.CdsDate | null;
        endDate?: __.CdsDate | null;
        discount?: number | null;
        books?: __.Association.to.many<_sap_capire_bookshop.Books>;
      static readonly actions: Record<never, never>
  };
}
export class Promotion extends _PromotionAspect(__.Entity) {static drafts: typeof Promotion}
Object.defineProperty(Promotion, 'name', { value: 'AdminService.Promotions' })
Object.defineProperty(Promotion, 'is_singular', { value: true })
export class Promotions extends Array<Promotion> {static drafts: typeof Promotion
$count?: number}
Object.defineProperty(Promotions, 'name', { value: 'AdminService.Promotions' })

export function _UserAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class extends _._managedAspect(Base) {
        createdAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        createdBy?: _.User | null;
        modifiedAt?: __.CdsTimestamp | null;
    /**
    * Canonical user ID
    */
        modifiedBy?: _.User | null;
        ID?: number;
        username?: string | null;
        email?: string | null;
        role?: _.Roles | null;
        reviews?: __.Association.to.many<_sap_capire_bookshop.Reviews>;
      static readonly actions: Record<never, never>
  };
}
export class User extends _UserAspect(__.Entity) {}
Object.defineProperty(User, 'name', { value: 'AdminService.Users' })
Object.defineProperty(User, 'is_singular', { value: true })
export class Users extends Array<User> {$count?: number}
Object.defineProperty(Users, 'name', { value: 'AdminService.Users' })

export declare const sendMail: { (request: _.HelloRequest | null): _.HelloResponse | null, __parameters: {request: _.HelloRequest | null}, __returns: _.HelloResponse | null, kind: 'action'};