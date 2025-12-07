# 方程求解器

一个使用词法分析、语法分析和语义分析实现的方程求解程序。

## 功能特性

- 支持线性方程求解
- **支持多元一次方程组求解**（用分号分隔多个方程）
- 支持隐式乘法（如 `2x`, `x(`, `)x`）
- 支持括号表达式
- 支持除法表达式（如 `8 / 2x = 2`）
- 支持多变量方程（求解第一个变量）
- 支持非线性方程（使用数值方法）

## 安装

```bash
npm install
```

## 使用方法

### 命令行工具

```bash
# 单次求解
node bin/cli.js "2x = 4"

# 求解方程组（用分号分隔）
node bin/cli.js "x + y = 5; x - y = 1"

# REPL 模式
node bin/cli.js
```

### 作为模块使用

```javascript
import { solveEquation, solveSystem } from './lib/solve.js';

// 单变量方程
const result = solveEquation('2x + 3 = 7');
console.log(result); // { variable: 'x', value: 2 }

// 多元一次方程组
const systemResult = solveSystem('x + y = 5; x - y = 1');
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
# 生成文本覆盖率报告
npm run test:coverage

# 生成 HTML 和文本覆盖率报告
npm run test:coverage:report
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

## 当前测试覆盖率

- 语句覆盖率：75.04%
- 分支覆盖率：87.09%
- 函数覆盖率：84.61%
- 行覆盖率：75.04%

## 技术实现

- **词法分析器（Lexer）**：将输入字符串转换为 token 流
- **语法分析器（Parser）**：使用递归下降解析器构建抽象语法树（AST）
- **语义分析器（Evaluator）**：遍历 AST 求解方程
- **方程组求解**：使用高斯消元法求解多元一次方程组

## 许可证

MIT

