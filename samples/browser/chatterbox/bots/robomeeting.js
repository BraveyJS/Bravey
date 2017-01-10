window.BOTLoader = function(contact) {
  contact.setAvatar("avatar/meeting.jpg");
  contact.setDescription("Posso prenotare una sala riunioni per te. (per ora ti dir&ograve; cosa ho capito di ci&ograve; che scrivi)");

  apiai = new Bravey.ApiAiAdapter(contact.root + "../../apiai-packages/saleriunioni", {
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
    contact.say("Questo &egrave; un bot di test che ti permette di chiedere la disponibilit&agrave; di una particolare sala riunioni o di pi&ugrave; di esse (in questa demo sono la sala grande, sala piccola e la saletta) in una data, ora o fascia oraria specifica. Ti moster&ograve; i dati grezzi di ci&ograve; che ho capito.")
    contact.setOnline(true);
    contact.onReceive = function(text) {
      var html = "",
        out = apiai.nlp.test(text);
      if (out) {
        html += "<b>Intent:</b> <tt>" + out.intent + "</tt><br>";
        for (var a in out.entitiesIndex)
          html += "<b>Entity " + a + ":</b> <tt>" + JSON.stringify(out.entitiesIndex[a].value) + "</tt><br>";
        contact.say(html);
      } else contact.say("Non ho capito...");
    }
  });
}