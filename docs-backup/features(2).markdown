# Features

## Punten Systeem
- **Verdienen**: 
  - Goed woord: 10 punten (aanpasbaar).
  - Foutloze lijst: 50 punten (aanpasbaar).
  - Dagstreak: 20 punten per dag (aanpasbaar).
  - 15 minuten spelen: 30 punten (aanpasbaar).
- **Opslaan**: In `points.json`, totaal altijd zichtbaar in de UI. Tijdelijke punten in `localStorage`.
- **Aanpassen**: Via ouderportaal in `settings.json`.

## Speciale Oefenlijst
- Woorden met >2 fouten gaan naar `special_practice_list.json`.
- Bij oefenen vaker opgenomen in sessies.
- Na 5 dagen correcte antwoorden verwijderd uit de speciale lijst.

## Dagelijkse Streaks
- Controleer laatste speeldatum in `practice_sessions.json`.
- Verhoog streak bij opeenvolgende dagen, reset bij onderbreking.

## Oefentijd
- Start timer bij sessiebegin, sla op in `localStorage`.
- Geef punten na ingestelde tijd (standaard 15 minuten, aanpasbaar) en werk `points.json` bij.

## Uitleg
- Ouders kunnen uitleg toevoegen bij woorden in `words.json` (`explanation` veld).
- Toon bij fout via knop in een kindvriendelijke modal.

## Grafische Verbeteringen
- **Thema**: Gebruik een kindvriendelijk thema zoals ruimte (bijv. sterren, planeten, astronaut).
- **UI Componenten**: Gebruik DaisyUI voor kindvriendelijke knoppen, kaarten en modals.
- **Animaties**: Implementeer Framer Motion voor effecten zoals een ster die verschijnt bij een goed antwoord of een dansend karakter.
- **Illustraties**: Voeg sprites en achtergronden toe van itch.io of OpenGameArt (bijv. pixelart-ruimteschip).
- **Geluiden**: Gebruik Howler.js voor geluidseffecten zoals een "pling" bij een goed antwoord (optioneel).
- **Lettertypen**: Gebruik speelse lettertypen zoals Bubblegum Sans via Google Fonts.

## AI Uitleg Generator (Optioneel)
- Wanneer een speler een fout maakt, stuur het woord en de foute invoer naar de OpenAI API.
- Gebruik een prompt zoals: "Leg uit waarom '{word}' correct is en '{input}' fout, op een manier die een 11-jarige kan begrijpen."
- Toon de gegenereerde uitleg in het `ExplanationModal` component als alternatief voor handmatige uitleg.