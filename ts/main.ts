import evaluateIrResult, { Context } from "./evaluator";
import stringToIr from "./frontend_compile";
import IRLine from "./ir/ir";
import startRepl from "./repl";
import { Result } from "./result_and_optional";


function evaluate(command: string, context: Context<IRLine>): Result<IRLine, Error> {
    return evaluateIrResult(stringToIr(command), context);
}

function main() {
    startRepl("λ ", evaluate);
}

main();
