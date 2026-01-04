function Para(el)
  local blocks = {}
  local inlines = {}
  for _, inline in ipairs(el.content) do
    if inline.t == "SoftBreak" or inline.t == "LineBreak" then
      if #inlines > 0 then
        table.insert(blocks, pandoc.Para(inlines))
        inlines = {}
      end
    else
      table.insert(inlines, inline)
    end
  end
  if #inlines > 0 then
    table.insert(blocks, pandoc.Para(inlines))
  end
  return blocks
end
