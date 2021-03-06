import { isNil } from "ramda"
import { DEBUG } from "./index"

export function isSomething(obj) {
    return !isNil(obj)
}

export function error(message) {
    throw new Error(message)
}

export function generateNames() {
    const result = []
    const limit = 'z'.charCodeAt(0)
    for (let i = 'a'.charCodeAt(0); i <= limit; i++) {
        result.push(String.fromCharCode(i))
    }

    return result
}

export function log(message) {
    if (DEBUG) {
        console.log(message)
    }
}