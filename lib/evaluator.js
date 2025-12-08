import { Fraction } from './fraction.js';

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
    } else if (node.type === 'UNARY_OP') {
      this.extractAllVariables(node.operand).forEach(v => variables.add(v));
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

  // 计算表达式的值（将变量替换为给定值）
  evaluate(node, variableValue) {
    if (node.type === 'NUMBER') {
      return Fraction.fromString(node.value);
    }

    if (node.type === 'VARIABLE') {
      if (node.name === this.targetVariable) {
        return Fraction.fromNumber(variableValue);
      }
      // 其他变量视为 0
      return new Fraction(0, 1);
    }

    if (node.type === 'UNARY_OP') {
      const operand = this.evaluate(node.operand, variableValue);
      return node.op === '+' ? operand : operand.negate();
    }

    if (node.type === 'BINARY_OP') {
      const left = this.evaluate(node.left, variableValue);
      const right = this.evaluate(node.right, variableValue);

      // 处理 Infinity 情况
      if (left === Infinity || right === Infinity) {
        if (node.op === '/') {
          if (right === Infinity) {
            return new Fraction(0, 1);
          }
          return Infinity;
        }
        if (node.op === '*') {
          if (left === Infinity || right === Infinity) {
            return Infinity;
          }
        }
        // 对于 + 和 -，Infinity 保持 Infinity
        return Infinity;
      }

      switch (node.op) {
        case '+': return left.add(right);
        case '-': return left.subtract(right);
        case '*': return left.multiply(right);
        case '/':
          if (right.isZero()) {
            return Infinity;
          }
          return left.divide(right);
        default:
          throw new Error(`未知的运算符: ${node.op}`);
      }
    }

    throw new Error(`未知的节点类型: ${node.type}`);
  }

  // 获取系数（x 的系数）
  getCoefficient() {
    const standardForm = this.toStandardForm();
    const val1 = this.evaluate(standardForm, 1);
    const val0 = this.evaluate(standardForm, 0);

    // 如果 val0 是 Infinity，使用 x=2 来计算
    if (val0 === Infinity || !val0.isFinite()) {
      const val2 = this.evaluate(standardForm, 2);
      return val2.subtract(val1).toNumber();
    }

    return val1.subtract(val0).toNumber();
  }

  // 获取常数项
  getConstant() {
    const standardForm = this.toStandardForm();
    const val0 = this.evaluate(standardForm, 0);

    // 如果 val0 是 Infinity，使用 x=1 和 x=2 来计算
    if (val0 === Infinity || !val0.isFinite()) {
      const val1 = this.evaluate(standardForm, 1);
      const val2 = this.evaluate(standardForm, 2);
      const coeff = val2.subtract(val1);
      return val1.subtract(coeff).toNumber();
    }

    return val0.toNumber();
  }

  // 检查方程是否包含变量在分母的除法（非线性）
  // 但排除可以转换为线性的简单情况：a / (b * x) = c
  hasVariableInDenominator(node) {
    if (node.type === 'BINARY_OP' && node.op === '/') {
      // 检查右操作数（分母）是否包含变量
      const denominator = node.right;
      // 如果分母是简单的 b * x 形式，可以转换为线性
      if (this.isSimpleVariableProduct(denominator)) {
        return false;
      }
      return this.containsVariable(denominator);
    }
    if (node.type === 'BINARY_OP') {
      return this.hasVariableInDenominator(node.left) || 
             this.hasVariableInDenominator(node.right);
    }
    return false;
  }

  // 检查节点是否是简单的变量乘积形式：b * x 或 x * b
  isSimpleVariableProduct(node) {
    if (node.type === 'VARIABLE' && node.name === this.targetVariable) {
      return true;
    }
    if (node.type === 'BINARY_OP' && node.op === '*') {
      const leftIsVar = node.left.type === 'VARIABLE' && node.left.name === this.targetVariable;
      const rightIsVar = node.right.type === 'VARIABLE' && node.right.name === this.targetVariable;
      const leftIsNum = node.left.type === 'NUMBER';
      const rightIsNum = node.right.type === 'NUMBER';
      
      // b * x 或 x * b 的形式
      return (leftIsNum && rightIsVar) || (leftIsVar && rightIsNum);
    }
    return false;
  }

  containsVariable(node) {
    if (node.type === 'VARIABLE') {
      return node.name === this.targetVariable;
    }
    if (node.type === 'BINARY_OP' || node.type === 'UNARY_OP') {
      if (node.type === 'BINARY_OP') {
        return this.containsVariable(node.left) || this.containsVariable(node.right);
      }
      return this.containsVariable(node.operand);
    }
    return false;
  }

  // 使用数值方法求解非线性方程（二分法）
  solveNonlinear() {
    const standardForm = this.toStandardForm();
    
    // 找到函数值异号的两个点
    let x1 = 0.1, x2 = 1000;
    let f1 = this.evaluate(standardForm, x1);
    let f2 = this.evaluate(standardForm, x2);
    
    // 转换为数字进行比较
    const f1Num = f1 === Infinity ? Infinity : f1.toNumber();
    const f2Num = f2 === Infinity ? Infinity : f2.toNumber();
    
    // 如果符号相同，尝试其他范围
    if (f1Num * f2Num > 0) {
      x1 = -1000;
      x2 = -0.1;
      f1 = this.evaluate(standardForm, x1);
      f2 = this.evaluate(standardForm, x2);
      const f1Num2 = f1 === Infinity ? Infinity : f1.toNumber();
      const f2Num2 = f2 === Infinity ? Infinity : f2.toNumber();
      if (f1Num2 * f2Num2 > 0) {
        x1 = 0.1;
        x2 = 10000;
        f1 = this.evaluate(standardForm, x1);
        f2 = this.evaluate(standardForm, x2);
        const f1Num3 = f1 === Infinity ? Infinity : f1.toNumber();
        const f2Num3 = f2 === Infinity ? Infinity : f2.toNumber();
        if (f1Num3 * f2Num3 > 0) {
          throw new Error('无法找到方程的根');
        }
      }
    }
    
    // 二分法求解
    const tolerance = 1e-10;
    let iterations = 0;
    const maxIterations = 100;
    
    while (Math.abs(x2 - x1) > tolerance && iterations < maxIterations) {
      const mid = (x1 + x2) / 2;
      const fmid = this.evaluate(standardForm, mid);
      const fmidNum = fmid === Infinity ? Infinity : fmid.toNumber();
      const f1Num = f1 === Infinity ? Infinity : f1.toNumber();
      
      if (Math.abs(fmidNum) < tolerance) {
        return mid;
      }
      
      if (f1Num * fmidNum < 0) {
        x2 = mid;
        f2 = fmid;
      } else {
        x1 = mid;
        f1 = fmid;
      }
      
      iterations++;
    }
    
    return (x1 + x2) / 2;
  }

  // 获取指定变量的系数（支持多变量方程）
  getVariableCoefficient(variable, allVariables) {
    const standardForm = this.toStandardForm();
    
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
    
    const val1 = this.evaluateWithValues(standardForm, values1, allVariables);
    const val0 = this.evaluateWithValues(standardForm, values0, allVariables);
    
    if (val0 === Infinity || !val0.isFinite()) {
      const values2 = {};
      allVariables.forEach(v => {
        if (v === variable) {
          values2[v] = 2;
        } else {
          values2[v] = 0;
        }
      });
      const val2 = this.evaluateWithValues(standardForm, values2, allVariables);
      return val2.subtract(val1).toNumber();
    }
    
    return val1.subtract(val0).toNumber();
  }

  // 获取常数项（支持多变量方程）
  getConstantTerm(allVariables) {
    const standardForm = this.toStandardForm();
    
    const values = {};
    allVariables.forEach(v => {
      values[v] = 0;
    });
    
    const val0 = this.evaluateWithValues(standardForm, values, allVariables);
    
    if (val0 === Infinity || !val0.isFinite()) {
      const values1 = {};
      allVariables.forEach(v => {
        values1[v] = 1;
      });
      const val1 = this.evaluateWithValues(standardForm, values1, allVariables);
      
      // 计算所有变量的系数和
      let totalCoeff = new Fraction(0, 1);
      allVariables.forEach(v => {
        const coeff = this.getVariableCoefficient(v, allVariables);
        totalCoeff = totalCoeff.add(Fraction.fromNumber(coeff));
      });
      
      return val1.subtract(totalCoeff).toNumber();
    }
    
    return val0.toNumber();
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
    
    if (node.type === 'UNARY_OP') {
      const operand = this.evaluateWithValues(node.operand, variableValues);
      return node.op === '+' ? operand : operand.negate();
    }
    
    if (node.type === 'BINARY_OP') {
      const left = this.evaluateWithValues(node.left, variableValues);
      const right = this.evaluateWithValues(node.right, variableValues);
      
      // 处理 Infinity 情况
      if (left === Infinity || right === Infinity) {
        if (node.op === '/') {
          if (right === Infinity) {
            return new Fraction(0, 1);
          }
          return Infinity;
        }
        if (node.op === '*') {
          if (left === Infinity || right === Infinity) {
            return Infinity;
          }
        }
        return Infinity;
      }
      
      switch (node.op) {
        case '+': return left.add(right);
        case '-': return left.subtract(right);
        case '*': return left.multiply(right);
        case '/':
          if (right.isZero()) {
            return Infinity;
          }
          return left.divide(right);
        default:
          throw new Error(`未知的运算符: ${node.op}`);
      }
    }
    
    throw new Error(`未知的节点类型: ${node.type}`);
  }

  solve() {
    // 如果是方程组，使用方程组求解方法
    if (this.isSystem) {
      return this.solveSystem();
    }

    // 单方程求解前，检查是否包含多个变量
    const allVariables = Array.from(this.extractAllVariables(this.ast));
    if (allVariables.length > 1) {
      throw new Error(`方程数量（1）少于变量数量（${allVariables.length}）`);
    }

    // 单方程求解
    const standardForm = this.toStandardForm();
    
    // 检查是否为非线性方程（变量在分母）
    const isNonlinear = this.hasVariableInDenominator(standardForm);
    
    let value;
    if (isNonlinear) {
      // 使用数值方法求解非线性方程
      value = this.solveNonlinear();
    } else {
      // 线性方程求解
      const coeff = this.getCoefficient();
      const constant = this.getConstant();

      if (coeff === 0) {
        if (constant === 0) {
          throw new Error('方程有无数解');
        } else {
          throw new Error('方程无解');
        }
      }

      // 使用分数进行精确计算
      const constantFrac = Fraction.fromNumber(constant);
      const coeffFrac = Fraction.fromNumber(coeff);
      value = constantFrac.negate().divide(coeffFrac).toNumber();
    }

    // 返回格式：{ variableName: value }
    const result = {};
    result[this.targetVariable] = value;
    return result;
  }

  // 求解方程组（实例方法）
  solveSystem() {
    const {equations} = this.ast;
    const allVariables = Array.from(this.extractAllVariables(this.ast)).sort();
    
    if (allVariables.length === 0) {
      throw new Error('未找到变量');
    }
    
    if (equations.length < allVariables.length) {
      throw new Error(`方程数量（${equations.length}）少于变量数量（${allVariables.length}）`);
    }

    // 为每个方程创建 Evaluator（使用第一个变量作为目标变量，但实际会计算所有变量的系数）
    const evaluators = equations.map(eq => new Evaluator(eq));

    // 构建增广矩阵
    const matrix = [];
    for (const evaluator of evaluators) {
      const row = [];
      for (const variable of allVariables) {
        const coeff = evaluator.getVariableCoefficient(variable, allVariables);
        row.push(coeff);
      }
      const constant = evaluator.getConstantTerm(allVariables);
      row.push(-constant); // 移项到右边
      matrix.push(row);
    }

    // 使用高斯消元法求解
    const solution = Evaluator.gaussianElimination(matrix, false);

    // 构建结果对象
    const result = {};
    allVariables.forEach((variable, index) => {
      result[variable] = solution[index];
    });

    return result;
  }

  // 高斯消元法求解线性方程组
  static gaussianElimination(matrix, isSingleEquation = false) {
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
          throw new Error(isSingleEquation ? '方程无解' : '方程组无解');
        }
        continue;
      }
      
      solution[i] = matrix[i][m];
      for (let j = i + 1; j < m; j++) {
        solution[i] -= matrix[i][j] * solution[j];
      }
      solution[i] /= matrix[i][i];
    }
    
    // 检查是否有未确定的变量和恒等式
    let allZeroRows = 0;
    
    for (let i = 0; i < n; i++) {
      let hasNonZero = false;
      for (let j = 0; j < m; j++) {
        if (Math.abs(matrix[i][j]) > 1e-10) {
          hasNonZero = true;
          break;
        }
      }
      if (!hasNonZero) {
        if (Math.abs(matrix[i][m]) > 1e-10) {
          throw new Error(isSingleEquation ? '方程无解' : '方程组无解');
        } else {
          // 所有系数为 0 且常数项为 0，这是恒等式
          allZeroRows++;
        }
      }
    }
    
    // 检查是否所有行的系数都为 0（恒等式情况）
    // 对于单方程，如果系数全为 0 且常数项为 0，则有无穷解
    if (allZeroRows > 0 && isSingleEquation && m === 1) {
      throw new Error('方程有无数解');
    }
    
    return solution;
  }
}

