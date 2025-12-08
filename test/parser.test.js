import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Parser } from '../lib/parser.js';
import { Lexer } from '../lib/lexer.js';

function parse(input) {
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);
  return parser.parse();
}

describe('Parser', () => {

  describe('equation parsing', () => {
    it('should parse simple equation', () => {
      const ast = parse('x = 5');
      assert.strictEqual(ast.type, 'EQUATION_SYSTEM');
      assert.strictEqual(ast.equations.length, 1);
      const equation = ast.equations[0];
      assert.strictEqual(equation.type, 'EQUATION');
      assert.strictEqual(equation.left.type, 'VARIABLE');
      assert.strictEqual(equation.left.name, 'x');
      assert.strictEqual(equation.right.type, 'NUMBER');
      assert.strictEqual(equation.right.value, '5');
    });

    it('should parse simple equation, semicolon is optional', () => {
      const ast = parse('x = 5;');
      assert.strictEqual(ast.type, 'EQUATION_SYSTEM');
      assert.strictEqual(ast.equations.length, 1);
      const equation = ast.equations[0];
      assert.strictEqual(equation.type, 'EQUATION');
      assert.strictEqual(equation.left.type, 'VARIABLE');
      assert.strictEqual(equation.left.name, 'x');
      assert.strictEqual(equation.right.type, 'NUMBER');
      assert.strictEqual(equation.right.value, '5');
    });

    it('should parse two equations equation system', () => {
      const ast = parse('x = 5; y = 1');
      assert.strictEqual(ast.type, 'EQUATION_SYSTEM');
      assert.strictEqual(ast.equations.length, 2);
      assert.strictEqual(ast.equations[0].type, 'EQUATION');
      assert.strictEqual(ast.equations[0].left.type, 'VARIABLE');
      assert.strictEqual(ast.equations[0].left.name, 'x');
      assert.strictEqual(ast.equations[0].right.type, 'NUMBER');
      assert.strictEqual(ast.equations[0].right.value, '5');
      assert.strictEqual(ast.equations[1].type, 'EQUATION');
      assert.strictEqual(ast.equations[1].left.type, 'VARIABLE');
      assert.strictEqual(ast.equations[1].left.name, 'y');
      assert.strictEqual(ast.equations[1].right.type, 'NUMBER');
      assert.strictEqual(ast.equations[1].right.value, '1');
    });

    it('should support + in equations', () => {
      const ast = parse('x + 1 = 5');
      assert.strictEqual(ast.type, 'EQUATION_SYSTEM');
      assert.strictEqual(ast.equations.length, 1);
      const equation = ast.equations[0];
      assert.strictEqual(equation.type, 'EQUATION');
      assert.strictEqual(equation.left.type, 'BINARY_OP');
      assert.strictEqual(equation.left.op, '+');
      assert.strictEqual(equation.left.left.type, 'VARIABLE');
      assert.strictEqual(equation.left.left.name, 'x');
      assert.strictEqual(equation.left.right.type, 'NUMBER');
      assert.strictEqual(equation.left.right.value, '1');
      assert.strictEqual(equation.right.type, 'NUMBER');
      assert.strictEqual(equation.right.value, '5');
    });

    it('should support - in equations', () => {
      const ast = parse('x - 1 = 5');
      assert.strictEqual(ast.type, 'EQUATION_SYSTEM');
      assert.strictEqual(ast.equations.length, 1);
      const equation = ast.equations[0];
      assert.strictEqual(equation.type, 'EQUATION');
    });

    it('should support * in equations', () => {
      const ast = parse('x * 1 = 5');
      assert.strictEqual(ast.type, 'EQUATION_SYSTEM');
      assert.strictEqual(ast.equations.length, 1);
      const equation = ast.equations[0];
      assert.strictEqual(equation.type, 'EQUATION');
      assert.strictEqual(equation.left.type, 'BINARY_OP');
      assert.strictEqual(equation.left.op, '*');
    });

    it('should support / in equations', () => {
      const ast = parse('x / 1 = 5');
      assert.strictEqual(ast.type, 'EQUATION_SYSTEM');
      assert.strictEqual(ast.equations.length, 1);
      const equation = ast.equations[0];
      assert.strictEqual(equation.type, 'EQUATION');
    });

    it('should support implicit multiplication in equations', () => {
      const ast = parse('1x = 5');
      assert.strictEqual(ast.type, 'EQUATION_SYSTEM');
      assert.strictEqual(ast.equations.length, 1);
      const equation = ast.equations[0];
      assert.strictEqual(equation.type, 'EQUATION');
      assert.strictEqual(equation.left.type, 'BINARY_OP');
      assert.strictEqual(equation.left.op, '*');
      assert.strictEqual(equation.left.left.type, 'NUMBER');
      assert.strictEqual(equation.left.left.value, '1');
      assert.strictEqual(equation.left.right.type, 'VARIABLE');
      assert.strictEqual(equation.left.right.name, 'x');
      assert.strictEqual(equation.right.type, 'NUMBER');
      assert.strictEqual(equation.right.value, '5');
    });

    it('should support parentheses in equations', () => {
      const ast = parse('(x + 1) = 5');
      assert.strictEqual(ast.type, 'EQUATION_SYSTEM');
      assert.strictEqual(ast.equations.length, 1);
      const equation = ast.equations[0];
      assert.strictEqual(equation.type, 'EQUATION');
      assert.strictEqual(equation.left.type, 'BINARY_OP');
      assert.strictEqual(equation.left.op, '+');
      assert.strictEqual(equation.left.left.type, 'VARIABLE');
      assert.strictEqual(equation.left.left.name, 'x');
      assert.strictEqual(equation.left.right.type, 'NUMBER');
      assert.strictEqual(equation.left.right.value, '1');
      assert.strictEqual(equation.right.type, 'NUMBER');
      assert.strictEqual(equation.right.value, '5');
    });

    it('should support parentheses in equations', () => {
      const ast = parse('(x + 1)y = 5');
      assert.strictEqual(ast.type, 'EQUATION_SYSTEM');
      assert.strictEqual(ast.equations.length, 1);
      const equation = ast.equations[0];
      assert.strictEqual(equation.type, 'EQUATION');
      assert.strictEqual(equation.left.type, 'BINARY_OP');
      assert.strictEqual(equation.left.op, '*');
      assert.strictEqual(equation.left.left.type, 'BINARY_OP');
      assert.strictEqual(equation.left.left.op, '+');
      assert.strictEqual(equation.left.left.left.type, 'VARIABLE');
      assert.strictEqual(equation.left.left.left.name, 'x');
      assert.strictEqual(equation.left.left.right.type, 'NUMBER');
      assert.strictEqual(equation.left.left.right.value, '1');
      assert.strictEqual(equation.left.right.type, 'VARIABLE');
      assert.strictEqual(equation.left.right.name, 'y');
      assert.strictEqual(equation.right.type, 'NUMBER');
      assert.strictEqual(equation.right.value, '5');
    });

    it('should support parentheses in equations', () => {
      const ast = parse('1 + 3 * 5 = x');
      assert.strictEqual(ast.type, 'EQUATION_SYSTEM');
      assert.strictEqual(ast.equations.length, 1);
      const equation = ast.equations[0];
      assert.strictEqual(equation.type, 'EQUATION');
      assert.strictEqual(equation.left.type, 'BINARY_OP');
      assert.strictEqual(equation.left.op, '+');
      assert.strictEqual(equation.left.left.type, 'NUMBER');
      assert.strictEqual(equation.left.left.value, '1');
      assert.strictEqual(equation.left.right.type, 'BINARY_OP');
      assert.strictEqual(equation.left.right.op, '*');
      assert.strictEqual(equation.left.right.left.type, 'NUMBER');
      assert.strictEqual(equation.left.right.left.value, '3');
      assert.strictEqual(equation.left.right.right.type, 'NUMBER');
      assert.strictEqual(equation.left.right.right.value, '5');
      assert.strictEqual(equation.right.type, 'VARIABLE');
      assert.strictEqual(equation.right.name, 'x');
    });

    it('should support parentheses in equations', () => {
      const ast = parse('xy = 1');
      assert.strictEqual(ast.type, 'EQUATION_SYSTEM');
      assert.strictEqual(ast.equations.length, 1);
      const equation = ast.equations[0];
      assert.strictEqual(equation.type, 'EQUATION');
      assert.strictEqual(equation.left.type, 'BINARY_OP');
      assert.strictEqual(equation.left.op, '*');
      assert.strictEqual(equation.left.left.type, 'VARIABLE');
      assert.strictEqual(equation.left.left.name, 'x');
      assert.strictEqual(equation.left.right.type, 'VARIABLE');
      assert.strictEqual(equation.left.right.name, 'y');
      assert.strictEqual(equation.right.type, 'NUMBER');
      assert.strictEqual(equation.right.value, '1');
    });

    it('should support parentheses in equations', () => {
      const ast = parse('x(y)z = 1');
      assert.strictEqual(ast.type, 'EQUATION_SYSTEM');
      assert.strictEqual(ast.equations.length, 1);
      const equation = ast.equations[0];
      assert.strictEqual(equation.type, 'EQUATION');
      assert.strictEqual(equation.left.type, 'BINARY_OP');
      assert.strictEqual(equation.left.op, '*');
      assert.strictEqual(equation.left.left.type, 'VARIABLE');
      assert.strictEqual(equation.left.left.name, 'x');
      assert.strictEqual(equation.left.right.type, 'BINARY_OP');
      assert.strictEqual(equation.left.right.op, '*');
      assert.strictEqual(equation.left.right.left.type, 'VARIABLE');
      assert.strictEqual(equation.left.right.left.name, 'y');
      assert.strictEqual(equation.left.right.right.type, 'VARIABLE');
      assert.strictEqual(equation.left.right.right.name, 'z');
      assert.strictEqual(equation.right.type, 'NUMBER');
      assert.strictEqual(equation.right.value, '1');
    }); 
  });

  describe('Exceptions', () => {
    it('should throw error when unexpected token is encountered', () => {
      assert.throws(
        () => parse(')'),
        (error) => {
          assert.strictEqual(error.message, 'Unexpected token: RPAREN, expected NUMBER, VARIABLE, LPAREN');
          return true;
        }
      );
    });

    it('should throw error when missing equals sign', () => {
      assert.throws(
        () => parse('x + 5'),
        (error) => {
          assert.strictEqual(error.message, 'Expected EQUALS，but got EOF');
          return true;
        }
      );

      assert.throws(
        () => parse('2x'),
        (error) => {
          assert.strictEqual(error.message, 'Expected EQUALS，but got EOF');
          return true;
        }
      );
    });

    it('should throw error when parentheses are not matched', () => {
      assert.throws(
        () => parse('(x + 1'),
        (error) => {
          assert.strictEqual(error.message, 'Expected RPAREN，but got EOF');
          return true;
        }
      );
    });

    it('should throw error when missing variable', () => {
      assert.throws(
        () => parse('2x ='),
        (error) => {
          assert.strictEqual(error.message, 'Unexpected token: EOF, expected NUMBER, VARIABLE, LPAREN');
          return true;
        }
      );
    });

    it('should throw error when missing left side', () => {
      assert.throws(
        () => parse('= 5'),
        (error) => {
          assert.strictEqual(error.message, 'Unexpected token: EQUALS, expected NUMBER, VARIABLE, LPAREN');
          return true;
        });
    });
  });
});
