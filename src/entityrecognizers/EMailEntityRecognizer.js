/**
 * Can recognize e-mail addresses in a sentence.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @param {number} [priority=0] - Priority given to extracted entities.
 */
Bravey.EMailEntityRecognizer = function(entityName, priority) {
  var regex = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

  /**
   * Returns the recognizer entity name.
   * @returns {string} The entity name.
   */
  this.getName = function() {
    return entityName;
  }

  /**
   * Returns all found entities in a sentence. Returned entities value is <tt>string</tt>.
   * @param {string} string - The sentence to be checked.
   * @param {Entity[]} [out=[]] - The array in which the found entities will be added.
   * @returns {Entity[]} The set of found entities.
   */
  this.getEntities = function(string, out) {
    var piece, match;
    if (!out) out = [];
    while ((match = regex.exec(string)) != null) {
      piece = string.substr(match.index, match[0].length);
      out.push({
        position: match.index,
        entity: entityName,
        value: piece,
        string: piece,
        priority: priority || 0
      });
    }
    return out;
  }
}