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