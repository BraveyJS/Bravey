window.BOTLoader = function(contact) {
  contact.setAvatar("avatar/meteo.png");
  contact.setDescription("I can tell the weather in some places in United States. Powered by http://services.faa.gov");
  contact.setTips(
    "<ul>" +
    "<li>places list, please.</li>" +
    "<li>What is the weather in san francisco?</li>" +
    "<li>What is the temperature there?</li>" +
    "<li>The visibility in SFO</li>" +
    "<li>How the wind is blowing in Redmond?</li>" +
    "</ul>"
  );

  contact.request("GET", "http://services.faa.gov/airport/list?format=json", 0, function(airports) {
    airports = JSON.parse(airports);

    var nlp = new Bravey.Nlp.Fuzzy("weatherbot", {
      stemmer: Bravey.Language.EN.Stemmer,
      filter: Bravey.Filter.BasicFilter
    });

    var places = new Bravey.StringEntityRecognizer("place", 100);
    var guide = "";
    for (var i = 0; i < airports.length; i++) {
      places.addMatch(airports[i].IATA, airports[i].IATA);
      var spl = airports[i].CITY.split("/");
      for (var a = 0; a < spl.length; a++) {
        places.addMatch(airports[i].IATA, spl[a]);
        guide += airports[i].IATA + ", " + spl[a] + "<br>";
      }
    }

    places.addMatch("SFO", "SFO");

    places.addMatch("_THERE_", "there");
    nlp.addEntity(places);

    nlp.addDocument("what is the weather in {place}", "weather", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("what is the temperature in {place}", "temperature", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("what is the visibility in {place}", "visibility", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("how is the wind in {place}", "wind", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("which places", "list", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("locations", "list", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("list", "list", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("show me the list", "list", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("the places you know", "list", {
      fromTaggedSentence: true,
      expandIntent: true
    });

    var sessionId, contextManager = new Bravey.ContextManager();
    contextManager.addNlp(nlp);

    contact.say("Hi! I can tell you the weather of many places. Do you want to know the list? The temperature, visibility or wind of a specific place? Just ask!");
    contact.setOnline(true);

    contact.onReceive = function(text) {
      var html = "",
        out = contextManager.testBySessionId(text, sessionId);

      if (out.result) {

        sessionId = out.sessionId;
        var explicit = {
          place: Bravey.Data.isExplicit(out, "place")
        };
        var context = {
          place: Bravey.Data.getEntityValue(out, "place", "_THERE_")
        };

        switch (out.result.intent) {
          case "list":
            {
              contact.say("I can tell you the weather of these places:<br><br>" + guide);
              break;
            }
          case "weather":
            {
              if (explicit.place && context.place) {
                contact.setBusy(true);
                contact.request("GET", "http://services.faa.gov/airport/status/" + context.place + "?format=json", 0, function(meteo) {
                  contact.setBusy(false);
                  meteo = JSON.parse(meteo);
                  contact.say("Weather in <b>" + meteo.city + "</b> is " + meteo.weather.weather);
                });
              } else contact.say("Please, specify the place.");
              break;
            }
          case "temperature":
            {
              if (explicit.place && context.place) {
                contact.setBusy(true);
                contact.request("GET", "http://services.faa.gov/airport/status/" + context.place + "?format=json", 0, function(meteo) {
                  contact.setBusy(false);
                  meteo = JSON.parse(meteo);
                  contact.say("The temperature in <b>" + meteo.city + "</b> is " + meteo.weather.temp);
                });
              } else contact.say("Please, specify the place.");
              break;
            }
          case "visibility":
            {
              if (explicit.place && context.place) {
                contact.setBusy(true);
                contact.request("GET", "http://services.faa.gov/airport/status/" + context.place + "?format=json", 0, function(meteo) {
                  contact.setBusy(false);
                  meteo = JSON.parse(meteo);
                  contact.say("Visibility ratio in <b>" + meteo.city + "</b> is " + meteo.weather.visibility);
                });
              } else contact.say("Please, specify the place.");
              break;
            }
          case "wind":
            {
              if (explicit.place && context.place) {
                contact.setBusy(true);
                contact.request("GET", "http://services.faa.gov/airport/status/" + context.place + "?format=json", 0, function(meteo) {
                  contact.setBusy(false);
                  meteo = JSON.parse(meteo);
                  contact.say("Wind in <b>" + meteo.city + "</b> is " + meteo.weather.wind);
                });
              } else contact.say("Please, specify the place.");
              break;
            }
        }

        contextManager.setSessionIdData(sessionId, context);

      } else contact.say("Can't understand...");
    }
  });
}