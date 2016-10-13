import {
    ch, token,
    range,
    sequence,
    wsequence,
    choice,
    repeat1,
    action
} from './parser.js';

import Context from './context.js';

import ps from './state.js';

/**
 * atom parser
 */
function leftParen () {
    return ch('(');
}

function rightParen () {
    return ch(')');
}

function int () {
    return action(range('0', '9'), function(ast){
        return {
            type: 'NumberLiteral',
            value: ast
        }
    });
}

function identifer () {
    var result = repeat1(
                choice(
                        range('a', 'z'),
                        range('A', 'Z')
                    )            
                )
    return action(result, function(ast){
        return ast.join('');
    })
}

/**
 * simple expression (add 2 4)
 */
function atomCallExpression () {
    return function (state) {
        var result = wsequence(
                leftParen(),
                choice(
                    identifer(),
                    operator()
                    ),
                int(),
                int(),
                rightParen()
            )(state);
        return {
            remaining: result.remaining,
            matched: result.matched,
            ast: {
                type: 'CallExpression',
                name: result.ast[1],
                params: [
                    result.ast[2],
                    result.ast[3]            
                ]
            }
        };
    }
}

function callExpression () {
    return function (state) {
        var result = wsequence(
                leftParen(),
                choice(
                    identifer(),
                    operator()
                    ),
                choice(
                    int(),
                    atomCallExpression()
                    ),
                choice(
                    int(),
                    atomCallExpression()
                    ),
                rightParen()
            )(state);

        if (!result) {
            return result;
        }
        return {
            type: 'CallExpression',
            name: result.ast[1],
            params: [
                    result.ast[2],
                    result.ast[3]            
                ]
        };
    }
}

/**
 * 四则运算
 */
function operator () {
    return choice(
                '+',
                '-',
                '*',
                '/'
            );
}

function binaryExpression () {
    return function (state) {
        return action(
                wsequence(
                    leftParen(),
                    int(),
                    operator(),
                    int(),
                    rightParen()
                ), function (ast) {
                    return {
                        type: 'BinaryExpression',
                        operator: ast[2],
                        left: ast[1],
                        right: ast[3]
                    }
                })
    }
}

/**
 * Program
 */
function Programm (ast) {
    return {
        type: 'Programm',
        body: [
            ast
        ]
    }
}


function traverser (ast, visitor) {
    function traverseArray (arr, parent) {
        arr.forEach(function(child){
            traverseNode(child, parent);
        })
    }

    function traverseNode (node, parent) {
        var method = visitor[node.type];
        if (method) {
            method(node, parent);
        }

        switch (node.type) {
            case 'Programm':
                traverseArray(node.body, node);
                break;
            case 'CallExpression':
                traverseArray(node.params, node);
                break;
            case 'NumberLiteral':
                break;
            default: {
                throw new TypeError(node.type);
            }
        }
    }

    traverseNode(ast, null);
}

function transformer (ast) {
    var newAst = {
        type: 'Programm',
        body: []
    }

    ast._context = newAst.body;

    traverser(ast, {
        NumberLiteral: function(node, parent){
            parent._context.push({
                type: 'NumberLiteral',
                value: node.value
            })
        },
        CallExpression: function(node, parent){
            var expression = {
                type: 'CallExpression',
                callee: {
                    type: 'Identifier',
                    name: node.name
                },
                arguments: []
            }
            node._context = expression.arguments;
            if (parent.type !== 'CallExpression') {
                expression = {
                    type: 'ExpressionStatement',
                    expression: expression
                }
            }

            parent._context.push(expression);
        }
    })

    return newAst;
}


function codeGenerator (node) {
    switch (node.type) {
        case 'Programm':
            return node.body.map(codeGenerator).join('\n');
        case 'ExpressionStatement':
            return codeGenerator(node.expression) + ';';
        case 'CallExpression':
            return (
                codeGenerator(node.callee) + '(' + node.arguments.map(codeGenerator).join(', ') + ')'
                )
        case 'Identifier':
            return node.name;
        // For `NumberLiterals` we'll just return the `node`'s value.
        case 'NumberLiteral':
          return node.value;

        // And if we haven't recognized the node, we'll throw an error.
        default:
          throw new TypeError(node.type);
    }
}


/**
 * runtime helper
 */
const runtime = {
    operator: {
        '+' (p1, p2) {
            return Number(p1) + Number(p2);
        },
        '-' (p1, p2) {
            return Number(p1) - Number(p2);
        },
        '*' (p1, p2) {
            return Number(p1) * Number(p2);
        },
        '/' (p1, p2) {
            return Number(p1) / Number(p2);
        }
    }
}

/**
 * @private helper function
 */
function oneOf (val, arr=[]) {
    let isMatch = false;
    arr.forEach(function(key){
        if (val == key) {
            isMatch = true;
        }
    })

    return isMatch;
}

/**
 * 全局上下文
 */
const globalContext = new Context();
let currentContext = globalContext;

const operators = ['+', '-', '*', '/'];

function Interpreter (node) {
    switch (node.type) {
        case 'Programm':
            return Interpreter(node.body[0]);
        case 'ExpressionStatement': {
            return Interpreter(node.expression);
        }
        case 'CallExpression':{
            let callee = Interpreter(node.callee);
            if (oneOf(callee, operators)) {
                return runtime.operator[callee](Interpreter(node.arguments[0]), Interpreter(node.arguments[1]));
            } else {
                return 0;
            }
        }
        case 'Identifier':
            return node.name;
        // For `NumberLiterals` we'll just return the `node`'s value.
        case 'NumberLiteral':
          return node.value;

        // And if we haven't recognized the node, we'll throw an error.
        default: {
            throw new TypeError(node.type);
        }
    }
}


export default function (code) {
    let api = {};

    let state = ps(code);

    let ast = Programm(callExpression()(state));
    let newAst = transformer(ast);

    api.code = code;
    api.state = state;
    api.ast = ast;
    api.newAst = newAst;
    
    api.run = function () {
        return Interpreter(newAst);
    };    

    return api;
}
