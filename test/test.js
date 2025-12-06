import { describe, it } from 'node:test';
import assert from 'node:assert';
import { solveEquation } from '../lib/solve.js';

// 浮点数比较辅助函数
function assertApproximatelyEqual(actual, expected, tolerance = 1e-10) {
  if (Number.isInteger(expected) && Number.isInteger(actual)) {
    assert.strictEqual(actual, expected);
  } else {
    assert.ok(
      Math.abs(actual - expected) <= tolerance,
      `期望值 ${expected}，实际值 ${actual}，差值 ${Math.abs(actual - expected)}`
    );
  }
}

describe('solveEquation', () => {
  describe('正常测试用例', () => {
    describe('基础线性方程', () => {
      it('简单乘法', () => {
        const { value, variable } = solveEquation('2x = 4');
        assert.strictEqual(variable, 'x');
        assert.strictEqual(value, 2);
      });

      it('加法', () => {
        const { value, variable } = solveEquation('3x + 2 = 8');
        assert.strictEqual(variable, 'x');
        assert.strictEqual(value, 2);
      });

      it('减法', () => {
        const { value, variable } = solveEquation('5x - 3 = 12');
        assert.strictEqual(variable, 'x');
        assert.strictEqual(value, 3);
      });

      it('单变量', () => {
        const { value, variable } = solveEquation('x + 5 = 10');
        assert.strictEqual(variable, 'x');
        assert.strictEqual(value, 5);
      });

      it('减法和乘法', () => {
        const { value, variable } = solveEquation('2x - 1 = 5');
        assert.strictEqual(variable, 'x');
        assert.strictEqual(value, 3);
      });
    });

    describe('除法相关', () => {
      it('除法隐式乘法', () => {
        const { value, variable } = solveEquation('8 / 2x = 2');
        assert.strictEqual(variable, 'x');
        assert.strictEqual(value, 2);
      });

      it('除法隐式乘法2', () => {
        const { value, variable } = solveEquation('10 / 5x = 1');
        assert.strictEqual(variable, 'x');
        assert.strictEqual(value, 2);
      });

      it('除法隐式乘法3', () => {
        const { value, variable } = solveEquation('12 / 3x = 2');
        assert.strictEqual(variable, 'x');
        assert.strictEqual(value, 2);
      });
    });

    describe('括号和隐式乘法', () => {
      it('括号和隐式乘法', () => {
        const { value, variable } = solveEquation('2(3y-4)=4y-7(4-y)');
        assert.strictEqual(variable, 'y');
        assert.strictEqual(value, 4);
      });

      it('显式乘法', () => {
        const { value, variable } = solveEquation('2*(3y-4)=4y-7(4-y)');
        assert.strictEqual(variable, 'y');
        assert.strictEqual(value, 4);
      });

      it('括号表达式', () => {
        const { value, variable } = solveEquation('3(x+2) = 15');
        assert.strictEqual(variable, 'x');
        assert.strictEqual(value, 3);
      });

      it('括号减法', () => {
        const { value, variable } = solveEquation('2(x-1) = 6');
        assert.strictEqual(variable, 'x');
        assert.strictEqual(value, 4);
      });
    });

    describe('复杂方程', () => {
      it('复杂分数方程', () => {
        const { value, variable } = solveEquation('(x+3.5)/0.9=15*(x+3.5)-125');
        assert.strictEqual(variable, 'x');
        assertApproximatelyEqual(value, 5.5);
      });

      it('混合表达式', () => {
        const { value, variable } = solveEquation('2x + 3(x-1) = 10');
        assert.strictEqual(variable, 'x');
        assertApproximatelyEqual(value, 2.6);
      });
    });

    describe('小数', () => {
      it('小数系数', () => {
        const { value, variable } = solveEquation('0.5x = 2');
        assert.strictEqual(variable, 'x');
        assert.strictEqual(value, 4);
      });

      it('小数加常数', () => {
        const { value, variable } = solveEquation('1.5x + 0.5 = 5');
        assert.strictEqual(variable, 'x');
        assertApproximatelyEqual(value, 3);
      });
    });

    describe('负数', () => {
      it('负变量', () => {
        const { value, variable } = solveEquation('-x = 5');
        assert.strictEqual(variable, 'x');
        assert.strictEqual(value, -5);
      });

      it('负数结果', () => {
        const { value, variable } = solveEquation('2x - 10 = -4');
        assert.strictEqual(variable, 'x');
        assert.strictEqual(value, 3);
      });
    });

    describe('多变量', () => {
      it('多变量方程（只求解第一个变量）', () => {
        const { value, variable } = solveEquation('2x(3y-4)=4y-7(4-y)');
        assert.strictEqual(variable, 'x');
        assertApproximatelyEqual(value, 3.5);
      });
    });
  });

  describe('错误情况测试', () => {
    it('恒等式', () => {
      assert.throws(
        () => solveEquation('2x = 2x'),
        (error) => {
          return error.message.includes('方程有无数解') ||
            '方程有无数解'.includes(error.message);
        },
        '应该抛出包含 "方程有无数解" 的错误'
      );
    });

    it('矛盾方程', () => {
      assert.throws(
        () => solveEquation('2x = 2x + 1'),
        (error) => {
          return error.message.includes('方程无解') ||
            '方程无解'.includes(error.message);
        },
        '应该抛出包含 "方程无解" 的错误'
      );
    });

    it('无等号', () => {
      assert.throws(
        () => solveEquation('2x'),
        (error) => {
          return error.message.includes('语法分析失败') ||
            '语法分析失败'.includes(error.message);
        },
        '应该抛出包含 "语法分析失败" 的错误'
      );
    });

    it('无左侧', () => {
      assert.throws(
        () => solveEquation('= 5'),
        (error) => {
          return error.message.includes('未找到变量') ||
            '未找到变量'.includes(error.message);
        },
        '应该抛出包含 "未找到变量" 的错误'
      );
    });

    it('无右侧', () => {
      assert.throws(
        () => solveEquation('2x ='),
        (error) => {
          return error.message.includes('语法分析失败') ||
            '语法分析失败'.includes(error.message);
        },
        '应该抛出包含 "语法分析失败" 的错误'
      );
    });
  });
});
