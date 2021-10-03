import { inspect } from "util";
import { Token, Span, tokenToString } from "./parser/lexer";

export class ErrorWithContext<E extends Error> extends Error {
    public innerError: E;
    public context: string;
    public fileName: string;

    constructor(innerError: E, context: string, fileName: string) {
        super(innerError.message);
        this.innerError = innerError;
        this.context = context;
        this.fileName = fileName;
    }
}


export class ParseError extends SyntaxError {
    public expected: string;
    public found: Token | string;
    public foundString: string;
    public span: Readonly<Span>;

    constructor(expected: string, found: Token | string, span: Readonly<Span>) {
        const foundString = found instanceof Token ? tokenToString(found) : found;
        const errorMessage = `Expected ${expected}, found \`${foundString}\``;
        super(errorMessage);
        this.expected = expected;
        this.found = found;
        this.foundString = foundString;
        this.span = span;
    }
}

function indexToLineCol(source: string, index: number): { line: number, col: number } {
    let line: number;
    let col: number;
    
    const lines = source.split("\n");

    if (index >= 0) {
        let charsLeft = index;
        let lineNum = 1;
        
        for (const line of lines) {
            if (charsLeft >= line.length + 1) {
                lineNum++;
                charsLeft -= line.length + 1;
            } else break;
        }
        line = lineNum;
        col = charsLeft + 1;
    } else {
        line = lines.length;
        col = lines[lines.length - 1].length;
    }

    return { line, col };
}


function formatParseErrorWithContext(parseError: ParseError, context: string, fileName: string): string {
    const position = indexToLineCol(context, parseError.span.s);

    const lines = context.split("\n");

    let currString = "";
    currString += `${fileName}:${position.line}:${position.col}:\x1b[31m error:\x1b[0m ${parseError.message}\n`;

    currString += lines[position.line - 1];

    currString += "\n";

    currString += " ".repeat(position.col - 1) + "\x1b[31m^" + "~".repeat(parseError.span.e - parseError.span.s - 1) + "\x1b[0m";

    return currString;

}

export default function formatError(error: ErrorWithContext<Error>): string {
    if (error.innerError instanceof ParseError) {
        return `Parser Error\n${formatParseErrorWithContext(error.innerError, error.context, error.fileName)}`;
    } else {
        return inspect(error.innerError);
    }
}
