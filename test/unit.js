var TestTools = {
  SECOND: 1000,
  MINUTE: 60000,
  HOUR: 60000 * 60,
  DAY: 60000 * 60 * 24,
  formatDate: function(timestamp) {
    var myDate = new Date(timestamp);
    return myDate.getFullYear() + "-" + this.pad(myDate.getMonth() + 1, 2) + "-" + this.pad(myDate.getDate(), 2);
  },
  formatTime: function(time) {
    return this.pad(Math.floor(time / this.HOUR), 2) + ":" + this.pad(Math.floor((time % this.HOUR) / this.MINUTE), 2) + ":" + this.pad(Math.floor((time % this.MINUTE) / this.SECOND), 2);
  },
  getYear: function() {
    var myDate = new Date();
    return myDate.getFullYear();
  },
  getMonth: function() {
    var myDate = new Date();
    return this.pad(myDate.getMonth() + 1, 2);
  },
  getLastDay: function(month, day) {
    day = day * 1;
    month = month * 1;
    var myDate = new Date();
    var y = myDate.getFullYear() * 1;
    var m = myDate.getMonth() + 1;
    var d = myDate.getDate() * 1;
    if (month > m)
      return (y - 1) + "-" + this.pad(month, 2) + "-" + this.pad(day, 2);
    else
      return (y) + "-" + this.pad(month, 2) + "-" + this.pad(day, 2);
  },
  getNextDay: function(month, day) {
    day = day * 1;
    month = month * 1;
    var myDate = new Date();
    var y = myDate.getFullYear() * 1;
    var m = myDate.getMonth() + 1;
    var d = myDate.getDate() * 1;
    if (month < m)
      return (y - 1) + "-" + this.pad(month, 2) + "-" + this.pad(day, 2);
    else
      return (y) + "-" + this.pad(month, 2) + "-" + this.pad(day, 2);
  },
  pad: function(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  },
  nlpTest: function(assert, nlp, text, intent, entities, mode) {
    var r = nlp.test(text, mode, "Ask " + text);
    if (intent == false)
      assert.strictEqual(r, false, text + " must not match.");
    else {
      assert.strictEqual(r.intent, intent, text + " must match intent " + intent);
      for (var a in entities) {
        assert.ok(r.entitiesIndex[a] !== undefined, "Must have entity " + a);
        assert.deepEqual(r.entitiesIndex[a].value, entities[a], "Must have entity " + a + " = " + JSON.stringify(entities[a]));
      }
    }
  },
  nlpAddDocument: function(assert, nlp, text, intent, mods, expected) {
    assert.strictEqual(nlp.addDocument(text, intent, mods), expected, "Adding document: " + text + " -> " + expected);
    if (mods && mods.fromFullSentence) {
      var match = nlp.test(text);
      assert.strictEqual(match.intent, intent, text + " must match its intent " + intent);
    }

  },
  nlpClassifyDocument: function(assert, nlp, text, intent) {
    assert.strictEqual(nlp.addDocument(text, intent), text, "Adding document: " + text);
    var match = nlp.classifyDocument(text);
    assert.strictEqual(match.winner.label, intent, text + " must match its intent " + intent);
  }
};

// Text

QUnit.test("Text.generateGUID", function(assert) {
  var guid = Bravey.Text.generateGUID();
  assert.ok(guid.match(/^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/g), "GUID format is correct");
});

QUnit.test("Text.clean", function(assert) {
  assert.strictEqual(Bravey.Text.clean("   this  IS  a  {tag}*!  tòàst    Iлｔèｒｎåｔïｏｎɑｌíƶａｔï߀ԉ   "), "this is a {tag}*! toast internationalizati0n", "Misc accents and consecutive spaces stripped");
});

QUnit.test("Text.pad", function(assert) {
  assert.strictEqual(Bravey.Text.pad(12, 1), "12", "Padded number can be longer than specified");
  assert.strictEqual(Bravey.Text.pad(12, 2), "12", "Padded number is log as specified");
  assert.strictEqual(Bravey.Text.pad(12, 3), "012", "Padding symbols are added");
  assert.strictEqual(Bravey.Text.pad(12, 5, "*"), "***12", "Can specify padding symbol");
});

QUnit.test("Text.unique", function(assert) {
  assert.deepEqual(Bravey.Text.unique(["1", "2", "3", "4"]), ["1", "2", "3", "4"], "Unique arrays are kept as-is");
  assert.deepEqual(Bravey.Text.unique(["1", "2", "2", "4"]), ["1", "2", "4"], "Equal elements are uniqued");
  assert.deepEqual(Bravey.Text.unique(["1", "2", "3", "3"]), ["1", "2", "3"], "Equal last elements are uniqued");
  assert.deepEqual(Bravey.Text.unique(["1", "1", "3", "4"]), ["1", "3", "4"], "Equal first elements are uniqued");
});

QUnit.test("Text.RegexMap", function(assert) {
  var match, iteration = 0;
  var reg = new Bravey.Text.RegexMap([{
    str: ["ciao"],
    val: "Hello1!"
  }, {
    str: ["welcome"],
    val: "Hello2!"
  }], "default1");
  var reg2 = new Bravey.Text.RegexMap([{
    str: ["va"],
    val: "andare1!"
  }, {
    str: ["andale"],
    val: "andare2!"
  }], "default2");
  var find = new RegExp(reg.regex() + "[^(va)]*" + reg2.regex(1), "gi");
  var s = "ciao come va? Welcome! Come andale!";
  while ((match = find.exec(s)) != null) {
    iteration++;
    switch (iteration) {
      case 1:
        {
          assert.strictEqual(reg.get(match, 1), "Hello1!", "reg must match");
          assert.strictEqual(reg2.get(match, 2), "andare1!", "reg2 must match");
          break;
        }
      case 2:
        {
          assert.strictEqual(reg.get(match, 1), "default1", "reg must match");
          assert.strictEqual(reg2.get(match, 2), "andare2!", "reg2 must match");
          break;
        }
    }
  }
  assert.strictEqual(iteration, 2, "Iterations number must be correct");

  reg = new Bravey.Text.RegexMap([{
    str: ["~bar", "~foo"],
    val: "is matched!"
  }], "default1");
  find = new RegExp(reg.regex(1), "gi");
  s = "bar foobar foo barfoo afoobara endfoo endbar";
  var matches = 0;
  while ((match = find.exec(s)) != null) matches++;
  assert.strictEqual(matches, 4, "Matched only when word starts");

  reg = new Bravey.Text.RegexMap([{
    str: ["bar~", "foo~"],
    val: "is matched!"
  }], "default1");
  find = new RegExp(reg.regex(1), "gi");
  matches = 0;
  while ((match = find.exec(s)) != null) matches++;
  assert.strictEqual(matches, 6, "Matched only when word ends");

  reg = new Bravey.Text.RegexMap([{
    str: ["~bar~", "~foo~"],
    val: "is matched!"
  }], "default1");
  find = new RegExp(reg.regex(1), "gi");
  matches = 0;
  while ((match = find.exec(s)) != null) matches++;
  assert.strictEqual(matches, 2, "Matched only when whole words");

  find = new RegExp("afoobara " + reg.regex(), "gi");
  matches = 0;
  while ((match = find.exec(s)) != null) {
    matches++;
    assert.strictEqual(reg.get(match, 1, "default2"), "default2", "Per-call defaults must be correct");
  }
  assert.strictEqual(matches, 1, "Not-obligatory parts must be valid");

});

QUnit.test("Text.removeDiacritics", function(assert) {
  assert.strictEqual(Bravey.Text.removeDiacritics("Iлｔèｒｎåｔïｏｎɑｌíƶａｔï߀ԉ"), "Internationalizati0n", "Accents are replaced");
  assert.strictEqual(Bravey.Text.removeDiacritics("Båｃòл íｐѕùｍ ðｏɭ߀ｒ ѕïｔ ａϻèｔ âùþê ａԉᏧ߀üïｌɭê ƃëéｆ ｃｕｌρá ｆïｌèｔ ϻｉǥｎòｎ ｃｕρｉᏧａｔａｔ ｕｔ êлｉｍ ｔòлɢùê."), "Bacon ipѕum dhol0r ѕit aMet authe and0uille beef culpa filet Mignon cupidatat ut enim tonGue.", "Complex accents must be replaced");
  assert.strictEqual(Bravey.Text.removeDiacritics("ᴎᴑᴅᴇȷʂ"), "NoDEJs", "Complex accents must be replaced");
  assert.strictEqual(Bravey.Text.removeDiacritics("hambúrguer"), "hamburguer", "Complex accents must be replaced");
  assert.strictEqual(Bravey.Text.removeDiacritics("hŒllœ"), "hOElloe", "Complex accents must be replaced");
  assert.strictEqual(Bravey.Text.removeDiacritics("Fußball"), "Fussball", "Complex accents must be replaced");
  assert.strictEqual(Bravey.Text.removeDiacritics("ABCDEFGHIJKLMNOPQRSTUVWXYZé"), "ABCDEFGHIJKLMNOPQRSTUVWXYZe", "Not-diacritics letters are kept as-is");
});

QUnit.test("Text.tokenize", function(assert) {
  assert.deepEqual(Bravey.Text.tokenize("The Dog is on the table!"), ["The", "Dog", "is", "on", "the", "table"], "Strings are tokenized");
});

QUnit.test("Text.calculateScore", function(assert) {
  var splits = ["", "the", "", "dog"];
  assert.deepEqual(Bravey.Text.calculateScore(splits, []), 0, "No score set = 0");
  assert.deepEqual(Bravey.Text.calculateScore(splits, [-1, 10]), 0, "Out = 0");
  assert.deepEqual(Bravey.Text.calculateScore(splits, [0, 2]), 0, "Empty spaces = 0");
  assert.deepEqual(Bravey.Text.calculateScore(splits, [0, 1]), 1, "One point = 1");
  assert.deepEqual(Bravey.Text.calculateScore(splits, [0, 1, 2]), 1, "One point = 1");
  assert.deepEqual(Bravey.Text.calculateScore(splits, [0, 1, 2, 3]), 2, "Two points = 2");
});

QUnit.test("Text.entityTrim", function(assert) {
  assert.deepEqual(Bravey.Text.entityTrim({
    string: "hello",
    position: 0
  }), {
    string: "hello",
    position: 0
  }, "No trim needed");

  assert.deepEqual(Bravey.Text.entityTrim({
    string: ", hello",
    position: 0
  }), {
    string: "hello",
    position: 2
  }, "Trim left");

  assert.deepEqual(Bravey.Text.entityTrim({
    string: "hello , , ",
    position: 0
  }), {
    string: "hello",
    position: 0
  }, "Trim right");

  assert.deepEqual(Bravey.Text.entityTrim({
    string: ", , ,hello , , ",
    position: 0
  }), {
    string: "hello",
    position: 5
  }, "Trim both");

});

// Date

QUnit.test("Date.formatDate", function(assert) {
  assert.strictEqual(TestTools.formatDate(1463138813392), "2016-05-13", "Dates are formatted correctly");
  assert.strictEqual(TestTools.formatDate(1463138813392 + TestTools.DAY), "2016-05-14", "Dates are formatted correctly");
});

// File

QUnit.test("File.load", function(assert) {
  var done1 = assert.async();
  var done2 = assert.async();
  Bravey.File.load("test-data/test.json", function(text) {
    assert.deepEqual(text, "{\"loaded\":\"ok\"}", "Files are loaded successfully");
    done1();
  });
  Bravey.File.load("test-data/notfoundtest.json", function(text) {
    assert.deepEqual(text, undefined, "File not found returns undefined");
    done2();
  });
});

// Data

QUnit.test("Data.getEntityValue", function(assert) {
  assert.deepEqual(Bravey.Data.getEntityValue({
    result: false
  }, "test"), undefined, "No match and no session = no data");
  assert.deepEqual(Bravey.Data.getEntityValue({
    result: {
      entitiesIndes: {}
    }
  }, "test"), undefined, "Match with no entity and no session = no data");
  assert.deepEqual(Bravey.Data.getEntityValue({
    result: false,
    sessionData: {
      foo: "bar"
    }
  }, "test"), undefined, "No match and session with no data = no data");
  assert.deepEqual(Bravey.Data.getEntityValue({
    result: false,
    sessionData: {
      foo: "bar",
      test: "found"
    }
  }, "test"), "found", "No match and session with data = session data");
  assert.deepEqual(Bravey.Data.getEntityValue({
    result: {
      entitiesIndex: {}
    },
    sessionData: {
      foo: "bar",
      test: "found"
    }
  }, "test"), "found", "Match with no entity and session with data = session data");
  assert.deepEqual(Bravey.Data.getEntityValue({
    result: {
      entitiesIndex: {
        test: {
          value: "found2"
        }
      }
    },
    sessionData: {
      foo: "bar",
      test: "found"
    }
  }, "test"), "found2", "Match with entity and session with data = entity data");
  assert.deepEqual(Bravey.Data.getEntityValue({
    result: {
      entitiesIndex: {
        test: {
          value: "found2"
        }
      }
    },
    sessionData: {
      foo: "bar",
      test: "found"
    }
  }, "test", "found2"), "found", "Match with entity and session with data, default override = session data");
});

