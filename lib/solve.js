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
  if (node.type === 'EQUATION_SYSTEM') {
    return `${spaces}EQUATION_SYSTEM:\n${node.equations.map(eq => printAST(eq, indent + 1)).join('\n')}`;
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

// 求解方程组（从 AST 中）
function solveSystemFromAST(ast) {
  const { equations } = ast;
  const allVariablesSet = new Set();
  
  // 提取所有变量
  for (const equation of equations) {
    const variables = extractAllVariablesFromAST(equation);
    variables.forEach(v => allVariablesSet.add(v));
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
  for (const equation of equations) {
    const row = [];
    for (const variable of allVariables) {
      const coeff = getVariableCoefficient(equation, variable, allVariables);
      row.push(coeff);
    }
    const constant = getConstant(equation, allVariables);
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


// 检查方程中是否有其他变量作为独立项（不是系数）
// 独立项是指：在加减法运算的顶层直接出现的其他变量，且该加减项不包含目标变量
// 例如：x + y + z = 1 中，y 和 z 是独立项
// 但 2x(3y-4)=4y-7(4-y) 中，虽然 y 在右边作为独立项，但 y 也在左边与 x 相乘，所以允许求解
function hasOtherVariablesAsIndependentTerms(ast, targetVariable) {
  const standardForm = {
    type: 'BINARY_OP',
    op: '-',
    left: ast.left,
    right: ast.right
  };
  
  // 检查节点是否包含目标变量
  const containsTarget = (node) => {
    if (node.type === 'VARIABLE') {
      return node.name === targetVariable;
    }
    if (node.type === 'BINARY_OP') {
      return containsTarget(node.left) || containsTarget(node.right);
    }
    if (node.type === 'UNARY_OP') {
      return containsTarget(node.operand);
    }
    return false;
  };
  
  // 检查是否有其他变量作为独立项
  // 只检查在加减法顶层直接出现的其他变量（不在乘法或除法中）
  const hasIndependentOtherVars = (node, isTopLevel = true) => {
    if (node.type === 'VARIABLE') {
      return node.name !== targetVariable;
    }
    if (node.type === 'BINARY_OP') {
      if (node.op === '+' || node.op === '-') {
        // 对于加减法，检查两边是否有独立的其他变量
        const leftHasTarget = containsTarget(node.left);
        const rightHasTarget = containsTarget(node.right);
        
        // 如果是在顶层，且某一边不包含目标变量，检查是否有其他变量
        if (isTopLevel) {
          if (!leftHasTarget && hasIndependentOtherVars(node.left, false)) {
            return true;
          }
          if (!rightHasTarget && hasIndependentOtherVars(node.right, false)) {
            return true;
          }
        }
        // 继续递归检查
        return hasIndependentOtherVars(node.left, false) || hasIndependentOtherVars(node.right, false);
      }
      if (node.op === '*' || node.op === '/') {
        // 对于乘除法，如果包含目标变量，则其他变量是系数，不是独立项
        if (containsTarget(node)) {
          return false;
        }
        // 如果乘除项中不包含目标变量，检查是否有其他变量
        return hasIndependentOtherVars(node.left, false) || hasIndependentOtherVars(node.right, false);
      }
    }
    if (node.type === 'UNARY_OP') {
      return hasIndependentOtherVars(node.operand, false);
    }
    return false;
  };
  
  return hasIndependentOtherVars(standardForm, true);
}

// 统一的求解函数，使用完整的词法、语法、语义分析流程
export function solve(input) {
  // 检查输入是否为空
  if (!input || input.trim().length === 0) {
    throw new Error('未提供方程');
  }
  
  // 先检查是否有变量（用于更好的错误提示）
  const hasVariable = /[a-z]/i.test(input);
  if (!hasVariable) {
    throw new Error('未找到变量');
  }
  
  // 词法分析
  const lexer = new Lexer(input);
  
  // 语法分析
  const parser = new Parser(lexer);
  let ast;
  try {
    ast = parser.parse();
  } catch (e) {
    // 如果错误消息已经包含"未提供方程"，直接抛出
    if (e.message.includes('未提供方程')) {
      throw new Error('未提供方程');
    }
    // 如果是语法错误且没有变量，抛出"未找到变量"
    if (!hasVariable || e.message.includes('意外的 token')) {
      // 检查是否是因为缺少左侧表达式
      if (input.trim().startsWith('=')) {
        throw new Error('未找到变量');
      }
    }
    throw new Error(`语法分析失败: ${e.message}`);
  }

  // 调试：打印 AST（仅用于调试）
  // console.log(printAST(ast));

  // 根据 AST 类型进行语义分析和求解
  if (ast.type === 'EQUATION_SYSTEM') {
    // 方程组求解
    return solveSystemFromAST(ast);
  }
  
  // 单方程求解
  if (ast.type !== 'EQUATION') {
    throw new Error(`意外的 AST 类型: ${ast.type}`);
  }

  // 从 AST 中提取变量名
  const allVariables = extractAllVariablesFromAST(ast);
  if (allVariables.size === 0) {
    throw new Error('未找到变量');
  }

  const targetVariable = Array.from(allVariables)[0];

  // 检查是否有多个变量
  if (allVariables.size > 1) {
    // 检查是否可以通过语义检查（某些多变量方程可以求解，如 2x(3y-4)=4y-7(4-y)）
    const semanticChecker = new SemanticChecker(ast, targetVariable);
    try {
      semanticChecker.check();
      // 如果能通过检查，再检查是否有其他变量作为独立项
      // 只对明显的独立项情况（如 x + y + z = 1）提示需要方程组
      // 对于其他情况（如 2x(3y-4)=4y-7(4-y)），允许求解（其他变量视为0）
      if (hasOtherVariablesAsIndependentTerms(ast, targetVariable)) {
        const varList = Array.from(allVariables).sort().join(', ');
        throw new Error(`方程包含多个变量 (${varList})，需要提供方程组。请使用分号分隔多个方程，例如: "x + y = 5; x - y = 1"`);
      }
    } catch (e) {
      // 如果检查失败，说明需要方程组
      if (e.message.includes('需要提供方程组')) {
        throw e;
      }
      const varList = Array.from(allVariables).sort().join(', ');
      throw new Error(`方程包含多个变量 (${varList})，需要提供方程组。请使用分号分隔多个方程，例如: "x + y = 5; x - y = 1"`);
    }
  }

  // 语义检查
  const semanticChecker = new SemanticChecker(ast, targetVariable);
  semanticChecker.check();

  // 语义分析和求解
  const evaluator = new Evaluator(ast, targetVariable);
  return evaluator.solve();
}

// 向后兼容的导出
export function solveEquation(equation) {
  return solve(equation);
}

export function solveSystem(equationsString) {
  // 如果输入没有分号，但包含多个变量，应该当作方程组处理
  // 先尝试解析，如果解析为单个方程且包含多个变量，则当作方程组处理
  const lexer = new Lexer(equationsString);
  const parser = new Parser(lexer);
  let ast;
  try {
    ast = parser.parse();
  } catch (e) {
    if (e.message.includes('未提供方程')) {
      throw new Error('未提供方程');
    }
    throw new Error(`语法分析失败: ${e.message}`);
  }
  
  // 如果是单个方程，检查变量数量
  if (ast.type === 'EQUATION') {
    const allVariables = extractAllVariablesFromAST(ast);
    if (allVariables.size > 1) {
      // 当作只有一个方程的方程组处理
      return solveSystemFromAST({ type: 'EQUATION_SYSTEM', equations: [ast] });
    }
  }
  
  // 否则使用统一的 solve 函数
  return solve(equationsString);
}


// 重新导出以便向后兼容
export { Lexer } from './lexer.js';
export { Parser } from './parser.js';
export { Evaluator } from './evaluator.js';
export { SemanticChecker } from './semantic-checker.js';
