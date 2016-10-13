import {
    ch, token,
    range,
    sequence,
    wsequence,
    choice,
    repeat1,
    action
} from '../src/parser.js';

import ps from '../src/state.js';

console.log(ch('+')(ps('++sdsdfsdfds')));