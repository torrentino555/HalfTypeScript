import { clone, identity, isNil, times, values } from "ramda"
import { isSomething } from "./utils"

let EXPRESSION_COUNTER = 0

// e -> index
// value -> type
export class Environment {
    constructor(prevTypes = {}) {
        this.types = prevTypes
    }

    insert({ index }, type) {
        const newTypes = clone(this.types)
        newTypes[ index ] = type
        return new Environment(newTypes)
    }

    lookup({ index }) {
        return this.types[ index ]
    }

    clone() {
        return new Environment(clone(this.types))
    }

    map(func) {
        const entries = Object.entries(this.types)
        const newEntries = entries.map(([ key, value ]) => {
            return [
                key,
                func(value)
            ]
        })
        return new Environment(Object.fromEntries(newEntries))
    }
}

export function typeToString(item) {
    if (isNil(item)) {
        return ''
    }

    if (item.type === TYPE.CONST) {
        return " * "
    }

    if (item.type === TYPE.TY_VAR) {
        return ` ${ item.name } `
    }

    if (item.type === TYPE.ARROW) {
        const { leftType, rightType } = item

        if (leftType.type === TYPE.CONST) {
            return "* -> " + typeToString(rightType)
        }

        if (leftType.type === TYPE.TY_VAR) {
            return leftType.name  + " -> " + typeToString(rightType)
        }

        return "(" + typeToString(leftType) + ") -> " + typeToString(rightType)
    }
}

export function exprToString(item) {
    if (item.type === EXPRESSION_TYPE.VAR) {
        return item.name
    }

    if (item.type === EXPRESSION_TYPE.ABS) {
        return "\\" + item.name + "." + exprToString(item.exprBody)
    }

    if (item.type === EXPRESSION_TYPE.APP) {
        const { expr1, expr2 } = item

        if (expr1.type === EXPRESSION_TYPE.ABS) {
            return "(" + exprToString(expr1) + ")" + exprToString(expr2)
        }

        if (expr2.type === EXPRESSION_TYPE.VAR) {
            return exprToString(expr1) + expr2.name
        }

        return exprToString(expr1) + "(" + exprToString(expr2) + ")"
    }
}

// входные структуры
export const EXPRESSION_TYPE = {
    VAR: 'VAR', // переменная
    APP: 'APP', // аппликация
    ABS: 'ABS' // абстракция
}

export function lambdaToJavascript(expr, n = 0, isNewLine = true) {
    const tabs = isNewLine && n !== 0 ? times(i => "\t", n).join('') + 'return ' : ""
    if (expr.type === EXPRESSION_TYPE.ABS) {
        const { functionName, exprBody, attributeName } = expr
        return `${ tabs }function ${ functionName }(${ attributeName }) {\n${ lambdaToJavascript(exprBody, n + 1, true) }\n${ times(i => "\t", n).join('') }}`
    }

    if (expr.type === EXPRESSION_TYPE.APP) {
        const { expr1, expr2 } = expr

        return `${ tabs }${ lambdaToJavascript(expr1, n, false) }(${ lambdaToJavascript(expr2, n, false) })`
    }

    if (expr.type === EXPRESSION_TYPE.VAR) {
        return `${ tabs }${expr.name}`
    }
}

const createdExprVars = {}
export function createExprVar(name) {
    if (isSomething(createdExprVars[ name ])) {
        return createdExprVars[ name ]
    }

    const expr = {
        type: EXPRESSION_TYPE.VAR,
        index: EXPRESSION_COUNTER++,
        name
    }
    createdExprVars[ name ] = expr

    return expr
}

export function createExprApp(expr1, expr2) {
    return {
        type: EXPRESSION_TYPE.APP,
        index: EXPRESSION_COUNTER++,
        expr1,
        expr2
    }
}

export function createExprAbs(functionName, exprBody, attributeName = 'attr') {
    return {
        type: EXPRESSION_TYPE.ABS,
        index: EXPRESSION_COUNTER++,
        functionName,
        exprBody,
        attributeName
    }
}



// внутренние структуры типов
export const TYPE = {
    CONST : 'CONST', // константа
    TY_VAR: 'TY_VAR', // типовая переменная
    ARROW: 'ARROW' // Стрелка
}

export function createTypeConst() {
    return {
        type: TYPE.CONST
    }
}

export function createTypeTyVar(name) {
    return {
        type: TYPE.TY_VAR,
        name
    }
}

export function createTypeArrow(leftType, rightType) {
    return {
        type: TYPE.ARROW,
        leftType,
        rightType
    }
}