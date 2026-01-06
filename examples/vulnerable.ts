// This file contains obvious security vulnerabilities for testing ignore patterns
// DO NOT USE IN PRODUCTION

import { exec } from "child_process";

// VULNERABILITY 1: Command Injection
export function executeCommand(userInput: string) {
  // This is vulnerable to command injection
  exec(`ls -la ${userInput}`, (error, stdout) => {
    console.log(stdout);
  });
}
