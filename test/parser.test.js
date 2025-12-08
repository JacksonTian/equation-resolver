import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Parser } from '../lib/parser.js';
import { Lexer } from '../lib/lexer.js';

function createParser(input) {
  const lexer = new Lexer(input);
  return new Parser(lexer);
}

describe('Parser', () => {
  describe('数字解析', () => {
    it('应该解析单个数字', () => {
      const parser = createParser('123');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'NUMBER');
      assert.strictEqual(ast.value, '123');
    });

    it('应该解析小数', () => {
      const parser = createParser('3.14');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'NUMBER');
      assert.strictEqual(ast.value, '3.14');
    });
  });

  describe('变量解析', () => {
    it('应该解析单个变量', () => {
      const parser = createParser('x');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'VARIABLE');
      assert.strictEqual(ast.name, 'x');
    });

    it('应该解析多字母变量', () => {
      const parser = createParser('abc');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'VARIABLE');
      assert.strictEqual(ast.name, 'abc');
    });
  });

  describe('二元运算符解析', () => {
    it('应该解析加法', () => {
      const parser = createParser('1 + 2');
      const ast = parser.expression();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '+');
      assert.strictEqual(ast.left.type, 'NUMBER');
      assert.strictEqual(ast.left.value, '1');
      assert.strictEqual(ast.right.type, 'NUMBER');
      assert.strictEqual(ast.right.value, '2');
    });

    it('应该解析减法', () => {
      const parser = createParser('5 - 3');
      const ast = parser.expression();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '-');
      assert.strictEqual(ast.left.type, 'NUMBER');
      assert.strictEqual(ast.left.value, '5');
      assert.strictEqual(ast.right.type, 'NUMBER');
      assert.strictEqual(ast.right.value, '3');
    });

    it('应该解析乘法', () => {
      const parser = createParser('2 * 3');
      const ast = parser.term();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '*');
      assert.strictEqual(ast.left.type, 'NUMBER');
      assert.strictEqual(ast.left.value, '2');
      assert.strictEqual(ast.right.type, 'NUMBER');
      assert.strictEqual(ast.right.value, '3');
    });

    it('应该解析除法', () => {
      const parser = createParser('6 / 2');
      const ast = parser.term();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '/');
      assert.strictEqual(ast.left.type, 'NUMBER');
      assert.strictEqual(ast.left.value, '6');
      assert.strictEqual(ast.right.type, 'NUMBER');
      assert.strictEqual(ast.right.value, '2');
    });

    it('应该解析多个加法', () => {
      const parser = createParser('1 + 2 + 3');
      const ast = parser.expression();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '+');
      assert.strictEqual(ast.left.type, 'BINARY_OP');
      assert.strictEqual(ast.left.op, '+');
      assert.strictEqual(ast.right.type, 'NUMBER');
      assert.strictEqual(ast.right.value, '3');
    });

    it('应该解析多个乘法', () => {
      const parser = createParser('2 * 3 * 4');
      const ast = parser.term();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '*');
      assert.strictEqual(ast.left.type, 'BINARY_OP');
      assert.strictEqual(ast.left.op, '*');
      assert.strictEqual(ast.right.type, 'NUMBER');
      assert.strictEqual(ast.right.value, '4');
    });
  });

  describe('运算符优先级', () => {
    it('应该正确处理乘除优先于加减', () => {
      const parser = createParser('1 + 2 * 3');
      const ast = parser.expression();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '+');
      assert.strictEqual(ast.left.type, 'NUMBER');
      assert.strictEqual(ast.left.value, '1');
      assert.strictEqual(ast.right.type, 'BINARY_OP');
      assert.strictEqual(ast.right.op, '*');
    });

    it('应该正确处理混合运算符', () => {
      const parser = createParser('1 + 2 * 3 - 4 / 2');
      const ast = parser.expression();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '-');
      assert.strictEqual(ast.left.type, 'BINARY_OP');
      assert.strictEqual(ast.left.op, '+');
    });
  });

  describe('括号解析', () => {
    it('应该解析括号表达式', () => {
      const parser = createParser('(1 + 2)');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '+');
    });

    it('应该正确处理括号优先级', () => {
      const parser = createParser('(1 + 2) * 3');
      const ast = parser.term();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '*');
      assert.strictEqual(ast.left.type, 'BINARY_OP');
      assert.strictEqual(ast.left.op, '+');
    });

    it('应该解析嵌套括号', () => {
      const parser = createParser('((1 + 2) * 3)');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '*');
      assert.strictEqual(ast.left.type, 'BINARY_OP');
      assert.strictEqual(ast.left.op, '+');
    });
  });

  describe('隐式乘法', () => {
    it('应该解析数字后跟变量 (2x)', () => {
      const parser = createParser('2x');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '*');
      assert.strictEqual(ast.left.type, 'NUMBER');
      assert.strictEqual(ast.left.value, '2');
      assert.strictEqual(ast.right.type, 'VARIABLE');
      assert.strictEqual(ast.right.name, 'x');
    });

    it('应该解析数字后跟括号 (2(x+1))', () => {
      const parser = createParser('2(x + 1)');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '*');
      assert.strictEqual(ast.left.type, 'NUMBER');
      assert.strictEqual(ast.left.value, '2');
      assert.strictEqual(ast.right.type, 'BINARY_OP');
    });

    it('应该解析变量后跟变量 (xy) - 注意：lexer 将 xy 识别为单个变量', () => {
      const parser = createParser('x y');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '*');
      assert.strictEqual(ast.left.type, 'VARIABLE');
      assert.strictEqual(ast.left.name, 'x');
      assert.strictEqual(ast.right.type, 'VARIABLE');
      assert.strictEqual(ast.right.name, 'y');
    });

    it('应该解析变量后跟数字 (x2)', () => {
      const parser = createParser('x2');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '*');
      assert.strictEqual(ast.left.type, 'VARIABLE');
      assert.strictEqual(ast.left.name, 'x');
      assert.strictEqual(ast.right.type, 'NUMBER');
      assert.strictEqual(ast.right.value, '2');
    });

    it('应该解析变量后跟括号 (x(y+1))', () => {
      const parser = createParser('x(y + 1)');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '*');
      assert.strictEqual(ast.left.type, 'VARIABLE');
      assert.strictEqual(ast.left.name, 'x');
      assert.strictEqual(ast.right.type, 'BINARY_OP');
    });

    it('应该解析括号后跟变量 ((x+1)y)', () => {
      const parser = createParser('(x + 1)y');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '*');
      assert.strictEqual(ast.left.type, 'BINARY_OP');
      assert.strictEqual(ast.right.type, 'VARIABLE');
      assert.strictEqual(ast.right.name, 'y');
    });

    it('应该解析括号后跟数字 ((x+1)2)', () => {
      const parser = createParser('(x + 1)2');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '*');
      assert.strictEqual(ast.left.type, 'BINARY_OP');
      assert.strictEqual(ast.right.type, 'NUMBER');
      assert.strictEqual(ast.right.value, '2');
    });

    it('应该解析括号后跟括号 ((x+1)(y+2))', () => {
      const parser = createParser('(x + 1)(y + 2)');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '*');
      assert.strictEqual(ast.left.type, 'BINARY_OP');
      assert.strictEqual(ast.right.type, 'BINARY_OP');
    });
  });

  describe('一元运算符', () => {
    it('应该解析正号 (+x)', () => {
      const parser = createParser('+x');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'UNARY_OP');
      assert.strictEqual(ast.op, '+');
      assert.strictEqual(ast.operand.type, 'VARIABLE');
      assert.strictEqual(ast.operand.name, 'x');
    });

    it('应该解析负号 (-x)', () => {
      const parser = createParser('-x');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'UNARY_OP');
      assert.strictEqual(ast.op, '-');
      assert.strictEqual(ast.operand.type, 'VARIABLE');
      assert.strictEqual(ast.operand.name, 'x');
    });

    it('应该解析负数 (-5)', () => {
      const parser = createParser('-5');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'UNARY_OP');
      assert.strictEqual(ast.op, '-');
      assert.strictEqual(ast.operand.type, 'NUMBER');
      assert.strictEqual(ast.operand.value, '5');
    });

    it('应该解析带括号的负数 (-(x+1))', () => {
      const parser = createParser('-(x + 1)');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'UNARY_OP');
      assert.strictEqual(ast.op, '-');
      assert.strictEqual(ast.operand.type, 'BINARY_OP');
    });
  });

  describe('方程解析', () => {
    it('应该解析简单方程', () => {
      const parser = createParser('x = 5');
      const ast = parser.equation();
      assert.strictEqual(ast.type, 'EQUATION');
      assert.strictEqual(ast.left.type, 'VARIABLE');
      assert.strictEqual(ast.left.name, 'x');
      assert.strictEqual(ast.right.type, 'NUMBER');
      assert.strictEqual(ast.right.value, '5');
    });

    it('应该解析带表达式的方程', () => {
      const parser = createParser('2x + 1 = 5');
      const ast = parser.equation();
      assert.strictEqual(ast.type, 'EQUATION');
      assert.strictEqual(ast.left.type, 'BINARY_OP');
      assert.strictEqual(ast.left.op, '+');
    });

    it('应该解析复杂方程', () => {
      const parser = createParser('x + y = 10');
      const ast = parser.equation();
      assert.strictEqual(ast.type, 'EQUATION');
      assert.strictEqual(ast.left.type, 'BINARY_OP');
      assert.strictEqual(ast.left.op, '+');
      assert.strictEqual(ast.right.type, 'NUMBER');
      assert.strictEqual(ast.right.value, '10');
    });
  });

  describe('方程组解析', () => {
    it('应该解析单个方程（返回方程而非方程组）', () => {
      const parser = createParser('x = 5');
      const ast = parser.parse();
      assert.strictEqual(ast.type, 'EQUATION');
    });

    it('应该解析两个方程的方程组', () => {
      const parser = createParser('x + y = 5; x - y = 1');
      const ast = parser.parse();
      assert.strictEqual(ast.type, 'EQUATION_SYSTEM');
      assert.strictEqual(ast.equations.length, 2);
      assert.strictEqual(ast.equations[0].type, 'EQUATION');
      assert.strictEqual(ast.equations[1].type, 'EQUATION');
    });

    it('应该解析三个方程的方程组', () => {
      const parser = createParser('x = 1; y = 2; z = 3');
      const ast = parser.parse();
      assert.strictEqual(ast.type, 'EQUATION_SYSTEM');
      assert.strictEqual(ast.equations.length, 3);
    });
  });

  describe('eat 方法', () => {
    it('应该正确消费匹配的 token', () => {
      const parser = createParser('x + y');
      parser.eat('VARIABLE');
      assert.strictEqual(parser.currentToken.type, 'PLUS');
    });

    it('应该在 token 不匹配时抛出错误', () => {
      const parser = createParser('x + y');
      assert.throws(
        () => parser.eat('PLUS'),
        (error) => {
          assert.strictEqual(error.message, '期望 PLUS，但得到 VARIABLE');
          return true;
        }
      );
    });
  });

  describe('错误处理', () => {
    it('应该在遇到意外的 token 时抛出错误', () => {
      const parser = createParser(')');
      assert.throws(
        () => parser.factor(),
        (error) => {
          assert.strictEqual(error.message, '意外的 token: RPAREN');
          return true;
        }
      );
    });

    it('应该在方程不完整时抛出错误', () => {
      const parser = createParser('x = 5;');
      assert.throws(
        () => parser.parse(),
        (error) => {
          assert.strictEqual(error.message, '方程不完整');
          return true;
        }
      );
    });

    it('应该在缺少等号时抛出错误', () => {
      const parser = createParser('x + 5');
      assert.throws(
        () => parser.equation(),
        (error) => {
          assert.strictEqual(error.message, '期望 EQUALS，但得到 EOF');
          return true;
        }
      );
    });

    it('应该在括号不匹配时抛出错误', () => {
      const parser = createParser('(x + 1');
      assert.throws(
        () => parser.factor(),
        (error) => {
          assert.strictEqual(error.message, '期望 RPAREN，但得到 EOF');
          return true;
        }
      );
    });
  });

  describe('复杂表达式', () => {
    it('应该解析复杂数学表达式', () => {
      const parser = createParser('2x + 3y - 4z');
      const ast = parser.expression();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '-');
    });

    it('应该解析带括号和隐式乘法的表达式', () => {
      const parser = createParser('2(x + 1) + 3y');
      const ast = parser.expression();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '+');
    });

    it('应该解析分数表达式', () => {
      const parser = createParser('x / 2 + y / 3');
      const ast = parser.expression();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '+');
    });
  });

  describe('边界情况', () => {
    it('应该处理只有数字的表达式', () => {
      const parser = createParser('123');
      const ast = parser.expression();
      assert.strictEqual(ast.type, 'NUMBER');
      assert.strictEqual(ast.value, '123');
    });

    it('应该处理只有变量的表达式', () => {
      const parser = createParser('x');
      const ast = parser.expression();
      assert.strictEqual(ast.type, 'VARIABLE');
      assert.strictEqual(ast.name, 'x');
    });

    it('应该处理连续的一元运算符', () => {
      const parser = createParser('--x');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'UNARY_OP');
      assert.strictEqual(ast.op, '-');
      assert.strictEqual(ast.operand.type, 'UNARY_OP');
    });

    it('应该处理多个隐式乘法', () => {
      const parser = createParser('2x y');
      const ast = parser.factor();
      assert.strictEqual(ast.type, 'BINARY_OP');
      assert.strictEqual(ast.op, '*');
      assert.strictEqual(ast.left.type, 'NUMBER');
      assert.strictEqual(ast.left.value, '2');
      assert.strictEqual(ast.right.type, 'BINARY_OP');
      assert.strictEqual(ast.right.op, '*');
      assert.strictEqual(ast.right.left.type, 'VARIABLE');
      assert.strictEqual(ast.right.left.name, 'x');
      assert.strictEqual(ast.right.right.type, 'VARIABLE');
      assert.strictEqual(ast.right.right.name, 'y');
    });
  });
});

