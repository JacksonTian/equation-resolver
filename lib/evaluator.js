// 语义分析器/求值器
export class Evaluator {
  constructor(ast, targetVariable) {
    this.ast = ast;
    this.targetVariable = targetVariable;
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
      return node.value;
    }

    if (node.type === 'VARIABLE') {
      if (node.name === this.targetVariable) {
        return variableValue;
      }
      // 其他变量视为 0
      return 0;
    }

    if (node.type === 'UNARY_OP') {
      const operand = this.evaluate(node.operand, variableValue);
      return node.op === '+' ? operand : -operand;
    }

    if (node.type === 'BINARY_OP') {
      const left = this.evaluate(node.left, variableValue);
      const right = this.evaluate(node.right, variableValue);

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

  // 获取系数（x 的系数）
  getCoefficient() {
    const standardForm = this.toStandardForm();
    const val1 = this.evaluate(standardForm, 1);
    const val0 = this.evaluate(standardForm, 0);

    // 如果 val0 是 Infinity，使用 x=2 来计算
    if (!isFinite(val0)) {
      const val2 = this.evaluate(standardForm, 2);
      return val2 - val1;
    }

    return val1 - val0;
  }

  // 获取常数项
  getConstant() {
    const standardForm = this.toStandardForm();
    const val0 = this.evaluate(standardForm, 0);

    // 如果 val0 是 Infinity，使用 x=1 和 x=2 来计算
    if (!isFinite(val0)) {
      const val1 = this.evaluate(standardForm, 1);
      const val2 = this.evaluate(standardForm, 2);
      const coeff = val2 - val1;
      return val1 - coeff;
    }

    return val0;
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
    
    // 如果符号相同，尝试其他范围
    if (f1 * f2 > 0) {
      x1 = -1000;
      x2 = -0.1;
      f1 = this.evaluate(standardForm, x1);
      f2 = this.evaluate(standardForm, x2);
    }
    
    // 如果还是同号，尝试更大的范围
    if (f1 * f2 > 0) {
      x1 = 0.1;
      x2 = 10000;
      f1 = this.evaluate(standardForm, x1);
      f2 = this.evaluate(standardForm, x2);
    }
    
    if (f1 * f2 > 0) {
      throw new Error('无法找到方程的根');
    }
    
    // 二分法求解
    const tolerance = 1e-10;
    let iterations = 0;
    const maxIterations = 100;
    
    while (Math.abs(x2 - x1) > tolerance && iterations < maxIterations) {
      const mid = (x1 + x2) / 2;
      const fmid = this.evaluate(standardForm, mid);
      
      if (Math.abs(fmid) < tolerance) {
        return mid;
      }
      
      if (f1 * fmid < 0) {
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

  solve() {
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

      value = -constant / coeff;
    }

    return { variable: this.targetVariable, value };
  }
}

