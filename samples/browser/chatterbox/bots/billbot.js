window.BOTLoader = function(contact) {
  contact.setAvatar("avatar/cart.png");
  contact.setDescription("...");
  contact.setTips("...");

  contact.request("GET", (contact.root + "data/prices." + contact.settings.language + ".json").toLowerCase(), 0, function(prices) {
    prices = JSON.parse(prices);
    TRANSLATION = prices.translations;

    contact.setName(TRANSLATION.botname);
    contact.setAvatar("avatar/cart.png");
    contact.setDescription(TRANSLATION.botdescription);
    contact.setTips(TRANSLATION.bottips);

    var sessionId, contextManager = new Bravey.ContextManager();

    var freetextnlp = new Bravey.Nlp.Sequential("getdescription", {
      stemmer: Bravey.Language[TRANSLATION.symbol].Stemmer,
      filter: Bravey.Filter.BasicFilter
    });

    var action = new Bravey.StringEntityRecognizer("action", 200);
    for (var a in TRANSLATION.freetextnlpActions)
      for (var i = 0; i < TRANSLATION.freetextnlpActions[a].length; i++)
        action.addMatch(a, TRANSLATION.freetextnlpActions[a][i]);
    freetextnlp.addEntity(action);

    var text = new Bravey.Language[TRANSLATION.symbol].FreeTextEntityRecognizer("text");
    freetextnlp.addEntity(text);

    freetextnlp.addIntent("modifylist", [{
      entity: "action",
      id: "action"
    }, {
      entity: "text",
      id: "text"
    }]);
    freetextnlp.addIntent("modifylist", [{
      entity: "action",
      id: "action"
    }, {
      entity: "text",
      id: "text"
    }, {
      entity: "action",
      id: "action1"
    }, {
      entity: "text",
      id: "text1"
    }]);

    for (var a in TRANSLATION.freetextnlp)
      freetextnlp.addDocument(TRANSLATION.freetextnlp[a].sentence, TRANSLATION.freetextnlp[a].intent);
    contextManager.addNlp(freetextnlp);

    var reference = new Bravey.EMailEntityRecognizer("reference", 200);

    var quantity = new Bravey.Language[TRANSLATION.symbol].NumberEntityRecognizer("amount");

    var action = new Bravey.StringEntityRecognizer("action", 200);
    for (var a in TRANSLATION.nlpActions)
      for (var i = 0; i < TRANSLATION.nlpActions[a].length; i++)
        action.addMatch(a, TRANSLATION.nlpActions[a][i]);

    var nlp = new Bravey.Nlp.Fuzzy("switchtype", {
      stemmer: Bravey.Language[TRANSLATION.symbol].Stemmer,
      filter: Bravey.Filter.BasicFilter
    });
    nlp.setConfidence(0.65);

    var types = new Bravey.StringEntityRecognizer("type", 200);
    for (var a in prices.dictionary.types)
      for (var i = 0; i < prices.dictionary.types[a].length; i++) types.addMatch(a, prices.dictionary.types[a][i]);
    nlp.addEntity(types);

    for (var a in TRANSLATION.nlp)
      nlp.addDocument(TRANSLATION.nlp[a].sentence, TRANSLATION.nlp[a].intent, {
        fromTaggedSentence: true,
        expandIntent: true
      });

    contextManager.addNlp(nlp);

    for (var a in prices.data) {
      var nlp = new Bravey.Nlp.Fuzzy(a, {
        stemmer: Bravey.Language[TRANSLATION.symbol].Stemmer,
        filter: Bravey.Filter.BasicFilter
      });
      var entry = new Bravey.StringEntityRecognizer("entry", 100);
      for (var b in prices.data[a].entries)
        for (var c = 0; c < prices.dictionary.entries[b].length; c++) entry.addMatch(b, prices.dictionary.entries[b][c]);
      nlp.addEntity(quantity);
      nlp.addEntity(entry);
      nlp.addEntity(action);
      nlp.addEntity(reference);
      nlp.addDocument("{action} {amount} {entry} {reference}", "modifylist", {
        fromTaggedSentence: true,
        expandIntent: true
      });
      contextManager.addNlp(nlp, [a], "anyEntity");
    }

    contact.setOnline(true);

    html = TRANSLATION.intro;
    for (var a in prices.dictionary.types) html += "<b>" + a + "</b>, ";
    contact.say(html.substr(0, html.length - 2) + ".");

    function summary(context) {
      var prod;
      var html = TRANSLATION.wehave + "<br><br>";
      for (var a in context.list) {
        html += "<b>" + a + "</b>: " + context.list[a] + "<br>";
        prod = true;
      }
      if (!prod) html += "<i>" + TRANSLATION.listempty + "</i><br>"
      html += "<br>";
      html += (context.reference ? TRANSLATION.customeris + " <b>" + context.reference + "</b>" : TRANSLATION.unknownaddress) + "<br>";
      html += (context.description ? TRANSLATION.descriptionis + " <i>\"" + context.description + "\"</i>" : TRANSLATION.unknowndescription) + "<br>";
      return html + "<br>" + TRANSLATION.suggestions;
    }

    contact.onReceive = function(text) {
      var html = "",
        out = contextManager.testBySessionId(text, sessionId);
      if (out.result) {
        sessionId = out.sessionId;
        var context = {
          type: Bravey.Data.getEntityValue(out, "type"),
          list: out.sessionData.list || {},
          reference: out.sessionData.reference,
          description: Bravey.Data.getEntityValue(out, "description"),
          name: Bravey.Data.getEntityValue(out, "name")
        };

        switch (out.result.intent) {
          case "switchtype":
            {
              context.list = {};
              contextManager.setSessionIdContext(sessionId, ["default", context.type]);
              contact.say(TRANSLATION.startshopping + " <b>" + context.type + "</b>.");
              contact.say(summary(context));
              break;
            }
          case "catalogue":
            {
              if (context.type) {
                html += TRANSLATION.canbuy + "<br><br>";
                for (var a in prices.data[context.type].entries) html += "<b>" + a + "</b> " + TRANSLATION.currency + " " + prices.data[context.type].entries[a] + " cad.<br>";
                contact.say(html);
              } else contact.say(TRANSLATION.missingdepartment)
              break;
            }
          case "confirm":
            {
              if (context.type) {
                html = TRANSLATION.confirmintro + " <b>" + context.type + "</b>.<br><br><table border=1 style='background-color:#fff'><tr style='font-weight:bold'><td>" + TRANSLATION.columndescription + "</td><td>" + TRANSLATION.columnprice + "</td><td>" + TRANSLATION.columnquantity + "</td><td>" + TRANSLATION.columntotal + "</td></tr>";
                var total = 0,
                  sub = 0,
                  template = {
                    type: context.type,
                    reference: context.reference || TRANSLATION.noreference,
                    description: context.description || TRANSLATION.nodescription,
                    name: context.name || TRANSLATION.noname,
                    list: [],
                    footers: []
                  };

                for (var a in prices.data[context.type].entries) {
                  var cuni = TRANSLATION.currency + " " + (prices.data[context.type].entries[a] ? prices.data[context.type].entries[a] : "-");
                  if (context.list[a]) {
                    sub = prices.data[context.type].entries[a] * context.list[a];
                    template.list.push([a, cuni, context.list[a], TRANSLATION.currency + " " + sub]);
                    total += sub;
                  } else {
                    template.list.push([a, cuni, "0", TRANSLATION.currency + " 0"]);
                  }
                }
                total = Math.ceil(total * 100) / 100;

                template.footers.push([TRANSLATION.total, TRANSLATION.currency + " " + total]);
                if (prices.data[context.type].discount) {
                  template.footers.push([TRANSLATION.discount, prices.data[context.type].discount + "%"]);
                  total = total - Math.ceil((total / 100) * prices.data[context.type].discount);
                  total = Math.ceil(total * 100) / 100;
                  template.footers.push([TRANSLATION.total, TRANSLATION.currency + " " + total]);
                }

                for (var i = 0; i < template.list.length; i++)
                  html += "<tr><td>" + template.list[i][0] + "</td><td>" + template.list[i][1] + "</td><td>" + template.list[i][2] + "</td><td>" + template.list[i][3] + "</td></tr>";

                for (var i = 0; i < template.footers.length; i++)
                  html += "<tr><td colspan=3>" + template.footers[i][0] + "</td><td>" + template.footers[i][1] + "</td></tr>";

                html += "</table><br>";
                html += (context.reference ? "<b>" + TRANSLATION.customer + ":</b> <a target=_blank href='mailto:" + context.reference + "'>" + context.reference + "</a>" : "<i>" + TRANSLATION.nospecifiedcustomer + "</i>") + "<br>";
                html += (context.description ? "<b>" + TRANSLATION.description + ":</b> \"" + context.description + "\"" : "<i>" + TRANSLATION.nospecifieddescription + "</i>") + "<br>";
                contact.say(html);
              } else contact.say(TRANSLATION.missingdepartment)
              break;
            }
          case "modifylist":
            {
              if (context.type) {
                var action = "add",
                  actionlist = {},
                  referencemail, freetext, old, ok, amount = 1;
                out.result.entities.push({
                  entity: "action",
                  value: "*"
                })
                for (var i = 0; i < out.result.entities.length; i++) {
                  switch (out.result.entities[i].entity) {
                    case "action":
                      {
                        if (ok && (out.result.entities[i].value != action)) {
                          switch (action) {
                            case "remove":
                              {
                                if (ok) {
                                  html += TRANSLATION.removing + " ";
                                  for (var a in actionlist) {
                                    html += actionlist[a] + " <b>" + a + "</b>, ";
                                    old = context.list[a] || 0;
                                    context.list[a] = old - actionlist[a];
                                    if (context.list[a] <= 0) delete context.list[a];
                                  }
                                  html = html.substr(0, html.length - 2) + ". ";
                                }
                                break;
                              }
                            case "description":
                              {
                                if (ok) {
                                  context.description = freetext;
                                  html += TRANSLATION.setting + " <b>" + freetext + "</b> " + TRANSLATION.asdescription + ". ";
                                }
                                break;
                              }
                            case "reference":
                              {
                                if (ok) {
                                  context.reference = referencemail;
                                  html += TRANSLATION.setting + " <b>" + referencemail + "</b> " + TRANSLATION.asreference + ". ";
                                }
                                break;
                              }
                            default:
                              {
                                if (ok) {
                                  html += TRANSLATION.adding + " ";
                                  for (var a in actionlist) {
                                    html += actionlist[a] + " <b>" + a + "</b>, ";
                                    old = context.list[a] || 0;
                                    context.list[a] = old + actionlist[a];
                                  }
                                  html = html.substr(0, html.length - 2) + ". ";
                                }
                                break;
                              }
                          }
                        }
                        actionlist = {};
                        ok = false;
                        amount = 1;
                        action = out.result.entities[i].value;
                        break;
                      }
                    case "amount":
                      {
                        amount = out.result.entities[i].value;
                        break;
                      }
                    case "entry":
                      {
                        ok = true;
                        old = actionlist[out.result.entities[i].value] || 0;
                        actionlist[out.result.entities[i].value] = old + amount;
                        amount = 1;
                        break;
                      }
                    case "reference":
                      {
                        ok = true;
                        referencemail = out.result.entities[i].value;
                        break;
                      }
                    case "text":
                      {
                        ok = true;
                        freetext = out.result.entities[i].value;
                        break;
                      }
                  }
                }

                var action = out.result.entitiesIndex.action ? out.result.entitiesIndex.action.value : "add";
                if (html) contact.say(html);
                contact.say(summary(context));

              } else contact.say(TRANSLATION.missingdepartment)
              break;
            }
          case "none":
            {
              contact.say(TRANSLATION.cantunderstand);
              break;
            }
        }

        contextManager.setSessionIdData(sessionId, context);

      } else contact.say(TRANSLATION.whichdepartment)
    }
  });
}