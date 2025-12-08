// 语义检查器
export class SemanticChecker {
  constructor(ast) {
    this.ast = ast;
    this.variables = new Set();
  }

  visitEquationSystem(ast) {
    if (ast.type !== 'EQUATION_SYSTEM') {
      throw new Error('Invalid AST type');
    }

    ast.equations.forEach(equation => {
      this.visitEquation(equation);
    });
  }

  visitEquation(ast) {
    if (ast.type !== 'EQUATION') {
      throw new Error('Invalid AST type');
    }

    const leftCtx = {
      variables: new Set(),
    };
    this.visitExpression(ast.left, leftCtx);
    const rightCtx = {
      variables: new Set(),
    };
    this.visitExpression(ast.right, rightCtx);
    // 检查是否没有变量
    if (leftCtx.variables.size === 0 && rightCtx.variables.size === 0) {
      throw new Error('Equation does not contain any variables');
    }
  }

  visitExpression(ast, ctx) {
    if (ast.type === 'VARIABLE') {
      ctx.variables.add(ast.name);
      this.variables.add(ast.name);
    } else if (ast.type === 'BINARY_OP') {
      this.visitExpression(ast.left, ctx);
      this.visitExpression(ast.right, ctx);
    } else if (ast.type === 'NUMBER') {
      // noop
    } else {
      console.log(ast);
      throw new Error('Invalid AST type');
    }
  }

  // 执行所有语义检查
  check() {
    this.visitEquationSystem(this.ast);
  }
}
