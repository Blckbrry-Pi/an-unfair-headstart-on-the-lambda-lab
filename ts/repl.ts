import { inspect } from "util";

import Repl from "repl";

import { Result, Ok, Err } from "./result_and_optional";

import formatError, { ParseError, ErrorWithContext } from "./errors";

import { Context } from "./evaluator";


export default function startRepl<R extends Result<unknown, Error>>(prompt: string, evalFunc: (stringIn: string, context: Context<Ok<R>>) => R ): void {
    Repl.start({
        prompt,
        eval: (command: string, context: Context<Ok<R>>, fileName: string, callback: (error: ErrorWithContext<Err<R>> | Repl.Recoverable | null, ok?: Ok<R>) => void) => {
            const result = evalFunc(command, context);
            if (result.isOk()) {
                const outputValue = result.unwrap();

                callback(null, outputValue);
            } else {
                const errorValue = result.unwrapErr();

                if (errorValue instanceof ParseError && errorValue.foundString.toLowerCase().includes("end")) callback(new Repl.Recoverable(errorValue));
                else callback(new ErrorWithContext(errorValue as Err<R>, command, fileName));
            }
        },
        writer: (input) => input instanceof ErrorWithContext ? formatError(input) : inspect(input, true, Infinity, true),
        preview: false,
    });
}
