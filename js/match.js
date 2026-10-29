/* Italian matching for a 12-year-old: accents and close misses, but io/tu pairs stay distinct. */
(function (root) {
  "use strict";

  var FILLER = { ehm: 1, uhm: 1, um: 1, uh: 1, allora: 1, dunque: 1, mah: 1, boh: 1, si: 1, sì: 1 };

  /* Words that must not fuzzy-match each other. */
  var FAMILIES = [
    ["mangio", "mangi"],
    ["vado", "vai", "vadi"],
    ["guardo", "guardi"],
    ["bevo", "bevi"],
    ["gioco", "giochi"],
    ["oggi", "domani", "adesso"],
    ["nonna", "amici", "zia"],
    ["mare", "palestra"]
  ];

  function normalize(value) {
    var base = String(value || "")
      .toLowerCase()
      .replace(/[’'`´]/g, " ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!base) return "";
    return base
      .split(" ")
      .filter(function (word) {
        return word && !FILLER[word];
      })
      .join(" ");
  }

  function tolerance(len) {
    if (len <= 5) return 0;
    if (len <= 10) return 1;
    if (len <= 18) return 2;
    return 3;
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    var n = a.length;
    var m = b.length;
    if (!n) return m;
    if (!m) return n;
    var prev = new Array(m + 1);
    var curr = new Array(m + 1);
    var j;
    for (j = 0; j <= m; j++) prev[j] = j;
    for (var i = 1; i <= n; i++) {
      curr[0] = i;
      var ca = a.charCodeAt(i - 1);
      for (j = 1; j <= m; j++) {
        var cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
        var del = prev[j] + 1;
        var ins = curr[j - 1] + 1;
        var sub = prev[j - 1] + cost;
        curr[j] = del < ins ? (del < sub ? del : sub) : ins < sub ? ins : sub;
      }
      var swap = prev;
      prev = curr;
      curr = swap;
    }
    return prev[m];
  }

  function wordsInOrder(needle, hay) {
    var nw = needle.split(" ").filter(Boolean);
    var hw = hay.split(" ").filter(Boolean);
    if (!nw.length || hw.length < nw.length) return false;
    var i = 0;
    for (var k = 0; k < hw.length; k++) {
      if (hw[k] === nw[i]) {
        i += 1;
        if (i === nw.length) return true;
      }
    }
    return false;
  }

  function hits(words, family) {
    var found = [];
    for (var i = 0; i < family.length; i++) {
      if (words.indexOf(family[i]) !== -1) found.push(family[i]);
    }
    return found;
  }

  function familyClash(heard, target) {
    var hw = heard.split(" ");
    var pw = target.split(" ");
    for (var f = 0; f < FAMILIES.length; f++) {
      var hin = hits(hw, FAMILIES[f]);
      var pin = hits(pw, FAMILIES[f]);
      if (!hin.length || !pin.length) continue;
      for (var i = 0; i < hin.length; i++) {
        if (pin.indexOf(hin[i]) === -1) return true;
      }
      for (var j = 0; j < pin.length; j++) {
        if (hin.indexOf(pin[j]) === -1 && hw.indexOf(pin[j]) === -1) return true;
      }
    }
    return false;
  }

  function matches(heard, acceptList) {
    var h = normalize(heard);
    if (h.length < 3) return false;
    var list = acceptList || [];
    for (var i = 0; i < list.length; i++) {
      var p = normalize(list[i]);
      if (!p || familyClash(h, p)) continue;
      if (h === p) return true;
      if (p.length >= 4 && h.indexOf(p) !== -1) return true;
      if (p.length >= 4 && wordsInOrder(p, h)) return true;
      if (h.length >= 4 && p.indexOf(h) !== -1 && p.length - h.length <= 1) return true;
      var gate = tolerance(Math.max(h.length, p.length));
      if (Math.abs(h.length - p.length) <= gate && levenshtein(h, p) <= tolerance(p.length)) return true;
    }
    return false;
  }

  root.NonnaMatch = {
    normalize: normalize,
    matches: matches,
    familyClash: familyClash,
    levenshtein: levenshtein
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
