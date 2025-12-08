import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Lexer } from '../lib/lexer.js';

describe('Lexer', () => {
  describe('数字识别', () => {
    it('应该识别整数', () => {
      const lexer = new Lexer('123');
      const token = lexer.getNextToken();
      assert.strictEqual(token.type, 'NUMBER');
      assert.strictEqual(token.value, '123');
    });

    it('应该识别小数', () => {
      const lexer = new Lexer('3.14');
      const token = lexer.getNextToken();
      assert.strictEqual(token.type, 'NUMBER');
      assert.strictEqual(token.value, '3.14');
    });

    it('应该拒绝以小数点开头的数字（需要显式写 0.5）', () => {
      const lexer = new Lexer('.5');
      assert.throws(
        () => lexer.getNextToken(),
        (error) => {
            assert.strictEqual(error.message, 'Unexpected character: .');
            return true;
        }
      );
    });

    it('应该识别多个数字', () => {
      const lexer = new Lexer('123 456');
      const token1 = lexer.getNextToken();
      assert.strictEqual(token1.type, 'NUMBER');
      assert.strictEqual(token1.value, '123');
      
      const token2 = lexer.getNextToken();
      assert.strictEqual(token2.type, 'NUMBER');
      assert.strictEqual(token2.value, '456');
    });
  });

  describe('变量识别', () => {
    it('应该识别单个字母变量', () => {
      const lexer = new Lexer('x');
      const token = lexer.getNextToken();
      assert.strictEqual(token.type, 'VARIABLE');
      assert.strictEqual(token.value, 'x');
    });

    it('应该识别多字母变量', () => {
      const lexer = new Lexer('abc');
      const token = lexer.getNextToken();
      assert.strictEqual(token.type, 'VARIABLE');
      assert.strictEqual(token.value, 'a');
      const token2 = lexer.getNextToken();
      assert.strictEqual(token2.type, 'VARIABLE');
      assert.strictEqual(token2.value, 'b');
      const token3 = lexer.getNextToken();
      assert.strictEqual(token3.type, 'VARIABLE');
      assert.strictEqual(token3.value, 'c');
    });

    it('应该识别大写变量', () => {
      const lexer = new Lexer('XYZ');
      const token = lexer.getNextToken();
      assert.strictEqual(token.type, 'VARIABLE');
      assert.strictEqual(token.value, 'X');
      const token2 = lexer.getNextToken();
      assert.strictEqual(token2.type, 'VARIABLE');
      assert.strictEqual(token2.value, 'Y');
      const token3 = lexer.getNextToken();
      assert.strictEqual(token3.type, 'VARIABLE');
      assert.strictEqual(token3.value, 'Z');
    });

    it('应该识别混合大小写变量', () => {
      const lexer = new Lexer('xYz');
      const token = lexer.getNextToken();
      assert.strictEqual(token.type, 'VARIABLE');
      assert.strictEqual(token.value, 'x');
      const token2 = lexer.getNextToken();
      assert.strictEqual(token2.type, 'VARIABLE');
      assert.strictEqual(token2.value, 'Y');
      const token3 = lexer.getNextToken();
      assert.strictEqual(token3.type, 'VARIABLE');
      assert.strictEqual(token3.value, 'z');
    });

    it('应该识别多个变量', () => {
      const lexer = new Lexer('x y z');
      const token1 = lexer.getNextToken();
      assert.strictEqual(token1.type, 'VARIABLE');
      assert.strictEqual(token1.value, 'x');
      
      const token2 = lexer.getNextToken();
      assert.strictEqual(token2.type, 'VARIABLE');
      assert.strictEqual(token2.value, 'y');
      
      const token3 = lexer.getNextToken();
      assert.strictEqual(token3.type, 'VARIABLE');
      assert.strictEqual(token3.value, 'z');
    });
  });

  describe('运算符识别', () => {
    it('应该识别加号', () => {
      const lexer = new Lexer('+');
      const token = lexer.getNextToken();
      assert.strictEqual(token.type, 'PLUS');
      assert.strictEqual(token.value, '+');
    });

    it('应该识别减号', () => {
      const lexer = new Lexer('-');
      const token = lexer.getNextToken();
      assert.strictEqual(token.type, 'MINUS');
      assert.strictEqual(token.value, '-');
    });

    it('应该识别乘号', () => {
      const lexer = new Lexer('*');
      const token = lexer.getNextToken();
      assert.strictEqual(token.type, 'MULTIPLY');
      assert.strictEqual(token.value, '*');
    });

    it('应该识别除号', () => {
      const lexer = new Lexer('/');
      const token = lexer.getNextToken();
      assert.strictEqual(token.type, 'DIVIDE');
      assert.strictEqual(token.value, '/');
    });

    it('应该识别多个运算符', () => {
      const lexer = new Lexer('+-*/');
      const tokens = [];
      for (let i = 0; i < 4; i++) {
        tokens.push(lexer.getNextToken());
      }
      assert.strictEqual(tokens[0].type, 'PLUS');
      assert.strictEqual(tokens[1].type, 'MINUS');
      assert.strictEqual(tokens[2].type, 'MULTIPLY');
      assert.strictEqual(tokens[3].type, 'DIVIDE');
    });
  });

  describe('括号识别', () => {
    it('应该识别左括号', () => {
      const lexer = new Lexer('(');
      const token = lexer.getNextToken();
      assert.strictEqual(token.type, 'LPAREN');
      assert.strictEqual(token.value, '(');
    });

    it('应该识别右括号', () => {
      const lexer = new Lexer(')');
      const token = lexer.getNextToken();
      assert.strictEqual(token.type, 'RPAREN');
      assert.strictEqual(token.value, ')');
    });

    it('应该识别括号对', () => {
      const lexer = new Lexer('()');
      const token1 = lexer.getNextToken();
      assert.strictEqual(token1.type, 'LPAREN');
      
      const token2 = lexer.getNextToken();
      assert.strictEqual(token2.type, 'RPAREN');
    });
  });

  describe('等号和分号识别', () => {
    it('应该识别等号', () => {
      const lexer = new Lexer('=');
      const token = lexer.getNextToken();
      assert.strictEqual(token.type, 'EQUALS');
      assert.strictEqual(token.value, '=');
    });

    it('应该识别分号', () => {
      const lexer = new Lexer(';');
      const token = lexer.getNextToken();
      assert.strictEqual(token.type, 'SEMICOLON');
      assert.strictEqual(token.value, ';');
    });

    it('应该识别多个分号', () => {
      const lexer = new Lexer(';;');
      const token1 = lexer.getNextToken();
      assert.strictEqual(token1.type, 'SEMICOLON');
      
      const token2 = lexer.getNextToken();
      assert.strictEqual(token2.type, 'SEMICOLON');
    });
  });

  describe('空白字符处理', () => {
    it('应该跳过空格', () => {
      const lexer = new Lexer('   x');
      const token = lexer.getNextToken();
      assert.strictEqual(token.type, 'VARIABLE');
      assert.strictEqual(token.value, 'x');
    });

    it('应该跳过多个空格', () => {
      const lexer = new Lexer('   123');
      const token = lexer.getNextToken();
      assert.strictEqual(token.type, 'NUMBER');
      assert.strictEqual(token.value, '123');
    });

    it('应该处理数字和变量之间的空格', () => {
      const lexer = new Lexer('2 x');
      const token1 = lexer.getNextToken();
      assert.strictEqual(token1.type, 'NUMBER');
      assert.strictEqual(token1.value, '2');
      
      const token2 = lexer.getNextToken();
      assert.strictEqual(token2.type, 'VARIABLE');
      assert.strictEqual(token2.value, 'x');
    });
  });

  describe('复杂表达式', () => {
    it('应该正确解析简单方程', () => {
      const lexer = new Lexer('2x = 4');
      const tokens = [];
      let token;
      do {
        token = lexer.getNextToken();
        tokens.push(token);
      } while (token.type !== 'EOF');
      
      assert.strictEqual(tokens[0].type, 'NUMBER');
      assert.strictEqual(tokens[0].value, '2');
      assert.strictEqual(tokens[1].type, 'VARIABLE');
      assert.strictEqual(tokens[1].value, 'x');
      assert.strictEqual(tokens[2].type, 'EQUALS');
      assert.strictEqual(tokens[3].type, 'NUMBER');
      assert.strictEqual(tokens[3].value, '4');
      assert.strictEqual(tokens[4].type, 'EOF');
    });

    it('应该正确解析带括号的表达式', () => {
      const lexer = new Lexer('(x + 1)');
      const tokens = [];
      let token;
      do {
        token = lexer.getNextToken();
        tokens.push(token);
      } while (token.type !== 'EOF');
      
      assert.strictEqual(tokens[0].type, 'LPAREN');
      assert.strictEqual(tokens[1].type, 'VARIABLE');
      assert.strictEqual(tokens[1].value, 'x');
      assert.strictEqual(tokens[2].type, 'PLUS');
      assert.strictEqual(tokens[3].type, 'NUMBER');
      assert.strictEqual(tokens[3].value, '1');
      assert.strictEqual(tokens[4].type, 'RPAREN');
    });

    it('应该正确解析方程组', () => {
      const lexer = new Lexer('x + y = 5; x - y = 1');
      const tokens = [];
      let token;
      do {
        token = lexer.getNextToken();
        tokens.push(token);
      } while (token.type !== 'EOF');
      
      // 检查第一个方程
      assert.strictEqual(tokens[0].type, 'VARIABLE');
      assert.strictEqual(tokens[0].value, 'x');
      assert.strictEqual(tokens[1].type, 'PLUS');
      assert.strictEqual(tokens[2].type, 'VARIABLE');
      assert.strictEqual(tokens[2].value, 'y');
      assert.strictEqual(tokens[3].type, 'EQUALS');
      assert.strictEqual(tokens[4].type, 'NUMBER');
      assert.strictEqual(tokens[4].value, '5');
      
      // 检查分号
      assert.strictEqual(tokens[5].type, 'SEMICOLON');
      
      // 检查第二个方程
      assert.strictEqual(tokens[6].type, 'VARIABLE');
      assert.strictEqual(tokens[6].value, 'x');
      assert.strictEqual(tokens[7].type, 'MINUS');
      assert.strictEqual(tokens[8].type, 'VARIABLE');
      assert.strictEqual(tokens[8].value, 'y');
      assert.strictEqual(tokens[9].type, 'EQUALS');
      assert.strictEqual(tokens[10].type, 'NUMBER');
      assert.strictEqual(tokens[10].value, '1');
    });
  });

  describe('EOF 处理', () => {
    it('应该在输入结束时返回 EOF', () => {
      const lexer = new Lexer('');
      const token = lexer.getNextToken();
      assert.strictEqual(token.type, 'EOF');
      assert.strictEqual(token.value, null);
    });

    it('应该在解析完所有 token 后返回 EOF', () => {
      const lexer = new Lexer('x');
      const token1 = lexer.getNextToken();
      assert.strictEqual(token1.type, 'VARIABLE');
      
      const token2 = lexer.getNextToken();
      assert.strictEqual(token2.type, 'EOF');
    });

    it('应该连续返回 EOF', () => {
      const lexer = new Lexer('x');
      lexer.getNextToken(); // 跳过 x
      const token1 = lexer.getNextToken();
      assert.strictEqual(token1.type, 'EOF');
      
      const token2 = lexer.getNextToken();
      assert.strictEqual(token2.type, 'EOF');
    });
  });

  describe('错误处理', () => {
    it('应该对不支持的字符抛出错误', () => {
      const lexer = new Lexer('@');
      assert.throws(
        () => lexer.getNextToken(),
        (error) => {
            assert.strictEqual(error.message, 'Unexpected character: @');
            return true;
        }
      );
    });

    it('应该对特殊字符抛出错误', () => {
      const lexer = new Lexer('#');
      assert.throws(
        () => lexer.getNextToken(),
        (error) => {
            assert.strictEqual(error.message, 'Unexpected character: #');
            return true;
        }
      );
    });

    it('应该在遇到错误字符时包含字符信息', () => {
      const lexer = new Lexer('$');
      assert.throws(
        () => lexer.getNextToken(),
        (error) => {
            assert.strictEqual(error.message, 'Unexpected character: $');
            return true;
        }
      );
    });
  });

  describe('边界情况', () => {
    it('应该处理只有运算符的输入', () => {
      const lexer = new Lexer('++--');
      const tokens = [];
      for (let i = 0; i < 4; i++) {
        tokens.push(lexer.getNextToken());
      }
      assert.strictEqual(tokens[0].type, 'PLUS');
      assert.strictEqual(tokens[1].type, 'PLUS');
      assert.strictEqual(tokens[2].type, 'MINUS');
      assert.strictEqual(tokens[3].type, 'MINUS');
    });

    it('应该处理只有数字的输入', () => {
      const lexer = new Lexer('123.456');
      const token = lexer.getNextToken();
      assert.strictEqual(token.type, 'NUMBER');
      assert.strictEqual(token.value, '123.456');
    });

    it('应该处理只有变量的输入', () => {
      const lexer = new Lexer('xyz');
      const token = lexer.getNextToken();
      assert.strictEqual(token.type, 'VARIABLE');
      assert.strictEqual(token.value, 'x');
      const token2 = lexer.getNextToken();
      assert.strictEqual(token2.type, 'VARIABLE');
      assert.strictEqual(token2.value, 'y');
      const token3 = lexer.getNextToken();
      assert.strictEqual(token3.type, 'VARIABLE');
      assert.strictEqual(token3.value, 'z');
    });

    it('应该处理数字和运算符混合', () => {
      const lexer = new Lexer('1+2-3*4/5');
      const tokens = [];
      let token;
      do {
        token = lexer.getNextToken();
        if (token.type !== 'EOF') {
          tokens.push(token);
        }
      } while (token.type !== 'EOF');

      assert.strictEqual(tokens.length, 9);
      assert.strictEqual(tokens[0].type, 'NUMBER');
      assert.strictEqual(tokens[1].type, 'PLUS');
      assert.strictEqual(tokens[2].type, 'NUMBER');
      assert.strictEqual(tokens[3].type, 'MINUS');
      assert.strictEqual(tokens[4].type, 'NUMBER');
      assert.strictEqual(tokens[5].type, 'MULTIPLY');
      assert.strictEqual(tokens[6].type, 'NUMBER');
      assert.strictEqual(tokens[7].type, 'DIVIDE');
      assert.strictEqual(tokens[8].type, 'NUMBER');
    });
  });
});

