import startRepl from "./repl";

import parse from "./parser/full_parser";

function main() {
    startRepl("λ ", parse);
}

main();
