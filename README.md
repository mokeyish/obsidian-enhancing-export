# Obsidian Enhancing Export Plugin

![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/mokeyish/obsidian-enhancing-export?display_name=tag&include_prereleases)
![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%27obsidian-enhancing-export%27%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

English | [中文](https://github.com/mokeyish/obsidian-enhancing-export/blob/master/README_zh-CN.md)

This is an enhancing export plugin base on `Pandoc` for Obsidian ([https://obsidian.md/](https://obsidian.md/)). It's allow you to export to formats like `Markdown`,`Markdown (Hugo)`,`HTML`,`docx`,`Latex` etc.

Where `Markdown`,`Markdown (Hugo)`,`HTML` will export and its media resource together.

**Note：**  `Markdown`,`Markdown (Hugo)`,`HTML` are tested in Mac OS, Windows, and Linux as I used it for myself, others are not tested well.


**Ads**: You might like my other plugins 🤪
- [Obsidian Code Emitter](https://github.com/mokeyish/obsidian-code-emitter)


## Screen shot

- Export view，click on `Export to...` on file menu.

  ![](https://raw.githubusercontent.com/mokeyish/obsidian-enhancing-export/master/screenshot/exportview_en-US.png)
- Setting view

  ![](https://raw.githubusercontent.com/mokeyish/obsidian-enhancing-export/master/screenshot/settingview_en-US.png)

## Installation

1. First install the latest `pandoc` (3.1.9+), and then add `pandoc` path to environment variable `PATH` or set absolute path of `pandoc` in the plugin setting view.

   See more details in [https://pandoc.org/installing.html](https://pandoc.org/installing.html)。

2. Search `obsidian-enhancing-export` in the community plugins of obsidian, and install it.

## Customize export commands

You can customize your export command by yourself, click `add` in the plugin setting view and then choose template `custom` to add new custom configuration.

## Variables 

You can use `${variables}` in custom export command, their values are:

| Key                       | Value                                                        |
| ------------------------- | ------------------------------------------------------------ |
| `${outputPath}`           | Output file path after export. For example， if your export to location `/User/aaa/Documents/test.pdf`, then `${outputDir}`  will be replace that path. |
| `${outputDir}`            | Output directory of saved exported file，It will be `/User/aaa/Documents` in above case. |
| `${outputFileName}`       | File name (without extension)  of the saved exported file. It will be `test` in above case. |
| `${outputFileFullName}`   | File name (with extension)  of the saved exported file. It will be `test.pdf` in above case. |
| `${currentPath}`          | Path of currently edited file. For example, if your are editing `/User/aaa/Documents/readme.md`, the the value will be `/User/aaa/Documents/readme.md`. |
| `${currentDir}`           | Current directory of currently edited file, It will be`/User/aaa/Documents` in above case. |
| `${currentFileName}`      | Filename without extension of currently edited file, It will be `readme` in above case. |
| `${currentFileFullName}`  | Filename with extension of currently edited file. It will be `readme.md` in above case. |
| `${vaultDir}`             | The obsidian current vaultDir.                               |
| `${attachmentFolderPath}` | The `attachmentFolderPath` of Obsidian.                      |
| `${embedDirs}` 			| String containing directories of embedded files for use with --resource-path argument e.g. --resource-path=`${embedDirs}`    |
| Others variables          | You can use `keyword: value` in [YAML Front Matter](https://jekyllrb.com/docs/front-matter/), then use `${metadata.keyword}` |

## Multilingual fonts and diagrams

This fork ships two defaults that need no extra configuration:

### Font fallback (Chinese, Japanese, Korean, Cyrillic, Greek, Devanagari, Thai…)

When the LaTeX template or the front matter does not configure a font, the plugin
detects the writing systems used by the document (the front matter `lang` field
plus a scan of the text) and falls back to fonts that are actually installed:

- **PDF / LaTeX**: an extra header with `\IfFontExistsTF` chains is injected, so a
  missing font never breaks the export. It requires `xelatex` (the default) or
  `lualatex`; `pdflatex` cannot embed these fonts and is skipped automatically.
- **HTML / ePub**: a CSS font stack is injected.
- **Override** fonts through the front matter (`CJKmainfont`, `CJKsansfont`,
  `CJKmonofont`, `mainfont`, `sansfont`, `monofont`) or through
  `Settings → Multilingual fonts → Extra fallback fonts`.

### Finding pandoc, xelatex and the diagram tools

Obsidian started from the GUI does not inherit the `PATH` of your terminal, so
tools installed through Homebrew, MacPorts, pyenv, nvm, … are often reported as
"not installed". At startup the plugin resolves the `PATH` of your login shell
and merges it with the process `PATH`, so these tools are found without any
configuration. On Windows the normal environment is used.

Everything is still overridable:

- `Settings → Pandoc path`: absolute path to the `pandoc` / `pandoc.exe` binary.
- `Settings → Advanced → Environment Variables`: set `PATH` to replace it, or
  `PATH=/my/bin:${PATH}` to prepend a directory.
- `Settings → Diagrams`: absolute paths for `mmdc` / `plantuml` / `dot`.

### Diagrams (Mermaid / PlantUML / Graphviz)

Fenced code blocks are rendered to images before Pandoc runs, using a beautified
Mermaid theme and high resolution output for PDF / Word:

- ` ```mermaid ` → [mermaid-cli](https://github.com/mermaid-js/mermaid-cli) (`mmdc`)
- ` ```plantuml ` / ` ```puml ` → PlantUML (`plantuml` or a `plantuml.jar`)
- ` ```dot ` / ` ```graphviz ` → Graphviz (`dot`)

Install the tools you need and make sure they are on `PATH` (or set their path in
the plugin settings). Missing tools, or diagrams the renderer cannot parse, are
kept as a code block and reported in a notice, so an export never fails and a
broken error image is never embedded. Rendered images are cached next to the
exported file in `<name>-media/`.

### Paper templates and paper info

The `Latex Template` dropdown offers:

- `Chinese Thesis` — a clean article based template for Chinese theses / papers.
  It supports `title`, `author`, `abstract`, `keywords`, `fontsize`, `mainfont`,
  `CJKmainfont`, `geometry`, `linestretch`, `parskip` and `header-includes`.
- `IEEE`, `LNCS`, `NeurIPS` — common conference / journal paper templates. IEEE
  and LNCS use the standard `IEEEtran` / `llncs` classes shipped with TeX Live.

Paper metadata (title, authors, institution, date, keywords) can be filled in
directly in the export dialog. What you type there overrides the front matter
and is remembered for the next export; leave a field empty to keep the value
from the front matter.

## Related resources

- **Tutorial**: [Obsidian Tutorial for Academic Writing](https://betterhumans.pub/obsidian-tutorial-for-academic-writing-87b038060522) - tutorial on how to setup this plugin and use it for academic writing (export to `.docx`, `.pdf`, `.tex`, `.bib`)
- **A collection of lua filters for pandoc**: [https://github.com/pandoc-ext](https://github.com/pandoc-ext) - Filters and other goodies to get the most out of pandoc, the universal document converter.
- **Math latex editor**: [https://math.yish.org/](https://math.yish.org/)

## Finally

- Welcome to provide more command templates to [here](src/export_templates.ts).
- Feel free to file an issue for any questions.
