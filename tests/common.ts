import os from 'os';
import { exec as execSync, ExecException } from 'child_process';
import { readFile } from 'fs/promises';


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


export const testConversion = async (name: string, filter?: string) => {
  process.chdir(module.path);
  const input_file = `./markdowns/${name}.md`;
  const expect_out = `./markdowns/${name}.out`;
  let pandoc: string;
  if (filter) {
    const lua_script = `../lua/${filter}.lua`;
    pandoc = `pandoc -s -L ${lua_script} -t native -f markdown "${input_file}" -o -`;
  } else {
    pandoc = `pandoc -s -t native -f markdown "${input_file}" -o -`;
  }
  const ret = await exec(pandoc, { lineSeparator: '\n'});
  expect(ret).toBe(await readFile(expect_out, { encoding: 'utf-8', flag: 'r' }));
};