// NumberEntityRecognizer

QUnit.test("NumberEntityRecognizer", function(assert) {
  var reg = new Bravey.NumberEntityRecognizer("test");
  assert.deepEqual(reg.getEntities("these12 are not 12numbers but this 12 is a full number! y0u can b3t it that 24 is a number!"), [{
    "position": 35,
    "entity": "test",
    "value": 12,
    "string": "12"
  }, {
    "position": 76,
    "entity": "test",
    "value": 24,
    "string": "24"
  }], "Multiple numbers are matched");


  assert.deepEqual(reg.getEntities("12"), [{
    "entity": "test",
    "position": 0,
    "string": "12",
    "value": 12
  }], "Single entities are matched");

  assert.deepEqual(reg.getEntities("asd 12"), [{
    "entity": "test",
    "position": 4,
    "string": "12",
    "value": 12
  }], "Last entities are matched");

  assert.deepEqual(reg.getEntities("12 asd"), [{
    "entity": "test",
    "position": 0,
    "string": "12",
    "value": 12
  }], "First entities are matched");

  assert.deepEqual(reg.getEntities("12 34 48"), [{
    "entity": "test",
    "position": 0,
    "string": "12",
    "value": 12
  }, {
    "entity": "test",
    "position": 3,
    "string": "34",
    "value": 34
  }, {
    "entity": "test",
    "position": 6,
    "string": "48",
    "value": 48
  }], "Consecutive entities are matched");
});


// EMailEntityRecognizer

QUnit.test("EMailEntityRecognizer", function(assert) {
  var reg = new Bravey.EMailEntityRecognizer("test");
  assert.deepEqual(reg.getEntities("this@is a test of how it.should@match.com the email@@ add@resses. a@b.c foo.bar@domain.z this one is name.surname@domain.cc"), [{
    "entity": "test",
    "position": 22,
    "priority": 0,
    "string": "it.should@match.com",
    "value": "it.should@match.com"
  }, {
    "entity": "test",
    "position": 101,
    "priority": 0,
    "string": "name.surname@domain.cc",
    "value": "name.surname@domain.cc"
  }], "Multiple addresses are matched");

  assert.deepEqual(reg.getEntities("name.surname@domain.cc"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "name.surname@domain.cc",
    "value": "name.surname@domain.cc"
  }], "Single entities are matched");

  assert.deepEqual(reg.getEntities("asd name.surname@domain.cc"), [{
    "entity": "test",
    "position": 4,
    "priority": 0,
    "string": "name.surname@domain.cc",
    "value": "name.surname@domain.cc"
  }], "Last entities are matched");

  assert.deepEqual(reg.getEntities("name.surname@domain.cc asd"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "name.surname@domain.cc",
    "value": "name.surname@domain.cc"
  }], "First entities are matched");

  assert.deepEqual(reg.getEntities("name.surname@domain.cc name2.surname@domain.cc name.surname2@domain.cc"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "name.surname@domain.cc",
    "value": "name.surname@domain.cc"
  }, {
    "entity": "test",
    "position": 23,
    "priority": 0,
    "string": "name2.surname@domain.cc",
    "value": "name2.surname@domain.cc"
  }, {
    "entity": "test",
    "position": 47,
    "priority": 0,
    "string": "name.surname2@domain.cc",
    "value": "name.surname2@domain.cc"
  }], "Consecutive entities are matched");
});

// StringEntityRecognizer

QUnit.test("StringEntityRecognizer", function(assert) {
  var reg = new Bravey.StringEntityRecognizer("test");

  reg.addMatch("logo", "apple");
  reg.addMatch("ny", "big apple");
  reg.addMatch("fruit", "pineapple");

  assert.deepEqual(reg.getEntities("This pineapple works for Apple in the Big Apple, did you know?"), [{
    "entity": "test",
    "position": 38,
    "priority": 0,
    "string": "big apple",
    "value": "ny"
  }, {
    "entity": "test",
    "position": 5,
    "priority": 0,
    "string": "pineapple",
    "value": "fruit"
  }, {
    "entity": "test",
    "position": 25,
    "priority": 0,
    "string": "apple",
    "value": "logo"
  }], "Multiple strings are matched");


  assert.deepEqual(reg.getEntities("apple"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "apple",
    "value": "logo"
  }], "Single entities are matched");

  assert.deepEqual(reg.getEntities("asd apple"), [{
    "entity": "test",
    "position": 4,
    "priority": 0,
    "string": "apple",
    "value": "logo"
  }], "Last entities are matched");

  assert.deepEqual(reg.getEntities("apple asd"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "apple",
    "value": "logo"
  }], "First entities are matched");

  assert.deepEqual(reg.getEntities("apple big apple apple pineapple"), [{
    "entity": "test",
    "position": 6,
    "priority": 0,
    "string": "big apple",
    "value": "ny"
  }, {
    "entity": "test",
    "position": 22,
    "priority": 0,
    "string": "pineapple",
    "value": "fruit"
  }, {
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "apple",
    "value": "logo"
  }, {
    "entity": "test",
    "position": 16,
    "priority": 0,
    "string": "apple",
    "value": "logo"
  }], "Consecutive entities are matched");

  var reg = new Bravey.StringEntityRecognizer("test", 10);

  reg.addMatch("logo", "apple");
  reg.addMatch("ny", "big apple");
  reg.addMatch("fruit", "pineapple");

  assert.deepEqual(reg.getEntities("apple asd"), [{
    "entity": "test",
    "position": 0,
    "priority": 10,
    "string": "apple",
    "value": "logo"
  }], "Priority is kept");

});

// RegexEntityRecognizer

QUnit.test("RegexEntityRecognizer", function(assert) {
  var reg = new Bravey.RegexEntityRecognizer("test");
  reg.addMatch(new RegExp("\\b([0-9]+)\\b", "g"), function(match) {
    return "the number is " + match[1]
  });
  reg.addMatch(new RegExp("\\btime is ([0-9]+)\\b", "g"), function(match) {
    return "the time is " + match[1]
  });

  assert.deepEqual(
    reg.getEntities("This is a number 12 but when the time is now, is when the time is 14 o'clock. this is spaced   time  is 12. This is dirty Timé is 45. Nowatime is 38"), [{
      "entity": "test",
      "position": 17,
      "priority": 0,
      "string": "12",
      "value": "the number is 12"
    }, {
      "entity": "test",
      "position": 58,
      "priority": 0,
      "string": "time is 14",
      "value": "the time is 14"
    }, {
      "entity": "test",
      "position": 93,
      "priority": 0,
      "string": "time is 12",
      "value": "the time is 12"
    }, {
      "entity": "test",
      "position": 119,
      "priority": 0,
      "string": "time is 45",
      "value": "the time is 45"
    }, {
      "entity": "test",
      "position": 143,
      "priority": 0,
      "string": "38",
      "value": "the number is 38"
    }], "Stacked regex are matched as cleaned text. Longest match first");

  assert.deepEqual(reg.getEntities("12"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "12",
    "value": "the number is 12"
  }], "Single entities are matched");

  assert.deepEqual(reg.getEntities("asd 12"), [{
    "entity": "test",
    "position": 4,
    "priority": 0,
    "string": "12",
    "value": "the number is 12"
  }], "Last entities are matched");

  assert.deepEqual(reg.getEntities("12 asd"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "12",
    "value": "the number is 12"
  }], "First entities are matched");

  assert.deepEqual(reg.getEntities("21 28 35"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "21",
    "value": "the number is 21"
  }, {
    "entity": "test",
    "position": 3,
    "priority": 0,
    "string": "28",
    "value": "the number is 28"
  }, {
    "entity": "test",
    "position": 6,
    "priority": 0,
    "string": "35",
    "value": "the number is 35"
  }], "Consecutive entities are matched");

});

// Filter

QUnit.test("Filter.BasicFilter", function(assert) {

  var filter = Bravey.Filter.BasicFilter;

  assert.deepEqual(filter(["I", "am", "the", "king", "of", "the", "hill", "tomorrow", "will", "be", "mine"]), [
    "king",
    "hill",
    "tomorrow",
    "will",
    "mine"
  ], "Short words are removed");


  assert.deepEqual(filter(["one", "two", "is"]), [
    "one",
    "two",
    "is"
  ], "Empty list returns the original list");

  assert.deepEqual(filter(["I", "am", "the", "king", "of", "the", "hill"]), [
    "I",
    "am",
    "the",
    "king",
    "of",
    "the",
    "hill"
  ], "Short filtered lists are kept");


  assert.deepEqual(filter(["{greet}", "this", "{year}", "we", "will", "go", "to", "{location}", "tomorrow", "will", "be", "mine"]), [
    "this",
    "will",
    "tomorrow",
    "will",
    "mine"
  ], "Entities are removed");

  assert.deepEqual(filter(["{ignore}", "one", "two", "is", "{me}"]), [
    "{ignore}",
    "one",
    "two",
    "is",
    "{me}"
  ], "Empty list returns the original list (with entities");

});

// English

QUnit.test("EN.Stemmer", function(assert) {

  assert.deepEqual(Bravey.Language.EN.Stemmer("dog"), "dog", "Singulars are correctly stemmed");
  assert.deepEqual(Bravey.Language.EN.Stemmer("dogs"), "dog", "Plurals is correctly stemmed");

  assert.deepEqual(Bravey.Language.EN.Stemmer("takes"), "take", "Passives are correctly stemmed");

});

QUnit.test("EN.TimeEntityRecognizer", function(assert) {

  var reg = new Bravey.Language.EN.TimeEntityRecognizer("test");

  assert.deepEqual(reg.getEntities("quarter past 9"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "quarter past 9",
    "value": "09:15:00"
  }], "Single entities are matched");

  assert.deepEqual(reg.getEntities("asf quarter past 9"), [{
    "entity": "test",
    "position": 4,
    "priority": 0,
    "string": "quarter past 9",
    "value": "09:15:00"
  }], "Last entities are matched");

  assert.deepEqual(reg.getEntities("quarter past 9 asd"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "quarter past 9",
    "value": "09:15:00"
  }], "First entities are matched");

  assert.deepEqual(reg.getEntities("We'll see at 12 and 5 minutes, the 8:20 or at 3 o'clock. We can always meet at 8, half past 8 or a quarter past 9."), [{
    "entity": "test",
    "position": 10,
    "priority": 0,
    "string": "at 12 and 5 minutes",
    "value": "12:05:00"
  }, {
    "entity": "test",
    "position": 35,
    "priority": 0,
    "string": "8:20",
    "value": "08:20:00"
  }, {
    "entity": "test",
    "position": 43,
    "priority": 0,
    "string": "at 3 o'clock",
    "value": "03:00:00"
  }, {
    "entity": "test",
    "position": 76,
    "priority": 0,
    "string": "at 8",
    "value": "08:00:00"
  }, {
    "entity": "test",
    "position": 82,
    "priority": 0,
    "string": "half past 8",
    "value": "08:30:00"
  }, {
    "entity": "test",
    "position": 99,
    "priority": 0,
    "string": "quarter past 9",
    "value": "09:15:00"
  }], "Multiple tiles are matched");


  assert.deepEqual(reg.getEntities("3, at 3, at 3pm, quarter past 6pm, 8 and 20 minutes in the afternoon, 3 o'clock, 12:20, half past 10pm"), [{
      "entity": "test",
      "position": 3,
      "priority": 0,
      "string": "at 3",
      "value": "03:00:00"
    }, {
      "entity": "test",
      "position": 9,
      "priority": 0,
      "string": "at 3pm",
      "value": "15:00:00"
    }, {
      "entity": "test",
      "position": 17,
      "priority": 0,
      "string": "quarter past 6pm",
      "value": "18:15:00"
    }, {
      "entity": "test",
      "position": 35,
      "priority": 0,
      "string": "8 and 20 minutes in the afternoon",
      "value": "20:20:00"
    }, {
      "entity": "test",
      "position": 70,
      "priority": 0,
      "string": "3 o'clock",
      "value": "03:00:00"
    }, {
      "entity": "test",
      "position": 81,
      "priority": 0,
      "string": "12:20",
      "value": "12:20:00"
    }, {
      "entity": "test",
      "position": 88,
      "priority": 0,
      "string": "half past 10pm",
      "value": "22:30:00"
    }],
    "Multiple tiles are matched");
});


