import { Optional } from "../result_and_optional";

interface Lambda {
    readonly tokenType: "lambda";
}

interface Dot {
    readonly tokenType: "dot";
}

interface Paren {
    readonly tokenType: "paren";
    readonly side: "left" | "right";
}

interface Assignment {
    readonly tokenType: "assignment";
}

interface VarName {
    readonly tokenType: "var";
    readonly varName: string;
}


export interface Span {
    readonly s: number;
    readonly e: number;
}

export class Token {
    
    private token: VarName | Lambda | Dot | Paren | Assignment;
    private span: Span;

    constructor (stringToLex: string, startingLocation: number) {
        let currPointer = startingLocation;
        while (Token.isWhiteSpace(stringToLex, currPointer)) currPointer++;

        const currChar = stringToLex.charAt(currPointer);

        if (currChar.length === 0) throw new Error("Expected token, found `End of String`.");

        switch (currChar) {
        case "λ":
            this.token = {
                tokenType: "lambda",
            };
            this.span = {
                s: currPointer,
                e: currPointer + 1,
            };
            break;

        case ".":
            this.token = {
                tokenType: "dot",
            };
            this.span = {
                s: currPointer,
                e: currPointer + 1,
            };
            break;

        case "(":
        case ")":
            this.token = {
                tokenType: "paren",
                side: currChar === "(" ? "left" :"right",
            };
            this.span = {
                s: currPointer,
                e: currPointer + 1,
            };
            break;


        case ":":
            if (stringToLex.charAt(currPointer + 1) === "=") {
                this.token = {
                    tokenType: "assignment",
                };
                this.span = {
                    s: currPointer,
                    e: currPointer + 2,
                };
                break;
            }
            // Falls through if the curr char is ":", but the next char isn't "=".
        
        default:
            this.token = {
                tokenType: "var",
                varName: currChar,
            };
            this.span = {
                s: currPointer,
                e: currPointer + 1,
            };
            break;

        }
    }

    public getTokenType(): typeof this.token["tokenType"] {
        return this.token.tokenType;
    }

    public getVarName(): Optional<VarName["varName"]> {
        if (this.token.tokenType === "var") return Optional.Some(this.token.varName);
        else return Optional.None();
    }

    public getParenSide(): Optional<Paren["side"]> {
        if (this.token.tokenType === "paren") return Optional.Some(this.token.side);
        else return Optional.None();
    }

    public getSpan(): Readonly<Span> {
        return this.span;
    }

    private static isWhiteSpace(charString: string, charPos: number) {
        return /\s/g.test(charString.charAt(charPos));
    }
}


type Lexer = Generator<Token, void, void>;

export default function* lexer(stringToLex: string): Lexer {
    let currPos = 0;
    try {
        while (true) {
            const nextToken = new Token(stringToLex, currPos);
            yield nextToken;
            currPos = nextToken.getSpan().e;
        }
    } catch {}
}

interface PeekableInterface<T, TReturn, TNext> {
    peek(...args: [] | [TNext]): IteratorResult<T, TReturn>
} 

type Peekable<Gen> = Gen extends Generator<infer T, infer TReturn, infer TNext> ? Gen & PeekableInterface<T, TReturn, TNext> : never;

export function makeLexerPeekable(iterator: Lexer): Peekable<Lexer> {
    let state = iterator.next();
  
    const _i: Peekable<Lexer> = Object.assign(
        (function* (): Lexer {
            while (!state.done) {
                const current = state.value;
                state = iterator.next();
                yield current;
            }
            return state.value;
        })(),
        { peek: () => state },
    );
    return _i;
}


export function tokenToString(token: Token): string {
    switch (token.getTokenType()) {
    case "assignment":
        return ":=";

    case "dot": 
        return ".";

    case "lambda": 
        return "λ";

    case "paren": 
        return token.getParenSide().unwrap() === "left" ? "(" : ")";        

    case "var": 
        return token.getVarName().unwrap();
    }
}
