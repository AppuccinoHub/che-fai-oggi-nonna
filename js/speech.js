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

  var player = null;

  function audioEl() {
    if (!player) {
      player = new Audio();
      player.preload = "auto";
      player.setAttribute("playsinline", "");
      player.playsInline = true;
    }
    return player;
  }

  function stopAudio() {
    if (!player) return;
    try {
      player.pause();
    } catch (err) {
      /* ignore */
    }
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
      var audio = audioEl();
      var settled = false;
      var finish = function (status) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        audio.removeEventListener("ended", onEnd);
        audio.removeEventListener("error", onErr);
        audio.removeEventListener("pause", onPause);
        resolve(status);
      };
      var onEnd = function () {
        finish(myToken === token ? "played" : "skipped");
      };
      var onErr = function () {
        finish("failed");
      };
      var onPause = function () {
        if (myToken !== token) finish("skipped");
      };
      var timer = setTimeout(function () {
        finish(myToken === token ? "played" : "skipped");
      }, 15000);
      audio.addEventListener("ended", onEnd);
      audio.addEventListener("error", onErr);
      audio.addEventListener("pause", onPause);
      audio.src = url;
      var started;
      try {
        started = audio.play();
      } catch (err) {
        finish("failed");
        return;
      }
      if (started && started.catch) {
        started.catch(function () {
          finish("failed");
        });
      }
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
    return playClip(url, myToken).then(function (status) {
      if (status === "failed" && myToken === token) return utter(text, myToken);
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
      (player && !player.paused)
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
    clips: function () {
      return CLIPS;
    }
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
