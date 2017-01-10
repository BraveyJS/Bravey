/**
 * A session manager to be used as sessionManager for {@link Bravey.ContextManager}. Stores session IDs in memory.
 * @param {Number} [extensions.sessionLength] - Session duration in milliseconds. (default is 600000 - 10 minutes)
 * @constructor
 */
Bravey.SessionManager.InMemorySessionManager = function(extensions) {
  if (!extensions) extensions = {};

  var sessions = {};
  var sessionLength = extensions.sessionLength || 600000;

  function getTimestamp() {
    return (new Date()).getTime();
  }

  function cleanSessions() {
    var now = getTimestamp();
    for (var a in sessions)
      if (now - sessions[a].timestamp > sessionLength) delete sessions[a];
  }

  function makeNewSession() {
    return {
      context: ["default"],
      data: {},
      timestamp: getTimestamp()
    };
  }

  /**
   * Reserves a new session ID. It also clear expired sessions.
   * @returns {string} The new session ID.
   */
  this.reserveSessionId = function(id) {
    if (id == undefined) {
      do {
        id = Bravey.Text.generateGUID();
      } while (sessions[id]);
    }
    cleanSessions();
    if (!sessions[id]) sessions[id] = makeNewSession();
    return id;
  }

  /**
   * Keep a session alive, resetting expiration time.
   * @param {string} sessionid - The session ID.
   * @returns {boolean} True if sessionid is found and kept alive.
   */
  this.keepAlive = function(sessionid) {
    if (sessions[sessionid]) {
      sessions[sessionid].timestamp = getTimestamp();
      return true;
    } else
      return false;
  }

  /**
   * Set context for the specified session ID. Updates the user timestamp, preventing session expiring.
   * @param {string} sessionid - The session ID.
   * @param {string[]} contexttags - The context tags to be set.
   * @returns {boolean} True if sessionid is found and context is set.
   */
  this.setContext = function(sessionid, contexttags) {
    if (sessions[sessionid]) {
      sessions[sessionid].context = contexttags;
      this.keepAlive(sessionid);
      return true;
    } else return false;
  }

  /**
   * Set context data for the specified session ID. Updates the user timestamp, preventing session expiring.
   * @param {string} sessionid - The session ID.
   * @param {Object} data - Key/value pair for data to be set.
   * @returns {boolean} True if sessionid is found and context is set.
   */
  this.setData = function(sessionid, data) {
    if (sessions[sessionid]) {
      for (var a in data) sessions[sessionid].data[a] = data[a];
      this.keepAlive(sessionid);
      return true;
    } else return false;
  }

  /**
   * Empty context data for the specified session ID. Updates the user timestamp, preventing session expiring.
   * @param {string} sessionid - The session ID.
   * @returns {boolean} True if sessionid is found and context is set.
   */
  this.clearData = function(sessionid, data) {
    if (sessions[sessionid]) {
      sessions[sessionid].data = {};
      this.keepAlive(sessionid);
      return true;
    } else return false;
  }

  /**
   * Get context for the specified session ID.
   * @param {string} sessionid - The session ID.
   * @returns {string[]} The related contexts.
   */
  this.getContext = function(sessionid) {
    if (sessions[sessionid]) return sessions[sessionid].context;
  }

  /**
   * Get context data for the specified session ID.
   * @param {string} sessionid - The session ID.
   * @returns {string[]} The related data.
   */
  this.getData = function(sessionid) {
    if (sessions[sessionid]) return sessions[sessionid].data;
  }

}