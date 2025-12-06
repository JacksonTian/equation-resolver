// 语义检查器
export class SemanticChecker {
  constructor(ast, targetVariable) {
    this.ast = ast;
    this.targetVariable = targetVariable;
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
    }
    
    return variables;
  }

  // 检查节点是否包含指定变量
  containsVariable(node, varName) {
    if (node.type === 'VARIABLE') {
      return node.name === varName;
    }
    if (node.type === 'BINARY_OP') {
      return this.containsVariable(node.left, varName) || 
             this.containsVariable(node.right, varName);
    }
    if (node.type === 'UNARY_OP') {
      return this.containsVariable(node.operand, varName);
    }
    return false;
  }

  // 检查标准形式中是否包含其他变量作为独立项（不是与目标变量相乘）
  hasOtherVariablesAsIndependentTerms(standardForm) {
    const hasOtherVars = (node) => {
      if (node.type === 'VARIABLE') {
        return node.name !== this.targetVariable;
      }
      if (node.type === 'BINARY_OP') {
        // 如果是乘法，检查是否包含目标变量
        if (node.op === '*') {
          const leftHasTarget = this.containsVariable(node.left, this.targetVariable);
          const rightHasTarget = this.containsVariable(node.right, this.targetVariable);
          // 如果乘法项中包含目标变量，那么其他变量是系数，不是独立项
          if (leftHasTarget || rightHasTarget) {
            return false;
          }
          // 如果乘法项中不包含目标变量，检查是否包含其他变量
          return hasOtherVars(node.left) || hasOtherVars(node.right);
        }
        // 对于加减法，检查两边
        return hasOtherVars(node.left) || hasOtherVars(node.right);
      }
      if (node.type === 'UNARY_OP') {
        return hasOtherVars(node.operand);
      }
      return false;
    };
    
    return hasOtherVars(standardForm);
  }

  // 检查是否为简单的 y = x 形式（其中 x 是另一个变量）
  isSimpleVariableEquality() {
    if (this.ast.type !== 'EQUATION') {
      return false;
    }
    
    const left = this.ast.left;
    const right = this.ast.right;
    
    // 检查是否为 y = x 形式
    if (left.type === 'VARIABLE' && 
        right.type === 'VARIABLE' &&
        left.name !== right.name) {
      return true;
    }
    
    return false;
  }

  // 检查是否为 y - x = 0 或类似形式（一个变量等于另一个变量）
  isVariableDifferenceEquality() {
    if (this.ast.type !== 'EQUATION') {
      return false;
    }
    
    const left = this.ast.left;
    const right = this.ast.right;
    
    // 检查右边是否为 0
    if (right.type === 'NUMBER' && right.value === 0) {
      // 检查左边是否为两个变量的差
      if (left.type === 'BINARY_OP' && left.op === '-') {
        const leftVar = left.left;
        const rightVar = left.right;
        
        // 检查是否为两个变量的差
        if (leftVar.type === 'VARIABLE' && rightVar.type === 'VARIABLE' &&
            leftVar.name !== rightVar.name) {
          return true;
        }
      }
    }
    
    // 检查左边是否为 0，右边是否为两个变量的差
    if (left.type === 'NUMBER' && left.value === 0) {
      if (right.type === 'BINARY_OP' && right.op === '-') {
        const leftVar = right.left;
        const rightVar = right.right;
        
        if (leftVar.type === 'VARIABLE' && rightVar.type === 'VARIABLE' &&
            leftVar.name !== rightVar.name) {
          return true;
        }
      }
    }
    
    return false;
  }

  // 执行所有语义检查
  check() {
    const allVariables = this.extractAllVariables(this.ast);
    
    // 检查是否有多个不同的变量
    if (allVariables.size > 1) {
      // 检查是否为简单的 y = x 形式
      if (this.isSimpleVariableEquality()) {
        throw new Error('方程包含多个变量，无法求解单个变量的值');
      }
      
      // 检查是否为 y - x = 0 或类似形式
      if (this.isVariableDifferenceEquality()) {
        throw new Error('方程包含多个变量，无法求解单个变量的值');
      }
    }
  }
}

