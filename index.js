import { generateNames, isSomething, log } from "./utils"
import { inferType } from "./Checker"
import { createExprAbs, createExprApp, createExprVar, Environment, lambdaToJavascript, typeToString } from "./Types"
import { Parser } from "./parser"
import { Lexer, lexicalParsing } from "./lexer"
import { Test1, Test2, Test3 } from "./tests"
import { mapAstToHindleyMinler } from "./mappingASTToHindleyMilnerStructure"
import { isNil } from "ramda"

export const DEBUG = true


function main(text) {
    const tokens = new Lexer(text).start()
    if (isNil(tokens)) return
    const AST = new Parser(tokens).parse()
    if (isNil(AST)) return
    const tree = mapAstToHindleyMinler(AST)
    if (isNil(tree)) return

    let env

    try {
        const result = inferType(
            tree,
            generateNames(),
            new Environment()
        )

        env = result.env
    } catch ({message}) {
        console.error(message)
    }

    if (isSomething(env)) {
        log('Вывод типов: ' + typeToString(env.lookup(tree)) + '\n')
        log('Транспиляция в Javascript:\n')
        console.log(lambdaToJavascript(tree))
    }
}

main(Test3)