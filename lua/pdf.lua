-- Pandoc 3.8.0 through 3.8.2 preserve surrounding whitespace in math
-- environments, which prevents the LaTeX writer from recognizing them.
local environment_fully_supported_version = pandoc.types.Version('3.8.3')
local environment_partially_supported_version = pandoc.types.Version('3.8.0')
local problematic_environments = {
    displaymath = true,
    math = true,
    equation = true,
    ["equation*"] = true,
    gather = true,
    ["gather*"] = true,
    multline = true,
    ["multline*"] = true,
    eqnarray = true,
    ["eqnarray*"] = true,
    align = true,
    ["align*"] = true,
    alignat = true,
    ["alignat*"] = true,
    flalign = true,
    ["flalign*"] = true,
}
if PANDOC_VERSION >= environment_fully_supported_version then
    return
elseif PANDOC_VERSION >= environment_partially_supported_version then
    return {
        {
            Math = function(elem)
                if elem.text:find("^%s*\\begin{") ~= nil then
                    elem.text = elem.text
                        :gsub("^%s*\\begin{(.-)}", "\\begin{%1}")
                        :gsub("\\end{(.-)}%s*$", "\\end{%1}")
                end
                return elem
            end,
        }
    }
else
    return {
        {
            Math = function(elem)
                local result = elem.text:match("^%s*\\begin{(%a+%*?)}")
                if result ~= nil and problematic_environments[result] ~= nil then
                    return pandoc.RawInline('tex', elem.text)
                else
                    return elem
                end
            end,
        }
    }
end
