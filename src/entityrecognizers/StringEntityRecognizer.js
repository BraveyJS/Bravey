/**
 * Can recognize strings in a sentence.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @param {number} [priority=0] - Priority given to extracted entities.
 */
Bravey.StringEntityRecognizer = function(entityName, priority) {
  var index = [];
  var cache = {};
  var sorted = false;

  function reSort() {
    index.sort(function(a, b) {
      if (a.text.length > b.text.length) return -1;
      if (a.text.length < b.text.length) return 1;
      return 0;
    });
  }

  /**
   * Returns the recognizer entity name.
   * @returns {string} The entity name.
   */
  this.getName = function() {
    return entityName;
  }

  /**
   * Add a new string to the set.
   * @param {string} entityId - The string returned ID.
   * @param {string} entityText - The entity string.
   * @returns true
   */
  this.addMatch = function(entityId, entityText) {
    entityText = Bravey.Text.clean(entityText);
    if (!cache[entityText]) {
      cache[entityText] = 1;
      sorted = false;
      index.push({
        text: entityText,
        id: entityId,
        regex: new RegExp("\\b" + entityText + "\\b", "gi")
      });
    }
    return true;
  }

  /**
   * Returns all found entities in a sentence. Returned entities value is <tt>string</tt>.
   * @param {string} string - The sentence to be checked.
   * @param {Entity[]} [out=[]] - The array in which the found entities will be added.
   * @returns {Entity[]} The set of found entities.
   */
  this.getEntities = function(string, out) {
    string = Bravey.Text.clean(string);
    if (!sorted) {
      sorted = true;
      reSort();
    }

    var piece, match;

    if (!out) out = [];
    var news, s = string;
    for (var i = 0; i < index.length; i++) {
      while ((match = index[i].regex.exec(s)) != null) {
        piece = string.substr(match.index, match[0].length);
        out.push({
          position: match.index,
          entity: entityName,
          value: index[i].id,
          string: piece,
          priority: priority || 0
        });
        news = s.substr(0, match.index);
        for (var j = 0; j < match[0].length; j++)
          news += " ";
        news += s.substr(match.index + match[0].length);
        s = news;
      }
    }
    return out;
  }
}