import { is, isNil } from "ramda"
import { error } from "./utils"

export const TOKEN_TYPES = {
    BACKSLASH : /^\\/,
    DOT : /^\./,
    LBRACKET: /^\(/,
    RBRACKET: /^\)/,
    VARIABLE_NAME : /^[a-zA-Z][a-zA-Z0-9]*/
}

export class Lexer {
    constructor(text) {
        this.lines = text.split('\n')
        this.row = 0
        this.col = 0
        this.tokens = []
        this.tokenTypes = Object.entries(TOKEN_TYPES)
    }

    createToken(token, name, value = null) {
        return {
            name,
            token,
            value,
            row : this.row,
            col: this.col
        }
    }

    skipSpaces() {
        const line = this.lines[this.row]
        while (this.col < line.length && line[this.col] === ' ' || line[this.col] === '\t') this.col++
    }

    start() {
        try {
            while (this.row < this.lines.length) {
                this.col = 0
                this.lineTokenize()
                this.row++
            }

            return this.tokens
        } catch ({ message }) {
            console.error(message)
            return []
        }
    }

    lineTokenize() {
        while (this.col < this.lines[this.row].length) {
            this.skipSpaces()
            const currentLine = this.lines[this.row].substr(this.col)
            const isFind = this.tokenTypes.find(([ tokenName, pattern ]) => {
                if (pattern.test(currentLine)) {
                    const match = currentLine.match(pattern)[0]
                    if (pattern === TOKEN_TYPES.VARIABLE_NAME) {
                        this.tokens.push(this.createToken(pattern, tokenName, match))
                    } else {
                        this.tokens.push(this.createToken(pattern, tokenName))
                    }

                    this.col += match.length

                    return true
                }

                return false
            })

            if (isNil(isFind)) {
                error(`Неизвестная лексема, строка: ${ this.row + 1 }, колонка: ${ this.col + 1 }`)
            }
        }
    }
}