/* Che fai oggi, Nonna? — verb call, jar, shop, pop, and Verb Catch. */
(function () {
  "use strict";

  var KEY = "che-fai-oggi-nonna-v1";
  var TURNS = NONNA_SCRIPT.turns;
  var CATCHES = {
    andare: {
      id: "andare",
      title: "Andare Catch",
      legend: "Catch vado and vai, plus when and where. Let vadi fall.",
      basket: "vado<br>vai",
      wide: true,
      goodRate: 0.62,
      bestKey: "andareBest",
      playedKey: "andarePlayed",
      badTitle: "Vadi landed in the basket.",
      badLine: "Let that one fall.",
      good: [
        { t: "vado", en: "I go" },
        { t: "vai", en: "you go" },
        { t: "oggi", en: "today" },
        { t: "domani", en: "tomorrow" },
        { t: "adesso", en: "now" },
        { t: "al mare", en: "to the sea" },
        { t: "in palestra", en: "to the gym" },
        { t: "con Nonna", en: "with Grandma" },
        { t: "con amici", en: "with friends" },
        { t: "con Zia", en: "with Aunt" }
      ],
      bad: [
        { t: "vadi", en: "not a word" },
        { t: "vadi", en: "not a word" },
        { t: "vadi", en: "not a word" },
        { t: "mangio", en: "I eat" },
        { t: "guardo", en: "I watch" }
      ]
    },
    time: {
      id: "time",
      title: "Time Catch",
      legend: "Catch oggi, domani, and adesso. Let everything else fall.",
      basket: "tempo",
      wide: false,
      goodRate: 0.5,
      bestKey: "timeBest",
      playedKey: "timePlayed",
      badTitle: "That was not a time word.",
      badLine: "Not oggi, domani, or adesso.",
      good: [
        { t: "oggi", en: "today" },
        { t: "domani", en: "tomorrow" },
        { t: "adesso", en: "now" }
      ],
      bad: [
        { t: "vado", en: "I go" },
        { t: "vai", en: "you go" },
        { t: "vadi", en: "not a word" },
        { t: "al mare", en: "to the sea" },
        { t: "in palestra", en: "to the gym" },
        { t: "con Nonna", en: "with Grandma" },
        { t: "con amici", en: "with friends" },
        { t: "con Zia", en: "with Aunt" }
      ]
    }
  };
  var EYEBROW = {
    hello: "She called",
    time: "Today or tomorrow",
    flip: "The tu flip",
    build: "Build it",
    easy: "Super easy",
    rebuild: "Swap one chip",
    recall: "Your turn",
    goodbye: "Before you go"
  };

  var state = {
    inputMode: "tap",
    muted: false,
    name: "Arianna",
    screen: "home",
    phase: "home",
    index: 0,
    beatIndex: 0,
    turn: null,
    beat: null,
    chips: [],
    filled: [],
    beatMisses: 0,
    anyTaught: false,
    anySlip: false,
    streak: 0,
    callStars: 0,
    callLemons: 0,
    callShells: 0,
    recap: [],
    nudge: null,
    note: "",
    heard: "",
    listening: false,
    micBlocked: false,
    flipToken: 0,
    startedAt: 0,
    timer: 0,
    savedCall: false,
    returnTo: "choice",
    popSession: 0,
    catch: null
  };

  var listenGen = 0;
  var listener = null;
  var audioCtx = null;
  var ringTimer = null;

  function $(id) {
    return document.getElementById(id);
  }

  function load() {
    var blank = {
      name: "",
      named: false,
      totalStars: 0,
      callsCompleted: 0,
      bestStars: 0,
      inputMode: "",
      muted: false,
      firstTry: {},
      lemons: 0,
      shells: 0,
      popPoints: 0,
      gifts: {},
      catchUnlocked: false,
      catchBest: 0,
      catchPlayed: 0,
      andareBest: 0,
      andarePlayed: 0,
      timeBest: 0,
      timePlayed: 0
    };
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blank;
      var data = JSON.parse(raw);
      data.gifts = data.gifts || {};
      data.firstTry = data.firstTry || {};
      return Object.assign(blank, data);
    } catch (err) {
      return blank;
    }
  }

  function save(profile) {
    try {
      localStorage.setItem(KEY, JSON.stringify(profile));
    } catch (err) {
      /* private mode or full storage */
    }
  }

  function cleanName(raw) {
    var text = String(raw || "")
      .replace(/[\u0000-\u001f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 18);
    try {
      if (!text || !/\p{L}/u.test(text)) return "Arianna";
    } catch (err) {
      if (!text) return "Arianna";
    }
    return text;
  }

  function initial(name) {
    var chars = Array.from(name || "A");
    return (chars[0] || "A").toUpperCase();
  }

  function formatTime(ms) {
    var total = Math.max(0, Math.floor(ms / 1000));
    var m = Math.floor(total / 60);
    var s = total % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function showScreen(name) {
    ["home", "ring", "call", "choice", "shop", "pop", "catch"].forEach(function (id) {
      $("screen-" + id).hidden = id !== name;
    });
    if (name !== "catch") stopCatchLoop();
    if (name !== "ring") stopRing();
    state.screen = name;
    if (name === "home") renderHome();
    if (name === "choice") paintChoice();
    if (name === "shop") renderShop();
  }

  function mountScene(hostId) {
    var host = $(hostId);
    host.replaceChildren($("scene-template").content.firstElementChild.cloneNode(true));
  }

  function sceneNode(hostId) {
    return document.querySelector("#" + hostId + " .scene");
  }

  function setSceneMood(hostId, mood) {
    var node = sceneNode(hostId);
    if (node && mood) node.dataset.mood = mood;
  }

  function paintJar(hostId) {
    var scene = sceneNode(hostId);
    if (!scene) return;
    var profile = load();
    var lemons = profile.lemons || 0;
    var shells = profile.shells || 0;
    var items = scene.querySelector(".jar-items");
    var shown = [];
    var l = 0;
    var s = 0;
    var capL = Math.min(lemons, 8);
    var capS = Math.min(shells, 8);
    while (shown.length < 12 && (l < capL || s < capS)) {
      if (l < capL && (shown.length % 2 === 0 || s >= capS)) {
        shown.push("🍋");
        l += 1;
      } else if (s < capS) {
        shown.push("🐚");
        s += 1;
      } else break;
    }
    items.textContent = shown.join("");
    scene.querySelector(".jar-label").textContent = lemons + " 🍋  " + shells + " 🐚";
    scene.setAttribute(
      "aria-label",
      "Nonna calling from Monte di Procida, Italia. The jar holds " +
        lemons +
        " lemons and " +
        shells +
        " shells."
    );
  }

  function burst(emoji) {
    var host = $("call-scene");
    if (!host) return;
    for (var i = 0; i < 6; i++) {
      var node = document.createElement("span");
      node.className = "floater";
      node.setAttribute("aria-hidden", "true");
      node.textContent = i === 0 ? emoji : i % 2 ? "✦" : "★";
      node.style.left = 62 + Math.random() * 24 + "%";
      node.style.animationDelay = i * 0.05 + "s";
      host.appendChild(node);
      setTimeout(
        (function (el) {
          return function () {
            el.remove();
          };
        })(node),
        1100
      );
    }
  }

  function audio() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function tone(freq, dur, gainValue, delay) {
    var ctx = audio();
    if (!ctx || state.muted) return;
    var t = ctx.currentTime + (delay || 0);
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(gainValue, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function startRing() {
    stopRing();
    var blip = function () {
      if (state.muted || $("screen-ring").hidden) return;
      tone(523, 0.14, 0.028);
      tone(659, 0.16, 0.024, 0.16);
    };
    blip();
    ringTimer = setInterval(blip, 1700);
  }

  function stopRing() {
    if (ringTimer) clearInterval(ringTimer);
    ringTimer = null;
  }

  function chime() {
    tone(523, 0.1, 0.035);
    tone(659, 0.12, 0.035, 0.09);
    tone(784, 0.18, 0.03, 0.18);
  }

  function soft() {
    tone(392, 0.12, 0.02);
  }

  function say(text) {
    if (state.muted || !text) return;
    NonnaSpeech.speak(text);
  }

  function announce(text) {
    var live = $("live");
    live.textContent = "";
    setTimeout(function () {
      live.textContent = text;
    }, 30);
  }

  function lineOf(beat) {
    if (!beat) return "";
    if (beat.nonnaNamed && /arianna/i.test(state.name)) return beat.nonnaNamed;
    return beat.nonna;
  }

  function renderMute() {
    var btn = $("mute-btn");
    btn.setAttribute("aria-pressed", state.muted ? "true" : "false");
    btn.setAttribute("aria-label", state.muted ? "Unmute Nonna" : "Mute Nonna");
    btn.classList.toggle("is-muted", state.muted);
  }

  function syncModeButtons() {
    var canSpeak = NonnaSpeech.supported();
    var speakBtn = $("mode-speak");
    var tapBtn = $("mode-tap");
    speakBtn.disabled = !canSpeak;
    speakBtn.setAttribute("aria-pressed", state.inputMode === "speak" ? "true" : "false");
    tapBtn.setAttribute("aria-pressed", state.inputMode === "tap" ? "true" : "false");
    var note = $("mode-note");
    if (!canSpeak) {
      note.textContent = "This browser can’t use the microphone. Word chips work with no permission.";
    } else if (state.inputMode === "speak") {
      note.textContent = "Say the sentence out loud. The chips stay on screen, with the English, if you want to tap.";
    } else {
      note.textContent = "Every phrase is word chips. Italian on top, English underneath. Tap them in order.";
    }
  }

  function renderWordList() {
    var list = $("word-list");
    list.replaceChildren();
    NONNA_SCRIPT.peek.forEach(function (row) {
      var li = document.createElement("li");
      var it = document.createElement("span");
      it.lang = "it";
      it.className = "wl-it";
      it.textContent = row[0];
      var en = document.createElement("span");
      en.className = "wl-en";
      en.textContent = row[1];
      li.append(it, en);
      list.appendChild(li);
    });
  }

  function renderMastered(profile) {
    var wrap = $("mastered-wrap");
    var host = $("mastered");
    var ids = Object.keys(profile.firstTry || {}).filter(function (id) {
      return profile.firstTry[id] > 0;
    });
    wrap.hidden = ids.length === 0;
    host.replaceChildren();
    ids.forEach(function (id) {
      var turn = TURNS.find(function (item) {
        return item.id === id;
      });
      if (!turn) return;
      var pill = document.createElement("span");
      pill.className = "pill";
      pill.lang = "it";
      pill.textContent = turn.pill;
      host.appendChild(pill);
    });
  }

  function giftNames(profile) {
    return NONNA_SCRIPT.gifts
      .filter(function (gift) {
        return profile.gifts && profile.gifts[gift.id];
      })
      .map(function (gift) {
        return gift.name;
      });
  }

  function renderHome() {
    var profile = load();
    var named = !!(profile.named && profile.name);
    $("greet-line").hidden = !named;
    $("name-wrap").hidden = named;
    $("change-name").hidden = !named;
    if (named) $("greet-line").textContent = "Ciao, " + profile.name + "!";
    var stars = profile.totalStars || 0;
    $("stars-pill").textContent = stars
      ? stars + (stars === 1 ? " star" : " stars") + " on this phone"
      : "No stars yet — Nonna is waiting";
    var lemons = profile.lemons || 0;
    var shells = profile.shells || 0;
    var gifts = giftNames(profile);
    var jar = "🍋 " + lemons + " · 🐚 " + shells;
    if (profile.popPoints) jar += " · " + profile.popPoints + " pop points";
    if (!lemons && !shells && !profile.popPoints) jar = "The jar is empty — lemons and shells drop on the call";
    if (gifts.length) jar += " · " + gifts.length + (gifts.length === 1 ? " gift" : " gifts");
    $("jar-line").textContent = jar;
    var calls = profile.callsCompleted || 0;
    $("calls-line").textContent = calls
      ? calls + (calls === 1 ? " finished call" : " finished calls") + " · best " + (profile.bestStars || 0)
      : "";
    $("catch-home").hidden = !profile.catchUnlocked;
    renderMastered(profile);
    syncModeButtons();
    paintJar("home-scene");
  }

  function setProgress(doneCount) {
    var pct = TURNS.length ? Math.round((doneCount / TURNS.length) * 100) : 0;
    $("bar-fill").style.width = pct + "%";
  }

  function setListeningUI(on) {
    var btn = $("mic-btn");
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    $("mic-label").textContent = on ? "Listening… tap to stop" : "Tap to speak";
  }

  function renderStars(stars) {
    var host = $("stars-now");
    host.replaceChildren();
    for (var i = 1; i <= 3; i++) {
      var mark = document.createElement("span");
      mark.className = i <= stars ? "on" : "off";
      mark.textContent = i <= stars ? "★" : "☆";
      host.appendChild(mark);
    }
  }

  function renderWas(beat) {
    var el = $("was-line");
    el.replaceChildren();
    if (!beat || !beat.was || !beat.swapFrom) {
      el.hidden = true;
      return;
    }
    var text = beat.was;
    var at = text.indexOf(beat.swapFrom);
    if (at < 0) {
      el.textContent = text;
      el.hidden = false;
      return;
    }
    el.append(document.createTextNode(text.slice(0, at)));
    var struck = document.createElement("s");
    struck.textContent = beat.swapFrom;
    var neu = document.createElement("b");
    neu.className = "swap-new";
    neu.textContent = beat.swapTo;
    el.append(struck, document.createTextNode(" "), neu, document.createTextNode(text.slice(at + beat.swapFrom.length)));
    el.hidden = false;
  }

  function renderTray() {
    var tray = $("tray");
    tray.replaceChildren();
    var order = state.beat ? state.beat.order : [];
    order.forEach(function (word, i) {
      var slot = document.createElement("span");
      slot.className = "tray-slot" + (i < state.filled.length ? " filled" : "");
      slot.lang = "it";
      slot.textContent = i < state.filled.length ? state.filled[i] : "·";
      tray.appendChild(slot);
    });
  }

  function renderChips() {
    var host = $("chips");
    host.replaceChildren();
    var beat = state.beat;
    if (!beat) return;
    var next = beat.order[state.filled.length];
    var guide = !!(beat.gentle || state.phase === "teach" || state.beatMisses > 0);
    state.chips.forEach(function (chip) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "word-chip";
      button.lang = "it";
      if (chip.used) button.classList.add("is-used");
      if (beat.spark === chip.t && !chip.used) button.classList.add("is-spark");
      if (guide && !chip.used && chip.t === next) button.classList.add("is-next");
      button.disabled = !!chip.used;
      var it = document.createElement("span");
      it.className = "it";
      it.textContent = chip.t;
      var en = document.createElement("span");
      en.className = "en";
      en.textContent = chip.en;
      button.append(it, en);
      button.addEventListener("click", function () {
        onChip(chip, button);
      });
      host.appendChild(button);
    });
  }

  function renderFlip() {
    var host = $("flip-stage");
    var turn = state.turn;
    if (!turn || turn.kind !== "flip" || !turn.flip) {
      host.hidden = true;
      host.replaceChildren();
      return;
    }
    var flip = turn.flip;
    host.hidden = false;
    host.replaceChildren();
    var word = document.createElement("p");
    word.className = "flip-word";
    word.lang = "it";
    var stem = document.createElement("span");
    stem.className = "flip-stem";
    stem.textContent = flip.stem;
    var ending = document.createElement("span");
    ending.className = "flip-ending";
    ending.textContent = flip.fromEnd;
    var spark = document.createElement("span");
    spark.className = "spark-extra";
    spark.textContent = "✦";
    spark.hidden = true;
    word.append(stem, ending, spark);
    word.setAttribute("aria-label", flip.stem + flip.fromEnd);
    host.appendChild(word);
    var trapEl = null;
    if (flip.trap) {
      trapEl = document.createElement("p");
      trapEl.className = "flip-trap";
      var struck = document.createElement("s");
      struck.textContent = flip.trap;
      trapEl.append(struck, document.createTextNode(" · not a word"));
      host.appendChild(trapEl);
    }
    var badges = document.createElement("div");
    badges.className = "verb-badges";
    flip.badges.forEach(function (badge) {
      var span = document.createElement("span");
      span.className = "verb-badge " + badge.cls;
      span.textContent = badge.text;
      badges.appendChild(span);
    });
    host.appendChild(badges);
    var token = state.flipToken;
    var reduce = false;
    try {
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (err) {
      reduce = false;
    }
    var finish = function () {
      if (token !== state.flipToken) return;
      stem.textContent = flip.toStem;
      ending.textContent = flip.toEnd;
      word.classList.add("is-spark");
      spark.hidden = false;
      badges.classList.add("show");
      word.setAttribute("aria-label", flip.toStem + flip.toEnd);
    };
    if (reduce) {
      if (trapEl) trapEl.classList.add("show");
      finish();
      return;
    }
    if (flip.irregular && trapEl) {
      setTimeout(function () {
        if (token !== state.flipToken) return;
        trapEl.classList.add("show");
      }, 380);
      setTimeout(finish, 900);
    } else {
      setTimeout(finish, 420);
    }
  }

  function updateCaption() {
    var text = "";
    if (!state.beat) text = "";
    else if (state.phase === "feedback" || state.phase === "between") text = state.beat.reply;
    else text = lineOf(state.beat);
    $("subtitle-text").textContent = text;
  }

  function paintChrome() {
    var phase = state.phase;
    var beat = state.beat;
    var answering = phase === "answer" || phase === "teach";
    var between = phase === "between";
    var feedback = phase === "feedback";
    var canSpeak = NonnaSpeech.supported() && !state.micBlocked;
    var speak = state.inputMode === "speak" && canSpeak;
    var showTray = (answering || between) && beat && !beat.single;

    $("task").hidden = !answering;
    $("tray").hidden = !showTray;
    $("was-line").hidden = !(beat && beat.was && (answering || between));
    $("flip-stage").hidden = !(state.turn && state.turn.kind === "flip" && answering);
    $("chips").hidden = !answering;
    $("mic-btn").hidden = !(speak && answering);
    $("feedback").hidden = !(between || feedback);
    $("stars-now").hidden = !feedback;
    $("reward-line").hidden = !feedback;
    $("tip").hidden = !feedback;
    if (!feedback) $("streak").hidden = true;

    var showModel = phase === "teach" || (answering && state.beatMisses > 0);
    $("model").hidden = !showModel;
    if (showModel && beat) {
      $("model-it").textContent = beat.say;
      $("phonetic").textContent = beat.phonetic;
    }
    $("hint").hidden = true;
    $("nudge").hidden = !(phase === "answer" && state.nudge);
    if (state.nudge) {
      $("nudge-it").textContent = state.nudge.it;
      $("nudge-en").textContent = state.nudge.en;
    }
    $("heard-line").hidden = !(state.heard && answering);
    if (state.heard && answering) $("heard-line").textContent = "I heard “" + state.heard.slice(0, 80) + "”.";
    $("note").hidden = !state.note;
    if (state.note) $("note").textContent = state.note;

    $("hear-btn").hidden = !answering;
    if (answering) {
      $("hear-btn").textContent =
        phase === "teach" || state.beatMisses > 0 ? "Hear Nonna say it" : "Hear it again";
    }
    $("switch-btn").hidden = !(answering && (canSpeak || state.inputMode === "speak"));
    if (!$("switch-btn").hidden) {
      $("switch-btn").textContent = speak ? "Or just the chips" : "Or speak instead";
    }
    $("next-btn").hidden = !(between || feedback);
    if (between) $("next-btn").textContent = "Keep going";
    if (feedback) {
      $("next-btn").textContent = state.index >= TURNS.length - 1 ? "Shop, Pop, or Play" : "Next";
    }
    updateCaption();
  }

  function eyebrow() {
    var turn = state.turn;
    var label = EYEBROW[turn.kind] || "Listen";
    var level = turn.level === "medium" ? "medium" : "easy";
    return label + " · " + level;
  }

  function startBeat() {
    var turn = state.turn;
    var beat = turn.beats[state.beatIndex];
    state.beat = beat;
    state.phase = "answer";
    state.chips = shuffle(
      beat.chips.map(function (chip) {
        return { t: chip.t, en: chip.en, role: chip.role, used: false };
      })
    );
    if (beat.straight) {
      state.chips = beat.chips.map(function (chip) {
        return { t: chip.t, en: chip.en, role: chip.role, used: false };
      });
    }
    state.filled = [];
    state.beatMisses = 0;
    state.nudge = null;
    state.note = "";
    state.heard = "";
    state.flipToken += 1;
    setSceneMood("call-scene", "smile");
    $("screen-call").classList.toggle(
      "is-lesson",
      turn.kind === "flip" || turn.kind === "build" || turn.kind === "recall" || turn.kind === "time"
    );
    $("eyebrow").textContent = eyebrow() + "  ·  " + (state.index + 1) + " / " + TURNS.length;
    $("english").textContent = beat.english || turn.english;
    $("task").textContent = beat.prompt;
    renderWas(beat);
    renderTray();
    renderChips();
    renderFlip();
    setListeningUI(false);
    paintChrome();
    setProgress(state.index);
    if (turn.intro && state.beatIndex === 0) say(turn.intro);
    say(lineOf(beat));
  }

  function startTurn() {
    state.turn = TURNS[state.index];
    state.beatIndex = 0;
    state.anyTaught = false;
    state.anySlip = false;
    startBeat();
  }

  function invalidateListen() {
    listenGen += 1;
    state.listening = false;
    if (listener) {
      var current = listener;
      listener = null;
      current.abort();
    }
    setListeningUI(false);
  }

  function startListen() {
    invalidateListen();
    var gen = listenGen;
    state.listening = true;
    state.heard = "";
    state.note = "";
    $("note").hidden = true;
    $("heard-line").hidden = true;
    setListeningUI(true);
    listener = NonnaSpeech.listen({
      onPartial: function (text) {
        if (gen !== listenGen) return;
        $("heard-line").hidden = false;
        $("heard-line").textContent = "“" + text.trim().slice(0, 80) + "”";
      },
      onFinal: function (text, alts) {
        if (gen !== listenGen) return;
        state.listening = false;
        listener = null;
        setListeningUI(false);
        handleHeard(text, alts);
      },
      onError: function (code) {
        if (gen !== listenGen) return;
        listener = null;
        state.listening = false;
        setListeningUI(false);
        onMicError(code);
      },
      onEnd: function () {
        if (gen !== listenGen || !state.listening) return;
        state.listening = false;
        listener = null;
        setListeningUI(false);
        state.note = "I didn’t catch that. Try once more, or tap the chips.";
        paintChrome();
      }
    });
  }

  function handleHeard(text, alts) {
    if (state.phase !== "answer" && state.phase !== "teach") return;
    var options = [text].concat(alts || []);
    var hit = "";
    for (var i = 0; i < options.length; i++) {
      if (options[i] && NonnaMatch.matches(options[i], state.beat.accept)) {
        hit = options[i];
        break;
      }
    }
    var shown = String(hit || text || "").trim();
    if (!hit && NonnaMatch.normalize(shown).length < 3) {
      state.note = "I didn’t catch that. Come a little closer, or tap the chips.";
      state.heard = "";
      paintChrome();
      return;
    }
    if (hit) succeedBeat();
    else registerMiss(shown);
  }

  function onMicError(code) {
    if (code === "not-allowed" || code === "service-not-allowed" || code === "audio-capture") {
      forceTap("The microphone isn’t available. Tap the chips — Nonna doesn’t mind.");
      return;
    }
    if (code === "network") {
      forceTap("This browser needs internet for the mic. Tap the chips instead.");
      return;
    }
    if (code === "no-speech" || code === "aborted") {
      state.note = "I didn’t catch that. Try again, a little closer to the phone.";
      paintChrome();
      return;
    }
    state.note =
      code === "timeout"
        ? "The mic went quiet. Try speaking again, or tap the chips."
        : "The mic hiccuped. You can try again, or tap the chips.";
    paintChrome();
  }

  function forceTap(message) {
    state.micBlocked = true;
    state.inputMode = "tap";
    var profile = load();
    profile.inputMode = "tap";
    save(profile);
    state.note = message;
    paintChrome();
    announce(message);
  }

  function onChip(chip, button) {
    if (state.phase !== "answer" && state.phase !== "teach") return;
    if (!state.beat || chip.used) return;
    var next = state.beat.order[state.filled.length];
    if (chip.t !== next) {
      button.classList.remove("is-wrong");
      void button.offsetWidth;
      button.classList.add("is-wrong");
      if (state.beat.gentle || state.phase === "teach") return;
      registerMiss("");
      return;
    }
    chip.used = true;
    state.filled.push(chip.t);
    renderTray();
    renderChips();
    if (state.filled.length === state.beat.order.length) succeedBeat();
  }

  function registerMiss(heard) {
    if (state.phase !== "answer") return;
    invalidateListen();
    state.beatMisses += 1;
    state.streak = 0;
    if (state.beatMisses >= 2) enterTeach();
    else enterRetry(heard || "");
  }

  function enterRetry(heard) {
    state.nudge = NONNA_SCRIPT.nudges[(state.beatMisses - 1) % NONNA_SCRIPT.nudges.length];
    state.heard = heard;
    state.note = "";
    setSceneMood("call-scene", "hmm");
    soft();
    renderChips();
    paintChrome();
    say(state.nudge.it);
    announce(state.nudge.it + " " + state.nudge.en);
  }

  function enterTeach() {
    state.phase = "teach";
    state.nudge = null;
    state.note = "Tap the glowing chip.";
    state.heard = "";
    state.filled = [];
    state.chips.forEach(function (chip) {
      chip.used = false;
    });
    setSceneMood("call-scene", "hmm");
    soft();
    renderTray();
    renderChips();
    paintChrome();
    say(state.beat.say);
    announce("The phrase is " + state.beat.say);
  }

  function succeedBeat() {
    if (state.phase !== "answer" && state.phase !== "teach") return;
    var taught = state.phase === "teach";
    if (taught) state.anyTaught = true;
    else if (state.beatMisses > 0) state.anySlip = true;
    invalidateListen();
    NonnaSpeech.cancel();
    var beat = state.beat;
    var last = state.beatIndex >= state.turn.beats.length - 1;
    if (!last) {
      state.phase = "between";
      state.nudge = null;
      state.note = "";
      state.heard = "";
      $("praise").textContent = beat.reply;
      $("praise-en").textContent = beat.replyEn;
      setSceneMood("call-scene", "love");
      chime();
      paintChrome();
      say(beat.reply);
      announce(beat.reply + " " + beat.replyEn);
      return;
    }
    finishTurn();
  }

  function finishTurn() {
    var turn = state.turn;
    var beat = state.beat;
    var stars = state.anyTaught ? 1 : state.anySlip ? 2 : 3;
    if (stars === 3) state.streak += 1;
    else state.streak = 0;
    var lemon = turn.level === "medium";
    var profile = load();
    profile.totalStars = (profile.totalStars || 0) + stars;
    if (stars === 3) profile.firstTry[turn.id] = (profile.firstTry[turn.id] || 0) + 1;
    if (lemon) {
      profile.lemons = (profile.lemons || 0) + 1;
      state.callLemons += 1;
    } else {
      profile.shells = (profile.shells || 0) + 1;
      state.callShells += 1;
    }
    save(profile);
    state.callStars += stars;
    $("call-stars").textContent = String(state.callStars);
    state.recap.push({ say: turn.pill, english: turn.english, stars: stars });
    state.phase = "feedback";
    state.nudge = null;
    state.note = "";
    state.heard = "";
    setProgress(state.index + 1);
    setSceneMood("call-scene", "love");
    paintJar("call-scene");
    var emoji = lemon ? "🍋" : "🐚";
    burst(emoji);
    if (stars === 3) chime();
    else soft();
    try {
      if (navigator.vibrate) navigator.vibrate(stars === 1 ? 12 : [12, 30, 12]);
    } catch (err) {
      /* ignore */
    }
    renderStars(stars);
    $("praise").textContent = beat.reply;
    $("praise-en").textContent = beat.replyEn;
    $("reward-line").textContent = lemon ? "🍋 A lemon drops in the jar." : "🐚 A shell for the jar.";
    var tip = turn.why;
    if (stars === 3 && state.streak >= 3) tip = state.streak + " in a row. " + tip;
    $("tip").textContent = tip;
    $("streak").hidden = !(stars === 3 && state.streak >= 3);
    if (!$("streak").hidden) $("streak").textContent = state.streak + " in a row";
    paintChrome();
    say(beat.reply);
    announce(beat.reply + " " + beat.replyEn);
    $("next-btn").focus();
  }

  function onHear() {
    if (!state.beat) return;
    var line = state.phase === "teach" || state.beatMisses > 0 ? state.beat.say : lineOf(state.beat);
    NonnaSpeech.cancel();
    say(line);
  }

  function onSwitch() {
    if (state.phase !== "answer" && state.phase !== "teach") return;
    if (state.micBlocked && state.inputMode === "tap") return;
    invalidateListen();
    state.inputMode = state.inputMode === "speak" ? "tap" : "speak";
    if (!NonnaSpeech.supported()) state.inputMode = "tap";
    var profile = load();
    profile.inputMode = state.inputMode;
    save(profile);
    state.note = "";
    paintChrome();
  }

  function onMic() {
    if ($("mic-btn").hidden || (state.phase !== "answer" && state.phase !== "teach")) return;
    if (state.listening) {
      if (listener) listener.stop();
      return;
    }
    startListen();
  }

  function onNext() {
    if (state.phase === "between") {
      NonnaSpeech.cancel();
      state.beatIndex += 1;
      startBeat();
      return;
    }
    if (state.phase !== "feedback") return;
    NonnaSpeech.cancel();
    if (state.index >= TURNS.length - 1) {
      openChoice(true);
      return;
    }
    state.index += 1;
    startTurn();
  }

  function startTimer() {
    stopTimer();
    state.startedAt = Date.now();
    var tick = function () {
      $("call-timer").textContent = formatTime(Date.now() - state.startedAt);
    };
    tick();
    state.timer = setInterval(tick, 1000);
  }

  function stopTimer() {
    if (state.timer) clearInterval(state.timer);
    state.timer = 0;
  }

  function paintChoice() {
    var profile = load();
    paintJar("choice-scene");
    setSceneMood("choice-scene", "love");
    $("choice-title").textContent = "Ciao ciao, " + state.name + ".";
    $("choice-score").textContent =
      state.callStars +
      (state.callStars === 1 ? " star" : " stars") +
      " · 🍋 " +
      state.callLemons +
      " · 🐚 " +
      state.callShells;
    var gifts = giftNames(profile);
    $("choice-jar-line").textContent =
      "Jar on this phone: 🍋 " +
      (profile.lemons || 0) +
      " · 🐚 " +
      (profile.shells || 0) +
      (gifts.length ? " · " + gifts.join(", ") : "");
    $("choice-saved").textContent =
      (profile.totalStars || 0) +
      " stars saved · best call " +
      (profile.bestStars || 0) +
      (profile.popPoints ? " · " + profile.popPoints + " pop points" : "");
    $("copy-all-text").value = buildClassroomText(profile);
    setCopyGate(!!state.copied);
    var list = $("recap");
    list.replaceChildren();
    state.recap.forEach(function (row) {
      var li = document.createElement("li");
      var stars = document.createElement("span");
      stars.className = "recap-stars";
      stars.textContent = "★".repeat(row.stars) + "☆".repeat(3 - row.stars);
      var it = document.createElement("span");
      it.className = "recap-it";
      it.lang = "it";
      it.textContent = row.say;
      var en = document.createElement("span");
      en.className = "recap-en";
      en.textContent = row.english;
      li.append(stars, it, en);
      list.appendChild(li);
    });
  }

  var COPY_GATE = ["shop-btn", "pop-btn", "andare-play-btn", "time-play-btn", "again-btn", "home-btn"];

  function buildClassroomText(profile) {
    var saved = profile || load();
    var when = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    var lines = [
      "Che fai oggi, Nonna?",
      "Name: " + (state.name || "Arianna"),
      "Date: " + when,
      "Point: Practice io→tu with Nonna (mangi, vai) and build real “vado / vai” phrases.",
      "",
      "This call: " +
        state.callStars +
        (state.callStars === 1 ? " star" : " stars") +
        " · 🍋 " +
        state.callLemons +
        " · 🐚 " +
        state.callShells,
      "",
      "What I said:"
    ];
    state.recap.forEach(function (row, index) {
      var marks = "★".repeat(row.stars) + "☆".repeat(Math.max(0, 3 - row.stars));
      lines.push(index + 1 + ". " + marks + " " + row.say + " — " + row.english);
    });
    lines.push("");
    lines.push(
      "Jar on this phone: 🍋 " + (saved.lemons || 0) + " · 🐚 " + (saved.shells || 0)
    );
    lines.push(
      "Stars on this phone: " + (saved.totalStars || 0) + " · best call " + (saved.bestStars || 0)
    );
    var gifts = giftNames(saved);
    if (gifts.length) lines.push("Gifts for Nonna: " + gifts.join(", "));
    if (saved.popPoints) lines.push("Pop points: " + saved.popPoints);
    if (saved.andarePlayed || saved.andareBest) {
      lines.push("Andare Catch best: " + (saved.andareBest || 0));
    }
    if (saved.timePlayed || saved.timeBest) {
      lines.push("Time Catch best: " + (saved.timeBest || 0));
    }
    return lines.join("\n");
  }

  function setCopyGate(copied) {
    state.copied = !!copied;
    var screen = $("screen-choice");
    if (screen) screen.classList.toggle("is-locked", !state.copied);
    COPY_GATE.forEach(function (id) {
      var button = $(id);
      if (!button) return;
      button.disabled = !state.copied;
      button.setAttribute("aria-disabled", state.copied ? "false" : "true");
    });
    var gate = $("copy-gate-line");
    if (gate) gate.hidden = !!state.copied;
    var copyBtn = $("copy-all-btn");
    if (copyBtn) {
      copyBtn.textContent = state.copied ? "Copied ✓ — paste in Classroom" : "Copy all";
      copyBtn.classList.toggle("is-done", !!state.copied);
    }
  }

  function fallbackCopy(text) {
    var box = $("copy-all-text");
    box.value = text;
    box.focus();
    box.select();
    try {
      return document.execCommand("copy");
    } catch (err) {
      return false;
    }
  }

  var toastTimer = 0;

  function showToast(message) {
    var toast = $("toast");
    toast.textContent = message;
    toast.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.hidden = true;
    }, 2800);
  }

  function onCopyAll() {
    var text = buildClassroomText();
    $("copy-all-text").value = text;
    var finish = function (ok) {
      if (ok) {
        setCopyGate(true);
        $("copy-fallback").classList.remove("is-hot");
        showToast("Copied! Now paste it into Google Classroom.");
        announce("Copied. Now paste it into Google Classroom.");
        return;
      }
      var box = $("copy-all-text");
      box.focus();
      try {
        box.select();
      } catch (err) {
        /* ignore */
      }
      $("copy-fallback").classList.add("is-hot");
      showToast("Select the box, then copy it.");
      announce("Copy did not stick. Select the box and copy it.");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          finish(true);
        },
        function () {
          finish(fallbackCopy(text));
        }
      );
      return;
    }
    finish(fallbackCopy(text));
  }

  function openChoice(speakLine) {
    var fresh = !state.savedCall;
    if (fresh) {
      state.copied = false;
      state.savedCall = true;
      stopTimer();
      invalidateListen();
      var profile = load();
      profile.callsCompleted = (profile.callsCompleted || 0) + 1;
      if (state.callStars > (profile.bestStars || 0)) profile.bestStars = state.callStars;
      profile.catchUnlocked = true;
      save(profile);
    }
    state.returnTo = "choice";
    showScreen("choice");
    if (speakLine) {
      say(NONNA_SCRIPT.choiceLine);
      announce(fresh ? "Copy all, then paste in Google Classroom." : "Back to the end of the call.");
    }
  }

  function priceText(gift) {
    var parts = [];
    if (gift.lemons) parts.push(gift.lemons + " 🍋");
    if (gift.shells) parts.push(gift.shells + " 🐚");
    return parts.join(" + ");
  }

  function renderShop() {
    var profile = load();
    $("shop-balance").textContent = "In the jar: 🍋 " + (profile.lemons || 0) + " · 🐚 " + (profile.shells || 0);
    var list = $("shop-list");
    list.replaceChildren();
    NONNA_SCRIPT.gifts.forEach(function (gift) {
      var owned = !!(profile.gifts && profile.gifts[gift.id]);
      var afford = (profile.lemons || 0) >= gift.lemons && (profile.shells || 0) >= gift.shells;
      var card = document.createElement("article");
      card.className = "gift" + (owned ? " is-owned" : "");
      var emoji = document.createElement("div");
      emoji.className = "gift-emoji";
      emoji.textContent = gift.emoji;
      var copy = document.createElement("div");
      var title = document.createElement("h3");
      title.textContent = gift.name;
      var en = document.createElement("p");
      en.textContent = gift.en;
      var cost = document.createElement("p");
      cost.className = "gift-cost";
      cost.textContent = owned ? "On her table" : priceText(gift);
      copy.append(title, en, cost);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "buy";
      if (owned) {
        button.textContent = "Hers";
        button.disabled = true;
      } else if (!afford) {
        button.textContent = "Need more";
        button.disabled = true;
      } else {
        button.textContent = "Buy";
        button.addEventListener("click", function () {
          buyGift(gift);
        });
      }
      card.append(emoji, copy, button);
      list.appendChild(card);
    });
    paintJar("choice-scene");
    paintJar("home-scene");
  }

  function buyGift(gift) {
    var profile = load();
    if (profile.gifts[gift.id]) return;
    if ((profile.lemons || 0) < gift.lemons || (profile.shells || 0) < gift.shells) return;
    profile.lemons -= gift.lemons;
    profile.shells -= gift.shells;
    profile.gifts[gift.id] = true;
    save(profile);
    $("shop-note").hidden = false;
    $("shop-note").textContent = "Nonna has the " + gift.name.toLowerCase() + ". Grazie!";
    chime();
    say(NONNA_SCRIPT.giftLine);
    renderShop();
    announce(NONNA_SCRIPT.giftLine);
  }

  function openPop() {
    state.returnTo = state.screen === "home" ? "home" : "choice";
    state.popSession = 0;
    showScreen("pop");
    var profile = load();
    var field = $("pop-field");
    field.replaceChildren();
    var count = profile.lemons || 0;
    $("pop-empty").hidden = count > 0;
    $("pop-score").textContent = "0";
    $("pop-left").textContent = count
      ? count + (count === 1 ? " lemon" : " lemons") + " · tap to burst · 5 points each"
      : "The jar has no lemons yet.";
    var shown = Math.min(count, 16);
    for (var i = 0; i < shown; i++) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "pop-lemon";
      button.textContent = "🍋";
      button.setAttribute("aria-label", "Burst a lemon");
      button.style.left = 6 + Math.random() * 68 + "%";
      button.style.top = 6 + Math.random() * 68 + "%";
      button.style.animationDelay = -Math.random() * 2 + "s";
      button.addEventListener("click", function (event) {
        burstLemon(event.currentTarget);
      });
      field.appendChild(button);
    }
  }

  function burstLemon(button) {
    if (!button || button.classList.contains("burst")) return;
    var profile = load();
    if ((profile.lemons || 0) < 1) return;
    profile.lemons -= 1;
    profile.popPoints = (profile.popPoints || 0) + 5;
    save(profile);
    state.popSession += 5;
    button.classList.add("burst");
    tone(620, 0.08, 0.04);
    tone(880, 0.1, 0.03, 0.05);
    $("pop-score").textContent = String(state.popSession);
    $("pop-left").textContent =
      (profile.lemons || 0) +
      " left in the jar · " +
      state.popSession +
      " this round · " +
      profile.popPoints +
      " points saved";
    if ((profile.lemons || 0) < 1) $("pop-empty").hidden = false;
    setTimeout(function () {
      button.remove();
    }, 260);
    paintJar("home-scene");
    paintJar("choice-scene");
  }

  function updateCatchHud() {
    if (!state.catch) return;
    $("catch-score").textContent = String(state.catch.score);
    var lives = state.catch.lives;
    $("catch-lives").textContent = "♥".repeat(Math.max(0, lives)) + "♡".repeat(Math.max(0, 3 - lives));
    var left = Math.max(0, state.catch.left);
    $("catch-time").textContent = "0:" + String(left).padStart(2, "0");
  }

  function placeBasket(clientX) {
    if (!state.catch) return;
    var rect = $("catch-field").getBoundingClientRect();
    if (!rect.width) return;
    var x = clientX - rect.left;
    var half = state.catch.basketHalf || 56;
    x = Math.max(half + 4, Math.min(rect.width - half - 4, x));
    state.catch.basketX = x;
    $("basket").style.left = x + "px";
  }

  function clearFalling() {
    document.querySelectorAll("#catch-field .fall-word").forEach(function (node) {
      node.remove();
    });
  }

  function stopCatchLoop() {
    if (!state.catch) return;
    state.catch.running = false;
    if (state.catch.raf) cancelAnimationFrame(state.catch.raf);
    if (state.catch.tick) clearInterval(state.catch.tick);
    state.catch.raf = 0;
    state.catch.tick = 0;
  }

  function spawnWord() {
    var field = $("catch-field");
    var pack = state.catch.pack;
    var good = Math.random() < pack.goodRate;
    var pool = good ? pack.good : pack.bad;
    var item = pool[Math.floor(Math.random() * pool.length)];
    var el = document.createElement("div");
    el.className = "fall-word";
    el.lang = "it";
    el.textContent = item.t;
    field.appendChild(el);
    var w = el.offsetWidth || 96;
    var maxX = Math.max(8, field.clientWidth - w - 8);
    var x = 8 + Math.random() * maxX;
    el.style.left = x + "px";
    el.style.top = "-48px";
    state.catch.words.push({
      el: el,
      x: x,
      y: -48,
      w: w,
      h: el.offsetHeight || 40,
      good: good,
      text: item.t,
      en: item.en,
      speed: state.catch.speed
    });
  }

  function catchFrame(now) {
    var game = state.catch;
    if (!game || !game.running) return;
    var dt = Math.min(0.05, (now - game.last) / 1000);
    game.last = now;
    game.elapsed += dt;
    game.speed = Math.min(220, 96 + game.elapsed * 3.4);
    game.spawnIn -= dt;
    if (game.spawnIn <= 0 && game.words.length < 5) {
      spawnWord();
      game.spawnIn = Math.max(0.52, 1.12 - game.elapsed * 0.012);
    }
    var field = $("catch-field");
    var height = field.clientHeight;
    var basketTop = height - 16 - 52;
    var bx = game.basketX;
    for (var i = game.words.length - 1; i >= 0; i--) {
      var word = game.words[i];
      word.y += word.speed * dt;
      word.el.style.top = word.y + "px";
      var center = word.x + word.w / 2;
      var half = game.basketHalf || 56;
      var caught = word.y + word.h >= basketTop && word.y <= basketTop + 28 && Math.abs(center - bx) < half + word.w * 0.2;
      if (caught) {
        word.el.remove();
        game.words.splice(i, 1);
        if (word.good) {
          game.score += 10;
          game.caught += 1;
          tone(660, 0.07, 0.03);
          announce("Caught " + word.text + ", " + word.en);
        } else {
          game.lives -= 1;
          soft();
          announce(word.text + ". " + game.pack.badLine);
        }
        updateCatchHud();
        if (game.lives <= 0) {
          endCatch("lives");
          return;
        }
        continue;
      }
      if (word.y > height) {
        word.el.remove();
        game.words.splice(i, 1);
        if (word.good) {
          game.lives -= 1;
          soft();
          updateCatchHud();
          if (game.lives <= 0) {
            endCatch("lives");
            return;
          }
        }
      }
    }
    game.raf = requestAnimationFrame(catchFrame);
  }

  function endCatch(reason) {
    if (!state.catch || !state.catch.running) return;
    stopCatchLoop();
    clearFalling();
    var game = state.catch;
    var pack = game.pack;
    var profile = load();
    var prev = profile[pack.bestKey] || 0;
    var best = Math.max(prev, game.score);
    var fresh = game.score > prev && game.score > 0;
    profile[pack.bestKey] = best;
    profile[pack.playedKey] = (profile[pack.playedKey] || 0) + 1;
    save(profile);
    $("catch-over-title").textContent = reason === "time" ? "Time’s up." : pack.badTitle;
    $("catch-over-body").textContent =
      "Score " +
      game.score +
      " · " +
      game.caught +
      " caught · best " +
      best +
      (fresh ? " · new best" : "");
    $("catch-over").hidden = false;
    updateCatchHud();
  }

  function startCatch() {
    stopCatchLoop();
    clearFalling();
    $("catch-over").hidden = true;
    var field = $("catch-field");
    var rect = field.getBoundingClientRect();
    var pack = CATCHES[state.catchMode] || CATCHES.andare;
    var basket = $("basket");
    basket.classList.toggle("is-wide", !!pack.wide);
    basket.innerHTML = pack.basket;
    $("catch-title").textContent = pack.title;
    $("catch-legend").textContent = pack.legend;
    state.catch = {
      mode: pack.id,
      pack: pack,
      score: 0,
      lives: 3,
      left: 35,
      running: true,
      words: [],
      speed: 96,
      spawnIn: 0.15,
      elapsed: 0,
      last: performance.now(),
      caught: 0,
      basketHalf: pack.wide ? 66 : 56,
      basketX: rect.width / 2 || 160,
      raf: 0,
      tick: 0
    };
    placeBasket(rect.left + (rect.width / 2 || 160));
    updateCatchHud();
    state.catch.tick = setInterval(function () {
      if (!state.catch || !state.catch.running) return;
      state.catch.left -= 1;
      updateCatchHud();
      if (state.catch.left <= 0) endCatch("time");
    }, 1000);
    state.catch.raf = requestAnimationFrame(catchFrame);
  }

  function openCatch(from, mode) {
    state.returnTo = from || "choice";
    state.catchMode = mode || "andare";
    showScreen("catch");
    requestAnimationFrame(function () {
      startCatch();
    });
  }

  function goBackFromMini() {
    var dest = state.returnTo === "home" ? "home" : "choice";
    showScreen(dest);
  }

  function beginCall() {
    stopRing();
    audio();
    var profile = load();
    state.name = profile.name || "Arianna";
    state.callStars = 0;
    state.callLemons = 0;
    state.callShells = 0;
    state.recap = [];
    state.streak = 0;
    state.savedCall = false;
    state.copied = false;
    state.micBlocked = false;
    state.anyTaught = false;
    state.anySlip = false;
    state.inputMode = profile.inputMode === "speak" && NonnaSpeech.supported() ? "speak" : "tap";
    if (!NonnaSpeech.supported()) state.inputMode = "tap";
    state.index = 0;
    $("call-stars").textContent = "0";
    $("self-pip").querySelector("span").textContent = initial(state.name);
    showScreen("call");
    setSceneMood("call-scene", "smile");
    paintJar("call-scene");
    startTimer();
    startTurn();
  }

  function hangUp() {
    if ($("leave-dialog").open) $("leave-dialog").close();
    stopRing();
    stopTimer();
    invalidateListen();
    NonnaSpeech.cancel();
    showScreen("home");
  }

  function onEndRequest() {
    var earned = state.callStars + state.callLemons + state.callShells;
    $("leave-body").textContent = earned
      ? "Lemons, shells, and stars you've already earned stay on this phone."
      : "You can call her again whenever you like.";
    if (!$("leave-dialog").open) $("leave-dialog").showModal();
  }

  function onCallSubmit(event) {
    event.preventDefault();
    var profile = load();
    if (!$("name-wrap").hidden) {
      profile.name = cleanName($("name-input").value);
      profile.named = true;
    } else if (!profile.name) {
      profile.name = "Arianna";
      profile.named = true;
    }
    profile.inputMode = state.inputMode;
    profile.muted = state.muted;
    save(profile);
    state.name = profile.name;
    showScreen("ring");
    setSceneMood("ring-scene", "smile");
    startRing();
  }

  function bind() {
    $("home-form").addEventListener("submit", onCallSubmit);
    $("change-name").addEventListener("click", function () {
      var profile = load();
      $("name-wrap").hidden = false;
      $("greet-line").hidden = true;
      $("change-name").hidden = true;
      $("name-input").value = profile.name || "";
      $("name-input").focus();
    });
    $("mode-speak").addEventListener("click", function () {
      if (!NonnaSpeech.supported()) return;
      state.inputMode = "speak";
      syncModeButtons();
    });
    $("mode-tap").addEventListener("click", function () {
      state.inputMode = "tap";
      syncModeButtons();
    });
    $("andare-home-btn").addEventListener("click", function () {
      openCatch("home", "andare");
    });
    $("time-home-btn").addEventListener("click", function () {
      openCatch("home", "time");
    });
    $("decline-btn").addEventListener("click", hangUp);
    $("answer-btn").addEventListener("click", beginCall);
    $("again-btn").addEventListener("click", function () {
      showScreen("ring");
      setSceneMood("ring-scene", "smile");
      startRing();
    });
    $("home-btn").addEventListener("click", hangUp);
    $("copy-all-btn").addEventListener("click", onCopyAll);
    $("end-btn").addEventListener("click", onEndRequest);
    $("stay-btn").addEventListener("click", function () {
      $("leave-dialog").close();
    });
    $("leave-btn").addEventListener("click", hangUp);
    $("mute-btn").addEventListener("click", function () {
      state.muted = !state.muted;
      var profile = load();
      profile.muted = state.muted;
      save(profile);
      if (state.muted) {
        NonnaSpeech.cancel();
        stopRing();
      } else if (!$("screen-ring").hidden) startRing();
      renderMute();
    });
    $("mic-btn").addEventListener("click", onMic);
    $("hear-btn").addEventListener("click", onHear);
    $("switch-btn").addEventListener("click", onSwitch);
    $("next-btn").addEventListener("click", onNext);
    $("shop-btn").addEventListener("click", function () {
      state.returnTo = "choice";
      $("shop-note").hidden = true;
      showScreen("shop");
    });
    $("pop-btn").addEventListener("click", openPop);
    $("andare-play-btn").addEventListener("click", function () {
      openCatch("choice", "andare");
    });
    $("time-play-btn").addEventListener("click", function () {
      openCatch("choice", "time");
    });
    $("shop-back").addEventListener("click", goBackFromMini);
    $("pop-back").addEventListener("click", goBackFromMini);
    $("pop-done").addEventListener("click", goBackFromMini);
    $("catch-back").addEventListener("click", goBackFromMini);
    $("catch-over-back").addEventListener("click", goBackFromMini);
    $("catch-again").addEventListener("click", startCatch);
    var field = $("catch-field");
    var move = function (event) {
      if (!state.catch || !state.catch.running) return;
      if (event.pointerType === "mouse" && event.buttons === 0 && event.type === "pointermove") {
        placeBasket(event.clientX);
        return;
      }
      placeBasket(event.clientX);
    };
    field.addEventListener("pointerdown", function (event) {
      try {
        field.setPointerCapture(event.pointerId);
      } catch (err) {
        /* ignore */
      }
      move(event);
    });
    field.addEventListener("pointermove", move);
    document.addEventListener("keydown", function (event) {
      if (event.target && event.target.matches && event.target.matches("input, textarea")) return;
      if (state.screen === "catch" && state.catch && state.catch.running) {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          var rect = $("catch-field").getBoundingClientRect();
          var delta = event.key === "ArrowLeft" ? -28 : 28;
          placeBasket(rect.left + state.catch.basketX + delta);
        }
      }
      if (event.key === "Enter" && !$("next-btn").hidden && state.screen === "call") {
        onNext();
        return;
      }
      if ((state.phase === "answer" || state.phase === "teach") && !$("chips").hidden) {
        var n = Number(event.key);
        if (n >= 1 && n <= 9) {
          var buttons = $("chips").querySelectorAll("button");
          if (buttons[n - 1] && !buttons[n - 1].disabled) buttons[n - 1].click();
        }
      }
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stopRing();
        if (state.catch && state.catch.running) stopCatchLoop();
      } else if (!$("screen-ring").hidden && !state.muted) startRing();
    });
  }

  function boot() {
    mountScene("home-scene");
    mountScene("ring-scene");
    mountScene("call-scene");
    mountScene("choice-scene");
    paintJar("home-scene");
    paintJar("ring-scene");
    paintJar("call-scene");
    paintJar("choice-scene");
    var profile = load();
    state.muted = !!profile.muted;
    if (profile.inputMode === "speak" || profile.inputMode === "tap") state.inputMode = profile.inputMode;
    else state.inputMode = "tap";
    if (!NonnaSpeech.supported()) state.inputMode = "tap";
    renderMute();
    renderWordList();
    renderHome();
    bind();
    NonnaSpeech.prime();
    showScreen("home");
  }

  boot();
})();
