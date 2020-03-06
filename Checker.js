
// expr - тип с обязательными полями type и index
// t - список из доступных имен
// env - переменная класса Environment
import {
    createExprVar,
    createTypeArrow,
    createTypeTyVar,
    EXPRESSION_TYPE,
    exprToString,
    TYPE,
    typeToString
} from "./Types"
import { error, isSomething } from "./utils"
import { clone, isNil } from "ramda"

export function inferType(expr, t, env) {
    if (expr.type === EXPRESSION_TYPE.VAR) {
        const exprType = env.lookup(expr)

        if (isSomething(exprType)) {
            return {
                env: env.clone(),
                t: t
            }
        } else {
            return {
                env: env.insert(
                    expr,
                    createTypeTyVar(t.splice(0, 1)[0])
                ),
                t: t
            }
        }
    }

    if (expr.type === EXPRESSION_TYPE.ABS) {
        const { attributeName, exprBody } = expr

        const exprType = env.lookup(createExprVar(attributeName))

        if (isNil(exprType)) {
            const { env : newEnv, t: newFreeId } = inferType(exprBody, clone(t), env.clone())
            const exprBodyType = newEnv.lookup(exprBody)
            const exprType = newEnv.lookup(createExprVar(attributeName))

            if (isNil(exprType)) {
                const tv = t.splice(0, 1)[0]
                const newEnv2 = env.insert(createExprVar(attributeName), createTypeTyVar(tv))
                return {
                    env: newEnv2.insert(expr, createTypeArrow(createTypeTyVar(tv), exprBodyType)),
                    t: newFreeId
                }
            } else {
                return {
                    env: newEnv.insert(expr, createTypeArrow(exprType, exprBodyType)),
                    t: newFreeId
                }
            }

        } else {
            error(`Повторяющаяся связанная функция ${ attributeName }`)
        }
    }

    if (expr.type === EXPRESSION_TYPE.APP) {
        const { expr1: e1, expr2: e2 } = expr
        const [ tv, ...tvs ] = t

        const { env : env1, t: tvs1 } = inferType(e2, tvs, env.clone())
        const tp1 = env1.lookup(e2)

        if (e1.type === EXPRESSION_TYPE.VAR) {
            const tp = env1.lookup(e1)

            if (isNil(tp)) {
                const buffEnv = env1.insert(e1, createTypeArrow(tp1, createTypeTyVar(tv)))
                return {
                    env: buffEnv.insert(expr, createTypeTyVar(tv)),
                    t: clone(tvs1)
                }
            } else {
                const env2 = unifyTypes(createTypeArrow(tp1, createTypeTyVar(tv)), tp, env1)
                const { leftType: tp2, rightType: tp3 } = env2.lookup(e1)
                return {
                    env: env2.insert(expr, tp3),
                    t: clone(tvs1)
                }
            }
        }

        if (e1.type === EXPRESSION_TYPE.APP) {
            const { env: env2, t: tvs2 } = inferType(e1, tvs1, env1)
            const tp = env2.lookup(e1)
            const env3 = unifyTypes(tp, createTypeArrow(tp1, createTypeTyVar(tv)), env2)
            const { leftType: tp2, rightType: tp3 } = env3.lookup(e1)
            return {
                env: env3.insert(expr, tp3),
                t: clone(tvs2)
            }
        }

        if (e1.type === EXPRESSION_TYPE.ABS) {
            const { env: env2, t: tvs2 } = inferType(e1, tvs1, env1)
            const { leftType: tp11, rightType: tp2 } = env2.lookup(e1)
            if (areTypesCompatible(tp11, tp1)) {
                const env3 = unifyTypes(tp11, tp1, env2)
                const { leftType: tp1_, rightType: tp2_ } = env3.lookup(e1)
                return {
                    env: env3.insert(expr, tp2_),
                    t: clone(tvs2)
                }
            } else {
                error("Не удаётся применить \"" + exprToString(e1) + "\" to \"" + exprToString(e2) + "\". Несовместимые типы.")
            }
        }
    }

    error('Неверный тип входного выражения')
}

function unifyTypes(type1, type2, env) {
    if (type1.type === TYPE.CONST && type2.type === TYPE.CONST) {
        return env.clone()
    }

    if (type1.type === TYPE.TY_VAR) {
        const func = substituteTyVar(type1.name, type2)
        return env.map(func)
    }

    if (type1.type === TYPE.ARROW && type2.type === TYPE.ARROW) {
        const { leftType: t1, rightType: t2 } = type1
        const { leftType: t1_, rightType: t2_ } = type2

        const env1 = unifyTypes(t1, t1_, env.clone())
        return unifyTypes(t2, t2_, env1.clone())
    }

    error("Не удаётся унифицировать тип (" + typeToString(type1) + ") с (" + typeToString(type2) + ").")
}

function areTypesCompatible(type1, type2) {
    if (type1.type === TYPE.CONST) return true

    if (type1.type === TYPE.TY_VAR) return true

    if (type1.type === TYPE.ARROW && type2.type === TYPE.ARROW) {
        const { leftType: t1, rightType: t2 } = type1
        const { leftType: t1_, rightType: t2_ } = type2

        return areTypesCompatible(t1, t1_) && areTypesCompatible(t2, t2_)
    }

    return false
}

function substituteTyVar(n, type1) {
    return function(type2) {
        if (type2.type === TYPE.CONST) return type2

        if (type2.type === TYPE.ARROW) {
            const { leftType: t1, rightType: t2 } = type2
            return createTypeArrow(substituteTyVar(n, type1, t1), substituteTyVar(n, type1, t2))
        }

        if (type2.type === TYPE.TY_VAR) {
            if (type2.name === n) {
                return type1
            } else {
                return type2
            }
        }
    }
}