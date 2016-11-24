/**
 * Can recognize numbers in a sentence.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 */
Bravey.NumberEntityRecognizer = function(entityName) {
  var regex = new RegExp("\\b[0-9]+\\b", "gi");

  /**
   * Returns the recognizer entity name. Returned entities value is <tt>number</tt>.
   * @returns {string} The entity name.
   */
  this.getName = function() {
    return entityName;
  }

  /**
   * Returns all found entities in a sentence.
   * @param {string} string - The sentence to be checked.
   * @param {Entity[]} [out=[]] - The array in which the found entities will be added.
   * @returns {Entity[]} The set of found entities.
   */
  this.getEntities = function(string, out) {
    string = Bravey.Text.clean(string);

    var piece, match;

    if (!out) out = [];
    var s = string;
    while ((match = regex.exec(s)) != null) {
      piece = string.substr(match.index, match[0].length);
      out.push({
        position: match.index,
        entity: entityName,
        value: piece * 1,
        string: piece
      });
    }
    return out;
  }
}