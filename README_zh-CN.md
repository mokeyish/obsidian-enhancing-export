# Obsidian Enhancing Export Plugin

[English](https://github.com/mokeyish/obsidian-enhancing-export/blob/master/README.md) | 中文

这是一个基于 Pandoc 的 Obsidian 加强版导出插件。提供了基本的导出格式：Markdown 、Markdown（Hugo [https://gohugo.io/](https://gohugo.io/)）、Html、docx、Latex等。
其中 Markdown 、Markdown（Hugo）、Html 会把媒体资源一并导出。

**注意：** 目前自用的就是 Markdown 、Markdown（Hugo）、Html，在 Mac OS、Windows、Linux 可正常使用，其他未经严格测试。

## 界面截图
- 导出界面，在文件菜单上点击 `导出为......`
  
   ![](https://raw.githubusercontent.com/mokeyish/obsidian-enhancing-export/master/screenshot/exportview_zh-CN.png)
- 设置界面
  
   ![](https://raw.githubusercontent.com/mokeyish/obsidian-enhancing-export/master/screenshot/settingview_zh-CN.png)

## 安装
1. 需要先安装最新的 `pandoc`(3.1.9+)，最好配置到 PATH 环境变量，或者设置界面指定路径。
   参考地址：[https://pandoc.org/installing.html](https://pandoc.org/installing.html)
2. 在 Obsidian 插件市场，搜索 `obsidian-enhancing-export` 进行安装。

## 自定义命令

本插件是支持自定义导出命令的，在设置界面，点击添加按钮，选择 `Custom` 作为模板，即可新增一个自定义导出的配置了。

### 变量
你可以使用 `${variable}` 在自定义导出的命令中。它们的值是：

| 变量名 | 值 |
| -- | -- |
| `${outputPath}` |导出路径，例如，你的导出位置是：`/User/aaa/Documents/test.pdf` ，则 `${outputDir}` 会替换为那个路径。|
| `${outputDir}` | 导出目录，按上面的例子，它会被替换为 `/User/aaa/Documents`。 |
| `${outputFileName}` | 没有扩展名的文件名，按上面的例子，它会被替换为 `test`。 |
| `${outputFileFullName}` | 文件的全名，按上面的例子，它会被替换为 `test.pdf`。 |
| `${currentPath}` | 当前文件路径，例如当前的文件位置是 `/User/aaa/Documents/readme.md`，那么它会被替换为这个文件的位置。 |
| `${currentDir}` | 当前文件所在目录，按上面的例子，值为  `/User/aaa/Documents`。 |
| `${currentFileName}` | 当前文件不带扩展名的名字，值是 `readme` |
| `${currentFileFullName}` | 当前文件全名，值是 `readme.md`。 |
| `${vaultDir}`            | Obsidian 当前的 vaultDir.        |
| `${attachmentFolderPath}`| Obsidian 的附件目录 |
| 其他变量 | 你可以在 [YAML Front Matter](https://jekyllrb.com/docs/front-matter/) 中定义 `keyword: value` 变量，然后以 `${metadata.keyword}`引用它。 |

## 多语言字体与图表

本 fork 默认包含两项无需额外配置的能力：

### 字体回退（中文、日文、韩文、西里尔、希腊、天城体、泰文……）

当 LaTeX 模板或 Front Matter 未配置字体时，插件会根据 Front Matter 的 `lang`
字段并扫描正文，识别文档使用的书写系统，然后回退到系统上真实存在的字体：

- **PDF / LaTeX**：注入带 `\IfFontExistsTF` 判定的额外头部，缺字体也不会导致导出失败。
  需要 `xelatex`（默认）或 `lualatex`；`pdflatex` 无法嵌入这些字体，会自动跳过。
- **HTML / ePub**：注入 CSS 字体栈。
- **覆盖字体**：可通过 Front Matter（`CJKmainfont`、`CJKsansfont`、`CJKmonofont`、
  `mainfont`、`sansfont`、`monofont`）或 `设置 → 多语言字体 → 额外回退字体` 指定。

### 自动查找 pandoc、xelatex 与图表工具

从图形界面启动的 Obsidian 不会继承终端的 `PATH`，因此通过 Homebrew、MacPorts、
pyenv、nvm 等安装的工具常被误报为「未安装」。插件启动时会读取你登录 shell 的
`PATH`，并与进程 `PATH` 合并，无需配置即可找到这些工具；Windows 下使用系统环境变量。

仍然可以随时手动覆盖：

- `设置 → Pandoc 路径`：直接填写 `pandoc` / `pandoc.exe` 的绝对路径。
- `设置 → 高级 → 环境变量`：设置 `PATH` 覆盖默认值，或用 `PATH=/my/bin:${PATH}` 追加目录。
- `设置 → 图表`：为 `mmdc` / `plantuml` / `dot` 指定绝对路径。

### 图表（Mermaid / PlantUML / Graphviz）

带标注的代码块会在 Pandoc 运行前渲染为图片，Mermaid 使用美化主题，PDF / Word 下为高分辨率：

- ` ```mermaid ` → [mermaid-cli](https://github.com/mermaid-js/mermaid-cli)（`mmdc`）
- ` ```plantuml ` / ` ```puml ` → PlantUML（`plantuml` 或 `plantuml.jar`）
- ` ```dot ` / ` ```graphviz ` → Graphviz（`dot`）

按需安装工具并确保在 `PATH` 中（也可在插件设置里填写路径）。缺失的工具或渲染器无法解析的
图表会保留为代码块，并通过 Notice 报告原因，因此导出不会失败，也不会嵌入报错图片。渲染结果
会缓存在导出文件旁的 `<name>-media/` 目录。

### 论文模板与论文信息

`Latex Template` 下拉提供：

- `Chinese Thesis` —— 干净的文章类中文论文模板，支持 `title`、`author`、
  `abstract`、`keywords`、`fontsize`、`mainfont`、`CJKmainfont`、`geometry`、
  `linestretch`、`parskip` 以及 `header-includes`。
- `IEEE`、`LNCS`、`NeurIPS` —— 常见会议/期刊论文模板。IEEE 与 LNCS 使用 TeX Live
  自带的 `IEEEtran` / `llncs` 文档类。

论文信息（标题、作者、单位、日期、关键词）可以直接在导出对话框中填写，会覆盖
Front Matter 中的对应字段，并记忆到下次导出；留空则使用 Front Matter 的值。

## Related resources

- **Pandoc 的 lua filters 集合**: [https://github.com/pandoc-ext](https://github.com/pandoc-ext) 
- **Latex 数学公式编辑器**: [https://math.yish.org/](https://math.yish.org/)

## 最后

- 欢迎提供更多命令模板到[这里](src/export_templates.ts).。
- 有问题可以提交 Issue 给我。
