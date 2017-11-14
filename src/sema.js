const bablyon = require('babylon');
const fs = require('fs');

function main() {
    // 1. Read the file using the built-in library method fs.readFileSync() called with F
    const sampleFile = fs.readFileSync('./src/simpleProgram.js', 'utf-8');


    // 2. Use the Babylon package’s function `babylon.parse()` on the file,
    // returning the Abstract Syntax Tree assigned to the variable `A` (ast)
    const ast = bablyon.parse(sampleFile);

    const body = ast.program.body;
    // For each Node in the file, do the following:
    for (var i = 0; i < body.length; i++) {
        const node = body[i];
        // Examine the node to see if it is a Function Declaration.
        // If so, let `ids` be all named parameters to the function:
        if (node.type === "FunctionDeclaration") {
            const ids = node.params.map(param => param.name);
            console.log(ids);
        }
    }



}


main();

