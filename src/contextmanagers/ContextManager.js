/**
 * The Bravey context manager. Contexts are handled as tags for multiple NLP instances. It store user sessions contexts and query the right NLP when asked.
 * @param {SessionManager} [extensions.sessionManager] - An instance of a session manager. {@link Bravey.SessionManager.InMemorySessionManager} is used when not specified.
 * @constructor
 */
Bravey.ContextManager = function(extensions) {
  extensions = extensions || {};

  var defaultContexts = ["default"];
  var contexts = {};
  var parameters = {};
  var sessionManager = extensions.sessionManager || new Bravey.SessionManager.InMemorySessionManager(extensions);

  /**
   * Add a NLP instance to the context manager.
   * @param {NLP} nlp - The NLP instance.
   * @param {String[]} [contexttags=["default"]] - Related contexts tags.
   * @param {String} [method=undefined] - Method to be used with NLP test. (see {@link Bravey.Nlp.test})
   */
  this.addNlp = function(nlp, contexttags, method) {
    if (!contexttags) contexttags = defaultContexts;
    for (var i = 0; i < contexttags.length; i++) {
      if (!contexts[contexttags[i]]) {
        contexts[contexttags[i]] = [];
        parameters[contexttags[i]] = [];
      }
      if (contexts[contexttags[i]].indexOf(nlp) == -1) {
        contexts[contexttags[i]].push(nlp);
        parameters[contexttags[i]].push({
          method: method
        });
      }
    }
  }

  /**
   * Remove a NLP instance to the context manager.
   * @param {NLP} nlp - The NLP instance.
   * @param {String[]} [contexttags=all] - Related contexts tags. Will be removed from all contexts if empty.
   */
  this.removeNlp = function(nlp, contexttags) {
    var found;
    if (contexttags) {
      for (var i = 0; i < contexttags.length; i++)
        if ((found = contexts[contexttags[i]].indexOf(nlp)) != -1) {
          contexts[contexttags[i]].splice(found, 1);
          parameters[contexttags[i]].splice(found, 1);
        }
    } else
      for (var i in contexts)
        if ((found = contexts[i].indexOf(nlp)) != -1) {
          contexts[i].splice(found, 1);
          parameters[i].splice(found, 1);
        }
  }

  /**
   * Remove a context.
   * @param {String[]} contexttag - Tag to be deleted
   */
  this.removeContext = function(contexttag) {
    if (contexts[contexttag]) delete contexts[contexttag];
  }

  /**
   * Set the context for a given session ID.
   * @param {String} sessionid - User session ID.
   * @param {String[]} contexttag - Tag to be deleted
   * @returns {boolean} True if sessionid is found and context is set.
   */
  this.setSessionIdContext = function(sessionid, contexttag) {
    return sessionManager.setContext(sessionid, contexttag)
  }

  /**
   * Set context data for the specified session ID.
   * @param {string} sessionid - The session ID.
   * @param {Object} data - Key/value pair for data to be set.
   * @returns {boolean} True if sessionid is found and context is set.
   */
  this.setSessionIdData = function(sessionid, data) {
    return sessionManager.setData(sessionid, data);
  }

  /**
   * Empty context data for the specified session ID.
   * @param {string} sessionid - The session ID.
   * @returns {boolean} True if sessionid is found and context is set.
   */
  this.clearSessionIdData = function(sessionid) {
    return sessionManager.clearData(sessionid);
  }

  /**
   * Get context data for the specified session ID.
   * @param {string} sessionid - The session ID.
   * @returns {string[]} The related data.
   */
  this.getSessionIdData = function(sessionid) {
    return sessionManager.getData(sessionid);
  }

  /**
   * Reserves a new session ID. It also clear expired sessions.
   * @param {string} id - The session ID to be reserved. Generates a new one if not defined.
   * @returns {string} The new session ID.
   */
  this.reserveSessionId = function(id) {
    return sessionManager.reserveSessionId(id);
  }

  /**
   * Check if a given sentence matches an intent and extracts its entities using the specified contexts.
   * @param {string} text - The sentence to be processed.
   * @param {string[]} [text=["default"]] - The context tags.
   * @returns {ContextManagerResultByContext} When an intent is found.
   */
  this.testByContext = function(text, contexttags) {
    var ret = {
        result: false
      },
      found;
    if (!contexttags) contexttags = defaultContexts;
    for (var i = 0; i < contexttags.length; i++)
      if (contexts[contexttags[i]])
        for (var j = 0; j < contexts[contexttags[i]].length; j++) {
          found = contexts[contexttags[i]][j].test(text, parameters[contexttags[i]][j].method);
          if (!ret.result || (found.score && (found.score > ret.result.score) || ((found.score == ret.result.score) || (found.found > ret.result.found)))) {
            ret.result = found;
            ret.context = contexttags[i];
          }
        }
    return ret;
  }

  /**
   * Check if a given sentence matches an intent and extracts its entities using the specified user session ID. When not specified, a new session ID is generated.
   * @param {string} text - The sentence to be processed.
   * @param {string} [text=<new session id>] - The user session id.
   * @returns {ContextManagerResultBySessionId} When an intent is found.
   * @returns {false} When the sentence doesn't match any intent.	 
   */
  this.testBySessionId = function(text, sessionid) {
    var ok, found = {
      result: false
    };
    if (sessionid === undefined) ok = sessionid = sessionManager.reserveSessionId();
    else ok = sessionManager.keepAlive(sessionid);
    if (ok) {
      var contexttags = sessionManager.getContext(sessionid);
      found = this.testByContext(text, contexttags);
      found.sessionId = sessionid;
      found.sessionContext = contexttags;
      found.sessionData = sessionManager.getData(sessionid);
    }
    return found;
  }

}

/**
 Describes a match from a specific context. See {@link Bravey.ContextManager.testByContext} 
 @typedef ContextManagerResultByContext
 @type {Object}
 @property {NlpResult} result The result of a query.
 @property {string} context The matched context tag. <tt>undefined</tt> if no domain matched.
*/

/**
 Describes a match from a specific session ID. See {@link Bravey.ContextManager.testBySessionId} 
 @typedef ContextManagerResultBySessionId
 @type {Object}
 @property {NlpResult} result The result of a query.
 @property {string} context The matched context tag. <tt>undefined</tt> if no domain matched.
 @property {string} sessionId The session ID used for matching.
 @property {string} sessionContext The session context tags used for matching. <tt>undefined</tt> if no domain matched.
 @property {Object} sessionData The session data for the requested sessionId. <tt>undefined</tt> if no domain matched.
*/