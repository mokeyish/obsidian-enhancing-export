-- minimum supported version for full environment
-- support is 3.8.unkown yet to be released but probably 3
local environment_fully_supported_version = pandoc.types.Version('3.8.3')
local environment_partially_supported_version = pandoc.types.Version('3.8.0')
local is_partially_supported = PANDOC_VERSION >= environment_partially_supported_version
local problamatic_environments = {
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
if is_partially_supported then
    return {
        {
            Math = function(elem)
                if elem.text:find("^%s*\\begin{") ~= nil then
                    local replacement = pandoc.text:gsub(elem.text, "^%s*\\begin{(.-)}", "\\begin{%1}"):gsub("\\end{(.-)}%s*$", "\\end{%1}")
                    return pandoc.Math(replacement, elem.mathtype)
                else
                    return elem
                end
            end,
        }
    }
elseif not environment_fully_supported_version then
    return {
        {
            Math = function(elem)
                local result = elem.text:match("^%s*\\begin{(%a+%*?)}")
                if result ~= nil and problamatic_environments[result] ~= nil then
                    return pandoc.RawInline('tex', elem.text)
                else
                    return elem
                end
            end,
        }
    }
end
