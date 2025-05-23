# Database Schema

## Lokale Database
Gebruik JSON-bestanden in een `data/` map voor permanente opslag. Gebruik `localStorage` voor tijdelijke speldata (bijv. huidige sessie).

## JSON-bestanden
- **users.json**: Ouderaccounts.
  - Formaat: `[{ id: string, email: string, password: string }, ...]`
- **word_lists.json**: Woordlijsten.
  - Formaat: `[{ id: string, user_id: string, name: string }, ...]`
- **words.json**: Woorden.
  - Formaat: `[{ id: string, list_id: string, word: string, explanation: string }, ...]`
  - **explanation**: Optioneel veld voor handmatige uitleg.
- **practice_sessions.json**: Sessies.
  - Formaat: `[{ id: string, user_id: string, start_time: string, duration: number }, ...]`
- **spelling_attempts.json**: Pogingen.
  - Formaat: `[{ id: string, session_id: string, word_id: string, input: string, correct: boolean }, ...]`
- **points.json**: Punten.
  - Formaat: `[{ id: string, user_id: string, total_points: number, activity_type: string, amount: number, timestamp: string }, ...]`
- **special_practice_list.json**: Speciale lijst.
  - Formaat: `[{ id: string, word_id: string, user_id: string, mistake_count: number, correct_streak: number, last_practiced: string }, ...]`
- **settings.json**: Punteninstellingen.
  - Formaat: `[{ id: string, user_id: string, correct_word_points: number, perfect_list_points: number, streak_points: number, time_points: number, time_threshold: number }, ...]`

## localStorage
- **current_session**: Huidige spelsessie (JSON-object met sessie-ID, starttijd, etc.).
- **temp_points**: Tijdelijke punten tijdens een sessie.
- **user_id**: ID van de ingelogde gebruiker.

## Relaties
- `word_lists.user_id` verwijst naar `users.id`.
- `words.list_id` verwijst naar `word_lists.id`.
- `practice_sessions.user_id` verwijst naar `users.id`.
- `spelling_attempts.session_id` verwijst naar `practice_sessions.id`.
- `spelling_attempts.word_id` verwijst naar `words.id`.
- `points.user_id` verwijst naar `users.id`.
- `special_practice_list.word_id` verwijst naar `words.id`.
- `special_practice_list.user_id` verwijst naar `users.id`.
- `settings.user_id` verwijst naar `users.id`.

## Beheer
- Gebruik Next.js API-routes om JSON-bestanden te lezen/schrijven met Node.js `fs`.
- Initialiseer lege JSON-bestanden met standaardwaarden als ze niet bestaan.
- Synchroniseer `localStorage` met JSON-bestanden bij belangrijke acties (bijv. einde sessie).