QUnit.test("EN.TimePeriodEntityRecognizer", function(assert) {

  var date = new Date();
  var now = (date.getHours() * Bravey.Date.HOUR) + (date.getMinutes() * Bravey.Date.MINUTE);

  var reg = new Bravey.Language.EN.TimePeriodEntityRecognizer("test");

  assert.deepEqual(reg.getEntities("in 20 minutes"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "in 20 minutes",
    "value": {
      "end": TestTools.formatTime(now + (20 * TestTools.MINUTE)),
      "start": TestTools.formatTime(now)
    }
  }], "Single entities are matched");

  assert.deepEqual(reg.getEntities("asf in 20 minutes"), [{
    "entity": "test",
    "position": 4,
    "priority": 0,
    "string": "in 20 minutes",
    "value": {
      "end": TestTools.formatTime(now + (20 * TestTools.MINUTE)),
      "start": TestTools.formatTime(now)
    }
  }], "Last entities are matched");

  assert.deepEqual(reg.getEntities("in 20 minutes asd"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "in 20 minutes",
    "value": {
      "end": TestTools.formatTime(now + (20 * TestTools.MINUTE)),
      "start": TestTools.formatTime(now)
    }
  }], "First entities are matched");

  assert.deepEqual(reg.getEntities("We'll see together in the morning or this afternoon. I'll pass there during the morning or in the evening. We'll go in 20 minutes. In 2 hours will happen."), [{
    "entity": "test",
    "position": 19,
    "priority": 0,
    "string": "in the morning",
    "value": {
      "end": "12:00:00",
      "start": "08:00:00"
    }
  }, {
    "entity": "test",
    "position": 37,
    "priority": 0,
    "string": "this afternoon",
    "value": {
      "end": "23:59:00",
      "start": "15:00:00"
    }
  }, {
    "entity": "test",
    "position": 80,
    "priority": 0,
    "string": "morning",
    "value": {
      "end": "12:00:00",
      "start": "08:00:00"
    }
  }, {
    "entity": "test",
    "position": 91,
    "priority": 0,
    "string": "in the evening",
    "value": {
      "end": "23:59:00",
      "start": "12:00:00"
    }
  }, {
    "entity": "test",
    "position": 116,
    "priority": 0,
    "string": "in 20 minutes",
    "value": {
      "end": TestTools.formatTime(now + (20 * TestTools.MINUTE)),
      "start": TestTools.formatTime(now)
    }
  }, {
    "entity": "test",
    "position": 131,
    "priority": 0,
    "string": "in 2 hours",
    "value": {
      "end": TestTools.formatTime(now + (2 * TestTools.HOUR)),
      "start": TestTools.formatTime(now)
    }
  }], "Multiple time ranges are matched");
});

QUnit.test("EN.DateEntityRecognizer", function(assert) {

  var reg = new Bravey.Language.EN.DateEntityRecognizer("test");

  assert.deepEqual(reg.getEntities("12 november 2016"), [{
    "entity": "test",
    "position": 0,
    "priority": 10,
    "string": "12 november 2016",
    "value": "2016-11-12"
  }], "Single entities are matched");

  assert.deepEqual(reg.getEntities("asf 12 november 2016"), [{
    "entity": "test",
    "position": 4,
    "priority": 10,
    "string": "12 november 2016",
    "value": "2016-11-12"
  }], "Last entities are matched");

  assert.deepEqual(reg.getEntities("12 november 2016 asd"), [{
    "entity": "test",
    "position": 0,
    "priority": 10,
    "string": "12 november 2016",
    "value": "2016-11-12"
  }], "First entities are matched");

  assert.deepEqual(reg.getEntities("We're going to end this tomorrow or during today. We should finish for yesterday, you know. 1st of april we must prepare a joke! 12 november 2016 is a date, you know?"), [{
      "entity": "test",
      "position": 24,
      "priority": 0,
      "string": "tomorrow",
      "value": TestTools.formatDate((new Date()).getTime() + TestTools.DAY)
    }, {
      "entity": "test",
      "position": 43,
      "priority": 0,
      "string": "today",
      "value": TestTools.formatDate((new Date()).getTime())
    }, {
      "entity": "test",
      "position": 71,
      "priority": 0,
      "string": "yesterday",
      "value": TestTools.formatDate((new Date()).getTime() - TestTools.DAY),
    }, {
      "entity": "test",
      "position": 92,
      "priority": 10,
      "string": "1st of april",
      "value": TestTools.getYear() + "-04-01"
    }, {
      "entity": "test",
      "position": 129,
      "priority": 10,
      "string": "12 november 2016",
      "value": "2016-11-12"
    }],
    "Multiple dates are matched"
  );

  assert.deepEqual(reg.getEntities("last February, last Feb, last January, last March 8th, last February 1ST, last February 15! 06/01/2014, 12/01/2014, 06/01/15, June 1, 2014, December 1, 2014"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "last february",
    "value": TestTools.getLastDay(2, 1)
  }, {
    "entity": "test",
    "position": 15,
    "priority": 0,
    "string": "last feb",
    "value": TestTools.getLastDay(2, 1)
  }, {
    "entity": "test",
    "position": 25,
    "priority": 0,
    "string": "last january",
    "value": TestTools.getLastDay(1, 1)
  }, {
    "entity": "test",
    "position": 39,
    "priority": 0,
    "string": "last march 8th",
    "value": TestTools.getLastDay(3, 8)
  }, {
    "entity": "test",
    "position": 55,
    "priority": 0,
    "string": "last february 1st",
    "value": TestTools.getLastDay(2, 1)
  }, {
    "entity": "test",
    "position": 74,
    "priority": 0,
    "string": "last february 15",
    "value": TestTools.getLastDay(2, 15)
  }, {
    "entity": "test",
    "position": 92,
    "priority": 10,
    "string": "06/01/2014",
    "value": "2014-01-06"
  }, {
    "entity": "test",
    "position": 104,
    "priority": 10,
    "string": "12/01/2014",
    "value": "2014-01-12"
  }, {
    "entity": "test",
    "position": 116,
    "priority": 10,
    "string": "06/01/15",
    "value": "2015-01-06"
  }, {
    "entity": "test",
    "position": 126,
    "priority": 0,
    "string": "june 1, 2014",
    "value": "2014-06-01"
  }, {
    "entity": "test",
    "position": 140,
    "priority": 0,
    "string": "december 1, 2014",
    "value": "2014-12-01"
  }], "Complex multiple date are matched");

});


QUnit.test("EN.NumberEntityRecognizer", function(assert) {
  var reg = new Bravey.Language.EN.NumberEntityRecognizer("test");

  assert.deepEqual(reg.getEntities("ten"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "ten",
    "value": 10
  }], "Single numbers are matched");

  assert.deepEqual(reg.getEntities("two hundred fifteen"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "two hundred fifteen",
    "value": 215
  }], "two hundred fifteen -> 215");


  assert.deepEqual(reg.getEntities("two hundred, fifteen"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "two hundred",
    "value": 200
  }, {
    "entity": "test",
    "position": 13,
    "priority": 0,
    "string": "fifteen",
    "value": 15
  }], "two hundred, fifteen -> 200, 15");

  assert.deepEqual(reg.getEntities("215"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "215",
    "value": 215
  }], "215 -> 215");

  assert.deepEqual(reg.getEntities("200 15"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "200",
    "value": 200
  }, {
    "entity": "test",
    "position": 4,
    "priority": 0,
    "string": "15",
    "value": 15
  }], "200 15 -> 200, 15");

  assert.deepEqual(reg.getEntities("the last chievo game 2016 2017"), [{
    "entity": "test",
    "position": 21,
    "priority": 0,
    "string": "2016",
    "value": 2016
  }, {
    "entity": "test",
    "position": 26,
    "priority": 0,
    "string": "2017",
    "value": 2017
  }], "Numbers at end");



  assert.deepEqual(reg.getEntities("there are 12 apples, thirteen pears and one million eight hundred twenty thousand six hundred fifteen peppers"), [{
    "entity": "test",
    "position": 10,
    "priority": 0,
    "string": "12",
    "value": 12
  }, {
    "entity": "test",
    "position": 21,
    "priority": 0,
    "string": "thirteen",
    "value": 13
  }, {
    "entity": "test",
    "position": 40,
    "priority": 0,
    "string": "one million eight hundred twenty thousand six hundred fifteen",
    "value": 1820615
  }], "Multiple numbers are matched (english numbers are still not matched.");
});

// Italian

QUnit.test("IT.Stemmer", function(assert) {

  assert.deepEqual(Bravey.Language.IT.Stemmer("cani"), "can", "Singulars are correctly stemmed");
  assert.deepEqual(Bravey.Language.IT.Stemmer("cane"), "can", "Pluralrs are correctly stemmed");
  assert.deepEqual(Bravey.Language.IT.Stemmer("canini"), "canin", "Variants are correctly stemmed");
  assert.deepEqual(Bravey.Language.IT.Stemmer("canoni"), "canon", "Variants are correctly stemmed");

  assert.deepEqual(Bravey.Language.IT.Stemmer("prendono"), "prend", "Verbs are correctly stemmed");
  assert.deepEqual(Bravey.Language.IT.Stemmer("prenderono"), "prend", "Verbs are correctly stemmed");
  assert.deepEqual(Bravey.Language.IT.Stemmer("prenderanno"), "prend", "Verbs are correctly stemmed");

});


QUnit.test("Nlp.Fuzzy + Mixed Regex Recognizers", function(assert) {

  var nlp = new Bravey.Nlp.Fuzzy("test");

  var numberRegexp = new RegExp("\\b([0-9]+)\\b", "g");
  var timeRegexp = new RegExp("\\btime is ([0-9]+)\\b", "g");

  var dateEntity = new Bravey.Language.EN.DateEntityRecognizer("dateEntity");
  nlp.addEntity(dateEntity);

  TestTools.nlpAddDocument(assert, nlp, "We will meet at 12 january 2017", "mixmatch", {
    fromFullSentence: true,
    expandIntent: true
  }, "we will meet at {dateEntity}");
  TestTools.nlpAddDocument(assert, nlp, "See you 22 february      2016, ok?", "mixmatch", {
    fromFullSentence: true,
    expandIntent: true
  }, "see you {dateEntity}, ok?");

});

QUnit.test("IT.TimeEntityRecognizer", function(assert) {

  var reg = new Bravey.Language.IT.TimeEntityRecognizer("test");

  assert.deepEqual(reg.getEntities("alle 3"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "alle 3",
    "value": "03:00:00"
  }], "Single entities are matched");

  assert.deepEqual(reg.getEntities("asf alle 3"), [{
    "entity": "test",
    "position": 4,
    "priority": 0,
    "string": "alle 3",
    "value": "03:00:00"
  }], "Last entities are matched");

  assert.deepEqual(reg.getEntities("alle 3 asd"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "alle 3",
    "value": "03:00:00"
  }], "First entities are matched");

  assert.deepEqual(reg.getEntities("Ci vediamo per le 12 e 5, le 8:20 oppure alle 3. Nel caso non ci sia possiamo fare alle 8, le 8 e mezza o le 9 e un quarto."), [{
      "entity": "test",
      "position": 11,
      "priority": 0,
      "string": "per le 12 e 5",
      "value": "12:05:00"
    }, {
      "entity": "test",
      "position": 26,
      "priority": 0,
      "string": "le 8:20",
      "value": "08:20:00"
    }, {
      "entity": "test",
      "position": 41,
      "priority": 0,
      "string": "alle 3",
      "value": "03:00:00"
    }, {
      "entity": "test",
      "position": 83,
      "priority": 0,
      "string": "alle 8",
      "value": "08:00:00"
    }, {
      "entity": "test",
      "position": 91,
      "priority": 0,
      "string": "le 8 e mezza",
      "value": "08:30:00"
    }, {
      "entity": "test",
      "position": 106,
      "priority": 0,
      "string": "le 9 e un quarto",
      "value": "09:15:00"
    }],
    "Multiple times are matched"
  );


  assert.deepEqual(
    reg.getEntities("la 1, le ore 3, le 3 meno un quarto, 3 e un quarto, 8:30, 8:30 di sera, 3, le 3, le 12 e 5 minuti, alle 3 e 20 di sera, le 8 e mezza, le 9 e un quarto"), [{
      "entity": "test",
      "position": 0,
      "priority": 0,
      "string": "la 1",
      "value": "01:00:00"
    }, {
      "entity": "test",
      "position": 6,
      "priority": 0,
      "string": "le ore 3",
      "value": "03:00:00"
    }, {
      "entity": "test",
      "position": 16,
      "priority": 0,
      "string": "le 3 meno un quarto",
      "value": "02:15:00"
    }, {
      "entity": "test",
      "position": 37,
      "priority": 0,
      "string": "3 e un quarto",
      "value": "03:15:00"
    }, {
      "entity": "test",
      "position": 52,
      "priority": 0,
      "string": "8:30",
      "value": "08:30:00"
    }, {
      "entity": "test",
      "position": 58,
      "priority": 0,
      "string": "8:30 di sera",
      "value": "20:30:00"
    }, {
      "entity": "test",
      "position": 75,
      "priority": 0,
      "string": "le 3",
      "value": "03:00:00"
    }, {
      "entity": "test",
      "position": 81,
      "priority": 0,
      "string": "le 12 e 5",
      "value": "12:05:00"
    }, {
      "entity": "test",
      "position": 99,
      "priority": 0,
      "string": "alle 3 e 20 di sera",
      "value": "15:20:00"
    }, {
      "entity": "test",
      "position": 120,
      "priority": 0,
      "string": "le 8 e mezza",
      "value": "08:30:00"
    }, {
      "entity": "test",
      "position": 134,
      "priority": 0,
      "string": "le 9 e un quarto",
      "value": "09:15:00"
    }], "Multiple times are matched");
});

