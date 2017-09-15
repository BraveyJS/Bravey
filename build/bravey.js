// File:src/bravey.js

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
// File:src/extras/file.js

/**
 * File related functions.
 * @namespace
 */
Bravey.File = {};

/**
 * Loads a file from filesystem when run on Node.js or use XMLHttpRequest for downloading its content on browser.
 * @param {string} url - Position of the file to be loaded.
 * @param {Bravey.File.loadCallback} cb - Callback called after the file is loaded.
 * @param {string} [method="get"] - <tt>get</tt> or <tt>post</tt>
 * @param {object} [data] - Data to be sent
 * @todo Implements get/post and data sending.
 */
Bravey.File.load = function(url, cb, method, data) {

  if (typeof module !== 'undefined' && module.exports) {
    if (!Bravey.DATA.fs) Bravey.DATA.fs = require("fs");
    cb(Bravey.DATA.fs.readFileSync(url, 'utf8'));
  } else {
    var xmlhttp = null;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == 4)
        if (xmlhttp.status == 200)
          cb(xmlhttp.responseText);
        else
          cb();

    }

    xmlhttp.open(method || "GET", url);
    xmlhttp.send(null);
  }
}

/**
 * Called when the file loader data is ready.
 * @callback Bravey.File.loadCallback
 * @param {string} text - The returned file content or <tt>undefined</tt> on error.
 */
// File:src/extras/text.js

/**
 * Text parsing and tokenizing related functions.
 * @namespace
 */
Bravey.Text = {};

Bravey.Text.WORDSEP = "[^(a-zA-ZA-Яa-я0-9_!?.:)+\s]*";
Bravey.Text.TRIMSTART = new RegExp("^(" + Bravey.Text.WORDSEP + ")", "gi");
Bravey.Text.TRIMEND = new RegExp("(" + Bravey.Text.WORDSEP + ")$", "gi");

/**
 * Generate a random GUID.
 * @returns {string} The generated GUID.
 */
Bravey.Text.generateGUID = function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

/**
 * Counts the not empty <tt>positions</tt> of <tt>match</tt>. 
 * @param {string[]} match - The array to check.
 * @param {number[]} positions - The positions to check.
 * @returns {number} The count of filled positions.
 */
Bravey.Text.calculateScore = function(match, positions) {
  var score = 0;
  for (var i = 0; i < positions.length; i++)
    if (match[positions[i]]) score++;
  return score;
}

/**
 * Trims a structured entity, usually produced by an entity recognizer. It moves the entity starting position and changes its string to its trimmed version.
 * @param {Entity} ent - The entity to be processed.
 * @returns {Entity} The trimmed entity.
 */
Bravey.Text.entityTrim = function(ent) {
  var firstText = ent.string.match(Bravey.Text.TRIMSTART);
  var lastText = ent.string.match(Bravey.Text.TRIMEND);
  var firstlen = firstText ? firstText[0].length : 0;
  var lastlen = lastText ? lastText[0].length : 0;
  ent.position += firstlen;
  ent.string = ent.string.substr(firstlen, ent.string.length - firstlen - lastlen);
  return ent;
}

/**
 * Creates a regular expression generator, which matches multiple alternative strings and can return its value.
 * @constructor
 * @param {string[]} map[].str - The strings to be matched. Use ~ as first or last character for indicating a whole word.
 * @param {any} map[].val - The match value.
 * @param {string} def - The default value to return when a value is not found.
 */
Bravey.Text.RegexMap = function(map, def) {

  for (var i = 0; i < map.length; i++) {
    map[i].mtch = [];
    for (var j = 0; j < map[i].str.length; j++)
      map[i].mtch.push(map[i].str[j].replace(/~/g, ""));
  }

  /**
   * Produces the relative regular expression chunk.
   * @param {boolean} [must=false] - Specify if the regular expression chunk must be found in order to match.
   * @returns {string} The regular expression chunk.
   */
  this.regex = function(must) {
    var out = "(";
    for (var i = 0; i < map.length; i++)
      for (var j = 0; j < map[i].str.length; j++)
        out += map[i].str[j].replace(/~/g, "\\b") + "|";
    return out.substr(0, out.length - 1) + ")" + (must ? "" : "?");
  }

  /**
   * Look for a value in <tt>matches</tt> at given <tt>pos</tt> position and checks its value. When not found constructor default or <tt>ldef</tt> is returned.
   * @param {string[]} matches - The values set to be check.
   * @param {number} pos - The position in <tt>matches</tt> to be checked.
   * @param {any} [ldef=(constructor def)] - Value to be returned if value doesn't match.
   * @returns {string} The matched value.
   */
  this.get = function(matches, pos, ldef) {
    for (var i = 0; i < map.length; i++)
      for (var j = 0; j < map[i].mtch.length; j++)
        if (matches[pos] == map[i].mtch[j])
          return map[i].val;
    return ldef == undefined ? def : ldef;
  }
}

/**
 * Returns unique values of an array.
 * @param {string[]} list - The array to be processed.
 * @returns {string[]} Unique values of <tt>list</tt>.
 */
Bravey.Text.unique = function(list) {
  var u = {},
    a = [];
  for (var i = 0, l = list.length; i < l; ++i) {
    if (u.hasOwnProperty(list[i])) {
      continue;
    }
    a.push(list[i]);
    u[list[i]] = 1;
  }
  return a;
};

/**
 * Clean text from diactrics, trims, removes double spaces and converts to lower case.
 * @param {string} text - The text to be cleaned
 * @returns {string} The cleaned text.
 */
Bravey.Text.clean = function(text) {
  return Bravey.Text.removeDiacritics(text).toLowerCase().trim().replace(/ +(?= )/g, '').replace(/[()\[\]]/g, '');
}

/**
 * Adds zeroes to the left of <tt>n</tt> until the length <tt>width</tt> is reached.
 * @param {number} n - The number to be padded.
 * @param {number} width - The string length to be reached.
 * @param {z} [z="0"] - The symbol to be used for padding.
 * @returns {string} The padded value of <tt>n</tt>.
 */
