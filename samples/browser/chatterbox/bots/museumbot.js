window.BOTLoader = function(contact) {
  contact.setAvatar("avatar/museum.png");
  contact.setDescription("Ciao! Grazie a Bravey e gli open data di Regione Lombardia, posso cercare un museo il Lombardia per te! Prova a chiedermi qualcosa! Powered by https://www.dati.lombardia.it");
  contact.setTips(
    "<ul>" +
    "<li>Dimmi qualcosa con parcheggio e guardaroba, grazie!</li>" +
    "<li>Vorrei un museo con bar e che sia a Milano</li>" +
    "<li>E se fosse con abbonamento, avesse un pargheggio per disabili e fosse a Como?</li>" +
    "<li>Qualcosa con i bagni ed una biblioteca, per favore.</li>" +
    "<li>Che accetti la carta servizi e che sia gratuito</li>" +
    "<li>Un museo a pagamento con archivio</li>" +
    "<li>Possibilmente che offra acquisti online e che abbia un piano di fidelizzazione.</li>" +
    "<li>Lo voglio con un laboratorio di preparazione</li>" +
    "<li>Elencami quelli con laboratorio di restauro e fotografico a Milano</li>" +
    "<li>Vorrei quelli con bookshop e guardaroba, grazie</li>" +
    "<li>Un bel museo con area infanzia a Milano</li>" +
    "<li>Un museo con un'area di accoglienza!</li>" +
    "<li>Qualcosa dove non pagare ma che abbia il servizio educativo</li>" +
    "<li>Che fornisca un servizio di biblioteca e fototeca</li>" +
    "<li>Con depositi consultabili e servizi online</li>" +
    "<li>Che abbia prenotazione online e fototeca</li>" +
    "<li>Con archivi online</li>" +
    "<li>Di Etnografica e Antropologica</li>" +
    "<li>Della Scienza e Tecnica con parcheggio</li>" +
    "<li>Di Archeologia con archivo online</li>" +
    "<li>Di storia o arte e con fidelizzazione</li>" +
    "<li>A viggiu con parcheggio</li>" +
    "</ul>"
  );
  contact.request("GET", "data/opendata.json", 0, function(file) {
    // Replace the line above with the one below for true Regione Lombardia data fetching:
    // contact.request("GET", "https://www.dati.lombardia.it/api/views/3syc-54zf/rows.json?accessType=DOWNLOAD", 0, function(file) {

    db = JSON.parse(file);

    nlp = new Bravey.Nlp.Fuzzy("musei", {
      stemmer: Bravey.Language.IT.Stemmer,
      filter: Bravey.Filter.BasicFilter
    });
    var fields = {
      "tipologia_museo": true,
      "parcheggi_vicini": {
        "SI": ["parcheggio vicino", "parcheggio", "parcheggi"]
      },
      "parcheggi_pers_disabilita": {
        "SI": ["parcheggio per disabili", "disabili", "parcheggi per disabili"]
      },
      "biglietteria": {
        "SI": ["biglietteria"]
      },
      "guardaroba": {
        "SI": ["guardaroba"]
      },
      "area_accoglienza": {
        "SI": ["area accoglienza", "accoglienza"]
      },
      "bookshop": {
        "SI": ["bookshop"]
      },
      "caffetteria": {
        "SI": ["caffetteria", "bar"]
      },
      "area_assistenza_infanzia": {
        "SI": ["area infanzia", "infanzia"]
      },
      "laboratorio_fotografico": {
        "SI": ["laboratorio fotografico", "fotografico"]
      },
      "laboratorio_restauro": {
        "SI": ["laboratorio restauro", "restauro"]
      },
      "laboratorio_preparazione": {
        "SI": ["laboratorio preparazione", "preparazione"]
      },
      "laboratorio_analisi": {
        "SI": ["laboratorio analisi", "analisi"]
      },
      "servizi_igienici": {
        "SI": ["servizi igienici", "servizi", "bagni"]
      },
      "tipo_accesso_pers_disabilita": true,
      "gratuito_pagamento": {
        "GRATUITO": ["gratuito", "gratis", "non pagare"],
        "A PAGAMENTO": ["a pagamento", "pagamento", "pagare"]
      },
      "fidelizzazione": {
        "SI": ["fidelizzazione", "fidelizzato"]
      },
      "abbonamento": {
        "SI": ["abbonamento"]
      },
      "dotato_carta_servizi": {
        "SI": ["carta servizi"]
      },
      "servizio_educativo": {
        "SI": ["servizio educativo", "educazione"]
      },
      "biblioteca": {
        "SI": ["biblioteca"]
      },
      "fototeca": {
        "SI": ["fototeca"]
      },
      "archivio": {
        "SI": ["archivio"]
      },
      "depositi_consultabili": {
        "SI": ["depositi consultabili", "depositi"]
      },
      "disp_servizi_online": {
        "SI": ["servizi online", "online"]
      },
      "prenotazione_online": {
        "SI": ["prenotazione online"]
      },
      "acquisti_online": {
        "SI": ["acquisti online"]
      },
      "consultazione_archivi_online": {
        "SI": ["archivi online"]
      },
      "comune_sede": true,
      "email_sede": true,
    };

    var ent, intentText = "",
      intentArray = [],
      pri = 1000;
    for (var a in fields) {
      intentText += "{" + a + "} ";
      if (typeof fields[a] == "object") {
        ent = new Bravey.StringEntityRecognizer(a, pri);
        for (var b in fields[a]) {
          for (var c = 0; c < fields[a][b].length; c++)
            ent.addMatch(b, fields[a][b][c]);
        }
        nlp.addEntity(ent);
      }
    }

    nlp.addDocument("Vorrei un museo " + intentText, "museo", {
      fromTaggedSentence: true,
      expandIntent: true
    });

    var ents = {};
    columns = [];

    for (var i = 0; i < db.meta.view.columns.length; i++) columns[db.meta.view.columns[i].fieldName] = i;
    for (var j = 0; j < db.data.length; j++)
      for (var a in fields) {
        pri--;
        if (db.data[j][columns[a]])
          if (fields[a] === true) {
            if (!ents[a]) {
              ents[a] = new Bravey.StringEntityRecognizer(a, pri);
              nlp.addEntity(ents[a]);
            }
            ents[a].addMatch(db.data[j][columns[a]], db.data[j][columns[a]]);
            var tokens = Bravey.Text.tokenize(Bravey.Text.clean(db.data[j][columns[a]]));
            for (var i = 0; i < tokens.length; i++)
              if ((tokens[i].length > 3) && (tokens[i] !== "museo")) ents[a].addMatch(db.data[j][columns[a]], tokens[i]);
          } else if (typeof fields[a] == "function") {
          if (!ents[a]) {
            ents[a] = new Bravey.StringEntityRecognizer(a, pri);
            nlp.addEntity(ents[a]);
          }
          fields[a](db.data[j][columns[a]], ents[a]);
        }
      }

    contact.say("Ciao! Posso suggerirti un museo in Regione Lombardia in base alle tue necessit&agrave;. Non hai che da chiedere!")
    contact.setOnline(true);

    contact.onReceive = function(text) {
      var html, ent, out, show;
      if (nlp && (out = nlp.test(text, "anyEntity")) && out.entities.length) {
        var found, foundset, count = 0;
        for (var i = 0; i < db.data.length; i++) {
          foundset = {}, found = false;
          for (var j = 0; j < out.entities.length; j++) {
            found = true;
            ent = out.entities[j];
            if (db.data[i][columns[ent.entity]] == ent.value) foundset[ent.entity] = 1;
            else if (!foundset[ent.entity]) foundset[ent.entity] = 0;
          }
          for (var a in foundset)
            if (foundset[a] == 0) {
              found = false;
              break;
            }
          if (found) {
            show = {};
            count++;

            if (count == 1) contact.say("Ti suggerisco...");

            html = "<b>" + db.data[i][columns.denominazione_museo] + "</b><br>";
            html += '<iframe style="width:100%;height:170px;padding:10px 0 10px 0" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://maps.google.com/maps?q=' + db.data[i][columns.location][1] + ',' + db.data[i][columns.location][2] + '&hl=es;z=14&amp;output=embed"></iframe>';
            html += db.data[i][columns.indirizzo_sede] ? "<b>presso</b> " + db.data[i][columns.indirizzo_sede] + "<br>" : "";
            html += db.data[i][columns.descrizione_orari_apertura] ? "<b>Apertura:</b><br>" + db.data[i][columns.descrizione_orari_apertura].replace(/#/g, "<br>") + "<br>" : "";
            html += db.data[i][columns.chiusura_settimanale] ? "<b>Chiusura:</b><br>" + db.data[i][columns.chiusura_settimanale] + "<br>" : "";
            html += db.data[i][columns.note_spazi_servizio_pubblico] ? db.data[i][columns.note_spazi_servizio_pubblico] + "<br>" : "";
            html += db.data[i][columns.sito_web_sede] ? db.data[i][columns.sito_web_sede] : "";
            for (var j = 0; j < out.entities.length; j++) {
              ent = out.entities[j];
              if (!show[ent.entity]) {
                html += "<b>" + db.meta.view.columns[columns[ent.entity]].description + "</b>: " + db.data[i][columns[ent.entity]] + "<br>";
                show[ent.entity] = 1;
              }
            }
            contact.say(html);
            if (count > 2) break;
          }
        }
        if (count == 0) {
          html = "Spiacente... non ho trovato nulla. Ho cercato:<br><br>";
          for (var j = 0; j < out.entities.length; j++) {
            ent = out.entities[j];
            html += "<b>" + db.meta.view.columns[columns[ent.entity]].description + "</b>: " + ent.value + "<br>";
          }
          contact.say(html);
        }
      } else {
        contact.say("Non ho capito... Prova a riformulare la tua richiesta.");
      }
    }
  });

}