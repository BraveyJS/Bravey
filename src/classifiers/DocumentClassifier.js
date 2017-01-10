/**
 * The Bravey document classifier, based on Naive Bayes.
 * @constructor
 * @param {string} [extensions.stemmer] - A stemmer instance to be used for classifying.
 */
Bravey.DocumentClassifier = function(extensions) {
  extensions = extensions || {};
  var storage = {};

  var stemKey = function(stem, label) {
    return 'stem:' + stem + '::label:' + label;
  };
  var docCountKey = function(label) {
    return 'docCount:' + label;
  };
  var stemCountKey = function(stem) {
    return 'stemCount:' + stem;
  };

  var log = function(text) {
    //console.log(text);
  };

  var getLabels = function() {
    var labels = storage['registeredLabels'];
    if (!labels) labels = '';
    return labels.split(',').filter(function(a) {
      return a.length;
    });
  };

  var registerLabel = function(label) {
    var labels = getLabels();
    if (labels.indexOf(label) === -1) {
      labels.push(label);
      storage['registeredLabels'] = labels.join(',');
    }
    return true;
  };

  var stemLabelCount = function(stem, label) {
    var count = parseInt(storage[stemKey(stem, label)]);
    if (!count) count = 0;
    return count;
  };
  var stemInverseLabelCount = function(stem, label) {
    var labels = getLabels();
    var total = 0;
    for (var i = 0, length = labels.length; i < length; i++) {
      if (labels[i] === label)
        continue;
      total += parseInt(stemLabelCount(stem, labels[i]));
    }
    return total;
  };

  var stemTotalCount = function(stem) {
    var count = parseInt(storage[stemCountKey(stem)]);
    if (!count) count = 0;
    return count;
  };
  var docCount = function(label) {
    var count = parseInt(storage[docCountKey(label)]);
    if (!count) count = 0;
    return count;
  };
  var docInverseCount = function(label) {
    var labels = getLabels();
    var total = 0;
    for (var i = 0, length = labels.length; i < length; i++) {
      if (labels[i] === label)
        continue;
      total += parseInt(docCount(labels[i]));
    }
    return total;
  };
  var increment = function(key) {
    var count = parseInt(storage[key]);
    if (!count) count = 0;
    storage[key] = parseInt(count) + 1;
    return count + 1;
  };

  var incrementStem = function(stem, label) {
    increment(stemCountKey(stem));
    increment(stemKey(stem, label));
  };

  var incrementDocCount = function(label) {
    return increment(docCountKey(label));
  };

  var train = function(text, label) {
    registerLabel(label);
    var words = Bravey.Text.tokenize(Bravey.Text.clean(text));
    if (extensions.filter) words = extensions.filter(words);
    var length = words.length;
    for (var i = 0; i < length; i++)
      incrementStem(extensions.stemmer ? extensions.stemmer(words[i]) : words[i], label);
    incrementDocCount(label);
  };

  var guess = function(text) {
    var words = Bravey.Text.tokenize(Bravey.Text.clean(text));
    if (extensions.filter) words = extensions.filter(words);

    var length = words.length;
    var labels = getLabels();
    var totalDocCount = 0;
    var docCounts = {};
    var docInverseCounts = {};
    var scores = {};
    var labelProbability = {};

    for (var j = 0; j < labels.length; j++) {
      var label = labels[j];
      docCounts[label] = docCount(label);
      docInverseCounts[label] = docInverseCount(label);
      totalDocCount += parseInt(docCounts[label]);
    }

    for (var j = 0; j < labels.length; j++) {
      var label = labels[j];
      var logSum = 0;
      labelProbability[label] = docCounts[label] / totalDocCount;

      for (var i = 0; i < length; i++) {
        var word = extensions.stemmer ? extensions.stemmer(words[i]) : words[i];
        var _stemTotalCount = stemTotalCount(word);
        if (_stemTotalCount === 0) {
          continue;
        } else {
          var wordProbability = stemLabelCount(word, label) / docCounts[label];
          var wordInverseProbability = stemInverseLabelCount(word, label) / docInverseCounts[label];
          var wordicity = wordProbability / (wordProbability + wordInverseProbability);
          wordicity = ((1 * 0.5) + (_stemTotalCount * wordicity)) / (1 + _stemTotalCount);
          if (wordicity === 0)
            wordicity = 0.01;
          else if (wordicity === 1)
            wordicity = 0.99;
        }

        logSum += (Math.log(1 - wordicity) - Math.log(wordicity));
        log(label + "icity of " + word + ": " + wordicity);
      }
      scores[label] = 1 / (1 + Math.exp(logSum));
    }
    return scores;
  };

  var extractWinner = function(scores) {
    var bestScore = 0;
    var bestLabel = null;
    for (var label in scores) {
      if (scores[label] > bestScore) {
        bestScore = scores[label];
        bestLabel = label;
      }
    }
    return {
      label: bestLabel,
      score: bestScore
    };
  };

  /**
   * Add a document to the classifier.
   * @param {string} text - The text to be classified.
   * @param {string} label - The related label
   * @returns {text} The classified text.
   */
  this.addDocument = function(text, label) {
    train(text, label);
    return text;
  }

  /**
   * Classify a document.
   * @param {string} text - The document to be classified.
   * @returns {DocumentClassification} The document class.
   */
  this.classifyDocument = function(text) {
    var scores = guess(text);
    var winner = extractWinner(scores);
    return {
      scores: scores,
      winner: winner
    };
  }

  this.addDocument("", "none");

}

/**
 Describes a document classification.
 @typedef DocumentClassification
 @type {Object}
 @property {number[]} scores The related scores for each known document label.
 @property {number} winner.score The score of the winning label.
 @property {string} winner.label The name of the winning label.
*/