import { Fraction } from './fraction.js';

// 单方程求值器
class EquationEvaluator {
  constructor(ast) {
    this.ast = ast;
  }

  // 将方程转换为标准形式: left - right = 0
  toStandardForm() {
    const {left} = this.ast;
    const {right} = this.ast;
    return {
      type: 'BINARY_OP',
      op: '-',
      left,
      right
    };
  }

  // 使用给定的变量值计算表达式（支持多变量）
  evaluateWithValues(node, variableValues) {
    if (node.type === 'NUMBER') {
      return Fraction.fromString(node.value);
    }
    
    if (node.type === 'VARIABLE') {
      const value = variableValues[node.name] || 0;
      return Fraction.fromNumber(value);
    }

    if (node.type === 'BINARY_OP') {
      const left = this.evaluateWithValues(node.left, variableValues);
      const right = this.evaluateWithValues(node.right, variableValues);

      // 处理 Infinity 情况
      if (left === Infinity || right === Infinity) {
        if (node.op === '/') {
          // Infinity / Infinity = 0 (未定式，这里简化为 0)
          if (right === Infinity) {
            return new Fraction(0, 1);
          }
          // a / Infinity = 0 (a 为有限数)
          return Infinity;
        }
        if (node.op === '*') {
          // Infinity * a = Infinity (a 为有限数)
          return Infinity;
        }
        if (node.op === '+' || node.op === '-') {
          // Infinity + a = Infinity, Infinity - a = Infinity (a 为有限数)
          return Infinity;
        }
        // 其他操作符不应该出现 Infinity，但为了安全返回 Infinity
        return Infinity;
      }

      switch (node.op) {
        case '+': return left.add(right);
        case '-': return left.subtract(right);
        case '*': return left.multiply(right);
        case '/':
          // 除以零返回 Infinity，与 Fraction.divide 保持一致
          // 这样在计算系数时可以使用备用方法
          return left.divide(right);
        default:
          throw new Error(`Unknown operator: ${node.op}`);
      }
    }

    throw new Error(`Unknown node type: ${node.type}`);
  }

  // 检查 AST 节点是否包含直接除以指定变量的项（不包括除以 2x 等情况）
  containsDivisionByVariable(node, variable) {
    if (node.type === 'BINARY_OP' && node.op === '/') {
      // 只检查右操作数是否直接是变量（不包括 2x 等情况）
      if (node.right.type === 'VARIABLE' && node.right.name === variable) {
        return true;
      }
      // 递归检查左右子树
      return this.containsDivisionByVariable(node.left, variable) ||
             this.containsDivisionByVariable(node.right, variable);
    } else if (node.type === 'BINARY_OP') {
      return this.containsDivisionByVariable(node.left, variable) ||
             this.containsDivisionByVariable(node.right, variable);
    }
    return false;
  }

  // 检查 AST 节点是否包含除以包含指定变量的表达式（如 3x, 2x 等）
  containsDivisionByVariableExpression(node, variable) {
    if (node.type === 'BINARY_OP' && node.op === '/') {
      // 检查右操作数是否包含变量
      if (this.containsVariable(node.right, variable)) {
        return { found: true, divisor: node.right };
      }
      // 递归检查左右子树
      const leftResult = this.containsDivisionByVariableExpression(node.left, variable);
      if (leftResult.found) return leftResult;
      const rightResult = this.containsDivisionByVariableExpression(node.right, variable);
      if (rightResult.found) return rightResult;
    } else if (node.type === 'BINARY_OP') {
      const leftResult = this.containsDivisionByVariableExpression(node.left, variable);
      if (leftResult.found) return leftResult;
      const rightResult = this.containsDivisionByVariableExpression(node.right, variable);
      if (rightResult.found) return rightResult;
    }
    return { found: false, divisor: null };
  }

  // 检查 AST 节点是否包含指定变量
  containsVariable(node, variable) {
    if (node.type === 'VARIABLE') {
      return node.name === variable;
    } else if (node.type === 'BINARY_OP') {
      return this.containsVariable(node.left, variable) ||
             this.containsVariable(node.right, variable);
    }
    return false;
  }

  // 将表达式乘以另一个表达式（用于消除除以包含变量的表达式）
  multiplyByExpression(node, expression) {
    if (node.type === 'NUMBER') {
      return {
        type: 'BINARY_OP',
        op: '*',
        left: node,
        right: expression
      };
    }
    if (node.type === 'VARIABLE') {
      return {
        type: 'BINARY_OP',
        op: '*',
        left: node,
        right: expression
      };
    }
    if (node.type === 'BINARY_OP') {
      if (node.op === '/') {
        // 如果除以表达式，直接返回左操作数（不需要再乘以表达式）
        // 这里需要深度比较，简化处理：如果右操作数结构相同，直接返回左操作数
        // 为了简化，我们假设如果右操作数包含变量，就认为匹配
        if (this.isSameExpression(node.right, expression)) {
          return node.left;
        }
        // 否则，左操作数乘以表达式，右操作数保持不变
        return {
          type: 'BINARY_OP',
          op: node.op,
          left: this.multiplyByExpression(node.left, expression),
          right: node.right
        };
      }
      // 对于其他操作符（+、-、*），递归处理左右子树
      return {
        type: 'BINARY_OP',
        op: node.op,
        left: this.multiplyByExpression(node.left, expression),
        right: this.multiplyByExpression(node.right, expression)
      };
    }
    return node;
  }

