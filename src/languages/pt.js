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