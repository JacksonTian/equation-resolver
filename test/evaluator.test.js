import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Evaluator } from '../lib/evaluator.js';
import { Lexer } from '../lib/lexer.js';
import { Parser } from '../lib/parser.js';
import { SemanticChecker } from '../lib/semantic-checker.js';

function solve(input) {
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);
  const ast = parser.parse();
  const checker = new SemanticChecker(ast);
  checker.check();
  const evaluator = new Evaluator(ast);
  return evaluator.solve();
}

describe('solve', () => {
  describe('单方程测试', () => {
    describe('基础线性方程', () => {
      it('简单乘法', () => {
        const result = solve('2x = 4');
        assert.strictEqual(result.x, 2);
      });

      it('加法', () => {
        const result = solve('3x + 2 = 8');
        assert.strictEqual(result.x, 2);
      });

      it('减法', () => {
        const result = solve('5x - 3 = 12');
        assert.strictEqual(result.x, 3);
      });

      it('单变量', () => {
        const result = solve('x + 5 = 10');
        assert.strictEqual(result.x, 5);
      });

      it('减法和乘法', () => {
        const result = solve('2x - 1 = 5');
        assert.strictEqual(result.x, 3);
      });
    });

    describe('除法相关', () => {
      it('除法隐式乘法', () => {
        const result = solve('8 / 2x = 2');
        assert.strictEqual(result.x, 2);
      });

      it('除法隐式乘法2', () => {
        const result = solve('10 / 5x = 1');
        assert.strictEqual(result.x, 2);
      });

      it('除法隐式乘法3', () => {
        const result = solve('12 / 3x = 2');
        assert.strictEqual(result.x, 2);
      });
    });

    describe('括号和隐式乘法', () => {
      it('括号和隐式乘法', () => {
        const result = solve('2(3y-4)=4y-7(4-y)');
        assert.strictEqual(result.y, 4);
      });

      it('显式乘法', () => {
        const result = solve('2*(3y-4)=4y-7(4-y)');
        assert.strictEqual(result.y, 4);
      });

      it('括号表达式', () => {
        const result = solve('3(x+2) = 15');
        assert.strictEqual(result.x, 3);
      });

      it('括号减法', () => {
        const result = solve('2(x-1) = 6');
        assert.strictEqual(result.x, 4);
      });
    });

    describe('复杂方程', () => {
      it('复杂分数方程', () => {
        const result = solve('(x+3.5)/0.9=15*(x+3.5)-125');
        assert.strictEqual(result.x, 5.5);
      });

      it('混合表达式', () => {
        const result = solve('2x + 3(x-1) = 10');
        assert.strictEqual(result.x, 2.6);
      });
    });

    describe('小数', () => {
      it('小数系数', () => {
        const result = solve('0.5x = 2');
        assert.strictEqual(result.x, 4);
      });

      it('小数加常数', () => {
        const result = solve('1.5x + 0.5 = 5');
        assert.strictEqual(result.x, 3);
      });
    });

    describe('负数', () => {
      it('负变量', () => {
        const result = solve('-x = 5');
        assert.strictEqual(result.x, -5);
      });

      it('负数结果', () => {
        const result = solve('2x - 10 = -4');
        assert.strictEqual(result.x, 3);
      });
    });

    describe('多变量', () => {
      it('多变量方程需要方程组', () => {
        assert.throws(
          () => solve('x + y + z = 1'),
          (error) => error.message.includes('需要提供方程组'),
          '应该提示需要方程组'
        );
      });
    });
  });

  describe('错误情况测试', () => {
    it('恒等式', () => {
      assert.throws(
        () => solve('2x = 2x'),
        (error) => error.message.includes('方程有无数解') ||
            '方程有无数解'.includes(error.message),
        '应该抛出包含 "方程有无数解" 的错误'
      );
    });

    it('矛盾方程', () => {
      assert.throws(
        () => solve('2x = 2x + 1'),
        (error) => {
          assert.strictEqual(error.message, '方程无解');
          return true;
        },
        '应该抛出包含 "方程无解" 的错误'
      );
    });

    it('无等号', () => {
      assert.throws(
        () => solve('2x'),
        (error) => error.message.includes('语法分析失败') ||
            '语法分析失败'.includes(error.message),
        '应该抛出包含 "语法分析失败" 的错误'
      );
    });

    it('无左侧', () => {
      assert.throws(
        () => solve('= 5'),
        (error) => error.message.includes('意外的 token') || error.message.includes('未找到变量'),
        '应该抛出语法错误'
      );
    });

    it('无右侧', () => {
      assert.throws(
        () => solve('2x ='),
        (error) => error.message.includes('意外的 token') || error.message.includes('未找到变量'),
        '应该抛出语法错误'
      );
    });
  });

  describe('方程组测试', () => {
    describe('二元一次方程组', () => {
      it('简单二元方程组', () => {
        const result = solve('x + y = 5; x - y = 1');
        assert.strictEqual(result.x, 3);
        assert.strictEqual(result.y, 2);
      });

      it('带系数的二元方程组', () => {
        const result = solve('2x + 3y = 7; 3x - 2y = 4');
        assert.strictEqual(result.x, 2);
        assert.strictEqual(result.y, 1);
      });

      it('带负数的二元方程组', () => {
        const result = solve('x - y = 3; 2x + y = 0');
        assert.strictEqual(result.x, 1);
        assert.strictEqual(result.y, -2);
      });

      it('带小数的二元方程组', () => {
        const result = solve('0.5x + y = 2; x - 0.5y = 3');
        assert.strictEqual(result.x, 3.2);
        assert.strictEqual(result.y, 0.4);
      });
    });

    describe('三元一次方程组', () => {
      it('简单三元方程组', () => {
        const result = solve('x + y + z = 6; x - y + z = 2; x + y - z = 0');
        assert.strictEqual(result.x, 1);
        assert.strictEqual(result.y, 2);
        assert.strictEqual(result.z, 3);
      });

      it('带系数的三元方程组', () => {
        const result = solve('2x + y - z = 8; x - 2y + 3z = 1; 3x + 2y + z = 9');
        assert.strictEqual(result.x, 3.625);
        assert.strictEqual(result.y, -0.375);
        assert.strictEqual(result.z, -1.125);
      });
    });

    describe('带括号的方程组', () => {
      it('括号表达式', () => {
        const result = solve('2(x + y) = 6; x - y = 1');
        assert.strictEqual(result.x, 2);
        assert.strictEqual(result.y, 1);
      });

      it('复杂括号表达式', () => {
        const result = solve('3(x - 1) + 2y = 5; 2x + (y + 1) = 4');
        assert.strictEqual(result.x, -2);
        assert.strictEqual(result.y, 7);
      });
    });

    describe('不同变量名', () => {
      it('使用不同变量名', () => {
        const result = solve('a + b = 5; a - b = 1');
        assert.strictEqual(result.a, 3);
        assert.strictEqual(result.b, 2);
      });

      it('混合变量名', () => {
        const result = solve('x + y = 5; x + z = 6; y + z = 7');
        assert.strictEqual(result.x, 2);
        assert.strictEqual(result.y, 3);
        assert.strictEqual(result.z, 4);
      });
    });
  });

  describe('方程组错误情况测试', () => {
    it('方程数量少于变量数量', () => {
      assert.throws(
        () => solve('x + y = 5'),
        (error) => {
          assert.strictEqual(error.message, '方程数量（1）少于变量数量（2）');
          return true;
        },
        '应该抛出关于方程数量不足的错误'
      );
    });

    it('无变量', () => {
      assert.throws(
        () => solve('2 = 2; 3 = 3'),
        (error) => error.message.includes('未找到变量'),
        '应该抛出未找到变量的错误'
      );
    });

    it('方程组无解', () => {
      assert.throws(
        () => solve('x + y = 5; x + y = 10'),
        (error) => error.message.includes('无解'),
        '应该抛出无解的错误'
      );
    });

    it('语法错误', () => {
      assert.throws(
        () => solve('x + y = 5; x + y'),
        (error) => error.message.includes('语法分析失败') || error.message.includes('期望'),
        '应该抛出语法分析失败的错误'
      );
    });
  });
});
