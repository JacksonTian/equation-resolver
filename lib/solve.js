import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Evaluator } from './evaluator.js';
import { SemanticChecker } from './semantic-checker.js';

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

// 从 AST 中提取所有变量
function extractAllVariablesFromAST(node) {
  const variables = new Set();
  
  if (node.type === 'VARIABLE') {
    variables.add(node.name);
  } else if (node.type === 'BINARY_OP') {
    extractAllVariablesFromAST(node.left).forEach(v => variables.add(v));
    extractAllVariablesFromAST(node.right).forEach(v => variables.add(v));
  } else if (node.type === 'UNARY_OP') {
    extractAllVariablesFromAST(node.operand).forEach(v => variables.add(v));
  } else if (node.type === 'EQUATION') {
    extractAllVariablesFromAST(node.left).forEach(v => variables.add(v));
    extractAllVariablesFromAST(node.right).forEach(v => variables.add(v));
  }
  
  return variables;
}

// 获取变量在表达式中的系数
function getVariableCoefficient(ast, variable, allVariables) {
  const standardForm = {
    type: 'BINARY_OP',
    op: '-',
    left: ast.left,
    right: ast.right
  };
  
  // 创建一个临时的 Evaluator 来计算系数
  const evaluator = new Evaluator({ type: 'EQUATION', left: ast.left, right: ast.right }, variable);
  
  // 使用两个不同的变量值来计算系数
  // 对于目标变量，使用 1 和 0
  // 对于其他变量，需要特殊处理
  const values1 = {};
  const values0 = {};
  
  allVariables.forEach(v => {
    if (v === variable) {
      values1[v] = 1;
      values0[v] = 0;
    } else {
      values1[v] = 0;
      values0[v] = 0;
    }
  });
  
  const val1 = evaluateWithValues(standardForm, values1, allVariables);
  const val0 = evaluateWithValues(standardForm, values0, allVariables);
  
  if (!isFinite(val0)) {
    const values2 = {};
    allVariables.forEach(v => {
      if (v === variable) {
        values2[v] = 2;
      } else {
        values2[v] = 0;
      }
    });
    const val2 = evaluateWithValues(standardForm, values2, allVariables);
    return val2 - val1;
  }
  
  return val1 - val0;
}

// 使用给定的变量值计算表达式
function evaluateWithValues(node, variableValues, allVariables) {
  if (node.type === 'NUMBER') {
    return node.value;
  }
  
  if (node.type === 'VARIABLE') {
    return variableValues[node.name] || 0;
  }
  
  if (node.type === 'UNARY_OP') {
    const operand = evaluateWithValues(node.operand, variableValues, allVariables);
    return node.op === '+' ? operand : -operand;
  }
  
  if (node.type === 'BINARY_OP') {
    const left = evaluateWithValues(node.left, variableValues, allVariables);
    const right = evaluateWithValues(node.right, variableValues, allVariables);
    
    switch (node.op) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/':
        if (right === 0) {
          return Infinity;
        }
        return left / right;
      default:
        throw new Error(`未知的运算符: ${node.op}`);
    }
  }
  
  throw new Error(`未知的节点类型: ${node.type}`);
}

// 获取常数项
function getConstant(ast, allVariables) {
  const standardForm = {
    type: 'BINARY_OP',
    op: '-',
    left: ast.left,
    right: ast.right
  };
  
  const values = {};
  allVariables.forEach(v => {
    values[v] = 0;
  });
  
  const val0 = evaluateWithValues(standardForm, values, allVariables);
  
  if (!isFinite(val0)) {
    const values1 = {};
    allVariables.forEach(v => {
      values1[v] = 1;
    });
    const val1 = evaluateWithValues(standardForm, values1, allVariables);
    
    const values2 = {};
    allVariables.forEach(v => {
      values2[v] = 2;
    });
    const val2 = evaluateWithValues(standardForm, values2, allVariables);
    
    // 计算所有变量的系数和
    let totalCoeff = 0;
    allVariables.forEach(v => {
      const coeff = getVariableCoefficient(ast, v, allVariables);
      totalCoeff += coeff;
    });
    
    return val1 - totalCoeff;
  }
  
  return val0;
}

