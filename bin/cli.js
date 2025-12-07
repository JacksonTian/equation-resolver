#!/usr/bin/env node

import readline from 'readline';
import { solve } from '../lib/solve.js';

function main() {
  const args = process.argv.slice(2);

  // 如果有参数，直接求解并退出
  if (args.length > 0) {
    const input = args.join(' ');
    try {
      const result = solve(input);
      // 检查返回格式：如果是对象且没有 variable 属性，说明是方程组
      if (result.variable !== undefined) {
        console.log(`${result.variable} = ${result.value}`);
      } else {
        for (const [variable, value] of Object.entries(result)) {
          console.log(`${variable} = ${value}`);
        }
      }
    } catch (error) {
      console.error('错误:', error.message);
      process.exit(1);
    }
    return;
  }

  // 进入 REPL 模式
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  console.log('解方程 REPL 模式');
  console.log('输入方程求解（用分号分隔多个方程可求解方程组），输入 exit 或 quit 退出\n');
  rl.prompt();

  rl.on('line', (line) => {
    const input = line.trim();

    if (input === 'exit' || input === 'quit' || input === 'q') {
      rl.close();
      return;
    }
    
    if (input === '') {
      rl.prompt();
      return;
    }
    
    try {
      const result = solve(input);
      // 检查返回格式：如果是对象且没有 variable 属性，说明是方程组
      if (result.variable !== undefined) {
        console.log(`${result.variable} = ${result.value}\n`);
      } else {
        for (const [variable, value] of Object.entries(result)) {
          console.log(`${variable} = ${value}`);
        }
        console.log();
      }
    } catch (error) {
      console.error('错误:', error.message, '\n');
    }
    
    rl.prompt();
  });
  
  rl.on('close', () => {
    console.log('\n再见!');
    process.exit(0);
  });
}

main();

