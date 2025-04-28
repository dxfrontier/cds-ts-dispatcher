// This is an automatically generated file. Please do not change its contents manually!
import * as _sap_capire_reviews from './../sap/capire/reviews';
import * as _ from './..';
import * as __ from './../_';

export default class {
  declare static readonly like: typeof like;
  declare static readonly unlike: typeof unlike;
}

export function _ReviewAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Review extends Base {
    declare ID?: __.Key<string>;
    declare subject?: _sap_capire_reviews.ReviewedSubject | null;
    /** Canonical user ID */
    declare reviewer?: _.User | null;
    declare rating?: _sap_capire_reviews.Rating | null;
    declare title?: string | null;
    declare text?: string | null;
    declare date?: __.CdsDateTime | null;
    declare liked?: number | null;
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Review>;
    declare static readonly elements: __.ElementsOf<Review>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
export class Review extends _ReviewAspect(__.Entity) {}
Object.defineProperty(Review, 'name', { value: 'ReviewsService.Reviews' });
Object.defineProperty(Review, 'is_singular', { value: true });
export class Reviews extends Array<Review> {
  $count?: number;
}
Object.defineProperty(Reviews, 'name', { value: 'ReviewsService.Reviews' });

// event
export declare class reviewed {
  declare subject: __.DeepRequired<Review>['subject'] | null;
  declare count: number | null;
  declare rating: number | null;
}

export declare const like: {
  // positional
  (review: __.Key<__.DeepRequired<Review>['ID']>): void | null;
  // named
  ({ review }: { review?: __.Key<__.DeepRequired<Review>['ID']> }): void | null;
  // metadata (do not use)
  __parameters: { review?: __.Key<__.DeepRequired<Review>['ID']> };
  __returns: void | null;
  kind: 'action';
};

export declare const unlike: {
  // positional
  (review: __.Key<__.DeepRequired<Review>['ID']>): void | null;
  // named
  ({ review }: { review?: __.Key<__.DeepRequired<Review>['ID']> }): void | null;
  // metadata (do not use)
  __parameters: { review?: __.Key<__.DeepRequired<Review>['ID']> };
  __returns: void | null;
  kind: 'action';
};
