import test from 'node:test';
import assert from 'node:assert';
import { solveEquation } from '../lib/solve.js';

// 正常测试用例
const testCases = [
  // 基础线性方程
  { equation: '2x = 4', expected: 2, description: '简单乘法' },
  { equation: '3x + 2 = 8', expected: 2, description: '加法' },
  { equation: '5x - 3 = 12', expected: 3, description: '减法' },
  { equation: 'x + 5 = 10', expected: 5, description: '单变量' },
  { equation: '2x - 1 = 5', expected: 3, description: '减法和乘法' },
  
  // 除法相关
  { equation: '8 / 2x = 2', expected: 2, description: '除法隐式乘法' },
  { equation: '10 / 5x = 1', expected: 2, description: '除法隐式乘法2' },
  { equation: '12 / 3x = 2', expected: 2, description: '除法隐式乘法3' },
  
  // 括号和隐式乘法
  { equation: '2(3y-4)=4y-7(4-y)', expected: 4, description: '括号和隐式乘法', variable: 'y' },
  { equation: '2*(3y-4)=4y-7(4-y)', expected: 4, description: '显式乘法', variable: 'y' },
  { equation: '3(x+2) = 15', expected: 3, description: '括号表达式' },
  { equation: '2(x-1) = 6', expected: 4, description: '括号减法' },
  
  // 复杂方程
  { equation: '(x+3.5)/0.9=15*(x+3.5)-125', expected: 5.5, description: '复杂分数方程', tolerance: 0.1 },
  { equation: '2x + 3(x-1) = 10', expected: 2.6, description: '混合表达式', tolerance: 0.1 },
  
  // 小数
  { equation: '0.5x = 2', expected: 4, description: '小数系数' },
  { equation: '1.5x + 0.5 = 5', expected: 3, description: '小数加常数', tolerance: 0.1 },
  
  // 负数
  { equation: '-x = 5', expected: -5, description: '负变量' },
  { equation: '2x - 10 = -4', expected: 3, description: '负数结果' },
  
  // 多变量（只求解第一个变量）
  { equation: '2x(3y-4)=4y-7(4-y)', expected: 3.5, description: '多变量方程', tolerance: 0.1 },
];

// 错误情况测试
const errorCases = [
  { equation: '2x = 2x', expectedError: '方程有无数解', description: '恒等式' },
  { equation: '2x = 2x + 1', expectedError: '方程无解', description: '矛盾方程' },
  { equation: '2x', expectedError: '语法分析失败', description: '无等号' },
  { equation: '= 5', expectedError: '未找到变量', description: '无左侧' },
  { equation: '2x =', expectedError: '语法分析失败', description: '无右侧' },
];

// 运行正常测试用例
test('正常测试用例', async (t) => {
  for (const testCase of testCases) {
    await t.test(testCase.description, () => {
      const result = solveEquation(testCase.equation);
      const tolerance = testCase.tolerance || 0.0001;
      const diff = Math.abs(result.value - testCase.expected);
      
      assert.ok(
        diff <= tolerance,
        `${testCase.equation}: 期望 ${testCase.expected}, 实际 ${result.value}, 差异 ${diff}`
      );
    });
  }
});

// 运行错误情况测试
test('错误情况测试', async (t) => {
  for (const testCase of errorCases) {
    await t.test(testCase.description, () => {
      assert.throws(
        () => solveEquation(testCase.equation),
        (error) => {
          return error.message.includes(testCase.expectedError) || 
                 testCase.expectedError.includes(error.message);
        },
        `应该抛出包含 "${testCase.expectedError}" 的错误`
      );
    });
  }
});
