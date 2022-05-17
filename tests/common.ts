import { exec as execSync, ExecException } from 'child_process';
import os from 'os';


export async function exec(cmd: string, options: { lineSeparator: '\n' | '\r\n' | '\r' }): Promise<string> {
  function lineSeparator(s?: string, ls?: '\n' | '\r\n' | '\r') {
    if (!s || os.EOL === ls || !ls) {
      return s;
    }
    return s.replaceAll(os.EOL, ls);
  }
  return await new Promise((resolve, reject) => {
    execSync(cmd, { encoding: 'utf-8', cwd: module.path }, (e: ExecException, stdout: string, stderr: string) => {
      if (!e) {
        resolve(lineSeparator(stdout, options?.lineSeparator));
      } else {
        reject(lineSeparator(stderr, options?.lineSeparator));
      }
    });
  });
}



