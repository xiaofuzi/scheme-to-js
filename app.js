import Lisp from './src/lisp.js';

let Interpreter = Lisp('(+ (/ 8 2) (* 3 3))');
console.log('Lisp>: ', Interpreter.run());