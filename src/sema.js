const bablyon = require('babylon');
const fs = require('fs');

function main() {
    const sampleFile = fs.readFileSync('./src/simpleProgram.js', 'utf-8');
    console.log(sampleFile);
    const ast = bablyon.parse(sampleFile);

    console.log(ast);
}


main();

