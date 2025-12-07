import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SemanticChecker } from '../lib/semantic-checker.js';
import { Lexer } from '../lib/lexer.js';
import { Parser } from '../lib/parser.js';

// 辅助函数：解析方程并返回 AST
function parseEquation(equation) {
  const lexer = new Lexer(equation);
  const parser = new Parser(lexer);
  return parser.parse();
}

describe('SemanticChecker', () => {
  describe('extractAllVariables', () => {
    it('应该提取单个变量', () => {
      const ast = parseEquation('x = 5');
      const checker = new SemanticChecker(ast, 'x');
      const variables = checker.extractAllVariables(ast);
      assert.strictEqual(variables.size, 1);
      assert.ok(variables.has('x'));
    });

    it('应该提取多个不同变量', () => {
      const ast = parseEquation('y = x');
      const checker = new SemanticChecker(ast, 'y');
      const variables = checker.extractAllVariables(ast);
      assert.strictEqual(variables.size, 2);
      assert.ok(variables.has('x'));
      assert.ok(variables.has('y'));
    });

    it('应该提取复杂表达式中的所有变量', () => {
      const ast = parseEquation('2x(3y-4)=4y-7(4-z)');
      const checker = new SemanticChecker(ast, 'x');
      const variables = checker.extractAllVariables(ast);
      assert.strictEqual(variables.size, 3);
      assert.ok(variables.has('x'));
      assert.ok(variables.has('y'));
      assert.ok(variables.has('z'));
    });

    it('应该只提取一次重复的变量', () => {
      const ast = parseEquation('x + x = 10');
      const checker = new SemanticChecker(ast, 'x');
      const variables = checker.extractAllVariables(ast);
      assert.strictEqual(variables.size, 1);
      assert.ok(variables.has('x'));
    });
  });

  describe('containsVariable', () => {
    it('应该在变量节点中找到变量', () => {
      const ast = parseEquation('x = 5');
      const checker = new SemanticChecker(ast, 'x');
      const varNode = ast.left;
      assert.strictEqual(checker.containsVariable(varNode, 'x'), true);
    });

    it('应该在复杂表达式中找到变量', () => {
      const ast = parseEquation('2x + 3 = 10');
      const checker = new SemanticChecker(ast, 'x');
      assert.strictEqual(checker.containsVariable(ast.left, 'x'), true);
    });

    it('应该在没有变量的表达式中返回 false', () => {
      const ast = parseEquation('2 + 3 = 5');
      const checker = new SemanticChecker(ast, 'x');
      assert.strictEqual(checker.containsVariable(ast.left, 'x'), false);
    });

    it('应该在嵌套表达式中找到变量', () => {
      const ast = parseEquation('2(x + 3) = 10');
      const checker = new SemanticChecker(ast, 'x');
      assert.strictEqual(checker.containsVariable(ast.left, 'x'), true);
    });
  });

  describe('isSimpleVariableEquality', () => {
    it('应该识别 y = x 形式', () => {
      const ast = parseEquation('y = x');
      const checker = new SemanticChecker(ast, 'y');
      assert.strictEqual(checker.isSimpleVariableEquality(), true);
    });

    it('应该识别 x = y 形式', () => {
      const ast = parseEquation('x = y');
      const checker = new SemanticChecker(ast, 'x');
      assert.strictEqual(checker.isSimpleVariableEquality(), true);
    });

    it('不应该识别单变量方程', () => {
      const ast = parseEquation('x = 5');
      const checker = new SemanticChecker(ast, 'x');
      assert.strictEqual(checker.isSimpleVariableEquality(), false);
    });

    it('不应该识别复杂表达式', () => {
      const ast = parseEquation('2x = 4');
      const checker = new SemanticChecker(ast, 'x');
      assert.strictEqual(checker.isSimpleVariableEquality(), false);
    });

    it('不应该识别相同变量的等式', () => {
      const ast = parseEquation('x = x');
      const checker = new SemanticChecker(ast, 'x');
      assert.strictEqual(checker.isSimpleVariableEquality(), false);
    });
  });

  describe('isVariableDifferenceEquality', () => {
    it('应该识别 y - x = 0 形式', () => {
      const ast = parseEquation('y - x = 0');
      const checker = new SemanticChecker(ast, 'y');
      assert.strictEqual(checker.isVariableDifferenceEquality(), true);
    });

    it('应该识别 x - y = 0 形式', () => {
      const ast = parseEquation('x - y = 0');
      const checker = new SemanticChecker(ast, 'x');
      assert.strictEqual(checker.isVariableDifferenceEquality(), true);
    });

    it('应该识别 0 = y - x 形式', () => {
      const ast = parseEquation('0 = y - x');
      const checker = new SemanticChecker(ast, 'y');
      assert.strictEqual(checker.isVariableDifferenceEquality(), true);
    });

    it('应该识别 0 = x - y 形式', () => {
      const ast = parseEquation('0 = x - y');
      const checker = new SemanticChecker(ast, 'x');
      assert.strictEqual(checker.isVariableDifferenceEquality(), true);
    });

    it('不应该识别单变量差', () => {
      const ast = parseEquation('x - 5 = 0');
      const checker = new SemanticChecker(ast, 'x');
      assert.strictEqual(checker.isVariableDifferenceEquality(), false);
    });

    it('不应该识别非零常数', () => {
      const ast = parseEquation('y - x = 1');
      const checker = new SemanticChecker(ast, 'y');
      assert.strictEqual(checker.isVariableDifferenceEquality(), false);
    });

    it('不应该识别加法形式', () => {
      const ast = parseEquation('y + x = 0');
      const checker = new SemanticChecker(ast, 'y');
      assert.strictEqual(checker.isVariableDifferenceEquality(), false);
    });
  });

  describe('check', () => {
    it('应该允许单变量方程通过', () => {
      const ast = parseEquation('x = 5');
      const checker = new SemanticChecker(ast, 'x');
      assert.doesNotThrow(() => checker.check());
    });

    it('应该允许多变量方程通过（如果可求解）', () => {
      const ast = parseEquation('2x(3y-4)=4y-7(4-y)');
      const checker = new SemanticChecker(ast, 'x');
      assert.doesNotThrow(() => checker.check());
    });

    it('应该拒绝 y = x 形式', () => {
      const ast = parseEquation('y = x');
      const checker = new SemanticChecker(ast, 'y');
      assert.throws(
        () => checker.check(),
        (error) => error.message === '方程包含多个变量，无法求解单个变量的值'
      );
    });

    it('应该拒绝 x = y 形式', () => {
      const ast = parseEquation('x = y');
      const checker = new SemanticChecker(ast, 'x');
      assert.throws(
        () => checker.check(),
        (error) => error.message === '方程包含多个变量，无法求解单个变量的值'
      );
    });

    it('应该拒绝 y - x = 0 形式', () => {
      const ast = parseEquation('y - x = 0');
      const checker = new SemanticChecker(ast, 'y');
      assert.throws(
        () => checker.check(),
        (error) => error.message === '方程包含多个变量，无法求解单个变量的值'
      );
    });

    it('应该拒绝 x - y = 0 形式', () => {
      const ast = parseEquation('x - y = 0');
      const checker = new SemanticChecker(ast, 'x');
      assert.throws(
        () => checker.check(),
        (error) => error.message === '方程包含多个变量，无法求解单个变量的值'
      );
    });

    it('应该拒绝 0 = y - x 形式', () => {
      const ast = parseEquation('0 = y - x');
      const checker = new SemanticChecker(ast, 'y');
      assert.throws(
        () => checker.check(),
        (error) => error.message === '方程包含多个变量，无法求解单个变量的值'
      );
    });

    it('应该拒绝 0 = x - y 形式', () => {
      const ast = parseEquation('0 = x - y');
      const checker = new SemanticChecker(ast, 'x');
      assert.throws(
        () => checker.check(),
        (error) => error.message === '方程包含多个变量，无法求解单个变量的值'
      );
    });
  });
});

