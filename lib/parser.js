// 语法分析器
export class Parser {
  constructor(lexer) {
    this.lexer = lexer;
    this.currentToken = this.lexer.getNextToken();
  }

  eat(tokenType) {
    if (this.currentToken.type === tokenType) {
      this.currentToken = this.lexer.getNextToken();
    } else {
      throw new Error(`Expected ${tokenType}，but got ${this.currentToken.type}`);
    }
  }

  // 方程: expression = expression
  equation() {
    const left = this.expression();
    this.eat('EQUALS');
    const right = this.expression();
    return { type: 'EQUATION', left, right };
  }

  // 表达式: term ((PLUS | MINUS) term)*
  expression() {
    let node = this.term();

    while (this.currentToken.type === 'PLUS' || this.currentToken.type === 'MINUS') {
      const op = this.currentToken.type === 'PLUS' ? '+' : '-';
      this.eat(this.currentToken.type);
      node = { type: 'BINARY_OP', op, left: node, right: this.term() };
    }

    return node;
  }

  // 项: factor ((MULTIPLY | DIVIDE) factor)*
  term() {
    let node = this.factor();

    while (this.currentToken.type === 'MULTIPLY' || this.currentToken.type === 'DIVIDE') {
      const op = this.currentToken.type === 'MULTIPLY' ? '*' : '/';
      this.eat(this.currentToken.type);
      node = { type: 'BINARY_OP', op, left: node, right: this.factor() };
    }

    return node;
  }

  // 因子: NUMBER | VARIABLE | (expression) | unaryOp factor
  factor() {
    const token = this.currentToken;
    let node;

    if (token.type === 'NUMBER') {
      this.eat('NUMBER');
      node = { type: 'NUMBER', value: token.value };
      
      // 处理隐式乘法: 2x, 2(, 2)
      // 但要注意：如果是在除法后面（通过上下文判断），数字+变量应该作为一个整体
      if (this.currentToken.type === 'VARIABLE' || this.currentToken.type === 'LPAREN') {
        return { type: 'BINARY_OP', op: '*', left: node, right: this.factor() };
      }
      return node;
    }

    if (token.type === 'VARIABLE') {
      this.eat('VARIABLE');
      node = { type: 'VARIABLE', name: token.value };
      
      // 处理隐式乘法: xy, x(, x2
      if (this.currentToken.type === 'VARIABLE' || 
          this.currentToken.type === 'LPAREN' || 
          this.currentToken.type === 'NUMBER') {
        return { type: 'BINARY_OP', op: '*', left: node, right: this.factor() };
      }
      return node;
    }

    if (token.type === 'LPAREN') {
      this.eat('LPAREN');
      node = this.expression();
      this.eat('RPAREN');
      
      // 处理隐式乘法: (expr)x, (expr)2, (expr)(
      if (this.currentToken.type === 'VARIABLE' || 
          this.currentToken.type === 'NUMBER' || 
          this.currentToken.type === 'LPAREN') {
        return { type: 'BINARY_OP', op: '*', left: node, right: this.factor() };
      }
      return node;
    }

    throw new Error(`Unexpected token: ${token.type}, expected NUMBER, VARIABLE, LPAREN`);
  }

  // 方程组: equation (SEMICOLON equation)*
  equationList() {
    const equations = [];
    equations.push(this.equation());

    while (this.currentToken.type === 'SEMICOLON') {
      this.eat('SEMICOLON');
      // 如果分号后是 EOF，说明分号是末尾的可选分号，忽略它
      if (this.currentToken.type === 'EOF') {
        break;
      }
      equations.push(this.equation());
    }

    return { type: 'EQUATION_SYSTEM', equations };
  }

  parse() {
    return this.equationList();
  }
}