  // 简化版的表达式比较（用于判断两个表达式是否相同）
  isSameExpression(expr1, expr2) {
    // 简单的深度比较
    return JSON.stringify(expr1) === JSON.stringify(expr2);
  }

  // 将表达式乘以变量（用于消除除以变量的项）
  multiplyByVariable(node, variable) {
    if (node.type === 'NUMBER') {
      return {
        type: 'BINARY_OP',
        op: '*',
        left: node,
        right: { type: 'VARIABLE', name: variable }
      };
    }
    if (node.type === 'VARIABLE') {
      return {
        type: 'BINARY_OP',
        op: '*',
        left: node,
        right: { type: 'VARIABLE', name: variable }
      };
    }
    if (node.type === 'BINARY_OP') {
      if (node.op === '/') {
        // 如果除以变量，直接返回左操作数（不需要再乘以变量）
        if (node.right.type === 'VARIABLE' && node.right.name === variable) {
          return node.left;
        }
        // 否则，左操作数乘以变量，右操作数保持不变
        return {
          type: 'BINARY_OP',
          op: node.op,
          left: this.multiplyByVariable(node.left, variable),
          right: node.right
        };
      }
      // 对于其他操作符（+、-、*），递归处理左右子树
      return {
        type: 'BINARY_OP',
        op: node.op,
        left: this.multiplyByVariable(node.left, variable),
        right: this.multiplyByVariable(node.right, variable)
      };
    }
    return node;
  }

  // 获取指定变量的系数（支持多变量方程），返回 Fraction
  getVariableCoefficientFraction(variable, allVariables) {
    const standardForm = this.toStandardForm();
    
    // 检查是否包含除以变量的项
    const hasDivision = this.containsDivisionByVariable(standardForm, variable);
    
    let formToUse = standardForm;
    if (hasDivision) {
      // 如果包含除以变量的项，将整个表达式乘以变量
      formToUse = this.multiplyByVariable(standardForm, variable);
    }
    
    // 使用两个不同的变量值来计算系数
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

    const val1 = this.evaluateWithValues(formToUse, values1);
    const val0 = this.evaluateWithValues(formToUse, values0);
    
    // 如果 val0 是 Infinity，使用 x=1 和 x=2 来计算系数
    if (val0 === Infinity || !val0.isFinite()) {
      const values2 = {};
      allVariables.forEach(v => {
        if (v === variable) {
          values2[v] = 2;
        } else {
          values2[v] = 0;
        }
      });
      const val2 = this.evaluateWithValues(formToUse, values2);
      if (val2 !== Infinity && val2.isFinite() && val1 !== Infinity && val1.isFinite()) {
        // 使用 val2 - val1 来计算系数
        return val2.subtract(val1);
      }
      // 如果仍然有问题，返回 0（不应该到达这里）
      return new Fraction(0, 1);
    }
    
    return val1.subtract(val0);
  }

  // 获取指定变量的系数（支持多变量方程），返回数字（向后兼容）
  getVariableCoefficient(variable, allVariables) {
    return this.getVariableCoefficientFraction(variable, allVariables).toNumber();
  }

  // 获取常数项（支持多变量方程），返回 Fraction
  getConstantTermFraction(allVariables) {
    const standardForm = this.toStandardForm();
    
    const values = {};
    allVariables.forEach(v => {
      values[v] = 0;
    });
    
    const val0 = this.evaluateWithValues(standardForm, values);
    
    if (val0 === Infinity || !val0.isFinite()) {
      // 检查是否包含直接除以变量的项（检查所有变量）
      let hasDivision = false;
      let formToUse = standardForm;
      for (const variable of allVariables) {
        if (this.containsDivisionByVariable(standardForm, variable)) {
          hasDivision = true;
          formToUse = this.multiplyByVariable(standardForm, variable);
          break; // 只需要转换一次
        }
      }
      
      const values1 = {};
      allVariables.forEach(v => {
        values1[v] = 1;
      });
      const val1 = this.evaluateWithValues(formToUse, values1);
      
      // 计算所有变量的系数和
      let totalCoeff = new Fraction(0, 1);
      allVariables.forEach(v => {
        const coeff = this.getVariableCoefficientFraction(v, allVariables);
        totalCoeff = totalCoeff.add(coeff);
      });
      
      return val1.subtract(totalCoeff);
    }
    
    return val0;
  }

  // 获取常数项（支持多变量方程），返回数字（向后兼容）
  getConstantTerm(allVariables) {
    return this.getConstantTermFraction(allVariables).toNumber();
  }
}

// 语义分析器/求值器
export class Evaluator {
  constructor(ast) {
    this.ast = ast;
  }

