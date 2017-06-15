/**
 * Can recognize stacked regular expressions in a sentence. Cleans up the input text first.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 */
Bravey.RegexEntityRecognizer = function(entityName) {

  function sortEntities(ent) {
    ent.sort(function(a, b) {
      if (a.position < b.position) return -1;
      if (a.position > b.position) return 1;
      if (a.string.length > b.string.length) return -1;
      if (a.string.length < b.string.length) return 1;
      if (a.priority > b.priority) return -1;
      if (a.priority < b.priority) return 1;
      return 0;
    });
  }

  var regexs = [];

  /**
   * Add a new regular expression to the set.
   * @param {RegExp} regex - The regular expression to be matched.
   * @param {regexEntityRecognizerCallback} callback - The data processor to be called when the regular expression is matched.
   * @param {number} [priority=0] - The priority of produced entities.
   */
  this.addMatch = function(regex, callback, priority) {
    regexs.push({
      regex: regex,
      callback: callback,
      priority: priority || 0
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
   * Returns all found entities in a sentence. Returned entities value are defined by the specific callbacks.
   * @param {string} string - The sentence to be checked.
   * @param {Entity[]} [out=[]] - The array in which the found entities will be added.
   * @returns {Entity[]} The set of found entities.
   */
  this.getEntities = function(string, out) {
    string = Bravey.Text.clean(string);

    var found, piece, match, entitiesFound = [],
      pos = -1;

    if (!out) out = [];
    var s = string;
    for (var i = 0; i < regexs.length; i++) {
      while ((match = regexs[i].regex.exec(s)) != null) {
        piece = string.substr(match.index, match[0].length);
        found = regexs[i].callback(match);
        if (found !== undefined)
          entitiesFound.push(Bravey.Text.entityTrim({
            value: found,
            entity: entityName,
            position: match.index,
            string: piece,
            priority: regexs[i].priority
          }));
      }
    }
    sortEntities(entitiesFound);
    for (var i = 0; i < entitiesFound.length; i++)
      if (entitiesFound[i].position >= pos) {
        out.push(entitiesFound[i]);
        pos = entitiesFound[i].position + entitiesFound[i].string.length;
      }
    return out;
  }

  this.bindTo = function(obj) {
    var self = this;
    obj.getName = function() {
      return self.getName();
    }
    obj.getEntities = function(string, out) {
      return self.getEntities(string, out);
    }
  }
}

/**
 * Called when RegexEntityRecognizer matches a regular expression. 
 * @callback regexEntityRecognizerCallback
 * @param {string[]} match - The matched values.
 * @returns {Entity} The processed entity.
 * @returns {undefined} When the match found is not a valid entity.
 */