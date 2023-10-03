// This is an automatically generated file. Please do not change its contents manually!
import * as __ from './../_';
/**
* The current user
*/
export function _meAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class me extends Base {
        id?: string;
        locale?: string;
        tenant?: string;
    static actions: {
    }
  };
}
export class me extends _meAspect(__.Entity) {}
export class me_ extends Array<me> {}

// function
export declare const login: { (): me, __parameters: {}, __returns: me };