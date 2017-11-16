const bablyon = require('babylon');
const fs = require('fs');


const nodesWithBodies = [
    'BlockStatement',
    'WithStatement',
    'LabeledStatement',
]

function main() {
    // 1. Read the file using the built-in library method fs.readFileSync() called with F
    const sampleFile = fs.readFileSync('./src/simpleProgram.js', 'utf-8');

    // 2. Use the Babylon package’s function `babylon.parse()` on the file,
    // returning the Abstract Syntax Tree assigned to the variable `A` (ast)
    const ast = bablyon.parse(sampleFile);

    const { body } = ast.program;
    // For each Node in the file, do the following:
    for (let i = 0; i < body.length; i++) {
        const node = body[i];
        // Examine the node to see if it is a Function Declaration.
        if (node.type === "FunctionDeclaration") {
            processFunction(node);
        }
    }
}

function processFunction(functionNode) {
    // If so, let `ids` be all named parameters to the function:
    const { params } = functionNode;
    const ids = params.map(param => param.name);
    // console.log(' The function node: ', functionNode, '\n');

    // side note: here we have to go into the function's block statement, as it contains everything:
    const allNodes = functionNode.body.body;

    // Examine each Statement in the Function Declaration Body, and for each:
    for (let i = 0; i < allNodes.length; i++) {
        const node = allNodes[i];
        // console.log('A function statement: ', node, '\n');

        //check if the statement is an Assignment Expression. If so:
        if (node.type === 'ExpressionStatement') {
            const expressionNode = node.expression;

            if (expressionNode.type === "AssignmentExpression") {
                // Examine the left hand side of the Assignment Expression, and if the result is an identifier, or a
                const { left, right } = expressionNode;
                // Member Expression with the object property being an Identifier contained within IDS:
                if (left.type === 'MemberExpression') {
                    // console.log('left', left, '\n');

                    if (left.object.type === 'Identifier' && ids.includes(left.object.name)) {
                        console.error('\n\n!!!Found a side effect node!');
                        console.log('Line ', left.loc.start.line, 'contains a side effect, with the identifier', left.object.name, '\n');
                    }
                }
            }
        }

        // any of these will have substatements we have to inspect:
        if (nodesWithBodies.includes(node.type)) {
            // add all of the substatements to the nodes we need to examine
            console.log('adding a body node:', node);
            allNodes.push(...node.body);
        }


        // choice statements will also have substatements:
        if (node.type === 'IfStatement') {
            console.log('adding an if statement node:', node);
            allNodes.push(node.test, node.consequent);
            if (node.alternate) {
                allNodes.push(node.alternate);
            }
        }

        if (node.type === 'SwitchStatement') {
            console.log('adding a switch statement node:', node);
            allNodes.push(node.discriminant);
            // get all the expressions, and filter out any null cases (for default:)
            allNodes.push(node.cases.map(switchCase => switchCase.test).filter(i => i));
            allNodes.push(node.cases.map(switchCase => switchCase.consequent));
        }
    }


    console.log('\n\n all nodes we found: ', allNodes);
}




main();

