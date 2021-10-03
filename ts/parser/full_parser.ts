import { ParseError } from "../errors";
import lexer, { makeLexerPeekable } from "./lexer";
import LambdaExpression from "./proper_parser";

import { Result } from "../result_and_optional";


type ParserReturnType = LambdaExpression;


export default function parse(stringToEval: string): Result<ParserReturnType, ParseError> {
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
        if (e instanceof ParseError) {
            return Result.Err(e);
        } else {
            throw e;
        }
    }
}
