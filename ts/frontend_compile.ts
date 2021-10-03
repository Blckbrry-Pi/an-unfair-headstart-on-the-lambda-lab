import IRExpr from "./ir/ir";

import { Result } from "./result_and_optional";
import { ParseError } from "./errors";
import parse from "./parser/full_parser";

export default function stringToIr(input: string): Result<IRExpr, ParseError> {
    const result = parse(input);
    if (result.isOk()) {
        const ir = new IRExpr(result.unwrap());
        ir.bindVars(new Map(), new Set());
        return Result.Ok(ir);
    } else {
        return Result.Err(result.unwrapErr());
    }
}
