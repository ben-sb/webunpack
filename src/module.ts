import * as t from '@babel/types';
import traverse, { NodePath } from '@babel/traverse';

export default class Module {
    private _id: number;
    private params: Parameter[];
    private body: t.BlockStatement;

    private moduleArgName?: string;
    private exportsArgName?: string;
    private requireArgName?: string;

    /**
     * 
     * @param id The id of the module (index in array expression).
     * @param params The module params.
     * @param body The module body.
     */
    constructor(id: number, params: Parameter[], body: t.BlockStatement) {
        this._id = id;
        this.params = params;
        this.body = body;

        this.parseParams();
    }

    /**
     * Detects the original names of module, module.exports and require
     * (that were originally passed as arguments to the webpack function).
     */
    private parseParams(): void {
        if (this.params[0] && t.isIdentifier(this.params[0])) {
            this.moduleArgName = this.params[0].name;
        }
        if (this.params[1] && t.isIdentifier(this.params[1])) {
            this.exportsArgName = this.params[1].name;
        }
        if (this.params[2] && t.isIdentifier(this.params[2])) {
            this.requireArgName = this.params[2].name;
        }
    }

    /**
     * Parses the body of the module and returns it as a file node.
     * @returns The module as a file node.
     */
    getFile(): t.File {
        const self = this;
        const file = t.file(t.program(this.body.body));
        let referencesUtils = false;

        traverse(file, {
            CallExpression: function(path) {
                if (self.isRequireCall(path.node)) {
                    const moduleId = (path.node as any).arguments[0].value;
                    const requireArgs = [t.stringLiteral(`./module${moduleId}`)];
                    const requireCall = t.callExpression(t.identifier('require'), requireArgs);
                    path.replaceWith(requireCall);
                }
            },
            Identifier: function(path) {
                if (self.moduleArgName && path.node.name == self.moduleArgName) {
                    path.node.name = 'module';
                }
                else if (self.exportsArgName && path.node.name == self.exportsArgName) {
                    path.node.name = 'exports';
                }
                else if (self.requireArgName && path.node.name == self.requireArgName) {
                    path.node.name = 'utils';
                    referencesUtils = true;
                }
            }
        });

        if (referencesUtils) {
            file.program.body.unshift(this.getUtilsImport());
        }

        return file;
    }

    /**
     * Returns a statement importing the utils from index.js (original webpack
     * init function).
     * @returns Import statement.
     */
    private getUtilsImport(): t.VariableDeclaration {
        const requireCall = t.callExpression(t.identifier('require'), [t.stringLiteral('./index.js')]);
        const variableDeclarator = t.variableDeclarator(t.identifier('utils'), requireCall);
        return t.variableDeclaration('const', [variableDeclarator]);
    }

    /**
     * Getter for the id.
     */
    get id(): number {
        return this._id;
    }

    /**
     * Returns whether an AST node is a call to require.
     * @param node The AST node.
     * @returns Whether it is a call to require.
     */
    private isRequireCall(node: t.CallExpression): boolean {
        return this.requireArgName != undefined && t.isIdentifier(node.callee)
            && node.callee.name == this.requireArgName && node.arguments.length == 1
            && t.isNumericLiteral(node.arguments[0]);
    }
}

/**
 * Type for function parameter.
 */
type Parameter = t.Identifier | t.RestElement | t.TSParameterProperty | t.Pattern;