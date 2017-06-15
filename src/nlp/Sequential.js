/**
 * A version of the Natural Language Processing core. It processess entities in strict sequential order. More precise but harder hits.
 * @constructor
 */
Bravey.Nlp.Sequential = function(nlpName, extensions) {
  extensions = extensions || {};

  var intents = {};
  var documentClassifier = new Bravey.DocumentClassifier(extensions);
  var entities = {};
  var allEntities = [];
  var confidence = 0.75;

  function getIntentRoot(intentName) {
    return intentName.split(/~/)[0];
  }

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

  function guessIntent(text, root, names) {
    var intentname = root || "",
      nextid, ent,
      outtext = "",
      entities = [],
      counters = {},
      cur = 0,
      pos = -1;
    var out = extractEntities(text, allEntities);

    for (var i = 0; i < out.length; i++) {
      ent = out[i].entity;
      if (out[i].position >= pos) {

        intentname += "~" + ent;
        if (counters[ent] == undefined) counters[ent] = 0;
        else counters[ent]++;
        nextid = names && names[cur] ? names[cur] : ent + (counters[ent] ? counters[ent] : "");
        entities.push({
          entity: ent,
          id: nextid
        });

        if (pos == -1) outtext += text.substr(0, out[i].position);
        else outtext += text.substr(pos, out[i].position - pos);
        outtext += "{" + ent + "}";

        pos = out[i].position + out[i].string.length;

        cur++;
      }
    }

    outtext += text.substr(pos == -1 ? 0 : pos);

    return {
      error: false,
      text: outtext,
      name: intentname,
      entities: entities
    }
  }

  function guessIntentFromTagged(text, root, names) {

    var nextid, cur = -1,
      counters = {};

    var intentname = root || "",
      outentities = [],
      counters = {},
      cur = 0,
      error = false;

    text.replace(/\{([.a-z_-]+)\}/g, function(m, ent) {

      if (!entities[ent]) error = ent;
      else {

        intentname += "~" + ent;

        if (counters[ent] == undefined) counters[ent] = 0;
        else counters[ent]++;
        nextid = names && names[cur] ? names[cur] : ent + (counters[ent] ? counters[ent] : "");
        outentities.push({
          entity: ent,
          id: nextid
        });

        cur++;
      }

    });

    return {
      error: error,
      text: text,
      name: intentname,
      entities: outentities
    };
  }

  function getEntities(text, intent) {

    var out = extractEntities(text, intent.entities);
    var outentities = [],
      outentitiesindex = {},
      missingEntities = false,
      ent, pos = -1,
      entitypos = 0;

    function forward() { // @TODO: This part can be improved.
      while (intent.entities[entitypos] && entities[intent.entities[entitypos].entity].expand) {
        var match = {
          position: pos < 0 ? 0 : pos,
          entity: intent.entities[entitypos].entity,
          value: "",
          string: text.substr(pos < 0 ? 0 : pos),
          id: intent.entities[entitypos].id
        };
        outentitiesindex[match.id] = match;
        outentities.push(match);
        entitypos++;
      }
    }

    forward();

    if (out.length)
      for (var i = 0; i < out.length; i++) {
        ent = out[i].entity;
        if (out[i].position >= pos) {
          if (intent.entities[entitypos].entity == ent) {
            var match = {
              position: out[i].position,
              entity: ent,
              value: out[i].value,
              string: out[i].string,
              id: intent.entities[entitypos].id
            };
            outentities.push(match);
            outentitiesindex[match.id] = match;

            pos = out[i].position + out[i].string.length;

            entitypos++;
            forward();
            if (entitypos >= intent.entities.length) break;
          }
        }

      }
    else missingEntities = intent.entities.length;

    var nextentity, outtext = "",
      prevstring = "",
      pos = 0,
      sentence = [],
      oldposition;
    for (var i = 0; i < outentities.length; i++) {
      if (entities[outentities[i].entity].expand) {
        nextentity = outentities[i + 1];
        if (nextentity) outentities[i].string = outentities[i].string.substr(0, nextentity.position - outentities[i].position);
        oldposition = outentities[i].position;
        entities[outentities[i].entity].expand(outentities[i]);
        if (entities[outentities[i].entity].position > oldposition) {
          prevstring = text.substr(pos, entities[outentities[i].entity].position - oldposition);
          sentence.push({
            string: prevstring
          });
          outtext += prevstring;
          pos += entities[outentities[i].entity].position - oldposition;
        }
      }
      prevstring = text.substr(pos, outentities[i].position - pos);
      if (prevstring) {
        sentence.push({
          string: prevstring
        });
        outtext += prevstring;
      }
      sentence.push(outentities[i]);
      outtext += "{" + outentities[i].entity + "}";
      pos = outentities[i].position + outentities[i].string.length;
    }
    if (prevstring = text.substr(pos)) {
      sentence.push({
        string: prevstring
      });
      outtext += prevstring;
    }

    return {
      found: outentities.length,
      exceedEntities: false,
      missingEntities: outentities.length < intent.entities.length,
      extraEntities: outentities.length > intent.entities.length,
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
    var index = {},
      intentFullName = intentName;
    for (var i = 0; i < entities.length; i++) {
      intentFullName += "~" + entities[i].entity;
      if (!index[entities[i].entity]) index[entities[i].entity] = [];
      index[entities[i].entity].push(entities[i].id);
    }
    intents[intentFullName] = {
      name: intentFullName,
      root: intentName,
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
    if (!entities[entityName])
      allEntities.push({
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
   * @param {string} intent - The related intent. If not guessing, must prepend entity types separated by ~. (i.e. "call~phone_number")
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

          var found = guessIntent(text, intent, guess.withNames);
          if (!intents[found.name]) {
            console.warn("Adding intent", found.name);
            this.addIntent(intent, found.entities);
          }

          return documentClassifier.addDocument(found.text, intent);

        }

      } else if (guess.fromTaggedSentence) { // From a {tagged} sentence...

        var found = guessIntentFromTagged(text, intent, guess.withNames);
        if (found.error !== false) {
          console.warn("Can't find entity typed", found.error);
          return false;
        } else {
          if (!intents[found.name]) {
            console.warn("Adding intent", found.name);
            this.addIntent(intent, found.entities);
          }
          return documentClassifier.addDocument(found.text, intent);
        }

      }
      console.warn("Can't guess...");
      return false;
    } else { // Link a marked sentence to a particular intent
      if (intents[intent])
        return documentClassifier.addDocument(Bravey.Text.clean(text), getIntentRoot(intent));
      else {
        console.warn("Can't find intent", intent);
        return false;
      }
    }
  }

  /**
   * Check if a given sentence matches an intent and extracts its entities.
   * @param {string} text - The sentence to be processed.
   * @param {string} [method="default"] - The extraction method.
   * @returns {NlpResult} When an intent is found.
   * @returns {false} When the sentence doesn't match any intent.
   */
  this.test = function(text, method) {
    text = Bravey.Text.clean(text);
    switch (method) {
      default: { // When entities are enough, check classifier.
        var score, classification, entlist, result = false,
          resultscore = -1,
          resultfound = -1;
        for (var intent in intents) {
          entlist = getEntities(text, intents[intent]);
          if (!entlist.exceedEntities && !entlist.extraEntities && !entlist.missingEntities) { // No unwanted entites, entity count under the threshold and 0 entities for no entities intents
            classification = documentClassifier.classifyDocument(entlist.text);
            score = classification.scores[intents[intent].root];
            if ((score > confidence) && ((score > resultscore) || (entlist.found > resultfound))) {
              result = entlist;
              result.score = resultscore = score;
              resultfound = result.found;
              result.intent = intents[intent].root;
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