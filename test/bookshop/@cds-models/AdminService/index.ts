// This is an automatically generated file. Please do not change its contents manually!
import cds from '@sap/cds'
import * as _ from './..';
import * as __ from './../_';
import * as _sap_capire_bookshop from './../sap/capire/bookshop';

export class AdminService extends cds.Service {
  declare sendMail: typeof sendMail
}
export default AdminService

export function _UserActivityLogAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class UserActivityLog extends Base {
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare ID?: __.Key<number>
    declare actionType?: string | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<UserActivityLog>;
    declare static readonly elements: __.ElementsOf<UserActivityLog>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class UserActivityLog extends _UserActivityLogAspect(__.Entity) {static drafts: __.DraftOf<UserActivityLog>}
Object.defineProperty(UserActivityLog, 'name', { value: 'AdminService.UserActivityLog' })
Object.defineProperty(UserActivityLog, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class UserActivityLog_ extends Array<UserActivityLog> {static drafts: __.DraftsOf<UserActivityLog>
$count?: number}
Object.defineProperty(UserActivityLog_, 'name', { value: 'AdminService.UserActivityLog' })

export function _PromotionAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Promotion extends Base {
    declare ID?: __.Key<number>
    declare name?: string | null
    declare description?: string | null
    declare startDate?: __.CdsDate | null
    declare endDate?: __.CdsDate | null
    declare discount?: number | null
    declare books?: __.Association.to.many<_sap_capire_bookshop.Books>
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Promotion>;
    declare static readonly elements: __.ElementsOf<Promotion>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
export class Promotion extends _PromotionAspect(__.Entity) {static drafts: __.DraftOf<Promotion>}
Object.defineProperty(Promotion, 'name', { value: 'AdminService.Promotions' })
Object.defineProperty(Promotion, 'is_singular', { value: true })
export class Promotions extends Array<Promotion> {static drafts: __.DraftsOf<Promotion>
$count?: number}
Object.defineProperty(Promotions, 'name', { value: 'AdminService.Promotions' })

export function _UserAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class User extends Base {
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare ID?: __.Key<number>
    declare username?: string | null
    declare email?: string | null
    declare role?: _.Roles | null
    declare reviews?: __.Association.to.many<_sap_capire_bookshop.Reviews>
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<User>;
    declare static readonly elements: __.ElementsOf<User>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class User extends _UserAspect(__.Entity) {}
Object.defineProperty(User, 'name', { value: 'AdminService.Users' })
Object.defineProperty(User, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Users extends Array<User> {$count?: number}
Object.defineProperty(Users, 'name', { value: 'AdminService.Users' })


export declare const sendMail:  {
  // positional
  (request: _.HelloRequest | null): globalThis.Promise<_.HelloResponse | null> | _.HelloResponse | null
  // named
  ({request}: {request?: _.HelloRequest | null}): globalThis.Promise<_.HelloResponse | null> | _.HelloResponse | null
  // metadata (do not use)
  __parameters: {request?: _.HelloRequest | null}, __returns: globalThis.Promise<_.HelloResponse | null> | _.HelloResponse | null
  kind: 'action'
}