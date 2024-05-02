// This is an automatically generated file. Please do not change its contents manually!

export namespace Association {
    export type to <T> = T;
    export namespace to {
        export type many <T extends readonly any[]> = T;
    }
}

export namespace Composition {
    export type of <T> = T;
    export namespace of {
        export type many <T extends readonly any[]> = T;
    }
}

export class Entity {
    static data<T extends Entity> (this:T, _input:Object) : T {
        return {} as T // mock
    }
}

export type EntitySet<T> = T[] & {
    data (input:object[]) : T[]
    data (input:object) : T
};

export type DeepRequired<T> = { 
    [K in keyof T]: DeepRequired<T[K]>
} & Exclude<Required<T>, null>;


/**
 * Dates and timestamps are strings during runtime, so cds-typer represents them as such.
 */
export type CdsDate = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;
/**
 * @see {@link CdsDate}
 */
export type CdsDateTime = string;
/**
 * @see {@link CdsDate}
 */
export type CdsTime = `${number}${number}:${number}${number}:${number}${number}`;
/**
 * @see {@link CdsDate}
 */
export type CdsTimestamp = string;
