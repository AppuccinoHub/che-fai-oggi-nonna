/* Che fai oggi, Nonna? — call turns, then Shop / Pop / two catch games.
   Rhythm: a medium turn is always followed by an easy one. */
(function (root) {
  "use strict";

  function chip(t, en, role) {
    return { t: t, en: en, role: role || "need" };
  }

  var turns = [
    {
      id: "hello",
      level: "easy",
      kind: "hello",
      pill: "Ciao, Nonna!",
      english: "Say hi to Grandma.",
      why: "Ciao means hi. Nonna means Grandma.",
      beats: [
        {
          nonna: "Ciao, tesoro! Che fai oggi?",
          nonnaNamed: "Ciao, Arianna! Che fai oggi?",
          prompt: "Tap the chips in order.",
          english: "Say hi to Grandma.",
          say: "Ciao, Nonna!",
          phonetic: "CHOW, NON-nah",
          accept: ["ciao nonna", "ciao", "ciao ciao nonna"],
          order: ["Ciao", "Nonna"],
          straight: true,
          gentle: true,
          chips: [chip("Ciao", "hi"), chip("Nonna", "Grandma")],
          reply: "Ciao, tesoro! Sono a Monte di Procida.",
          replyEn: "Hi, darling. I'm in Monte di Procida."
        }
      ]
    },
    {
      id: "oggi-domani",
      level: "medium",
      kind: "time",
      pill: "Oggi, Nonna!",
      english: "Today, or tomorrow?",
      why: "Oggi means today. Domani means tomorrow. Adesso means now.",
      beats: [
        {
          nonna: "Io cucino oggi. Domani no. Oggi o domani?",
          prompt: "She cooks today. Build the answer.",
          english: "Today, Grandma.",
          say: "Oggi, Nonna!",
          phonetic: "OH-jee, NON-nah",
          accept: ["oggi nonna", "oggi", "nonna e oggi"],
          order: ["Oggi", "Nonna"],
          chips: [
            chip("Oggi", "today"),
            chip("Domani", "tomorrow", "extra"),
            chip("Adesso", "now", "extra"),
            chip("Nonna", "Grandma")
          ],
          reply: "Sì, oggi! Domani è un altro giorno.",
          replyEn: "Yes, today! Tomorrow is another day."
        }
      ]
    },
    {
      id: "flip-mangi",
      level: "easy",
      kind: "flip",
      pill: "mangi",
      english: "Watch -o flip to -i.",
      why: "Io ends in -o: mangio, I eat. Tu flips it to -i: mangi, you eat.",
      flip: {
        stem: "mang",
        fromEnd: "io",
        toStem: "mang",
        toEnd: "i",
        irregular: false,
        trap: "",
        badges: [
          { cls: "io", text: "io = -o" },
          { cls: "tu", text: "tu = -i" }
        ]
      },
      beats: [
        {
          nonna: "Io mangio. E tu? Tu mangi.",
          prompt: "Tap the tu form.",
          english: "Watch -o flip to -i.",
          say: "Mangi.",
          phonetic: "MAHN-jee",
          accept: ["mangi", "tu mangi"],
          order: ["mangi"],
          single: true,
          chips: [chip("mangio", "I eat", "extra"), chip("mangi", "you eat")],
          reply: "Brava. Io mangio, tu mangi.",
          replyEn: "I eat. You eat."
        }
      ]
    },
    {
      id: "pizza-build",
      level: "medium",
      kind: "build",
      pill: "Oggi mangi la pizza.",
      english: "Today you eat pizza.",
      why: "One chip flips the sentence. Mangio is I eat. Mangi is you eat.",
      beats: [
        {
          nonna: "Oggi mangio la pizza.",
          prompt: "Build her sentence.",
          english: "Today I eat pizza.",
          say: "Oggi mangio la pizza.",
          phonetic: "OH-jee MAHN-joh lah PEET-sah",
          accept: ["oggi mangio la pizza", "mangio la pizza oggi", "io oggi mangio la pizza", "oggi io mangio la pizza"],
          order: ["Oggi", "mangio", "la pizza"],
          chips: [
            chip("Oggi", "today"),
            chip("mangio", "I eat"),
            chip("la pizza", "the pizza"),
            chip("domani", "tomorrow", "extra")
          ],
          reply: "Sì. Oggi mangio la pizza.",
          replyEn: "Yes. Today I eat pizza."
        },
        {
          nonna: "Ora tocca a te. Cambia una parola.",
          prompt: "One chip swapped. Build the new sentence.",
          english: "Today you eat pizza.",
          say: "Oggi mangi la pizza.",
          phonetic: "OH-jee MAHN-jee lah PEET-sah",
          accept: ["oggi mangi la pizza", "mangi la pizza oggi", "oggi tu mangi la pizza", "tu oggi mangi la pizza"],
          order: ["Oggi", "mangi", "la pizza"],
          was: "Oggi mangio la pizza.",
          swapFrom: "mangio",
          swapTo: "mangi",
          spark: "mangi",
          chips: [
            chip("Oggi", "today"),
            chip("mangi", "you eat"),
            chip("la pizza", "the pizza"),
            chip("mangio", "I eat", "extra")
          ],
          reply: "Sì! Oggi mangi la pizza.",
          replyEn: "Yes! Today you eat pizza."
        }
      ]
    },
    {
      id: "easy-mangi",
      level: "easy",
      kind: "easy",
      pill: "Tu mangi.",
      english: "You eat.",
      why: "Tu means you. The verb still ends in -i.",
      beats: [
        {
          nonna: "Facile facile. Tu mangi.",
          prompt: "Two chips. Tap them in order.",
          english: "You eat.",
          say: "Tu mangi.",
          phonetic: "too MAHN-jee",
          accept: ["tu mangi", "mangi"],
          order: ["Tu", "mangi"],
          straight: true,
          gentle: true,
          chips: [chip("Tu", "you"), chip("mangi", "you eat")],
          reply: "Esatto, tu mangi!",
          replyEn: "Exactly — you eat."
        }
      ]
    },
    {
      id: "flip-vai",
      level: "medium",
      kind: "flip",
      pill: "vai",
      english: "Andare is a surprise.",
      why: "Andare breaks the rule. Io is vado. Tu is vai, not vadi.",
      flip: {
        stem: "vad",
        fromEnd: "o",
        toStem: "va",
        toEnd: "i",
        irregular: true,
        trap: "vadi",
        badges: [
          { cls: "io", text: "io = vado" },
          { cls: "tu", text: "tu = vai" }
        ]
      },
      beats: [
        {
          nonna: "Io vado al mare. Tu vai. Non vadi: vai.",
          prompt: "Tap tu. It is not -i.",
          english: "Andare is a surprise.",
          say: "Vai.",
          phonetic: "VAH-ee",
          accept: ["vai", "tu vai"],
          order: ["vai"],
          single: true,
          chips: [
            chip("vado", "I go", "extra"),
            chip("vadi", "not a word", "extra"),
            chip("vai", "you go")
          ],
          reply: "Vai! Tu vai al mare.",
          replyEn: "You go — you go to the sea."
        }
      ]
    },
    {
      id: "easy-vai",
      level: "easy",
      kind: "easy",
      pill: "Domani vai.",
      english: "Tomorrow you go.",
      why: "Domani means tomorrow. Vai is you go.",
      beats: [
        {
          nonna: "Domani vai.",
          prompt: "Tap the chips in order.",
          english: "Tomorrow you go.",
          say: "Domani vai.",
          phonetic: "doh-MAH-nee VAH-ee",
          accept: ["domani vai", "vai domani", "tu domani vai"],
          order: ["Domani", "vai"],
          straight: true,
          gentle: true,
          chips: [chip("Domani", "tomorrow"), chip("vai", "you go")],
          reply: "Bene. Domani vai.",
          replyEn: "Good. Tomorrow you go."
        }
      ]
    },
    {
      id: "palestra",
      level: "medium",
      kind: "build",
      pill: "Domani vado in palestra.",
      english: "Tomorrow I go to the gym.",
      why: "Vado is I go. Fill in who: con Nonna, con amici, or con Zia. Vadi is not a word.",
      beats: [
        {
          nonna: "Domani vado in palestra. Con chi? Con Nonna.",
          prompt: "Build it. Who does she go with?",
          english: "Tomorrow I go to the gym with Grandma.",
          say: "Domani vado in palestra con Nonna.",
          phonetic: "doh-MAH-nee VAH-doh een pah-LESS-trah kon NON-nah",
          accept: [
            "domani vado in palestra con nonna",
            "vado in palestra con nonna domani",
            "domani io vado in palestra con nonna",
            "io domani vado in palestra con nonna"
          ],
          order: ["Domani", "vado", "in palestra", "con Nonna"],
          chips: [
            chip("Domani", "tomorrow"),
            chip("vado", "I go"),
            chip("in palestra", "to the gym"),
            chip("con Nonna", "with Grandma"),
            chip("con amici", "with friends", "extra"),
            chip("con Zia", "with Aunt", "extra"),
            chip("vadi", "not a word", "extra")
          ],
          reply: "Sì. Con Nonna.",
          replyEn: "Yes. With Grandma."
        },
        {
          nonna: "O con amici. Cambia chi.",
          prompt: "One chip swapped. Who now?",
          english: "Tomorrow I go to the gym with friends.",
          say: "Domani vado in palestra con amici.",
          phonetic: "doh-MAH-nee VAH-doh een pah-LESS-trah kon ah-MEE-chee",
          accept: [
            "domani vado in palestra con amici",
            "domani vado in palestra con gli amici",
            "vado in palestra con amici domani",
            "domani io vado in palestra con amici"
          ],
          order: ["Domani", "vado", "in palestra", "con amici"],
          was: "Domani vado in palestra con Nonna.",
          swapFrom: "con Nonna",
          swapTo: "con amici",
          spark: "con amici",
          chips: [
            chip("Domani", "tomorrow"),
            chip("vado", "I go"),
            chip("in palestra", "to the gym"),
            chip("con amici", "with friends"),
            chip("con Nonna", "with Grandma", "extra"),
            chip("con Zia", "with Aunt", "extra"),
            chip("vadi", "not a word", "extra")
          ],
          reply: "Bene, con amici!",
          replyEn: "Good — with friends."
        }
      ]
    },
    {
      id: "easy-vado",
      level: "easy",
      kind: "easy",
      pill: "Domani vado.",
      english: "Tomorrow I go.",
      why: "Vado means I go. Domani means tomorrow.",
      beats: [
        {
          nonna: "Facile. Domani vado.",
          prompt: "Tap the chips in order.",
          english: "Tomorrow I go.",
          say: "Domani vado.",
          phonetic: "doh-MAH-nee VAH-doh",
          accept: ["domani vado", "vado domani", "io domani vado", "domani io vado"],
          order: ["Domani", "vado"],
          straight: true,
          gentle: true,
          chips: [chip("Domani", "tomorrow"), chip("vado", "I go")],
          reply: "Esatto. Domani vado.",
          replyEn: "Exactly. Tomorrow I go."
        }
      ]
    },
    {
      id: "mare-vai",
      level: "medium",
      kind: "build",
      pill: "Oggi vai al mare.",
      english: "Today you go to the sea.",
      why: "Same trip, one chip. Vado is I go. Vai is you go. Not vadi.",
      beats: [
        {
          nonna: "Oggi vado al mare.",
          prompt: "Build her sentence.",
          english: "Today I go to the sea.",
          say: "Oggi vado al mare.",
          phonetic: "OH-jee VAH-doh ahl MAH-reh",
          accept: ["oggi vado al mare", "vado al mare oggi", "io oggi vado al mare", "oggi io vado al mare"],
          order: ["Oggi", "vado", "al mare"],
          chips: [
            chip("Oggi", "today"),
            chip("vado", "I go"),
            chip("al mare", "to the sea"),
            chip("vai", "you go", "extra"),
            chip("vadi", "not a word", "extra")
          ],
          reply: "Sì. Oggi vado al mare.",
          replyEn: "Yes. Today I go to the sea."
        },
        {
          nonna: "Ora tu. Non vado: vai.",
          prompt: "One chip swapped. You go.",
          english: "Today you go to the sea.",
          say: "Oggi vai al mare.",
          phonetic: "OH-jee VAH-ee ahl MAH-reh",
          accept: ["oggi vai al mare", "vai al mare oggi", "tu oggi vai al mare", "oggi tu vai al mare"],
          order: ["Oggi", "vai", "al mare"],
          was: "Oggi vado al mare.",
          swapFrom: "vado",
          swapTo: "vai",
          spark: "vai",
          chips: [
            chip("Oggi", "today"),
            chip("vai", "you go"),
            chip("al mare", "to the sea"),
            chip("vado", "I go", "extra"),
            chip("vadi", "not a word", "extra")
          ],
          reply: "Vai! Oggi vai al mare.",
          replyEn: "You go! Today you go to the sea."
        }
      ]
    },
    {
      id: "easy-tu-vai",
      level: "easy",
      kind: "easy",
      pill: "Tu vai.",
      english: "You go.",
      why: "Tu vai means you go. Andare does not become vadi.",
      beats: [
        {
          nonna: "Tu vai.",
          prompt: "Tap the chips in order.",
          english: "You go.",
          say: "Tu vai.",
          phonetic: "too VAH-ee",
          accept: ["tu vai", "vai"],
          order: ["Tu", "vai"],
          straight: true,
          gentle: true,
          chips: [chip("Tu", "you"), chip("vai", "you go")],
          reply: "Proprio così. Tu vai.",
          replyEn: "Just like that. You go."
        }
      ]
    },
    {
      id: "mare-build",
      level: "medium",
      kind: "build",
      pill: "Adesso guardi il mare.",
      english: "Now you watch the sea.",
      why: "Guardare follows the rule. Guardo becomes guardi, the same -o to -i as mangio, mangi.",
      beats: [
        {
          nonna: "Adesso guardo il mare.",
          prompt: "Build her sentence.",
          english: "Now I watch the sea.",
          say: "Adesso guardo il mare.",
          phonetic: "ah-DESS-soh GWAR-doh eel MAH-reh",
          accept: ["adesso guardo il mare", "guardo il mare adesso", "io adesso guardo il mare"],
          order: ["Adesso", "guardo", "il mare"],
          chips: [
            chip("Adesso", "now"),
            chip("guardo", "I watch"),
            chip("il mare", "the sea"),
            chip("oggi", "today", "extra")
          ],
          reply: "Sì. Adesso guardo il mare.",
          replyEn: "Yes. Now I watch the sea."
        },
        {
          nonna: "Ora tu. Guardo diventa guardi.",
          prompt: "One chip swapped. Build the new sentence.",
          english: "Now you watch the sea.",
          say: "Adesso guardi il mare.",
          phonetic: "ah-DESS-soh GWAR-dee eel MAH-reh",
          accept: ["adesso guardi il mare", "guardi il mare adesso", "tu adesso guardi il mare", "adesso tu guardi il mare"],
          order: ["Adesso", "guardi", "il mare"],
          was: "Adesso guardo il mare.",
          swapFrom: "guardo",
          swapTo: "guardi",
          spark: "guardi",
          chips: [
            chip("Adesso", "now"),
            chip("guardi", "you watch"),
            chip("il mare", "the sea"),
            chip("guardo", "I watch", "extra")
          ],
          reply: "Che bello. Tu guardi il mare.",
          replyEn: "How lovely. You watch the sea."
        }
      ]
    },
    {
      id: "easy-guardi",
      level: "easy",
      kind: "easy",
      pill: "Tu guardi.",
      english: "You watch.",
      why: "Tu guardi means you watch.",
      beats: [
        {
          nonna: "Tu guardi.",
          prompt: "Tap the chips in order.",
          english: "You watch.",
          say: "Tu guardi.",
          phonetic: "too GWAR-dee",
          accept: ["tu guardi", "guardi"],
          order: ["Tu", "guardi"],
          straight: true,
          gentle: true,
          chips: [chip("Tu", "you"), chip("guardi", "you watch")],
          reply: "Proprio così.",
          replyEn: "Just like that."
        }
      ]
    },
    {
      id: "recall",
      level: "medium",
      kind: "recall",
      pill: "Oggi mangi.",
      english: "Now she only asks.",
      why: "She asked in io. You answered in tu. Vado pairs with vai, never vadi. The gym can be with Nonna, amici, or Zia.",
      intro: "Adesso dimmi tu.",
      beats: [
        {
          nonna: "Che mangio oggi?",
          prompt: "Answer with tu. Today you eat.",
          english: "What do I eat today?",
          say: "Oggi mangi.",
          phonetic: "OH-jee MAHN-jee",
          accept: ["oggi mangi", "mangi oggi", "tu oggi mangi", "oggi tu mangi"],
          order: ["Oggi", "mangi"],
          chips: [
            chip("Oggi", "today"),
            chip("mangi", "you eat"),
            chip("mangio", "I eat", "extra"),
            chip("Domani", "tomorrow", "extra")
          ],
          reply: "Sì, oggi mangio!",
          replyEn: "Yes — today I eat."
        },
        {
          nonna: "E domani, che faccio?",
          prompt: "Answer with tu. Tomorrow you go.",
          english: "And tomorrow, what do I do?",
          say: "Domani vai.",
          phonetic: "doh-MAH-nee VAH-ee",
          accept: ["domani vai", "vai domani", "tu domani vai", "domani tu vai"],
          order: ["Domani", "vai"],
          chips: [
            chip("Domani", "tomorrow"),
            chip("vai", "you go"),
            chip("vado", "I go", "extra"),
            chip("Oggi", "today", "extra")
          ],
          reply: "Sì, domani vado!",
          replyEn: "Yes — tomorrow I go."
        },
        {
          nonna: "E in palestra, con chi vado?",
          prompt: "Answer with tu, and pick Zia.",
          english: "And the gym — who do I go with?",
          say: "Vai con Zia.",
          phonetic: "VAH-ee kon TSEE-ah",
          accept: ["vai con zia", "con zia", "tu vai con zia", "vai in palestra con zia", "tu vai in palestra con zia"],
          order: ["Vai", "con Zia"],
          chips: [
            chip("Vai", "you go"),
            chip("con Zia", "with Aunt"),
            chip("vado", "I go", "extra"),
            chip("vadi", "not a word", "extra"),
            chip("con Nonna", "with Grandma", "extra"),
            chip("con amici", "with friends", "extra")
          ],
          reply: "Sì, vado con Zia!",
          replyEn: "Yes — I go with Aunt."
        }
      ]
    },
    {
      id: "rebuild-day",
      level: "easy",
      kind: "rebuild",
      pill: "Domani mangi.",
      english: "Tomorrow you eat.",
      why: "Same tu verb. Only the day changed. Oggi is today. Domani is tomorrow.",
      beats: [
        {
          nonna: "Non oggi. Domani.",
          prompt: "One chip swapped. Build it.",
          english: "Tomorrow you eat.",
          say: "Domani mangi.",
          phonetic: "doh-MAH-nee MAHN-jee",
          accept: ["domani mangi", "mangi domani", "tu domani mangi"],
          order: ["Domani", "mangi"],
          was: "Oggi mangi.",
          swapFrom: "Oggi",
          swapTo: "Domani",
          spark: "Domani",
          straight: true,
          gentle: true,
          chips: [chip("Domani", "tomorrow"), chip("mangi", "you eat")],
          reply: "Domani mangi. Brava!",
          replyEn: "Tomorrow you eat. Lovely."
        }
      ]
    },
    {
      id: "easy-play",
      level: "easy",
      kind: "easy",
      pill: "Tu giochi.",
      english: "You drink. You play.",
      why: "Bere and giocare still flip. Bevo becomes bevi. Gioco becomes giochi.",
      beats: [
        {
          nonna: "Hai sete? Io bevo. Tu bevi.",
          prompt: "Tap the chips in order.",
          english: "You drink.",
          say: "Tu bevi.",
          phonetic: "too BEH-vee",
          accept: ["tu bevi", "bevi"],
          order: ["Tu", "bevi"],
          straight: true,
          gentle: true,
          chips: [chip("Tu", "you"), chip("bevi", "you drink")],
          reply: "Bene, bevi.",
          replyEn: "Good — you drink."
        },
        {
          nonna: "E dopo, io gioco. Tu giochi.",
          prompt: "Tap the chips in order.",
          english: "You play.",
          say: "Tu giochi.",
          phonetic: "too JOH-kee",
          accept: ["tu giochi", "giochi"],
          order: ["Tu", "giochi"],
          straight: true,
          gentle: true,
          chips: [chip("Tu", "you"), chip("giochi", "you play")],
          reply: "Bene, tu giochi!",
          replyEn: "Good, you play!"
        }
      ]
    },
    {
      id: "goodbye",
      level: "easy",
      kind: "goodbye",
      pill: "A domani!",
      english: "Say goodbye.",
      why: "A domani means see you tomorrow. Ciao works for hi and for bye.",
      beats: [
        {
          nonna: "Mi saluti? Ciao, Nonna, a domani!",
          prompt: "Tap the chips in order.",
          english: "Say goodbye.",
          say: "Ciao, Nonna! A domani!",
          phonetic: "CHOW, NON-nah! ah doh-MAH-nee",
          accept: ["ciao nonna a domani", "a domani nonna", "ciao a domani", "nonna a domani", "ciao nonna ci vediamo domani"],
          order: ["Ciao", "Nonna", "a domani"],
          straight: true,
          gentle: true,
          chips: [
            chip("Ciao", "bye"),
            chip("Nonna", "Grandma"),
            chip("a domani", "see you tomorrow")
          ],
          reply: "A domani, tesoro. Ti voglio bene.",
          replyEn: "See you tomorrow, darling. I love you."
        }
      ]
    }
  ];

  var gifts = [
    { id: "limoni", name: "Filo di limoni", en: "A string of lemons for her kitchen", lemons: 3, shells: 0, emoji: "🍋" },
    { id: "caffe", name: "Caffè", en: "A little coffee, the way she likes it", lemons: 2, shells: 0, emoji: "☕" },
    { id: "collana", name: "Collana di conchiglie", en: "A shell necklace from the beach", lemons: 0, shells: 4, emoji: "🐚" },
    { id: "cartolina", name: "Cartolina del mare", en: "A postcard of the sea", lemons: 1, shells: 2, emoji: "🌊" },
    { id: "fiori", name: "Fiori", en: "Flowers for the table", lemons: 2, shells: 2, emoji: "💐" },
    { id: "gelato", name: "Gelato", en: "Gelato to share after the call", lemons: 1, shells: 1, emoji: "🍨" }
  ];

  root.NONNA_SCRIPT = {
    turns: turns,
    gifts: gifts,
    nudges: [
      { it: "Quasi, tesoro.", en: "So close. Try once more." },
      { it: "Ci sei quasi.", en: "You're almost there." },
      { it: "Non proprio, amore.", en: "Not quite — have another go." }
    ],
    choiceLine: "Scegli, tesoro. Negozio, limoni, o gioco.",
    giftLine: "Che bel regalo. Grazie, tesoro.",
    peek: [
      ["oggi", "today"],
      ["domani", "tomorrow"],
      ["adesso", "now"],
      ["mangio → mangi", "I eat → you eat"],
      ["vado → vai", "I go → you go. Not vadi."],
      ["in palestra", "to the gym"],
      ["con Nonna / amici / Zia", "with Grandma, friends, or Aunt"],
      ["guardo → guardi", "I watch → you watch"],
      ["bevo → bevi", "I drink → you drink"],
      ["gioco → giochi", "I play → you play"]
    ]
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
