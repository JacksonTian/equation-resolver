import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Fraction } from '../lib/fraction.js';

describe('Fraction', () => {
  describe('构造函数', () => {
    it('创建整数分数', () => {
      const f = new Fraction(5, 1);
      assert.strictEqual(f.numerator, 5);
      assert.strictEqual(f.denominator, 1);
    });

    it('创建普通分数', () => {
      const f = new Fraction(3, 4);
      assert.strictEqual(f.numerator, 3);
      assert.strictEqual(f.denominator, 4);
    });

    it('自动约分', () => {
      const f = new Fraction(6, 8);
      assert.strictEqual(f.numerator, 3);
      assert.strictEqual(f.denominator, 4);
    });

    it('约分到最简形式', () => {
      const f = new Fraction(12, 18);
      assert.strictEqual(f.numerator, 2);
      assert.strictEqual(f.denominator, 3);
    });

    it('处理负数分子', () => {
      const f = new Fraction(-3, 4);
      assert.strictEqual(f.numerator, -3);
      assert.strictEqual(f.denominator, 4);
    });

    it('处理负数分母，自动转换符号', () => {
      const f = new Fraction(3, -4);
      assert.strictEqual(f.numerator, -3);
      assert.strictEqual(f.denominator, 4);
    });

    it('处理负分子和负分母', () => {
      const f = new Fraction(-3, -4);
      assert.strictEqual(f.numerator, 3);
      assert.strictEqual(f.denominator, 4);
    });

    it('分母为0时抛出错误', () => {
      assert.throws(
        () => new Fraction(1, 0),
        (error) => {
          assert.strictEqual(error.message, '分母不能为0');
          return true;
        }
      );
    });

    it('默认分母为1', () => {
      const f = new Fraction(5);
      assert.strictEqual(f.numerator, 5);
      assert.strictEqual(f.denominator, 1);
    });

    it('处理零', () => {
      const f = new Fraction(0, 5);
      assert.strictEqual(f.numerator, 0);
      assert.strictEqual(f.denominator, 1);
    });
  });

  describe('fromString', () => {
    it('从整数字符串创建', () => {
      const f = Fraction.fromString('5');
      assert.strictEqual(f.numerator, 5);
      assert.strictEqual(f.denominator, 1);
    });

    it('从正整数字符串创建', () => {
      const f = Fraction.fromString('123');
      assert.strictEqual(f.numerator, 123);
      assert.strictEqual(f.denominator, 1);
    });

    it('从负整数字符串创建', () => {
      const f = Fraction.fromString('-5');
      assert.strictEqual(f.numerator, -5);
      assert.strictEqual(f.denominator, 1);
    });

    it('从小数字符串创建', () => {
      const f = Fraction.fromString('3.14');
      assert.strictEqual(f.numerator, 157);
      assert.strictEqual(f.denominator, 50);
    });

    it('从小数字符串创建并约分', () => {
      const f = Fraction.fromString('0.5');
      assert.strictEqual(f.numerator, 1);
      assert.strictEqual(f.denominator, 2);
    });

    it('从负小数字符串创建', () => {
      const f = Fraction.fromString('-3.14');
      assert.strictEqual(f.numerator, -157);
      assert.strictEqual(f.denominator, 50);
    });

    it('处理多位小数', () => {
      const f = Fraction.fromString('0.123');
      assert.strictEqual(f.numerator, 123);
      assert.strictEqual(f.denominator, 1000);
    });
  });

  describe('fromNumber', () => {
    it('从整数创建', () => {
      const f = Fraction.fromNumber(5);
      assert.strictEqual(f.numerator, 5);
      assert.strictEqual(f.denominator, 1);
    });

    it('从负整数创建', () => {
      const f = Fraction.fromNumber(-5);
      assert.strictEqual(f.numerator, -5);
      assert.strictEqual(f.denominator, 1);
    });

    it('从浮点数创建', () => {
      const f = Fraction.fromNumber(3.14);
      assert.strictEqual(f.numerator, 157);
      assert.strictEqual(f.denominator, 50);
    });

    it('从0创建', () => {
      const f = Fraction.fromNumber(0);
      assert.strictEqual(f.numerator, 0);
      assert.strictEqual(f.denominator, 1);
    });
  });

  describe('add', () => {
    it('两个分数相加', () => {
      const f1 = new Fraction(1, 2);
      const f2 = new Fraction(1, 3);
      const result = f1.add(f2);
      assert.strictEqual(result.numerator, 5);
      assert.strictEqual(result.denominator, 6);
    });

    it('分数与整数相加', () => {
      const f = new Fraction(1, 2);
      const result = f.add(1);
      assert.strictEqual(result.numerator, 3);
      assert.strictEqual(result.denominator, 2);
    });

    it('负数相加', () => {
      const f1 = new Fraction(-1, 2);
      const f2 = new Fraction(1, 2);
      const result = f1.add(f2);
      assert.strictEqual(result.numerator, 0);
      assert.strictEqual(result.denominator, 1);
    });

    it('结果自动约分', () => {
      const f1 = new Fraction(1, 4);
      const f2 = new Fraction(1, 4);
      const result = f1.add(f2);
      assert.strictEqual(result.numerator, 1);
      assert.strictEqual(result.denominator, 2);
    });

    it('零相加', () => {
      const f1 = new Fraction(1, 2);
      const f2 = new Fraction(0, 1);
      const result = f1.add(f2);
      assert.strictEqual(result.numerator, 1);
      assert.strictEqual(result.denominator, 2);
    });
  });

  describe('subtract', () => {
    it('两个分数相减', () => {
      const f1 = new Fraction(1, 2);
      const f2 = new Fraction(1, 3);
      const result = f1.subtract(f2);
      assert.strictEqual(result.numerator, 1);
      assert.strictEqual(result.denominator, 6);
    });

    it('分数减去整数', () => {
      const f = new Fraction(3, 2);
      const result = f.subtract(1);
      assert.strictEqual(result.numerator, 1);
      assert.strictEqual(result.denominator, 2);
    });

    it('负数相减', () => {
      const f1 = new Fraction(1, 2);
      const f2 = new Fraction(1, 2);
      const result = f1.subtract(f2);
      assert.strictEqual(result.numerator, 0);
      assert.strictEqual(result.denominator, 1);
    });

    it('结果自动约分', () => {
      const f1 = new Fraction(3, 4);
      const f2 = new Fraction(1, 4);
      const result = f1.subtract(f2);
      assert.strictEqual(result.numerator, 1);
      assert.strictEqual(result.denominator, 2);
    });
  });

  describe('multiply', () => {
    it('两个分数相乘', () => {
      const f1 = new Fraction(1, 2);
      const f2 = new Fraction(2, 3);
      const result = f1.multiply(f2);
      assert.strictEqual(result.numerator, 1);
      assert.strictEqual(result.denominator, 3);
    });

    it('分数与整数相乘', () => {
      const f = new Fraction(1, 2);
      const result = f.multiply(3);
      assert.strictEqual(result.numerator, 3);
      assert.strictEqual(result.denominator, 2);
    });

    it('负数相乘', () => {
      const f1 = new Fraction(-1, 2);
      const f2 = new Fraction(1, 2);
      const result = f1.multiply(f2);
      assert.strictEqual(result.numerator, -1);
      assert.strictEqual(result.denominator, 4);
    });

    it('与零相乘', () => {
      const f = new Fraction(1, 2);
      const result = f.multiply(0);
      assert.strictEqual(result.numerator, 0);
      assert.strictEqual(result.denominator, 1);
    });

    it('结果自动约分', () => {
      const f1 = new Fraction(2, 3);
      const f2 = new Fraction(3, 4);
      const result = f1.multiply(f2);
      assert.strictEqual(result.numerator, 1);
      assert.strictEqual(result.denominator, 2);
    });
  });

  describe('divide', () => {
    it('两个分数相除', () => {
      const f1 = new Fraction(1, 2);
      const f2 = new Fraction(1, 3);
      const result = f1.divide(f2);
      assert.strictEqual(result.numerator, 3);
      assert.strictEqual(result.denominator, 2);
    });

    it('分数除以整数', () => {
      const f = new Fraction(3, 2);
      const result = f.divide(2);
      assert.strictEqual(result.numerator, 3);
      assert.strictEqual(result.denominator, 4);
    });

    it('整数除以分数', () => {
      const f = new Fraction(1, 2);
      const result = new Fraction(1, 1).divide(f);
      assert.strictEqual(result.numerator, 2);
      assert.strictEqual(result.denominator, 1);
    });

    it('除以零返回Infinity', () => {
      const f = new Fraction(1, 2);
      const result = f.divide(new Fraction(0, 1));
      assert.strictEqual(result, Infinity);
    });

    it('负数相除', () => {
      const f1 = new Fraction(-1, 2);
      const f2 = new Fraction(1, 2);
      const result = f1.divide(f2);
      assert.strictEqual(result.numerator, -1);
      assert.strictEqual(result.denominator, 1);
    });

    it('结果自动约分', () => {
      const f1 = new Fraction(2, 3);
      const f2 = new Fraction(4, 6);
      const result = f1.divide(f2);
      assert.strictEqual(result.numerator, 1);
      assert.strictEqual(result.denominator, 1);
    });
  });

  describe('negate', () => {
    it('正数取负', () => {
      const f = new Fraction(3, 4);
      const result = f.negate();
      assert.strictEqual(result.numerator, -3);
      assert.strictEqual(result.denominator, 4);
    });

    it('负数取负', () => {
      const f = new Fraction(-3, 4);
      const result = f.negate();
      assert.strictEqual(result.numerator, 3);
      assert.strictEqual(result.denominator, 4);
    });

    it('零取负', () => {
      const f = new Fraction(0, 1);
      const result = f.negate();
      assert.strictEqual(result.isZero(), true);
    });
  });

  describe('toNumber', () => {
    it('转换为数字', () => {
      const f = new Fraction(1, 2);
      assert.strictEqual(f.toNumber(), 0.5);
    });

    it('整数转换为数字', () => {
      const f = new Fraction(5, 1);
      assert.strictEqual(f.toNumber(), 5);
    });

    it('负数转换为数字', () => {
      const f = new Fraction(-3, 4);
      assert.strictEqual(f.toNumber(), -0.75);
    });

    it('零转换为数字', () => {
      const f = new Fraction(0, 1);
      assert.strictEqual(f.toNumber(), 0);
    });
  });

  describe('isFinite', () => {
    it('有限分数返回true', () => {
      const f = new Fraction(1, 2);
      assert.strictEqual(f.isFinite(), true);
    });

    it('整数返回true', () => {
      const f = new Fraction(5, 1);
      assert.strictEqual(f.isFinite(), true);
    });

    it('负数返回true', () => {
      const f = new Fraction(-3, 4);
      assert.strictEqual(f.isFinite(), true);
    });

    it('零返回true', () => {
      const f = new Fraction(0, 1);
      assert.strictEqual(f.isFinite(), true);
    });
  });

  describe('isZero', () => {
    it('零返回true', () => {
      const f = new Fraction(0, 1);
      assert.strictEqual(f.isZero(), true);
    });

    it('零分子返回true', () => {
      const f = new Fraction(0, 5);
      assert.strictEqual(f.isZero(), true);
    });

    it('非零返回false', () => {
      const f = new Fraction(1, 2);
      assert.strictEqual(f.isZero(), false);
    });

    it('负数返回false', () => {
      const f = new Fraction(-1, 2);
      assert.strictEqual(f.isZero(), false);
    });
  });

  describe('valueOf', () => {
    it('返回数值', () => {
      const f = new Fraction(1, 2);
      assert.strictEqual(f.valueOf(), 0.5);
    });

    it('可用于数值比较', () => {
      const f1 = new Fraction(1, 2);
      const f2 = new Fraction(2, 4);
      assert.strictEqual(f1.valueOf(), f2.valueOf());
    });
  });

  describe('复杂场景', () => {
    it('链式运算', () => {
      const f1 = new Fraction(1, 2);
      const f2 = new Fraction(1, 3);
      const f3 = new Fraction(1, 4);
      const result = f1.add(f2).multiply(f3);
      assert.strictEqual(result.numerator, 5);
      assert.strictEqual(result.denominator, 24);
    });

    it('大数约分', () => {
      const f = new Fraction(100, 200);
      assert.strictEqual(f.numerator, 1);
      assert.strictEqual(f.denominator, 2);
    });

    it('互质数保持原样', () => {
      const f = new Fraction(7, 11);
      assert.strictEqual(f.numerator, 7);
      assert.strictEqual(f.denominator, 11);
    });

    it('分数运算保持精度', () => {
      const f1 = Fraction.fromString('0.1');
      const f2 = Fraction.fromString('0.2');
      const result = f1.add(f2);
      assert.strictEqual(result.numerator, 3);
      assert.strictEqual(result.denominator, 10);
      assert.strictEqual(result.toNumber(), 0.3);
    });
  });
});

