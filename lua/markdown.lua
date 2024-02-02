package.path=debug.getinfo(1).source:gsub('@',''):sub(0):match('(.*[/\\])'):sub(0) .. '?.lua' .. ';' .. package.path

require("polyfill")
local url = require('url')

local pandoc=pandoc
local PANDOC_STATE=PANDOC_STATE

PANDOC_VERSION:must_be_at_least '3.1.7'

os.text = pandoc.text

local PATH = pandoc.path
local doc_dir = nil
local media_dir = nil

if Mode == nil then
  Mode = 'default'
end

-- print("Mode: "..Mode)

if PANDOC_STATE.output_file then
  local output_file = PANDOC_STATE.output_file
  doc_dir = PATH.directory(output_file)
  if PANDOC_WRITER_OPTIONS.variables["media_dir"] then
    media_dir = tostring(PANDOC_WRITER_OPTIONS.variables["media_dir"])
  else
    media_dir = PATH.split_extension(output_file)
    if Mode ~= 'hugo' then
      media_dir = media_dir .. '-media'
    end
  end
end
assert(doc_dir, "doc_dir is nil")
assert(media_dir, "media_dir is nil")


local function get_absolute_path(file_path)
  if PATH.is_absolute(file_path) then
    return file_path
  end
  for _, dir in pairs(PANDOC_STATE.resource_path) do
    local full_path = PATH.join({dir, file_path})
    if os.exists(full_path) then
      return full_path
    end
  end
  for _, file in pairs(PANDOC_STATE.input_files) do
    if not PATH.is_absolute(file) then
      file = PATH.join({pandoc.system.get_working_directory(), file_path})
    end
    local dir = PATH.directory(file)
    local full_path = PATH.join({dir, file_path})
    if os.exists(full_path) then
      return full_path
    end
  end
  return nil
end

local function get_output_file(file_path)
  if media_dir then
    local new_file_name = pandoc.utils.sha1(file_path)
    local _, new_file_ext = PATH.split_extension(file_path)
    file_path = new_file_name .. new_file_ext
    local full_path = PATH.join({media_dir, file_path})
    return full_path
  else
    return nil
  end
end

local function extract_media(file_path)
  os.mkdir(media_dir)
  file_path = url.decode(file_path)
  local abs_path = get_absolute_path(file_path)
  local file = get_output_file(file_path)
  if abs_path and file then
    if not os.exists(file) then
      os.copy(abs_path, file)
    end
    local rel_path = PATH.make_relative(file, doc_dir, false)
    local parts = PATH.split(rel_path)
    for i,v in ipairs(parts) do
      parts[i] = url.encode(v)
    end
    local encoded_rel_path = table.concat(parts, "/")
    if Mode == 'hugo' then
      encoded_rel_path = '../' .. encoded_rel_path
    end
    return encoded_rel_path
  end
end

local function raw(s)
  return pandoc.RawInline('markdown', s)
end

function Image(el)
  local src = extract_media(el.src)
  if src then
    el.src = src
  end
  return el
end

function Space()
  return raw(' ')
end

function SoftBreak()
  return raw('\n')
end

function RawInline(el)
  if el.format == "html" then
    el.format = 'markdown'
    el.text = string.gsub(el.text, '<img[^>]+>', function(img)
      return string.gsub(img, 'src="([^"]+)"', function(url)
        if string.find(url, '^[Hh][Tt][Tt][Pp][Ss]?://') == nil  then
          local extract_media_url = extract_media(url)
          if extract_media_url then
            return 'src="' .. extract_media_url .. '"'
          end
          return '123'
        end
        return 'src="' .. url .. '"'
      end)
    end)
  end
  return el
end

function RawBlock(el)
  if el.format == "html" then
    el.format = 'markdown'
  end
  return el
end

function Math(el)
  if Mode == 'hugo' then
    if el.mathtype == 'DisplayMath' then
      return raw('{{< mathjax >}}\n$$'  .. el.text .. '$$\n{{</mathjax >}}')
    else
      el.text = string.gsub(el.text, '\\[\\{\\}]', function (v)
        return '\\' .. v
      end)
      el.text = string.gsub(el.text, '_', function (v)
        return '\\' .. v
      end)
    end
  end
  return el
end

local function headerLink(input)
  -- github style section link
  return "#"..input:gsub(' ', '-')
end


local function insertLink(content, linkDescription)
  local descriptionText = table.concat(linkDescription, "")

  if string.find(descriptionText, '|') then
    local target, desc = descriptionText:match("(.*)|(.*)")
    table.insert(content, pandoc.Link(desc, headerLink(target)))
  else
    table.insert(content, pandoc.Link(descriptionText, headerLink(descriptionText)))
  end
end

function Para(el)
  local content = el.content
  content = ProcessMath(content)
  content = ProcessInternalLinks(content)
  el.content = content
  return el
end

function ProcessMath(elements)
  local content = {}
  local in_display_math = false
  for _, item in pairs(elements) do
    if item.t == 'Str'and item.text == "$$" then
      in_display_math = not in_display_math
    else
      if in_display_math then
        if item.t == 'RawInline' and item.format == 'tex' then
          local n = pandoc.Math('DisplayMath', '\n' .. item.text .. '\n')
          table.insert(content, Math(n))
        else
          table.insert(content, item)
        end
      else
        table.insert(content, item)
      end
    end
  end
  return content
end

function ProcessInternalLinks(elements)
  local content = {}
  local in_section_link = false
  local linkDescription = {}

  for _, item in pairs(elements) do
    if item.t == 'Str' and string.starts_with(item.text, '[[#') then
      in_section_link = true
      table.insert(linkDescription, string.sub(item.text, 4))
    elseif in_section_link then
      if string.ends_with(item.text, ']]') then
        table.insert(linkDescription, string.sub(item.text, 1, -3))
        insertLink(content, linkDescription)
        in_section_link = false
        linkDescription = {}
      else
        table.insert(linkDescription, item.text)
      end
    else
      table.insert(content, item)
    end
  end
  return content
end

function Plain(el)
  el.content = ProcessInternalLinks(el.content)
  return el
end

function Pandoc(el)
  return el
end
