import LambdaExpression, { LambdaApplication, LambdaFunction } from "../parser/proper_parser";

interface BoundVar {
    readonly type: "bound";
    readonly bindingIndex: number;
}

interface UnboundVar {
    readonly type: "unbound";
    readonly name: string;
}

type IRVar = BoundVar | UnboundVar;

export default class IRExpr {
    public contents: IRVar | IRAppl | IRFunc;

    constructor(astExpr: LambdaExpression) {
        let currEvaluator = astExpr;
        while (currEvaluator.contents instanceof LambdaExpression) currEvaluator = currEvaluator.contents;

        const astContents = currEvaluator.contents;
        
        if (typeof astContents === "string") this.contents = {
            type: "unbound",
            name: astContents,
        };
        else if (astContents instanceof LambdaApplication) this.contents = new IRAppl(astContents);
        else this.contents = new IRFunc(astContents);
    }

    public bindVars(bindingStacks: Map<string, number[]>, usedIds: Set<number>): void {
        if (this.contents instanceof IRAppl || this.contents instanceof IRFunc) this.contents.bindVars(bindingStacks, usedIds);
        else if (this.contents.type === "unbound") {
            const bindingStack = bindingStacks.get(this.contents.name);
            if  (bindingStack) this.contents = {
                type: "bound",
                bindingIndex: bindingStack[0],
            };
        }
    }
}

export class IRAppl {
    public first: IRExpr;
    public second: IRExpr;

    constructor (astAppl: LambdaApplication) {
        this.first = new IRExpr(astAppl.first);
        this.second = new IRExpr(astAppl.second);
    }

    public bindVars(bindingStacks: Map<string, number[]>, usedIds: Set<number>): void {
        this.first.bindVars(bindingStacks, usedIds);
        this.second.bindVars(bindingStacks, usedIds);
    }
}

export class IRFunc {
    public arg: IRVar;
    public body: IRExpr;

    constructor (astFunc: LambdaFunction) {
        this.arg = {
            type: "unbound",
            name: astFunc.varName,
        };

        this.body = new IRExpr(astFunc.expression);
    }

    public bindVars(bindingStacks: Map<string, number[]>, usedIds: Set<number>): void {
        if (this.arg.type === "unbound") {
            const bindingStack = bindingStacks.get(this.arg.name) ?? [];

            const nextId = Array.from(usedIds.entries()).map(([, value]) => value).reduce((oldVal, newVal) => Math.max(oldVal, newVal), 0) + 1;
            usedIds.add(nextId);

            const newBindingStack = [nextId, ...bindingStack];

            bindingStacks.set(this.arg.name, newBindingStack);

            this.body.bindVars(bindingStacks, usedIds);

            bindingStacks.set(this.arg.name, bindingStack);

            this.arg = {
                type: "bound",
                bindingIndex: nextId,
            };
        }
    }
}
