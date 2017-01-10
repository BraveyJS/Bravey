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