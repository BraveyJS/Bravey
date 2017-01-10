// Run with: node adapterServer.js
// Then open "http://localhost:8080/test?Who%20won%20Barcelona-Milan?" in your browser to extract intent and entities.

var Bravey = require("../../build/bravey.js");
var http = require('http');

var apiai = new Bravey.ApiAiAdapter("../apiai-packages/soccer", {
  language: "EN",
  filter: Bravey.Filter.BasicFilter
});

apiai.loadEntity("competition");
apiai.loadEntity("player");
apiai.loadEntity("team");
apiai.loadIntent("didplayed");
apiai.loadIntent("howmanygoals");
apiai.loadIntent("whatthescore");
apiai.loadIntent("whoscored");

apiai.prepare(function() {

  const PORT = 8080;

  //We need a function which handles requests and send response
  function handleRequest(request, response) {
    if (request.url.substr(0, 6) == "/test?") {
      var sentence = decodeURI(request.url.substr(6));
      console.log("Processing " + sentence);
      response.end(JSON.stringify(apiai.nlp.test(sentence)));
      // Do you prefer an Api.ai output like? Replace the line above with...
      // response.end(JSON.stringify(apiai.test(sentence)));
    } else
      response.end('<html>Use <a href="/test?' + encodeURI("Who won Barcelona-Milan?") + '">http://localhost:' + PORT + '/test?{your text}</a> for calling NLP (you called ' + request.url + ')</html>');
  }

  //Create a server
  var server = http.createServer(handleRequest);

  //Lets start our server
  server.listen(PORT, function() {
    console.log("Server listening on: http://localhost:%s", PORT);
  });

});