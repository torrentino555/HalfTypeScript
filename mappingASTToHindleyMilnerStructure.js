import { createExprAbs, createExprApp, createExprVar } from "./Types"
import { error } from "./utils"
import { AstNode } from "./parser"

export function mapAstToHindleyMinler(ast) {
    if (ast.type === AstNode.TYPE.FUNCTION) {
        const { functionName, variableName, body } = ast

        return createExprAbs(
            functionName,
            mapAstToHindleyMinler(body),
            variableName
        )
    }

    if (ast.type === AstNode.TYPE.APPLICATION) {
        const { leftExpression, rightExpression } = ast

        return createExprApp(
            mapAstToHindleyMinler(leftExpression),
            mapAstToHindleyMinler(rightExpression)
        )
    }

    if (ast.type === AstNode.TYPE.VARIABLE) {
        const { name } = ast

        return createExprVar(name)
    }

    error('Неизвестный тип узла AST дерева')
}