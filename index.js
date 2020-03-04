import { generateNames } from "./utils"
import { inferType } from "./Checker"
import { createExprAbs, createExprApp, createExprVar, Environment, typeToString } from "./Types"

const expr = createExprAbs('x',
    createExprAbs('y',
        createExprAbs('z', createExprApp(createExprVar('x'), createExprApp(createExprVar('y'), createExprVar('z'))))
        )
)

const { env } = inferType(expr, generateNames(), new Environment())
console.log(typeToString(env.lookup(expr)))