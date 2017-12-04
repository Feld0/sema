const bablyon = require('babylon');
const fs = require('fs');

const reportTypes = {
    MUTATION: 'Mutation',
    BLACKLIST: 'Blacklist',
}

const BLACKLIST_FUNCTIONS = [
    // array functions
    'splice',
    'fill',
    'shift',
    'push',
    'pop',
    'unshift',
];

function sema(fileToRead) {
    // 1. Read the file using the built-in library method fs.readFileSync() called with F
    const sampleFile = fs.readFileSync(fileToRead, 'utf-8');

    // 2. Use the Babylon package’s function `babylon.parse()` on the file,
    // returning the Abstract Syntax Tree assigned to the variable `A` (ast)
    const ast = bablyon.parse(sampleFile, { sourceType: 'module', plugins: [
        'objectRestSpread'
    ]});

    let allFunctionResults = [];

    // todo: add class support
    const { body } = ast.program;
    // For each Node in the file, do the following:
    for (let i = 0; i < body.length; i++) {
        const node = body[i];
        // Examine the node to see if it is a Function Declaration, or an arrow function declaration
        if (node.type === "FunctionDeclaration") {
            allFunctionResults = allFunctionResults.concat(processFunction(node));
        } else if (node.type === 'VariableDeclaration') {
            // arrow function declarations are bound through levels of variableDeclaration and variabledeclarator,
            // so we'll collapse them here
            allFunctionResults = allFunctionResults.concat(...(node.declarations
                    .reduce((acc, curr) => {
                        // Only concat every ArrowFunctionExpression
                        if (curr.type === 'VariableDeclarator' && curr.init.type === 'ArrowFunctionExpression') {
                            return acc.concat(curr.init)
                        }
                        return acc;
                    }, [])
                    .map(processFunction)
            ));
        }
    }

    if (allFunctionResults.filter(r => typeof r === 'string').length === 0) {
        // console.log('We found no side effects');
        console.log("\033[32m", `For file ${fileToRead}:`, "\033[32m");
        console.log("\033[32m", 'We found no side effects', "\033[32m");
        console.log('\n');
        return;
    }

    console.log("\033[31m", `For file ${fileToRead}:`, "\033[31m\n");
    for (let i = 0; i < allFunctionResults.length; i++) {
        if (typeof allFunctionResults[i] === "string") {
            console.log("\033[31m\t", allFunctionResults[i], "\033[31m\n");
        } else {
            // we won't do anything if there was no bad stuff to ferret out bad results
            // console.log("\033[31m", allFunctionResults[i], "\033[31m");
        }
    }

    console.log('\n');
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
                        `Line ${left.loc.start.line} contains a side effect, namely modifing the identifier ${left.object.name}, at declaration line ${functionNode.loc.start.line}`
                    );
                }
            }
        }

        if (node.type === 'CallExpression') {
            // only want to look at the function if it is a property of an object (all built-ins are property calls)
            if (node.callee.property && BLACKLIST_FUNCTIONS.includes(node.callee.property.name)) {
                sideEffectsAccumulator =  sideEffectsAccumulator.concat(
                    `Line ${node.loc.start.line} contains a blacklisted function, namely "${node.callee.property.name}". Please replace this with a function that does not mutate.`
                );
            }
        }
    }

    if (sideEffectsAccumulator.length > 0) {
        return sideEffectsAccumulator;
    } else {
        // let funName;
        // if (functionNode.id) {
        //     funName = functionNode.id.name;
        // } else {
        //     funName = `anonymously bound at line ${functionNode.loc.start.line}`;
        // }
        // return `The given function ${funName} has no side effects or mutations we could find. Congratulations!`;
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



function main() {
    const dirToProcess = process.argv[2] || './src/';
    fs.readdirSync(dirToProcess).forEach(filename => sema(`${dirToProcess}/${filename}`));

}
main();

