// Run with: node adapterCommandLine.js
// Then ask for a meeting room in italian, like "una sala riunioni per domani alle 3 del pomeriggio"

var Bravey = require("../../build/bravey.js");

var apiai = new Bravey.ApiAiAdapter("../apiai-packages/saleriunioni", {
  language: "IT",
  filter: Bravey.Filter.BasicFilter
});

apiai.loadEntity("sala_riunioni");
apiai.loadEntity("time_range");
apiai.loadEntity("people");
apiai.loadEntity("confirmation");
apiai.loadIntent("Request");
apiai.loadIntent("People");
apiai.loadIntent("Confirmation");

apiai.prepare(function() {
  console.log("Write 'quit' to quit :)");
  console.log("(example: 'Una sala riunioni per domani alle 3 del pomeriggio')");

  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  var util = require('util');

  process.stdin.on('data', function(text) {
    if (text === 'quit\n') {
      done();
    } else {
      console.log(">> " + text);
      var out = apiai.nlp.test(text);
      if (out) {
        console.log("INTENT: " + out.intent);
        for (var k in out.entitiesIndex) console.log(" \\_ " + k + " = " + JSON.stringify(out.entitiesIndex[k].value));
      } else console.log("Can't understand...")
    }
  });

  function done() {
    console.log('Bye!');
    process.exit();
  }

});