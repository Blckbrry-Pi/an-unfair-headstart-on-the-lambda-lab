import LambdaLine, { LambdaExpression, LambdaApplication, LambdaFunction } from "../parser/proper_parser";

interface BoundVar {
    readonly type: "bound";
    readonly bindingIndex: number;
    readonly origName: string;
}

interface UnboundVar {
    readonly type: "unbound";
    readonly name: string;
}

type IRVar = BoundVar | UnboundVar;

export class IRExpr {
    public contents: IRVar | IRAppl | IRFunc;

    constructor(expr: LambdaExpression | IRExpr | IRAppl) {
        if (expr instanceof LambdaExpression) {
            let currEvaluator = expr;
            while (currEvaluator.contents instanceof LambdaExpression) currEvaluator = currEvaluator.contents;
    
            const astContents = currEvaluator.contents;
            
            if (typeof astContents === "string") this.contents = {
                type: "unbound",
                name: astContents,
            };
            else if (astContents instanceof LambdaApplication) this.contents = new IRAppl(astContents);
            else this.contents = new IRFunc(astContents);
        } else if (expr instanceof IRAppl) {
            this.contents = expr;
        } else {
            if (expr.contents instanceof IRAppl || expr.contents instanceof IRFunc) {
                this.contents = expr.contents.clone();
            } else this.contents = expr.contents;
        }
    }

    public bindVars(bindingStacks: Map<string, number[]>, usedIds: Set<number>): void {
        if (this.contents instanceof IRAppl || this.contents instanceof IRFunc) this.contents.bindVars(bindingStacks, usedIds);
        else if (this.contents.type === "unbound") {
            const bindingStack = bindingStacks.get(this.contents.name);
            if  (bindingStack) this.contents = {
                type: "bound",
                bindingIndex: bindingStack[0],
                origName: this.contents.name,
            };
        }
    }

    public toString(bindings: Map<string, number>): string {
        if (this.contents instanceof IRAppl || this.contents instanceof IRFunc) return `(${this.contents.toString(bindings)})`; 
        else return getVarNameFromBindings(this.contents, bindings);
    }

    public clone(): IRExpr {
        return new IRExpr(this);
    }

    public replaceBindings(bindingId: number, expression: IRExpr): void {
        if (this.contents instanceof IRAppl || this.contents instanceof IRFunc) this.contents.replaceBindings(bindingId, expression);
        else if (this.contents.type === "bound" && this.contents.bindingIndex === bindingId) this.contents = expression.contents;
    }


    public reserveUnbound(reserved: Map<string, number>): Map<string, number> {
        if (this.contents instanceof IRAppl || this.contents instanceof IRFunc) return this.contents.reserveUnbound(reserved);
        else if (this.contents.type === "unbound") {
            reserved.set(this.contents.name, -1);
            return reserved;
        }
        else return reserved;
    }
}

export class IRAppl {
    public first: IRExpr;
    public second: IRExpr;

    constructor (appl: LambdaApplication | IRAppl) {
        if (appl instanceof LambdaApplication) { 
            this.first = new IRExpr(appl.first);
            this.second = new IRExpr(appl.second);
        } else {
            this.first  = appl.first .clone();
            this.second = appl.second.clone();
        }
    }

    public bindVars(bindingStacks: Map<string, number[]>, usedIds: Set<number>): void {
        this.first.bindVars(bindingStacks, usedIds);
        this.second.bindVars(bindingStacks, usedIds);
    }

    public toString(bindings: Map<string, number>): string {
        return `${this.first.toString(bindings)}${this.second.toString(bindings)}`;
    }

    public clone(): IRAppl {
        return new IRAppl(this);
    }

    public replaceBindings(bindingId: number, expression: IRExpr): void {
        this.first.replaceBindings(bindingId, expression);
        this.first.replaceBindings(bindingId, expression);
    }

    public reserveUnbound(reserved: Map<string, number>): Map<string, number> {
        return this.second.reserveUnbound(this.first.reserveUnbound(reserved));
    }

}