// 高斯消元法求解线性方程组
function gaussianElimination(matrix) {
  const n = matrix.length;
  const m = matrix[0].length - 1; // 变量数量
  
  // 前向消元
  for (let i = 0; i < Math.min(n, m); i++) {
    // 找到主元（绝对值最大的行）
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(matrix[k][i]) > Math.abs(matrix[maxRow][i])) {
        maxRow = k;
      }
    }
    
    // 交换行
    [matrix[i], matrix[maxRow]] = [matrix[maxRow], matrix[i]];
    
    // 如果主元为 0，跳过
    if (Math.abs(matrix[i][i]) < 1e-10) {
      continue;
    }
    
    // 消元
    for (let k = i + 1; k < n; k++) {
      const factor = matrix[k][i] / matrix[i][i];
      for (let j = i; j <= m; j++) {
        matrix[k][j] -= factor * matrix[i][j];
      }
    }
  }
  
  // 回代
  const solution = new Array(m).fill(0);
  for (let i = Math.min(n, m) - 1; i >= 0; i--) {
    if (Math.abs(matrix[i][i]) < 1e-10) {
      if (Math.abs(matrix[i][m]) > 1e-10) {
        throw new Error('方程组无解');
      }
      continue;
    }
    
    solution[i] = matrix[i][m];
    for (let j = i + 1; j < m; j++) {
      solution[i] -= matrix[i][j] * solution[j];
    }
    solution[i] /= matrix[i][i];
  }
  
  // 检查是否有未确定的变量
  for (let i = 0; i < n; i++) {
    let hasNonZero = false;
    for (let j = 0; j < m; j++) {
      if (Math.abs(matrix[i][j]) > 1e-10) {
        hasNonZero = true;
        break;
      }
    }
    if (!hasNonZero && Math.abs(matrix[i][m]) > 1e-10) {
      throw new Error('方程组无解');
    }
  }
  
  return solution;
}

// 求解多元一次方程组
export function solveSystem(equationsString) {
  // 按分号分割方程
  const equationStrings = equationsString.split(';').map(s => s.trim()).filter(s => s.length > 0);
  
  if (equationStrings.length === 0) {
    throw new Error('未提供方程');
  }
  
  // 解析所有方程
  const equations = [];
  const allVariablesSet = new Set();
  
  for (const eqStr of equationStrings) {
    const lexer = new Lexer(eqStr);
    const parser = new Parser(lexer);
    let ast;
    try {
      ast = parser.parse();
    } catch (e) {
      throw new Error(`语法分析失败 (${eqStr}): ${e.message}`);
    }
    
    const variables = extractAllVariablesFromAST(ast);
    variables.forEach(v => allVariablesSet.add(v));
    equations.push(ast);
  }
  
  if (allVariablesSet.size === 0) {
    throw new Error('未找到变量');
  }
  
  if (equations.length < allVariablesSet.size) {
    throw new Error(`方程数量 (${equations.length}) 少于变量数量 (${allVariablesSet.size})`);
  }
  
  // 按字母顺序排序变量
  const allVariables = Array.from(allVariablesSet).sort();
  
  // 构建增广矩阵
  const matrix = [];
  for (const ast of equations) {
    const row = [];
    for (const variable of allVariables) {
      const coeff = getVariableCoefficient(ast, variable, allVariables);
      row.push(coeff);
    }
    const constant = getConstant(ast, allVariables);
    row.push(-constant); // 移项到右边
    matrix.push(row);
  }
  
  // 使用高斯消元法求解
  const solution = gaussianElimination(matrix);
  
  // 构建结果对象
  const result = {};
  for (let i = 0; i < allVariables.length; i++) {
    result[allVariables[i]] = solution[i];
  }
  
  return result;
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

  // 语义检查
  const semanticChecker = new SemanticChecker(ast, targetVariable);
  semanticChecker.check();

  // 语义分析和求解
  const evaluator = new Evaluator(ast, targetVariable);
  return evaluator.solve();
}

// 重新导出以便向后兼容
export { Lexer } from './lexer.js';
export { Parser } from './parser.js';
export { Evaluator } from './evaluator.js';
export { SemanticChecker } from './semantic-checker.js';
