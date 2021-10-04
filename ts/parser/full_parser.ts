import { ParseError } from "../errors";
import lexer, { makeLexerPeekable } from "./lexer";
import LambdaLine from "./proper_parser";

import { Result } from "../result_and_optional";


type ParserReturnType = LambdaLine;


export default function parse(stringToEval: string): Result<ParserReturnType, ParseError> {
    const peekableLexer1 = makeLexerPeekable(lexer(stringToEval));
    const peekableLexer2 = makeLexerPeekable(lexer(stringToEval));
    
    try {
        const lambdaExpression = new LambdaLine(peekableLexer1, peekableLexer2);

        const next = peekableLexer2.next();
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
