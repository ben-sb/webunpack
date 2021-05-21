import * as t from '@babel/types';
import traverse, { Node, NodePath } from '@babel/traverse';
import generate from '@babel/generator';
import Module from './module';
import fs from 'fs';

export default class Unpacker {
    private ast: t.File;

    /**
     * Creates a new unpacker.
     * @param ast The AST.
     */
    constructor(ast: t.File) {
        this.ast = ast;
    }

    /**
     * Searches for and unpacks webpack functions.
     */
    unpack(): void {
        const self = this;

        traverse(this.ast, {
            enter(path: NodePath) {
                if (self.isWebpackFunction(path)) {
                    const webpackFunction = (path.node as any).expression.argument.callee as t.FunctionExpression;
                    const modules: Module[] = [];
                    let utilsName;
                    let utilsExpression;
                    let entryModule;

                    for (const statement of webpackFunction.body.body) {
                        if (self.isWebpackUtilsExpression(statement)) {
                            const expressions = (statement as any).expression.expressions;

                            const utilAssignments = expressions.filter((e: t.Expression) => t.isAssignmentExpression(e) && t.isFunctionExpression(e.right));
                            utilsName = utilAssignments[0].left.object.name;
                            utilsExpression = t.sequenceExpression(utilAssignments);
                            entryModule = expressions[expressions.length - 1].arguments[0].right.value;
                        }
                    }
                    if (!utilsExpression) {
                        return;
                    }
                    
                    const functions = (path.node as any).expression.argument.arguments[0].elements;
                    for (let i=0; i<functions.length; i++) {
                        const func = functions[i];
                        if (func && t.isFunctionExpression(func)) {
                            const module = new Module(i, func.params, func.body);
                            modules.push(module);
                        }
                    }

                    const statements = [
                        self.getUtilsFunctionDeclaration(utilsName),
                        t.expressionStatement(utilsExpression),
                        self.getExportStatement(utilsName),
                        self.getRequireModuleCall(entryModule)
                    ];
                    const program = t.program(statements);
                    fs.writeFileSync('output/index.js', generate(program).code);

                    for (const module of modules) {
                        const file = module.getFile();
                        const code = generate(file).code;
                        fs.writeFileSync(`output/module${module.id}.js`, code);
                    }

                    console.log(`Unpacked ${modules.length} modules, wrote to output directory`)
                    path.skip();
                }
            }
        });
    }

    /**
     * Returns a function declaration (with an empty body) for the utils
     * function.
     * @param name The name of the utils function.
     * @returns The utils function declaration.
     */
    private getUtilsFunctionDeclaration(name: string): t.FunctionDeclaration {
        const identifier = t.identifier(name);
        const body = t.blockStatement([]);
        return t.functionDeclaration(identifier, [], body);
    }

    /**
     * Returns a statement exporting a given variable (via module.exports).
     * @param name The identifier name.
     * @returns The export statement.
     */
    private getExportStatement(name: string): t.ExpressionStatement {
        const memberExpression = t.memberExpression(t.identifier('module'), t.identifier('exports'));
        const assignmentExpression = t.assignmentExpression('=', memberExpression, t.identifier(name))
        return t.expressionStatement(assignmentExpression);
    }

    /**
     * Returns a statement with a call to require for a given module.
     * @param id The module id.
     * @returns The require statement.
     */
    private getRequireModuleCall(id: number): t.ExpressionStatement {
        const moduleIdentifier = t.stringLiteral(`./module${id}`);
        const callExpression = t.callExpression(t.identifier('require'), [moduleIdentifier]);
        return t.expressionStatement(callExpression);
    }

    /**
     * Returns whether a path for an AST node is a webpack function.
     * @param path The path.
     * @returns Whether it is a webpack function.
     */
     private isWebpackFunction(path: NodePath): boolean {
        return t.isExpressionStatement(path.node) && t.isUnaryExpression(path.node.expression)
            && t.isCallExpression(path.node.expression.argument) && t.isFunctionExpression(path.node.expression.argument.callee)
            && path.node.expression.argument.arguments.length == 1 && t.isArrayExpression(path.node.expression.argument.arguments[0])
            && path.node.expression.argument.arguments[0].elements.find(a => !t.isFunctionExpression(a)) == undefined;
    }

    /**
     * Returns whether an AST node is a sequence expression containing the
     * util functions for webpack.
     * @param node The AST node.
     * @returns Whether.
     */
    private isWebpackUtilsExpression(node: Node): boolean {
        return node.type == 'ExpressionStatement' && node.expression.type == 'SequenceExpression'
            && node.expression.expressions.length >= 2 && node.expression.expressions[node.expression.expressions.length - 1].type == 'CallExpression'
            && (node.expression.expressions[node.expression.expressions.length - 1] as any).arguments.length == 1 && (node.expression.expressions[node.expression.expressions.length - 1] as any).arguments[0].type == 'AssignmentExpression';
    }
}