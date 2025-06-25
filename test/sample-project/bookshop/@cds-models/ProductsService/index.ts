// This is an automatically generated file. Please do not change its contents manually!
import * as __ from './../_';

export default class {
}

export function _ProductAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Product extends Base {
    declare ID?: __.Key<string>
    declare name?: string | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Product>;
    declare static readonly elements: __.ElementsOf<Product>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
export class Product extends _ProductAspect(__.Entity) {}
Object.defineProperty(Product, 'name', { value: 'ProductsService.Products' })
Object.defineProperty(Product, 'is_singular', { value: true })
export class Products extends Array<Product> {$count?: number}
Object.defineProperty(Products, 'name', { value: 'ProductsService.Products' })
