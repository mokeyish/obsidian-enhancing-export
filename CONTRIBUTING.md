# Contributing to Obsidian Enhancing Export

First, thank you for your willingness to contribute to this project.

## Simple guide

1. Environment Preparing

   - Install the `nodejs`

     [https://nodejs.org/en/download](https://nodejs.org/en/download)

   - Install the `pnpm`

     ```shell
     npm install -g pnpm
     ```

   - Clone the repository

     ```shell'
     git clone https://github.com/mokeyish/obsidian-enhancing-export.git
     ```

   - Install the dependencies

     ```shell
     cd obsidian-enhancing-export
     pnpm install
     ```

2. Development & debugging  (Recommend [VsCode](https://code.visualstudio.com/))

   - Add `.env.local` to project root with following content

     ```shell
     # export to obsidian plugin directory directly
     OUT_DIR="path/to/.obsidian/plugins/obsidian-enhancing-export"
     ```

   - Enable `dev-mode `

     To enable dev-mode in the obsidian, use the shortcut `Ctrl+Shift+I` or the `<F12>` key to open DevTools. and run following commands in the Console Tab of DevTools. 

     ```shell
     localStorage.setItem('debug-plugin', '1')
     ```

   - Build the code for debugging

     ```shell
     npm run dev
     ```

     More debug tips please see: [How to debug TypeScript in Chrome](https://blog.logrocket.com/how-to-debug-typescript-chrome/)

3. Building for Production

   ```shell
   npm run build
   ```

4. Other commands please see `sciprts` of `package.json` in the project root.