QUnit.test("IT.TimePeriodEntityRecognizer", function(assert) {

  var date = new Date();
  var now = (date.getHours() * Bravey.Date.HOUR) + (date.getMinutes() * Bravey.Date.MINUTE);

  var reg = new Bravey.Language.IT.TimePeriodEntityRecognizer("test");

  assert.deepEqual(reg.getEntities("in mattinata"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "in mattinata",
    "value": {
      "end": "12:00:00",
      "start": "08:00:00"
    }
  }], "Single entities are matched");

  assert.deepEqual(reg.getEntities("asf in mattinata"), [{
    "entity": "test",
    "position": 4,
    "priority": 0,
    "string": "in mattinata",
    "value": {
      "end": "12:00:00",
      "start": "08:00:00"
    }
  }], "Last entities are matched");

  assert.deepEqual(reg.getEntities("in mattinata asd"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "in mattinata",
    "value": {
      "end": "12:00:00",
      "start": "08:00:00"
    }
  }], "First entities are matched");

  assert.deepEqual(reg.getEntities("ci vediamo di mattina o nel pomeriggio. Al massimo passo io in mattinata o stasera. Tra 20 minuti partiamo. Tra 2 ore e' il momento."), [{
      "entity": "test",
      "position": 11,
      "priority": 0,
      "string": "di mattina",
      "value": {
        "end": "12:00:00",
        "start": "08:00:00"
      }
    }, {
      "entity": "test",
      "position": 24,
      "priority": 0,
      "string": "nel pomeriggio",
      "value": {
        "end": "23:59:00",
        "start": "15:00:00"
      }
    }, {
      "entity": "test",
      "position": 60,
      "priority": 0,
      "string": "in mattinata",
      "value": {
        "end": "12:00:00",
        "start": "08:00:00"
      }
    }, {
      "entity": "test",
      "position": 75,
      "priority": 0,
      "string": "stasera",
      "value": {
        "end": "23:59:00",
        "start": "12:00:00"
      }
    }, {
      "entity": "test",
      "position": 84,
      "priority": 0,
      "string": "tra 20 minuti",
      "value": {
        "end": TestTools.formatTime(now + (20 * TestTools.MINUTE)),
        "start": TestTools.formatTime(now)
      }
    }, {
      "entity": "test",
      "position": 108,
      "priority": 0,
      "string": "tra 2 ore",
      "value": {
        "end": TestTools.formatTime(now + (2 * TestTools.HOUR)),
        "start": TestTools.formatTime(now)
      }
    }],
    "Multiple time ranges are matched"
  );

  assert.deepEqual(reg.getEntities("tra 10 secondi, tra 10, tra 10 minuti, 10 minuti, in 5 ore, stasera, nel pomeriggio, di mattina"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "tra 10 secondi",
    "value": {
      "end": TestTools.formatTime(now + (10 * TestTools.SECOND)),
      "start": TestTools.formatTime(now)
    }
  }, {
    "entity": "test",
    "position": 24,
    "priority": 0,
    "string": "tra 10 minuti",
    "value": {
      "end": TestTools.formatTime(now + (10 * TestTools.MINUTE)),
      "start": TestTools.formatTime(now)
    }
  }, {
    "entity": "test",
    "position": 50,
    "priority": 0,
    "string": "in 5 ore",
    "value": {
      "end": TestTools.formatTime(now + (5 * TestTools.HOUR)),
      "start": TestTools.formatTime(now)
    }
  }, {
    "entity": "test",
    "position": 60,
    "priority": 0,
    "string": "stasera",
    "value": {
      "end": "23:59:00",
      "start": "12:00:00"
    }
  }, {
    "entity": "test",
    "position": 69,
    "priority": 0,
    "string": "nel pomeriggio",
    "value": {
      "end": "23:59:00",
      "start": "15:00:00"
    }
  }, {
    "entity": "test",
    "position": 85,
    "priority": 0,
    "string": "di mattina",
    "value": {
      "end": "12:00:00",
      "start": "08:00:00"
    }
  }], "Multiple time ranges are matched");
});

QUnit.test("IT.DateEntityRecognizer", function(assert) {

  var reg = new Bravey.Language.IT.DateEntityRecognizer("test");

  assert.deepEqual(reg.getEntities("25/04 dell'80"), [{
    "entity": "test",
    "position": 0,
    "priority": 10,
    "string": "25/04 dell'80",
    "value": "1980-04-25"
  }], "Single entities are matched");

  assert.deepEqual(reg.getEntities("asf 25/04 dell'80"), [{
    "entity": "test",
    "position": 4,
    "priority": 10,
    "string": "25/04 dell'80",
    "value": "1980-04-25"
  }], "Last entities are matched");

  assert.deepEqual(reg.getEntities("25/04 dell'80 asd"), [{
    "entity": "test",
    "position": 0,
    "priority": 10,
    "string": "25/04 dell'80",
    "value": "1980-04-25"
  }], "First entities are matched");

  assert.deepEqual(reg.getEntities("Rimaniamo che c'e' da fare quello per domani o entro la giornata di oggi. Andrebbe finito per ieri, lo sai. Il 3 di giugno abbiamo una consegna. Sono del 25/04 dell'80."), [{
    "entity": "test",
    "position": 34,
    "priority": 0,
    "string": "per domani",
    "value": TestTools.formatDate((new Date()).getTime() + TestTools.DAY)
  }, {
    "entity": "test",
    "position": 53,
    "priority": 0,
    "string": "la giornata di oggi",
    "value": TestTools.formatDate((new Date()).getTime())
  }, {
    "entity": "test",
    "position": 90,
    "priority": 0,
    "string": "per ieri",
    "value": TestTools.formatDate((new Date()).getTime() - TestTools.DAY)
  }, {
    "entity": "test",
    "position": 108,
    "priority": 10,
    "string": "il 3 di giugno",
    "value": TestTools.getYear() + "-06-03"
  }, {
    "entity": "test",
    "position": 154,
    "priority": 10,
    "string": "25/04 dell'80",
    "value": "1980-04-25"
  }], "Multiple dates are matched");

  assert.deepEqual(reg.getEntities("lo scorso febbraio, lo scorso Feb, lo scorso gen, lo scorso 8 Marzo, lo scorso 1 febbraio, lo scorso 15 febbraio! 06/01/2014, 12/01/2014, 06/01/15, Giugno 1, 2014, Dicembre 1, 2014"), [{
    "entity": "test",
    "position": 0,
    "priority": 5,
    "string": "lo scorso febbraio",
    "value": TestTools.getLastDay(2, 1)
  }, {
    "entity": "test",
    "position": 20,
    "priority": 5,
    "string": "lo scorso feb",
    "value": TestTools.getLastDay(2, 1)
  }, {
    "entity": "test",
    "position": 35,
    "priority": 5,
    "string": "lo scorso gen",
    "value": TestTools.getLastDay(1, 1)
  }, {
    "entity": "test",
    "position": 50,
    "priority": 10,
    "string": "lo scorso 8 marzo",
    "value": TestTools.getLastDay(3, 8)
  }, {
    "entity": "test",
    "position": 69,
    "priority": 10,
    "string": "lo scorso 1 febbraio",
    "value": TestTools.getLastDay(2, 1)
  }, {
    "entity": "test",
    "position": 91,
    "priority": 10,
    "string": "lo scorso 15 febbraio",
    "value": TestTools.getLastDay(2, 15)
  }, {
    "entity": "test",
    "position": 114,
    "priority": 10,
    "string": "06/01/2014",
    "value": "2014-01-06"
  }, {
    "entity": "test",
    "position": 126,
    "priority": 10,
    "string": "12/01/2014",
    "value": "2014-01-12"
  }, {
    "entity": "test",
    "position": 138,
    "priority": 10,
    "string": "06/01/15",
    "value": "2015-01-06"
  }, {
    "entity": "test",
    "position": 148,
    "priority": 5,
    "string": "giugno 1, 2014",
    "value": "2014-06-01"
  }, {
    "entity": "test",
    "position": 164,
    "priority": 5,
    "string": "dicembre 1, 2014",
    "value": "2014-12-01"
  }], "Multiple dates are matched");

  assert.deepEqual(reg.getEntities("2, il 2, il 3 giugno, 3 giugno, 3/06, 3/06/2000, 3/12/80, 8 di marzo, di marzo, nel 2/12/2001, 3 dic! 12 gen-2015, 3-2-1920"), [{
    "entity": "test",
    "position": 3,
    "priority": 10,
    "string": "il 2",
    "value": TestTools.getLastDay(TestTools.getMonth(), 2)
  }, {
    "entity": "test",
    "position": 9,
    "priority": 10,
    "string": "il 3 giugno",
    "value": TestTools.getYear() + "-06-03"
  }, {
    "entity": "test",
    "position": 22,
    "priority": 10,
    "string": "3 giugno",
    "value": TestTools.getYear() + "-06-03"
  }, {
    "entity": "test",
    "position": 32,
    "priority": 10,
    "string": "3/06",
    "value": TestTools.getYear() + "-06-03"
  }, {
    "entity": "test",
    "position": 38,
    "priority": 10,
    "string": "3/06/2000",
    "value": "2000-06-03"
  }, {
    "entity": "test",
    "position": 49,
    "priority": 10,
    "string": "3/12/80",
    "value": "1980-12-03"
  }, {
    "entity": "test",
    "position": 58,
    "priority": 10,
    "string": "8 di marzo",
    "value": TestTools.getYear() + "-03-08"
  }, {
    "entity": "test",
    "position": 70,
    "priority": 05,
    "string": "di marzo",
    "value": TestTools.getYear() + "-03-01"
  }, {
    "entity": "test",
    "position": 80,
    "priority": 10,
    "string": "nel 2/12/2001",
    "value": "2001-12-02"
  }, {
    "entity": "test",
    "position": 95,
    "priority": 10,
    "string": "3 dic",
    "value": TestTools.getYear() + "-12-03"
  }, {
    "entity": "test",
    "position": 102,
    "priority": 10,
    "string": "12 gen-2015",
    "value": "2015-01-12"
  }, {
    "entity": "test",
    "position": 115,
    "priority": 10,
    "string": "3-2-1920",
    "value": "1920-02-03"
  }], "Multiple dates are matched");

});

QUnit.test("IT.NumberEntityRecognizer", function(assert) {
  var reg = new Bravey.Language.IT.NumberEntityRecognizer("test");

  assert.deepEqual(reg.getEntities("dieci"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "dieci",
    "value": 10
  }], "Single numbers are matched");

  assert.deepEqual(reg.getEntities("ci sono 12 mele, tredici pere e unmilioneottocentoventimilaseicentoquindici peperoni"), [{
    "entity": "test",
    "position": 8,
    "priority": 0,
    "string": "12",
    "value": 12
  }, {
    "entity": "test",
    "position": 17,
    "priority": 0,
    "string": "tredici",
    "value": 13
  }, {
    "entity": "test",
    "position": 32,
    "priority": 0,
    "string": "unmilioneottocentoventimilaseicentoquindici",
    "value": 1820615
  }], "Multiple numbers are matched");

});

// Portuguese

QUnit.test("PT.Stemmer", function(assert) {

  assert.deepEqual(Bravey.Language.PT.Stemmer("químico"), "químic", "Singulars are correctly stemmed");
  assert.deepEqual(Bravey.Language.PT.Stemmer("químicos"), "químic", "Pluralrs are correctly stemmed");
  assert.deepEqual(Bravey.Language.PT.Stemmer("bobagem"), "bobag", "Variants are correctly stemmed");
  assert.deepEqual(Bravey.Language.PT.Stemmer("bobagens"), "bobagens", "Variants are correctly stemmed");

  assert.deepEqual(Bravey.Language.PT.Stemmer("namorar"), "namor", "Verbs are correctly stemmed");
  assert.deepEqual(Bravey.Language.PT.Stemmer("cuidar"), "cuid", "Verbs are correctly stemmed");
  assert.deepEqual(Bravey.Language.PT.Stemmer("respeitar"), "respeit", "Verbs are correctly stemmed");

});


