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
    return parseFloat(result);
  }

  identifier() {
    let result = '';
    while (this.currentChar && /[a-z]/i.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }
    return result;
  }

  getNextToken() {
    while (this.currentChar !== null) {
      if (this.currentChar === ' ') {
        this.skipWhitespace();
        continue;
      }

      if (/[0-9]/.test(this.currentChar)) {
        return { type: 'NUMBER', value: this.number() };
      }

      if (/[a-z]/i.test(this.currentChar)) {
        return { type: 'VARIABLE', value: this.identifier() };
      }

      if (this.currentChar === '+') {
        this.advance();
        return { type: 'PLUS', value: '+' };
      }

      if (this.currentChar === '-') {
        this.advance();
        return { type: 'MINUS', value: '-' };
      }

      if (this.currentChar === '*') {
        this.advance();
        return { type: 'MULTIPLY', value: '*' };
      }

      if (this.currentChar === '/') {
        this.advance();
        return { type: 'DIVIDE', value: '/' };
      }

      if (this.currentChar === '(') {
        this.advance();
        return { type: 'LPAREN', value: '(' };
      }

      if (this.currentChar === ')') {
        this.advance();
        return { type: 'RPAREN', value: ')' };
      }

      if (this.currentChar === '=') {
        this.advance();
        return { type: 'EQUALS', value: '=' };
      }

      throw new Error(`意外的字符: ${this.currentChar}`);
    }

    return { type: 'EOF', value: null };
  }
}

