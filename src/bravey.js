/**
 * The main namespace.
 * @namespace
 */
var Bravey = {
  REVISION: '0.1'
};

//

if (typeof define === 'function' && define.amd) {

  define('Bravey', Bravey);

} else if ('undefined' !== typeof exports && 'undefined' !== typeof module) {

  module.exports = Bravey;

}

//

/* Internal data storage. */
Bravey.DATA = {};

/**
 * Language specific functions.
 * @namespace
 */
Bravey.Language = {};

/**
 * Natural language processors.
 * @namespace
 */
Bravey.Nlp = {};

/**
 * Token filters.
 * @namespace
 */
Bravey.Filter = {};

/**
 * Session managers.
 * @namespace
 */
Bravey.SessionManager = {};

/**
 Defines an entity.
 @typedef Entity
 @type {Object}
 @property {string} entity The entity type.
 @property {string} string The raw text representing the entity.
 @property {number} position The entity position in a sentence.
 @property {any} value The entity logic value.
 @property {number} priority The entity relative priority. 
*/