QUnit.test("PT: Nlp.Fuzzy + Mixed Regex Recognizers", function(assert) {

  var nlp = new Bravey.Nlp.Fuzzy("test");

  var numberRegexp = new RegExp("\\b([0-9]+)\\b", "g");
  var timeRegexp = new RegExp("\\ba hora é ([0-9]+)\\b", "g");

  var dateEntity = new Bravey.Language.PT.DateEntityRecognizer("dateEntity");
  nlp.addEntity(dateEntity);

  TestTools.nlpAddDocument(assert, nlp, "Nos encontraremos em 12 de janeiro de 2017", "mixmatch", {
    fromFullSentence: true,
    expandIntent: true
  }, "nos encontraremos em {dateEntity}");

  TestTools.nlpAddDocument(assert, nlp, "Te vejo em 22 de fevereiro de 2016, ok?", "mixmatch", {
    fromFullSentence: true,
    expandIntent: true
  }, "te vejo em {dateEntity}, ok?");

  TestTools.nlpAddDocument(assert, nlp, "Nos encontraremos em 1° de dezembro de 2018", "mixmatch", {
    fromFullSentence: true,
    expandIntent: true
  }, "nos encontraremos em {dateEntity}");

});

QUnit.test("PT.TimeEntityRecognizer", function(assert) {

  var reg = new Bravey.Language.PT.TimeEntityRecognizer("test");

  assert.deepEqual(reg.getEntities("às 3:00"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "as 3:00",
    "value": "03:00:00"
  }], "Single hour");

  assert.deepEqual(reg.getEntities("às 3:30"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "as 3:30",
    "value": "03:30:00"
  }], "Hour with minutes");

  assert.deepEqual(reg.getEntities("às 3:30:45"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "as 3:30:45",
    "value": "03:30:45"
  }], "Hour with minutes and seconds");

  assert.deepEqual(reg.getEntities("às 3 horas"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "as 3 horas",
    "value": "03:00:00"
  }], "Single entities are matched");

  assert.deepEqual(reg.getEntities("asdfg às 3 horas"), [{
    "entity": "test",
    "position": 6,
    "priority": 0,
    "string": "as 3 horas",
    "value": "03:00:00"
  }], "Last entities are matched");

  assert.deepEqual(reg.getEntities("às 3 horas asdfg"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "as 3 horas",
    "value": "03:00:00"
  }], "First entities are matched");

  assert.deepEqual(reg.getEntities("às 3 horas e 15 minutos"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "as 3 horas e 15 minutos",
    "value": "03:15:00"
  }], "Hours and minutes are matched");

  assert.deepEqual(reg.getEntities("às 3 horas, 15 minutos e 45 segundos"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "as 3 horas, 15 minutos e 45 segundos",
    "value": "03:15:45"
  }], "Hours, minutes, and seconds are matched");

  assert.deepEqual(reg.getEntities("às 3 h 15 m 45 s"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "as 3 h 15 m 45 s",
    "value": "03:15:45"
  }], "Short format for hours, minutes, and seconds are matched");

  assert.deepEqual(reg.getEntities("às 3 e meia"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "as 3 e meia",
    "value": "03:30:00"
  }], "Maches hour and a half");

  assert.deepEqual(reg.getEntities("às 3 e quinze"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "as 3 e quinze",
    "value": "03:15:00"
  }], "Maches hour and a quarter");

  assert.deepEqual(reg.getEntities("às 3 e quarenta e cinco"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "as 3 e quarenta e cinco",
    "value": "03:45:00"
  }], "Maches hour and three quarters");

  assert.deepEqual(reg.getEntities("às 3 e quarenta e cinco da tarde"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "as 3 e quarenta e cinco da tarde",
    "value": "15:45:00"
  }], "Maches pm -> afternoon");

  assert.deepEqual(reg.getEntities("às 9 e meia da noite"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "as 9 e meia da noite",
    "value": "21:30:00"
  }], "Maches pm -> night");

  assert.deepEqual(reg.getEntities("às 9 e meia da manhã"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "as 9 e meia da manha",
    "value": "09:30:00"
  }], "Maches am");

});

QUnit.test("PT.TimePeriodEntityRecognizer", function(assert) {

  var reg = new Bravey.Language.PT.TimePeriodEntityRecognizer("test");

  assert.deepEqual(reg.getEntities("de manhã"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "de manha",
    "value": {
      "start": "06:00:00",
      "end": "11:59:59",
    }
  }], "Single entities are matched");

  assert.deepEqual(reg.getEntities("asdfg de manhã"), [{
    "entity": "test",
    "position": 6,
    "priority": 0,
    "string": "de manha",
    "value": {
      "start": "06:00:00",
      "end": "11:59:59",
    }
  }], "Last entities are matched");

  assert.deepEqual(reg.getEntities("de manha asdfg"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "de manha",
    "value": {
      "start": "06:00:00",
      "end": "11:59:59",
    }
  }], "First entities are matched");

  var now = new Date();
  var end = new Date();
  end.setTime(end.getTime() + (10 * 1000));
  assert.deepEqual(reg.getEntities("em 10 segundos"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "em 10 segundos",
    "value": {
      "start": now.toLocaleTimeString('pt-BR'),
      "end": end.toLocaleTimeString('pt-BR')
    }
  }], "In seconds is matched");

  now = new Date();
  end = new Date();
  end.setTime(end.getTime() + (10 * 1000 * 60));
  assert.deepEqual(reg.getEntities("em 10 minutos"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "em 10 minutos",
    "value": {
      "start": now.toLocaleTimeString('pt-BR'),
      "end": end.toLocaleTimeString('pt-BR')
    }
  }], "In minutes is matched");

  now = new Date();
  end = new Date();
  end.setTime(end.getTime() + (10 * 1000 * 3600));
  assert.deepEqual(reg.getEntities("em 10 horas"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "em 10 horas",
    "value": {
      "start": now.toLocaleTimeString('pt-BR'),
      "end": end.toLocaleTimeString('pt-BR')
    }
  }], "In hours is matched");

  /*
  now = new Date();
  end1 = new Date();
  end1.setTime( end1.getTime() + ( 10 * 1000 * 60 * 60 ) );
  end2 = new Date();
  end2.setTime( end2.getTime() + ( 1 * 1000 ) );
  assert.deepEqual(reg.getEntities("A festa acaba em 10 horas ou daqui a 1 segundo, se a luz acabar."), [
	{
		"entity": "test",
		"position": 14,
		"priority": 0,
		"string": "em 10 horas",
		"value": {
		  "start": now.toLocaleTimeString( 'pt-BR' ),
		  "end": end1.toLocaleTimeString( 'pt-BR' )
		}
	},
	{
		"entity": "test",
		"position": 29,
		"priority": 0,
		"string": "daqui a 1 segundo",
		"value": {
		  "start": now.toLocaleTimeString( 'pt-BR' ),
		  "end": end2.toLocaleTimeString( 'pt-BR' )
		}
	},	
	], "Multiple time ranges");
  */

});

QUnit.test("PT.DateEntityRecognizer", function(assert) {

  var reg = new Bravey.Language.PT.DateEntityRecognizer("test");

  assert.deepEqual(reg.getEntities("25/04/1980"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "25/04/1980",
    "value": "1980-04-25"
  }], "Single entities are matched");

  assert.deepEqual(reg.getEntities("asdfg 25/04/1980"), [{
    "entity": "test",
    "position": 6,
    "priority": 0,
    "string": "25/04/1980",
    "value": "1980-04-25"
  }], "Last entities are matched");

  assert.deepEqual(reg.getEntities("25/04/1980 asdfg"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "25/04/1980",
    "value": "1980-04-25"
  }], "First entities are matched");

  assert.deepEqual(reg.getEntities("25/04 asdfg"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "25/04",
    "value": (new Date()).getFullYear() + "-04-25"
  }], "Assumes current year for partial dates");

  assert.deepEqual(reg.getEntities("1° de dezembro de 2018"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "1° de dezembro de 2018",
    "value": "2018-12-01"
  }], "Long date format is matched");

  assert.deepEqual(reg.getEntities("1° de dezembro"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "1° de dezembro",
    "value": "2017-12-01"
  }], "Long date without year is matched");

  assert.deepEqual(reg.getEntities("ocorreu 1° de dezembro antes do por do sol"), [{
    "entity": "test",
    "position": 8,
    "priority": 0,
    "string": "1° de dezembro",
    "value": "2017-12-01"
  }], "Long date without year is matched, even with some text around");

  assert.deepEqual(reg.getEntities("dezembro de 2018"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "dezembro de 2018",
    "value": "2018-12-01"
  }], "Long date without day is matched");

  assert.deepEqual(reg.getEntities("ocorreu em dezembro de 2018 a inauguração"), [{
    "entity": "test",
    "position": 11,
    "priority": 0,
    "string": "dezembro de 2018",
    "value": "2018-12-01"
  }], "Long date without day is matched, even with some text around");

  var now = new Date();
  var end = new Date();
  end.setTime(end.getTime() + (10 * 1000 * 3600 * 24));
  assert.deepEqual(reg.getEntities("em 10 dias"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "em 10 dias",
    "value": {
      "start": Bravey.Date.formatDate(now),
      "end": Bravey.Date.formatDate(end)
    }
  }], "In days is matched");

  now = new Date();
  end = new Date();
  end.setTime(end.getTime() + (10 * 1000 * 3600 * 24 * 7));
  assert.deepEqual(reg.getEntities("em 10 semanas"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "em 10 semanas",
    "value": {
      "start": Bravey.Date.formatDate(now),
      "end": Bravey.Date.formatDate(end)
    }
  }], "In weeks is matched");

});

QUnit.test("PT.NumberEntityRecognizer", function(assert) {
  var reg = new Bravey.Language.PT.NumberEntityRecognizer("test");

  assert.deepEqual(reg.getEntities("dez"), [{
    "entity": "test",
    "position": 0,
    "priority": 0,
    "string": "dez",
    "value": 10
  }], "Single numbers are matched");

  assert.deepEqual(reg.getEntities("tem 10 teclas"), [{
    "entity": "test",
    "position": 4,
    "priority": 0,
    "string": "10",
    "value": 10
  }], "A number is matched");

  assert.deepEqual(reg.getEntities("são quinze agora e sete mil e novecentos depois, dois mil trezentos e onze ou 1000 pra sempre"), [{
    "entity": "test",
    "position": 4,
    "priority": 0,
    "string": "quinze",
    "value": 15
  }, {
    "entity": "test",
    "position": 19,
    "priority": 0,
    "string": "sete mil e novecentos",
    "value": 7900
  }, {
    "entity": "test",
    "position": 49,
    "priority": 0,
    "string": "dois mil trezentos e onze",
    "value": 2311
  }, {
    "entity": "test",
    "position": 78,
    "priority": 0,
    "string": "1000",
    "value": 1000
  }], "Multiple numbers are matched");

});


// Document Classifier

QUnit.test("DocumentClassifier", function(assert) {
  var m, cl = new Bravey.DocumentClassifier();

  TestTools.nlpClassifyDocument(assert, cl, "stasera ci mangiamo una pizza?", "pizza");
  TestTools.nlpClassifyDocument(assert, cl, "accendi le luci della cucina", "light");

  m = cl.classifyDocument("pizza");
  assert.ok(m.scores.pizza > m.scores.light, "Single key words are classified correctly");
  assert.strictEqual(m.winner.label, "pizza", "Single key words are classified correctly")

  m = cl.classifyDocument("luci");
  assert.ok(m.scores.pizza < m.scores.light, "Single key words are classified correctly");
  assert.strictEqual(m.winner.label, "light", "Single key words are classified correctly");

  m = cl.classifyDocument("facciamoci una pizza, dai!");
  assert.ok(m.scores.pizza > m.scores.light, "Similiar sentences are classified correctly");
  assert.strictEqual(m.winner.label, "pizza", "Similiar sentences are classified correctly");

  m = cl.classifyDocument("per favore, le luci");
  assert.ok(m.scores.pizza < m.scores.light, "Similiar sentences are classified correctly");
  assert.strictEqual(m.winner.label, "light", "Similiar sentences are classified correctly");

  m = cl.classifyDocument("mangiamo una pizza sotto le luci");
  assert.ok(m.scores.pizza > m.scores.light, "Similiarity of ambiguous sentences is correct");
  assert.strictEqual(m.winner.label, "pizza", "Similiarity of ambiguous sentences is correct");

  m = cl.classifyDocument("mangiamo pizza e luci");
  assert.ok(m.scores.pizza > m.scores.light, "Similiarity of ambiguous sentences is correct");
  assert.strictEqual(m.winner.label, "pizza", "Similiarity of ambiguous sentences is correct");

  m = cl.classifyDocument("mangiamo luci");
  assert.ok(m.scores.pizza == m.scores.light, "Ambiguous sentences have same score");

  m = cl.classifyDocument("illumunazione, grazie");
  assert.ok(m.scores.pizza == 0.5, "Ambiguous sentences have same score");
  assert.ok(m.scores.pizza == m.scores.light, "Ambiguous sentences have same score");

  TestTools.nlpClassifyDocument(assert, cl, "illumunazione, grazie", "light");

  m = cl.classifyDocument("illumunazione, grazie");
  assert.ok(m.scores.pizza < m.scores.light, "New variants are matched correctly");
  assert.strictEqual(m.winner.label, "light", "New variants are matched correctly");

  cl = new Bravey.DocumentClassifier();
  assert.ok(cl.addDocument("illumunazione, grazie", "light"), "New document added");
  assert.ok(cl.addDocument("stasera ci mangiamo una pizza?", "pizza"), "New document added");

  m = cl.classifyDocument("illumunato");
  assert.ok(m.scores.pizza == 0.5, "Words without any match have 0.5 score");
  assert.ok(m.scores.pizza == m.scores.light, "Words without any match have 0.5 score");

  cl = new Bravey.DocumentClassifier({
    stemmer: Bravey.Language.IT.Stemmer
  });
  assert.ok(cl.addDocument("illumunazione, grazie", "light"), "Adding document to classifier with stemmer support");
  assert.ok(cl.addDocument("stasera ci mangiamo una pizza?", "pizza"), "Adding document to classifier with stemmer support");

  m = cl.classifyDocument("illumunato");
  assert.ok(m.scores.pizza < m.scores.light, "Classifier matches stemmed words");
  assert.strictEqual(m.winner.label, "light", "Classifier matches stemmed words");

  cl = new Bravey.DocumentClassifier({
    filter: Bravey.Filter.BasicFilter
  });
  assert.ok(cl.addDocument("vorrei dirti che il cane dorme", "sleep"), "Adding document to classifier with filter support");
  assert.ok(cl.addDocument("vorrei dirti che il cane sonnecchia", "sleep"), "Adding document to classifier with filter support");
  assert.ok(cl.addDocument("vorrei dirti che cane mangia", "eat"), "Adding document to classifier with filter support");
  m = cl.classifyDocument("noword");
  assert.ok(m.scores.sleep == m.scores.eat, "Unclassified word gives 0.5 score for both intents");
  m = cl.classifyDocument("cane");
  assert.ok(m.scores.sleep > m.scores.eat, "Found word in both intents gives best score to most common sentence");
  m = cl.classifyDocument("il");
  assert.ok(m.scores.sleep == m.scores.eat, "Filtered short is unclassified and acts like an unclassified word");

});

