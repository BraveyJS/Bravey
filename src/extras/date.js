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