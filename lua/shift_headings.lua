function Header(el)
  if el.level == 1 then
    return pandoc.Div(pandoc.Para(el.content), {['custom-style'] = 'Title'})
  elseif el.level > 1 then
    el.level = el.level - 1
    return el
  end
  return el
end