// NLP

QUnit.test("Nlp.Fuzzy", function(assert) {

  var nlp = new Bravey.Nlp.Fuzzy("test");

  var namesRecog = new Bravey.StringEntityRecognizer("username");
  assert.ok(namesRecog, "Creating username recognizer");
  assert.ok(namesRecog.addMatch("frank", "Frank"), "Filling frank intent");
  assert.ok(namesRecog.addMatch("frank", "Frankie"), "Filling frank intent");
  assert.ok(namesRecog.addMatch("frank", "Francesco"), "Filling frank intent");
  assert.ok(namesRecog.addMatch("mark", "Mark"), "Filling mark intent");
  assert.ok(namesRecog.addMatch("mark", "Markie"), "Filling mark intent");
  assert.ok(namesRecog.addMatch("mark", "Marc"), "Filling mark intent");
  assert.ok(namesRecog.addMatch("mark", "Marco"), "Filling mark intent");

  assert.ok(nlp.addEntity(new Bravey.NumberEntityRecognizer("phonenumber")), "Adding simple number recognizer");
  assert.ok(nlp.addEntity(namesRecog), "Adding names recognizer");

  assert.ok(nlp.addIntent("greet", [{
    entity: "username",
    id: "whoToGreet"
  }]), "Adding the greet intent");
  assert.ok(nlp.addIntent("call", [{
    entity: "phonenumber",
    id: "numberToCall"
  }]), "Adding the call intent");

  TestTools.nlpAddDocument(assert, nlp, "Can't find intent!", "fakeintent", 0, false);
  TestTools.nlpAddDocument(assert, nlp, "Hello {username}!", "greet", 0, "hello {username}!");
  TestTools.nlpAddDocument(assert, nlp, "Call {phonenumber}!", "call", 0, "call {phonenumber}!");

  TestTools.nlpTest(assert, nlp, "hello mark", "greet", {
    whoToGreet: "mark"
  });
  TestTools.nlpTest(assert, nlp, "mark hello", "greet", {
    whoToGreet: "mark"
  });

  TestTools.nlpTest(assert, nlp, "Hello mark!", "greet", {
    whoToGreet: "mark"
  });
  TestTools.nlpTest(assert, nlp, "Call the 33392!", "call", {
    numberToCall: 33392
  });
  TestTools.nlpTest(assert, nlp, "Mark, Call the police!", false);

  var someoneRecog = new Bravey.StringEntityRecognizer("someone");
  assert.ok(someoneRecog.addMatch("333-police", "police"), "Creating the someone recognizer");
  assert.ok(nlp.addEntity(someoneRecog), "Adding a recognizer to existing NLP");
  assert.ok(nlp.addIntent("callSomeone", [{
    entity: "username",
    id: "whoCalls"
  }, {
    entity: "someone",
    id: "someoneToCall"
  }]), "Adding intent to existing NLP");
  TestTools.nlpAddDocument(assert, nlp, "{username}, call {someone}!", "callSomeone", 0, "{username}, call {someone}!");

  TestTools.nlpTest(assert, nlp, "Mark, Call the police!", "callSomeone", {
    someoneToCall: "333-police"
  });

  TestTools.nlpAddDocument(assert, nlp, "{username}, call {someone}!", "callSomeone", 0, "{username}, call {someone}!", "callSomeone");
  TestTools.nlpAddDocument(assert, nlp, "{username} you have to ring {someone}!", "callSomeone", {
    fromTaggedSentence: true,
    expandIntent: true
  }, "{username} you have to ring {someone}!");
  TestTools.nlpAddDocument(assert, nlp, "Howdy {username}!", "greet", {
    fromTaggedSentence: true,
    expandIntent: true
  }, "Howdy {username}!");

  TestTools.nlpTest(assert, nlp, "Francesco, you have to call the police!", "callSomeone", {
    whoCalls: "frank",
    someoneToCall: "333-police"
  });


  TestTools.nlpAddDocument(assert, nlp, "{someone} please help!", "pleaseHelp", {
    fromTaggedSentence: true,
    expandIntent: true
  }, "{someone} please help!");
  TestTools.nlpTest(assert, nlp, "Police, help me please!", "pleaseHelp", {
    someone: "333-police"
  });

  TestTools.nlpAddDocument(assert, nlp, "Police, you have to rescue me!", "pleaseHelp", {
    fromFullSentence: true,
    expandIntent: true
  }, "{someone}, you have to rescue me!");
  TestTools.nlpTest(assert, nlp, "hey Police, you have to rescue me!", "pleaseHelp", {
    someone: "333-police"
  });

  var orgConfidence = nlp.getConfidence();
  TestTools.nlpTest(assert, nlp, "Frank likes a slice of bread", false);

  nlp.setConfidence(0.5);
  TestTools.nlpTest(assert, nlp, "Frank likes a slice of bread", "callSomeone", {
    whoCalls: "frank"
  });

  nlp.setConfidence(orgConfidence);

  TestTools.nlpTest(assert, nlp, "Frank likes a slice of bread", false);

  TestTools.nlpTest(assert, nlp, "Hello frank and mark!", false);
  TestTools.nlpAddDocument(assert, nlp, "Hello frank and mark!", "greet", {
    fromFullSentence: true,
    expandIntent: true
  }, "hello {username} and {username}!");
  TestTools.nlpTest(assert, nlp, "Hello frank and mark!", "greet", {
    whoToGreet: "frank",
    username1: "mark"
  });

  TestTools.nlpTest(assert, nlp, "Howdy frank and mark and the police!", "greet", {
    whoToGreet: "frank",
    username1: "mark"
  });
  TestTools.nlpAddDocument(assert, nlp, "Hello {username}, {username} and {someone}!", "greet", {
    fromTaggedSentence: true,
    expandIntent: true
  }, "Hello {username}, {username} and {someone}!");
  TestTools.nlpTest(assert, nlp, "Howdy frank and mark and the police!", "greet", {
    whoToGreet: "frank",
    username1: "mark",
    someone: "333-police"
  });

  TestTools.nlpAddDocument(assert, nlp, "Hello {username}, {username} and {someone} and {someone}!", "greet", {
    fromTaggedSentence: true,
    expandIntent: true,
    withNames: ["ignored", "ignored", "ignored", "realSomeone"]
  }, "Hello {username}, {username} and {someone} and {someone}!");
  TestTools.nlpTest(assert, nlp, "Howdy frank and mark and the police and the police!", "greet", {
    whoToGreet: "frank",
    username1: "mark",
    someone: "333-police",
    realSomeone: "333-police"
  });

  TestTools.nlpAddDocument(assert, nlp, "Frank you have to help me!", "pleaseHelp", {
    fromFullSentence: true,
    expandIntent: true,
    withNames: ["theName"]
  }, "{username} you have to help me!");
  TestTools.nlpTest(assert, nlp, "Frank you have to help me!", "pleaseHelp", {
    theName: "frank"
  });

  TestTools.nlpTest(assert, nlp, "hello frank mark", "greet", {
    whoToGreet: "frank",
    username1: "mark"
  }); // Consecutive entities

  TestTools.nlpTest(assert, nlp, "hello frank mark frank mark and frank frank", "greet", {
    username: "frank",
    username1: "mark",
    username2: "frank",
    username3: "mark",
    username4: "frank",
    username5: "frank"
  }, "anyEntity"); // Any Entity mode
});


