window.BOTLoader = function(contact) {
  contact.setAvatar("avatar/pharma.png");
  contact.setDescription("...");
  contact.setTips("...");

  contact.request("GET", (contact.root + "data/medbot." + contact.settings.language + ".json?a=1").toLowerCase(), 0, function(database) {
    database = JSON.parse(database);

    contact.setDescription(database.description);
    contact.setTips(database.tips);

    contact.say(database.warning, "error");

    var sessionId, contextManager = new Bravey.ContextManager();

    function getMedLabel(html, data, skip) {
      if (data.photo) html = '<img src="' + data.photo + '" width=50> ' + html;
      for (var a in database.medFields)
        if ((data[a] !== undefined) && (!skip || !skip[a])) html += " " + database.medFields[a].prefix + " " + data[a];
      return html;
    }

    function formatTime(time) {
      var spl = time.split(":");
      return spl[0] + ":" + spl[1];
    }

    function replaceText(text, obj) {
      var html = text;
      html = html.replace(/\{medtype\}/g, obj.medtype);
      html = html.replace(/\{color\}/g, obj.color);
      html = html.replace(/\{time\}/g, formatTime(obj.time));
      return html;
    }

    function medSummary(context) {
      var html = "<table style='background-color:#fff; border-collapse: collapse; text-align:center; font-size: 15px;' cellpadding=5 border=1><tr style='font-weight:bold'><td>" + database.number + "</td><td>" + database.time + "</td><td>" + database.medicationTable + "</td></tr>";
      for (var i = 0; i < context.meds.length; i++) {
        var orario = context.meds[i].time.split(":");
        html += "<tr><td>" + (i + 1) + "</td><td>" + formatTime(context.meds[i].time) + "</td><td>" + getMedLabel(database.medication, context.meds[i], {
          time: 1
        }) + "</td></tr>";
      }
      html += "</table>";
      html += "<br>" + database.medsInfo;
      return html;
    }

    function getQuestion(prod) {
      for (var a in database.medFields)
        if (prod[a] === undefined) {
          return database.medFields[a].question;
          break;
        }
    }

    function pad(v, n) {
      v = "" + v;
      while (v.length < n) v = "0" + v;
      return v;
    }

    var medType = new Bravey.StringEntityRecognizer("medtype");
    for (var i in database.medType)
      for (var j in database.medType[i]) medType.addMatch(i, database.medType[i][j]);

    var color = new Bravey.StringEntityRecognizer("color");
    for (var i in database.color)
      for (var j in database.color[i]) color.addMatch(i, database.color[i][j]);

    var time = new Bravey.Language[database.symbol].TimeEntityRecognizer("time");
    var number = new Bravey.Language[database.symbol].NumberEntityRecognizer("number");

    var getMedNlp = new Bravey.Nlp.Fuzzy("getMed", {
      stemmer: Bravey.Language[database.symbol].Stemmer,
      filter: Bravey.Filter.BasicFilter
    });
    getMedNlp.addEntity(medType);
    getMedNlp.addEntity(color);
    getMedNlp.addEntity(time);
    getMedNlp.addEntity(number);
    for (var a in database.nlp)
      for (var i = 0; i < database.nlp[a].length; i++)
        getMedNlp.addDocument(database.nlp[a][i], a, {
          fromTaggedSentence: true,
          expandIntent: true
        });
    contextManager.addNlp(getMedNlp);

    for (var i = 0; i < database.bootstrap.length; i++)
      contact.say(database.bootstrap[i]);

    contact.say(database.suggestion);
    contact.setOnline(true);

    var lastCheck = "";
    setInterval(function() {
      var date = new Date();
      var check = pad(date.getHours(), 2) + ":" + pad(date.getMinutes(), 2) + ":00";
      if (sessionId && (check != lastCheck)) {
        var entries = contextManager.getSessionIdData(sessionId);
        if (entries && entries.meds) {
          var out = "";
          for (var i = 0; i < entries.meds.length; i++) {
            if (entries.meds[i].time == check)
              out += "<li>" + getMedLabel(database.theMedication, entries.meds[i], {
                time: 1
              }) + "</li>";
          }
          if (out) contact.say(database.alert + "<ul>" + out + "</ul>", "notify");
        }
        lastCheck = check;
      }
    }, 1000);

    contact.onReceive = function(text) {
      var html = "",
        out = contextManager.testBySessionId(text, sessionId);
      if (out.result) {
        sessionId = out.sessionId;
        var context = {
          newMed: out.sessionData.newMed || {},
          meds: out.sessionData.meds || []
        };
        switch (out.result.intent) {
          case "photoMed":
            {
              contact.say("", "", function(node) {
                if (document.getElementById("my_camera")) {
                  node.innerHTML = database.alreadyPhoto;
                } else {
                  node.innerHTML = database.photo + "<br><br><div id='my_camera' style='width:320px; height:240px;'></div><br>";
                  var trigger = document.createElement("input");
                  trigger.type = "button";
                  trigger.value = database.shoot;
                  trigger.onclick = function() {
                    Webcam.snap(function(data_uri) {
                      node.innerHTML = database.photoDone + '<br><br><img src="' + data_uri + '"/>';
                      Webcam.reset();
                      context = contextManager.getSessionIdData(sessionId);
                      context.newMed.photo = data_uri;
                      contextManager.setSessionIdData(sessionId, context);
                      var quest = getQuestion(context.newMed);
                      if (quest) contact.say(quest);
                    });
                  }
                  node.appendChild(trigger);
                  Webcam.on('error', function(err) {
                    node.innerHTML = database.cameraNotAvailable;
                  });
                  Webcam.set({
                    swfURL: 'libs/webcamjs/webcam.swf'
                  });
                  Webcam.attach('#my_camera');
                }
              });
              break;
            }
          case "newMed":
            {
              for (var a in database.medFields)
                if (out.result.entitiesIndex[a] !== undefined) context.newMed[a] = out.result.entitiesIndex[a].value;
              var check = getQuestion(context.newMed);
              if (check) html += check;
              else {
                html = replaceText(database.done, context.newMed);
                context.meds.push(context.newMed);
                context.newMed = {};
              }
              contact.say(html);
              break;
            }
          case "listMed":
            {
              if (context.meds.length) {
                html += database.list + "<br><br>" + medSummary(context);
              } else {
                html += database.emptyList;
              }
              contact.say(html);
              break;
            }
          case "deleteMed":
            {
              if (context.meds.length) {
                var id = out.result.entitiesIndex.number.value - 1;
                if (context.meds[id]) {
                  var removed = context.meds.splice(id, 1);
                  html = replaceText(database.deletedMed, removed[0]);
                } else {
                  html += database.cantFind + "<br><br>" + medSummary(context);
                }
              } else {
                html += database.noMeds + " " + database.suggestion;
              }
              contact.say(html);
              break;
            }
          case "introMed":
            {
              contact.say(database.introMed + "<br>" + database.suggestion);
              break;
            }
          case "closeMed":
            {
              contact.say(database.closeMed);
              break;
            }
          default:
            {
              contact.say(database.notUnderstand);
            }
        }
        contextManager.setSessionIdData(sessionId, context);

      } else contact.say(database.notUnderstand);
    };
  });
}