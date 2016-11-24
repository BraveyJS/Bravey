/**
 * Can recognize free text in a sentence. Explicit with <tt>"free text"</tt>. It works with {@link Bravey.nlp.Sequential} only. BETA!
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @param {number} [priority=0] - Priority given to extracted entities.
 */
Bravey.FreeTextEntityRecognizer = function(entityName, priority) {

  var quotes = /\"([^\"]*)\"/;
  var prefixes = [];
  var conjunctions = [];

  /**
   * Returns the recognizer entity name.
   * @returns {string} The entity name.
   */
  this.getName = function() {
    return entityName;
  }

  /**
   * Adds a sentence prefix. (i.e. "with <tt>title</tt> ...")
   * @param {string} string - The prefix to be added.
   */
  this.addPrefix = function(prefix) {
    if (prefixes.indexOf(prefix) == -1) prefixes.push(prefix);
  }

  /**
   * Adds a sentence conjunction. (i.e. "which title <tt>is</tt>...")
   * @param {string} string - The conjunction to be added.
   */
  this.addConjunction = function(conjunction) {
    conjunctions.push(new RegExp("^\\b" + conjunction + "\\b", "gi"));
    conjunctions.push(new RegExp("\\b" + conjunction + "\\b$", "gi"));
  }

  /**
   * Returns all found entities in a sentence. Returned entities value is <tt>string</tt>.
   * @param {string} string - The sentence to be checked.
   * @param {Entity[]} [out=[]] - The array in which the found entities will be added.
   * @returns {Entity[]} The set of found entities.
   */
  this.getEntities = function(string, out) {
    return out;
  }

  this.expand = function(match) { // @TODO: This part can be improved.
    var pos, found, foundcrop = -1,
      foundpos = -1;
    if ((found = quotes.exec(match.string)) != null) {
      match.position += found.index + 1;
      match.string = found[1];
    } else {
      for (var i = 0; i < prefixes.length; i++) {
        if (((pos = match.string.indexOf(prefixes[i])) != -1) && ((foundpos == -1) || (pos < foundpos))) {
          foundpos = pos;
          foundcrop = pos + prefixes[i].length;
        }
      }
      if (foundcrop != -1) {
        match.position += foundcrop;
        match.string = match.string.substr(foundcrop);
      }
      Bravey.Text.entityTrim(match);
      do {
        foundpos = 0;
        for (var i = 0; i < conjunctions.length; i++) {
          if ((found = conjunctions[i].exec(match.string)) != null) {
            foundpos = 1;
            if (found.index == 0) {
              match.string = match.string.substr(found[0].length);
              match.position += found[0].length;
            } else {
              match.string = match.string.substr(0, found.index);
            }
            Bravey.Text.entityTrim(match);
          }
        }
      } while (foundpos);
      if ((pos = match.string.lastIndexOf(".")) != -1) match.string = match.string.substr(0, pos);
      Bravey.Text.entityTrim(match);
    }
    match.value = match.string;
  }

}