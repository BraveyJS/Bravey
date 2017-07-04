var ChatterBox = function(parent, title, options) {
  var isMerged = 0;
  if (!options) options = {};
  if (!options.root) options.root = "";
  if (!options.responsiveClass)
    if (options.single) {
      switch (options.responsive) {
        case "merged":
          {
            isMerged = 1;
            options.responsiveClass = "merged single";
            break;
          }
        default:
          {
            options.responsiveClass = "single";
          }
      }
    } 
  else switch (options.responsive) {
    case "force":
      {
        options.responsiveClass = "forceresponsive";
        break;
      }
    case "yes":
      {
        options.responsiveClass = "responsive";
        break;
      }
    default:
      {
        options.responsiveClass = "";
      }
  }

  var self = this;
  var recognition = 0;
  var recognitionresult = "";
  var recognitionbutton = 0;
  var interacted = 0;

  function track(data) {
    if (window.ga && options.trackingId) {
      if (!window._trackstarted) {
        ga('create', options.trackingId);
        window._trackstarted = 1;
      }
      ga((options.trackingName ? options.trackingName + "." : "") + "send", data);
    }
  }
  track("pageview");

  function $(node, data, parent) {
    if (typeof node == "string") node = document.createElement(node);
    if (data) {
      if (data.set)
        for (var a in data.set) node[a] = data.set[a];
      if (data.css)
        for (var a in data.css) node.style[a] = data.css[a];
    }
    if (parent) parent.appendChild(node);
    return node;
  }

  function $sprite(data, parent) {
    var node = $("div");
    $(node, data, parent);
    return node;
  }

  function request(contact, method, url, data, callback) {
    var xhttp;
    if (window.XMLHttpRequest) xhttp = new XMLHttpRequest();
    else xhttp = new ActiveXObject("Microsoft.XMLHTTP");
    if (url.substr(0, 4).toLowerCase() == "http") {
      var encodedparms = "url=" + encodeURIComponent(url) + "&method=" + encodeURIComponent(method) + "&";
      if (data)
        if (data.header) encodedparms += "header=" + encodeURIComponent(JSON.stringify(data[a])) + "&";
      encodedparms = encodedparms.substr(0, encodedparms.length - 1);
      xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200)
          if (xhttp.responseText == "*NO*") {
            contact.say("Sorry! These hosted demos are limited and it looks like I can't reach third party data right now. Download and run Bravey on your own machine and try ChatterBox bots without limits!", "error");
            contact.lock(true);
          } else
            callback(xhttp.responseText);
      }
      xhttp.open("POST", options.root + "chatterbox.php", true);
      xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhttp.setRequestHeader("Content-length", encodedparms.length);
      xhttp.setRequestHeader("Connection", "close");
      xhttp.send(encodedparms);
    } else {
      if (data)
        if (data.header)
          for (var i in data.header) xhttp.setRequestHeader(i, data.header[i]);
      xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200)
          callback(xhttp.responseText);
      }
      xhttp.open(method, url, true);
      xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhttp.send();
    }
  }

  var container = $sprite({
    set: {
      className: "chatcontainer"
    }
  }, parent);
  var contactList = $sprite({
    set: {
      className: "contactlist"
    }
  }, container);
  var contactNode = $("div", {
    set: {
      className: "contactlistheader",
      innerHTML: title
    }
  }, contactList);
  $sprite({
    set: {
      className: "selectchat",
      innerHTML: "Choose a contact and start chatting!"
    }
  }, container);
  var selectedContact = 0;
  var contacts = [],
    selectedContact = 0,
    messagequeue = [],
    isloading = false,
    loadqueue = [];

  function stopTalk(abort) {
    if (recognitionbutton) recognitionbutton.innerHTML = "TALK";
    if (recognition) {
      if (!abort && selectedContact) selectedContact.inputtext.value = recognitionresult;
      recognitionresult = "";
      recognition.abort();
      recognition = 0;
      recognitionbutton = 0;
    }
  }

  function talk(hudbutton) {
    stopTalk(true);
    if (selectedContact && selectedContact.online && !recognition) {
      recognitionbutton = hudbutton;
      hudbutton.innerHTML = "GO!";
      recognition = new webkitSpeechRecognition();
      recognition.lang = selectedContact.language;
      recognition.onresult = function(event) {
        if (event && event.results && event.results.length)
          for (var i = 0; i < event.results.length; i++)
            if (event.results[i].isFinal) {
              var conf = -1;
              for (var j = 0; j < event.results[i].length; j++)
                if (conf < event.results[i][j].confidence) {
                  conf = event.results[i][j].confidence;
                  recognitionresult = event.results[i][j].transcript;
                }
            }
      }
      recognition.onerror = function(event) {
        stopTalk(true);
      }
      recognition.onend = function(event) {
        stopTalk();
      }
      recognition.start();
    }
  }

  function loadBot() {
    if (isloading) return;
    var contact = loadqueue[0];
    if (contact) {
      loadqueue.splice(0, 1);
      if (contact._bot) {
        contact._bot.loaded = 1;
        contact._updateStatus();
        isloading = true;
        delete window.BOTLoader;
        var head = document.getElementsByTagName("head")[0];
        var script = document.createElement("script");
        script.src = options.root + contact._bot.js;
        script.onload = function() {
          if (window.BOTLoader) window.BOTLoader(contact);
          isloading = false;
          loadBot();
        };
        head.appendChild(script);
      }
    }
  }

  function selectContact(contact) {
    stopTalk(true);
    self.goToChats();
    selectedContact = 0;
    for (var i = 0; i < contacts.length; i++)
      if (contacts[i] === contact) {
        if (contact._bot && !contact._bot.loaded && (loadqueue.indexOf(contact) == -1)) {
          track({
            hitType: "event",
            eventCategory: 'Bot',
            eventAction: 'requested',
            eventLabel: contact.name
          });
          loadqueue.push(contact);
          loadBot();
        }
        selectedContact = contact;
        $(contacts[i].contactNode, {
          set: {
            className: "contact selected"
          }
        });
        $(contacts[i].chatWindow, {
          css: {
            display: "block"
          }
        });
      } else {
        $(contacts[i].contactNode, {
          set: {
            className: "contact"
          }
        });
        $(contacts[i].chatWindow, {
          css: {
            display: "none"
          }
        });
      }
  }

  function getDocumentHeight() {
    var body = document.body,
      html = document.documentElement;
    return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
  }

  function getScrollTop() {
    return document.body.scrollTop || window.pageYOffset || document.documentElement.scrollTop || 0;
  }

  function setScrollTop(value) {
    return window.pageYOffset = document.documentElement.scrollTop = document.body.scrollTop = value;
  }

  this.addBot = function(js, name, avatar, language, description, settings) {
    var contact = this.addContact(name, description, avatar, language, settings);
    contact._bot = {
      js: js,
      loaded: 0
    };
    contact.setOnline(false);
  }

  this.ready = function() {
    if (options.single && (contacts.length == 1))
      contacts[0].select();
    else if (options.runbot)
      for (var i = 0; i < contacts.length; i++)
        if (contacts[i].name == options.runbot) contacts[i].select();
  }

  this.goToContacts = function() {
    container.className = "chatcontainer gotocontacts " + options.responsiveClass;
  }

  this.goToChats = function() {
    container.className = "chatcontainer gotochats " + options.responsiveClass;
  }

  this.addContact = function(name, description, avatar, language, settings) {
    var talkbutton;

    var contactNode = $("div", {
      set: {
        className: "contact"
      }
    }, contactList);
    var row1 = $("div", {
      set: {
        className: "row1"
      }
    }, contactNode);
    var contactAvatar = $sprite({
      set: {
        className: "contactavatar"
      }
    }, row1);

    var contactNameList = $sprite({
      set: {
        className: "contactnamelist"
      }
    }, row1);
    var statusRow = $sprite({
      set: {
        className: "statusrow"
      }
    }, contactNode);

    var chatWindow = $sprite({
      set: {
        className: "chatwindow"
      }
    }, container);

    var head = $sprite({
      set: {
        className: "head"
      }
    }, chatWindow);
    var chatAvatar = $sprite({
      set: {
        className: "chatavatar",
        onclick: options.single ? null : function() {
          interacted = true;
          self.goToContacts()
        }
      }
    }, head);
    var contactNameChat = $sprite({
      set: {
        className: "contactnamechat"
      }
    }, head);
    var descriptionbox = $sprite({
      set: {
        className: "descriptionbox"
      }
    }, head);

    var chatBody = $sprite({
      set: {
        className: "chatbody"
      }
    }, chatWindow);
    var chatTips = $("div", {
      set: {
        className: "chattips"
      }
    }, chatBody);

    var foot = $sprite({
      set: {
        className: "foot"
      }
    }, chatWindow);
    var inputarea = $("div", {
      set: {
        className: "inputarea"
      }
    }, foot);
    var inputtext = $("input", {
      set: {
        type: "text",
        className: "inputtext"
      }
    }, inputarea);

    function enter() {
      if (ret.online) {
        interacted = true;
        var text = inputtext.value;
        if (text) {
          track({
            hitType: "event",
            eventCategory: 'Bot',
            eventAction: 'messaged',
            eventLabel: ret.name
          });
          messagequeue.push({
            say: 0,
            html: text,
            chatBody: chatBody
          });
          if (ret.onReceive) ret.onReceive(text);
          inputtext.value = "";
        }
      }
    }

    inputtext.onkeydown = function(e) {
      if (e.keyCode == 13) enter();
    }
    $sprite({
      set: {
        innerHTML: "SEND",
        onclick: enter,
        className: "send"
      }
    }, foot);
    if (window.webkitSpeechRecognition)
      talkbutton = $sprite({
        set: {
          innerHTML: "TALK",
          onclick: function() {
            interacted = true;
            talk(talkbutton)
          },
          className: "talk"
        }
      }, foot);

    function updateStatus() {
      var bulletType, label, disabled, placeholder = "Write something...";
      statusRow.innerHTML = "";
      if (ret.locked) {
        bulletType = "unavailable";
        label = "unavailable";
        disabled = true;
        placeholder = "Sorry. Contact unavailable."
      } else if (ret.online) {
        if (ret.busy) {
          bulletType = "busy";
          label = "busy";
          disabled = true;
        } else {
          bulletType = "online";
          label = "online";
          disabled = false;
        }
      } else if (ret._bot && !ret._bot.loaded) {
        bulletType = "busy";
        label = "bot idle";
        disabled = true;
      } else if (ret._bot && (ret._bot.loaded == 1)) {
        bulletType = "busy";
        label = "bot loading...";
        disabled = true;
      } else {
        bulletType = "busy";
        label = "offline";
        disabled = true;
      }
      $("div", {
        set: {
          className: "bullet " + bulletType
        }
      }, statusRow);
      $("span", {
        set: {
          innerHTML: label
        }
      }, statusRow);
      $(inputtext, {
        set: {
          disabled: disabled,
          placeholder: placeholder
        }
      });
      if (interacted && !disabled && (selectedContact === ret)) inputtext.focus();
    }

    var ret = {
      settings: settings,
      language: language || "en-US",
      name: null,
      busy: false,
      locked: false,
      online: false,
      contactNode: contactNode,
      chatWindow: chatWindow,
      inputtext: inputtext,
      _updateStatus: updateStatus,
      root: options.root,
      say: function(html, type, callback) {
        messagequeue.push({
          say: 1,
          type: type,
          callback: callback,
          html: html,
          chatBody: chatBody
        });
      },
      setDescription: function(description) {
        descriptionbox.innerHTML = description;
      },
      setName: function(name) {
        this.name = name;
        contactNameChat.innerHTML = name;
        contactNameList.innerHTML = name;
      },
      setAvatar: function(avatar) {
        contactAvatar.style.backgroundImage = "url('" + options.root + avatar + "')";
        chatAvatar.style.backgroundImage = "url('" + options.root + avatar + "')";
      },
      setTips: function(tips) {
        chatTips.innerHTML = tips;
      },
      select: function() {
        selectContact(this)
      },
      setOnline: function(online) {
        this.online = online;
        updateStatus();
      },
      setBusy: function(busy) {
        this.busy = busy;
        updateStatus();
      },
      lock: function() {
        this.locked = true;
        updateStatus();
      },
      request: function(method, url, data, callback) {
        request(this, method, url, data, callback);
      }
    }
    contactNode.onclick = function() {
      interacted = true;
      ret.select();
    }
    ret.setOnline(false);
    if (description) ret.setDescription(description);
    if (name) ret.setName(name);
    if (avatar) ret.setAvatar(avatar);
    contacts.push(ret);
    return ret;
  }

  function checkNewMessages() {
    var newmessage = messagequeue[0];
    if (newmessage) {
      var msg, docHeight = getDocumentHeight();
      messagequeue.splice(0, 1);
      if (newmessage.say) {
        var sayType = "normal";
        switch (newmessage.type) {
          case "error":
            {
              sayType = "error";
              break;
            }
          case "notify":
            {
              sayType = "error";
              break;
            }
        }
        msg = $("div", {
          set: {
            className: "messagesay " + sayType,
            innerHTML: newmessage.html
          }
        }, newmessage.chatBody);
        $sprite({
          set: {
            className: "messagesaytriangle " + sayType
          }
        }, msg);
        if (newmessage.callback) newmessage.callback(msg);
      } else {
        msg = $("div", {
          set: {
            className: "message",
            innerHTML: newmessage.html
          }
        }, newmessage.chatBody);
        $sprite({
          set: {
            className: "messagetriangle"
          }
        }, msg);
      }
      setTimeout(function() {
        msg.style.opacity = 1;
        msg.style.transform = "translate(0,0)"
      }, 100);
      if (isMerged) {
        if (interacted) setScrollTop(getScrollTop() + getDocumentHeight() - docHeight);
      } else
        newmessage.chatBody.scrollTop = newmessage.chatBody.scrollHeight;
    }
    setTimeout(checkNewMessages, 1000);
  }

  this.goToContacts();
  checkNewMessages();

  return this;

}