  // 从 AST 中提取所有不同的变量名
  extractAllVariables(node) {
    const variables = new Set();

    if (node.type === 'VARIABLE') {
      variables.add(node.name);
    } else if (node.type === 'BINARY_OP') {
      this.extractAllVariables(node.left).forEach(v => variables.add(v));
      this.extractAllVariables(node.right).forEach(v => variables.add(v));
    } else if (node.type === 'EQUATION') {
      this.extractAllVariables(node.left).forEach(v => variables.add(v));
      this.extractAllVariables(node.right).forEach(v => variables.add(v));
    } else if (node.type === 'EQUATION_SYSTEM') {
      node.equations.forEach(eq => {
        this.extractAllVariables(eq).forEach(v => variables.add(v));
      });
    }
    
    return variables;
  }

  // 求解方程组（实例方法）
  solve() {
    const {equations} = this.ast;
    const allVariables = Array.from(this.extractAllVariables(this.ast)).sort();

    if (equations.length < allVariables.length) {
      throw new Error(`Equation count (${equations.length}) is less than variable count (${allVariables.length})`);
    }

    // 构建增广矩阵（直接使用 Fraction 保持精度）
    const matrix = [];
    const evaluators = equations.map(eq => new EquationEvaluator(eq));
    for (const evaluator of evaluators) {
      const row = [];
      for (const variable of allVariables) {
        const coeff = evaluator.getVariableCoefficientFraction(variable, allVariables);
        row.push(coeff);
      }
      const constant = evaluator.getConstantTermFraction(allVariables);
      row.push(constant.negate()); // 移项到右边
      matrix.push(row);
    }

    // 使用高斯消元法求解（矩阵已经是 Fraction 数组）
    const isSingleEquation = equations.length === 1;
    const solution = Evaluator.gaussianElimination(matrix, isSingleEquation);

    // 构建结果对象
    const result = {};
    allVariables.forEach((variable, index) => {
      result[variable] = solution[index];
    });

    return result;
  }

  // 高斯消元法求解线性方程组（使用 Fraction 进行精确计算）
  static gaussianElimination(matrix, isSingleEquation = false) {
    const n = matrix.length;
    const m = matrix[0].length - 1; // 变量数量
    
    // 将矩阵转换为 Fraction 矩阵（如果还不是 Fraction）
    const fracMatrix = matrix.map(row => 
      row.map(val => val instanceof Fraction ? val : Fraction.fromNumber(val))
    );
    
    // 前向消元
    for (let i = 0; i < Math.min(n, m); i++) {
      // 找到主元（绝对值最大的行）
      let maxRow = i;
      let maxAbs = Math.abs(fracMatrix[i][i].toNumber());
      for (let k = i + 1; k < n; k++) {
        const absVal = Math.abs(fracMatrix[k][i].toNumber());
        if (absVal > maxAbs) {
          maxRow = k;
          maxAbs = absVal;
        }
      }
      
      // 交换行
      [fracMatrix[i], fracMatrix[maxRow]] = [fracMatrix[maxRow], fracMatrix[i]];

      // 如果主元为 0，跳过
      if (fracMatrix[i][i].isZero()) {
        continue;
      }

      // 消元
      for (let k = i + 1; k < n; k++) {
        if (fracMatrix[k][i].isZero()) {
          continue;
        }
        const factor = fracMatrix[k][i].divide(fracMatrix[i][i]);
        for (let j = i; j <= m; j++) {
          fracMatrix[k][j] = fracMatrix[k][j].subtract(factor.multiply(fracMatrix[i][j]));
        }
      }
    }

    // 回代（使用 Fraction 进行精确计算）
    const solution = new Array(m);

    for (let i = Math.min(n, m) - 1; i >= 0; i--) {
      if (fracMatrix[i][i].isZero()) {
        if (!fracMatrix[i][m].isZero()) {
          throw new Error('Equation system has no solution');
        }
        continue;
      }

      let sum = fracMatrix[i][m];
      for (let j = i + 1; j < m; j++) {
        sum = sum.subtract(fracMatrix[i][j].multiply(solution[j]));
      }
      solution[i] = sum.divide(fracMatrix[i][i]);
    }

    // 检查是否有未确定的变量和恒等式
    let allZeroRows = 0;
    
    for (let i = 0; i < n; i++) {
      let hasNonZero = false;
      for (let j = 0; j < m; j++) {
        if (!fracMatrix[i][j].isZero()) {
          hasNonZero = true;
          break;
        }
      }
      if (!hasNonZero) {
        if (!fracMatrix[i][m].isZero()) {
          throw new Error('Equation system has no solution');
        } else {
          // 所有系数为 0 且常数项为 0，这是恒等式
          allZeroRows++;
        }
      }
    }

    // 检查是否所有行的系数都为 0（恒等式情况）
    // 对于单方程，如果系数全为 0 且常数项为 0，则有无穷解
    if (allZeroRows > 0 && isSingleEquation && m === 1) {
      throw new Error('Equation has infinite solutions');
    }

    // 将 Fraction 数组转换为数字数组
    return solution.map(sol => sol.toNumber());
  }
}

