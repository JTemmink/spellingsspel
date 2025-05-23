# Spelling Game Requirements

## Introduction
Dit is een spellingsspel voor kinderen van 11 jaar. Het moet leuk, spannend en grappig zijn, terwijl het helpt om spelling te oefenen.

## Core Gameplay
- **Woordlijsten**: Ouders kunnen lijsten met woorden aanmaken, bewerken en verwijderen in het ouderportaal.
- **Oefenen**: Het spel spreekt een woord uit, de speler typt het, en het spel houdt bij wat goed of fout is.
- **Uitleg**: Bij een fout verschijnt een knop voor een simpele, duidelijke uitleg geschikt voor een 11-jarige.
- **Voortgang**: Goed/fout antwoorden worden opgeslagen in lokale JSON-bestanden, ook na afsluiten van het spel.
- **Speciale Oefenlijst**: Woorden die vaak fout gaan, komen in een aparte lijst. Als ze meerdere keren goed zijn, verdwijnen ze na 5 dagen correcte antwoorden.

## Bonus Punten Systeem
- **Punten Verdienen**: 
  - Per goed gespeld woord.
  - Per foutloze lijst.
  - Per dag achtereenvolgens gespeeld (streak).
  - Per 15 minuten speeltijd.
- **Aanpasbaar**: Ouders kunnen puntenwaarden aanpassen in het ouderportaal.
- **Weergave**: Totaal aantal punten altijd zichtbaar, ook na herstart.

## Ouderportaal
- **Woordlijsten**: Aanmaken, bewerken, verwijderen.
- **Punten Beheer**: Punten per activiteit en totale punten aanpassen.
- **Statistieken**: 
  - Oefentijd (dag, week, maand, jaar).
  - Aantal goed/fout gespelde woorden.
  - Lijst van vaak fout gespelde woorden.
  - Totaal aantal punten.

## Technische Vereisten
- Web-based, draait in een browser.
- Lokale database met JSON-bestanden voor permanente opslag (gebruikers, woordlijsten, punten, etc.).
- Gebruik `localStorage` voor tijdelijke speldata (bijv. huidige sessie).
- AI voor uitspraak (Web Speech API) en mogelijk uitleg (OpenAI API).

## Ontwerp
- Leuk en aantrekkelijk voor kinderen: gebruik een thema zoals ruimte, met animaties, geluiden, heldere kleuren, en speelse lettertypen.
- Intuïtieve interface voor een 11-jarige, met grote knoppen en duidelijke instructies.
- Gebruik DaisyUI voor kindvriendelijke UI-componenten en Framer Motion voor animaties.
- Voeg illustraties toe van platforms zoals itch.io of OpenGameArt.
- Ouderportaal beveiligd met eenvoudige inlog (wachtwoord in JSON).

## AI Assistance (Optioneel)
- **Uitleg Generator**: Gebruik de OpenAI API om automatisch kindvriendelijke uitleg te genereren voor spellingsfouten.
- **Installatie**: Voer `npm install openai` uit om de OpenAI library te installeren.
- **Configuratie**: Verkrijg een API-sleutel van OpenAI en sla deze op in een `.env` bestand als `OPENAI_API_KEY=jouw_sleutel`.
- **Afbeeldingen Generator**: Gebruik externe tools zoals DALL-E of Stable Diffusion om afbeeldingen te maken, handmatig toe te voegen aan het project.

## Ontwikkelingsroadmap
1. Next.js project opzetten met Tailwind CSS, DaisyUI, en JSON-bestandsbeheer.
2. Lokale database structureren met JSON-bestanden.
3. Authenticatie voor ouderportaal (eenvoudig, met JSON).
4. Ouderportaal pagina’s bouwen.
5. Welkompagina maken met thema (bijv. ruimte).
6. Spellingsspel pagina ontwikkelen met animaties en illustraties.
7. Resultatenpagina toevoegen met visuele feedback.
8. Punten systeem integreren met badges.
9. Speciale oefenlijst logica toevoegen.
10. Animaties (Framer Motion) en geluiden (Howler.js) toevoegen.
11. AI uitleg generator integreren (optioneel).
12. Responsiviteit en toegankelijkheid verzekeren.
13. Testen en lokaal draaien.