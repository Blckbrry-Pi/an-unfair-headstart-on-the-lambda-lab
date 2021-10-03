import startRepl from "./repl";

import parse from "./parser";

function main() {
    startRepl("λ ", parse);
}

main();
