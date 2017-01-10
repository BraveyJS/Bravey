window.BOTLoader = function(contact) {
  contact.setAvatar("avatar/soccer.png");
  contact.setDescription("Let's talk about football! It progressively learn topics asking about leagues, teams and then players. Just follow the statement sequence below to better understand how this bot works. Powered by http://api.football-data.org");
  contact.setTips(
    "<ul>" +
    "<li>Let's talk about Primera Division</li>" +
    "<li>Current match day?</li>" +
    "<li>How many games for Premier League?</li>" +
    "<li>how many match days?</li>" +
    "<li>how many teams are playing the Serie A?</li>" +
    "<li>Who is winning?</li>" +
    "<li>Which team are playing?</li>" +
    "<li>Which players are in Juventus?</li>" +
    "<li>Who is Buffon?</li>" +
    "<li>Which is the Chiellini position?</li>" +
    "<li>Which its role?</li>" +
    "<li>Where Marchisio came from?</li>" +
    "<li>Its number</li>" +
    "<li>which teams are playing the European Championships?</li>" +
    "<li>score of italy-belgium?</li>" +
    "</ul>"
  );

  var idx = {
      competition: [],
      team: [],
      player: [],
      table: [],
      fixtures: []
    },
    ent, html = "";

  contact.request("GET", "http://api.football-data.org/v1/competitions", 0, function(competitions) {
    idx.competition = JSON.parse(competitions);

    var nlp = new Bravey.Nlp.Fuzzy("footbot", {
      stemmer: Bravey.Language.EN.Stemmer,
      filter: Bravey.Filter.BasicFilter
    });

    var competition = new Bravey.StringEntityRecognizer("competition", 100);
    for (var i = 0; i < idx.competition.length; i++) {
      competition.addMatch(i, idx.competition[i].league);
      html += "<b>" + idx.competition[i].caption + "</b><br>";
      ent = idx.competition[i].caption.replace(/^[^a-zA-Z]*/g, "").split(/ /);
      for (var j = 0; j < ent.length - 1; j += 1) competition.addMatch(i, ent[j] + " " + ent[j + 1]);
      competition.addMatch(i, idx.competition[i].league)
    }
    nlp.addEntity(competition);

    var team = new Bravey.StringEntityRecognizer("team", 100);
    nlp.addEntity(team);

    var player = new Bravey.StringEntityRecognizer("player", 100);
    player.addMatch("he", "_HE_");
    player.addMatch("him", "_HE_");
    nlp.addEntity(player);

    nlp.addDocument("{competition}", "competitionSet", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("Let's talk about {competition} competition", "competitionSet", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("Current match day {competition}?", "competitionCurrentMatchDay", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("how many games {competition}?", "competitionHowManyGames", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("how many match days {competition}?", "competitionHowManyMatchdays", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("how many matchdays {competition}?", "competitionHowManyMatchdays", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("how many teams {competition}?", "competitionHowManyTeams", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("table of {competition}?", "competitionTable", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("who is winning {competition}?", "competitionTable", {
      fromTaggedSentence: true,
      expandIntent: true
    });

    nlp.addDocument("fixtures {competition} {team} {team}", "competitionFixtures", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("Score of {competition} {team} {team}?", "competitionFixtures", {
      fromTaggedSentence: true,
      expandIntent: true
    });

    nlp.addDocument("which team is playing {competition}?", "competitionWhichTeam", {
      fromTaggedSentence: true,
      expandIntent: true
    });

    nlp.addDocument("which players are in {team}?", "teamWhichPlayers", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("players of {team}?", "teamWhichPlayers", {
      fromTaggedSentence: true,
      expandIntent: true
    });

    nlp.addDocument("who is {player}?", "playerWhoIs", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("which position {player} plays?", "playerPosition", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("which role {player} plays?", "playerPosition", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("in which team {player} plays?", "playerTeam", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("which nationality {player}?", "playerNationality", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("where {player} come from?", "playerNationality", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("number of {player}?", "playerJerseyNumber", {
      fromTaggedSentence: true,
      expandIntent: true
    });
    nlp.addDocument("jersey number of {player}?", "playerJerseyNumber", {
      fromTaggedSentence: true,
      expandIntent: true
    });

    var sessionId, contextManager = new Bravey.ContextManager();
    contextManager.addNlp(nlp, ["default"], "anyEntity");

    contact.setOnline(true);
    contact.say("Let's talk football! These are the competitions:<br>" + html);

    function showFixture(fixtures, team1, team2, info) {
      for (var i = 0; i < fixtures.length; i++) {
        if (
          ((fixtures[i].awayTeamName === team1) || (fixtures[i].awayTeamName === team2)) &&
          ((fixtures[i].homeTeamName === team1) || (fixtures[i].homeTeamName === team2))
        ) {
          switch (info) {
            default: {
              if (fixtures[i].result) {
                var out = "<b>" + fixtures[i].homeTeamName + "</b> vs. <b>" + fixtures[i].awayTeamName + "</b> is <b>" + fixtures[i].status.toLowerCase() + "</b>: " + (fixtures[i].result.goalsHomeTeam + (fixtures[i].result.halfTime ? fixtures[i].result.halfTime.goalsHomeTeam : 0)) + " - " + (fixtures[i].result.goalsAwayTeam + (fixtures[i].result.halfTime ? fixtures[i].result.halfTime.goalsAwayTeam : 0));
                return out;
              } else
                return "I don't have any results for <b>" + fixtures[i].homeTeamName + "</b> vs. <b>" + fixtures[i].awayTeamName + "</b>...";
            }
          }

        }
      }
      return "Can't find the match, sorry.";
    }

    contact.onReceive = function(text) {
      var html = "",
        out = contextManager.testBySessionId(text == 1 ? "who is winning Premier League?" : text == 2 ? "which players in Liverpool FC" : text == 3 ? "jersey number is Kevin Stewart." : text, sessionId);

      sessionId = out.sessionId;
      var context = {
        competition: Bravey.Data.getEntityValue(out, "competition"),
        team: Bravey.Data.getEntityValue(out, "team"),
        team1: Bravey.Data.getEntityValue(out, "team1"),
        player: Bravey.Data.getEntityValue(out, "player", "_HE_")
      };

      if (out.result) {

        switch (out.result.intent) {
          case "competitionSet":
            {
              if (context.competition !== undefined) contact.say("Okay! Let's talk about <b>" + idx.competition[context.competition].caption + "</b>!")
              else contact.say("Which competition, please?")
              break;
            }
          case "competitionCurrentMatchDay":
            {
              if (context.competition !== undefined) contact.say("Current match day of <b>" + idx.competition[context.competition].caption + "</b> is <b>" + (idx.competition[context.competition].competitionCurrentMatchDay || "none") + "</b>.")
              else contact.say("Which competition, please?")
              break;
            }
          case "competitionHowManyGames":
            {
              if (context.competition !== undefined) contact.say("<b>" + idx.competition[context.competition].caption + "</b> has <b>" + idx.competition[context.competition].numberOfGames + "</b> games.")
              else contact.say("Which competition, please?")
              break;
            }
          case "competitionHowManyMatchdays":
            {
              if (context.competition !== undefined) contact.say("<b>" + idx.competition[context.competition].caption + "</b> match days are <b>" + idx.competition[context.competition].numberOfMatchdays + "</b>.")
              else contact.say("Which competition, please?")
              break;
            }
          case "competitionHowManyTeams":
            {
              if (context.competition !== undefined) contact.say("<b>" + idx.competition[context.competition].caption + "</b> teams are <b>" + idx.competition[context.competition].numberOfTeams + "</b>.")
              else contact.say("Which competition, please?")
              break;
            }
          case "competitionTable":
            {
              if (context.competition !== undefined) {
                contact.say("Let me see...");
                contact.setBusy(true);
                contact.request("GET", idx.competition[context.competition]._links.leagueTable.href, 0, function(table) {
                  contact.setBusy(false);
                  table = idx.table[context.competition] = JSON.parse(table).standing;
                  if (table) {
                    for (var i = 0; i < table.length; i++) {
                      html += table[i].position + ") <b>" + table[i].teamName + "</b> (" + table[i].points + "pts.)<br>";
                    }
                    contact.say("<b>" + idx.competition[context.competition].caption + "</b> table:<br>" + html);
                  } else contact.say("It looks like I don't have any data about this table, sorry.");
                });
              } else contact.say("Which competition, please?")
              break;
            }
          case "competitionFixtures":
            {
              if ((context.competition !== undefined) && (context.team !== undefined) && (context.team1 !== undefined)) {

                if (idx.fixtures[context.competition])
                  contact.say(showFixture(idx.fixtures[context.competition], context.team, context.team1));
                else {
                  contact.say("Let me see...");
                  contact.setBusy(true);
                  contact.request("GET", idx.competition[context.competition]._links.fixtures.href, 0, function(fixtures) {
                    contact.setBusy(false);
                    fixtures = idx.fixtures[context.competition] = JSON.parse(fixtures).fixtures;
                    contact.say(showFixture(idx.fixtures[context.competition], context.team, context.team1));
                  });
                }
              } else contact.say("Tell me at least a competition and two teams!");

              break;
            }
          case "competitionWhichTeam":
            {
              if (context.competition !== undefined) {
                contact.say("Let me see...");
                contact.setBusy(true);
                contact.request("GET", idx.competition[context.competition]._links.teams.href, 0, function(teams) {
                  contact.setBusy(false);
                  teams = JSON.parse(teams).teams;
                  var code;
                  for (var i = 0; i < teams.length; i++) {
                    html += "<b>" + teams[i].name + "</b>, ";
                    code = teams[i].name;
                    if (code && !idx.team[code]) {
                      idx.team[code] = teams[i];
                      if (teams[i].shortName) team.addMatch(code, teams[i].shortName);
                      if (teams[i].code) team.addMatch(code, teams[i].code);
                      if (teams[i].name) {
                        team.addMatch(code, teams[i].name);
                        for (var j = 0; j < ent.length; j++) team.addMatch(code, ent[j]);
                        for (var j = 0; j < ent.length - 1; j++) team.addMatch(code, ent[j] + " " + ent[j + 1]);
                      }
                    }
                  }
                  contact.say(teams.length + " teams are playing the <b>" + idx.competition[context.competition].caption + "</b> competition:<br>" + html.substr(0, html.length - 2) + ".");
                });
              } else contact.say("Which competition, please?")
              break;
            }
          case "teamWhichPlayers":
            {
              if (context.team !== undefined) {
                contact.say("Let me see...");
                contact.setBusy(true);
                contact.request("GET", idx.team[context.team]._links.players.href, 0, function(players) {
                  contact.setBusy(false);
                  var code;
                  players = JSON.parse(players).players;
                  for (var i = 0; i < players.length; i++) {
                    code = players[i].name + "-" + players[i].nationality;
                    html += "<b>" + players[i].name + "</b>, ";
                    if (!idx.player[code]) {
                      players[i].team = idx.team[context.team].name;
                      idx.player[code] = players[i];
                      player.addMatch(code, players[i].name);
                      ent = players[i].name.replace(/^[^a-zA-Z]*/g, "").split(/ /);
                      for (var j = 0; j < ent.length; j++) player.addMatch(code, ent[j]);
                      for (var j = 0; j < ent.length - 1; j++) player.addMatch(code, ent[j] + " " + ent[j + 1]);
                    }
                  }
                  contact.say("<b>" + idx.team[context.team].name + "</b> is:<br>" + html.substr(0, html.length - 2) + ".");
                });
              } else contact.say("Which team, please?")
              break;
            }
          case "playerWhoIs":
            {
              if (context.player !== undefined) contact.say("<b>" + idx.player[context.player].name + "</b> is the " + idx.player[context.player].position + " of " + idx.player[context.player].team + ".");
              else contact.say("Which player, please?")
              break;
            }
          case "playerPosition":
            {
              if (context.player !== undefined) contact.say("<b>" + idx.player[context.player].name + "</b> position is <b>" + idx.player[context.player].position + "</b>.");
              else contact.say("Which player, please?")
              break;
            }
          case "playerTeam":
            {
              if (context.player !== undefined) contact.say("<b>" + idx.player[context.player].name + "</b> is a <b>" + idx.player[context.player].team + "</b> player.");
              else contact.say("Which player, please?")
              break;
            }
          case "playerNationality":
            {
              if (context.player !== undefined) contact.say("<b>" + idx.player[context.player].name + "</b> is from <b>" + idx.player[context.player].nationality + "</b>.");
              else contact.say("Which player, please?")
              break;
            }
          case "playerJerseyNumber":
            {
              if (context.player !== undefined) contact.say("<b>" + idx.player[context.player].name + "</b> is the <b>" + idx.player[context.player].jerseyNumber + "</b>.");
              else contact.say("Which player, please?")
              break;
            }
          default:
            {
              contact.say("Can't understand...");
            }

        }

        contextManager.setSessionIdData(sessionId, context);

      } else contact.say("Can't understand...");
    }
  });
}