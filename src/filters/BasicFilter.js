/**
 * Removes from tokens entities and words with less than 4 letters.
 * @constructor
 * @param {string[]} tokens - The token lists to be filtered.
 * @param {string[]} - The filtered list
 */
Bravey.Filter.BasicFilter = function(tokens) {
  var out = [];
  for (var i = 0; i < tokens.length; i++)
    if ((tokens[i][0] != "{") && (tokens[i].length > 3)) out.push(tokens[i]);
  if (out.length < 3) return tokens;
  else return out;
}