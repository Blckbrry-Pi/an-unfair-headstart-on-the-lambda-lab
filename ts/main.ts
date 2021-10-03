import stringToIr from "./frontend_compile";
import startRepl from "./repl";

function main() {
    startRepl("λ ", stringToIr);
}

main();
