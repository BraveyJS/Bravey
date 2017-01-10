window.BOTLoader = function(contact) {
  contact.setAvatar("avatar/poet.png");
  contact.setDescription("I know something about poetry. Just ask! Powered by http://poetrydb.org");
  contact.setTips(
    "<ul>" +
    "<li>Which poets do you know?</li>" +
    "<li>Something by William Shakespeare, please.</li>" +
    "<li>Which operas by him you know?</li>" +
    "<li>Read me didst thou promise</li>" +
    "</ul>"
  );

  contact.request("GET", "http://poetrydb.org/author", 0, function(authors) {
    authors = JSON.parse(authors).authors;
    contact.request("GET", "http://poetrydb.org/title", 0, function(titles) {

      titles = JSON.parse(titles).titles;

      var spl, nlp = new Bravey.Nlp.Fuzzy("poetbot", {
        stemmer: Bravey.Language.EN.Stemmer,
        filter: Bravey.Filter.BasicFilter
      });
      nlp.setConfidence(0.65);

      var poetEntity = new Bravey.StringEntityRecognizer("author", 100);
      for (var i = 0; i < authors.length; i++) {
        poetEntity.addMatch(authors[i], Bravey.Text.clean(authors[i]));
        spl = Bravey.Text.tokenize(authors[i]);
        for (var j = 0; j < spl.length; j++)
          if (spl[j].length > 3) poetEntity.addMatch(authors[i], spl[j]);
      }
      poetEntity.addMatch("_HIM_", "his");
      poetEntity.addMatch("_HIM_", "him");
      poetEntity.addMatch("_HIM_", "her");
      nlp.addEntity(poetEntity);

      var titleEntity = new Bravey.StringEntityRecognizer("title", 100);
      for (var i = 0; i < titles.length; i++) {
        titleEntity.addMatch(titles[i], Bravey.Text.clean(titles[i]));
        spl = Bravey.Text.tokenize(titles[i]);
        for (var j = 0; j < spl.length - 3; j++) titleEntity.addMatch(titles[i], spl[j] + " " + spl[j + 1] + " " + spl[j + 2]);
      }
      nlp.addEntity(titleEntity);

      nlp.addDocument("Who do you know?", "authorslist", {
        fromTaggedSentence: true,
        expandIntent: true
      });
      nlp.addDocument("Which authors you know?", "authorslist", {
        fromTaggedSentence: true,
        expandIntent: true
      });
      nlp.addDocument("The name of the authors", "authorslist", {
        fromTaggedSentence: true,
        expandIntent: true
      });

      nlp.addDocument("Something by {author}", "randompoetry", {
        fromTaggedSentence: true,
        expandIntent: true
      });
      nlp.addDocument("Read me something by {author}", "randompoetry", {
        fromTaggedSentence: true,
        expandIntent: true
      });
      nlp.addDocument("A Random poetry by {author}", "randompoetry", {
        fromTaggedSentence: true,
        expandIntent: true
      });
      nlp.addDocument("Random stuff by {author}", "randompoetry", {
        fromTaggedSentence: true,
        expandIntent: true
      });

      nlp.addDocument("All operas written by {author}", "operalist", {
        fromTaggedSentence: true,
        expandIntent: true
      });
      nlp.addDocument("Which operas by {author} do you know", "operalist", {
        fromTaggedSentence: true,
        expandIntent: true
      });
      nlp.addDocument("Poetry list by {author}", "operalist", {
        fromTaggedSentence: true,
        expandIntent: true
      });
      nlp.addDocument("List of {author} written poetry", "operalist", {
        fromTaggedSentence: true,
        expandIntent: true
      });

      nlp.addDocument("Read me {title}", "singleopera", {
        fromTaggedSentence: true,
        expandIntent: true
      });

      var sessionId, contextManager = new Bravey.ContextManager();
      contextManager.addNlp(nlp);

      contact.say("Let's talk about literature. Do you want to know the poets I know? A specific or random opera? Just ask!");
      contact.setOnline(true);

      contact.onReceive = function(text) {
        var html = "",
          out = contextManager.testBySessionId(text, sessionId);

        if (out.result) {

          sessionId = out.sessionId;
          var context = {
            author: Bravey.Data.getEntityValue(out, "author", "_HIM_"),
            title: Bravey.Data.getEntityValue(out, "title"),
          };

          switch (out.result.intent) {
            case "authorslist":
              {
                contact.say("I know...");
                for (var i = 0; i < authors.length; i++) html += authors[i] + "<br>";
                contact.say(html);
                break;
              }
            case "randompoetry":
              {
                if (context.author) {
                  contact.setBusy(true);
                  contact.request("GET", "http://poetrydb.org/author/" + encodeURIComponent(context.author), 0, function(json) {
                    json = JSON.parse(json);
                    contact.setBusy(false);
                    var rnditem = json[Math.floor(Math.random() * json.length)];
                    context.title = rnditem.title;
                    html = "What about <b>" + context.title + "</b> by <b>" + context.author + "</b>?<br><br>";
                    html += "<i>" + rnditem.lines.join("<br>") + "</i>";
                    contact.say(html);
                  });
                } else contact.say("Please, specify a poet.");
                break;
              }
            case "operalist":
              {
                if (context.author) {
                  contact.setBusy(true);
                  contact.request("GET", "http://poetrydb.org/author/" + encodeURIComponent(context.author), 0, function(json) {
                    json = JSON.parse(json);
                    contact.setBusy(false);
                    html = "By <b>" + context.author + "</b> I know:<br><br>";
                    for (var i = 0; i < json.length; i++) html += json[i].title + "<br>";
                    contact.say(html);
                  });
                } else contact.say("Please, specify a poet.");
                break;
              }
            case "singleopera":
              {
                if (context.title) {
                  contact.setBusy(true);
                  contact.request("GET", "http://poetrydb.org/title/" + encodeURIComponent(context.title), 0, function(json) {
                    json = JSON.parse(json)[0];
                    contact.setBusy(false);
                    lastauthor = json.author;
                    html = "<b>" + json.title + "</b> by <b>" + json.author + "</b>: <br><br>";
                    html += "<i>" + json.lines.join("<br>") + "</i>";
                    contact.say(html);
                  });
                } else contact.say("Please, specify a title.");
                break;
              }
          }

          contextManager.setSessionIdData(sessionId, context);

        } else contact.say("Can't understand...");
      }
    });
  });

}