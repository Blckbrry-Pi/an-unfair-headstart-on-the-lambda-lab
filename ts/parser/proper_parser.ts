import { makeLexerPeekable } from "./lexer";

import { ParseError } from "../errors";

type LexerType = ReturnType<typeof makeLexerPeekable>;


export class LambdaApplication {
    constructor(
        public first: LambdaExpression,
        public second: LambdaExpression,
    ) {}
}

export class LambdaFunction {
    public varName: string;
    public expression: LambdaExpression;

    constructor(lxr: LexerType) {
        {
            const next = lxr.next();
            if (next.done) {
                throw new ParseError("Token", "End of String", {s: -1, e: -1});
            }
            const token = next.value;
    
            switch (token.getTokenType()) {
            case "dot": {
                throw new ParseError("variable binding", token, token.getSpan());
            }
    
            case "paren": {
                throw new ParseError("variable binding", token, token.getSpan());
            }
    
            case "lambda": {
                throw new ParseError("variable binding", token, token.getSpan());
            }
    
            case "assignment": {
                throw new ParseError("variable binding", token, token.getSpan());
            }
    
            case "var": {
                this.varName = token.getVarName().unwrap();
                break;
            }
            }
        }
    
        {
            const peek = lxr.peek();
            if (peek.done) {
                throw new ParseError("`.` or variable binding", "End of String", {s: -1, e: -1});
            }
            const token = peek.value;
    
            switch (token.getTokenType()) {
            case "assignment": {
                throw new ParseError("`.` or variable binding", token, token.getSpan());
            }
    
            case "dot": {
                lxr.next();
                break;
            }
    
            case "lambda": {
                throw new ParseError("`.` or variable binding", token, token.getSpan());
            }
    
            case "paren": {
                throw new ParseError("`.` or variable binding", token, token.getSpan());
            }
            
            case "var": {
                this.expression = new LambdaExpression(new LambdaFunction(lxr), false);
                return;
            }
            }
        }
        
        this.expression = new LambdaExpression(lxr, false);
    }
}


export default class LambdaExpression {
    public contents: string | LambdaFunction | LambdaApplication | LambdaExpression;

    constructor(lxrOrExprOrFuncOrString: LexerType | LambdaExpression | LambdaFunction | string, inParens: boolean) {
        if (typeof lxrOrExprOrFuncOrString === "string") { 
            this.contents = lxrOrExprOrFuncOrString;
        } else if (lxrOrExprOrFuncOrString instanceof LambdaFunction) {
            this.contents = lxrOrExprOrFuncOrString;
        } else if (lxrOrExprOrFuncOrString instanceof LambdaExpression) {
            this.contents = lxrOrExprOrFuncOrString.contents;
        } else {
            const lxr = lxrOrExprOrFuncOrString;

            const next = lxr.next();
            if (next.done) {
                throw new ParseError("token", "End of String", {s: -1, e: -1});
            }
            const token = next.value;

            switch (token.getTokenType()) {
            case "dot":
                throw new ParseError("expression", token, token.getSpan());
                
            case "assignment":
                throw new ParseError("expression", token, token.getSpan());
            
            case "lambda":
                this.contents = new LambdaFunction(lxr);
                break;

            case "paren":
                switch (token.getParenSide().unwrap()) {
                case "left":
                    this.contents = new LambdaExpression(lxr, true);
                    break;
                case "right":
                    throw new ParseError("expression", token, token.getSpan());
                }
                break;

            case "var":
                this.contents = token.getVarName().unwrap();
                break;
            }

            let exitLoop = false;

            while (!exitLoop) {
                const peeked = lxr.peek();
                if (peeked.done) {
                    if (inParens) throw new ParseError("`)` or expression", "End of String", {s: -1, e: -1});
                    else exitLoop = true;
                } else {
                    const token = peeked.value;
    
                    switch (token.getTokenType()) {
                    case "assignment": {
                        throw new ParseError("`)` or expression", token, token.getSpan());
                    }
    
                    case "dot": {
                        throw new ParseError("`)` or expression", token, token.getSpan());
                    }
    
                    case "lambda": {
                        lxr.next();
                        const expressionToApplyTo = new LambdaExpression(this, false);
                        
                        const functionToApply = new LambdaFunction(lxr);
                        const expressionToApply = new LambdaExpression(functionToApply, false);
                        
                        this.contents = new LambdaApplication(expressionToApplyTo, expressionToApply);
                        break;
                    }
    
                    case "paren": {
                        switch (token.getParenSide().unwrap()) {
                        case "left": {
                            lxr.next();
                            const expressionToApplyTo = new LambdaExpression(this, false);
    
                            const expressionToApply = new LambdaExpression(lxr, true);
    
                            this.contents = new LambdaApplication(expressionToApplyTo, expressionToApply);
                            break;
                        }
                        
                        case "right": {
                            if (inParens) {
                                lxr.next();
                            }
                            exitLoop = true;
                            break;
                        }
                        }
                        break;
                    }
    
                    case "var": {
                        lxr.next();
                        const expressionToApplyTo = new LambdaExpression(this, false);
                        
                        const expressionToApply = new LambdaExpression(token.getVarName().unwrap(), false);
    
                        this.contents = new LambdaApplication(expressionToApplyTo, expressionToApply);
                        break;
                    }
                    }
                }
            }
        }
    }
}