QUnit.test("Nlp.Sequential", function(assert) {

  var nlp = new Bravey.Nlp.Sequential("test");

  var namesRecog = new Bravey.StringEntityRecognizer("username");
  assert.ok(namesRecog, "Creating username recognizer");
  assert.ok(namesRecog.addMatch("frank", "Frank"), "Filling frank intent");
  assert.ok(namesRecog.addMatch("frank", "Frankie"), "Filling frank intent");
  assert.ok(namesRecog.addMatch("frank", "Francesco"), "Filling frank intent");
  assert.ok(namesRecog.addMatch("mark", "Mark"), "Filling mark intent");
  assert.ok(namesRecog.addMatch("mark", "Markie"), "Filling mark intent");
  assert.ok(namesRecog.addMatch("mark", "Marc"), "Filling mark intent");
  assert.ok(namesRecog.addMatch("mark", "Marco"), "Filling mark intent");

  assert.ok(nlp.addEntity(new Bravey.NumberEntityRecognizer("phonenumber")), "Adding simple number recognizer");
  assert.ok(nlp.addEntity(namesRecog), "Adding names recognizer");

  assert.ok(nlp.addIntent("greet", [{
    entity: "username",
    id: "whoToGreet"
  }]), "Adding the greet intent");
  assert.ok(nlp.addIntent("call", [{
    entity: "phonenumber",
    id: "numberToCall"
  }]), "Adding the call intent");

  TestTools.nlpAddDocument(assert, nlp, "Can't find intent!", "fakeintent", 0, false);
  TestTools.nlpAddDocument(assert, nlp, "Hello {username}!", "greet~username", 0, "hello {username}!");
  TestTools.nlpAddDocument(assert, nlp, "Call {phonenumber}!", "call~phonenumber", 0, "call {phonenumber}!");


  TestTools.nlpTest(assert, nlp, "hello mark", "greet", {
    whoToGreet: "mark"
  });
  TestTools.nlpTest(assert, nlp, "mark hello", "greet", {
    whoToGreet: "mark"
  });

  TestTools.nlpTest(assert, nlp, "Hello mark!", "greet", {
    whoToGreet: "mark"
  });
  TestTools.nlpTest(assert, nlp, "Call the 33392!", "call", {
    numberToCall: 33392
  });
  TestTools.nlpTest(assert, nlp, "Mark, Call the police!", false);

  var someoneRecog = new Bravey.StringEntityRecognizer("someone");
  assert.ok(someoneRecog.addMatch("333-police", "police"), "Creating the someone recognizer");
  assert.ok(nlp.addEntity(someoneRecog), "Adding a recognizer to existing NLP");
  assert.ok(nlp.addIntent("callSomeone", [{
    entity: "username",
    id: "whoCalls"
  }, {
    entity: "someone",
    id: "someoneToCall"
  }]), "Adding intent to existing NLP");
  TestTools.nlpAddDocument(assert, nlp, "{username}, call {someone}!", "callSomeone", 0, false);
  TestTools.nlpAddDocument(assert, nlp, "{username}, call {someone}!", "callSomeone~username~someone", 0, "{username}, call {someone}!");

  TestTools.nlpTest(assert, nlp, "Mark, Call the police!", "callSomeone", {
    someoneToCall: "333-police"
  });

  TestTools.nlpAddDocument(assert, nlp, "{username}, call {someone}!", "callSomeone~username~someone", 0, "{username}, call {someone}!", "callSomeone");
  // Mandatory names with sequential samples!
  TestTools.nlpAddDocument(assert, nlp, "{username} you have to ring {someone}!", "callSomeone", {
    fromTaggedSentence: true,
    expandIntent: true,
    withNames: ["whoCalls", "someoneToCall"]
  }, "{username} you have to ring {someone}!");
  TestTools.nlpAddDocument(assert, nlp, "Howdy {username}!", "greet", {
    fromTaggedSentence: true,
    expandIntent: true,
    withNames: ["whoToGreet"]
  }, "Howdy {username}!");

  TestTools.nlpTest(assert, nlp, "Francesco, you have to call the police!", "callSomeone", {
    whoCalls: "frank",
    someoneToCall: "333-police"
  });


  TestTools.nlpAddDocument(assert, nlp, "{someone} please help!", "pleaseHelp", {
    fromTaggedSentence: true,
    expandIntent: true
  }, "{someone} please help!");
  TestTools.nlpTest(assert, nlp, "Police, help me please!", "pleaseHelp", {
    someone: "333-police"
  });

  TestTools.nlpAddDocument(assert, nlp, "Police, you have to rescue me!", "pleaseHelp", {
    fromFullSentence: true,
    expandIntent: true
  }, "{someone}, you have to rescue me!");
  TestTools.nlpTest(assert, nlp, "hey Police, you have to rescue me!", "pleaseHelp", {
    someone: "333-police"
  });

  var orgConfidence = nlp.getConfidence();
  TestTools.nlpTest(assert, nlp, "Frank likes a slice of bread", false);

  nlp.setConfidence(0.5);

  TestTools.nlpTest(assert, nlp, "Frank likes a slice of bread", "greet", {
    whoToGreet: "frank"
  });

  nlp.setConfidence(orgConfidence);

  TestTools.nlpTest(assert, nlp, "Frank likes a slice of bread", false);

  TestTools.nlpTest(assert, nlp, "Hello frank and mark!", "greet", {
    whoToGreet: "frank"
  });
  TestTools.nlpAddDocument(assert, nlp, "Hello frank and mark!", "greet", {
    fromFullSentence: true,
    expandIntent: true,
    withNames: ["whoToGreet"]
  }, "hello {username} and {username}!");
  TestTools.nlpTest(assert, nlp, "Hello frank and mark!", "greet", {
    whoToGreet: "frank",
    username1: "mark"
  });


  TestTools.nlpTest(assert, nlp, "Howdy frank and mark and the police!", "greet", {
    whoToGreet: "frank",
    username1: "mark"
  });
  TestTools.nlpAddDocument(assert, nlp, "Hello {username}, {username} and {someone}!", "greet", {
    fromTaggedSentence: true,
    expandIntent: true,
    withNames: ["whoToGreet"]
  }, "Hello {username}, {username} and {someone}!");
  TestTools.nlpTest(assert, nlp, "Howdy frank and mark and the police!", "greet", {
    whoToGreet: "frank",
    username1: "mark",
    someone: "333-police"
  });

  TestTools.nlpAddDocument(assert, nlp, "Hello {username}, {username} and {someone} and {someone}!", "greet", {
    fromTaggedSentence: true,
    expandIntent: true,
    withNames: ["one", "two", "three", "realSomeone"]
  }, "Hello {username}, {username} and {someone} and {someone}!");
  TestTools.nlpTest(assert, nlp, "Howdy frank and mark and the police and the police!", "greet", {
    one: "frank",
    two: "mark",
    three: "333-police",
    realSomeone: "333-police"
  });

  TestTools.nlpAddDocument(assert, nlp, "Frank you have to help me!", "pleaseHelp", {
    fromFullSentence: true,
    expandIntent: true,
    withNames: ["theName"]
  }, "{username} you have to help me!");
  TestTools.nlpTest(assert, nlp, "Frank you have to help me!", "pleaseHelp", {
    theName: "frank"
  });

  TestTools.nlpTest(assert, nlp, "hello frank mark", "greet", {
    whoToGreet: "frank",
    username1: "mark"
  }); // Consecutive entities

});

// FreeTextEntityRecognizer

QUnit.test("FreeTextEntityRecognizer", function(assert) {
  var nlp = new Bravey.Nlp.Sequential("test", {
    stemmer: Bravey.Language.IT.Stemmer
  });
  var email = new Bravey.EMailEntityRecognizer("mail");
  var freetext = new Bravey.FreeTextEntityRecognizer("freetext");
  freetext.addPrefix("subject");
  freetext.addConjunction("is");
  nlp.addEntity(email);
  nlp.addEntity(freetext);

  assert.ok(nlp.addIntent("asknumber", [{
    "entity": "mail",
    "id": "destination"
  }, {
    "entity": "freetext",
    "id": "body"
  }, {
    "entity": "mail",
    "id": "destination2"
  }]), "Intent with middle position added");
  assert.ok(nlp.addIntent("asknumber", [{
    "entity": "freetext",
    "id": "body"
  }, {
    "entity": "mail",
    "id": "destination"
  }]), "Intent with starting position added");
  assert.ok(nlp.addIntent("asknumber", [{
    "entity": "mail",
    "id": "destination"
  }, {
    "entity": "freetext",
    "id": "body"
  }]), "Intent with ending position added");

  assert.strictEqual(nlp.addDocument("this is {mail} {freetext} {mail}", "asknumber~mail~freetext~mail"), "this is {mail} {freetext} {mail}", "Added document with middle position");
  assert.strictEqual(nlp.addDocument("the text is {freetext} {mail}", "asknumber~freetext~mail"), "the text is {freetext} {mail}", "Added document with starting position");
  assert.strictEqual(nlp.addDocument("the mail is {mail} {freetext}", "asknumber~mail~freetext"), "the mail is {mail} {freetext}", "Added document with ending position");

  TestTools.nlpTest(assert, nlp, "this is aldo@gino.com with funny subject is ciao a tutti. L'altro indirizzo è aaa@bbb.ccc!!", "asknumber", {
    body: "ciao a tutti",
    destination: "aldo@gino.com",
    destination2: "aaa@bbb.ccc"
  });
  TestTools.nlpTest(assert, nlp, "this is aldo@gino.com with funny subject is \"ciao a tutti\", capito?. L'altro indirizzo è aaa@bbb.ccc!!", "asknumber", {
    body: "ciao a tutti",
    destination: "aldo@gino.com",
    destination2: "aaa@bbb.ccc"
  });
  TestTools.nlpTest(assert, nlp, "this is aldo@gino.com with funny subject ciao a tutti. L'altro indirizzo è aaa@bbb.ccc!!", "asknumber", {
    body: "ciao a tutti",
    destination: "aldo@gino.com",
    destination2: "aaa@bbb.ccc"
  });
  TestTools.nlpTest(assert, nlp, "this is to aldo@gino.com with subject ciao a tutti. L'altro indirizzo è aaa@bbb.ccc!!", "asknumber", {
    body: "ciao a tutti",
    destination: "aldo@gino.com",
    destination2: "aaa@bbb.ccc"
  });

  TestTools.nlpTest(assert, nlp, "this is to aldo@gino.com with ciao a tutti. L'altro indirizzo è aaa@bbb.ccc!!", "asknumber", {
    body: "with ciao a tutti",
    destination: "aldo@gino.com",
    destination2: "aaa@bbb.ccc"
  });
  freetext.addConjunction("with");
  TestTools.nlpTest(assert, nlp, "this is to aldo@gino.com with ciao a tutti. L'altro indirizzo è aaa@bbb.ccc!!", "asknumber", {
    body: "ciao a tutti",
    destination: "aldo@gino.com",
    destination2: "aaa@bbb.ccc"
  });

  TestTools.nlpTest(assert, nlp, "the mail is aldo@gino.com with ciao a tutti.", "asknumber", {
    body: "ciao a tutti",
    destination: "aldo@gino.com"
  });
  TestTools.nlpTest(assert, nlp, "the mail is aldo@gino.com with ciao a tutti. Ok?", "asknumber", {
    body: "ciao a tutti",
    destination: "aldo@gino.com"
  });

  TestTools.nlpTest(assert, nlp, "send an mail with ciao a tutti to aaa@bbb.ccc.", "asknumber", {
    body: "send an mail with ciao a tutti to",
    destination: "aaa@bbb.ccc"
  });
  TestTools.nlpTest(assert, nlp, "send an mail with subject ciao a tutti to aaa@bbb.ccc.", "asknumber", {
    body: "ciao a tutti to",
    destination: "aaa@bbb.ccc"
  });
  freetext.addConjunction("to");
  TestTools.nlpTest(assert, nlp, "send an mail with subject ciao a tutti to aaa@bbb.ccc.", "asknumber", {
    body: "ciao a tutti",
    destination: "aaa@bbb.ccc"
  });

});

QUnit.test("IT.FreeTextEntityRecognizer", function(assert) {
  var nlp = new Bravey.Nlp.Sequential("test", {
    stemmer: Bravey.Language.IT.Stemmer
  });

  var freetext = new Bravey.Language.IT.FreeTextEntityRecognizer("subject");
  freetext.addPrefix("soggetto");
  nlp.addEntity(freetext);

  assert.ok(nlp.addIntent("gettext", [{
    "entity": "subject",
    "id": "subject"
  }]), "Intent created.");

  assert.strictEqual(nlp.addDocument("Il soggetto è {subject}", "gettext~subject"), "il soggetto e {subject}", "Added document");

  TestTools.nlpTest(assert, nlp, "Il soggetto è pinopino", "gettext", {
    subject: "pinopino"
  });
  TestTools.nlpTest(assert, nlp, "Il soggetto sarebbe pinopino", "gettext", {
    subject: "pinopino"
  });
  TestTools.nlpTest(assert, nlp, "Il soggetto mi pare sia pinopino", "gettext", {
    subject: "pinopino"
  });
  TestTools.nlpTest(assert, nlp, "Il soggetto e' pinopino", "gettext", {
    subject: "pinopino"
  });
  TestTools.nlpTest(assert, nlp, "Il soggetto dovrebbe essere pinopino, grazie", "gettext", {
    subject: "pinopino"
  });
  TestTools.nlpTest(assert, nlp, "Il soggetto dovrebbe essere pinopino,grazie", "gettext", {
    subject: "pinopino"
  });

});


// Session Manager

QUnit.test("SessionManager.InMemorySessionManager", function(assert) {
  var sm = new Bravey.SessionManager.InMemorySessionManager();
  var context = ["lorem", "ipsum"];

  var id = sm.reserveSessionId();
  var out = sm.getContext(id);
  assert.ok(id, "Session is created");
  assert.deepEqual(out, ["default"], "Default context is just 'default'");

  var setresult = sm.setContext(id, context);
  out = sm.getContext(id);
  assert.ok(setresult, "Context is get and set");
  assert.deepEqual(out, context, "Context is get and set correctly");

  assert.ok(!sm.getData("foobar"), "Data for missing session is empty");
  assert.ok(!sm.setData("foobar", {
    a: 1,
    b: 2
  }), "Data for missing session is not set");
  assert.ok(!sm.clearData("foobar"), "Data for missing session is not cleared");
  assert.ok(!sm.getData("foobar"), "Data for missing session is empty");

  assert.deepEqual(sm.getData(id), {}, "Data for correct session is empty at start");
  assert.ok(sm.setData(id, {
    a: 1,
    b: 2
  }), "Data for correct session is set");
  assert.deepEqual(sm.getData(id), {
    a: 1,
    b: 2
  }, "Data for correct session is set");
  assert.ok(sm.setData(id, {
    c: 3
  }), "Data for correct session is merged");
  assert.deepEqual(sm.getData(id), {
    a: 1,
    b: 2,
    c: 3
  }, "Data for correct session is merged correctly");
  assert.ok(sm.clearData(id), "Data for correct session is cleared");
  assert.deepEqual(sm.getData(id), {}, "Data for correct session is cleared correctly");

  assert.ok(!sm.getContext("foobar"), "Undefined ID returns false");
  setresult = sm.setContext("foo", context);
  assert.ok(setresult === false, "Undefined ID are not found");
  assert.ok(!sm.getContext("foobar"), "Undefined ID are not set");

  var otherid = sm.reserveSessionId();

  sm = new Bravey.SessionManager.InMemorySessionManager({
    sessionLength: 3000
  });
  id = sm.reserveSessionId();
  assert.deepEqual(sm.getContext(id), ["default"], "Fresh session just created");

  var expiretry = 0;

  function checker() {
    var done1 = assert.async();
    setTimeout(function() {
      sm.reserveSessionId(); // New ID, trigger cleanup.
      expiretry++;
      var out = sm.getContext(id);
      if (expiretry < 3)
        assert.deepEqual(out, ["default"], "Second " + expiretry + ": Session kept.");
      else if (expiretry > 3)
        assert.ok(out === undefined, "Second " + expiretry + ": Session forgotten.");
      if (expiretry < 4) checker();
      done1();
    }, 1000);
  }

  checker();

});

// Context Manager

