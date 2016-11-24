/**
 * Data manipulation related functions.
 * @namespace
 */
Bravey.Data = {};

/**
 * Extract entities or context values with the same name from a {@link Bravey.ContextManager.testBySessionId} call result.
 * @param {ContextManagerResultBySessionId} matchdata - The data returned by {@link Bravey.ContextManager.testBySessionId}.
 * @param {string} entityname - The data returned by {@link Bravey.ContextManager.testBySessionId}.
 * @param {string} [defaultvalue=undefined] - The matched entity value cosidered as "default". (i.e. if found, session data value is returned anyway)
 * @returns {string} The matching value.
 * @returns {undefined} If the entity name is not set in match or session.
 */
Bravey.Data.getEntityValue = function(matchdata, entityname, defaultvalue) {
  var found;
  if (matchdata) {
    if ((matchdata.result !== undefined) && (matchdata.result.entitiesIndex !== undefined) && (matchdata.result.entitiesIndex[entityname] !== undefined))
      found = matchdata.result.entitiesIndex[entityname].value;
    if (found == defaultvalue) found = undefined;
    if ((found == undefined) && (matchdata.sessionData !== undefined))
      found = matchdata.sessionData[entityname];
  }
  return found;
}

/**
 * Returns true if a {@link Bravey.ContextManager.testBySessionId} result contains the specified entity.
 * @param {ContextManagerResultBySessionId} matchdata - The data returned by {@link Bravey.ContextManager.testBySessionId}.
 * @param {string} entityname - The entity to be checked.
 * @returns {true} When the entity is specified.
 */
Bravey.Data.isExplicit = function(matchdata, entityname) {
  return (matchdata && (matchdata.result !== undefined) && (matchdata.result.entitiesIndex !== undefined) && (matchdata.result.entitiesIndex[entityname] !== undefined));
}