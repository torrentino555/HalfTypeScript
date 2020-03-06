// Func := \ FuncName Var . Expr
// Expr := ( Expr Expr ) | Func | Var

import { TOKEN_TYPES } from "./lexer"
import { error, log } from "./utils"


export class AstNode {
    static createFunction(functionName, variableName, body) {
        return {
            type: this.TYPE.FUNCTION,
            functionName,
            variableName,
            body
        }
    }

    static createApplication(leftExpression, rightExpression) {
        return {
            type: this.TYPE.APPLICATION,
            leftExpression,
            rightExpression
        }
    }

    static createVariable(name) {
        return {
            type: this.TYPE.VARIABLE,
            name
        }
    }
}

AstNode.TYPE = {
    FUNCTION: 'FUNCTION',
    APPLICATION: 'APPLICATION',
    VARIABLE: 'VARIABLE'
}

export class Parser {
    constructor(tokens) {
        this.tokens = tokens
        this.index = 0
    }

    getToken() {
        return this.tokens[this.index]
    }

    getTokenName() {
        return this.tokens[this.index].name
    }

    getTokenType() {
        return this.getToken().token
    }

    getTokenValue() {
        return this.getToken().value
    }

    matches(...tokensForMatch) {
        if (this.index >= this.tokens.length) {
            return false
        }

        return !!tokensForMatch.find(t => this.getTokenType() === t)
    }

    next() {
        if (this.index + 1 < this.tokens.length) {
            this.index++
        }
    }

    expect(token) {
        if (!this.matches(token)) {
            error('Встретилось: ' + this.getTokenName() + ' Ожидалось: ' + token)
        }

        this.next()
    }

    expectAndReturnValue(token) {
        if (!this.matches(token)) {
            error('Встретилось: ' + this.getTokenName() + ' Ожидалось: ' + token)
        }

        const value = this.getTokenValue()
        this.next()
        return value
    }

    parse() {
        log("\nStart Parsing\n")
        try {
            const resultNode = this.parseProgram()
            log("\nEnd Parsing\n")
            return resultNode
        } catch ({message}) {
            console.error(message)
            return null
        }
    }

    parseProgram() {
        let f
        while (this.index + 1 !== this.tokens.length) {
            f = this.parseFunction()
        }

        return f
    }

    // Func := \ FuncName Var . Expr
    parseFunction() {
        log("Function := \\ funcName var . Expr")
        this.expect(TOKEN_TYPES.BACKSLASH)
        const functionName = this.expectAndReturnValue(TOKEN_TYPES.VARIABLE_NAME)
        const variableName = this.expectAndReturnValue(TOKEN_TYPES.VARIABLE_NAME)
        this.expect(TOKEN_TYPES.DOT)
        const body = this.parseExpr()

        return AstNode.createFunction(functionName, variableName, body)
    }

    // Expr := ( Expr Expr ) | Func | Var | e
    parseExpr() {
        let logString = "Expr := "
        switch (this.getTokenType()) {
            case TOKEN_TYPES.LBRACKET:
                log(logString + "( Expr Expr )")
                this.expect(TOKEN_TYPES.LBRACKET)
                const leftExpr = this.parseExpr()
                const rightExpr = this.parseExpr()
                this.expect(TOKEN_TYPES.RBRACKET)

                return AstNode.createApplication(leftExpr, rightExpr)
            case TOKEN_TYPES.BACKSLASH:
                log(logString + "Function")
                return this.parseFunction()
            case TOKEN_TYPES.VARIABLE_NAME:
                log(logString + "var")
                const variableName = this.expectAndReturnValue(TOKEN_TYPES.VARIABLE_NAME)

                return AstNode.createVariable(variableName)
            default:
                error('Встретилось: ' + this.getTokenName() + ' Ожидалось: ' + [ TOKEN_TYPES.LBRACKET, TOKEN_TYPES.BACKSLASH, TOKEN_TYPES.VARIABLE_NAME ].join('|'))
        }
    }
}