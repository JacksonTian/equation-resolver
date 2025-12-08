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
  describe('basic linear equation', () => {
    it('single variable simple multiplication should be solved', () => {
      const result = solve('2x = 4');
      assert.strictEqual(result.x, 2);
    });

    it('addition', () => {
      const result = solve('3x + 2 = 8');
      assert.strictEqual(result.x, 2);
    });

    it('subtraction', () => {
      const result = solve('5x - 3 = 12');
      assert.strictEqual(result.x, 3);
    });

    it('subtraction and multiplication', () => {
      const result = solve('2x - 1 = 5');
      assert.strictEqual(result.x, 3);
    });
  });

  describe('division related', () => {
    it('implicit multiplication by division', () => {
      const result = solve('8 / 2x = 2');
      assert.strictEqual(result.x, 2);
    });

    it('implicit multiplication by division 2', () => {
      const result = solve('10 / 5x = 1');
      assert.strictEqual(result.x, 2);
    });

    it('implicit multiplication by division 3', () => {
      const result = solve('12 / 3x = 2');
      assert.strictEqual(result.x, 2);
    });
  });

  describe('parentheses and implicit multiplication', () => {
    it('parentheses and implicit multiplication', () => {
      const result = solve('2(3y-4)=4y-7(4-y)');
      assert.strictEqual(result.y, 4);
    });

    it('explicit multiplication', () => {
      const result = solve('2*(3y-4)=4y-7(4-y)');
      assert.strictEqual(result.y, 4);
    });

    it('parentheses expression', () => {
      const result = solve('3(x+2) = 15');
      assert.strictEqual(result.x, 3);
    });

    it('parentheses subtraction', () => {
      const result = solve('2(x-1) = 6');
      assert.strictEqual(result.x, 4);
    });
  });

  describe('complex equations', () => {
    it('complex fraction equation', () => {
      const result = solve('(x+3.5)/0.9=15*(x+3.5)-125');
      assert.strictEqual(result.x, 5.5);
    });

    it('mixed expression', () => {
      const result = solve('2x + 3(x-1) = 10');
      assert.strictEqual(result.x, 2.6);
    });
  });

  describe('decimal', () => {
    it('decimal coefficient', () => {
      const result = solve('0.5x = 2');
      assert.strictEqual(result.x, 4);
    });

    it('decimal addition of constant', () => {
      const result = solve('1.5x + 0.5 = 5');
      assert.strictEqual(result.x, 3);
    });
  });

  // describe('负数', () => {
  //   it('负变量', () => {
  //     const result = solve('-x = 5');
  //     assert.strictEqual(result.x, -5);
  //   });

  //   it('负数结果', () => {
  //     const result = solve('2x - 10 = -4');
  //     assert.strictEqual(result.x, 3);
  //   });
  // });

  describe('error cases', () => {
    it('identity equation', () => {
      assert.throws(
        () => solve('2x = 2x'),
        (error) => {
          assert.strictEqual(error.message, 'Equation has infinite solutions');
          return true;
        }
      );
    });

    it('contradictory equation', () => {
      assert.throws(
        () => solve('2x = 2x + 1'),
        (error) => {
          assert.strictEqual(error.message, 'Equation system has no solution');
          return true;
        }
      );
    });
  });

  describe('binary linear equation system', () => {
    it('simple binary linear equation system', () => {
      const result = solve('x + y = 5; x - y = 1');
      assert.strictEqual(result.x, 3);
      assert.strictEqual(result.y, 2);
    });

    it('binary linear equation system with coefficients', () => {
      const result = solve('2x + 3y = 7; 3x - 2y = 4');
      assert.strictEqual(result.x, 2);
      assert.strictEqual(result.y, 1);
    });

    it('binary linear equation system with negative numbers', () => {
      const result = solve('x - y = 3; 2x + y = 0');
      assert.strictEqual(result.x, 1);
      assert.strictEqual(result.y, -2);
    });

    it('binary linear equation system with decimals', () => {
      const result = solve('0.5x + y = 2; x - 0.5y = 3');
      assert.strictEqual(result.x, 3.2);
      assert.strictEqual(result.y, 0.4);
    });
  });

  describe('three linear equation system', () => {
    it('simple three linear equation system', () => {
      const result = solve('x + y + z = 6; x - y + z = 2; x + y - z = 0');
      assert.strictEqual(result.x, 1);
      assert.strictEqual(result.y, 2);
      assert.strictEqual(result.z, 3);
    });

    it('three linear equation system with coefficients', () => {
      const result = solve('2x + y - z = 8; x - 2y + 3z = 1; 3x + 2y + z = 9');
      assert.strictEqual(result.x, 3.625);
      assert.strictEqual(result.y, -0.375);
      assert.strictEqual(result.z, -1.125);
    });
  });

  describe('equation system with parentheses', () => {
    it('parentheses expression', () => {
      const result = solve('2(x + y) = 6; x - y = 1');
      assert.strictEqual(result.x, 2);
      assert.strictEqual(result.y, 1);
    });

    it('complex parentheses expression', () => {
      const result = solve('3(x - 1) + 2y = 5; 2x + (y + 1) = 4');
      assert.strictEqual(result.x, -2);
      assert.strictEqual(result.y, 7);
    });
  });

  describe('different variable names', () => {
    it('different variable names', () => {
      const result = solve('a + b = 5; a - b = 1');
      assert.strictEqual(result.a, 3);
      assert.strictEqual(result.b, 2);
    });

    it('mixed variable names', () => {
      const result = solve('x + y = 5; x + z = 6; y + z = 7');
      assert.strictEqual(result.x, 2);
      assert.strictEqual(result.y, 3);
      assert.strictEqual(result.z, 4);
    });
  });

  describe('equation system error cases', () => {
    it('equation count is less than variable count', () => {
      assert.throws(
        () => solve('x + y = 5'),
        (error) => {
          assert.strictEqual(error.message, 'Equation count (1) is less than variable count (2)');
          return true;
        }
      );
    });

    it('equation system has no solution', () => {
      assert.throws(
        () => solve('x + y = 5; x + y = 10'),
        (error) => {
          assert.strictEqual(error.message, 'Equation system has no solution');
          return true;
        }
      );
    });
  });
});
