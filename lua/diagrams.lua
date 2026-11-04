--[[
diagrams.lua - render fenced diagram code blocks (Mermaid / PlantUML / Graphviz)
into images so that they can be embedded into every Pandoc output format.

Images are rendered into a temporary directory (safe ASCII path, full
permissions) provided by the plugin. The plugin copies them next to the
output for text formats (Markdown, LaTeX, ...) after pandoc finishes.

The filter is dependency tolerant: when a renderer (mmdc, plantuml or dot)
is missing or fails, the original code block is kept and the reason is
recorded for the plugin to display.

Configuration (Pandoc writer variables set by the plugin):

  oee_diagram_enable         "1" to enable rendering
  oee_diagram_media          temporary directory where images are rendered
  oee_diagram_mmdc           command used to render mermaid diagrams
  oee_diagram_plantuml       plantuml executable or plantuml.jar path
  oee_diagram_plantuml_jar   "1" when plantuml is a .jar executed through java
  oee_diagram_dot            graphviz `dot` command
  oee_diagram_config         mermaid configuration json path (optional)
  oee_diagram_scale          scale factor for rasterized mermaid diagrams
]] --

local function getvar(name)
  local vars = PANDOC_WRITER_OPTIONS and PANDOC_WRITER_OPTIONS.variables
  local value = vars and vars[name]
  if value == nil then
    return nil
  end
  return tostring(value)
end

local enable = getvar('oee_diagram_enable')
if enable == nil or enable == '' or enable == '0' or enable == 'false' then
  return {}
end

local media_dir = getvar('oee_diagram_media')
if media_dir == nil or media_dir == '' then
  return {}
end

local mmdc = getvar('oee_diagram_mmdc') or 'mmdc'
local plantuml = getvar('oee_diagram_plantuml') or ''
local plantuml_is_jar = getvar('oee_diagram_plantuml_jar') == '1'
local dot = getvar('oee_diagram_dot') or 'dot'
local mermaid_config = getvar('oee_diagram_config') or ''
local scale = getvar('oee_diagram_scale') or '3'

local error_log = nil
if mermaid_config ~= '' then
  error_log = pandoc.path.join({ pandoc.path.directory(mermaid_config), 'diagram-errors.log' })
end

local function record_error(msg)
  if error_log == nil then
    return
  end
  local f = io.open(error_log, 'a')
  if f then
    f:write(msg .. '\n')
    f:close()
  end
end

local function exists(p)
  local f = io.open(p, 'rb')
  if f then
    f:close()
    return true
  end
  return false
end

-- Check that a rendered file exists and is not suspiciously small (a blank
-- PDF/SVG/PNG from a silently failed mmdc run can be well under 100 bytes).
local function valid_output(p)
  local f = io.open(p, 'rb')
  if not f then
    return false
  end
  local size = f:seek('end')
  f:close()
  return size ~= nil and size > 100
end

local function write_file(p, data)
  local f = io.open(p, 'wb')
  if not f then
    return false
  end
  f:write(data)
  f:close()
  return true
end

-- ---------------------------------------------------------------------------
-- Format detection
-- ---------------------------------------------------------------------------

local function is_web()
  return FORMAT == 'html' or FORMAT == 'html4' or FORMAT == 'html5'
    or FORMAT == 'chunkedhtml' or FORMAT == 'epub' or FORMAT == 'epub2'
    or FORMAT == 'epub3' or FORMAT == 'revealjs' or FORMAT == 'slidy'
    or FORMAT == 'slideous' or FORMAT == 'dzslides'
end

local function is_latex()
  return FORMAT == 'latex' or FORMAT == 'beamer'
end

local function is_markdown()
  return FORMAT == 'markdown' or FORMAT == 'markdown_strict'
    or FORMAT == 'commonmark' or FORMAT == 'commonmark_x'
    or FORMAT == 'gfm' or FORMAT == 'markdown_mmd'
end

local function is_text_format()
  -- Only formats that produce a separate file referencing other files by path.
  -- PDF goes through LaTeX but the image bytes are embedded, so it needs the
  -- absolute path. Markdown, mediawiki, rst, textile, opml are text formats.
  return is_markdown()
    or FORMAT == 'mediawiki' or FORMAT == 'rst' or FORMAT == 'textile'
    or FORMAT == 'opml'
end

-- Formats whose image sizing is controlled through image attributes.
local function supports_width_attribute()
  return FORMAT == 'docx' or FORMAT == 'odt' or FORMAT == 'pptx'
    or FORMAT == 'rtf' or FORMAT == 'typst'
end

-- Prefer PNG for LaTeX: PDF-in-PDF embedding via \includegraphics can render
-- blank in some viewers. PNG is universally supported and with the scale
-- factor the quality is more than adequate for documents.
local function output_extension(tool)
  if is_web() then
    return 'svg'
  end
  return 'png'
end

-- ---------------------------------------------------------------------------
-- Rendering
-- ---------------------------------------------------------------------------