Bravey.Text.pad = function(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

/**
 * Tokenize a string, splitting for non-words.
 * @param {string} text - The string to be tokenized.
 * @returns {string[]} The tokenized string.
 */
Bravey.Text.tokenize = function(text) {
  var sanitized = text.replace(/[^(a-zA-ZA-Яa-я0-9_)+\s]/g, ' ').trim().replace(/ +(?= )/g, '');
  return Bravey.Text.unique(sanitized.split(/\s+/));
}

Bravey.DATA.diacriticsMap = {};

/**
 * Remove diatrics from a sentence, replacing them with not-diatrics representation.
 * @param {string} text - The string to be processed
 * @returns {string} The text without diatrics.
 */
Bravey.Text.removeDiacritics = function(text) {
  return text.replace(/[^\u0000-\u007E]/g, function(a) {
    return Bravey.DATA.diacriticsMap[a] || a;
  });
};

(function() {

  defaultDiacriticsRemovalap = [{
    base: ' ',
    letters: "\u00A0",
  }, {
    base: '0',
    letters: "\u07C0",
  }, {
    base: 'A',
    letters: "\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F",
  }, {
    base: 'AA',
    letters: "\uA732",
  }, {
    base: 'AE',
    letters: "\u00C6\u01FC\u01E2",
  }, {
    base: 'AO',
    letters: "\uA734",
  }, {
    base: 'AU',
    letters: "\uA736",
  }, {
    base: 'AV',
    letters: "\uA738\uA73A",
  }, {
    base: 'AY',
    letters: "\uA73C",
  }, {
    base: 'B',
    letters: "\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0181",
  }, {
    base: 'C',
    letters: "\u24b8\uff23\uA73E\u1E08\u0106\u0043\u0108\u010A\u010C\u00C7\u0187\u023B",
  }, {
    base: 'D',
    letters: "\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018A\u0189\u1D05\uA779",
  }, {
    base: 'Dh',
    letters: "\u00D0",
  }, {
    base: 'DZ',
    letters: "\u01F1\u01C4",
  }, {
    base: 'Dz',
    letters: "\u01F2\u01C5",
  }, {
    base: 'E',
    letters: "\u025B\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E\u1D07",
  }, {
    base: 'F',
    letters: "\uA77C\u24BB\uFF26\u1E1E\u0191\uA77B",
  }, {
    base: 'G',
    letters: "\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E\u0262",
  }, {
    base: 'H',
    letters: "\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D",
  }, {
    base: 'I',
    letters: "\u24BE\uFF29\xCC\xCD\xCE\u0128\u012A\u012C\u0130\xCF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197",
  }, {
    base: 'J',
    letters: "\u24BF\uFF2A\u0134\u0248\u0237",
  }, {
    base: 'K',
    letters: "\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2",
  }, {
    base: 'L',
    letters: "\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780",
  }, {
    base: 'LJ',
    letters: "\u01C7",
  }, {
    base: 'Lj',
    letters: "\u01C8",
  }, {
    base: 'M',
    letters: "\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C\u03FB",
  }, {
    base: 'N',
    letters: "\uA7A4\u0220\u24C3\uFF2E\u01F8\u0143\xD1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u019D\uA790\u1D0E",
  }, {
    base: 'NJ',
    letters: "\u01CA",
  }, {
    base: 'Nj',
    letters: "\u01CB",
  }, {
    base: 'O',
    letters: "\u24C4\uFF2F\xD2\xD3\xD4\u1ED2\u1ED0\u1ED6\u1ED4\xD5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\xD6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\xD8\u01FE\u0186\u019F\uA74A\uA74C",
  }, {
    base: 'OE',
    letters: "\u0152",
  }, {
    base: 'OI',
    letters: "\u01A2",
  }, {
    base: 'OO',
    letters: "\uA74E",
  }, {
    base: 'OU',
    letters: "\u0222",
  }, {
    base: 'P',
    letters: "\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754",
  }, {
    base: 'Q',
    letters: "\u24C6\uFF31\uA756\uA758\u024A",
  }, {
    base: 'R',
    letters: "\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782",
  }, {
    base: 'S',
    letters: "\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784",
  }, {
    base: 'T',
    letters: "\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786",
  }, {
    base: 'Th',
    letters: "\u00DE",
  }, {
    base: 'TZ',
    letters: "\uA728",
  }, {
    base: 'U',
    letters: "\u24CA\uFF35\xD9\xDA\xDB\u0168\u1E78\u016A\u1E7A\u016C\xDC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244",
  }, {
    base: 'V',
    letters: "\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245",
  }, {
    base: 'VY',
    letters: "\uA760",
  }, {
    base: 'W',
    letters: "\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72",
  }, {
    base: 'X',
    letters: "\u24CD\uFF38\u1E8A\u1E8C",
  }, {
    base: 'Y',
    letters: "\u24CE\uFF39\u1EF2\xDD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE",
  }, {
    base: 'Z',
    letters: "\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762",
  }, {
    base: 'a',
    letters: "\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250\u0251",
  }, {
    base: 'aa',
    letters: "\uA733",
  }, {
    base: 'ae',
    letters: "\u00E6\u01FD\u01E3",
  }, {
    base: 'ao',
    letters: "\uA735",
  }, {
    base: 'au',
    letters: "\uA737",
  }, {
    base: 'av',
    letters: "\uA739\uA73B",
  }, {
    base: 'ay',
    letters: "\uA73D",
  }, {
    base: 'b',
    letters: "\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253\u0182",
  }, {
    base: 'c',
    letters: "\uFF43\u24D2\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184",
  }, {
    base: 'd',
    letters: "\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\u018B\u13E7\u0501\uA7AA",
  }, {
    base: 'dh',
    letters: "\u00F0",
  }, {
    base: 'dz',
    letters: "\u01F3\u01C6",
  }, {
    base: 'e',
    letters: "\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u01DD",
  }, {
    base: 'f',
    letters: "\u24D5\uFF46\u1E1F\u0192",
  }, {
    base: 'ff',
    letters: "\uFB00",
  }, {
    base: 'fi',
    letters: "\uFB01",
  }, {
    base: 'fl',
    letters: "\uFB02",
  }, {
    base: 'ffi',
    letters: "\uFB03",
  }, {
    base: 'ffl',
    letters: "\uFB04",
  }, {
    base: 'g',
    letters: "\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\uA77F\u1D79",
  }, {
    base: 'h',
    letters: "\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265",
  }, {
    base: 'hv',
    letters: "\u0195",
  }, {
    base: 'i',
    letters: "\u24D8\uFF49\xEC\xED\xEE\u0129\u012B\u012D\xEF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131",
  }, {
    base: 'j',
    letters: "\u24D9\uFF4A\u0135\u01F0\u0249",
  }, {
    base: 'k',
    letters: "\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3",
  }, {
    base: 'l',
    letters: "\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747\u026D",
  }, {
    base: 'lj',
    letters: "\u01C9",
  }, {
    base: 'm',
    letters: "\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F",
  }, {
    base: 'n',
    letters: "\u24DD\uFF4E\u01F9\u0144\xF1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5\u043B\u0509",
  }, {
    base: 'nj',
    letters: "\u01CC",
  }, {
    base: 'o',
    letters: "\u24DE\uFF4F\xF2\xF3\xF4\u1ED3\u1ED1\u1ED7\u1ED5\xF5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\xF6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\xF8\u01FF\uA74B\uA74D\u0275\u0254\u1D11",
  }, {
    base: 'oe',
    letters: "\u0153",
  }, {
    base: 'oi',
    letters: "\u01A3",
  }, {
    base: 'oo',
    letters: "\uA74F",
  }, {
    base: 'ou',
    letters: "\u0223",
  }, {
    base: 'p',
    letters: "\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755\u03C1",
  }, {
    base: 'q',
    letters: "\u24E0\uFF51\u024B\uA757\uA759",
  }, {
    base: 'r',
    letters: "\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783",
  }, {
    base: 's',
    letters: "\u24E2\uFF53\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B\u0282",
  }, {
    base: 'ss',
    letters: "\xDF",
  }, {
    base: 't',
    letters: "\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787",
  }, {
    base: 'th',
    letters: "\u00FE",
  }, {
    base: 'tz',
    letters: "\uA729",
  }, {
    base: 'u',
    letters: "\u24E4\uFF55\xF9\xFA\xFB\u0169\u1E79\u016B\u1E7B\u016D\xFC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289",
  }, {
    base: 'v',
    letters: "\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C",
  }, {
    base: 'vy',
    letters: "\uA761",
  }, {
    base: 'w',
    letters: "\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73",
  }, {
    base: 'x',
    letters: "\u24E7\uFF58\u1E8B\u1E8D",
  }, {
    base: 'y',
    letters: "\u24E8\uFF59\u1EF3\xFD\u0177\u1EF9\u0233\u1E8F\xFF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF",
  }, {
    base: 'z',
    letters: "\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763",
  }];

  for (var i = 0; i < defaultDiacriticsRemovalap.length; i++) {
    var letters = defaultDiacriticsRemovalap[i].letters;
    for (var j = 0; j < letters.length; j++)
      Bravey.DATA.diacriticsMap[letters[j]] = defaultDiacriticsRemovalap[i].base;
  }
})();
// File:src/extras/date.js

/**
 * Date related functions.
 * @namespace
 */
Bravey.Date = {};

Bravey.Date.SECOND = 1000;
Bravey.Date.MINUTE = Bravey.Date.SECOND * 60;
Bravey.Date.HOUR = Bravey.Date.MINUTE * 60;
Bravey.Date.DAY = Bravey.Date.HOUR * 24;

/**
 * Format a UNIX timestamp into the <tt>YYYY-MM-DD</tt> format.
 * @param {number} timestamp - The timestamp to be formatted.
 * @returns {string} The formatted timestamp.
 */
Bravey.Date.formatDate = function(timestamp) {
  var myDate = new Date(timestamp);
  return Bravey.Text.pad(myDate.getFullYear(), 4) + "-" + Bravey.Text.pad(myDate.getMonth() + 1, 2) + "-" + Bravey.Text.pad(myDate.getDate(), 2);
}

/**
 * Format a UNIX timestamp into the <tt>HH:MM:SS</tt> format.
 * @param {number} timestamp - The timestamp to be formatted.
 * @returns {string} The formatted timestamp.
 */
Bravey.Date.formatTime = function(time) {
  return Bravey.Text.pad(Math.floor(time / Bravey.Date.HOUR), 2) + ":" + Bravey.Text.pad(Math.floor((time % Bravey.Date.HOUR) / Bravey.Date.MINUTE), 2) + ":" + Bravey.Text.pad(Math.floor((time % Bravey.Date.MINUTE) / Bravey.Date.SECOND), 2);
}

/**
 * Returns a date in 20XX or 19XX starting from a number less than 100. (i.e. '85 is 1985)
 * @param {number} year - The year to be converted.
 * @returns {number} The converted year.
 */
Bravey.Date.centuryFinder = function(year) {
  if (year < 100)
    if (year > 20) return year + 1900;
    else return year + 2000;
  return year;
}
// File:src/extras/data.js

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
// File:src/stemmers/StemmerSupport.js

/**
 * From: https://github.com/fortnightlabs/snowball-js
 */

Bravey.stemmerSupport = {
  Among: function(s, substring_i, result, method) {
    this.toCharArray = function(s) {
      var sLength = s.length,
        charArr = new Array(sLength);
      for (var i = 0; i < sLength; i++)
        charArr[i] = s.charCodeAt(i);
      return charArr;
    };

    if ((!s && s != "") || (!substring_i && (substring_i != 0)) || !result)
      throw ("Bad Among initialisation: s:" + s + ", substring_i: " +
        substring_i + ", result: " + result);
    this.s_size = s.length;
    this.s = this.toCharArray(s);
    this.substring_i = substring_i;
    this.result = result;
    this.method = method;
  },
  SnowballProgram: function() {
    var current;
    return {
      bra: 0,
      ket: 0,
      limit: 0,
      cursor: 0,
      limit_backward: 0,
      setCurrent: function(word) {
        current = word;
        this.cursor = 0;
        this.limit = word.length;
        this.limit_backward = 0;
        this.bra = this.cursor;
        this.ket = this.limit;
      },
      getCurrent: function() {
        var result = current;
        current = null;
        return result;
      },
      in_grouping: function(s, min, max) {
        if (this.cursor < this.limit) {
          var ch = current.charCodeAt(this.cursor);
          if (ch <= max && ch >= min) {
            ch -= min;
            if (s[ch >> 3] & (0X1 << (ch & 0X7))) {
              this.cursor++;
              return true;
            }
          }
        }
        return false;
      },
      in_grouping_b: function(s, min, max) {
        if (this.cursor > this.limit_backward) {
          var ch = current.charCodeAt(this.cursor - 1);
          if (ch <= max && ch >= min) {
            ch -= min;
            if (s[ch >> 3] & (0X1 << (ch & 0X7))) {
              this.cursor--;
              return true;
            }
          }
        }
        return false;
      },
      out_grouping: function(s, min, max) {
        if (this.cursor < this.limit) {
          var ch = current.charCodeAt(this.cursor);
          if (ch > max || ch < min) {
            this.cursor++;
            return true;
          }
          ch -= min;
          if (!(s[ch >> 3] & (0X1 << (ch & 0X7)))) {
            this.cursor++;
            return true;
          }
        }
        return false;
      },
      out_grouping_b: function(s, min, max) {
        if (this.cursor > this.limit_backward) {
          var ch = current.charCodeAt(this.cursor - 1);
          if (ch > max || ch < min) {
            this.cursor--;
            return true;
          }
          ch -= min;
          if (!(s[ch >> 3] & (0X1 << (ch & 0X7)))) {
            this.cursor--;
            return true;
          }
        }
        return false;
      },
      eq_s: function(s_size, s) {
        if (this.limit - this.cursor < s_size)
          return false;
        for (var i = 0; i < s_size; i++)
          if (current.charCodeAt(this.cursor + i) != s.charCodeAt(i))
            return false;
        this.cursor += s_size;
        return true;
      },
      eq_s_b: function(s_size, s) {
        if (this.cursor - this.limit_backward < s_size)
          return false;
        for (var i = 0; i < s_size; i++)
          if (current.charCodeAt(this.cursor - s_size + i) != s
            .charCodeAt(i))
            return false;
        this.cursor -= s_size;
        return true;
      },
      find_among: function(v, v_size) {
        var i = 0,
          j = v_size,
          c = this.cursor,
          l = this.limit,
          common_i = 0,
          common_j = 0,
          first_key_inspected = false;
        while (true) {
          var k = i + ((j - i) >> 1),
            diff = 0,
            common = common_i < common_j ?
            common_i :
            common_j,
            w = v[k];
          for (var i2 = common; i2 < w.s_size; i2++) {
            if (c + common == l) {
              diff = -1;
              break;
            }
            diff = current.charCodeAt(c + common) - w.s[i2];
            if (diff)
              break;
            common++;
          }
          if (diff < 0) {
            j = k;
            common_j = common;
          } else {
            i = k;
            common_i = common;
          }
          if (j - i <= 1) {
            if (i > 0 || j == i || first_key_inspected)
              break;
            first_key_inspected = true;
          }
        }
        while (true) {
          var w = v[i];
          if (common_i >= w.s_size) {
            this.cursor = c + w.s_size;
            if (!w.method)
              return w.result;
            var res = w.method();
            this.cursor = c + w.s_size;
            if (res)
              return w.result;
          }
          i = w.substring_i;
          if (i < 0)
            return 0;
        }
      },
      find_among_b: function(v, v_size) {
        var i = 0,
          j = v_size,
          c = this.cursor,
          lb = this.limit_backward,
          common_i = 0,
          common_j = 0,
          first_key_inspected = false;
        while (true) {
          var k = i + ((j - i) >> 1),
            diff = 0,
            common = common_i < common_j ?
            common_i :
            common_j,
            w = v[k];
          for (var i2 = w.s_size - 1 - common; i2 >= 0; i2--) {
            if (c - common == lb) {
              diff = -1;
              break;
            }
            diff = current.charCodeAt(c - 1 - common) - w.s[i2];
            if (diff)
              break;
            common++;
          }
          if (diff < 0) {
            j = k;
            common_j = common;
          } else {
            i = k;
            common_i = common;
          }
          if (j - i <= 1) {
            if (i > 0 || j == i || first_key_inspected)
              break;
            first_key_inspected = true;
          }
        }
        while (true) {
          var w = v[i];
          if (common_i >= w.s_size) {
            this.cursor = c - w.s_size;
            if (!w.method)
              return w.result;
            var res = w.method();
            this.cursor = c - w.s_size;
            if (res)
              return w.result;
          }
          i = w.substring_i;
          if (i < 0)
            return 0;
        }
      },
      replace_s: function(c_bra, c_ket, s) {
        var adjustment = s.length - (c_ket - c_bra),
          left = current
          .substring(0, c_bra),
          right = current.substring(c_ket);
        current = left + s + right;
        this.limit += adjustment;
        if (this.cursor >= c_ket)
          this.cursor += adjustment;
        else if (this.cursor > c_bra)
          this.cursor = c_bra;
        return adjustment;
      },
      slice_check: function() {
        if (this.bra < 0 || this.bra > this.ket || this.ket > this.limit ||
          this.limit > current.length)
          throw ("faulty slice operation");
      },
      slice_from: function(s) {
        this.slice_check();
        this.replace_s(this.bra, this.ket, s);
      },
      slice_del: function() {
        this.slice_from("");
      },
      insert: function(c_bra, c_ket, s) {
        var adjustment = this.replace_s(c_bra, c_ket, s);
        if (c_bra <= this.bra)
          this.bra += adjustment;
        if (c_bra <= this.ket)
          this.ket += adjustment;
      },
      slice_to: function() {
        this.slice_check();
        return current.substring(this.bra, this.ket);
      },
      eq_v_b: function(s) {
        return this.eq_s_b(s.length, s);
      }
    };
  }
};
// File:src/entityrecognizers/FreeTextEntityRecognizer.js

/**
 * Can recognize free text in a sentence. Explicit with <tt>"free text"</tt>. It works with {@link Bravey.nlp.Sequential} only. BETA!
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @param {number} [priority=0] - Priority given to extracted entities.
 */
Bravey.FreeTextEntityRecognizer = function(entityName, priority) {

  var quotes = /\"([^\"]*)\"/;
  var prefixes = [];
  var conjunctions = [];

  /**
   * Returns the recognizer entity name.
   * @returns {string} The entity name.
   */
  this.getName = function() {
    return entityName;
  }

  /**
   * Adds a sentence prefix. (i.e. "with <tt>title</tt> ...")
   * @param {string} string - The prefix to be added.
   */
  this.addPrefix = function(prefix) {
    if (prefixes.indexOf(prefix) == -1) prefixes.push(prefix);
  }

  /**
   * Adds a sentence conjunction. (i.e. "which title <tt>is</tt>...")
   * @param {string} string - The conjunction to be added.
   */
  this.addConjunction = function(conjunction) {
    conjunctions.push(new RegExp("^\\b" + conjunction + "\\b", "gi"));
    conjunctions.push(new RegExp("\\b" + conjunction + "\\b$", "gi"));
  }

  /**
   * Returns all found entities in a sentence. Returned entities value is <tt>string</tt>.
   * @param {string} string - The sentence to be checked.
   * @param {Entity[]} [out=[]] - The array in which the found entities will be added.
   * @returns {Entity[]} The set of found entities.
   */
  this.getEntities = function(string, out) {
    return out;
  }

  this.expand = function(match) { // @TODO: This part can be improved.
    var pos, found, foundcrop = -1,
      foundpos = -1;
    if ((found = quotes.exec(match.string)) != null) {
      match.position += found.index + 1;
      match.string = found[1];
    } else {
      for (var i = 0; i < prefixes.length; i++) {
        if (((pos = match.string.indexOf(prefixes[i])) != -1) && ((foundpos == -1) || (pos < foundpos))) {
          foundpos = pos;
          foundcrop = pos + prefixes[i].length;
        }
      }
      if (foundcrop != -1) {
        match.position += foundcrop;
        match.string = match.string.substr(foundcrop);
      }
      Bravey.Text.entityTrim(match);
      do {
        foundpos = 0;
        for (var i = 0; i < conjunctions.length; i++) {
          if ((found = conjunctions[i].exec(match.string)) != null) {
            foundpos = 1;
            if (found.index == 0) {
              match.string = match.string.substr(found[0].length);
              match.position += found[0].length;
            } else {
              match.string = match.string.substr(0, found.index);
            }
            Bravey.Text.entityTrim(match);
          }
        }
      } while (foundpos);
      if ((pos = match.string.lastIndexOf(".")) != -1) match.string = match.string.substr(0, pos);
      Bravey.Text.entityTrim(match);
    }
    match.value = match.string;
  }

}
// File:src/entityrecognizers/StringEntityRecognizer.js

/**
 * Can recognize strings in a sentence.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @param {number} [priority=0] - Priority given to extracted entities.
 */
Bravey.StringEntityRecognizer = function(entityName, priority) {
  var index = [];
  var cache = {};
  var sorted = false;

  function reSort() {
    index.sort(function(a, b) {
      if (a.text.length > b.text.length) return -1;
      if (a.text.length < b.text.length) return 1;
      return 0;
    });
  }

  /**
   * Returns the recognizer entity name.
   * @returns {string} The entity name.
   */
  this.getName = function() {
    return entityName;
  }

  /**
   * Add a new string to the set.
   * @param {string} entityId - The string returned ID.
   * @param {string} entityText - The entity string.
   * @returns true
   */
  this.addMatch = function(entityId, entityText) {
    entityText = Bravey.Text.clean(entityText);
    if (!cache[entityText]) {
      cache[entityText] = 1;
      sorted = false;
      index.push({
        text: entityText,
        id: entityId,
        regex: new RegExp("\\b" + entityText + "\\b", "gi")
      });
    }
    return true;
  }

  /**
   * Returns all found entities in a sentence. Returned entities value is <tt>string</tt>.
   * @param {string} string - The sentence to be checked.
   * @param {Entity[]} [out=[]] - The array in which the found entities will be added.
   * @returns {Entity[]} The set of found entities.
   */
  this.getEntities = function(string, out) {
    string = Bravey.Text.clean(string);
    if (!sorted) {
      sorted = true;
      reSort();
    }

    var piece, match;

    if (!out) out = [];
    var news, s = string;
    for (var i = 0; i < index.length; i++) {
      while ((match = index[i].regex.exec(s)) != null) {
        piece = string.substr(match.index, match[0].length);
        out.push({
          position: match.index,
          entity: entityName,
          value: index[i].id,
          string: piece,
          priority: priority || 0
        });
        news = s.substr(0, match.index);
        for (var j = 0; j < match[0].length; j++)
          news += " ";
        news += s.substr(match.index + match[0].length);
        s = news;
      }
    }
    return out;
  }
}
// File:src/entityrecognizers/NumberEntityRecognizer.js

/**
 * Can recognize numbers in a sentence.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 */
Bravey.NumberEntityRecognizer = function(entityName) {
  var regex = new RegExp("\\b[0-9]+\\b", "gi");

  /**
   * Returns the recognizer entity name. Returned entities value is <tt>number</tt>.
   * @returns {string} The entity name.
   */
  this.getName = function() {
    return entityName;
  }

  /**
   * Returns all found entities in a sentence.
   * @param {string} string - The sentence to be checked.
   * @param {Entity[]} [out=[]] - The array in which the found entities will be added.
   * @returns {Entity[]} The set of found entities.
   */
  this.getEntities = function(string, out) {
    string = Bravey.Text.clean(string);

    var piece, match;

    if (!out) out = [];
    var s = string;
    while ((match = regex.exec(s)) != null) {
      piece = string.substr(match.index, match[0].length);
      out.push({
        position: match.index,
        entity: entityName,
        value: piece * 1,
        string: piece
      });
    }
    return out;
  }
}
// File:src/entityrecognizers/RegexEntityRecognizer.js

/**
 * Can recognize stacked regular expressions in a sentence. Cleans up the input text first.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 */
Bravey.RegexEntityRecognizer = function(entityName) {

  function sortEntities(ent) {
    ent.sort(function(a, b) {
      if (a.position < b.position) return -1;
      if (a.position > b.position) return 1;
      if (a.string.length > b.string.length) return -1;
      if (a.string.length < b.string.length) return 1;
      if (a.priority > b.priority) return -1;
      if (a.priority < b.priority) return 1;
      return 0;
    });
  }

  var regexs = [];

  /**
   * Add a new regular expression to the set.
   * @param {RegExp} regex - The regular expression to be matched.
   * @param {regexEntityRecognizerCallback} callback - The data processor to be called when the regular expression is matched.
   * @param {number} [priority=0] - The priority of produced entities.
   */
  this.addMatch = function(regex, callback, priority) {
    regexs.push({
      regex: regex,
      callback: callback,
      priority: priority || 0
    });
  }

  /**
   * Returns the recognizer entity name.
   * @returns {string} The entity name.
   */
  this.getName = function() {
    return entityName;
  }

  /**
   * Returns all found entities in a sentence. Returned entities value are defined by the specific callbacks.
   * @param {string} string - The sentence to be checked.
   * @param {Entity[]} [out=[]] - The array in which the found entities will be added.
   * @returns {Entity[]} The set of found entities.
   */
  this.getEntities = function(string, out) {
    string = Bravey.Text.clean(string);

    var found, piece, match, entitiesFound = [],
      pos = -1;

    if (!out) out = [];
    var s = string;
    for (var i = 0; i < regexs.length; i++) {
      while ((match = regexs[i].regex.exec(s)) != null) {
        piece = string.substr(match.index, match[0].length);
        found = regexs[i].callback(match);
        if (found !== undefined)
          entitiesFound.push(Bravey.Text.entityTrim({
            value: found,
            entity: entityName,
            position: match.index,
            string: piece,
            priority: regexs[i].priority
          }));
      }
    }
    sortEntities(entitiesFound);
    for (var i = 0; i < entitiesFound.length; i++)
      if (entitiesFound[i].position >= pos) {
        out.push(entitiesFound[i]);
        pos = entitiesFound[i].position + entitiesFound[i].string.length;
      }
    return out;
  }

  this.bindTo = function(obj) {
    var self = this;
    obj.getName = function() {
      return self.getName();
    }
    obj.getEntities = function(string, out) {
      return self.getEntities(string, out);
    }
  }
}

/**
 * Called when RegexEntityRecognizer matches a regular expression. 
 * @callback regexEntityRecognizerCallback
 * @param {string[]} match - The matched values.
 * @returns {Entity} The processed entity.
 * @returns {undefined} When the match found is not a valid entity.
 */
// File:src/entityrecognizers/EMailEntityRecognizer.js

/**
 * Can recognize e-mail addresses in a sentence.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @param {number} [priority=0] - Priority given to extracted entities.
 */
Bravey.EMailEntityRecognizer = function(entityName, priority) {
  var regex = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

  /**
   * Returns the recognizer entity name.
   * @returns {string} The entity name.
   */
  this.getName = function() {
    return entityName;
  }

  /**
   * Returns all found entities in a sentence. Returned entities value is <tt>string</tt>.
   * @param {string} string - The sentence to be checked.
   * @param {Entity[]} [out=[]] - The array in which the found entities will be added.
   * @returns {Entity[]} The set of found entities.
   */
  this.getEntities = function(string, out) {
    var piece, match;
    if (!out) out = [];
    while ((match = regex.exec(string)) != null) {
      piece = string.substr(match.index, match[0].length);
      out.push({
        position: match.index,
        entity: entityName,
        value: piece,
        string: piece,
        priority: priority || 0
      });
    }
    return out;
  }
}
// File:src/classifiers/DocumentClassifier.js

/**
 * The Bravey document classifier, based on Naive Bayes.
 * @constructor
 * @param {string} [extensions.stemmer] - A stemmer instance to be used for classifying.
 */
Bravey.DocumentClassifier = function(extensions) {
  extensions = extensions || {};
  var storage = {};

  var stemKey = function(stem, label) {
    return 'stem:' + stem + '::label:' + label;
  };
  var docCountKey = function(label) {
    return 'docCount:' + label;
  };
  var stemCountKey = function(stem) {
    return 'stemCount:' + stem;
  };

  var log = function(text) {
    //console.log(text);
  };

  var getLabels = function() {
    var labels = storage['registeredLabels'];
    if (!labels) labels = '';
    return labels.split(',').filter(function(a) {
      return a.length;
    });
  };

  var registerLabel = function(label) {
    var labels = getLabels();
    if (labels.indexOf(label) === -1) {
      labels.push(label);
      storage['registeredLabels'] = labels.join(',');
    }
    return true;
  };

  var stemLabelCount = function(stem, label) {
    var count = parseInt(storage[stemKey(stem, label)]);
    if (!count) count = 0;
    return count;
  };
  var stemInverseLabelCount = function(stem, label) {
    var labels = getLabels();
    var total = 0;
    for (var i = 0, length = labels.length; i < length; i++) {
      if (labels[i] === label)
        continue;
      total += parseInt(stemLabelCount(stem, labels[i]));
    }
    return total;
  };

  var stemTotalCount = function(stem) {
    var count = parseInt(storage[stemCountKey(stem)]);
    if (!count) count = 0;
    return count;
  };
  var docCount = function(label) {
    var count = parseInt(storage[docCountKey(label)]);
    if (!count) count = 0;
    return count;
  };
  var docInverseCount = function(label) {
    var labels = getLabels();
    var total = 0;
    for (var i = 0, length = labels.length; i < length; i++) {
      if (labels[i] === label)
        continue;
      total += parseInt(docCount(labels[i]));
    }
    return total;
  };
  var increment = function(key) {
    var count = parseInt(storage[key]);
    if (!count) count = 0;
    storage[key] = parseInt(count) + 1;
    return count + 1;
  };

  var incrementStem = function(stem, label) {
    increment(stemCountKey(stem));
    increment(stemKey(stem, label));
  };

  var incrementDocCount = function(label) {
    return increment(docCountKey(label));
  };

  var train = function(text, label) {
    registerLabel(label);
    var words = Bravey.Text.tokenize(Bravey.Text.clean(text));
    if (extensions.filter) words = extensions.filter(words);
    var length = words.length;
    for (var i = 0; i < length; i++)
      incrementStem(extensions.stemmer ? extensions.stemmer(words[i]) : words[i], label);
    incrementDocCount(label);
  };

  var guess = function(text) {
    var words = Bravey.Text.tokenize(Bravey.Text.clean(text));
    if (extensions.filter) words = extensions.filter(words);

    var length = words.length;
    var labels = getLabels();
    var totalDocCount = 0;
    var docCounts = {};
    var docInverseCounts = {};
    var scores = {};
    var labelProbability = {};

    for (var j = 0; j < labels.length; j++) {
      var label = labels[j];
      docCounts[label] = docCount(label);
      docInverseCounts[label] = docInverseCount(label);
      totalDocCount += parseInt(docCounts[label]);
    }

    for (var j = 0; j < labels.length; j++) {
      var label = labels[j];
      var logSum = 0;
      labelProbability[label] = docCounts[label] / totalDocCount;

      for (var i = 0; i < length; i++) {
        var word = extensions.stemmer ? extensions.stemmer(words[i]) : words[i];
        var _stemTotalCount = stemTotalCount(word);
        if (_stemTotalCount === 0) {
          continue;
        } else {
          var wordProbability = stemLabelCount(word, label) / docCounts[label];
          var wordInverseProbability = stemInverseLabelCount(word, label) / docInverseCounts[label];
          var wordicity = wordProbability / (wordProbability + wordInverseProbability);
          wordicity = ((1 * 0.5) + (_stemTotalCount * wordicity)) / (1 + _stemTotalCount);
          if (wordicity === 0)
            wordicity = 0.01;
          else if (wordicity === 1)
            wordicity = 0.99;
        }

        logSum += (Math.log(1 - wordicity) - Math.log(wordicity));
        log(label + "icity of " + word + ": " + wordicity);
      }
      scores[label] = 1 / (1 + Math.exp(logSum));
    }
    return scores;
  };

  var extractWinner = function(scores) {
    var bestScore = 0;
    var bestLabel = null;
    for (var label in scores) {
      if (scores[label] > bestScore) {
        bestScore = scores[label];
        bestLabel = label;
      }
    }
    return {
      label: bestLabel,
      score: bestScore
    };
  };

  /**
   * Add a document to the classifier.
   * @param {string} text - The text to be classified.
   * @param {string} label - The related label
   * @returns {text} The classified text.
   */
  this.addDocument = function(text, label) {
    train(text, label);
    return text;
  }

  /**
   * Classify a document.
   * @param {string} text - The document to be classified.
   * @returns {DocumentClassification} The document class.
   */
  this.classifyDocument = function(text) {
    var scores = guess(text);
    var winner = extractWinner(scores);
    return {
      scores: scores,
      winner: winner
    };
  }

  this.addDocument("", "none");

}

/**
 Describes a document classification.
 @typedef DocumentClassification
 @type {Object}
 @property {number[]} scores The related scores for each known document label.
 @property {number} winner.score The score of the winning label.
 @property {string} winner.label The name of the winning label.
*/
// File:src/languages/it.js

/**
 * Italian language functions.
 * @namespace
 */
Bravey.Language.IT = {};

/**
 * Creates an italian words stemmer (i.e. stemmed version of "cani" or "cane" is always "can").
 * @constructor
 */
Bravey.Language.IT.Stemmer = (function() {
  /* create the wrapped stemmer object */
  var Among = Bravey.stemmerSupport.Among,
    SnowballProgram = Bravey.stemmerSupport.SnowballProgram,
    st = new function ItalianStemmer() {
      var a_0 = [new Among("", -1, 7), new Among("qu", 0, 6),
          new Among("\u00E1", 0, 1), new Among("\u00E9", 0, 2),
          new Among("\u00ED", 0, 3), new Among("\u00F3", 0, 4),
          new Among("\u00FA", 0, 5)
        ],
        a_1 = [new Among("", -1, 3),
          new Among("I", 0, 1), new Among("U", 0, 2)
        ],
        a_2 = [
          new Among("la", -1, -1), new Among("cela", 0, -1),
          new Among("gliela", 0, -1), new Among("mela", 0, -1),
          new Among("tela", 0, -1), new Among("vela", 0, -1),
          new Among("le", -1, -1), new Among("cele", 6, -1),
          new Among("gliele", 6, -1), new Among("mele", 6, -1),
          new Among("tele", 6, -1), new Among("vele", 6, -1),
          new Among("ne", -1, -1), new Among("cene", 12, -1),
          new Among("gliene", 12, -1), new Among("mene", 12, -1),
          new Among("sene", 12, -1), new Among("tene", 12, -1),
          new Among("vene", 12, -1), new Among("ci", -1, -1),
          new Among("li", -1, -1), new Among("celi", 20, -1),
          new Among("glieli", 20, -1), new Among("meli", 20, -1),
          new Among("teli", 20, -1), new Among("veli", 20, -1),
          new Among("gli", 20, -1), new Among("mi", -1, -1),
          new Among("si", -1, -1), new Among("ti", -1, -1),
          new Among("vi", -1, -1), new Among("lo", -1, -1),
          new Among("celo", 31, -1), new Among("glielo", 31, -1),
          new Among("melo", 31, -1), new Among("telo", 31, -1),
          new Among("velo", 31, -1)
        ],
        a_3 = [new Among("ando", -1, 1),
          new Among("endo", -1, 1), new Among("ar", -1, 2),
          new Among("er", -1, 2), new Among("ir", -1, 2)
        ],
        a_4 = [
          new Among("ic", -1, -1), new Among("abil", -1, -1),
          new Among("os", -1, -1), new Among("iv", -1, 1)
        ],
        a_5 = [
          new Among("ic", -1, 1), new Among("abil", -1, 1),
          new Among("iv", -1, 1)
        ],
        a_6 = [new Among("ica", -1, 1),
          new Among("logia", -1, 3), new Among("osa", -1, 1),
          new Among("ista", -1, 1), new Among("iva", -1, 9),
          new Among("anza", -1, 1), new Among("enza", -1, 5),
          new Among("ice", -1, 1), new Among("atrice", 7, 1),
          new Among("iche", -1, 1), new Among("logie", -1, 3),
          new Among("abile", -1, 1), new Among("ibile", -1, 1),
          new Among("usione", -1, 4), new Among("azione", -1, 2),
          new Among("uzione", -1, 4), new Among("atore", -1, 2),
          new Among("ose", -1, 1), new Among("ante", -1, 1),
          new Among("mente", -1, 1), new Among("amente", 19, 7),
          new Among("iste", -1, 1), new Among("ive", -1, 9),
          new Among("anze", -1, 1), new Among("enze", -1, 5),
          new Among("ici", -1, 1), new Among("atrici", 25, 1),
          new Among("ichi", -1, 1), new Among("abili", -1, 1),
          new Among("ibili", -1, 1), new Among("ismi", -1, 1),
          new Among("usioni", -1, 4), new Among("azioni", -1, 2),
          new Among("uzioni", -1, 4), new Among("atori", -1, 2),
          new Among("osi", -1, 1), new Among("anti", -1, 1),
          new Among("amenti", -1, 6), new Among("imenti", -1, 6),
          new Among("isti", -1, 1), new Among("ivi", -1, 9),
          new Among("ico", -1, 1), new Among("ismo", -1, 1),
          new Among("oso", -1, 1), new Among("amento", -1, 6),
          new Among("imento", -1, 6), new Among("ivo", -1, 9),
          new Among("it\u00E0", -1, 8), new Among("ist\u00E0", -1, 1),
          new Among("ist\u00E8", -1, 1), new Among("ist\u00EC", -1, 1)
        ],
        a_7 = [
          new Among("isca", -1, 1), new Among("enda", -1, 1),
          new Among("ata", -1, 1), new Among("ita", -1, 1),
          new Among("uta", -1, 1), new Among("ava", -1, 1),
          new Among("eva", -1, 1), new Among("iva", -1, 1),
          new Among("erebbe", -1, 1), new Among("irebbe", -1, 1),
          new Among("isce", -1, 1), new Among("ende", -1, 1),
          new Among("are", -1, 1), new Among("ere", -1, 1),
          new Among("ire", -1, 1), new Among("asse", -1, 1),
          new Among("ate", -1, 1), new Among("avate", 16, 1),
          new Among("evate", 16, 1), new Among("ivate", 16, 1),
          new Among("ete", -1, 1), new Among("erete", 20, 1),
          new Among("irete", 20, 1), new Among("ite", -1, 1),
          new Among("ereste", -1, 1), new Among("ireste", -1, 1),
          new Among("ute", -1, 1), new Among("erai", -1, 1),
          new Among("irai", -1, 1), new Among("isci", -1, 1),
          new Among("endi", -1, 1), new Among("erei", -1, 1),
          new Among("irei", -1, 1), new Among("assi", -1, 1),
          new Among("ati", -1, 1), new Among("iti", -1, 1),
          new Among("eresti", -1, 1), new Among("iresti", -1, 1),
          new Among("uti", -1, 1), new Among("avi", -1, 1),
          new Among("evi", -1, 1), new Among("ivi", -1, 1),
          new Among("isco", -1, 1), new Among("ando", -1, 1),
          new Among("endo", -1, 1), new Among("Yamo", -1, 1),
          new Among("iamo", -1, 1), new Among("avamo", -1, 1),
          new Among("evamo", -1, 1), new Among("ivamo", -1, 1),
          new Among("eremo", -1, 1), new Among("iremo", -1, 1),
          new Among("assimo", -1, 1), new Among("ammo", -1, 1),
          new Among("emmo", -1, 1), new Among("eremmo", 54, 1),
          new Among("iremmo", 54, 1), new Among("immo", -1, 1),
          new Among("ano", -1, 1), new Among("iscano", 58, 1),
          new Among("avano", 58, 1), new Among("evano", 58, 1),
          new Among("ivano", 58, 1), new Among("eranno", -1, 1),
          new Among("iranno", -1, 1), new Among("ono", -1, 1),
          new Among("iscono", 65, 1), new Among("arono", 65, 1),
          new Among("erono", 65, 1), new Among("irono", 65, 1),
          new Among("erebbero", -1, 1), new Among("irebbero", -1, 1),
          new Among("assero", -1, 1), new Among("essero", -1, 1),
          new Among("issero", -1, 1), new Among("ato", -1, 1),
          new Among("ito", -1, 1), new Among("uto", -1, 1),
          new Among("avo", -1, 1), new Among("evo", -1, 1),
          new Among("ivo", -1, 1), new Among("ar", -1, 1),
          new Among("ir", -1, 1), new Among("er\u00E0", -1, 1),
          new Among("ir\u00E0", -1, 1), new Among("er\u00F2", -1, 1),
          new Among("ir\u00F2", -1, 1)
        ],
        g_v = [17, 65, 16, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 128, 128, 8, 2, 1
        ],
        g_AEIO = [17, 65, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 128, 8, 2
        ],
        g_CG = [17],
        I_p2, I_p1, I_pV, sbp = new SnowballProgram();
      this.setCurrent = function(word) {
        sbp.setCurrent(word);
      };
      this.getCurrent = function() {
        return sbp.getCurrent();
      };

      function habr1(c1, c2, v_1) {
        if (sbp.eq_s(1, c1)) {
          sbp.ket = sbp.cursor;
          if (sbp.in_grouping(g_v, 97, 249)) {
            sbp.slice_from(c2);
            sbp.cursor = v_1;
            return true;
          }
        }
        return false;
      }

      function r_prelude() {
        var among_var, v_1 = sbp.cursor,
          v_2, v_3, v_4;
        while (true) {
          sbp.bra = sbp.cursor;
          among_var = sbp.find_among(a_0, 7);
          if (among_var) {
            sbp.ket = sbp.cursor;
            switch (among_var) {
              case 1:
                sbp.slice_from("\u00E0");
                continue;
              case 2:
                sbp.slice_from("\u00E8");
                continue;
              case 3:
                sbp.slice_from("\u00EC");
                continue;
              case 4:
                sbp.slice_from("\u00F2");
                continue;
              case 5:
                sbp.slice_from("\u00F9");
                continue;
              case 6:
                sbp.slice_from("qU");
                continue;
              case 7:
                if (sbp.cursor >= sbp.limit)
                  break;
                sbp.cursor++;
                continue;
            }
          }
          break;
        }
        sbp.cursor = v_1;
        while (true) {
          v_2 = sbp.cursor;
          while (true) {
            v_3 = sbp.cursor;
            if (sbp.in_grouping(g_v, 97, 249)) {
              sbp.bra = sbp.cursor;
              v_4 = sbp.cursor;
              if (habr1("u", "U", v_3))
                break;
              sbp.cursor = v_4;
              if (habr1("i", "I", v_3))
                break;
            }
            sbp.cursor = v_3;
            if (sbp.cursor >= sbp.limit) {
              sbp.cursor = v_2;
              return;
            }
            sbp.cursor++;
          }
        }
      }

      function habr2(v_1) {
        sbp.cursor = v_1;
        if (!sbp.in_grouping(g_v, 97, 249))
          return false;
        while (!sbp.out_grouping(g_v, 97, 249)) {
          if (sbp.cursor >= sbp.limit)
            return false;
          sbp.cursor++;
        }
        return true;
      }

      function habr3() {
        if (sbp.in_grouping(g_v, 97, 249)) {
          var v_1 = sbp.cursor;
          if (sbp.out_grouping(g_v, 97, 249)) {
            while (!sbp.in_grouping(g_v, 97, 249)) {
              if (sbp.cursor >= sbp.limit)
                return habr2(v_1);
              sbp.cursor++;
            }
            return true;
          }
          return habr2(v_1);
        }
        return false;
      }

      function habr4() {
        var v_1 = sbp.cursor,
          v_2;
        if (!habr3()) {
          sbp.cursor = v_1;
          if (!sbp.out_grouping(g_v, 97, 249))
            return;
          v_2 = sbp.cursor;
          if (sbp.out_grouping(g_v, 97, 249)) {
            while (!sbp.in_grouping(g_v, 97, 249)) {
              if (sbp.cursor >= sbp.limit) {
                sbp.cursor = v_2;
                if (sbp.in_grouping(g_v, 97, 249) && sbp.cursor < sbp.limit)
                  sbp.cursor++;
                return;
              }
              sbp.cursor++;
            }
            I_pV = sbp.cursor;
            return;
          }
          sbp.cursor = v_2;
          if (!sbp.in_grouping(g_v, 97, 249) || sbp.cursor >= sbp.limit)
            return;
          sbp.cursor++;
        }
        I_pV = sbp.cursor;
      }

      function habr5() {
        while (!sbp.in_grouping(g_v, 97, 249)) {
          if (sbp.cursor >= sbp.limit)
            return false;
          sbp.cursor++;
        }
        while (!sbp.out_grouping(g_v, 97, 249)) {
          if (sbp.cursor >= sbp.limit)
            return false;
          sbp.cursor++;
        }
        return true;
      }

      function r_mark_regions() {
        var v_1 = sbp.cursor;
        I_pV = sbp.limit;
        I_p1 = I_pV;
        I_p2 = I_pV;
        habr4();
        sbp.cursor = v_1;
        if (habr5()) {
          I_p1 = sbp.cursor;
          if (habr5())
            I_p2 = sbp.cursor;
        }
      }

      function r_postlude() {
        var among_var;
        while (true) {
          sbp.bra = sbp.cursor;
          among_var = sbp.find_among(a_1, 3);
          if (!among_var)
            break;
          sbp.ket = sbp.cursor;
          switch (among_var) {
            case 1:
              sbp.slice_from("i");
              break;
            case 2:
              sbp.slice_from("u");
              break;
            case 3:
              if (sbp.cursor >= sbp.limit)
                return;
              sbp.cursor++;
              break;
          }
        }
      }

      function r_RV() {
        return I_pV <= sbp.cursor;
      }

      function r_R1() {
        return I_p1 <= sbp.cursor;
      }

      function r_R2() {
        return I_p2 <= sbp.cursor;
      }

      function r_attached_pronoun() {
        var among_var;
        sbp.ket = sbp.cursor;
        if (sbp.find_among_b(a_2, 37)) {
          sbp.bra = sbp.cursor;
          among_var = sbp.find_among_b(a_3, 5);
          if (among_var && r_RV()) {
            switch (among_var) {
              case 1:
                sbp.slice_del();
                break;
              case 2:
                sbp.slice_from("e");
                break;
            }
          }
        }
      }

      function r_standard_suffix() {
        var among_var;
        sbp.ket = sbp.cursor;
        among_var = sbp.find_among_b(a_6, 51);
        if (!among_var)
          return false;
        sbp.bra = sbp.cursor;
        switch (among_var) {
          case 1:
            if (!r_R2())
              return false;
            sbp.slice_del();
            break;
          case 2:
            if (!r_R2())
              return false;
            sbp.slice_del();
            sbp.ket = sbp.cursor;
            if (sbp.eq_s_b(2, "ic")) {
              sbp.bra = sbp.cursor;
              if (r_R2())
                sbp.slice_del();
            }
            break;
          case 3:
            if (!r_R2())
              return false;
            sbp.slice_from("log");
            break;
          case 4:
            if (!r_R2())
              return false;
            sbp.slice_from("u");
            break;
          case 5:
            if (!r_R2())
              return false;
            sbp.slice_from("ente");
            break;
          case 6:
            if (!r_RV())
              return false;
            sbp.slice_del();
            break;
          case 7:
            if (!r_R1())
              return false;
            sbp.slice_del();
            sbp.ket = sbp.cursor;
            among_var = sbp.find_among_b(a_4, 4);
            if (among_var) {
              sbp.bra = sbp.cursor;
              if (r_R2()) {
                sbp.slice_del();
                if (among_var == 1) {
                  sbp.ket = sbp.cursor;
                  if (sbp.eq_s_b(2, "at")) {
                    sbp.bra = sbp.cursor;
                    if (r_R2())
                      sbp.slice_del();
                  }
                }
              }
            }
            break;
          case 8:
            if (!r_R2())
              return false;
            sbp.slice_del();
            sbp.ket = sbp.cursor;
            among_var = sbp.find_among_b(a_5, 3);
            if (among_var) {
              sbp.bra = sbp.cursor;
              if (among_var == 1)
                if (r_R2())
                  sbp.slice_del();
            }
            break;
          case 9:
            if (!r_R2())
              return false;
            sbp.slice_del();
            sbp.ket = sbp.cursor;
            if (sbp.eq_s_b(2, "at")) {
              sbp.bra = sbp.cursor;
              if (r_R2()) {
                sbp.slice_del();
                sbp.ket = sbp.cursor;
                if (sbp.eq_s_b(2, "ic")) {
                  sbp.bra = sbp.cursor;
                  if (r_R2())
                    sbp.slice_del();
                }
              }
            }
            break;
        }
        return true;
      }

      function r_verb_suffix() {
        var among_var, v_1;
        if (sbp.cursor >= I_pV) {
          v_1 = sbp.limit_backward;
          sbp.limit_backward = I_pV;
          sbp.ket = sbp.cursor;
          among_var = sbp.find_among_b(a_7, 87);
          if (among_var) {
            sbp.bra = sbp.cursor;
            if (among_var == 1)
              sbp.slice_del();
          }
          sbp.limit_backward = v_1;
        }
      }

      function habr6() {
        var v_1 = sbp.limit - sbp.cursor;
        sbp.ket = sbp.cursor;
        if (sbp.in_grouping_b(g_AEIO, 97, 242)) {
          sbp.bra = sbp.cursor;
          if (r_RV()) {
            sbp.slice_del();
            sbp.ket = sbp.cursor;
            if (sbp.eq_s_b(1, "i")) {
              sbp.bra = sbp.cursor;
              if (r_RV()) {
                sbp.slice_del();
                return;
              }
            }
          }
        }
        sbp.cursor = sbp.limit - v_1;
      }

      function r_vowel_suffix() {
        habr6();
        sbp.ket = sbp.cursor;
        if (sbp.eq_s_b(1, "h")) {
          sbp.bra = sbp.cursor;
          if (sbp.in_grouping_b(g_CG, 99, 103))
            if (r_RV())
              sbp.slice_del();
        }
      }
      this.stem = function() {
        var v_1 = sbp.cursor;
        r_prelude();
        sbp.cursor = v_1;
        r_mark_regions();
        sbp.limit_backward = v_1;
        sbp.cursor = sbp.limit;
        r_attached_pronoun();
        sbp.cursor = sbp.limit;
        if (!r_standard_suffix()) {
          sbp.cursor = sbp.limit;
          r_verb_suffix();
        }
        sbp.cursor = sbp.limit;
        r_vowel_suffix();
        sbp.cursor = sbp.limit_backward;
        r_postlude();
        return true;
      }
    };

  /**
   * Stem a given word.
   * @param {string} word - The word to be stemmed.
   * @returns {string} The stemmed word.
   */
  return function(word) {
    st.setCurrent(word);
    st.stem();
    return st.getCurrent();
  }
})();

/**
 * An entity recognizer that can recognizes time expressions. Returned entities value is the same of {@link Bravey.Date.formatTime}.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @returns {Bravey.RegexEntityRecognizer}
 */
Bravey.Language.IT.TimeEntityRecognizer = function(entityName) {

  var matcher = new Bravey.RegexEntityRecognizer(entityName);

  var mins = new Bravey.Text.RegexMap([{
    str: ["meno un quarto~"],
    val: -45 * Bravey.Date.MINUTE
  }, {
    str: ["meno venti~", " meno 20"],
    val: -20 * Bravey.Date.MINUTE
  }, {
    str: ["meno un quarto~"],
    val: -15 * Bravey.Date.MINUTE
  }, {
    str: ["mezza~", "trenta"],
    val: 30 * Bravey.Date.MINUTE
  }, {
    str: ["venti~"],
    val: 30 * Bravey.Date.MINUTE
  }, {
    str: ["un quarto~", "quindici~", "un quarto~"],
    val: 15 * Bravey.Date.MINUTE
  }], 0);

  var daytime = new Bravey.Text.RegexMap([{
    str: ["di mattina~", "del mattino~", "am~", "antimeridiane~"],
    val: 0
  }, {
    str: ["di pomeriggio~", "del pomeriggio~", "di sera~", "della sera~", "pomeridiane~", "pm~"],
    val: 12 * Bravey.Date.HOUR
  }], 0)

  matcher.addMatch(
    new RegExp(
      "\\b(per le\\b|l\\b|alle\\b|la\\b|le\\b)?" + Bravey.Text.WORDSEP +
      "(ore\\b)?" + Bravey.Text.WORDSEP +
      "([0-9]+)" + Bravey.Text.WORDSEP +
      "(e\\b|:\\b)?" + Bravey.Text.WORDSEP +
      "([0-9]+)?" + Bravey.Text.WORDSEP +
      mins.regex() + Bravey.Text.WORDSEP +
      "( minuti)?" + Bravey.Text.WORDSEP +
      daytime.regex() +
      "\\b",
      "gi"),
    function(match) {
      var time = match[3] * 1 * Bravey.Date.HOUR;
      if (match[4] && match[5]) time += match[5] * 1 * Bravey.Date.MINUTE;
      time += mins.get(match, 6);
      time += daytime.get(match, 8);
      if (Bravey.Text.calculateScore(match, [1, 2, 5, 6, 7, 8])) return Bravey.Date.formatTime(time);
    }
  );

  matcher.bindTo(this);

};

/**
 * An entity recognizer that can recognizes time period expressions. Returned entities value <tt>{"start":"HH:MM:SS","end":"HH:MM:SS"}</tt>.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @returns {Bravey.RegexEntityRecognizer}
 * @todo dalle x alle y, etc...
 */
Bravey.Language.IT.TimePeriodEntityRecognizer = function(entityName) {

  var matcher = new Bravey.RegexEntityRecognizer(entityName);

  var rangematcher = new Bravey.Text.RegexMap([{
    str: ["secondo~", "secondi~"],
    val: Bravey.Date.SECOND
  }, {
    str: ["minuti~", "minuto~"],
    val: Bravey.Date.MINUTE
  }, {
    str: ["ore~", "ora~"],
    val: Bravey.Date.HOUR
  }], 0);

  matcher.addMatch(
    new RegExp(
      "\\b(entro\\b|tra\\b|in\\b)" + Bravey.Text.WORDSEP +
      "([0-9]+)" + Bravey.Text.WORDSEP +
      rangematcher.regex(1), "gi"),
    function(match) {
      var now, then, date = new Date();
      now = then = (date.getHours() * Bravey.Date.HOUR) + (date.getMinutes() * Bravey.Date.MINUTE);
      then += (match[2] * rangematcher.get(match, 3));
      if (Bravey.Text.calculateScore(match, [1, 3])) return {
        start: Bravey.Date.formatTime(now),
        end: Bravey.Date.formatTime(then)
      };
    }
  );

  matcher.addMatch(new RegExp("\\b(di sera|della sera|in serata|nella serata|la sera|sera|stasera)\\b", "gi"), function(match) {
    return {
      start: "12:00:00",
      end: "23:59:00"
    }
  });
  matcher.addMatch(new RegExp("\\b(di pomeriggio|del pomeriggio|nel pomeriggio|il pomeriggio|pomeriggio)\\b", "gi"), function(match) {
    return {
      start: "15:00:00",
      end: "23:59:00"
    }
  });
  matcher.addMatch(new RegExp("\\b(di mattina|del mattino|in mattinata|della mattinata|la mattinata|mattina|stamattina)\\b", "gi"), function(match) {
    return {
      start: "08:00:00",
      end: "12:00:00"
    }
  });

  matcher.bindTo(this);
};

/**
 * An entity recognizer that can recognizes date expressions. Returned entities value is the same of {@link Bravey.Date.formatDate}.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @returns {Bravey.RegexEntityRecognizer}
 * @todo il primo gennaio, il 2 febbraio, etc...
 */
Bravey.Language.IT.DateEntityRecognizer = function(entityName) {

  var matcher = new Bravey.RegexEntityRecognizer(entityName);

  var prefixes = "\\b(per il\\b|di\\b|nel giorno di\\b|nella giornata di\\b|la giornata di\\b|il\\b|nel\\b|lo scorso\\b)?" + Bravey.Text.WORDSEP;

  var months = new Bravey.Text.RegexMap([{
    str: ["gennaio~", "gen~", "1~", "01~"],
    val: 0
  }, {
    str: ["febbraio~", "feb~", "2~", "02~"],
    val: 1
  }, {
    str: ["marzo~", "mar~", "3~", "03~"],
    val: 2
  }, {
    str: ["aprile~", "apr~", "4~", "04~"],
    val: 3
  }, {
    str: ["maggio~", "mag~", "5~", "05~"],
    val: 4
  }, {
    str: ["giugno~", "giu~", "6~", "06~"],
    val: 5
  }, {
    str: ["luglio~", "lug~", "7~", "07~"],
    val: 6
  }, {
    str: ["agosto~", "ago~", "8~", "08~"],
    val: 7
  }, {
    str: ["settembre~", "set~", "sept~", "9~", "09~"],
    val: 8
  }, {
    str: ["ottobre~", "ott~", "10~"],
    val: 9
  }, {
    str: ["novembre~", "nov~", "11~"],
    val: 10
  }, {
    str: ["dicembre~", "dic~", "12~"],
    val: 11
  }], 0);

  // D/M/Y
  matcher.addMatch(
    new RegExp(
      prefixes +
      "([0-9]{1,2})" + Bravey.Text.WORDSEP +
      "(di\\b|,\\b|/\\b|-\\b|\\b)" + Bravey.Text.WORDSEP +
      months.regex() + Bravey.Text.WORDSEP +
      "(del\\b|dell'\\b|nel\\b|,\\b|/\\b|-\\b)?" + Bravey.Text.WORDSEP +
      "([0-9]{2,4})?" +
      "\\b", "gi"),
    function(match) {
      var now = new Date();
      var y = now.getFullYear();
      var m = now.getMonth();
      var d = now.getDate();

      d = match[2] * 1;
      m = months.get(match, 4, m);
      if (match[6]) y = match[6] * 1;
      y = Bravey.Date.centuryFinder(y);
      if (Bravey.Text.calculateScore(match, [1, 4, 6])) return Bravey.Date.formatDate((new Date(y, m, d, 0, 0, 0, 0)).getTime());
    },
    10
  );

  // M/(D??)/(Y??)
  matcher.addMatch(
    new RegExp(
      prefixes +
      months.regex(1) + Bravey.Text.WORDSEP +
      "([0-9]{1,2})?" + Bravey.Text.WORDSEP +
      "(del\\b|dell'\\b|,\\b)?" + Bravey.Text.WORDSEP +
      "([0-9]{2,4})?" +
      "\\b", "gi"),
    function(match) {
      var now = new Date();
      var y = now.getFullYear();
      var m = now.getMonth();
      var d = 1;

      m = months.get(match, 2, m);
      if (match[3]) d = match[3] * 1;
      if (match[5]) y = match[5] * 1;
      y = Bravey.Date.centuryFinder(y);
      if (Bravey.Text.calculateScore(match, [1, 3, 4])) return Bravey.Date.formatDate((new Date(y, m, d, 0, 0, 0, 0)).getTime());
    },
    5
  );

  prefixes = "\\b(per\\b|di\\b|nel giorno di\\b|nella giornata di\\b|la giornata di\\b|lo scorso\\b)?" + Bravey.Text.WORDSEP;

  matcher.addMatch(new RegExp(prefixes + "(oggi)\\b", "gi"), function(match) {
    return Bravey.Date.formatDate((new Date()).getTime());
  });
  matcher.addMatch(new RegExp(prefixes + "(domani)\\b", "gi"), function(match) {
    return Bravey.Date.formatDate((new Date()).getTime() + Bravey.Date.DAY)
  });
  matcher.addMatch(new RegExp(prefixes + "(dopodomani)\\b", "gi"), function(match) {
    return Bravey.Date.formatDate((new Date()).getTime() + (Bravey.Date.DAY * 2))
  });
  matcher.addMatch(new RegExp(prefixes + "(ieri)\\b", "gi"), function(match) {
    return Bravey.Date.formatDate((new Date()).getTime() - Bravey.Date.DAY)
  });
  matcher.addMatch(new RegExp(prefixes + "(l'altro ieri|ieri l'altro)\\b", "gi"), function(match) {
    return Bravey.Date.formatDate((new Date()).getTime() - (Bravey.Date.DAY * 2))
  });

  matcher.bindTo(this);
}

/**
 * An free text entity recognizer with preconfigured conjunctions. Derived from {@link Bravey.FreeTextEntityRecognizer}.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @returns {Bravey.RegexEntityRecognizer}
 */
Bravey.Language.IT.FreeTextEntityRecognizer = function(entityName, priority) {
  var commas = ["grazie", "per favore"];

  var matcher = new Bravey.FreeTextEntityRecognizer(entityName, priority);
  matcher.addConjunction("il");
  matcher.addConjunction("lo");
  matcher.addConjunction("la");
  matcher.addConjunction("i");
  matcher.addConjunction("gli");
  matcher.addConjunction("le");
  matcher.addConjunction("è");
  matcher.addConjunction("é");
  matcher.addConjunction("e");
  matcher.addConjunction("ed");
  matcher.addConjunction("e'");
  matcher.addConjunction("sia");
  matcher.addConjunction("mi pare");
  matcher.addConjunction("dovrebbe essere");
  matcher.addConjunction("sarebbe");
  for (var i = 0; i < commas.length; i++) {
    matcher.addConjunction(commas[i]);
    matcher.addConjunction("," + commas[i]);
    matcher.addConjunction(", " + commas[i]);
  }

  return matcher;

}

/* Italian numbers matching patterns. */
Bravey.Language.IT.Numbers = [{
  prefix: "zero",
  value: 0
}, {
  prefix: "vent",
  value: 20
}, {
  prefix: "trent",
  value: 30
}, {
  prefix: "quarant",
  value: 40
}, {
  prefix: "cinquant",
  value: 50
}, {
  prefix: "sessant",
  value: 60
}, {
  prefix: "settant",
  value: 70
}, {
  prefix: "ottant",
  value: 80
}, {
  prefix: "novant",
  value: 90
}, {
  prefix: "uno",
  value: 1
}, {
  prefix: "quattro",
  value: 4
}, {
  prefix: "quattor",
  value: 4
}, {
  prefix: "cinque",
  value: 5
}, {
  prefix: "quin",
  value: 5
}, {
  prefix: "sei",
  value: 6
}, {
  prefix: "sette",
  value: 7
}, {
  prefix: "otto",
  value: 8
}, {
  prefix: "nove",
  value: 9
}, {
  prefix: "dieci",
  value: 10
}, {
  prefix: "dici",
  value: 10
}, {
  prefix: "se",
  value: 6
}, {
  prefix: "un",
  value: 1
}, {
  prefix: "due",
  value: 2
}, {
  prefix: "do",
  value: 2
}, {
  prefix: "tre",
  value: 3
}, {
  prefix: "a",
  skip: 1
}, {
  prefix: "tor",
  skip: 1
}, {
  prefix: "i",
  skip: 1
}, {
  prefix: "n",
  skip: 1
}, {
  prefix: "s",
  skip: 1
}, {
  prefix: "cento",
  mul: 100
}, {
  prefix: "mila",
  mul: 1000,
  end: 1
}, {
  prefix: "mille",
  mul: 1000,
  end: 1
}, {
  prefix: "milion",
  mul: 1000000,
  end: 1
}, {
  prefix: "miliard",
  mul: 1000000000,
  end: 1
}, {
  prefix: "e",
  skip: 1
}, {
  prefix: "i",
  skip: 1
}, {
  prefix: "o",
  skip: 1
}];

/**
 * Recognizes numbers line '123' or 'centoventitre'. 
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @returns {Bravey.RegexEntityRecognizer}
 */
Bravey.Language.IT.NumberEntityRecognizer = function(entityName, priority) {
  var digits = new RegExp("^[0-9]+$", "gi");

  var matcher = new Bravey.RegexEntityRecognizer(entityName);
  // M/(D??)/(Y??)
  matcher.addMatch(
    new RegExp(
      "(\\w+)", "gi"),
    function(match) {
      var word = match[0].toLowerCase();
      var value = 0,
        partial = 0,
        found,
        number, ending = 9990,
        valid = false;
      if (word.match(digits)) return word * 1;
      else {
        do {
          found = false;
          for (var i = 0; i < Bravey.Language.IT.Numbers.length; i++) {
            number = Bravey.Language.IT.Numbers[i];
            if (word.substr(0, number.prefix.length) == number.prefix) {
              word = word.substr(number.prefix.length);
              if (!number.skip) {
                if (ending) {
                  if (number.end) {
                    if (i < ending) {
                      value += partial;
                      partial = 0;
                    }
                    ending = i;
                  } else {
                    value += partial;
                    partial = 0;
                    ending = 0;
                  }
                } else
                if (number.end) ending = i;
                if (number.value !== undefined) {
                  partial += number.value;
                  found = true;
                  valid = true;
                }
                if (number.mul !== undefined) {
                  if (partial) partial *= number.mul;
                  else partial = number.mul;
                  found = true;
                  valid = true;
                }
              } else found = true;
              if (found) break;
            }
          }
        } while (found);
        value += partial;
        if (!word && valid) return value;
      }
    }
  );
  return matcher;
}
// File:src/languages/en.js

/**
 * English language functions.
 * @namespace
 */
Bravey.Language.EN = {};

/**
 * Creates an italian words stemmer (i.e. stemmed version of "dogs" or "dog" is always "dog").
 * @constructor
 */
Bravey.Language.EN.Stemmer = (function() {
  var Among = Bravey.stemmerSupport.Among,
    SnowballProgram = Bravey.stemmerSupport.SnowballProgram,
    st = new function ItalianStemmer() {
      var a_0 = [new Among("arsen", -1, -1), new Among("commun", -1, -1),
          new Among("gener", -1, -1)
        ],
        a_1 = [new Among("'", -1, 1),
          new Among("'s'", 0, 1), new Among("'s", -1, 1)
        ],
        a_2 = [
          new Among("ied", -1, 2), new Among("s", -1, 3),
          new Among("ies", 1, 2), new Among("sses", 1, 1),
          new Among("ss", 1, -1), new Among("us", 1, -1)
        ],
        a_3 = [
          new Among("", -1, 3), new Among("bb", 0, 2), new Among("dd", 0, 2),
          new Among("ff", 0, 2), new Among("gg", 0, 2),
          new Among("bl", 0, 1), new Among("mm", 0, 2),
          new Among("nn", 0, 2), new Among("pp", 0, 2),
          new Among("rr", 0, 2), new Among("at", 0, 1),
          new Among("tt", 0, 2), new Among("iz", 0, 1)
        ],
        a_4 = [
          new Among("ed", -1, 2), new Among("eed", 0, 1),
          new Among("ing", -1, 2), new Among("edly", -1, 2),
          new Among("eedly", 3, 1), new Among("ingly", -1, 2)
        ],
        a_5 = [
          new Among("anci", -1, 3), new Among("enci", -1, 2),
          new Among("ogi", -1, 13), new Among("li", -1, 16),
          new Among("bli", 3, 12), new Among("abli", 4, 4),
          new Among("alli", 3, 8), new Among("fulli", 3, 14),
          new Among("lessli", 3, 15), new Among("ousli", 3, 10),
          new Among("entli", 3, 5), new Among("aliti", -1, 8),
          new Among("biliti", -1, 12), new Among("iviti", -1, 11),
          new Among("tional", -1, 1), new Among("ational", 14, 7),
          new Among("alism", -1, 8), new Among("ation", -1, 7),
          new Among("ization", 17, 6), new Among("izer", -1, 6),
          new Among("ator", -1, 7), new Among("iveness", -1, 11),
          new Among("fulness", -1, 9), new Among("ousness", -1, 10)
        ],
        a_6 = [
          new Among("icate", -1, 4), new Among("ative", -1, 6),
          new Among("alize", -1, 3), new Among("iciti", -1, 4),
          new Among("ical", -1, 4), new Among("tional", -1, 1),
          new Among("ational", 5, 2), new Among("ful", -1, 5),
          new Among("ness", -1, 5)
        ],
        a_7 = [new Among("ic", -1, 1),
          new Among("ance", -1, 1), new Among("ence", -1, 1),
          new Among("able", -1, 1), new Among("ible", -1, 1),
          new Among("ate", -1, 1), new Among("ive", -1, 1),
          new Among("ize", -1, 1), new Among("iti", -1, 1),
          new Among("al", -1, 1), new Among("ism", -1, 1),
          new Among("ion", -1, 2), new Among("er", -1, 1),
          new Among("ous", -1, 1), new Among("ant", -1, 1),
          new Among("ent", -1, 1), new Among("ment", 15, 1),
          new Among("ement", 16, 1)
        ],
        a_8 = [new Among("e", -1, 1),
          new Among("l", -1, 2)
        ],
        a_9 = [new Among("succeed", -1, -1),
          new Among("proceed", -1, -1), new Among("exceed", -1, -1),
          new Among("canning", -1, -1), new Among("inning", -1, -1),
          new Among("earring", -1, -1), new Among("herring", -1, -1),
          new Among("outing", -1, -1)
        ],
        a_10 = [new Among("andes", -1, -1),
          new Among("atlas", -1, -1), new Among("bias", -1, -1),
          new Among("cosmos", -1, -1), new Among("dying", -1, 3),
          new Among("early", -1, 9), new Among("gently", -1, 7),
          new Among("howe", -1, -1), new Among("idly", -1, 6),
          new Among("lying", -1, 4), new Among("news", -1, -1),
          new Among("only", -1, 10), new Among("singly", -1, 11),
          new Among("skies", -1, 2), new Among("skis", -1, 1),
          new Among("sky", -1, -1), new Among("tying", -1, 5),
          new Among("ugly", -1, 8)
        ],
        g_v = [17, 65, 16, 1],
        g_v_WXY = [1, 17,
          65, 208, 1
        ],
        g_valid_LI = [55, 141, 2],
        B_Y_found, I_p2, I_p1, habr = [
          r_Step_1b, r_Step_1c, r_Step_2, r_Step_3, r_Step_4, r_Step_5
        ],
        sbp = new SnowballProgram();
      this.setCurrent = function(word) {
        sbp.setCurrent(word);
      };
      this.getCurrent = function() {
        return sbp.getCurrent();
      };

      function r_prelude() {
        var v_1 = sbp.cursor,
          v_2;
        B_Y_found = false;
        sbp.bra = sbp.cursor;
        if (sbp.eq_s(1, "'")) {
          sbp.ket = sbp.cursor;
          sbp.slice_del();
        }
        sbp.cursor = v_1;
        sbp.bra = v_1;
        if (sbp.eq_s(1, "y")) {
          sbp.ket = sbp.cursor;
          sbp.slice_from("Y");
          B_Y_found = true;
        }
        sbp.cursor = v_1;
        while (true) {
          v_2 = sbp.cursor;
          if (sbp.in_grouping(g_v, 97, 121)) {
            sbp.bra = sbp.cursor;
            if (sbp.eq_s(1, "y")) {
              sbp.ket = sbp.cursor;
              sbp.cursor = v_2;
              sbp.slice_from("Y");
              B_Y_found = true;
              continue;
            }
          }
          if (v_2 >= sbp.limit) {
            sbp.cursor = v_1;
            return;
          }
          sbp.cursor = v_2 + 1;
        }
      }

      function r_mark_regions() {
        var v_1 = sbp.cursor;
        I_p1 = sbp.limit;
        I_p2 = I_p1;
        if (!sbp.find_among(a_0, 3)) {
          sbp.cursor = v_1;
          if (habr1()) {
            sbp.cursor = v_1;
            return;
          }
        }
        I_p1 = sbp.cursor;
        if (!habr1())
          I_p2 = sbp.cursor;
      }

      function habr1() {
        while (!sbp.in_grouping(g_v, 97, 121)) {
          if (sbp.cursor >= sbp.limit)
            return true;
          sbp.cursor++;
        }
        while (!sbp.out_grouping(g_v, 97, 121)) {
          if (sbp.cursor >= sbp.limit)
            return true;
          sbp.cursor++;
        }
        return false;
      }

      function r_shortv() {
        var v_1 = sbp.limit - sbp.cursor;
        if (!(sbp.out_grouping_b(g_v_WXY, 89, 121) &&
            sbp.in_grouping_b(g_v, 97, 121) && sbp.out_grouping_b(g_v,
              97, 121))) {
          sbp.cursor = sbp.limit - v_1;
          if (!sbp.out_grouping_b(g_v, 97, 121) ||
            !sbp.in_grouping_b(g_v, 97, 121) ||
            sbp.cursor > sbp.limit_backward)
            return false;
        }
        return true;
      }

      function r_R1() {
        return I_p1 <= sbp.cursor;
      }

      function r_R2() {
        return I_p2 <= sbp.cursor;
      }

      function r_Step_1a() {
        var among_var, v_1 = sbp.limit - sbp.cursor;
        sbp.ket = sbp.cursor;
        among_var = sbp.find_among_b(a_1, 3);
        if (among_var) {
          sbp.bra = sbp.cursor;
          if (among_var == 1)
            sbp.slice_del();
        } else
          sbp.cursor = sbp.limit - v_1;
        sbp.ket = sbp.cursor;
        among_var = sbp.find_among_b(a_2, 6);
        if (among_var) {
          sbp.bra = sbp.cursor;
          switch (among_var) {
            case 1:
              sbp.slice_from("ss");
              break;
            case 2:
              var c = sbp.cursor - 2;
              if (sbp.limit_backward > c || c > sbp.limit) {
                sbp.slice_from("ie");
                break;
              }
              sbp.cursor = c;
              sbp.slice_from("i");
              break;
            case 3:
              do {
                if (sbp.cursor <= sbp.limit_backward)
                  return;
                sbp.cursor--;
              } while (!sbp.in_grouping_b(g_v, 97, 121));
              sbp.slice_del();
              break;
          }
        }
      }

      function r_Step_1b() {
        var among_var, v_1, v_3, v_4;
        sbp.ket = sbp.cursor;
        among_var = sbp.find_among_b(a_4, 6);
        if (among_var) {
          sbp.bra = sbp.cursor;
          switch (among_var) {
            case 1:
              if (r_R1())
                sbp.slice_from("ee");
              break;
            case 2:
              v_1 = sbp.limit - sbp.cursor;
              while (!sbp.in_grouping_b(g_v, 97, 121)) {
                if (sbp.cursor <= sbp.limit_backward)
                  return;
                sbp.cursor--;
              }
              sbp.cursor = sbp.limit - v_1;
              sbp.slice_del();
              v_3 = sbp.limit - sbp.cursor;
              among_var = sbp.find_among_b(a_3, 13);
              if (among_var) {
                sbp.cursor = sbp.limit - v_3;
                switch (among_var) {
                  case 1:
                    var c = sbp.cursor;
                    sbp.insert(sbp.cursor, sbp.cursor, "e");
                    sbp.cursor = c;
                    break;
                  case 2:
                    sbp.ket = sbp.cursor;
                    if (sbp.cursor > sbp.limit_backward) {
                      sbp.cursor--;
                      sbp.bra = sbp.cursor;
                      sbp.slice_del();
                    }
                    break;
                  case 3:
                    if (sbp.cursor == I_p1) {
                      v_4 = sbp.limit - sbp.cursor;
                      if (r_shortv()) {
                        sbp.cursor = sbp.limit - v_4;
                        var c = sbp.cursor;
                        sbp.insert(sbp.cursor, sbp.cursor, "e");
                        sbp.cursor = c;
                      }
                    }
                    break;
                }
              }
              break;
          }
        }
      }

      function r_Step_1c() {
        var v_1 = sbp.limit - sbp.cursor;
        sbp.ket = sbp.cursor;
        if (!sbp.eq_s_b(1, "y")) {
          sbp.cursor = sbp.limit - v_1;
          if (!sbp.eq_s_b(1, "Y"))
            return;
        }
        sbp.bra = sbp.cursor;
        if (sbp.out_grouping_b(g_v, 97, 121) && sbp.cursor > sbp.limit_backward)
          sbp.slice_from("i");
      }

      function r_Step_2() {
        var among_var;
        sbp.ket = sbp.cursor;
        among_var = sbp.find_among_b(a_5, 24);
        if (among_var) {
          sbp.bra = sbp.cursor;
          if (r_R1()) {
            switch (among_var) {
              case 1:
                sbp.slice_from("tion");
                break;
              case 2:
                sbp.slice_from("ence");
                break;
              case 3:
                sbp.slice_from("ance");
                break;
              case 4:
                sbp.slice_from("able");
                break;
              case 5:
                sbp.slice_from("ent");
                break;
              case 6:
                sbp.slice_from("ize");
                break;
              case 7:
                sbp.slice_from("ate");
                break;
              case 8:
                sbp.slice_from("al");
                break;
              case 9:
                sbp.slice_from("ful");
                break;
              case 10:
                sbp.slice_from("ous");
                break;
              case 11:
                sbp.slice_from("ive");
                break;
              case 12:
                sbp.slice_from("ble");
                break;
              case 13:
                if (sbp.eq_s_b(1, "l"))
                  sbp.slice_from("og");
                break;
              case 14:
                sbp.slice_from("ful");
                break;
              case 15:
                sbp.slice_from("less");
                break;
              case 16:
                if (sbp.in_grouping_b(g_valid_LI, 99, 116))
                  sbp.slice_del();
                break;
            }
          }
        }
      }

      function r_Step_3() {
        var among_var;
        sbp.ket = sbp.cursor;
        among_var = sbp.find_among_b(a_6, 9);
        if (among_var) {
          sbp.bra = sbp.cursor;
          if (r_R1()) {
            switch (among_var) {
              case 1:
                sbp.slice_from("tion");
                break;
              case 2:
                sbp.slice_from("ate");
                break;
              case 3:
                sbp.slice_from("al");
                break;
              case 4:
                sbp.slice_from("ic");
                break;
              case 5:
                sbp.slice_del();
                break;
              case 6:
                if (r_R2())
                  sbp.slice_del();
                break;
            }
          }
        }
      }

      function r_Step_4() {
        var among_var, v_1;
        sbp.ket = sbp.cursor;
        among_var = sbp.find_among_b(a_7, 18);
        if (among_var) {
          sbp.bra = sbp.cursor;
          if (r_R2()) {
            switch (among_var) {
              case 1:
                sbp.slice_del();
                break;
              case 2:
                v_1 = sbp.limit - sbp.cursor;
                if (!sbp.eq_s_b(1, "s")) {
                  sbp.cursor = sbp.limit - v_1;
                  if (!sbp.eq_s_b(1, "t"))
                    return;
                }
                sbp.slice_del();
                break;
            }
          }
        }
      }

      function r_Step_5() {
        var among_var, v_1;
        sbp.ket = sbp.cursor;
        among_var = sbp.find_among_b(a_8, 2);
        if (among_var) {
          sbp.bra = sbp.cursor;
          switch (among_var) {
            case 1:
              v_1 = sbp.limit - sbp.cursor;
              if (!r_R2()) {
                sbp.cursor = sbp.limit - v_1;
                if (!r_R1() || r_shortv())
                  return;
                sbp.cursor = sbp.limit - v_1;
              }
              sbp.slice_del();
              break;
            case 2:
              if (!r_R2() || !sbp.eq_s_b(1, "l"))
                return;
              sbp.slice_del();
              break;
          }
        }
      }

      function r_exception2() {
        sbp.ket = sbp.cursor;
        if (sbp.find_among_b(a_9, 8)) {
          sbp.bra = sbp.cursor;
          return sbp.cursor <= sbp.limit_backward;
        }
        return false;
      }

      function r_exception1() {
        var among_var;
        sbp.bra = sbp.cursor;
        among_var = sbp.find_among(a_10, 18);
        if (among_var) {
          sbp.ket = sbp.cursor;
          if (sbp.cursor >= sbp.limit) {
            switch (among_var) {
              case 1:
                sbp.slice_from("ski");
                break;
              case 2:
                sbp.slice_from("sky");
                break;
              case 3:
                sbp.slice_from("die");
                break;
              case 4:
                sbp.slice_from("lie");
                break;
              case 5:
                sbp.slice_from("tie");
                break;
              case 6:
                sbp.slice_from("idl");
                break;
              case 7:
                sbp.slice_from("gentl");
                break;
              case 8:
                sbp.slice_from("ugli");
                break;
              case 9:
                sbp.slice_from("earli");
                break;
              case 10:
                sbp.slice_from("onli");
                break;
              case 11:
                sbp.slice_from("singl");
                break;
            }
            return true;
          }
        }
        return false;
      }

      function r_postlude() {
        var v_1;
        if (B_Y_found) {
          while (true) {
            v_1 = sbp.cursor;
            sbp.bra = v_1;
            if (sbp.eq_s(1, "Y")) {
              sbp.ket = sbp.cursor;
              sbp.cursor = v_1;
              sbp.slice_from("y");
              continue;
            }
            sbp.cursor = v_1;
            if (sbp.cursor >= sbp.limit)
              return;
            sbp.cursor++;
          }
        }
      }
      this.stem = function() {
        var v_1 = sbp.cursor;
        if (!r_exception1()) {
          sbp.cursor = v_1;
          var c = sbp.cursor + 3;
          if (0 <= c && c <= sbp.limit) {
            sbp.cursor = v_1;
            r_prelude();
            sbp.cursor = v_1;
            r_mark_regions();
            sbp.limit_backward = v_1;
            sbp.cursor = sbp.limit;
            r_Step_1a();
            sbp.cursor = sbp.limit;
            if (!r_exception2())
              for (var i = 0; i < habr.length; i++) {
                sbp.cursor = sbp.limit;
                habr[i]();
              }
            sbp.cursor = sbp.limit_backward;
            r_postlude();
          }
        }
        return true;
      }
    }
  /**
   * Stem a given word.
   * @param {string} word - The word to be stemmed.
   * @returns {string} The stemmed word.
   */
  return function(word) {
    st.setCurrent(word);
    st.stem();
    return st.getCurrent();
  }
})();

/**
 * An entity recognizer that can recognizes time expressions. Returned entities value is the same of {@link Bravey.Date.formatTime}.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @returns {Bravey.RegexEntityRecognizer}
 */
Bravey.Language.EN.TimeEntityRecognizer = function(entityName) {

  var matcher = new Bravey.RegexEntityRecognizer(entityName);

  var mins = new Bravey.Text.RegexMap([{
    str: ["quarter to~"],
    val: -15 * Bravey.Date.MINUTE
  }, {
    str: ["half past~"],
    val: 30 * Bravey.Date.MINUTE
  }, {
    str: ["quarter past~"],
    val: 15 * Bravey.Date.MINUTE
  }], 0);

  var daytime = new Bravey.Text.RegexMap([{
    str: ["in the morning~", "am~"],
    val: 0
  }, {
    str: ["in the afternoon~", "in the evening~", "pm~"],
    val: 12 * Bravey.Date.HOUR
  }], 0)

  matcher.addMatch(
    new RegExp(
      "\\b(at\\b)?" + Bravey.Text.WORDSEP +
      mins.regex() + Bravey.Text.WORDSEP +
      "([0-9]+)" + Bravey.Text.WORDSEP +
      "(and\\b|:\\b)?" + Bravey.Text.WORDSEP +
      "([0-9]+)?" + Bravey.Text.WORDSEP +
      "(minutes\\b)?" + Bravey.Text.WORDSEP +
      "(o'clock\\b)?" + Bravey.Text.WORDSEP +
      daytime.regex(),
      "gi"),
    function(match) {
      var time = match[3] * 1 * Bravey.Date.HOUR;
      if (match[5]) time += match[5] * 1 * Bravey.Date.MINUTE;
      time += mins.get(match, 2);
      time += daytime.get(match, 8);
      if (Bravey.Text.calculateScore(match, [1, 2, 4, 5, 6, 7, 8])) return Bravey.Date.formatTime(time);
    }
  );

  matcher.bindTo(this);

};

/**
 * An entity recognizer that can recognizes time period expressions. Returned entities value <tt>{"start":"HH:MM:SS","end":"HH:MM:SS"}</tt>.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @returns {Bravey.RegexEntityRecognizer}
 * @todo from x to y, etc...
 */
Bravey.Language.EN.TimePeriodEntityRecognizer = function(entityName) {

  var matcher = new Bravey.RegexEntityRecognizer(entityName);

  var rangematcher = new Bravey.Text.RegexMap([{
    str: ["second", "seconds"],
    val: Bravey.Date.SECOND
  }, {
    str: ["minute", "minutes"],
    val: Bravey.Date.MINUTE
  }, {
    str: ["hour", "hours"],
    val: Bravey.Date.HOUR
  }], 0);

  matcher.addMatch(
    new RegExp(
      "\\b(in\\b)?" + Bravey.Text.WORDSEP +
      "([0-9]+)" + Bravey.Text.WORDSEP +
      rangematcher.regex(1) +
      "\\b", "gi"),
    function(match) {
      var then, now, date = new Date();
      now = then = (date.getHours() * Bravey.Date.HOUR) + (date.getMinutes() * Bravey.Date.MINUTE);
      then += (match[2] * rangematcher.get(match, 3));
      if (Bravey.Text.calculateScore(match, [1, 3])) return {
        start: Bravey.Date.formatTime(now),
        end: Bravey.Date.formatTime(then)
      };
    }
  );

  matcher.addMatch(new RegExp("\\b(in the evening|this evening|evening)\\b", "gi"), function(match) {
    return {
      start: "12:00:00",
      end: "23:59:00"
    }
  });
  matcher.addMatch(new RegExp("\\b(in the afternoon|this afternoon|afternoon)\\b", "gi"), function(match) {
    return {
      start: "15:00:00",
      end: "23:59:00"
    }
  });
  matcher.addMatch(new RegExp("\\b(in the morning|this morning|morning)\\b", "gi"), function(match) {
    return {
      start: "08:00:00",
      end: "12:00:00"
    }
  });

  matcher.bindTo(this);
};

/**
 * An entity recognizer that can recognizes date expressions. Returned entities value is the same of {@link Bravey.Date.formatDate}.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @returns {Bravey.RegexEntityRecognizer}
 * @todo first of january, etc...
 */
Bravey.Language.EN.DateEntityRecognizer = function(entityName) {

  var matcher = new Bravey.RegexEntityRecognizer(entityName);

  var prefixes = "\\b(day of|last\\b)?" + Bravey.Text.WORDSEP;

  var months = new Bravey.Text.RegexMap([{
    str: ["january~", "jan~", "1~", "01~"],
    val: 0
  }, {
    str: ["february~", "feb~", "2~", "02~"],
    val: 1
  }, {
    str: ["march~", "mar~", "3~", "03~"],
    val: 2
  }, {
    str: ["april~", "apr~", "4~", "04~"],
    val: 3
  }, {
    str: ["may~", "may~", "5~", "05~"],
    val: 4
  }, {
    str: ["june~", "june~", "6~", "06~"],
    val: 5
  }, {
    str: ["july~", "july~", "7~", "07~"],
    val: 6
  }, {
    str: ["august~", "aug~", "8~", "08~"],
    val: 7
  }, {
    str: ["september~", "sep~", "sept~", "9~", "09~"],
    val: 8
  }, {
    str: ["october~", "oct~", "10~"],
    val: 9
  }, {
    str: ["november~", "nov~", "11~"],
    val: 10
  }, {
    str: ["december~", "dec~", "12~"],
    val: 11
  }], 0);

  // M/(D??)/(Y??)
  matcher.addMatch(
    new RegExp(
      prefixes +
      months.regex(1) + Bravey.Text.WORDSEP +
      "([0-9]{1,2})?" + Bravey.Text.WORDSEP +
      "(st\\b|nd\\b|rd\\b|th\\b)?" + Bravey.Text.WORDSEP +
      "(of\\b|,\\b)?" + Bravey.Text.WORDSEP +
      "([0-9]{2,4})?" +
      "\\b", "gi"),
    function(match) {
      var now = new Date();
      var y = now.getFullYear();
      var m = now.getMonth();
      var d = 1;

      m = months.get(match, 2, m);
      if (match[3]) d = match[3] * 1;
      if (match[6]) y = match[6] * 1;
      y = Bravey.Date.centuryFinder(y);
      if (Bravey.Text.calculateScore(match, [1, 3, 6])) return Bravey.Date.formatDate((new Date(y, m, d, 0, 0, 0, 0)).getTime());
    }
  );

  // D/M/Y
  matcher.addMatch(
    new RegExp(
      prefixes +
      "([0-9]{1,2})" + Bravey.Text.WORDSEP +
      "(st\\b|nd\\b|rd\\b|th\\b)?" + Bravey.Text.WORDSEP +
      "(of\\b|,\\b|/\\b|-\\b|\\b)" + Bravey.Text.WORDSEP +
      months.regex() +
      "(of\\b|,\\b|/\\b|-\\b)?" + Bravey.Text.WORDSEP +
      "([0-9]{2,4})?" +
      "\\b", "gi"),
    function(match) {
      var now = new Date();
      var y = now.getFullYear();
      var m = now.getMonth();
      var d = now.getDate();

      d = match[2] * 1;
      m = months.get(match, 5, m);
      if (match[7]) y = match[7] * 1;
      y = Bravey.Date.centuryFinder(y);
      if (Bravey.Text.calculateScore(match, [1, 5, 7])) return Bravey.Date.formatDate((new Date(y, m, d, 0, 0, 0, 0)).getTime());
    },
    10
  );

  matcher.addMatch(new RegExp(prefixes + "(today)\\b", "gi"), function(match) {
    return Bravey.Date.formatDate((new Date()).getTime());
  });
  matcher.addMatch(new RegExp(prefixes + "(tomorrow)\\b", "gi"), function(match) {
    return Bravey.Date.formatDate((new Date()).getTime() + Bravey.Date.DAY)
  });
  matcher.addMatch(new RegExp(prefixes + "(the day after tomorrow)\\b", "gi"), function(match) {
    return Bravey.Date.formatDate((new Date()).getTime() + (Bravey.Date.DAY * 2))
  });
  matcher.addMatch(new RegExp(prefixes + "(yesterday)\\b", "gi"), function(match) {
    return Bravey.Date.formatDate((new Date()).getTime() - Bravey.Date.DAY)
  });

  matcher.bindTo(this);
}

/**
 * An free text entity recognizer with preconfigured conjunctions. Derived from {@link Bravey.FreeTextEntityRecognizer}.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @returns {Bravey.RegexEntityRecognizer}
 */
Bravey.Language.EN.FreeTextEntityRecognizer = function(entityName, priority) {
  var commas = ["thanks", "please"];

  var matcher = new Bravey.FreeTextEntityRecognizer(entityName, priority);
  matcher.addConjunction("is");
  matcher.addConjunction("are");
  matcher.addConjunction("should be");
  matcher.addConjunction("may be");
  for (var i = 0; i < commas.length; i++) {
    matcher.addConjunction(commas[i]);
    matcher.addConjunction("," + commas[i]);
    matcher.addConjunction(", " + commas[i]);
  }

  return matcher;

}

/* English numbers matching patterns. */
Bravey.Language.EN.Numbers = {
  wordsSeparator: /(\w+)([^\w]+)/gi,
  sum: {
    'zero': 0,
    'one': 1,
    'two': 2,
    'three': 3,
    'four': 4,
    'five': 5,
    'six': 6,
    'seven': 7,
    'eight': 8,
    'nine': 9,
    'ten': 10,
    'eleven': 11,
    'twelve': 12,
    'thirteen': 13,
    'fourteen': 14,
    'fifteen': 15,
    'sixteen': 16,
    'seventeen': 17,
    'eighteen': 18,
    'nineteen': 19,
    'twenty': 20,
    'thirty': 30,
    'forty': 40,
    'fifty': 50,
    'sixty': 60,
    'seventy': 70,
    'eighty': 80,
    'ninety': 90,
  },
  mul: {
    'thousand': 1000,
    'million': 1000000
  }
}

/**
 * Recognizes numbers line '123' or 'one hundred twenty three'. 
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @returns {Bravey.RegexEntityRecognizer}
 */
Bravey.Language.EN.NumberEntityRecognizer = function(entityName, priority) {
  this.getName = function() {
    return entityName;
  }

  this.getEntities = function(string, out) {
    if (!out) out = [];
    var tokens = string.toLowerCase().split(/(\w+)/);

    var mul, token, temp = 0,
      sum = 0,
      isnumber, current, valid, cursor = 0,
      end;
    for (var i = 0; i < tokens.length + 1; i++) {
      token = tokens[i] == undefined ? "*" : tokens[i];
      isnumber = true;
      if (!current) {
        valid = 0;
        current = {
          value: 0,
          entity: entityName,
          string: "",
          priority: priority || 0
        };
      }
      if (token.trim()) {
        if (Bravey.Language.EN.Numbers.sum[token] != null)
          sum += Bravey.Language.EN.Numbers.sum[token];
        else if (token == 'hundred')
          sum *= 100;
        else if (!isNaN(token * 1)) {
          if (valid) {
            i--;
            token = "";
            isnumber = false;
          } else temp = token * 1;
        } else if (Bravey.Language.EN.Numbers.mul[token]) {
          mul = Bravey.Language.EN.Numbers.mul[token];
          temp += sum * mul;
          sum = 0;
        } else isnumber = false;
        if (isnumber) {
          valid = 1;
          end = cursor + token.length;
          if (current.position == undefined) current.position = cursor;
        } else if (valid) {
          current.value = temp + sum;
          current.string = string.substr(current.position, end - current.position);
          out.push(current);
          temp = sum = current = 0;
        }
      }
      cursor += token.length;
    }
    return out;
  }
}
// File:src/languages/pt.js

/**
 * Portuguese language functions.
 * @namespace
 */
Bravey.Language.PT = {};

/**
 * Creates a portuguese words stemmer (i.e. stemmed version of "bocados" or "bocado" is always "boc").
 * @constructor
 */
Bravey.Language.PT.Stemmer = (function() {

  /**
   * Base stemmer obtained from https://github.com/snowballstem/snowball-website
   */
  function BaseStemmer() {
    this.setCurrent = function(value) {
      this.current = value;
      this.cursor = 0;
      this.limit = this.current.length;
      this.limit_backward = 0;
      this.bra = this.cursor;
      this.ket = this.limit;
    };

    this.getCurrent = function() {
      return this.current;
    };

    this.copy_from = function(other) {
      this.current = other.current;
      this.cursor = other.cursor;
      this.limit = other.limit;
      this.limit_backward = other.limit_backward;
      this.bra = other.bra;
      this.ket = other.ket;
    };

    this.in_grouping = function(s, min, max) {
      if (this.cursor >= this.limit) return false;
      var ch = this.current.charCodeAt(this.cursor);
      if (ch > max || ch < min) return false;
      ch -= min;
      if ((s[ch >>> 3] & (0x1 << (ch & 0x7))) == 0) return false;
      this.cursor++;
      return true;
    };

    this.in_grouping_b = function(s, min, max) {
      if (this.cursor <= this.limit_backward) return false;
      var ch = this.current.charCodeAt(this.cursor - 1);
      if (ch > max || ch < min) return false;
      ch -= min;
      if ((s[ch >>> 3] & (0x1 << (ch & 0x7))) == 0) return false;
      this.cursor--;
      return true;
    };

    this.out_grouping = function(s, min, max) {
      if (this.cursor >= this.limit) return false;
      var ch = this.current.charCodeAt(this.cursor);
      if (ch > max || ch < min) {
        this.cursor++;
        return true;
      }
      ch -= min;
      if ((s[ch >>> 3] & (0X1 << (ch & 0x7))) == 0) {
        this.cursor++;
        return true;
      }
      return false;
    };

    this.out_grouping_b = function(s, min, max) {
      if (this.cursor <= this.limit_backward) return false;
      var ch = this.current.charCodeAt(this.cursor - 1);
      if (ch > max || ch < min) {
        this.cursor--;
        return true;
      }
      ch -= min;
      if ((s[ch >>> 3] & (0x1 << (ch & 0x7))) == 0) {
        this.cursor--;
        return true;
      }
      return false;
    };

    this.eq_s = function(s) {
      if (this.limit - this.cursor < s.length) return false;
      if (this.current.slice(this.cursor, this.cursor + s.length) != s) {
        return false;
      }
      this.cursor += s.length;
      return true;
    };

    this.eq_s_b = function(s) {
      if (this.cursor - this.limit_backward < s.length) return false;
      if (this.current.slice(this.cursor - s.length, this.cursor) != s) {
        return false;
      }
      this.cursor -= s.length;
      return true;
    };

    /** @return {number} */
    this.find_among = function(v) {
      var i = 0;
      var j = v.length;

      var c = this.cursor;
      var l = this.limit;

      var common_i = 0;
      var common_j = 0;

      var first_key_inspected = false;

      while (true) {
        var k = i + ((j - i) >>> 1);
        var diff = 0;
        var common = common_i < common_j ? common_i : common_j; // smaller
        var w = v[k];
        var i2;
        /// s : string, substring_i : int, result : int, method
        for (i2 = common; i2 < w[0].length; i2++) {
          if (c + common == l) {
            diff = -1;
            break;
          }
          diff = this.current.charCodeAt(c + common) - w[0].charCodeAt(i2);
          if (diff != 0) break;
          common++;
        }
        if (diff < 0) {
          j = k;
          common_j = common;
        } else {
          i = k;
          common_i = common;
        }
        if (j - i <= 1) {
          if (i > 0) break; // v->s has been inspected
          if (j == i) break; // only one item in v

          // - but now we need to go round once more to get
          // v->s inspected. This looks messy, but is actually
          // the optimal approach.

          if (first_key_inspected) break;
          first_key_inspected = true;
        }
      }
      while (true) {
        var w = v[i];
        if (common_i >= w[0].length) {
          this.cursor = c + w[0].length;
          if (w.length < 4) return w[2];
          var res = w[3](this);
          this.cursor = c + w[0].length;
          if (res) return w[2];
        }
        i = w[1];
        if (i < 0) return 0;
      }
    };

    // find_among_b is for backwards processing. Same comments apply
    this.find_among_b = function(v) {
      var i = 0;
      var j = v.length

      var c = this.cursor;
      var lb = this.limit_backward;

      var common_i = 0;
      var common_j = 0;

      var first_key_inspected = false;

      while (true) {
        var k = i + ((j - i) >> 1);
        var diff = 0;
        var common = common_i < common_j ? common_i : common_j;
        var w = v[k];
        var i2;
        for (i2 = w[0].length - 1 - common; i2 >= 0; i2--) {
          if (c - common == lb) {
            diff = -1;
            break;
          }
          diff = this.current.charCodeAt(c - 1 - common) - w[0].charCodeAt(i2);
          if (diff != 0) break;
          common++;
        }
        if (diff < 0) {
          j = k;
          common_j = common;
        } else {
          i = k;
          common_i = common;
        }
        if (j - i <= 1) {
          if (i > 0) break;
          if (j == i) break;
          if (first_key_inspected) break;
          first_key_inspected = true;
        }
      }
      while (true) {
        var w = v[i];
        if (common_i >= w[0].length) {
          this.cursor = c - w[0].length;
          if (w.length < 4) return w[2];
          var res = w[3](this);
          this.cursor = c - w[0].length;
          if (res) return w[2];
        }
        i = w[1];
        if (i < 0) return 0;
      }
    };

    /* to replace chars between c_bra and c_ket in this.current by the
     * chars in s.
     */
    this.replace_s = function(c_bra, c_ket, s) {
      var adjustment = s.length - (c_ket - c_bra);
      this.current = this.current.slice(0, c_bra) + s + this.current.slice(c_ket);
      this.limit += adjustment;
      if (this.cursor >= c_ket) this.cursor += adjustment;
      else if (this.cursor > c_bra) this.cursor = c_bra;
      return adjustment;
    };

    this.slice_check = function() {
      if (this.bra < 0 ||
        this.bra > this.ket ||
        this.ket > this.limit ||
        this.limit > this.current.length) {
        return false;
      }
      return true;
    };

    this.slice_from = function(s) {
      var result = false;
      if (this.slice_check()) {
        this.replace_s(this.bra, this.ket, s);
        result = true;
      }
      return result;
    };

    this.slice_del = function() {
      return this.slice_from("");
    };

    this.insert = function(c_bra, c_ket, s) {
      var adjustment = this.replace_s(c_bra, c_ket, s);
      if (c_bra <= this.bra) this.bra += adjustment;
      if (c_bra <= this.ket) this.ket += adjustment;
    };

    this.slice_to = function() {
      var result = '';
      if (this.slice_check()) {
        result = this.current.slice(this.bra, this.ket);
      }
      return result;
    };

    this.assign_to = function() {
      return this.current.slice(0, this.limit);
    };
  };

  /**
   * Portuguese stemmer obtained from https://github.com/snowballstem/snowball-website
   */
  function PortugueseStemmer() {
    var base = new BaseStemmer();
    /** @const */
    var a_0 = [
      ["", -1, 3],
      ["\u00E3", 0, 1],
      ["\u00F5", 0, 2]
    ];

    /** @const */
    var a_1 = [
      ["", -1, 3],
      ["a~", 0, 1],
      ["o~", 0, 2]
    ];

    /** @const */
    var a_2 = [
      ["ic", -1, -1],
      ["ad", -1, -1],
      ["os", -1, -1],
      ["iv", -1, 1]
    ];

    /** @const */
    var a_3 = [
      ["ante", -1, 1],
      ["avel", -1, 1],
      ["\u00EDvel", -1, 1]
    ];

    /** @const */
    var a_4 = [
      ["ic", -1, 1],
      ["abil", -1, 1],
      ["iv", -1, 1]
    ];

    /** @const */
    var a_5 = [
      ["ica", -1, 1],
      ["\u00E2ncia", -1, 1],
      ["\u00EAncia", -1, 4],
      ["logia", -1, 2],
      ["ira", -1, 9],
      ["adora", -1, 1],
      ["osa", -1, 1],
      ["ista", -1, 1],
      ["iva", -1, 8],
      ["eza", -1, 1],
      ["idade", -1, 7],
      ["ante", -1, 1],
      ["mente", -1, 6],
      ["amente", 12, 5],
      ["\u00E1vel", -1, 1],
      ["\u00EDvel", -1, 1],
      ["ico", -1, 1],
      ["ismo", -1, 1],
      ["oso", -1, 1],
      ["amento", -1, 1],
      ["imento", -1, 1],
      ["ivo", -1, 8],
      ["a\u00E7a~o", -1, 1],
      ["u\u00E7a~o", -1, 3],
      ["ador", -1, 1],
      ["icas", -1, 1],
      ["\u00EAncias", -1, 4],
      ["logias", -1, 2],
      ["iras", -1, 9],
      ["adoras", -1, 1],
      ["osas", -1, 1],
      ["istas", -1, 1],
      ["ivas", -1, 8],
      ["ezas", -1, 1],
      ["idades", -1, 7],
      ["adores", -1, 1],
      ["antes", -1, 1],
      ["a\u00E7o~es", -1, 1],
      ["u\u00E7o~es", -1, 3],
      ["icos", -1, 1],
      ["ismos", -1, 1],
      ["osos", -1, 1],
      ["amentos", -1, 1],
      ["imentos", -1, 1],
      ["ivos", -1, 8]
    ];

    /** @const */
    var a_6 = [
      ["ada", -1, 1],
      ["ida", -1, 1],
      ["ia", -1, 1],
      ["aria", 2, 1],
      ["eria", 2, 1],
      ["iria", 2, 1],
      ["ara", -1, 1],
      ["era", -1, 1],
      ["ira", -1, 1],
      ["ava", -1, 1],
      ["asse", -1, 1],
      ["esse", -1, 1],
      ["isse", -1, 1],
      ["aste", -1, 1],
      ["este", -1, 1],
      ["iste", -1, 1],
      ["ei", -1, 1],
      ["arei", 16, 1],
      ["erei", 16, 1],
      ["irei", 16, 1],
      ["am", -1, 1],
      ["iam", 20, 1],
      ["ariam", 21, 1],
      ["eriam", 21, 1],
      ["iriam", 21, 1],
      ["aram", 20, 1],
      ["eram", 20, 1],
      ["iram", 20, 1],
      ["avam", 20, 1],
      ["em", -1, 1],
      ["arem", 29, 1],
      ["erem", 29, 1],
      ["irem", 29, 1],
      ["assem", 29, 1],
      ["essem", 29, 1],
      ["issem", 29, 1],
      ["ado", -1, 1],
      ["ido", -1, 1],
      ["ando", -1, 1],
      ["endo", -1, 1],
      ["indo", -1, 1],
      ["ara~o", -1, 1],
      ["era~o", -1, 1],
      ["ira~o", -1, 1],
      ["ar", -1, 1],
      ["er", -1, 1],
      ["ir", -1, 1],
      ["as", -1, 1],
      ["adas", 47, 1],
      ["idas", 47, 1],
      ["ias", 47, 1],
      ["arias", 50, 1],
      ["erias", 50, 1],
      ["irias", 50, 1],
      ["aras", 47, 1],
      ["eras", 47, 1],
      ["iras", 47, 1],
      ["avas", 47, 1],
      ["es", -1, 1],
      ["ardes", 58, 1],
      ["erdes", 58, 1],
      ["irdes", 58, 1],
      ["ares", 58, 1],
      ["eres", 58, 1],
      ["ires", 58, 1],
      ["asses", 58, 1],
      ["esses", 58, 1],
      ["isses", 58, 1],
      ["astes", 58, 1],
      ["estes", 58, 1],
      ["istes", 58, 1],
      ["is", -1, 1],
      ["ais", 71, 1],
      ["eis", 71, 1],
      ["areis", 73, 1],
      ["ereis", 73, 1],
      ["ireis", 73, 1],
      ["\u00E1reis", 73, 1],
      ["\u00E9reis", 73, 1],
      ["\u00EDreis", 73, 1],
      ["\u00E1sseis", 73, 1],
      ["\u00E9sseis", 73, 1],
      ["\u00EDsseis", 73, 1],
      ["\u00E1veis", 73, 1],
      ["\u00EDeis", 73, 1],
      ["ar\u00EDeis", 84, 1],
      ["er\u00EDeis", 84, 1],
      ["ir\u00EDeis", 84, 1],
      ["ados", -1, 1],
      ["idos", -1, 1],
      ["amos", -1, 1],
      ["\u00E1ramos", 90, 1],
      ["\u00E9ramos", 90, 1],
      ["\u00EDramos", 90, 1],
      ["\u00E1vamos", 90, 1],
      ["\u00EDamos", 90, 1],
      ["ar\u00EDamos", 95, 1],
      ["er\u00EDamos", 95, 1],
      ["ir\u00EDamos", 95, 1],
      ["emos", -1, 1],
      ["aremos", 99, 1],
      ["eremos", 99, 1],
      ["iremos", 99, 1],
      ["\u00E1ssemos", 99, 1],
      ["\u00EAssemos", 99, 1],
      ["\u00EDssemos", 99, 1],
      ["imos", -1, 1],
      ["armos", -1, 1],
      ["ermos", -1, 1],
      ["irmos", -1, 1],
      ["\u00E1mos", -1, 1],
      ["ar\u00E1s", -1, 1],
      ["er\u00E1s", -1, 1],
      ["ir\u00E1s", -1, 1],
      ["eu", -1, 1],
      ["iu", -1, 1],
      ["ou", -1, 1],
      ["ar\u00E1", -1, 1],
      ["er\u00E1", -1, 1],
      ["ir\u00E1", -1, 1]
    ];

    /** @const */
    var a_7 = [
      ["a", -1, 1],
      ["i", -1, 1],
      ["o", -1, 1],
      ["os", -1, 1],
      ["\u00E1", -1, 1],
      ["\u00ED", -1, 1],
      ["\u00F3", -1, 1]
    ];

    /** @const */
    var a_8 = [
      ["e", -1, 1],
      ["\u00E7", -1, 2],
      ["\u00E9", -1, 1],
      ["\u00EA", -1, 1]
    ];

    /** @const */
    var /** Array<int> */ g_v = [17, 65, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 19, 12, 2];

    var /** number */ I_p2 = 0;
    var /** number */ I_p1 = 0;
    var /** number */ I_pV = 0;


    /** @return {boolean} */
    function r_prelude() {
      var /** number */ among_var;
      // repeat, line 36
      replab0: while (true) {
        var /** number */ v_1 = base.cursor;
        lab1: {
          // (, line 36
          // [, line 37
          base.bra = base.cursor;
          // substring, line 37
          among_var = base.find_among(a_0);
          if (among_var == 0) {
            break lab1;
          }
          // ], line 37
          base.ket = base.cursor;
          switch (among_var) {
            case 0:
              break lab1;
            case 1:
              // (, line 38
              // <-, line 38
              if (!base.slice_from("a~")) {
                return false;
              }
              break;
            case 2:
              // (, line 39
              // <-, line 39
              if (!base.slice_from("o~")) {
                return false;
              }
              break;
            case 3:
              // (, line 40
              // next, line 40
              if (base.cursor >= base.limit) {
                break lab1;
              }
              base.cursor++;
              break;
          }
          continue replab0;
        }
        base.cursor = v_1;
        break replab0;
      }
      return true;
    };

    /** @return {boolean} */
    function r_mark_regions() {
      // (, line 44
      I_pV = base.limit;
      I_p1 = base.limit;
      I_p2 = base.limit;
      // do, line 50
      var /** number */ v_1 = base.cursor;
      lab0: {
        // (, line 50
        // or, line 52
        lab1: {
          var /** number */ v_2 = base.cursor;
          lab2: {
            // (, line 51
            if (!(base.in_grouping(g_v, 97, 250))) {
              break lab2;
            }
            // or, line 51
            lab3: {
              var /** number */ v_3 = base.cursor;
              lab4: {
                // (, line 51
                if (!(base.out_grouping(g_v, 97, 250))) {
                  break lab4;
                }
                // gopast, line 51
                golab5: while (true) {
                  lab6: {
                    if (!(base.in_grouping(g_v, 97, 250))) {
                      break lab6;
                    }
                    break golab5;
                  }
                  if (base.cursor >= base.limit) {
                    break lab4;
                  }
                  base.cursor++;
                }
                break lab3;
              }
              base.cursor = v_3;
              // (, line 51
              if (!(base.in_grouping(g_v, 97, 250))) {
                break lab2;
              }
              // gopast, line 51
              golab7: while (true) {
                lab8: {
                  if (!(base.out_grouping(g_v, 97, 250))) {
                    break lab8;
                  }
                  break golab7;
                }
                if (base.cursor >= base.limit) {
                  break lab2;
                }
                base.cursor++;
              }
            }
            break lab1;
          }
          base.cursor = v_2;
          // (, line 53
          if (!(base.out_grouping(g_v, 97, 250))) {
            break lab0;
          }
          // or, line 53
          lab9: {
            var /** number */ v_6 = base.cursor;
            lab10: {
              // (, line 53
              if (!(base.out_grouping(g_v, 97, 250))) {
                break lab10;
              }
              // gopast, line 53
              golab11: while (true) {
                lab12: {
                  if (!(base.in_grouping(g_v, 97, 250))) {
                    break lab12;
                  }
                  break golab11;
                }
                if (base.cursor >= base.limit) {
                  break lab10;
                }
                base.cursor++;
              }
              break lab9;
            }
            base.cursor = v_6;
            // (, line 53
            if (!(base.in_grouping(g_v, 97, 250))) {
              break lab0;
            }
            // next, line 53
            if (base.cursor >= base.limit) {
              break lab0;
            }
            base.cursor++;
          }
        }
        // setmark pV, line 54
        I_pV = base.cursor;
      }
      base.cursor = v_1;
      // do, line 56
      var /** number */ v_8 = base.cursor;
      lab13: {
        // (, line 56
        // gopast, line 57
        golab14: while (true) {
          lab15: {
            if (!(base.in_grouping(g_v, 97, 250))) {
              break lab15;
            }
            break golab14;
          }
          if (base.cursor >= base.limit) {
            break lab13;
          }
          base.cursor++;
        }
        // gopast, line 57
        golab16: while (true) {
          lab17: {
            if (!(base.out_grouping(g_v, 97, 250))) {
              break lab17;
            }
            break golab16;
          }
          if (base.cursor >= base.limit) {
            break lab13;
          }
          base.cursor++;
        }
        // setmark p1, line 57
        I_p1 = base.cursor;
        // gopast, line 58
        golab18: while (true) {
          lab19: {
            if (!(base.in_grouping(g_v, 97, 250))) {
              break lab19;
            }
            break golab18;
          }
          if (base.cursor >= base.limit) {
            break lab13;
          }
          base.cursor++;
        }
        // gopast, line 58
        golab20: while (true) {
          lab21: {
            if (!(base.out_grouping(g_v, 97, 250))) {
              break lab21;
            }
            break golab20;
          }
          if (base.cursor >= base.limit) {
            break lab13;
          }
          base.cursor++;
        }
        // setmark p2, line 58
        I_p2 = base.cursor;
      }
      base.cursor = v_8;
      return true;
    };

    /** @return {boolean} */
    function r_postlude() {
      var /** number */ among_var;
      // repeat, line 62
      replab0: while (true) {
        var /** number */ v_1 = base.cursor;
        lab1: {
          // (, line 62
          // [, line 63
          base.bra = base.cursor;
          // substring, line 63
          among_var = base.find_among(a_1);
          if (among_var == 0) {
            break lab1;
          }
          // ], line 63
          base.ket = base.cursor;
          switch (among_var) {
            case 0:
              break lab1;
            case 1:
              // (, line 64
              // <-, line 64
              if (!base.slice_from("\u00E3")) {
                return false;
              }
              break;
            case 2:
              // (, line 65
              // <-, line 65
              if (!base.slice_from("\u00F5")) {
                return false;
              }
              break;
            case 3:
              // (, line 66
              // next, line 66
              if (base.cursor >= base.limit) {
                break lab1;
              }
              base.cursor++;
              break;
          }
          continue replab0;
        }
        base.cursor = v_1;
        break replab0;
      }
      return true;
    };

    /** @return {boolean} */
    function r_RV() {
      if (!(I_pV <= base.cursor)) {
        return false;
      }
      return true;
    };

    /** @return {boolean} */
    function r_R1() {
      if (!(I_p1 <= base.cursor)) {
        return false;
      }
      return true;
    };

    /** @return {boolean} */
    function r_R2() {
      if (!(I_p2 <= base.cursor)) {
        return false;
      }
      return true;
    };

    /** @return {boolean} */
    function r_standard_suffix() {
      var /** number */ among_var;
      // (, line 76
      // [, line 77
      base.ket = base.cursor;
      // substring, line 77
      among_var = base.find_among_b(a_5);
      if (among_var == 0) {
        return false;
      }
      // ], line 77
      base.bra = base.cursor;
      switch (among_var) {
        case 0:
          return false;
        case 1:
          // (, line 92
          // call R2, line 93
          if (!r_R2()) {
            return false;
          }
          // delete, line 93
          if (!base.slice_del()) {
            return false;
          }
          break;
        case 2:
          // (, line 97
          // call R2, line 98
          if (!r_R2()) {
            return false;
          }
          // <-, line 98
          if (!base.slice_from("log")) {
            return false;
          }
          break;
        case 3:
          // (, line 101
          // call R2, line 102
          if (!r_R2()) {
            return false;
          }
          // <-, line 102
          if (!base.slice_from("u")) {
            return false;
          }
          break;
        case 4:
          // (, line 105
          // call R2, line 106
          if (!r_R2()) {
            return false;
          }
          // <-, line 106
          if (!base.slice_from("ente")) {
            return false;
          }
          break;
        case 5:
          // (, line 109
          // call R1, line 110
          if (!r_R1()) {
            return false;
          }
          // delete, line 110
          if (!base.slice_del()) {
            return false;
          }
          // try, line 111
          var /** number */ v_1 = base.limit - base.cursor;
          lab0: {
            // (, line 111
            // [, line 112
            base.ket = base.cursor;
            // substring, line 112
            among_var = base.find_among_b(a_2);
            if (among_var == 0) {
              base.cursor = base.limit - v_1;
              break lab0;
            }
            // ], line 112
            base.bra = base.cursor;
            // call R2, line 112
            if (!r_R2()) {
              base.cursor = base.limit - v_1;
              break lab0;
            }
            // delete, line 112
            if (!base.slice_del()) {
              return false;
            }
            switch (among_var) {
              case 0:
                base.cursor = base.limit - v_1;
                break lab0;
              case 1:
                // (, line 113
                // [, line 113
                base.ket = base.cursor;
                // literal, line 113
                if (!(base.eq_s_b("at"))) {
                  base.cursor = base.limit - v_1;
                  break lab0;
                }
                // ], line 113
                base.bra = base.cursor;
                // call R2, line 113
                if (!r_R2()) {
                  base.cursor = base.limit - v_1;
                  break lab0;
                }
                // delete, line 113
                if (!base.slice_del()) {
                  return false;
                }
                break;
            }
          }
          break;
        case 6:
          // (, line 121
          // call R2, line 122
          if (!r_R2()) {
            return false;
          }
          // delete, line 122
          if (!base.slice_del()) {
            return false;
          }
          // try, line 123
          var /** number */ v_2 = base.limit - base.cursor;
          lab1: {
            // (, line 123
            // [, line 124
            base.ket = base.cursor;
            // substring, line 124
            among_var = base.find_among_b(a_3);
            if (among_var == 0) {
              base.cursor = base.limit - v_2;
              break lab1;
            }
            // ], line 124
            base.bra = base.cursor;
            switch (among_var) {
              case 0:
                base.cursor = base.limit - v_2;
                break lab1;
              case 1:
                // (, line 127
                // call R2, line 127
                if (!r_R2()) {
                  base.cursor = base.limit - v_2;
                  break lab1;
                }
                // delete, line 127
                if (!base.slice_del()) {
                  return false;
                }
                break;
            }
          }
          break;
        case 7:
          // (, line 133
          // call R2, line 134
          if (!r_R2()) {
            return false;
          }
          // delete, line 134
          if (!base.slice_del()) {
            return false;
          }
          // try, line 135
          var /** number */ v_3 = base.limit - base.cursor;
          lab2: {
            // (, line 135
            // [, line 136
            base.ket = base.cursor;
            // substring, line 136
            among_var = base.find_among_b(a_4);
            if (among_var == 0) {
              base.cursor = base.limit - v_3;
              break lab2;
            }
            // ], line 136
            base.bra = base.cursor;
            switch (among_var) {
              case 0:
                base.cursor = base.limit - v_3;
                break lab2;
              case 1:
                // (, line 139
                // call R2, line 139
                if (!r_R2()) {
                  base.cursor = base.limit - v_3;
                  break lab2;
                }
                // delete, line 139
                if (!base.slice_del()) {
                  return false;
                }
                break;
            }
          }
          break;
        case 8:
          // (, line 145
          // call R2, line 146
          if (!r_R2()) {
            return false;
          }
          // delete, line 146
          if (!base.slice_del()) {
            return false;
          }
          // try, line 147
          var /** number */ v_4 = base.limit - base.cursor;
          lab3: {
            // (, line 147
            // [, line 148
            base.ket = base.cursor;
            // literal, line 148
            if (!(base.eq_s_b("at"))) {
              base.cursor = base.limit - v_4;
              break lab3;
            }
            // ], line 148
            base.bra = base.cursor;
            // call R2, line 148
            if (!r_R2()) {
              base.cursor = base.limit - v_4;
              break lab3;
            }
            // delete, line 148
            if (!base.slice_del()) {
              return false;
            }
          }
          break;
        case 9:
          // (, line 152
          // call RV, line 153
          if (!r_RV()) {
            return false;
          }
          // literal, line 153
          if (!(base.eq_s_b("e"))) {
            return false;
          }
          // <-, line 154
          if (!base.slice_from("ir")) {
            return false;
          }
          break;
      }
      return true;
    };

    /** @return {boolean} */
    function r_verb_suffix() {
      var /** number */ among_var;
      // setlimit, line 159
      var /** number */ v_1 = base.limit - base.cursor;
      // tomark, line 159
      if (base.cursor < I_pV) {
        return false;
      }
      base.cursor = I_pV;
      var /** number */ v_2 = base.limit_backward;
      base.limit_backward = base.cursor;
      base.cursor = base.limit - v_1;
      // (, line 159
      // [, line 160
      base.ket = base.cursor;
      // substring, line 160
      among_var = base.find_among_b(a_6);
      if (among_var == 0) {
        base.limit_backward = v_2;
        return false;
      }
      // ], line 160
      base.bra = base.cursor;
      switch (among_var) {
        case 0:
          base.limit_backward = v_2;
          return false;
        case 1:
          // (, line 179
          // delete, line 179
          if (!base.slice_del()) {
            return false;
          }
          break;
      }
      base.limit_backward = v_2;
      return true;
    };

    /** @return {boolean} */
    function r_residual_suffix() {
      var /** number */ among_var;
      // (, line 183
      // [, line 184
      base.ket = base.cursor;
      // substring, line 184
      among_var = base.find_among_b(a_7);
      if (among_var == 0) {
        return false;
      }
      // ], line 184
      base.bra = base.cursor;
      switch (among_var) {
        case 0:
          return false;
        case 1:
          // (, line 187
          // call RV, line 187
          if (!r_RV()) {
            return false;
          }
          // delete, line 187
          if (!base.slice_del()) {
            return false;
          }
          break;
      }
      return true;
    };

    /** @return {boolean} */
    function r_residual_form() {
      var /** number */ among_var;
      // (, line 191
      // [, line 192
      base.ket = base.cursor;
      // substring, line 192
      among_var = base.find_among_b(a_8);
      if (among_var == 0) {
        return false;
      }
      // ], line 192
      base.bra = base.cursor;
      switch (among_var) {
        case 0:
          return false;
        case 1:
          // (, line 194
          // call RV, line 194
          if (!r_RV()) {
            return false;
          }
          // delete, line 194
          if (!base.slice_del()) {
            return false;
          }
          // [, line 194
          base.ket = base.cursor;
          // or, line 194
          lab0: {
            var /** number */ v_1 = base.limit - base.cursor;
            lab1: {
              // (, line 194
              // literal, line 194
              if (!(base.eq_s_b("u"))) {
                break lab1;
              }
              // ], line 194
              base.bra = base.cursor;
              // test, line 194
              var /** number */ v_2 = base.limit - base.cursor;
              // literal, line 194
              if (!(base.eq_s_b("g"))) {
                break lab1;
              }
              base.cursor = base.limit - v_2;
              break lab0;
            }
            base.cursor = base.limit - v_1;
            // (, line 195
            // literal, line 195
            if (!(base.eq_s_b("i"))) {
              return false;
            }
            // ], line 195
            base.bra = base.cursor;
            // test, line 195
            var /** number */ v_3 = base.limit - base.cursor;
            // literal, line 195
            if (!(base.eq_s_b("c"))) {
              return false;
            }
            base.cursor = base.limit - v_3;
          }
          // call RV, line 195
          if (!r_RV()) {
            return false;
          }
          // delete, line 195
          if (!base.slice_del()) {
            return false;
          }
          break;
        case 2:
          // (, line 196
          // <-, line 196
          if (!base.slice_from("c")) {
            return false;
          }
          break;
      }
      return true;
    };

    this.stem = /** @return {boolean} */ function() {
      // (, line 201
      // do, line 202
      var /** number */ v_1 = base.cursor;
      lab0: {
        // call prelude, line 202
        if (!r_prelude()) {
          break lab0;
        }
      }
      base.cursor = v_1;
      // do, line 203
      var /** number */ v_2 = base.cursor;
      lab1: {
        // call mark_regions, line 203
        if (!r_mark_regions()) {
          break lab1;
        }
      }
      base.cursor = v_2;
      // backwards, line 204
      base.limit_backward = base.cursor;
      base.cursor = base.limit;
      // (, line 204
      // do, line 205
      var /** number */ v_3 = base.limit - base.cursor;
      lab2: {
        // (, line 205
        // or, line 209
        lab3: {
          var /** number */ v_4 = base.limit - base.cursor;
          lab4: {
            // (, line 206
            // and, line 207
            var /** number */ v_5 = base.limit - base.cursor;
            // (, line 206
            // or, line 206
            lab5: {
              var /** number */ v_6 = base.limit - base.cursor;
              lab6: {
                // call standard_suffix, line 206
                if (!r_standard_suffix()) {
                  break lab6;
                }
                break lab5;
              }
              base.cursor = base.limit - v_6;
              // call verb_suffix, line 206
              if (!r_verb_suffix()) {
                break lab4;
              }
            }
            base.cursor = base.limit - v_5;
            // do, line 207
            var /** number */ v_7 = base.limit - base.cursor;
            lab7: {
              // (, line 207
              // [, line 207
              base.ket = base.cursor;
              // literal, line 207
              if (!(base.eq_s_b("i"))) {
                break lab7;
              }
              // ], line 207
              base.bra = base.cursor;
              // test, line 207
              var /** number */ v_8 = base.limit - base.cursor;
              // literal, line 207
              if (!(base.eq_s_b("c"))) {
                break lab7;
              }
              base.cursor = base.limit - v_8;
              // call RV, line 207
              if (!r_RV()) {
                break lab7;
              }
              // delete, line 207
              if (!base.slice_del()) {
                return false;
              }
            }
            base.cursor = base.limit - v_7;
            break lab3;
          }
          base.cursor = base.limit - v_4;
          // call residual_suffix, line 209
          if (!r_residual_suffix()) {
            break lab2;
          }
        }
      }
      base.cursor = base.limit - v_3;
      // do, line 211
      var /** number */ v_9 = base.limit - base.cursor;
      lab8: {
        // call residual_form, line 211
        if (!r_residual_form()) {
          break lab8;
        }
      }
      base.cursor = base.limit - v_9;
      base.cursor = base.limit_backward; // do, line 213
      var /** number */ v_10 = base.cursor;
      lab9: {
        // call postlude, line 213
        if (!r_postlude()) {
          break lab9;
        }
      }
      base.cursor = v_10;
      return true;
    };

    /**@return{string}*/
    this['stemWord'] = function( /**string*/ word) {
      base.setCurrent(word);
      this.stem();
      return base.getCurrent();
    };
  }


  return function(word) {
    return (new PortugueseStemmer()).stemWord(word);
  };

})();

/**
 * An entity recognizer that can recognizes time expressions. Returned entities value is the same of {@link Bravey.Date.formatTime}.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @returns {Bravey.RegexEntityRecognizer}
 */
Bravey.Language.PT.TimeEntityRecognizer = function(entityName) {

  var matcher = new Bravey.RegexEntityRecognizer(entityName);

  var exp1 = "\\b(às\\b|as\\b|em\\b)?" + Bravey.Text.WORDSEP +
    "([0-9]+)" + Bravey.Text.WORDSEP +
    "\\b(horas\\b|hrs\\b|h\\b|:\\b)?" + Bravey.Text.WORDSEP +
    "\\b(e\\b|,\\b|com\\b)?" + Bravey.Text.WORDSEP +
    "([0-9]+)?" + Bravey.Text.WORDSEP +
    "\\b(minutos\\b|min\\b|m\\b)?" + Bravey.Text.WORDSEP +
    "\\b(e\\b|,\\b|:\\b)?" + Bravey.Text.WORDSEP +
    "([0-9]+)?" + Bravey.Text.WORDSEP +
    "\\b(segundos\\b|seg\\b|s\\b)?" + Bravey.Text.WORDSEP +
    "\\b(meia\\b|quinze\\b|quarenta e cinco\\b)?" + Bravey.Text.WORDSEP + // for minutes only
    "\\b(da noite\\b|da tarde\\b|pm\\b|da manha\\b|am\\b)?" + Bravey.Text.WORDSEP // am/pm modifier
  ;

  matcher.addMatch(
    new RegExp(exp1, "gi"),
    function(match) {

      var hour = 0;
      if (match[2]) {
        hour = match[2] * 1;
      }

      var min = 0;
      if (match[5]) {
        min = match[5] * 1;
      } else if (match[10]) {
        if ('meia' === match[10]) min = 30;
        else if ('quinze' === match[10]) min = 15;
        else if ('quarenta e cinco' === match[10]) min = 45;
      }

      var sec = 0;
      if (match[8]) {
        sec = match[8] * 1;
      }

      if (match[11]) {
        if (('da manha' == match[11] || 'am' == match[11]) && hour > 12) {
          hour -= 12;
        }
        if (('da noite' == match[11] || 'da tarde' == match[11] || 'pm' == match[11]) && hour < 12) {
          hour += 12;
        }
      }

      return Bravey.Text.pad(hour, 2) + ':' + Bravey.Text.pad(min, 2) + ':' + Bravey.Text.pad(sec, 2);
    }
  );

  matcher.bindTo(this);

};

/**
 * An entity recognizer that can recognizes time period expressions. Returned entities value <tt>{"start":"HH:MM:SS","end":"HH:MM:SS"}</tt>.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @returns {Bravey.RegexEntityRecognizer}
 * @todo from x to y, etc...
 */
Bravey.Language.PT.TimePeriodEntityRecognizer = function(entityName) {

  var matcher = new Bravey.RegexEntityRecognizer(entityName);

  matcher.addMatch(new RegExp("\\b(de madrugada|na madrugada)\\b", "gi"), function(match) {
    return {
      start: "00:00:00",
      end: "05:59:59"
    }
  });

  matcher.addMatch(new RegExp("\\b(de manha|na manha)\\b", "gi"), function(match) {
    return {
      start: "06:00:00",
      end: "11:59:59"
    }
  });

  matcher.addMatch(new RegExp("\\b(a tarde|de tarde|na tarde)\\b", "gi"), function(match) {
    return {
      start: "12:00:00",
      end: "17:59:59"
    }
  });

  matcher.addMatch(new RegExp("\\b(a noite|de noite|na noite)\\b", "gi"), function(match) {
    return {
      start: "18:00:00",
      end: "23:59:59"
    }
  });

  matcher.addMatch(
    new RegExp(
      "\\b(daqui a|daqui|em)\\b" + Bravey.Text.WORDSEP +
      "([0-9]+)" + Bravey.Text.WORDSEP +
      "\\b(horas|minutos|segundos)\\b" + Bravey.Text.WORDSEP, "gi"),
    function(match) {
      if (match[2] && match[3]) {
        var value = match[2] * 1;
        var increase = 0;
        switch (match[3]) {
          case "horas":
            increase = Bravey.Date.HOUR * value;
            break;
          case "minutos":
            increase = Bravey.Date.MINUTE * value;
            break;
          case "segundos":
            increase = Bravey.Date.SECOND * value;
            break;
        }
        var now = new Date();
        var end = new Date();
        end.setTime(end.getTime() + increase);
        return {
          start: now.toLocaleTimeString('pt-BR'),
          end: end.toLocaleTimeString('pt-BR')
        };
      }
    }
  );

  matcher.bindTo(this);
};

/**
 * An entity recognizer that can recognizes date expressions. Returned entities value is the same of {@link Bravey.Date.formatDate}.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @returns {Bravey.RegexEntityRecognizer}
 */
Bravey.Language.PT.DateEntityRecognizer = function(entityName) {

  var matcher = new Bravey.RegexEntityRecognizer(entityName);

  var prefixes = "\\b(de\\b)?" + Bravey.Text.WORDSEP;

  var months = new Bravey.Text.RegexMap([{
    str: ["janeiro~", "jan~", "1~", "01~"],
    val: 0
  }, {
    str: ["fevereiro~", "fev~", "2~", "02~"],
    val: 1
  }, {
    str: ["março~", "mar~", "3~", "03~"],
    val: 2
  }, {
    str: ["abril~", "abr~", "4~", "04~"],
    val: 3
  }, {
    str: ["maio~", "mai~", "5~", "05~"],
    val: 4
  }, {
    str: ["junho~", "jun~", "6~", "06~"],
    val: 5
  }, {
    str: ["julho~", "jul~", "7~", "07~"],
    val: 6
  }, {
    str: ["agosto~", "ago~", "8~", "08~"],
    val: 7
  }, {
    str: ["setembro~", "set~", "9~", "09~"],
    val: 8
  }, {
    str: ["outubro~", "out~", "10~"],
    val: 9
  }, {
    str: ["novembro~", "nov~", "11~"],
    val: 10
  }, {
    str: ["dezembro~", "dez~", "12~"],
    val: 11
  }], 0);

  // examples: "30/01/2000", "30-01-2000", "30/01", "30-01"
  matcher.addMatch(
    new RegExp("\\b(([0-9]{1,2})(/|-)([0-9]{1,2})((/|-)([0-9]{2,4}))?)\\b", "gi"),
    function(match) {
      var now = new Date();
      var y = now.getFullYear();
      if (match[2] && match[4]) {
        var d = match[2] * 1;
        var m = (match[4] * 1) - 1; // month is zero-based
        if (match[7]) {
          y = match[7] * 1;
        }
        return Bravey.Date.formatDate((new Date(y, m, d, 0, 0, 0, 0)).getTime());
      }
    }
  );


  // examples: "1° de janeiro de 2000", "22 de janeiro de 2000", "1° de janeiro"
  matcher.addMatch(
    new RegExp(
      "([0-9]{1,2})(°)?" + Bravey.Text.WORDSEP +
      "(de)" + Bravey.Text.WORDSEP +
      months.regex() + Bravey.Text.WORDSEP +
      "(de\\b)?" + Bravey.Text.WORDSEP +
      "([0-9]{2,4})?\\b", "gi"),
    function(match) {
      var now = new Date();
      var y = now.getFullYear();
      var m = now.getMonth();
      var d = now.getDate();
      if (match[1]) d = match[1] * 1;
      if (match[4]) m = months.get(match, 4, m);
      if (match[6]) y = match[6] * 1;
      y = Bravey.Date.centuryFinder(y);
      return Bravey.Date.formatDate((new Date(y, m, d, 0, 0, 0, 0)).getTime());
    }
  );

  // examples: "janeiro de 2000"
  matcher.addMatch(
    new RegExp(
      months.regex() + Bravey.Text.WORDSEP +
      "(de)" + Bravey.Text.WORDSEP +
      "([0-9]{2,4})\\b", "gi"),
    function(match) {
      var now = new Date();
      var y = now.getFullYear();
      var m = now.getMonth();
      var d = 1;
      if (match[1]) m = months.get(match, 1, m);
      if (match[3]) y = match[3] * 1;
      y = Bravey.Date.centuryFinder(y);
      return Bravey.Date.formatDate((new Date(y, m, d, 0, 0, 0, 0)).getTime());
    }
  );

  matcher.addMatch(new RegExp(prefixes + "(hoje)\\b", "gi"), function(match) {
    return Bravey.Date.formatDate((new Date()).getTime());
  });
  matcher.addMatch(new RegExp(prefixes + "(amanhã)\\b", "gi"), function(match) {
    return Bravey.Date.formatDate((new Date()).getTime() + Bravey.Date.DAY)
  });
  matcher.addMatch(new RegExp(prefixes + "(depois de amanhã)\\b", "gi"), function(match) {
    return Bravey.Date.formatDate((new Date()).getTime() + (Bravey.Date.DAY * 2))
  });
  matcher.addMatch(new RegExp(prefixes + "(ontem)\\b", "gi"), function(match) {
    return Bravey.Date.formatDate((new Date()).getTime() - Bravey.Date.DAY)
  });
  matcher.addMatch(new RegExp(prefixes + "(anteontem)\\b", "gi"), function(match) {
    return Bravey.Date.formatDate((new Date()).getTime() - (Bravey.Date.DAY * 2))
  });

  matcher.addMatch(
    new RegExp(
      "\\b(daqui a|daqui|em)\\b" + Bravey.Text.WORDSEP +
      "([0-9]+)" + Bravey.Text.WORDSEP +
      "\\b(semanas|dias)\\b" + Bravey.Text.WORDSEP, "gi"),
    function(match) {
      if (match[2] && match[3]) {
        var value = match[2] * 1;
        var increase = 0;
        switch (match[3]) {
          case "semanas":
            increase = 7 * Bravey.Date.DAY * value;
            break;
          case "dias":
            increase = Bravey.Date.DAY * value;
            break;
        }
        var now = new Date();
        var end = new Date();
        end.setTime(end.getTime() + increase);
        return {
          start: Bravey.Date.formatDate(now),
          end: Bravey.Date.formatDate(end)
        };
      }
    }
  );

  matcher.bindTo(this);
};

/**
 * An free text entity recognizer with preconfigured conjunctions. Derived from {@link Bravey.FreeTextEntityRecognizer}.
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @returns {Bravey.RegexEntityRecognizer}
 */
Bravey.Language.PT.FreeTextEntityRecognizer = function(entityName, priority) {
  var commas = ["obrigado", "por favor"];
  var matcher = new Bravey.FreeTextEntityRecognizer(entityName, priority);
  matcher.addConjunction("é");
  matcher.addConjunction("deve ser");
  matcher.addConjunction("pode ser");
  matcher.addConjunction("talvez seja");
  matcher.addConjunction("o");
  matcher.addConjunction("a");
  matcher.addConjunction("e");
  matcher.addConjunction("esta");
  for (var i = 0; i < commas.length; i++) {
    matcher.addConjunction(commas[i]);
    matcher.addConjunction("," + commas[i]);
    matcher.addConjunction(", " + commas[i]);
  }
  return matcher;
};

/* Portuguese numbers matching patterns. */
Bravey.Language.PT.Numbers = {
  wordsSeparator: /(\w+)/gi,
  sum: {
    'e': 0,
    'zero': 0,
    'um': 1,
    'dois': 2,
    'três': 3,
    'quatro': 4,
    'cinco': 5,
    'seis': 6,
    'sete': 7,
    'oito': 8,
    'nove': 9,
    'dez': 10,
    'onze': 11,
    'doze': 12,
    'treze': 13,
    'catorze': 14,
    'quinze': 15,
    'dezesseis': 16,
    'dezessete': 17,
    'dezoito': 18,
    'dezenove': 19,
    'vinte': 20,
    'trinta': 30,
    'quarenta': 40,
    'cinquenta': 50,
    'sessenta': 60,
    'setenta': 70,
    'oitenta': 80,
    'noventa': 90,
    'cem': 100,
    'duzentos': 200,
    'trezentos': 300,
    'quatrocentos': 400,
    'quinhentos': 500,
    'seiscentos': 600,
    'setecentos': 700,
    'oitocentos': 800,
    'novecentos': 900
  },
  mul: {
    'cento': 100,
    'mil': 1000,
    'milhão': 1000000
  },
  skip: {
    e: 1
  }
};

/**
 * Recognizes numbers line '123' or 'cento e vinte três'. 
 * @constructor
 * @param {string} entityName - The name of produced entities.
 * @returns {Bravey.RegexEntityRecognizer}
 */
Bravey.Language.PT.NumberEntityRecognizer = function(entityName, priority) {

  this.getName = function() {
    return entityName;
  };

  this.getEntities = function(string, out) {
    if (!out) out = [];
    var tokens = string.toLowerCase().split(/(\w+)/);
    var mul, token, temp = 0,
      sum = 0,
      isnumber, current, valid, cursor = 0,
      end;
    for (var i = 0; i < tokens.length + 1; i++) {
      token = tokens[i] == undefined ? "*" : tokens[i];
      isnumber = true;
      if (!current) {
        valid = 0;
        current = {
          value: 0,
          entity: entityName,
          string: "",
          priority: priority || 0
        };
      }

      if (token.trim()) {

        if (token.trim() == 'e' && 0 == sum) { // skip "e" before a number
          cursor += token.length;
          continue;
        }

        if (Bravey.Language.PT.Numbers.sum[token] != null) {
          sum += Bravey.Language.PT.Numbers.sum[token];
        } else if (!isNaN(token * 1)) {
          if (valid) {
            i--;
            token = "";
            isnumber = false;
          } else {
            temp = token * 1;
          }
        } else if (Bravey.Language.PT.Numbers.mul[token]) {
          mul = Bravey.Language.PT.Numbers.mul[token];
          temp += sum * mul;
          sum = 0;
        } else {
          isnumber = false;
        }

        if (isnumber) {
          valid = 1;
          end = cursor + token.length;
          if (current.position == undefined) {
            current.position = cursor;
          }
        } else if (valid) {
          current.value = temp + sum;
          current.string = string.substr(current.position, end - current.position);
          out.push(current);
          temp = sum = current = 0;
        }
      }

      cursor += token.length;
    }
    return out;
  };

};
// File:src/nlp/Fuzzy.js

/**
 * A version of the Natural Language Processing core. Doesn't follow entity order but tries to guess names by samples. Less precise but easier hits.
 * @constructor
 */
Bravey.Nlp.Fuzzy = function(nlpName, extensions) {
  extensions = extensions || {};

  var intents = {};
  var documentClassifier = new Bravey.DocumentClassifier(extensions);
  var entities = {};
  var allEntities = [];
  var confidence = 0.75;

  function sortEntities(ent) {
    ent.sort(function(a, b) {
      if (a.position < b.position) return -1;
      if (a.position > b.position) return 1;
      if (a.string.length > b.string.length) return -1;
      if (a.string.length < b.string.length) return 1;
      if (a.priority > b.priority) return -1;
      if (a.priority < b.priority) return 1;
      return 0;
    });
  }

  function extractEntities(text, ent) {
    var out = [],
      done = {};
    for (var i = 0; i < ent.length; i++)
      if (!done[ent[i].entity]) {
        done[ent[i].entity] = 1;
        entities[ent[i].entity].getEntities(text, out);
      }
    sortEntities(out);
    return out;
  }

  function getEntities(text, intent) {

    var out = extractEntities(text, intent.entities);
    var outentities = [],
      outentitiesindex = {},
      sentence = [],
      ent, pos = -1,
      nextid, outtext = "",
      exceedEntities = false,
      extraEntities = false,
      missingEntities = false,
      counters = {},
      found = 0,
      prevstring;

    for (var i = 0; i < out.length; i++) {
      ent = out[i].entity;
      if (out[i].position >= pos) {
        if (intent.index[ent]) {
          if (counters[ent] == undefined) counters[ent] = 0;
          if (nextid = intent.index[ent][counters[ent]]) {
            counters[ent]++;
            found++;
            var match = {
              position: out[i].position,
              entity: ent,
              value: out[i].value,
              string: out[i].string,
              id: nextid
            };
            outentities.push(match);
            outentitiesindex[match.id] = match;

            if (pos == -1) prevstring = text.substr(0, out[i].position);
            else prevstring = text.substr(pos, out[i].position - pos);

            if (prevstring.length) sentence.push({
              string: prevstring
            });
            sentence.push(match);

            outtext += prevstring;

            outtext += "{" + ent + "}";
            pos = out[i].position + out[i].string.length;
          } else
            exceedEntities = true;
        } else extraEntities = true;
      }
    }

    prevstring = text.substr(pos == -1 ? 0 : pos);
    if (prevstring.length) {
      if (prevstring.length) sentence.push({
        string: prevstring
      });
      outtext += prevstring;
    }

    return {
      found: found,
      missingEntities: missingEntities,
      exceedEntities: exceedEntities,
      extraEntities: extraEntities,
      text: outtext,
      entities: outentities,
      sentence: sentence,
      entitiesIndex: outentitiesindex
    };
  }

  function expandIntentFromText(text, intent, names) {

    var ent, outtext = "",
      cur = -1,
      pos = -1,
      nextid, out = extractEntities(text, allEntities),
      counters = {};

    for (var i = 0; i < out.length; i++) {
      ent = out[i].entity;
      if (out[i].position > pos) {
        cur++;

        if (!intent.index[ent]) intent.index[ent] = [];
        if (counters[ent] == undefined) counters[ent] = 0;
        else counters[ent]++;
        nextid = intent.index[ent][counters[ent]];

        if (!nextid) {
          nextid = intent.index[ent][counters[ent]] = names && names[cur] ? names[cur] : ent + (counters[ent] ? counters[ent] : "");
          intent.entities.push({
            entity: ent,
            id: nextid
          });
          console.warn("Adding entity", nextid, "to", intent.name);
        }

        if (pos == -1)
          outtext += text.substr(0, out[i].position);
        else
          outtext += text.substr(pos, out[i].position - pos);
        outtext += "{" + ent + "}";
        pos = out[i].position + out[i].string.length;

      }
    }

    outtext += text.substr(pos == -1 ? 0 : pos);

    return {
      text: outtext
    };

  }

  function expandIntentFromTagged(text, intent, names) {

    var nextid, cur = -1,
      counters = {};

    text.replace(/\{([.a-z_-]+)\}/g, function(m, ent) {
      cur++;

      if (!intent.index[ent]) intent.index[ent] = [];
      if (counters[ent] == undefined) counters[ent] = 0;
      else counters[ent]++;
      nextid = intent.index[ent][counters[ent]];

      if (!nextid) {
        nextid = intent.index[ent][counters[ent]] = names && names[cur] ? names[cur] : ent + (counters[ent] ? counters[ent] : "");
        intent.entities.push({
          entity: ent,
          id: nextid
        });
        console.warn("Adding entity", nextid, "to", intent.name);
      }
    });

    return {
      text: text
    };
  }

  function getAnyEntity(text) {
    var prevstring, outentities = [],
      outentitiesindex = {},
      sentence = [],
      ent, nextid, outtext = "",
      counters = {},
      pos = -1,
      cur = -1,
      found = 0,
      out = extractEntities(text, allEntities);
    for (var i = 0; i < out.length; i++) {
      ent = out[i].entity;
      if (out[i].position > pos) {
        found++;
        cur++;
        if (counters[ent] == undefined) counters[ent] = 0;
        else counters[ent]++;
        nextid = ent + (counters[ent] ? counters[ent] : "");
        var match = {
          position: out[i].position,
          entity: ent,
          value: out[i].value,
          string: out[i].string,
          id: nextid
        };
        outentities.push(match);
        outentitiesindex[match.id] = match;
        if (pos == -1) prevstring = text.substr(0, out[i].position);
        else prevstring = text.substr(pos, out[i].position - pos);
        if (prevstring.length) sentence.push({
          string: prevstring
        });
        sentence.push(match);
        outtext += prevstring;
        outtext += "{" + ent + "}";
        pos = out[i].position + out[i].string.length;
      }
    }

    prevstring = text.substr(pos == -1 ? 0 : pos);
    if (prevstring.length) {
      if (prevstring.length) sentence.push({
        string: prevstring
      });
      outtext += prevstring;
    }
    return {
      found: found,
      text: outtext,
      entities: outentities,
      sentence: sentence,
      entitiesIndex: outentitiesindex
    };
  }

  /**
   * Adds an intent.
   * @param {string} intentName - The name of the new intent.
   * @param {IntentEntity[]} entities - The produced entities.
   * @returns {boolean} True when successful.
   */
  this.addIntent = function(intentName, entities) {
    var index = {};
    for (var i = 0; i < entities.length; i++) {
      if (!index[entities[i].entity]) index[entities[i].entity] = [];
      index[entities[i].entity].push(entities[i].id);
    }
    intents[intentName] = {
      name: intentName,
      entities: entities,
      index: index
    };
    return true;
  }

  /**
   * Adds an entity recognizer.
   * @param {EntityRecognizer} entity - The entity recognizer to be addded.
   * @returns {boolean} True when successful.
   */
  this.addEntity = function(entity) {
    var entityName = entity.getName();
    if (!entities[entityName]) allEntities.push({
      entity: entityName,
      id: "none"
    });
    entities[entityName] = entity;
    return true;
  }

  /**
   * Check if an entity with a given name exists.
   * @param {string} entityName - The entity name.
   * @returns {boolean} True when found.
   */
  this.hasEntity = function(entityName) {
    return !!entities[entityName];
  }

  /**
   * Set confidence ratio, from 0.5 to 1. The higher the more strict.
   * @param {number} ratio - The confidence ratio to be set.
   */
  this.setConfidence = function(ratio) {
    confidence = ratio;
  }

  /**
   * Returns the confidence ratio.
   * @returns {number} The confidence ratio.
   */
  this.getConfidence = function(c) {
    return confidence;
  }

  /**
   * Add a new document.
   * @param {string} text - The document content.
   * @param {string} intent - The related intent.
   * @param {boolean} [guess.fromFullSentence=false] - Indicates that the document is a full untagged sentence. (i.e. "Please call the 333-123456")
   * @param {boolean} [guess.fromTaggedSentence=true] - Indicates that the document is tagged with braces. (i.e "Please call the {phone_number}")
   * @param {boolean} [guess.expandIntent=false] - Extends or creates a new intent if exceeded entities are found. New entities id will be autogenerated and progressive.
   * @param {string[]} [guess.withNames=[]] - Uses the given names for auto-extending intents. Positions in array are matched with positions of entity into the specified sentence.
   * @returns {boolean} True when found.
   */
  this.addDocument = function(text, intent, guess) {
    if (guess) {

      if (guess.fromFullSentence) { // From a full sentence...

        text = Bravey.Text.clean(text);

        if (guess.expandIntent) { // Expand intent with found items
          if (!intents[intent]) {
            console.warn("Adding intent", intent);
            this.addIntent(intent, []);
          }
          var expanded = expandIntentFromText(text, intents[intent], guess.withNames);
          return documentClassifier.addDocument(expanded.text, intent);
        }

      } else if (guess.fromTaggedSentence) { // From a {tagged} sentence...

        if (guess.expandIntent) { // Expand intent with found items
          if (!intents[intent]) {
            console.warn("Adding intent", intent);
            this.addIntent(intent, []);
          }
          var expanded = expandIntentFromTagged(text, intents[intent], guess.withNames);
          return documentClassifier.addDocument(expanded.text, intent);
        }

      }
      console.warn("Can't guess...");
      return false;
    } else { // Link a marked sentence to a particular intent
      if (intents[intent])
        return documentClassifier.addDocument(Bravey.Text.clean(text), intent);
      else {
        console.warn("Can't find intent", intent);
        return false;
      }
    }
  }

  /**
   * Check if a given sentence matches an intent and extracts its entities.
   * @param {string} text - The sentence to be processed.
   * @param {string} [method="default"] - The extraction method. "anyEntity" extracts all found entities and guess intent, regardless the intents structure.
   * @returns {NlpResult} When an intent is found.
   * @returns {false} When the sentence doesn't match any intent.
   */
  this.test = function(text, method) {
    text = Bravey.Text.clean(text);
    switch (method) {
      case "anyEntity":
        {
          var result = getAnyEntity(text);
          var classification = documentClassifier.classifyDocument(result.text);
          result.score = classification.winner.score;
          result.intent = classification.winner.label;
          return result;
        }
      default:
        { // When entities are enough, check classifier.
          var classification, entlist, result = false,
            resultscore = -1,
            resultfound = -1;
          for (var intent in intents) {
            entlist = getEntities(text, intents[intent]);
            if (!entlist.exceedEntities && !entlist.extraEntities && !entlist.missingEntities) { // No unwanted entites, entity count under the threshold and 0 entities for no entities intents
              classification = documentClassifier.classifyDocument(entlist.text);
              if ((classification.scores[intent] > confidence) && ((classification.scores[intent] > resultscore) || ((classification.scores[intent] == resultscore) && (entlist.found > resultfound)))) {
                result = entlist;
                result.score = resultscore = classification.scores[intent];
                resultfound = result.found;
                result.intent = intent;
              }
            }
          }
          return result;
        }
    }
    return false;
  }
}

/**
 Describes an entity to be matched in an intent.
 @typedef IntentEntity
 @type {Object}
 @property {string} entity The entity type to be found.
 @property {string} id The entity ID to be assigned when found.
*/

/**
 Describes a sentence classification and entities.
 @typedef NlpResult
 @type {Object}
 @property {Entity[]} entities The ordered list of found entities.
 @property {number[]} entitiesIndex An map version of entities, with key as entity ID and value as entity value.
 @property {string} intent The matched intent.
 @property {number} score The score of the matched sentence intent.
*/
// File:src/nlp/Sequential.js

/**
 * A version of the Natural Language Processing core. It processess entities in strict sequential order. More precise but harder hits.
 * @constructor
 */
Bravey.Nlp.Sequential = function(nlpName, extensions) {
  extensions = extensions || {};

  var intents = {};
  var documentClassifier = new Bravey.DocumentClassifier(extensions);
  var entities = {};
  var allEntities = [];
  var confidence = 0.75;

  function getIntentRoot(intentName) {
    return intentName.split(/~/)[0];
  }

  function sortEntities(ent) {
    ent.sort(function(a, b) {
      if (a.position < b.position) return -1;
      if (a.position > b.position) return 1;
      if (a.string.length > b.string.length) return -1;
      if (a.string.length < b.string.length) return 1;
      if (a.priority > b.priority) return -1;
      if (a.priority < b.priority) return 1;
      return 0;
    });
  }

  function extractEntities(text, ent) {
    var out = [],
      done = {};
    for (var i = 0; i < ent.length; i++)
      if (!done[ent[i].entity]) {
        done[ent[i].entity] = 1;
        entities[ent[i].entity].getEntities(text, out);
      }
    sortEntities(out);
    return out;
  }

  function guessIntent(text, root, names) {
    var intentname = root || "",
      nextid, ent,
      outtext = "",
      entities = [],
      counters = {},
      cur = 0,
      pos = -1;
    var out = extractEntities(text, allEntities);

    for (var i = 0; i < out.length; i++) {
      ent = out[i].entity;
      if (out[i].position >= pos) {

        intentname += "~" + ent;
        if (counters[ent] == undefined) counters[ent] = 0;
        else counters[ent]++;
        nextid = names && names[cur] ? names[cur] : ent + (counters[ent] ? counters[ent] : "");
        entities.push({
          entity: ent,
          id: nextid
        });

        if (pos == -1) outtext += text.substr(0, out[i].position);
        else outtext += text.substr(pos, out[i].position - pos);
        outtext += "{" + ent + "}";

        pos = out[i].position + out[i].string.length;

        cur++;
      }
    }

    outtext += text.substr(pos == -1 ? 0 : pos);

    return {
      error: false,
      text: outtext,
      name: intentname,
      entities: entities
    }
  }

  function guessIntentFromTagged(text, root, names) {

    var nextid, cur = -1,
      counters = {};

    var intentname = root || "",
      outentities = [],
      counters = {},
      cur = 0,
      error = false;

    text.replace(/\{([.a-z_-]+)\}/g, function(m, ent) {

      if (!entities[ent]) error = ent;
      else {

        intentname += "~" + ent;

        if (counters[ent] == undefined) counters[ent] = 0;
        else counters[ent]++;
        nextid = names && names[cur] ? names[cur] : ent + (counters[ent] ? counters[ent] : "");
        outentities.push({
          entity: ent,
          id: nextid
        });

        cur++;
      }

    });

    return {
      error: error,
      text: text,
      name: intentname,
      entities: outentities
    };
  }

  function getEntities(text, intent) {

    var out = extractEntities(text, intent.entities);
    var outentities = [],
      outentitiesindex = {},
      missingEntities = false,
      ent, pos = -1,
      entitypos = 0;

    function forward() { // @TODO: This part can be improved.
      while (intent.entities[entitypos] && entities[intent.entities[entitypos].entity].expand) {
        var match = {
          position: pos < 0 ? 0 : pos,
          entity: intent.entities[entitypos].entity,
          value: "",
          string: text.substr(pos < 0 ? 0 : pos),
          id: intent.entities[entitypos].id
        };
        outentitiesindex[match.id] = match;
        outentities.push(match);
        entitypos++;
      }
    }

    forward();

    if (out.length)
      for (var i = 0; i < out.length; i++) {
        ent = out[i].entity;
        if (out[i].position >= pos) {
          if (intent.entities[entitypos].entity == ent) {
            var match = {
              position: out[i].position,
              entity: ent,
              value: out[i].value,
              string: out[i].string,
              id: intent.entities[entitypos].id
            };
            outentities.push(match);
            outentitiesindex[match.id] = match;

            pos = out[i].position + out[i].string.length;

            entitypos++;
            forward();
            if (entitypos >= intent.entities.length) break;
          }
        }

      }
    else missingEntities = intent.entities.length;

    var nextentity, outtext = "",
      prevstring = "",
      pos = 0,
      sentence = [],
      oldposition;
    for (var i = 0; i < outentities.length; i++) {
      if (entities[outentities[i].entity].expand) {
        nextentity = outentities[i + 1];
        if (nextentity) outentities[i].string = outentities[i].string.substr(0, nextentity.position - outentities[i].position);
        oldposition = outentities[i].position;
        entities[outentities[i].entity].expand(outentities[i]);
        if (entities[outentities[i].entity].position > oldposition) {
          prevstring = text.substr(pos, entities[outentities[i].entity].position - oldposition);
          sentence.push({
            string: prevstring
          });
          outtext += prevstring;
          pos += entities[outentities[i].entity].position - oldposition;
        }
      }
      prevstring = text.substr(pos, outentities[i].position - pos);
      if (prevstring) {
        sentence.push({
          string: prevstring
        });
        outtext += prevstring;
      }
      sentence.push(outentities[i]);
      outtext += "{" + outentities[i].entity + "}";
      pos = outentities[i].position + outentities[i].string.length;
    }
    if (prevstring = text.substr(pos)) {
      sentence.push({
        string: prevstring
      });
      outtext += prevstring;
    }

    return {
      found: outentities.length,
      exceedEntities: false,
      missingEntities: outentities.length < intent.entities.length,
      extraEntities: outentities.length > intent.entities.length,
      text: outtext,
      entities: outentities,
      sentence: sentence,
      entitiesIndex: outentitiesindex
    };
  }

  /**
   * Adds an intent.
   * @param {string} intentName - The name of the new intent.
   * @param {IntentEntity[]} entities - The produced entities.
   * @returns {boolean} True when successful.
   */
  this.addIntent = function(intentName, entities) {
    var index = {},
      intentFullName = intentName;
    for (var i = 0; i < entities.length; i++) {
      intentFullName += "~" + entities[i].entity;
      if (!index[entities[i].entity]) index[entities[i].entity] = [];
      index[entities[i].entity].push(entities[i].id);
    }
    intents[intentFullName] = {
      name: intentFullName,
      root: intentName,
      entities: entities,
      index: index
    };
    return true;
  }

  /**
   * Adds an entity recognizer.
   * @param {EntityRecognizer} entity - The entity recognizer to be addded.
   * @returns {boolean} True when successful.
   */
  this.addEntity = function(entity) {
    var entityName = entity.getName();
    if (!entities[entityName])
      allEntities.push({
        entity: entityName,
        id: "none"
      });
    entities[entityName] = entity;
    return true;
  }

  /**
   * Check if an entity with a given name exists.
   * @param {string} entityName - The entity name.
   * @returns {boolean} True when found.
   */
  this.hasEntity = function(entityName) {
    return !!entities[entityName];
  }

  /**
   * Set confidence ratio, from 0.5 to 1. The higher the more strict.
   * @param {number} ratio - The confidence ratio to be set.
   */
  this.setConfidence = function(ratio) {
    confidence = ratio;
  }

  /**
   * Returns the confidence ratio.
   * @returns {number} The confidence ratio.
   */
  this.getConfidence = function(c) {
    return confidence;
  }

  /**
   * Add a new document.
   * @param {string} text - The document content.
   * @param {string} intent - The related intent. If not guessing, must prepend entity types separated by ~. (i.e. "call~phone_number")
   * @param {boolean} [guess.fromFullSentence=false] - Indicates that the document is a full untagged sentence. (i.e. "Please call the 333-123456")
   * @param {boolean} [guess.fromTaggedSentence=true] - Indicates that the document is tagged with braces. (i.e "Please call the {phone_number}")
   * @param {boolean} [guess.expandIntent=false] - Extends or creates a new intent if exceeded entities are found. New entities id will be autogenerated and progressive.
   * @param {string[]} [guess.withNames=[]] - Uses the given names for auto-extending intents. Positions in array are matched with positions of entity into the specified sentence.
   * @returns {boolean} True when found.
   */
  this.addDocument = function(text, intent, guess) {
    if (guess) {

      if (guess.fromFullSentence) { // From a full sentence...

        text = Bravey.Text.clean(text);

        if (guess.expandIntent) { // Expand intent with found items

          var found = guessIntent(text, intent, guess.withNames);
          if (!intents[found.name]) {
            console.warn("Adding intent", found.name);
            this.addIntent(intent, found.entities);
          }

          return documentClassifier.addDocument(found.text, intent);

        }

      } else if (guess.fromTaggedSentence) { // From a {tagged} sentence...

        var found = guessIntentFromTagged(text, intent, guess.withNames);
        if (found.error !== false) {
          console.warn("Can't find entity typed", found.error);
          return false;
        } else {
          if (!intents[found.name]) {
            console.warn("Adding intent", found.name);
            this.addIntent(intent, found.entities);
          }
          return documentClassifier.addDocument(found.text, intent);
        }

      }
      console.warn("Can't guess...");
      return false;
    } else { // Link a marked sentence to a particular intent
      if (intents[intent])
        return documentClassifier.addDocument(Bravey.Text.clean(text), getIntentRoot(intent));
      else {
        console.warn("Can't find intent", intent);
        return false;
      }
    }
  }

  /**
   * Check if a given sentence matches an intent and extracts its entities.
   * @param {string} text - The sentence to be processed.
   * @param {string} [method="default"] - The extraction method.
   * @returns {NlpResult} When an intent is found.
   * @returns {false} When the sentence doesn't match any intent.
   */
  this.test = function(text, method) {
    text = Bravey.Text.clean(text);
    switch (method) {
      default: { // When entities are enough, check classifier.
        var score, classification, entlist, result = false,
          resultscore = -1,
          resultfound = -1;
        for (var intent in intents) {
          entlist = getEntities(text, intents[intent]);
          if (!entlist.exceedEntities && !entlist.extraEntities && !entlist.missingEntities) { // No unwanted entites, entity count under the threshold and 0 entities for no entities intents
            classification = documentClassifier.classifyDocument(entlist.text);
            score = classification.scores[intents[intent].root];
            if ((score > confidence) && ((score > resultscore) || (entlist.found > resultfound))) {
              result = entlist;
              result.score = resultscore = score;
              resultfound = result.found;
              result.intent = intents[intent].root;
            }
          }
        }
        return result;
      }
    }
    return false;
  }
}

/**
 Describes an entity to be matched in an intent.
 @typedef IntentEntity
 @type {Object}
 @property {string} entity The entity type to be found.
 @property {string} id The entity ID to be assigned when found.
*/

/**
 Describes a sentence classification and entities.
 @typedef NlpResult
 @type {Object}
 @property {Entity[]} entities The ordered list of found entities.
 @property {number[]} entitiesIndex An map version of entities, with key as entity ID and value as entity value.
 @property {string} intent The matched intent.
 @property {number} score The score of the matched sentence intent.
*/
// File:src/adapters/ApiAiAdapter.js

/**
 * A basic unofficial compatibility object that can read {@link http://api.ai|Api.ai} exported packages and simulates its output.
 * @constructor
 * @param {string} packagePath - The path to the exported Api.ai package root.
 * @param {string} extensions.language - The language to be used. Possible values are namespace names of {@link Bravey.Language}. 
 * @param {string} extensions.nlp - The NLP processor to be used. Possible values are namespace names of {@link Bravey.Nlp}. 
 */
Bravey.ApiAiAdapter = function(packagePath, extensions) {
  extensions = extensions || {};

  var files = [];
  var loadedData = {};
  var intents = [];
  var entities = [];

  var nlp = new Bravey.Nlp[extensions.nlp || "Fuzzy"]("apiai", {
    stemmer: Bravey.Language[extensions.language].Stemmer,
    filter: extensions.filter
  });
  nlp.addEntity(new Bravey.Language[extensions.language].NumberEntityRecognizer("sys_number"));
  nlp.addEntity(new Bravey.Language[extensions.language].TimeEntityRecognizer("sys_time"));
  nlp.addEntity(new Bravey.Language[extensions.language].DateEntityRecognizer("sys_date"));
  nlp.addEntity(new Bravey.Language[extensions.language].TimePeriodEntityRecognizer("sys_time_period"));

  var pos = 0;
  var onready;

  function sanitizeApiAiId(id) {
    return id.replace(/[^a-z0-9:]/g, "_");
  }

  function loadNext() {
    Bravey.File.load(files[pos], function(text) {
      loadedData[files[pos]] = text;
      pos++;
      if (!files[pos]) dataLoaded();
      else loadNext();
    })
  }

  function dataLoaded() {
    var entity, missingEntity = {};

    for (var e = 0; e < entities.length; e++) {
      var data = JSON.parse(loadedData[entities[e].file]);
      var newEntity = new Bravey.StringEntityRecognizer(entities[e].name);
      for (var i = 0; i < data.entries.length; i++)
        for (var j = 0; j < data.entries[i].synonyms.length; j++)
          newEntity.addMatch(data.entries[i].value, data.entries[i].synonyms[j]);
      nlp.addEntity(newEntity);
    }

    for (var e = 0; e < intents.length; e++) {
      var data = JSON.parse(loadedData[intents[e].file]);
      for (var i = 0; i < data.userSays.length; i++) {
        var text = "",
          skip = false;
        for (var j = 0; j < data.userSays[i].data.length; j++) {
          if (data.userSays[i].data[j].meta) {
            entity = data.userSays[i].data[j].meta.substr(1);
            text += "{" + entity + ":" + data.userSays[i].data[j].alias + "}";
          } else text += data.userSays[i].data[j].text.replace(/\@([.a-z0-9_-]+):([.a-z0-9_-]+)/g, "{$1:$2}");
        }
        var names = [];
        text = text.replace(/\{([.a-z0-9_-]+):([.a-z0-9_-]+)\}/g, function(a, b, c) {
          b = sanitizeApiAiId(b);
          c = sanitizeApiAiId(c);
          if (!nlp.hasEntity(b)) {
            skip = true;
            if (!missingEntity[b]) {
              console.warn("Missing entity", b, data.userSays[i].data);
              missingEntity[b] = 1;
            }
          }
          names.push(c);
          return "{" + b + "}";
        });
        if (!skip)
          nlp.addDocument(text.trim(), intents[e].name, {
            fromTaggedSentence: true,
            expandIntent: true,
            withNames: names
          });
      }
    }

    onready();
  }

  /**
   * Prepare for loading an intent from the specified package.
   * @param {string} name - The intent name.
   */
  this.loadIntent = function(name) {
    var filename = packagePath + "/intents/" + name + ".json";
    files.push(filename);
    intents.push({
      file: filename,
      name: name
    });
  }

  /**
   * Prepare for loading an entity from the specified package.
   * @param {string} name - The intent name.
   */
  this.loadEntity = function(name) {
    var filename = packagePath + "/entities/" + name + ".json";
    files.push(filename);
    entities.push({
      file: filename,
      name: name
    });
  }

  /**
   * Load the needed files and prepares the NLP.
   * @param {function} cb - The callback called when everything is ready.
   */
  this.prepare = function(cb) {
    onready = cb;
    loadNext();
  }

  /**
   * Check if a given sentence matches an intent and extracts its entities. Output simulates Api.ai structure. For arguments, check {@link Bravey.Nlp.test}.	
   */
  this.test = function(text, method) {
    var out = this.nlp.test(text, method);
    if (out) {
      var ret = {
        result: {
          source: "agent",
          resolvedQuery: text,
          action: "",
          actionIncomplete: false,
          parameters: {

          },
          contexts: [],
          metadata: {
            intentName: ""
          },
          fulfillment: {
            speech: ""
          },
          score: 0
        },
        status: {
          code: 200,
          errorType: "success"
        }
      };
      ret.result.metadata.intentName = out.intent;
      ret.result.score = out.score;
      for (var a in out.entitiesIndex) ret.result.parameters[a] = out.entitiesIndex[a].value;
      return ret;
    } else
      return {
        result: {
          resolvedQuery: text,
          contexts: [],
          metadata: {},
          fulfillment: {
            speech: ""
          },
          score: 0
        },
        status: {
          code: 200,
          errorType: "success"
        }
      };
  }

  /** @property {Bravey.Nlp} nlp The raw Nlp instance. */
  this.nlp = nlp;
}
// File:src/contextmanagers/ContextManager.js

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
// File:src/sessionmanagers/InMemorySessionManager.js

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
// File:src/filters/BasicFilter.js

/**
 * Removes from tokens entities and words with less than 4 letters.
 * @constructor
 * @param {string[]} tokens - The token lists to be filtered.
 * @param {string[]} - The filtered list
 */
Bravey.Filter.BasicFilter = function(tokens) {
  var out = [];
  for (var i = 0; i < tokens.length; i++)
    if ((tokens[i][0] != "{") && (tokens[i].length > 3)) out.push(tokens[i]);
  if (out.length < 3) return tokens;
  else return out;
}
