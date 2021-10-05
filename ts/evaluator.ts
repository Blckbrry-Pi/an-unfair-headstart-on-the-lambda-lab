import { inspect } from "util";
import IRLine, { IRAppl, IRExpr, IRFunc } from "./ir/ir";
import { Result } from "./result_and_optional";

export type Context<O> = {[key: string]: O};

export default function evaluateIrResult(input: Result<IRLine, Error>, context: Context<IRLine>): Result<IRLine, Error> {
    if (input.isOk()) return Result.Ok(evaluateLine(input.unwrap(), context));
    else return Result.Err(input.unwrapErr());
}


export function evaluateLine(input: IRLine, context: Context<IRLine>): IRLine {
    if (input.contents === null) 0;
    else if (input.contents instanceof IRExpr) {
        input.bindVars();
        input.contents.substituteUnbound(context);
        console.log(inspect(input, true, Infinity, true));
        console.log(input.toString());
        input.bindVars();
        console.log(inspect(input, true, Infinity, true));
        console.log(input.toString());
        input.contents = evaluateExpr(input.contents.clone());
    } else {
        const name = input.contents.name;
        input.bindVars();
        input.contents.expr.substituteUnbound(context);
        input.bindVars();
        input.contents = evaluateExpr(input.contents.expr.clone());
        context[name] = input;
    }
    return input;
}



export function evaluateExpr(input: IRExpr): IRExpr {
    const evaledExpr = input.clone();
    if (evaledExpr.contents instanceof IRFunc) {
        evaledExpr.contents.body = evaluateExpr(evaledExpr.contents.body);
        return evaledExpr;
    }
    else if (evaledExpr.contents instanceof IRAppl) return evaluateAppl(evaledExpr.contents);
    else return input.clone();
}

export function evaluateAppl(input: IRAppl): IRExpr {
    if (input.first.contents instanceof IRFunc) {
        return evaluateExpr(applyFunc(input.first.contents, input.second));
    } else if (input.first.contents instanceof IRAppl) {
        const evaledFirst = evaluateAppl(input.first.contents);
        if (evaledFirst.contents instanceof IRFunc) return evaluateExpr(applyFunc(evaledFirst.contents, input.second));
        return new IRExpr(input);
    } else {
        const evaledAppl = input.clone();
        evaledAppl.second = evaluateExpr(evaledAppl.second);
        return new IRExpr(evaledAppl);
    }
}

export function applyFunc(input: IRFunc, termToApply: IRExpr): IRExpr {
    const appliedFunc = input.clone();
    if (appliedFunc.arg.type === "unbound") return appliedFunc.body.clone();
    appliedFunc.body.replaceBindings(appliedFunc.arg.bindingIndex, termToApply);
    return appliedFunc.body;
}