export class IRFunc {
    public arg: IRVar;
    public body: IRExpr;

    constructor (func: LambdaFunction | IRFunc) {
        if (func instanceof LambdaFunction) {
            this.arg = {
                type: "unbound",
                name: func.varName,
            };
    
            this.body = new IRExpr(func.expression);
        } else {
            this.arg = func.arg;
            this.body = func.body.clone();
        }
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
                origName: this.arg.name,
            };
        }
    }

    public toString(bindings: Map<string, number>): string {
        let currArgs = "";
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let currFunc: IRFunc = this;
        currArgs += getVarNameFromBindings(this.arg, bindings);
        while (currFunc.body.contents instanceof IRFunc) {
            currFunc = currFunc.body.contents;

            currArgs += getVarNameFromBindings(currFunc.arg, bindings);
        } 
        return `λ${currArgs}.${currFunc.body.toString(bindings)}`;
    }

    
    public clone(): IRFunc {
        return new IRFunc(this);
    }

    public replaceBindings(bindingId: number, expression: IRExpr): void {
        this.body.replaceBindings(bindingId, expression);
    }

    public reserveUnbound(reserved: Map<string, number>): Map<string, number> {
        return this.body.reserveUnbound(reserved);
    }
}

interface IRAssign {
    name: string,
    expr: IRExpr
}

type IRLineContents = IRAssign | IRExpr | null;

export default class IRLine {
    public contents: IRLineContents;
    
    constructor(input: LambdaLine) {
        if (input.contents === null) this.contents = null;
        else if (input.contents instanceof LambdaExpression) {
            this.contents = new IRExpr(input.contents);
            this.contents.bindVars(new Map(), new Set());
        }
        else {
            this.contents = {
                name: input.contents.varName,
                expr: new IRExpr(input.contents.expression),
            };
            this.contents.expr.bindVars(new Map(), new Set());
        }
    }

    public toString(): string {
        if (this.contents === null) return "[empty line]";
        else if (this.contents instanceof IRExpr) {
            const reservedBindings = this.contents.reserveUnbound(new Map());
            return this.contents.toString(reservedBindings);
        }
        else {
            const reservedBindings = this.contents.expr.reserveUnbound(new Map());
            return `${this.contents.name} := ${this.contents.expr.toString(reservedBindings)}`;
        }
    }
}

function nextVarName(currentBindings: Map<string, number>) {
    const listOfChars = "abcdefghijklmnopqrstuvwxyzαβγδεζηθικμνξρςστυφχψωABCDEFGHIJKLMNOPQRSTUVWXYZΑΓΔΘΛΞΠΣΦΨΩΪΫάέήίΰⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß";
    let index = -1; 
    Array.from(currentBindings.entries()).forEach(([varName]) => index = Math.max(index, listOfChars.indexOf(varName)));
    return listOfChars.charAt(index + 1);
}

function nameFromBindingId(bindings: Map<string, number>, bindingId: number): string | undefined {
    for (const [name, id] of bindings) if (id === bindingId) return name;
}

function getVarNameFromBindings(variable: IRVar, bindings: Map<string, number>): string {
    if (variable.type === "unbound") return variable.name;
    else {
        if (bindings === undefined) throw Error("What the heck");
        const boundToOrigName = bindings.get(variable.origName);
        if (boundToOrigName === variable.bindingIndex) return variable.origName;
        else if (boundToOrigName === undefined) {
            bindings.set(variable.origName, variable.bindingIndex);
            return variable.origName;
        } else {
            const name = nameFromBindingId(bindings, variable.bindingIndex);
            if (name === undefined) {
                const newName = nextVarName(bindings);
                bindings.set(newName, variable.bindingIndex);
                return newName;
            } else {
                return name;
            }
        }
    }
}

function getVarName(variable: IRVar): string {
    return variable.type === "bound" ? variable.origName : variable.name;
}
