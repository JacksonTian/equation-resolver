const TOKEN_TYPES = {
  NUMBER: 'NUMBER',
  VARIABLE: 'VARIABLE',
  PLUS: 'PLUS', MINUS: 'MINUS', MULTIPLY: 'MULTIPLY', DIVIDE: 'DIVIDE',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  EQUALS: 'EQUALS',
  SEMICOLON: 'SEMICOLON',
  EOF: 'EOF',
};

export class Token {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
}

// 词法分析器
export class Lexer {
  constructor(input) {
    this.input = input;
    this.pos = 0;
    this.currentChar = this.input[this.pos] || null;
  }

  advance() {
    this.pos++;
    this.currentChar = this.pos < this.input.length ? this.input[this.pos] : null;
  }

  skipWhitespace() {
    while (this.currentChar === ' ') {
      this.advance();
    }
  }

  number() {
    let result = '';
    while (this.currentChar && /[0-9.]/.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }
    return new Token(TOKEN_TYPES.NUMBER, result);
  }

  identifier() {
    // 只支持单字符变量
    const result = this.currentChar;
    this.advance();
    return new Token(TOKEN_TYPES.VARIABLE, result);
  }

  getNextToken() {
    while (this.currentChar !== null) {
      if (this.currentChar === ' ') {
        this.skipWhitespace();
        continue;
      }

      if (/[0-9]/.test(this.currentChar)) {
        return this.number();
      }

      if (/[a-z]/i.test(this.currentChar)) {
        return this.identifier();
      }

      if (this.currentChar === '+') {
        this.advance();
        return new Token(TOKEN_TYPES.PLUS, '+');
      }

      if (this.currentChar === '-') {
        this.advance();
        return new Token(TOKEN_TYPES.MINUS, '-');
      }

      if (this.currentChar === '*') {
        this.advance();
        return new Token(TOKEN_TYPES.MULTIPLY, '*');
      }

      if (this.currentChar === '/') {
        this.advance();
        return new Token(TOKEN_TYPES.DIVIDE, '/');
      }

      if (this.currentChar === '(') {
        this.advance();
        return new Token(TOKEN_TYPES.LPAREN, '(');
      }

      if (this.currentChar === ')') {
        this.advance();
        return new Token(TOKEN_TYPES.RPAREN, ')');
      }

      if (this.currentChar === '=') {
        this.advance();
        return new Token(TOKEN_TYPES.EQUALS, '=');
      }

      if (this.currentChar === ';') {
        this.advance();
        return new Token(TOKEN_TYPES.SEMICOLON, ';');
      }

      throw new Error(`Unexpected character: ${this.currentChar}`);
    }

    return new Token(TOKEN_TYPES.EOF, null);
  }
}

