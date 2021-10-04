import IRLine from "./ir/ir";

import { Result } from "./result_and_optional";
import { ParseError } from "./errors";
import parse from "./parser/full_parser";

export default function stringToIr(input: string): Result<IRLine, ParseError> {
    const result = parse(input);
    if (result.isOk()) {
        return Result.Ok(new IRLine(result.unwrap()));
    } else {
        return Result.Err(result.unwrapErr());
    }
}
