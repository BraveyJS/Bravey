/**
 * A basic unofficial compatibility object that can read {@link http://api.ai|Api.ai} exported packages and simulates its output.
 * @constructor
 * @param {string} packagePath - The path to the exported Api.ai package root.
 * @param {string} extensions.language - The language to be used. Possible values are namespace names of {@link Bravey.Language}. 
 * @param {string} extensions.nlp - The NLP processor to be used. Possible values are namespace names of {@link Bravey.Nlp}. 
 */
Bravey.ApiAiAdapter = function(packagePath, extensions) {
  extensions = extensions || {};

  var files = [];
  var loadedData = {};
  var intents = [];
  var entities = [];

  var nlp = new Bravey.Nlp[extensions.nlp || "Fuzzy"]("apiai", {
    stemmer: Bravey.Language[extensions.language].Stemmer,
    filter: extensions.filter
  });
  nlp.addEntity(new Bravey.Language[extensions.language].NumberEntityRecognizer("sys_number"));
  nlp.addEntity(new Bravey.Language[extensions.language].TimeEntityRecognizer("sys_time"));
  nlp.addEntity(new Bravey.Language[extensions.language].DateEntityRecognizer("sys_date"));
  nlp.addEntity(new Bravey.Language[extensions.language].TimePeriodEntityRecognizer("sys_time_period"));

  var pos = 0;
  var onready;

  function sanitizeApiAiId(id) {
    return id.replace(/[^a-z0-9:]/g, "_");
  }

  function loadNext() {
    Bravey.File.load(files[pos], function(text) {
      loadedData[files[pos]] = text;
      pos++;
      if (!files[pos]) dataLoaded();
      else loadNext();
    })
  }

  function dataLoaded() {
    var entity, missingEntity = {};

    for (var e = 0; e < entities.length; e++) {
      var data = JSON.parse(loadedData[entities[e].file]);
      var newEntity = new Bravey.StringEntityRecognizer(entities[e].name);
      for (var i = 0; i < data.entries.length; i++)
        for (var j = 0; j < data.entries[i].synonyms.length; j++)
          newEntity.addMatch(data.entries[i].value, data.entries[i].synonyms[j]);
      nlp.addEntity(newEntity);
    }

    for (var e = 0; e < intents.length; e++) {
      var data = JSON.parse(loadedData[intents[e].file]);
      for (var i = 0; i < data.userSays.length; i++) {
        var text = "",
          skip = false;
        for (var j = 0; j < data.userSays[i].data.length; j++) {
          if (data.userSays[i].data[j].meta) {
            entity = data.userSays[i].data[j].meta.substr(1);
            text += "{" + entity + ":" + data.userSays[i].data[j].alias + "}";
          } else text += data.userSays[i].data[j].text.replace(/\@([.a-z0-9_-]+):([.a-z0-9_-]+)/g, "{$1:$2}");
        }
        var names = [];
        text = text.replace(/\{([.a-z0-9_-]+):([.a-z0-9_-]+)\}/g, function(a, b, c) {
          b = sanitizeApiAiId(b);
          c = sanitizeApiAiId(c);
          if (!nlp.hasEntity(b)) {
            skip = true;
            if (!missingEntity[b]) {
              console.warn("Missing entity", b, data.userSays[i].data);
              missingEntity[b] = 1;
            }
          }
          names.push(c);
          return "{" + b + "}";
        });
        if (!skip)
          nlp.addDocument(text.trim(), intents[e].name, {
            fromTaggedSentence: true,
            expandIntent: true,
            withNames: names
          });
      }
    }

    onready();
  }

  /**
   * Prepare for loading an intent from the specified package.
   * @param {string} name - The intent name.
   */
  this.loadIntent = function(name) {
    var filename = packagePath + "/intents/" + name + ".json";
    files.push(filename);
    intents.push({
      file: filename,
      name: name
    });
  }

  /**
   * Prepare for loading an entity from the specified package.
   * @param {string} name - The intent name.
   */
  this.loadEntity = function(name) {
    var filename = packagePath + "/entities/" + name + ".json";
    files.push(filename);
    entities.push({
      file: filename,
      name: name
    });
  }

  /**
   * Load the needed files and prepares the NLP.
   * @param {function} cb - The callback called when everything is ready.
   */
  this.prepare = function(cb) {
    onready = cb;
    loadNext();
  }

  /**
   * Check if a given sentence matches an intent and extracts its entities. Output simulates Api.ai structure. For arguments, check {@link Bravey.Nlp.test}.	
   */
  this.test = function(text, method) {
    var out = this.nlp.test(text, method);
    if (out) {
      var ret = {
        result: {
          source: "agent",
          resolvedQuery: text,
          action: "",
          actionIncomplete: false,
          parameters: {

          },
          contexts: [],
          metadata: {
            intentName: ""
          },
          fulfillment: {
            speech: ""
          },
          score: 0
        },
        status: {
          code: 200,
          errorType: "success"
        }
      };
      ret.result.metadata.intentName = out.intent;
      ret.result.score = out.score;
      for (var a in out.entitiesIndex) ret.result.parameters[a] = out.entitiesIndex[a].value;
      return ret;
    } else
      return {
        result: {
          resolvedQuery: text,
          contexts: [],
          metadata: {},
          fulfillment: {
            speech: ""
          },
          score: 0
        },
        status: {
          code: 200,
          errorType: "success"
        }
      };
  }

  /** @property {Bravey.Nlp} nlp The raw Nlp instance. */
  this.nlp = nlp;
}