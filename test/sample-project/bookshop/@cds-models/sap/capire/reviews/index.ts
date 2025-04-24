// This is an automatically generated file. Please do not change its contents manually!
import * as _ from './../../..';
import * as __ from './../../../_';

export type ReviewedSubject = string;
// enum
export const Rating = {
  Best: 5,
  Good: 4,
  Avg: 3,
  Poor: 2,
  Worst: 1,
} as const;
export type Rating = 5 | 4 | 3 | 2 | 1;

export function _ReviewAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Review extends Base {
    declare ID?: __.Key<string>;
    declare subject?: ReviewedSubject | null;
    /** Canonical user ID */
    declare reviewer?: _.User | null;
    declare rating?: Rating | null;
    declare title?: string | null;
    declare text?: string | null;
    declare date?: __.CdsDateTime | null;
    declare likes?: __.Composition.of.many<Likes>;
    declare liked?: number | null;
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Review>;
    declare static readonly elements: __.ElementsOf<Review>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
export class Review extends _ReviewAspect(__.Entity) {}
Object.defineProperty(Review, 'name', { value: 'sap.capire.reviews.Reviews' });
Object.defineProperty(Review, 'is_singular', { value: true });
export class Reviews extends Array<Review> {
  $count?: number;
}
Object.defineProperty(Reviews, 'name', { value: 'sap.capire.reviews.Reviews' });

export function _LikeAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Like extends Base {
    declare review?: __.Key<__.Association.to<Review>>;
    declare review_ID?: __.Key<string>;
    /** Canonical user ID */
    declare user?: __.Key<_.User>;
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Like>;
    declare static readonly elements: __.ElementsOf<Like>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
export class Like extends _LikeAspect(__.Entity) {}
Object.defineProperty(Like, 'name', { value: 'sap.capire.reviews.Likes' });
Object.defineProperty(Like, 'is_singular', { value: true });
export class Likes extends Array<Like> {
  $count?: number;
}
Object.defineProperty(Likes, 'name', { value: 'sap.capire.reviews.Likes' });