QUnit.test("ContextManager", function(assert) {
  var sm = new Bravey.ContextManager();

  var numberNlp = new Bravey.Nlp.Fuzzy("numberNlp");
  numberNlp.addEntity(new Bravey.NumberEntityRecognizer("number"));
  numberNlp.addDocument("23", "asknumber", {
    fromFullSentence: 1,
    expandIntent: true
  });
  numberNlp.addDocument("33", "asknumber", {
    fromFullSentence: 1,
    expandIntent: true
  });

  var yesnoNlp = new Bravey.Nlp.Fuzzy("yesnoNlp");
  var yesnoEntity = new Bravey.StringEntityRecognizer("yesnoEntity");
  yesnoEntity.addMatch("yes", "yes");
  yesnoEntity.addMatch("sure", "yes");
  yesnoEntity.addMatch("no", "no");
  yesnoEntity.addMatch("nope", "no");
  yesnoNlp.addEntity(yesnoEntity);
  yesnoNlp.addDocument("yes, thanks.", "confirmation", {
    fromFullSentence: 1,
    expandIntent: true
  });
  yesnoNlp.addDocument("yes, please.", "confirmation", {
    fromFullSentence: 1,
    expandIntent: true
  });
  yesnoNlp.addDocument("nope.", "confirmation", {
    fromFullSentence: 1,
    expandIntent: true
  });


  sm.addNlp(yesnoNlp);
  sm.addNlp(numberNlp, ["numbers"]);
  var teststring = "12332 yes";
  var test = sm.testByContext(teststring);

  assert.deepEqual(test.context, "default", "Default context matched");
  assert.deepEqual(test.result.intent, "confirmation", "Confirmation NLP matched");

  test = sm.testByContext(teststring, ["numbers"]);
  assert.deepEqual(test.context, "numbers", "Explicit context, numbers context matched");
  assert.deepEqual(test.result.intent, "asknumber", "Explicit context, ask number NLP matched");

  sm.removeNlp(yesnoNlp, ["numbers"]);
  var test = sm.testByContext(teststring);
  assert.deepEqual(test.context, "default", "Default is kept when removing an NLP on not related domain.");

  sm.removeNlp(numberNlp, ["numbers"]);
  test = sm.testByContext(teststring, ["numbers"]);
  assert.deepEqual(test.result, false, "NLP is removed");

  sm.removeNlp(yesnoNlp);
  var test = sm.testByContext(teststring);
  assert.deepEqual(test.result, false, "NLP is removed from all contexts");
  sm.addNlp(yesnoNlp, ["yesno", "default"]);
  sm.addNlp(numberNlp, ["numbers"]);

  test = sm.testBySessionId(teststring);
  assert.ok(test.sessionId, "Session ID is created");
  assert.deepEqual(test.sessionContext, ["default"], "Context is default");
  assert.deepEqual(test.result.intent, "confirmation", "Result is confirmation");

  var sid = test.sessionId;
  assert.ok(sm.setSessionIdContext(sid, ["numbers"]), "Session exists and context changed");

  assert.ok(!sm.setSessionIdData("foobar", {
    a: 1,
    b: 2
  }), "Session data is not set for invalid session");
  assert.ok(!sm.getSessionIdData("foobar"), "Session data is not get for invalid session");
  assert.ok(!sm.clearSessionIdData("foobar"), "Session data is not cleared for invalid session");

  assert.deepEqual(sm.getSessionIdData(sid), {}, "Session data empty for fresh valid session");
  assert.ok(sm.setSessionIdData(sid, {
    a: 1,
    b: 2
  }), "Session data is set for valid session");
  assert.deepEqual(sm.getSessionIdData(sid), {
    a: 1,
    b: 2
  }, "Session data is get for valid session");
  assert.ok(sm.setSessionIdData(sid, {
    c: 3
  }), "Session data is merged for valid session");
  assert.deepEqual(sm.getSessionIdData(sid), {
    a: 1,
    b: 2,
    c: 3
  }, "Session data is merged for valid session");
  assert.ok(sm.clearSessionIdData(sid, {
    c: 3
  }), "Session data is cleared for valid session");
  assert.deepEqual(sm.getSessionIdData(sid), {}, "Session data is cleared for valid session");

  test = sm.testBySessionId(teststring);
  var msid = test.sessionId;
  assert.deepEqual(test.sessionData, {}, "Returned session data is empty for first match");
  assert.ok(sm.setSessionIdData(msid, {
    a: 1,
    b: 2
  }), "Session data is set for valid session");
  test = sm.testBySessionId(teststring, msid);
  assert.deepEqual(test.sessionData, {
    a: 1,
    b: 2
  }, "Returned session data is correct");

  test = sm.testBySessionId(teststring, sid);
  assert.ok(sid == test.sessionId, "Same session used");
  assert.deepEqual(test.sessionContext, ["numbers"], "Context is numbers");
  assert.deepEqual(test.result.intent, "asknumber", "Result is confirmation");

});


// API.AI Adapter

function englishApiAiTest(assert, args) {
  var done1 = assert.async();

  var apiai = new Bravey.ApiAiAdapter("../samples/apiai-packages/soccer", args);

  apiai.loadEntity("competition");
  apiai.loadEntity("player");
  apiai.loadEntity("team");

  apiai.loadIntent("didplayed");
  apiai.loadIntent("howmanygoals");
  apiai.loadIntent("whatthescore");
  apiai.loadIntent("whoscored");

  apiai.prepare(function() {
    TestTools.nlpTest(assert, apiai.nlp, "Who won Barcelona-Milan?", "whatthescore", {
      team: "t178",
      "team1": "t120"
    });
    assert.deepEqual(apiai.test("Who won Barcelona-Milan?"), {
      "result": {
        "action": "",
        "actionIncomplete": false,
        "contexts": [],
        "fulfillment": {
          "speech": ""
        },
        "metadata": {
          "intentName": "whatthescore"
        },
        "parameters": {
          "team": "t178",
          "team1": "t120"
        },
        "resolvedQuery": "Who won Barcelona-Milan?",
        "score": 0.830906148867314,
        "source": "agent"
      },
      "status": {
        "code": 200,
        "errorType": "success"
      }
    }, "Check Api.ai format");
    done1();
  });
}

function italianApiAiTest(assert, args) {
  var done1 = assert.async();

  var apiai = new Bravey.ApiAiAdapter("../samples/apiai-packages/saleriunioni", args);

  apiai.loadEntity("sala_riunioni");
  apiai.loadEntity("time_range");
  apiai.loadEntity("people");
  apiai.loadEntity("confirmation");

  apiai.loadIntent("Request");
  apiai.loadIntent("People");
  apiai.loadIntent("Confirmation");

  apiai.prepare(function() {
    TestTools.nlpTest(assert, apiai.nlp, "Per favore vorrei una sala riunioni domani alle 3 in mattinata", "Request", {
      date: TestTools.formatDate((new Date()).getTime() + TestTools.DAY),
      "sala_riunioni": "any",
      "time_period": {
        end: "12:00:00",
        start: "08:00:00"
      }
    });

    TestTools.nlpTest(assert, apiai.nlp, "No", "Confirmation", {
      confirmation: "no"
    });

    assert.deepEqual(apiai.test("Per favore vorrei una sala riunioni domani alle 3 in mattinata"), {
      "result": {
        "action": "",
        "actionIncomplete": false,
        "contexts": [],
        "fulfillment": {
          "speech": ""
        },
        "metadata": {
          "intentName": "Request"
        },
        "parameters": {
          "date": TestTools.formatDate((new Date()).getTime() + TestTools.DAY),
          "sala_riunioni": "any",
          "time": "03:00:00",
          "time_period": {
            "end": "12:00:00",
            "start": "08:00:00"
          }
        },
        "resolvedQuery": "Per favore vorrei una sala riunioni domani alle 3 in mattinata",
        "score": 0.9999999700917979,
        "source": "agent"
      },
      "status": {
        "code": 200,
        "errorType": "success"
      }
    }, "Check Api.ai format");
    done1();
  });

}

QUnit.test("ApiAiAdapter (English - Fuzzy)", function(assert) {
  englishApiAiTest(assert, {
    language: "EN",
    nlp: "Fuzzy"
  })
});
QUnit.test("ApiAiAdapter (English - SequentialNlp)", function(assert) {
  englishApiAiTest(assert, {
    language: "EN",
    nlp: "Sequential"
  })
});

QUnit.test("ApiAiAdapter (Italian - Fuzzy)", function(assert) {
  italianApiAiTest(assert, {
    language: "IT",
    nlp: "Fuzzy"
  })
});
QUnit.test("ApiAiAdapter (Italian - SequentialNlp)", function(assert) {
  italianApiAiTest(assert, {
    language: "IT",
    nlp: "Sequential"
  })
});

// Document samples

QUnit.test("Documentation: samples", function(assert) {

  var nlp = new Bravey.Nlp.Fuzzy();
  nlp.addDocument("I want a pizza!", "pizza", {
    fromFullSentence: true,
    expandIntent: true
  });
  nlp.addDocument("I want some pasta!", "pasta", {
    fromFullSentence: true,
    expandIntent: true
  });
  assert.deepEqual(nlp.test("Want pizza, please").intent, "pizza");

  // ---

  var nlp = new Bravey.Nlp.Fuzzy();
  nlp.addEntity(new Bravey.NumberEntityRecognizer("quantity"));
  nlp.addDocument("I want 2 pizzas!", "pizza", {
    fromFullSentence: true,
    expandIntent: true
  });
  assert.deepEqual(nlp.test("Want 3 pizzas, please").entitiesIndex.quantity.value, 3);

  // ---

  var nlp = new Bravey.Nlp.Fuzzy();
  nlp.addEntity(new Bravey.NumberEntityRecognizer("quantity"));
  nlp.addEntity(new Bravey.Language.EN.TimeEntityRecognizer("delivery_time"));
  nlp.addDocument("I want 2 pizzas at 12!", "pizza", {
    fromFullSentence: true,
    expandIntent: true
  });
  TestTools.nlpTest(assert, nlp, "Deliver 3 pizzas for 2pm, please", "pizza", {
    "delivery_time": "14:00:00",
    "quantity": 3
  });

  // ---

  var nlp = new Bravey.Nlp.Fuzzy();
  nlp.addEntity(new Bravey.NumberEntityRecognizer("quantity"));
  nlp.addEntity(new Bravey.Language.IT.TimeEntityRecognizer("delivery_time"));
  nlp.addDocument("Vorrei 2 pizze per le 3!", "pizza", {
    fromFullSentence: true,
    expandIntent: true
  });
  TestTools.nlpTest(assert, nlp, "Consegnami 3 pizze per le 2 del pomeriggio!", "pizza", {
    "delivery_time": "14:00:00",
    "quantity": 3
  });

  // ---

  var nlp = new Bravey.Nlp.Fuzzy();
  nlp.addEntity(new Bravey.NumberEntityRecognizer("quantity"));
  nlp.addEntity(new Bravey.Language.PT.TimeEntityRecognizer("delivery_time"));
  nlp.addDocument("Quero 2 pizzas para 3:00!", "pizza", {
    fromFullSentence: true,
    expandIntent: true
  });
  TestTools.nlpTest(assert, nlp, "Me veja 3 pizzas para 2 da tarde!", "pizza", {
    "delivery_time": "14:00:00",
    "quantity": 3
  });

  // ---

  var nlp = new Bravey.Nlp.Fuzzy();
  nlp.addDocument("I want a pizza!", "pizza", {
    fromFullSentence: true,
    expandIntent: true
  });
  nlp.addDocument("I want some pasta!", "pasta", {
    fromFullSentence: true,
    expandIntent: true
  });
  TestTools.nlpTest(assert, nlp, "A pizza, please", "pizza");

  // ---

  var nlp = new Bravey.Nlp.Fuzzy();
  nlp.addIntent("order_food", [{
    entity: "food_name",
    id: "food_type"
  }, {
    entity: "number",
    id: "quantity"
  }]);
  nlp.addIntent("order_drink", [{
    entity: "drink_name",
    id: "drink_type"
  }]);

  var drinks = new Bravey.StringEntityRecognizer("drink_name");
  drinks.addMatch("coke", "coke");
  drinks.addMatch("coke", "cola");
  drinks.addMatch("mojito", "mojito");
  drinks.addMatch("mojito", "moito");
  nlp.addEntity(drinks);

  var food = new Bravey.StringEntityRecognizer("food_name");
  food.addMatch("pizza", "pizza");
  food.addMatch("pizza", "pizzas");
  food.addMatch("pasta", "pasta");
  nlp.addEntity(food);

  nlp.addEntity(new Bravey.NumberEntityRecognizer("number"));

  nlp.addDocument("I want {number} {food_name}!", "order_food");
  nlp.addDocument("I want {drink_name}!", "order_drink");

  TestTools.nlpTest(assert, nlp, "Want a moito, please", "order_drink", {
    drink_type: "mojito"
  });
  TestTools.nlpTest(assert, nlp, "I'd like 2 pizzas", "order_food", {
    food_type: "pizza",
    quantity: 2
  });
  TestTools.nlpTest(assert, nlp, "I'd like some pasta", "order_food", {
    food_type: "pasta"
  });

});