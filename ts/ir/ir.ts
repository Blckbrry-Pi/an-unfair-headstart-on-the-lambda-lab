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
                origName: this.contents.name,
            };
        }
    }

    public toString(bindings: Map<number, string>): string {
        if (this.contents instanceof IRAppl || this.contents instanceof IRFunc) return `(${this.contents.toString(bindings)})`; 

        return this.contents.type === "bound" ? this.contents.origName : this.contents.name;
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

    public toString(bindings: Map<number, string>): string {
        return `${this.first.toString(bindings)}${this.second.toString(bindings)}`;
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
                origName: this.arg.name,
            };
        }
    }

    public toString(bindings: Map<number, string>): string {
        let currArgs = "";
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let currFunc: IRFunc = this;
        currArgs += getVarName(this.arg);
        while (currFunc.body.contents instanceof IRFunc) {
            currFunc = currFunc.body.contents;
            currArgs += getVarName(currFunc.arg);
        } 
        return `λ${currArgs}.${currFunc.body.toString(bindings)}`;
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
        else if (this.contents instanceof IRExpr) return this.contents.toString(new Map());
        else return `${this.contents.name} := ${this.contents.expr.toString(new Map())}`;
    }
}

function nextVarName(currentBindings: Map<number, string>) {
    const listOfChars = "abcdefghijklmnopqrstuvwxyzαβγδεζηθικμνξρςστυφχψωABCDEFGHIJKLMNOPQRSTUVWXYZΑΓΔΘΛΞΠΣΦΨΩΪΫάέήίΰⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß";
    let index = -1; 
    Array.from(currentBindings.entries()).forEach(([, varName]) => index = Math.max(index, listOfChars.indexOf(varName)));
    return listOfChars.charAt(index + 1);
}

function getVarName(variable: IRVar): string {
    return variable.type === "bound" ? variable.origName : variable.name;
}
