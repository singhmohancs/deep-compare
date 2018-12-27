const { endsWith, trimEnd} = require("lodash");

const getValidKey = (key) => {
  const str = key;
  const stack = [];

  const findReplace = (str, rightPad) => {
    return str.indexOf("\\") >= 0
      ? str.replace("\\", ".")
      : str.concat(rightPad || "");
  };
  const str_tokens = str.split(".");
  for (var i = 0; i < str_tokens.length; i++) {
    const token = str_tokens[i];
    const next =
      i === str_tokens.length
        ? str_tokens[str_tokens.length - 1]
        : str_tokens[i + 1];
    const prev = i === 0 ? str_tokens[i] : str_tokens[i - 1];
    if (endsWith(token, "\\") && !endsWith(prev, "\\")) {
      stack.push("['");
      stack.push(findReplace(token, "."));
    } else {
      if (!endsWith(token, "\\") && endsWith(prev, "\\")) {
        stack.push(findReplace(token));
        stack.push("']");
      } else {
        stack.push(findReplace(token, "."));
      }
    }
  }
  return trimEnd(stack.join(""), '.');
}



module.exports = {
  getValidKey
}