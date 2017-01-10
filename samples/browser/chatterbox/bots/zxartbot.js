window.BOTLoader = function(contact) {
  var curyear = (new Date()).getFullYear();

  contact.setAvatar("avatar/spectrum.jpg");
  contact.setDescription("Discover the art of the epic 80s home computer ZX Spectrum, in pictures and music! Powered by http://zxart.ee");
  contact.setTips(
    "<ul>" +
    "<li>Something from 2015</li>" +
    "<li>some good music from 2015</li>" +
    "<li>some good music from 2 years ago</li>" +
    "<li>videogame art of 2014</li>" +
    "<li>any image now</li>" +
    "<li>Art that's good from " + curyear + "</li>" +
    "<li>Something rated 3 from " + (curyear - 1) + "</li>" +
    "<li>Why not some bad music from " + (curyear - 2) + "?</li>" +
    "<li>Something better, please</li>" +
    "<li>Something less good is ok.</li>" +
    "<li>How single channel music is?</li>" +
    "<li>Multichannel music now.</li>" +
    "<li>Play some nice music.</li>" +
    "</ul>"
  );

  var nlp = new Bravey.Nlp.Fuzzy("art", {
    stemmer: Bravey.Language.EN.Stemmer,
    filter: Bravey.Filter.BasicFilter
  });

  var year = new Bravey.StringEntityRecognizer("year");
  for (var i = 0; i < 10; i++) {
    year.addMatch(curyear - i, "" + (curyear - i));
    if (i) {
      year.addMatch(curyear - i, i + " years ago");
      year.addMatch(curyear - i, i + " year ago");
    }
  }
  year.addMatch(curyear - 1, "last year");
  year.addMatch(curyear, "this year");
  nlp.addEntity(year);

  var context = new Bravey.StringEntityRecognizer("context");
  context.addMatch("art", "art");
  context.addMatch("art", "picture");
  context.addMatch("art", "pictures");
  context.addMatch("art", "images");
  context.addMatch("art", "show");
  context.addMatch("art", "gfx");
  context.addMatch("music", "music");
  context.addMatch("music", "audio");
  context.addMatch("music", "sound");
  context.addMatch("music", "play");
  nlp.addEntity(context);

  var rating = new Bravey.StringEntityRecognizer("rating");
  rating.addMatch(5, "5");
  rating.addMatch(4, "4");
  rating.addMatch(3, "3");
  rating.addMatch(2, "2");
  rating.addMatch(1, "1");
  rating.addMatch(5, "perfect");
  rating.addMatch(5, "very good");
  rating.addMatch(4, "good");
  rating.addMatch(4, "very nice");
  rating.addMatch(3, "nice");
  rating.addMatch(2, "bad");
  rating.addMatch(1, "very bad");
  rating.addMatch(1, "ugly");
  nlp.addEntity(rating);

  var ratingdelta = new Bravey.StringEntityRecognizer("ratingdelta");
  ratingdelta.addMatch(1, "better");
  ratingdelta.addMatch(1, "nicer");
  ratingdelta.addMatch(-1, "less good");
  nlp.addEntity(ratingdelta);

  var channels = new Bravey.StringEntityRecognizer("channels");
  channels.addMatch("single channel", "1 channel");
  channels.addMatch("single channel", "one channel");
  channels.addMatch("single channel", "single channel");
  channels.addMatch("single channel", "beeper");
  channels.addMatch("multi channel", "multichannel");
  channels.addMatch("multi channel", "multi channel");
  channels.addMatch("multi channel", "multiple channels");
  channels.addMatch("multi channel", "multiple channel");
  nlp.addEntity(channels);

  var imagetype = new Bravey.StringEntityRecognizer("imagetype");
  imagetype.addMatch("from games", "videogames");
  imagetype.addMatch("from games", "videogame");
  imagetype.addMatch("from games", "games");
  imagetype.addMatch("any type", "any image");
  imagetype.addMatch("any type", "any image");
  imagetype.addMatch("any type", "all images");
  imagetype.addMatch("any type", "all pictures");
  nlp.addEntity(imagetype);

  var sessionId, contextManager = new Bravey.ContextManager();
  contextManager.addNlp(nlp, ["default"], "anyEntity");

  contact.say("Limits make art better. ZX Spectrum had plenty of them and it's art is fascinating still today. Just ask me for music or images made in the years - I'll show you that's true.");
  contact.setOnline(true);

  contact.onReceive = function(text) {
    var html = "",
      out = contextManager.testBySessionId(text, sessionId);
    sessionId = out.sessionId;
    var context = {
      context: Bravey.Data.getEntityValue(out, "context") || "art",
      year: Bravey.Data.getEntityValue(out, "year") || curyear,
      rating: Bravey.Data.getEntityValue(out, "rating") || 3,
      channels: Bravey.Data.getEntityValue(out, "channels") || "multi channel",
      imagetype: Bravey.Data.getEntityValue(out, "imagetype") || "any type",
    };

    if (out && out.result.intent) {

      if (out.result.entitiesIndex.ratingdelta) context.rating += out.result.entitiesIndex.ratingdelta.value;
      if (context.rating < 1) context.rating = 1;
      if (context.rating > 5) context.rating = 5;
      contact.setBusy(true);
      switch (context.context) {
        case "art":
          {

            contact.say("Looking for some ZX Spectrum art " + context.imagetype + " from " + context.year + " that is rated " + context.rating + "...");
            contact.request("GET", "http://zxart.ee/api/action:filter/types:zxPicture/export:zxPicture/language:eng/start:0/limit:50/order:votes,desc/filter:zxPictureYear=" + context.year + ";zxPictureMinRating=" + context.rating + ";" + (context.imagetype == "from games" ? "zxPictureTagsInclude=Game%20graphics;" : ""), 0, function(data) {
              contact.setBusy(false);
              data = JSON.parse(data);
              var cnt = data.responseData.zxPicture.length,
                tmp = 0,
                p1;
              for (var i = 0; i < cnt; i++) {
                p1 = Math.floor(Math.random() * cnt)
                tmp = data.responseData.zxPicture[i];
                data.responseData.zxPicture[i] = data.responseData.zxPicture[p1];
                data.responseData.zxPicture[p1] = tmp;
              }
              if (cnt > 3) cnt = 3;
              if (cnt)
                for (var i = 0; i < cnt; i++)
                  contact.say("<img src='" + data.responseData.zxPicture[i].imageUrl + "'><br><a href='" + data.responseData.zxPicture[i].url + "' target=_blank>" + data.responseData.zxPicture[i].title + "</a>")
              else
                contact.say("Can't find anything...");
            });
            break;
          }
        case "music":
          {
            contact.say("Looking for some ZX Spectrum " + context.channels + " music from " + context.year + " that is rated " + context.rating + "...");
            contact.request("GET", "http://zxart.ee/api/action:filter/types:zxMusic/export:zxMusic/language:eng/start:0/limit:50/order:votes,asc/filter:zxMusicYear=" + context.year + ";zxMusicMinRating=" + context.rating + ";" + (context.channels == "single channel" ? "zxMusicFormatGroup=beeper;" : ""), 0, function(data) {
              contact.setBusy(false);
              data = JSON.parse(data);
              var cnt = data.responseData.zxMusic.length,
                tmp = 0,
                p1;
              for (var i = 0; i < cnt; i++) {
                p1 = Math.floor(Math.random() * cnt)
                tmp = data.responseData.zxMusic[i];
                data.responseData.zxMusic[i] = data.responseData.zxMusic[p1];
                data.responseData.zxMusic[p1] = tmp;
              }
              if (cnt > 3) cnt = 3;
              if (cnt)
                for (var i = 0; i < cnt; i++)
                  contact.say("<a href='" + data.responseData.zxMusic[i].autoplayUrl + "' target=_blank>" + data.responseData.zxMusic[i].title + "</a> (" + data.responseData.zxMusic[i].time + ")")
              else
                contact.say("Can't find anything...");
            });
            break;
          }
      }

      contextManager.setSessionIdData(sessionId, context);
    } else contact.say("Sorry. Can't understand...");
  }

}