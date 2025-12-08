import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SemanticChecker } from '../lib/semantic-checker.js';
import { Lexer } from '../lib/lexer.js';
import { Parser } from '../lib/parser.js';

function check(input) {
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);
  const ast = parser.parse();
  const checker = new SemanticChecker(ast);
  checker.check();
}

describe('SemanticChecker', () => {
  it('should allow single variable equation', () => {
    assert.doesNotThrow(() => check('x = 5'));
  });

  it('should throw error when equation have 0 variables', () => {
    assert.throws(
      () => check('2 = 5'),
      (error) => {
        console.log(error.stack);
        assert.strictEqual(error.message, 'Equation does not contain any variables');
        return true;
      }
    );

    assert.throws(
      () => check('2 = 5; x = 3'),
      (error) => {
        assert.strictEqual(error.message, 'Equation does not contain any variables');
        return true;
      }
    );

    assert.throws(
      () => check('2 * 3 + 4 - 5 = 5; x = 3'),
      (error) => {
        assert.strictEqual(error.message, 'Equation does not contain any variables');
        return true;
      }
    );
  });
});
