import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Evaluator } from './evaluator.js';

export function printAST(node, indent = 0) {
  const spaces = '  '.repeat(indent);
  if (node.type === 'NUMBER') {
    return `${spaces}NUMBER: ${node.value}`;
  }
  if (node.type === 'VARIABLE') {
    return `${spaces}VARIABLE: ${node.name}`;
  }
  if (node.type === 'BINARY_OP') {
    return `${spaces}BINARY_OP: ${node.op}\n${printAST(node.left, indent + 1)}\n${printAST(node.right, indent + 1)}`;
  }
  if (node.type === 'UNARY_OP') {
    return `${spaces}UNARY_OP: ${node.op}\n${printAST(node.operand, indent + 1)}`;
  }
  if (node.type === 'EQUATION') {
    return `${spaces}EQUATION:\n${printAST(node.left, indent + 1)}\n${printAST(node.right, indent + 1)}`;
  }
  return `${spaces}${node.type}`;
}

export function extractVariable(equation) {
  const lexer = new Lexer(equation);
  let token = lexer.getNextToken();
  while (token.type !== 'EOF') {
    if (token.type === 'VARIABLE') {
      return token.value;
    }
    token = lexer.getNextToken();
  }
  return null;
}

export function solveEquation(equation) {
  // 从词法分析器提取变量名
  const targetVariable = extractVariable(equation);
  if (!targetVariable) {
    throw new Error('未找到变量');
  }

  // 词法分析
  const lexer = new Lexer(equation);
  
  // 语法分析
  const parser = new Parser(lexer);
  let ast;
  try {
    ast = parser.parse();
  } catch (e) {
    throw new Error('语法分析失败: ' + e.message);
  }

  // 调试：打印 AST（仅用于调试）
  // console.log(printAST(ast));

  // 语义分析和求解
  const evaluator = new Evaluator(ast, targetVariable);
  return evaluator.solve();
}

// 重新导出以便向后兼容
export { Lexer } from './lexer.js';
export { Parser } from './parser.js';
export { Evaluator } from './evaluator.js';
