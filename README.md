# 方程求解器

[![npm version](https://img.shields.io/npm/v/@jacksontian/equation-resolver.svg)](https://www.npmjs.com/package/@jacksontian/equation-resolver)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![GitHub repository](https://img.shields.io/badge/GitHub-repository-blue.svg)](https://github.com/JacksonTian/equation-resolver)

一个使用词法分析、语法分析和语义分析实现的方程求解程序。

## 功能特性

- 支持线性方程求解
- **支持多元一次方程组求解**（用分号分隔多个方程）
- 支持隐式乘法（如 `2x`, `x(`, `)x`, `xy`, `x2`）
- 支持括号表达式
- 支持除法表达式（如 `8 / 2x = 2`）
- 使用分数（Fraction）类进行精确计算，避免浮点数精度丢失
- 使用高斯消元法求解线性方程组

## 安装

```bash
npm install @jacksontian/equation-resolver -g
```

## 使用方法

### 命令行工具

```bash
# REPL 模式（交互式求解）
solve

# 在 REPL 中输入方程求解
> 2x = 4
x = 2

> x + y = 5; x - y = 1
x = 3
y = 2

> exit  # 退出
```

### 作为模块使用

```javascript
import { Lexer, Parser, SemanticChecker, Evaluator } from '@jacksontian/equation-resolver';

// 单变量方程
function solve(input) {
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);
  const ast = parser.parse();
  const checker = new SemanticChecker(ast);
  checker.check();
  const evaluator = new Evaluator(ast);
  return evaluator.solve();
}

// 使用示例
const result = solve('2x + 3 = 7');
console.log(result); // { x: 2 }

// 多元一次方程组（用分号分隔）
const systemResult = solve('x + y = 5; x - y = 1');
console.log(systemResult); // { x: 3, y: 2 }
```

## 测试

项目使用 Node.js 内置的 `test` 模块（Node.js 18+）进行测试。

### 运行测试

```bash
npm test
```

### 测试覆盖率

```bash
# 生成 HTML 和文本覆盖率报告
npm run test:cov
```

HTML 报告会生成在 `coverage/index.html`。

## 测试用例

测试用例覆盖了以下场景：

- 基础线性方程（加法、减法、乘法）
- **多元一次方程组**（二元、三元等）
- 除法表达式
- 括号和隐式乘法
- 复杂分数方程
- 小数系数
- 负数
- 多变量方程
- 错误情况（恒等式、矛盾方程、语法错误等）

## 技术实现

- **词法分析器（Lexer）**：将输入字符串转换为 token 流，支持数字、变量、运算符、括号等
- **语法分析器（Parser）**：使用递归下降解析器构建抽象语法树（AST），支持隐式乘法
- **语义检查器（SemanticChecker）**：检查方程是否包含变量，验证 AST 的有效性
- **求值器（Evaluator）**：遍历 AST 求解方程，支持单方程和方程组
- **分数类（Fraction）**：使用分数进行精确计算，避免浮点数精度丢失
- **方程组求解**：使用高斯消元法求解多元一次方程组，支持部分主元选择

## 许可证

The MIT License
