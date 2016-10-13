import { hash } from './utils.js';

/**
 * Context class
 */
export default class Context {
    constructor(obj=hash()){
        this.$scope = hash();
        this.$parent = null;
        this.$children = [];
        this.$name = '__context__';

        this.assign(obj);
    }

    isContext (obj=hash()) {
        if (obj.name === this.$name) {
            return true;
        } else {
            return false;
        }
    }

    parent (obj) {
        if (obj) {
            if (this.isContext(obj)) {
                this.$parent = obj;
            } else {
                throw TypeError(obj);
            }
        } else {
            return this.$parent;
        }
    }

    children (obj) {
        if (obj) {
            if (this.isContext(obj)) {
                this.$children.push(obj);
            } else {
                throw TypeError(obj);
            }
        } else {
            return this.$children;
        }
    }

    get (key) {
        return this.$scope[key];
    }

    add (key, value) {
        this.$scope[key] = value;
    }

    remove (key) {
        delete this.$scope[key];
    }

    assign (obj={}) {
        this.$scope = {
            ...obj,
            ...this.$scope
        }
    }
}