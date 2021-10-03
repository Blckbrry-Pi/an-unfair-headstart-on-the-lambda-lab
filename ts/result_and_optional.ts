export class Result<V, E> {
    private resultIsOk: boolean;

    private okValue?: V;
    private errValue?: E;


    private constructor(resultOk: boolean, value: V | E) {
        this.resultIsOk = resultOk;

        if (resultOk) {
            this.okValue = value as V;

        } else {
            this.errValue = value as E;
        }
    }

    static Ok<V, E>(value: V): Result<V, E> {
        return new Result<V, E>(true, value);
    }

    static Err<V, E>(errValue: E): Result<V, E> {
        return new Result<V, E>(false, errValue);
    }

    isOk(): boolean {
        return this.resultIsOk;
    }

    isErr(): boolean {
        return !this.resultIsOk;
    }

    unwrap(): Ok<this> {
        if (this.resultIsOk) return this.okValue as Ok<this>;
        else throw new Error("Method `.unwrap()` called on an Err value!");
    }

    unwrapErr(): E {
        if (!this.resultIsOk) return this.errValue as Err<this>;
        else throw new Error("Method `.unwrapErr()` called on an Ok value!");
    }
}

export type  Ok<R> = R extends Result<infer V, unknown> ? V : never;
export type Err<R> = R extends Result<unknown, infer E> ? E : never;



export class Optional<V> {
    private valueIsSome: boolean;
    private value?: V;

    private constructor(valueSome: boolean, value?: V) {
        this.valueIsSome = valueSome;
        if (valueSome) this.value = value as V;
    }

    static Some<V>(value: V): Optional<V> {
        return new Optional(true, value);
    }

    static None<V>(): Optional<V> {
        return new Optional(false);
    }

    isSome(): boolean {
        return this.valueIsSome;
    }

    isNone(): boolean {
        return !this.valueIsSome;
    }

    unwrap(): Some<this> {
        if (this.valueIsSome) return this.value as Some<this>;
        else throw new Error("Method `.unwrap()` valed on a None value!");
    }
}

export type Some<O> = O extends Optional<infer V> ? V : never;
