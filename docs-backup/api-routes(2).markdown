# API Routes

- **GET /api/word-lists**: Haalt woordlijsten op voor de ingelogde ouder uit `word_lists.json`.
- **POST /api/word-lists**: Maakt een nieuwe woordlijst aan in `word_lists.json`.
- **PUT /api/word-lists/[id]**: Bewerk een woordlijst in `word_lists.json`.
- **DELETE /api/word-lists/[id]**: Verwijder een woordlijst uit `word_lists.json`.
- **POST /api/spelling-attempt**: Verstuur een spellingsantwoord en werk voortgang bij in `spelling_attempts.json`.
- **GET /api/points**: Haal totale punten en instellingen op uit `points.json` en `settings.json`.
- **POST /api/points-settings**: Pas punteninstellingen aan in `settings.json`.
- **GET /api/statistics**: Haal statistieken op uit `practice_sessions.json`, `spelling_attempts.json`, etc.
- **GET /api/special-practice-list**: Haal speciale oefenlijst op uit `special_practice_list.json`.
- **POST /api/generate-explanation**: Verstuur het correcte woord en de foute invoer naar de OpenAI API en retourneer een kindvriendelijke uitleg (optioneel).