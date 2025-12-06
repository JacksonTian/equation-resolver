#!/usr/bin/env node

import readline from 'readline';
import { solveEquation } from '../lib/solve.js';

function main() {
  const args = process.argv.slice(2);

  // 如果有参数，直接求解并退出
  if (args.length > 0) {
    const equation = args.join(' ');
    try {
      const result = solveEquation(equation);
      console.log(`${result.variable} = ${result.value}`);
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
  console.log('输入方程求解，输入 exit 或 quit 退出\n');
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
      const result = solveEquation(input);
      console.log(`${result.variable} = ${result.value}\n`);
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

