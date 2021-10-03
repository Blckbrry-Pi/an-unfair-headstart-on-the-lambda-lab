import { ParseError } from "./errors";
import lexer, { makeLexerPeekable } from "./parser/lexer";
import LambdaExpression from "./parser/proper_parser";

import { Result } from "./result_and_optional";


type ParserReturnType = LambdaExpression;


export default function parse(stringToEval: string): Result<ParserReturnType, Error> {
    const peekableLexer = makeLexerPeekable(lexer(stringToEval));
    try {
        const lambdaExpression = new LambdaExpression(peekableLexer, false);

        const next = peekableLexer.next();
        if (next.done) {
            return Result.Ok(lambdaExpression);
        } else {
            return Result.Err(new ParseError("`End of String`", next.value, next.value.getSpan()));
        }
    } catch (e) {
        if (e instanceof Error) {
            return Result.Err(e);
        } else {
            return Result.Err(new TypeError("Type thrown in parsing of lambda expression is not an Error."));
        }
    }
}
