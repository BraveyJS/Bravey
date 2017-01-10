window.BOTLoader = function(contact) {
  contact.setAvatar("avatar/oak.jpg");
  contact.setDescription("I'm professor Oak! Or... well. Its bot! Ask me one of the first 151 Pok&egrave;mon and let's talk about it! Powered by http://pokeapi.co");
  contact.setTips(
    "<ul>" +
    "<li>Which pokemon do you know?</li>" +
    "<li>Let's talk about a random pokemon</li>" +
    "<li>What is a magikarp?</li>" +
    "<li>What is it?</li>" +
    "<li>what is the attack stat?</li>" +
    "<li>what the heck is rattled?</li>" +
    "</ul>"
  );

  var nlp = new Bravey.Nlp.Fuzzy("oakbot", {
    stemmer: Bravey.Language.EN.Stemmer,
    filter: Bravey.Filter.BasicFilter
  });

  contact.request("GET", "http://pokeapi.co/api/v2/pokemon/?limit=151", 0, function(pokemon) {

    pokemon = JSON.parse(pokemon).results;

    var pokemonIndex = {};
    var pokemonNames = new Bravey.StringEntityRecognizer("pokemon_name", 100);
    for (var i = 0; i < pokemon.length; i++) {
      pokemonNames.addMatch(pokemon[i].name, pokemon[i].name);
      pokemonIndex[pokemon[i].name] = pokemon[i].url;
    }
    pokemonNames.addMatch("_HIM_", "it");
    pokemonNames.addMatch("_HIM_", "his");
    pokemonNames.addMatch("_HIM_", "him");
    pokemonNames.addMatch("_HIM_", "her");
    nlp.addEntity(pokemonNames);

    nlp.addDocument("another one", "randompokemon", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("another pokemon", "randompokemon", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("A random pokemon", "randompokemon", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("Let's talk about a random pokemon", "randompokemon", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("Tell me a pokemon name", "randompokemon", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("Which pokemon do you know?", "pokemonlist", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("How many pokemon do you know?", "pokemonlist", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("list the pokemon you know!", "pokemonlist", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("Show me {pokemon_name}", "aboutpokemon", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("What is a {pokemon_name}?", "aboutpokemon", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("Let's talk about {pokemon_name}?", "aboutpokemon", {
      fromTaggedSentence: true,
      expandIntent: true
    });

    var pokenlp = new Bravey.Nlp.Fuzzy("pokenlp", {
      stemmer: Bravey.Language.EN.Stemmer,
      filter: Bravey.Filter.BasicFilter
    });
    var pokeStats = new Bravey.StringEntityRecognizer("pokemon_stat", 100);
    pokenlp.addEntity(pokeStats);
    var pokeAbilities = new Bravey.StringEntityRecognizer("pokemon_ability", 100);
    pokenlp.addEntity(pokeAbilities);

    pokenlp.addDocument("What is {pokemon_ability}?", "pokemonability", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    pokenlp.addDocument("Tell me about the {pokemon_ability} ability", "pokemonability", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    pokenlp.addDocument("What is {pokemon_stat}?", "pokemonstat", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    pokenlp.addDocument("Tell me about the {pokemon_stat} stat", "pokemonstat", {
      fromTaggedSentence: true,
      expandIntent: true
    });

    var sessionId, contextManager = new Bravey.ContextManager();
    contextManager.addNlp(nlp);
    contextManager.addNlp(pokenlp, ["default", "aboutpokemon"]);

    contact.say("Hello! Do you want to know something about a specific Pokemon?");
    contact.setOnline(true);

    contact.onReceive = function(text) {
      var html = "",
        out = contextManager.testBySessionId(text, sessionId);

      if (out.result) {

        sessionId = out.sessionId;
        var context = {
          pokemon_name: Bravey.Data.getEntityValue(out, "pokemon_name", "_HIM_")
        };

        switch (out.result.intent) {
          case "randompokemon":
            {
              context.pokemon_name = pokemon[Math.floor(Math.random() * pokemon.length)].name;
              contact.say("Let's talk about <b>" + context.pokemon_name + "</b>!");
              break;
            }
          case "pokemonlist":
            {
              contact.say("Is a long list! Get ready. I know...");
              for (var i = 0; i < pokemon.length; i++) html += pokemon[i].name + "<br>";
              contact.say(html);
              break;
            }
          case "aboutpokemon":
            {
              if (context.pokemon_name) {

                contact.say("Let me see...");
                contact.setBusy(true);
                contact.request("GET", pokemonIndex[context.pokemon_name], 0, function(pokedata) {
                  contextManager.setSessionIdContext(sessionId, ["default", "aboutpokemon"]);

                  contact.setBusy(false);
                  pokedata = JSON.parse(pokedata);

                  contact.say("<img src='" + pokedata.sprites.front_default + "'><br><b>" + pokedata.name + "</b> is of the <b>" + pokedata.species.name + "</b> species and weights <b>" + pokedata.weight + "lbs</b>.");

                  html = "";
                  for (var i = 0; i < pokedata.stats.length; i++) {
                    pokeStats.addMatch(pokedata.stats[i].stat.url, pokedata.stats[i].stat.name);
                    html += "<b>" + pokedata.stats[i].stat.name + ":</b> " + pokedata.stats[i].base_stat + "<br>";
                  }
                  contact.say("Its stats are:<br>" + html);

                  html = "";
                  for (var i = 0; i < pokedata.abilities.length; i++) {
                    pokeAbilities.addMatch(pokedata.abilities[i].ability.url, pokedata.abilities[i].ability.name);
                    html += pokedata.abilities[i].ability.name + ", ";
                  }
                  contact.say("Its abilities are: <b>" + html.substr(0, html.length - 2) + ".</b>");

                  contact.say("Want to know something more about <b>" + pokedata.name + "</b> stats and abilities?");
                });
              } else contact.say("Specify the pokemon, please.");
              break;
            }
          case "pokemonability":
            {
              contact.say("Let me see...");
              contact.setBusy(true);

              contact.request("GET", out.result.entitiesIndex.pokemon_ability.value, 0, function(ability) {
                contact.setBusy(false);
                ability = JSON.parse(ability);

                var names = {};
                for (var i = 0; i < ability.names.length; i++) names[ability.names[i].language.name] = ability.names[i].name;

                contact.say("<b>" + names.en + "</b> (" + names.ja + ", " + names.it + ") is an ability that " + (ability.is_battle_only ? "can be used only in battle" : "can be used out of battles too") + ".");
                contact.say("Something else?");
              });
              break;
            }
          case "pokemonstat":
            {
              contact.say("Let me see...");
              contact.setBusy(true);

              contact.request("GET", out.result.entitiesIndex.pokemon_stat.value, 0, function(stat) {
                contact.setBusy(false);
                stat = JSON.parse(stat);
                var names = {};
                for (var i = 0; i < stat.names.length; i++) names[stat.names[i].language.name] = stat.names[i].name;

                contact.say("<b>" + names.en + "</b> (" + names.ja + ", " + names.it + ") is stat that " + (stat.is_battle_only ? "affect battles" : "works in and out of battles") + ".");
                contact.say("Something else?");
              });
              break;
            }
        }

        contextManager.setSessionIdData(sessionId, context);

      } else contact.say("Can't understand...");
    }

  });

}