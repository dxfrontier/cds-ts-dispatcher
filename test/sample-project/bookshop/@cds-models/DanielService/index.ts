// This is an automatically generated file. Please do not change its contents manually!
import * as __ from './../_';

export default class {}

export function _DanAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Dan extends Base {
    declare ID?: __.Key<string>;
    declare name?: string | null;
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Dan>;
    declare static readonly elements: __.ElementsOf<Dan>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
 * Aspect for entities with canonical universal IDs
 *
 * See https://cap.cloud.sap/docs/cds/common#aspect-cuid
 */
export class Dan extends _DanAspect(__.Entity) {}
Object.defineProperty(Dan, 'name', { value: 'DanielService.Dans' });
Object.defineProperty(Dan, 'is_singular', { value: true });
/**
 * Aspect for entities with canonical universal IDs
 *
 * See https://cap.cloud.sap/docs/cds/common#aspect-cuid
 */
export class Dans extends Array<Dan> {
  $count?: number;
}
Object.defineProperty(Dans, 'name', { value: 'DanielService.Dans' });
