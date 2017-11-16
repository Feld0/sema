const bablyon = require('babylon');
const fs = require('fs');


const BLACKLIST_FUNCTIONS = [
    // array functions
    'splice',
    'fill',
    'shift',
    'unshift',
];

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

    const allNodes = pullAllStatements([functionNode.body]);

    let sideEffectsAccumulator = [];

    // Examine each Statement in the Function Declaration Body, and for each:
    for (let i = 0; i < allNodes.length; i++) {
        const node = allNodes[i];
        // console.log('A function statement: ', node, '\n');

        //check if the statement is an Assignment Expression. If so:
        if (node.type === "AssignmentExpression") {
            // Examine the left hand side of the Assignment Expression, and if the result is an identifier, or a
            const { left, right } = node;

            // Member Expression with the object property being an Identifier contained within IDS:
            if (left.type === 'MemberExpression') {

                if (left.object.type === 'Identifier' && ids.includes(left.object.name)) {
                    // console.error('\n\n!!!Found a side effect node!');
                    // console.log('Line ', left.loc.start.line, 'contains a side effect, with the identifier', left.object.name, '\n');
                    sideEffectsAccumulator = sideEffectsAccumulator.concat(
                        `Line ${left.loc.start.line} contains a side effect, namely modifing the identifier ${left.object.name}, which is bound in the function named ${functionNode.id.name} at line ${functionNode.loc.start.line}`
                    );
                }
            }
        }

        if (node.type === 'CallExpression') {
            if (BLACKLIST_FUNCTIONS.includes(node.callee.property.name)) {
                sideEffectsAccumulator =  sideEffectsAccumulator.concat(
                    `Line ${node.loc.start.line} contains a blacklisted function, namely "${node.callee.property.name}". Please replace this with a function that does not mutate.`
                );
            }
        }
    }

    if (sideEffectsAccumulator.length > 1) {
        console.error(sideEffectsAccumulator);
    } else {
        console.log(`The given function ${functionNode.id.name} has no side effects or mutations we could find. Congratulations!`);
    }
}


function pullAllStatements(nodesToInspect, allResults = []) {
    if (nodesToInspect.length < 1) {
        return allResults;
    }

    // we'll just examine the first element, and recurse with rest later
    const node = nodesToInspect[0];
    const restNodes = nodesToInspect.slice(1);

    let nodesToAdd;

    switch(node.type) {
        case 'BlockStatement':
        case 'WithStatement':
        case 'LabeledStatement':
            const resultingNodesToInspect = restNodes.concat(...node.body);
            return pullAllStatements(resultingNodesToInspect, allResults);
        case 'IfStatement':
            // only add the alternate if it's there
            nodesToAdd = node.alternate
                ? [ node.test, node.consequent, node.alternate ]
                : [ node.test, node.consequent ];

            return pullAllStatements(
                restNodes.concat(...nodesToAdd),
                allResults
            );
        case 'SwitchStatement':
            nodesToAdd = [
                node.discriminant,
                // add all the test cases, but also remove the default (which will be null for test)
                ...(node.cases.map(switchCase => switchCase.test).filter(i => i)),
                ...(node.cases.map(switchCase => switchCase.consequent)),
            ];

            return pullAllStatements(restNodes.concat(...nodesToAdd), allResults);
        case 'ExpressionStatement':
            return pullAllStatements(restNodes.concat(node.expression), allResults);
        default:
            // otherwise this node is good and doesn't have subsequent bodies, so we'll just add it to the results!
            return pullAllStatements(restNodes, allResults.concat(node));
    }
}



main();

