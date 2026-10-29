# Che fai oggi, Nonna?

A phone-first Italian call for Arianna. Nonna phones from Monte di Procida. It is a conversation about what you do today, not a stack of flashcards.

Open `index.html` on GitHub Pages from the repository root on `main` (https://appuccinohub.github.io/che-fai-oggi-nonna/). On a phone, add it to the home screen.

## The call

1. Nonna speaks a short line. Her voice is a recorded Italian MP3.
2. Every phrase is word chips: Italian on top, English underneath. Tap them in order, or speak the sentence.
3. A medium turn is always followed by an easy one.
4. Later she only asks. You answer. She replies.
5. Lemons, shells, and stars drop into the jar. Then you choose Shop, Pop, or Play.

Thirteen turns, in this order:

| | | Nonna | You build |
| --- | --- | --- | --- |
| 1 | easy | Ciao, Arianna! Che fai oggi? | Ciao, Nonna! |
| 2 | medium | Io cucino oggi. Domani no. Oggi o domani? | Oggi, Nonna! |
| 3 | easy | Io mangio. E tu? Tu mangi. | mangi — the -o flips to -i |
| 4 | medium | Oggi mangio la pizza. Then one chip swaps. | Oggi mangio la pizza. → Oggi mangi la pizza. |
| 5 | easy | Facile facile. Tu mangi. | Tu mangi. |
| 6 | medium | Io vado al mare. Tu vai. Non vadi: vai. | vai — andare does not take -i |
| 7 | easy | Domani vai. | Domani vai. |
| 8 | medium | Adesso guardo il mare. Then one chip swaps. | Adesso guardo il mare. → Adesso guardi il mare. |
| 9 | easy | Tu guardi. | Tu guardi. |
| 10 | medium | Che mangio oggi? / E domani, che faccio? | Oggi mangi. / Domani vai. |
| 11 | easy | Non oggi. Domani. | Oggi mangi. → Domani mangi. |
| 12 | easy | Io bevo. Tu bevi. / Io gioco. Tu giochi. | Tu bevi. / Tu giochi. |
| 13 | easy | Mi saluti? Ciao, Nonna, a domani! | Ciao, Nonna! A domani! |

The flip shows badges **io = -o** and **tu = -i**. Andare is the surprise: **vado → vai**, not vadi. Bere and giocare still flip: bevo → bevi, gioco → giochi.

First try is 3 stars, a miss then a hit is 2, and the shown phrase is 1. Three three-star turns in a row light a streak. An easy turn drops a shell. A medium turn drops a lemon.

## Shop, Pop, Play

After goodbye, three choices. All three stay on this phone.

**Shop** spends lemons and shells on one gift each for Nonna: a string of lemons, coffee, a shell necklace, a postcard of the sea, flowers, or gelato. Bought gifts stay on her table.

**Pop** bursts lemons out of the jar. Each lemon is 5 points. Shells stay. Points are saved.

**Play** unlocks Verb Catch. Tu forms fall (mangi, vai, guardi, bevi, giochi). Drag the basket and catch those. Let io forms, and vadi, fall past. Three lives, 35 seconds. The best score is saved. After the first finished call, Verb Catch is also on the home screen.

Speaking needs a normal https URL, or `localhost`. A plain `http://` address, or a page opened as a file, will not get the microphone. Tapping always works.

Everything is saved under `che-fai-oggi-nonna-v1`, separate from Che tempo fa, Nonna? and Cosa mangiamo, Nonna?

## Voice

Nonna’s lines are recorded Italian MP3s — Elsa, a warm female Italian neural voice, a little slower. The browser’s speech synthesizer is only a backup if a clip fails to load. Your answers use Italian speech recognition (`it-IT`) when you choose Speak it.

Her picture is the same illustrated portrait as the other Nonna calls. Nothing else is used for her face.
