/**
 * A version of the Natural Language Processing core. Doesn't follow entity order but tries to guess names by samples. Less precise but easier hits.
 * @constructor
 */
Bravey.Nlp.Fuzzy = function(nlpName, extensions) {
  extensions = extensions || {};

  var intents = {};
  var documentClassifier = new Bravey.DocumentClassifier(extensions);
  var entities = {};
  var allEntities = [];
  var confidence = 0.75;

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

  function extractEntities(text, ent) {
    var out = [],
      done = {};
    for (var i = 0; i < ent.length; i++)
      if (!done[ent[i].entity]) {
        done[ent[i].entity] = 1;
        entities[ent[i].entity].getEntities(text, out);
      }
    sortEntities(out);
    return out;
  }

  function getEntities(text, intent) {

    var out = extractEntities(text, intent.entities);
    var outentities = [],
      outentitiesindex = {},
      sentence = [],
      ent, pos = -1,
      nextid, outtext = "",
      exceedEntities = false,
      extraEntities = false,
      missingEntities = false,
      counters = {},
      found = 0,
      prevstring;

    for (var i = 0; i < out.length; i++) {
      ent = out[i].entity;
      if (out[i].position >= pos) {
        if (intent.index[ent]) {
          if (counters[ent] == undefined) counters[ent] = 0;
          if (nextid = intent.index[ent][counters[ent]]) {
            counters[ent]++;
            found++;
            var match = {
              position: out[i].position,
              entity: ent,
              value: out[i].value,
              string: out[i].string,
              id: nextid
            };
            outentities.push(match);
            outentitiesindex[match.id] = match;

            if (pos == -1) prevstring = text.substr(0, out[i].position);
            else prevstring = text.substr(pos, out[i].position - pos);

            if (prevstring.length) sentence.push({
              string: prevstring
            });
            sentence.push(match);

            outtext += prevstring;

            outtext += "{" + ent + "}";
            pos = out[i].position + out[i].string.length;
          } else
            exceedEntities = true;
        } else extraEntities = true;
      }
    }

    prevstring = text.substr(pos == -1 ? 0 : pos);
    if (prevstring.length) {
      if (prevstring.length) sentence.push({
        string: prevstring
      });
      outtext += prevstring;
    }

    return {
      found: found,
      missingEntities: missingEntities,
      exceedEntities: exceedEntities,
      extraEntities: extraEntities,
      text: outtext,
      entities: outentities,
      sentence: sentence,
      entitiesIndex: outentitiesindex
    };
  }

  function expandIntentFromText(text, intent, names) {

    var ent, outtext = "",
      cur = -1,
      pos = -1,
      nextid, out = extractEntities(text, allEntities),
      counters = {};

    for (var i = 0; i < out.length; i++) {
      ent = out[i].entity;
      if (out[i].position > pos) {
        cur++;

        if (!intent.index[ent]) intent.index[ent] = [];
        if (counters[ent] == undefined) counters[ent] = 0;
        else counters[ent]++;
        nextid = intent.index[ent][counters[ent]];

        if (!nextid) {
          nextid = intent.index[ent][counters[ent]] = names && names[cur] ? names[cur] : ent + (counters[ent] ? counters[ent] : "");
          intent.entities.push({
            entity: ent,
            id: nextid
          });
          console.warn("Adding entity", nextid, "to", intent.name);
        }

        if (pos == -1)
          outtext += text.substr(0, out[i].position);
        else
          outtext += text.substr(pos, out[i].position - pos);
        outtext += "{" + ent + "}";
        pos = out[i].position + out[i].string.length;

      }
    }

    outtext += text.substr(pos == -1 ? 0 : pos);

    return {
      text: outtext
    };

  }

  function expandIntentFromTagged(text, intent, names) {

    var nextid, cur = -1,
      counters = {};

    text.replace(/\{([.a-z_-]+)\}/g, function(m, ent) {
      cur++;

      if (!intent.index[ent]) intent.index[ent] = [];
      if (counters[ent] == undefined) counters[ent] = 0;
      else counters[ent]++;
      nextid = intent.index[ent][counters[ent]];

      if (!nextid) {
        nextid = intent.index[ent][counters[ent]] = names && names[cur] ? names[cur] : ent + (counters[ent] ? counters[ent] : "");
        intent.entities.push({
          entity: ent,
          id: nextid
        });
        console.warn("Adding entity", nextid, "to", intent.name);
      }
    });

    return {
      text: text
    };
  }

  function getAnyEntity(text) {
    var prevstring, outentities = [],
      outentitiesindex = {},
      sentence = [],
      ent, nextid, outtext = "",
      counters = {},
      pos = -1,
      cur = -1,
      found = 0,
      out = extractEntities(text, allEntities);
    for (var i = 0; i < out.length; i++) {
      ent = out[i].entity;
      if (out[i].position > pos) {
        found++;
        cur++;
        if (counters[ent] == undefined) counters[ent] = 0;
        else counters[ent]++;
        nextid = ent + (counters[ent] ? counters[ent] : "");
        var match = {
          position: out[i].position,
          entity: ent,
          value: out[i].value,
          string: out[i].string,
          id: nextid
        };
        outentities.push(match);
        outentitiesindex[match.id] = match;
        if (pos == -1) prevstring = text.substr(0, out[i].position);
        else prevstring = text.substr(pos, out[i].position - pos);
        if (prevstring.length) sentence.push({
          string: prevstring
        });
        sentence.push(match);
        outtext += prevstring;
        outtext += "{" + ent + "}";
        pos = out[i].position + out[i].string.length;
      }
    }

    prevstring = text.substr(pos == -1 ? 0 : pos);
    if (prevstring.length) {
      if (prevstring.length) sentence.push({
        string: prevstring
      });
      outtext += prevstring;
    }
    return {
      found: found,
      text: outtext,
      entities: outentities,
      sentence: sentence,
      entitiesIndex: outentitiesindex
    };
  }

  /**
   * Adds an intent.
   * @param {string} intentName - The name of the new intent.
   * @param {IntentEntity[]} entities - The produced entities.
   * @returns {boolean} True when successful.
   */
  this.addIntent = function(intentName, entities) {
    var index = {};
    for (var i = 0; i < entities.length; i++) {
      if (!index[entities[i].entity]) index[entities[i].entity] = [];
      index[entities[i].entity].push(entities[i].id);
    }
    intents[intentName] = {
      name: intentName,
      entities: entities,
      index: index
    };
    return true;
  }

  /**
   * Adds an entity recognizer.
   * @param {EntityRecognizer} entity - The entity recognizer to be addded.
   * @returns {boolean} True when successful.
   */
  this.addEntity = function(entity) {
    var entityName = entity.getName();
    if (!entities[entityName]) allEntities.push({
      entity: entityName,
      id: "none"
    });
    entities[entityName] = entity;
    return true;
  }

  /**
   * Check if an entity with a given name exists.
   * @param {string} entityName - The entity name.
   * @returns {boolean} True when found.
   */
  this.hasEntity = function(entityName) {
    return !!entities[entityName];
  }

  /**
   * Set confidence ratio, from 0.5 to 1. The higher the more strict.
   * @param {number} ratio - The confidence ratio to be set.
   */
  this.setConfidence = function(ratio) {
    confidence = ratio;
  }

  /**
   * Returns the confidence ratio.
   * @returns {number} The confidence ratio.
   */
  this.getConfidence = function(c) {
    return confidence;
  }

  /**
   * Add a new document.
   * @param {string} text - The document content.
   * @param {string} intent - The related intent.
   * @param {boolean} [guess.fromFullSentence=false] - Indicates that the document is a full untagged sentence. (i.e. "Please call the 333-123456")
   * @param {boolean} [guess.fromTaggedSentence=true] - Indicates that the document is tagged with braces. (i.e "Please call the {phone_number}")
   * @param {boolean} [guess.expandIntent=false] - Extends or creates a new intent if exceeded entities are found. New entities id will be autogenerated and progressive.
   * @param {string[]} [guess.withNames=[]] - Uses the given names for auto-extending intents. Positions in array are matched with positions of entity into the specified sentence.
   * @returns {boolean} True when found.
   */
  this.addDocument = function(text, intent, guess) {
    if (guess) {

      if (guess.fromFullSentence) { // From a full sentence...

        text = Bravey.Text.clean(text);

        if (guess.expandIntent) { // Expand intent with found items
          if (!intents[intent]) {
            console.warn("Adding intent", intent);
            this.addIntent(intent, []);
          }
          var expanded = expandIntentFromText(text, intents[intent], guess.withNames);
          return documentClassifier.addDocument(expanded.text, intent);
        }

      } else if (guess.fromTaggedSentence) { // From a {tagged} sentence...

        if (guess.expandIntent) { // Expand intent with found items
          if (!intents[intent]) {
            console.warn("Adding intent", intent);
            this.addIntent(intent, []);
          }
          var expanded = expandIntentFromTagged(text, intents[intent], guess.withNames);
          return documentClassifier.addDocument(expanded.text, intent);
        }

      }
      console.warn("Can't guess...");
      return false;
    } else { // Link a marked sentence to a particular intent
      if (intents[intent])
        return documentClassifier.addDocument(Bravey.Text.clean(text), intent);
      else {
        console.warn("Can't find intent", intent);
        return false;
      }
    }
  }

  /**
   * Check if a given sentence matches an intent and extracts its entities.
   * @param {string} text - The sentence to be processed.
   * @param {string} [method="default"] - The extraction method. "anyEntity" extracts all found entities and guess intent, regardless the intents structure.
   * @returns {NlpResult} When an intent is found.
   * @returns {false} When the sentence doesn't match any intent.
   */
  this.test = function(text, method) {
    text = Bravey.Text.clean(text);
    switch (method) {
      case "anyEntity":
        {
          var result = getAnyEntity(text);
          var classification = documentClassifier.classifyDocument(result.text);
          result.score = classification.winner.score;
          result.intent = classification.winner.label;
          return result;
        }
      default:
        { // When entities are enough, check classifier.
          var classification, entlist, result = false,
            resultscore = -1,
            resultfound = -1;
          for (var intent in intents) {
            entlist = getEntities(text, intents[intent]);
            if (!entlist.exceedEntities && !entlist.extraEntities && !entlist.missingEntities) { // No unwanted entites, entity count under the threshold and 0 entities for no entities intents
              classification = documentClassifier.classifyDocument(entlist.text);
              if ((classification.scores[intent] > confidence) && ((classification.scores[intent] > resultscore) || ((classification.scores[intent] == resultscore) && (entlist.found > resultfound)))) {
                result = entlist;
                result.score = resultscore = classification.scores[intent];
                resultfound = result.found;
                result.intent = intent;
              }
            }
          }
          return result;
        }
    }
    return false;
  }
}

/**
 Describes an entity to be matched in an intent.
 @typedef IntentEntity
 @type {Object}
 @property {string} entity The entity type to be found.
 @property {string} id The entity ID to be assigned when found.
*/

/**
 Describes a sentence classification and entities.
 @typedef NlpResult
 @type {Object}
 @property {Entity[]} entities The ordered list of found entities.
 @property {number[]} entitiesIndex An map version of entities, with key as entity ID and value as entity value.
 @property {string} intent The matched intent.
 @property {number} score The score of the matched sentence intent.
*/