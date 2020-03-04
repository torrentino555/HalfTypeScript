import { generateNames, isSomething } from "./utils"
import { inferType } from "./Checker"
import { createExprAbs, createExprApp, createExprVar, Environment, lambdaToJavascript, typeToString } from "./Types"

const expr = createExprAbs('firstFunc',
    createExprAbs('secondFunc',
        createExprAbs('thirdFunc',
            createExprApp(
                createExprVar('x'),
                createExprApp(createExprVar('y'), createExprVar('z'))),
            'z'),
        'y'),
    'x')

let env

try {
        const result = inferType(expr, generateNames(), new Environment())
        env = result.env
} catch ({message}) {
        console.error(message)
}
if (isSomething(env)) {
        console.log(typeToString(env.lookup(expr)))
        console.log(lambdaToJavascript(expr))
}
