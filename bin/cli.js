#!/usr/bin/env node

import readline from 'readline';
import { Lexer } from '../lib/lexer.js';
import { Parser } from '../lib/parser.js';
import { SemanticChecker } from '../lib/semantic-checker.js';
import { Evaluator } from '../lib/evaluator.js';

function main() {
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
        // 词法分析
      const lexer = new Lexer(input);
      
      // 语法分析
      const parser = new Parser(lexer);
      const ast = parser.parse();

      const checker = new SemanticChecker(ast);
      checker.check();

      const evaluator = new Evaluator(ast);
      const result = evaluator.solve();
      for (const [variable, value] of Object.entries(result)) {
        console.log(`${variable} = ${value}`);
      }
      console.log();
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
