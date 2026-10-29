/* Nonna's voice: recorded Italian clips first, Web Speech only if a clip is missing.
   Clips are a warm female Italian neural voice (Elsa), a little slower. */
(function (root) {
  "use strict";

  var CLIPS = {};

  function clipKey(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[’‘ʼ]/g, "'")
      .replace(/[^a-zàèéìòóù']+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* Small pool. iOS breaks one Audio element after many src swaps (~turn 15). */
  var POOL = 4;
  var pool = [];
  var poolIndex = 0;
  var active = null;
  var warmed = {};

  function makeAudio() {
    var audio = new Audio();
    audio.preload = "auto";
    audio.setAttribute("playsinline", "");
    audio.playsInline = true;
    return audio;
  }

  function takeAudio() {
    if (pool.length < POOL) {
      var created = makeAudio();
      pool.push(created);
      return created;
    }
    poolIndex = (poolIndex + 1) % pool.length;
    return pool[poolIndex];
  }

  function resetAudio(audio) {
    if (!audio) return;
    try {
      audio.pause();
    } catch (err) {
      /* ignore */
    }
    try {
      audio.removeAttribute("src");
      audio.src = "";
      audio.load();
    } catch (err) {
      /* ignore */
    }
  }

  function stopAudio() {
    if (!active) return;
    var current = active;
    active = null;
    resetAudio(current);
  }

  function preload(urls) {
    (urls || []).forEach(function (url) {
      if (!url || warmed[url]) return;
      warmed[url] = true;
      try {
        var audio = new Audio();
        audio.preload = "auto";
        audio.src = url;
        audio.load();
      } catch (err) {
        /* ignore */
      }
    });
  }

  function urlFor(text) {
    return CLIPS[clipKey(text)] || "";
  }

  function supported() {
    return !!(root.SpeechRecognition || root.webkitSpeechRecognition);
  }

  function prime() {
    try {
      if (root.speechSynthesis) root.speechSynthesis.getVoices();
    } catch (err) {
      /* ignore */
    }
  }

  function pickVoice() {
    if (!root.speechSynthesis) return null;
    var voices = [];
    try {
      voices = root.speechSynthesis.getVoices() || [];
    } catch (err) {
      return null;
    }
    var italian = voices.filter(function (voice) {
      return /^it([-_]|$)/i.test(voice.lang || "");
    });
    var female = italian.filter(function (voice) {
      return !/diego|luca|paolo|giorgio|cosimo|marco|matteo|giuseppe|carlo|enrico|piero|davide|eddy/i.test(voice.name || "");
    });
    var pool = female.length ? female : italian;
    var preferred = pool.find(function (voice) {
      return /elsa|isabella|alice|alessia|elena|silvia|paola|chiara|francesca|federica|emma|flo/i.test(voice.name || "");
    });
    return preferred || pool[0] || null;
  }

  var token = 0;
  var queue = [];
  var pumping = false;

  function cancel() {
    token += 1;
    queue.length = 0;
    pumping = false;
    stopAudio();
    try {
      if (root.speechSynthesis) root.speechSynthesis.cancel();
    } catch (err) {
      /* ignore */
    }
  }

  function playClip(url, myToken) {
    return new Promise(function (resolve) {
      if (!url || myToken !== token) {
        resolve("skipped");
        return;
      }
      var audio = takeAudio();
      resetAudio(audio);
      active = audio;
      var settled = false;
      var playAttempts = 0;
      var startedOk = false;

      function cleanup() {
        audio.removeEventListener("ended", onEnd);
        audio.removeEventListener("error", onErr);
        audio.removeEventListener("canplay", onCan);
      }

      function finish(status) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        if (active === audio) active = null;
        resolve(status);
      }

      function tryPlay() {
        if (settled || myToken !== token) {
          finish("skipped");
          return;
        }
        if (playAttempts >= 2) {
          finish("failed");
          return;
        }
        playAttempts += 1;
        var started;
        try {
          started = audio.play();
        } catch (err) {
          if (playAttempts >= 2) finish("failed");
          return;
        }
        if (started && started.then) {
          started.then(
            function () {
              startedOk = true;
            },
            function () {
              if (settled) return;
              if (audio.readyState >= 2 || playAttempts >= 2) finish("failed");
            }
          );
        } else {
          startedOk = true;
        }
      }

      function onCan() {
        if (!startedOk && playAttempts < 2) tryPlay();
      }

      function onEnd() {
        finish(myToken === token ? "played" : "skipped");
      }

      function onErr() {
        finish("failed");
      }

      var timer = setTimeout(function () {
        finish(startedOk && myToken === token ? "played" : "failed");
      }, 12000);

      audio.addEventListener("ended", onEnd);
      audio.addEventListener("error", onErr);
      audio.addEventListener("canplay", onCan);
      audio.src = url;
      try {
        audio.load();
      } catch (err) {
        /* ignore */
      }
      tryPlay();
    });
  }

  function utter(text, myToken) {
    return new Promise(function (resolve) {
      if (!root.speechSynthesis || !text || myToken !== token) {
        resolve();
        return;
      }
      var settled = false;
      var done = function () {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      };
      var utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "it-IT";
      utterance.rate = 0.86;
      utterance.pitch = 0.84;
      var voice = pickVoice();
      if (voice) utterance.voice = voice;
      utterance.onend = done;
      utterance.onerror = done;
      var timer = setTimeout(done, Math.min(9000, 1600 + text.length * 70));
      try {
        root.speechSynthesis.resume();
        root.speechSynthesis.speak(utterance);
      } catch (err) {
        done();
      }
    });
  }

  function speakOne(text, myToken) {
    var url = CLIPS[clipKey(text)];
    if (!url) return utter(text, myToken);
    try {
      if (root.speechSynthesis) root.speechSynthesis.cancel();
    } catch (err) {
      /* a mapped line never uses the computer voice */
    }
    return playClip(url, myToken).then(function (status) {
      if (status === "failed" && myToken === token) return playClip(url, myToken);
    });
  }

  function pump() {
    if (pumping) return;
    var item = queue[0];
    if (!item) return;
    if (item.token !== token) {
      queue.shift();
      item.resolve();
      pump();
      return;
    }
    pumping = true;
    speakOne(item.text, item.token).then(function () {
      pumping = false;
      if (queue[0] === item) queue.shift();
      item.resolve();
      pump();
    });
  }

  function speak(text) {
    if (!text) return Promise.resolve();
    return new Promise(function (resolve) {
      queue.push({ text: text, resolve: resolve, token: token });
      pump();
    });
  }

  function listen(handlers) {
    var Ctor = root.SpeechRecognition || root.webkitSpeechRecognition;
    if (!Ctor) {
      handlers.onError && handlers.onError("unsupported");
      return { stop: function () {}, abort: function () {} };
    }

    var dead = false;
    var rec = null;
    var settled = false;
    var finish = function (fn) {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      fn();
    };

    var wasSpeaking = !!(
      (root.speechSynthesis && root.speechSynthesis.speaking) ||
      (active && !active.paused)
    );
    cancel();

    var watchdog = setTimeout(function () {
      try {
        if (rec) rec.abort();
      } catch (err) {
        /* ignore */
      }
      finish(function () {
        handlers.onError && handlers.onError("timeout");
      });
    }, 12000);

    var startTimer = setTimeout(function () {
      if (dead) return;
      rec = new Ctor();
      rec.lang = "it-IT";
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 5;

      rec.onresult = function (event) {
        var interim = "";
        var finalText = "";
        var alts = [];
        for (var i = event.resultIndex; i < event.results.length; i++) {
          var result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
            for (var j = 0; j < result.length; j++) alts.push(result[j].transcript);
          } else {
            interim += result[0].transcript;
          }
        }
        if (interim && handlers.onPartial) handlers.onPartial(interim);
        if (finalText && handlers.onFinal) handlers.onFinal(finalText, alts);
      };

      rec.onerror = function (event) {
        var code = (event && event.error) || "error";
        if (code === "aborted") {
          finish(function () {});
          return;
        }
        finish(function () {
          handlers.onError && handlers.onError(code);
        });
      };

      rec.onend = function () {
        finish(function () {
          handlers.onEnd && handlers.onEnd();
        });
      };

      try {
        rec.start();
      } catch (err) {
        finish(function () {
          handlers.onError && handlers.onError("start");
        });
      }
    }, wasSpeaking ? 180 : 40);

    return {
      stop: function () {
        dead = true;
        clearTimeout(startTimer);
        try {
          if (rec) rec.stop();
        } catch (err) {
          /* ignore */
        }
      },
      abort: function () {
        dead = true;
        clearTimeout(startTimer);
        clearTimeout(watchdog);
        settled = true;
        try {
          if (rec) rec.abort();
        } catch (err) {
          /* ignore */
        }
      }
    };
  }

  if (root.speechSynthesis) {
    try {
      root.speechSynthesis.addEventListener("voiceschanged", prime);
    } catch (err) {
      /* ignore */
    }
  }

  function setClips(map) {
    CLIPS = map || {};
  }

  root.NonnaSpeech = {
    supported: supported,
    prime: prime,
    speak: speak,
    cancel: cancel,
    listen: listen,
    clipKey: clipKey,
    setClips: setClips,
    preload: preload,
    urlFor: urlFor,
    clips: function () {
      return CLIPS;
    }
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