local function shquote(s)
  return "'" .. tostring(s):gsub("'", "'\\''") .. "'"
end

local function run_command(command, args, input, stderr_file)
  if stderr_file == nil or package.config:sub(1, 1) == '\\' then
    local ok, err = pcall(pandoc.pipe, command, args, input)
    return ok, err
  end
  local parts = { shquote(command) }
  for _, arg in ipairs(args) do
    parts[#parts + 1] = shquote(arg)
  end
  local line = table.concat(parts, ' ') .. ' 2>' .. shquote(stderr_file)
  return pcall(pandoc.pipe, 'sh', { '-c', line }, input)
end

local function failure_message(stderr_file, fallback)
  local f = io.open(stderr_file, 'rb')
  if f then
    local data = f:read('*a')
    f:close()
    if data then
      for line in data:gmatch('[^\n]+') do
        line = line:gsub('%s+$', '')
        if line ~= '' then
          return line
        end
      end
    end
  end
  return fallback
end

local function render_mermaid(code, out)
  local input = os.tmpname() .. '.mmd'
  if not write_file(input, code) then
    return nil, 'cannot write temporary input'
  end
  local ext = out:match('%.([%a%d]+)$') or 'png'
  local stderr_file = os.tmpname() .. '.log'
  local args = { '-i', input, '-o', out, '-b', 'white' }
  if mermaid_config ~= '' then
    args[#args + 1] = '-c'
    args[#args + 1] = mermaid_config
  end
  if ext == 'png' then
    args[#args + 1] = '-s'
    args[#args + 1] = scale
  end
  local ok = run_command(mmdc, args, '', stderr_file)
  os.remove(input)
  if not ok or not valid_output(out) then
    local message = failure_message(stderr_file, 'mmdc could not render the diagram')
    os.remove(out)
    os.remove(stderr_file)
    return nil, message
  end
  os.remove(stderr_file)
  return out
end

local function render_plantuml(code, out)
  if plantuml == '' then
    return nil, 'plantuml is not configured'
  end
  local ext = out:match('%.([%a%d]+)$') or 'png'
  local input = os.tmpname() .. '.puml'
  if not write_file(input, code) then
    return nil, 'cannot write temporary input'
  end
  local stderr_file = os.tmpname() .. '.log'
  local command = plantuml
  local args = {}
  if plantuml_is_jar then
    command = 'java'
    args[#args + 1] = '-jar'
    args[#args + 1] = plantuml
  end
  args[#args + 1] = '-t' .. ext
  args[#args + 1] = '-charset'
  args[#args + 1] = 'UTF-8'
  args[#args + 1] = '-o'
  args[#args + 1] = pandoc.path.directory(out)
  args[#args + 1] = input
  local ok = run_command(command, args, '', stderr_file)
  os.remove(input)
  local produced_name = (pandoc.path.filename(input):gsub('%.puml$', '.' .. ext))
  local produced = pandoc.path.join({ pandoc.path.directory(out), produced_name })
  if produced ~= out and valid_output(produced) then
    os.rename(produced, out)
  end
  if not ok or not valid_output(out) then
    local message = failure_message(stderr_file, 'plantuml could not render the diagram')
    os.remove(stderr_file)
    return nil, message
  end
  os.remove(stderr_file)
  return out
end

local function render_graphviz(code, out)
  local ext = out:match('%.([%a%d]+)$') or 'png'
  local input = os.tmpname() .. '.dot'
  if not write_file(input, code) then
    return nil, 'cannot write temporary input'
  end
  local stderr_file = os.tmpname() .. '.log'
  local ok = run_command(dot, { '-T' .. ext, '-o', out, input }, '', stderr_file)
  os.remove(input)
  if not ok or not valid_output(out) then
    local message = failure_message(stderr_file, 'dot could not render the diagram')
    os.remove(stderr_file)
    return nil, message
  end
  os.remove(stderr_file)
  return out
end

local renderers = {
  mermaid = render_mermaid,
  plantuml = render_plantuml,
  graphviz = render_graphviz,
}

-- ---------------------------------------------------------------------------
-- Detection
-- ---------------------------------------------------------------------------

local supported = {
  mermaid = 'mermaid',
  mmd = 'mermaid',
  mermaidjs = 'mermaid',
  plantuml = 'plantuml',
  puml = 'plantuml',
  pu = 'plantuml',
  uml = 'plantuml',
  dot = 'graphviz',
  graphviz = 'graphviz',
}

local mermaid_keywords = {
  'sequencediagram', 'flowchart', 'classdiagram', 'statediagram', 'erdiagram',
  'gantt', 'pie', 'journey', 'gitgraph', 'mindmap', 'timeline',
  'quadrantchart', 'xychart', 'sankey', 'block%-beta', 'requirementdiagram',
  'architecture%-beta', 'c4', 'graph%s+[a-z]',
}

local function looks_like_mermaid(text)
  for line in text:gmatch('[^\n]+') do
    local trimmed = line:gsub('^%s+', '')
    if trimmed ~= '' and not trimmed:match('^%%%%') then
      local head = trimmed:lower()
      for _, keyword in ipairs(mermaid_keywords) do
        if head:match('^' .. keyword) then
          return true
        end
      end
      return false
    end
  end
  return false
end

local function detect_tool(el)
  for _, class in ipairs(el.classes or {}) do
    local tool = supported[class:lower()]
    if tool then
      return tool
    end
  end
  local text = el.text or ''
  local head = text:gsub('^%s+', '')
  if head:match('^@startuml') or head:match('^@startmindmap') then
    return 'plantuml'
  end
  if head:match('^[Dd]igraph') or head:match('^[Ss]trict%s+[Dd]igraph') or head:match('^[Gg]raph%s*{') then
    return 'graphviz'
  end
  if looks_like_mermaid(text) then
    return 'mermaid'
  end
  return nil
end

-- ---------------------------------------------------------------------------
-- Image source paths
-- ---------------------------------------------------------------------------

-- For formats where the image is embedded at write time (PDF via LaTeX, docx,
-- HTML with embed-resources, epub, ...), the absolute temp path works fine.
-- For formats that produce a text file referencing images by path (Markdown,
-- LaTeX .tex output, mediawiki, rst, ...), use a safe relative path pointing
-- to `diagrams-media/`; the plugin copies files there after pandoc finishes.
local function image_source(path)
  if FORMAT == 'latex' then
    -- PDF output goes through LaTeX and embeds the image; .tex output also
    -- uses LaTeX but the image file must persist. Both use the absolute path
    -- — the plugin copies for .tex output only (needsLocalImages flag).
    return path
  end
  if is_markdown() or FORMAT == 'mediawiki' or FORMAT == 'rst'
    or FORMAT == 'textile' or FORMAT == 'opml' then
    return 'diagrams-media/' .. pandoc.path.filename(path)
  end
  return path
end

-- ---------------------------------------------------------------------------
-- Render helper
-- ---------------------------------------------------------------------------

local function render_to_media(tool, code)
  local ext = output_extension(tool)
  local key = pandoc.utils.sha1(table.concat({ tool, ext, mermaid_config, code }, '\0'))
  local out = pandoc.path.join({ media_dir, key .. '.' .. ext })
  if valid_output(out) then
    return out
  end
  local ok, err = renderers[tool](code, out)
  if not ok then
    local reason = tostring(err or 'unknown error')
    record_error(tool .. ': ' .. reason)
    io.stderr:write('[diagrams.lua] skipped ' .. tool .. ' diagram: ' .. reason .. '\n')
    return nil
  end
  return out
end

local function decorate(image)
  if is_web() then
    image.attributes = { style = 'max-width:100%;height:auto;' }
  elseif supports_width_attribute() then
    image.attributes = { width = '100%' }
  end
  return image
end

-- ---------------------------------------------------------------------------
-- Filters
-- ---------------------------------------------------------------------------

function CodeBlock(el)
  local tool = detect_tool(el)
  if not tool then
    return nil
  end
  local out = render_to_media(tool, el.text)
  if not out then
    return nil
  end
  return pandoc.Para({ decorate(pandoc.Image({ pandoc.Str('') }, image_source(out))) })
end

-- Diagram source files referenced as images (e.g. `![[flow.puml]]`)
local DIAGRAM_FILE_TOOLS = {
  puml = 'plantuml', plantuml = 'plantuml', pu = 'plantuml', iuml = 'plantuml',
  mmd = 'mermaid', mermaid = 'mermaid',
  dot = 'graphviz', gv = 'graphviz',
}

local function url_decode(value)
  return (value:gsub('%%(%x%x)', function(hex)
    return string.char(tonumber(hex, 16))
  end))
end

local function resolve_input_file(src)
  local decoded = url_decode(src)
  if pandoc.path.is_absolute(decoded) and exists(decoded) then
    return decoded
  end
  for _, dir in ipairs(PANDOC_STATE.resource_path or {}) do
    local candidate = pandoc.path.join({ dir, decoded })
    if exists(candidate) then
      return candidate
    end
  end
  for _, file in ipairs(PANDOC_STATE.input_files or {}) do
    local candidate = pandoc.path.join({ pandoc.path.directory(file), decoded })
    if exists(candidate) then
      return candidate
    end
  end
  return nil
end

function Image(el)
  local extension = el.src and el.src:match('%.([%a]+)$')
  local tool = extension and DIAGRAM_FILE_TOOLS[extension:lower()]
  if not tool then
    return nil
  end
  local file = resolve_input_file(el.src)
  if not file then
    return nil
  end
  local handle = io.open(file, 'rb')
  if not handle then
    return nil
  end
  local code = handle:read('*a')
  handle:close()
  if not code or code == '' then
    return nil
  end
  local out = render_to_media(tool, code)
  if not out then
    return pandoc.Str('[diagram not rendered: ' .. el.src .. ']')
  end
  el.src = image_source(out)
  return el
end

return { { CodeBlock = CodeBlock, Image = Image } }
