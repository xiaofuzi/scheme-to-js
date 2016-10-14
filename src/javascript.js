import {
    ch, token,
    range,
    sequence,
    wsequence,
    choice,
    not,
    repeat1,
    action
} from './parser.js';


const Whitespace = choice('\t', " ");
const NewLine = choice('\r', '\n');

const SingleLineCommentString = repeat1(not(NewLine()));