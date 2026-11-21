# Cross-training (CA5) — notes de l'appli

- `index.html` autonome, couleur `#4D7C0F`, code d'appli `ct`. Charte commune : `../CLAUDE.md`.
- Bibliothèque : 20 exercices sans matériel × 3 niveaux (`BIBLIO_DEFAUT`) ; fiches modifiables en mode enseignant, publiées dans `bibliotheque.json` du dossier Drive.
- Vidéos : dossier Drive réglé par l'enseignant (propriété `CT_DOSSIER` du script commun). Noms reconnus : `N1.mp4`, `N2-2.mp4`, `N2_3.mp4`, `N2b.mp4`, `N2 (2).mp4`, sous-dossier `N2/…` ; 3 vidéos max par niveau.
- Script commun (`../apps-script/Code.gs`) : `GET ?ct=biblio` (fiches + liste), `GET ?ct=video&id=` (base64, pour le hors ligne), `POST {key, ct:{dossier|partager|fiches}}`.
- Hors ligne : vidéos dans IndexedDB `ct_videos` (bouton « Télécharger » de la Bibliothèque) ; lecture locale sinon lecteur Drive.
- Thèmes (version du livret, améliorée) : Renforcement 60-70 % FCM (circuit, EMOM ; 12-15 rép.), Mental 70-80 % (AMRAP à allure imposée, For Time), Cardio 80-90 % (intervalles 30/30 ou 40/20, EMOM, E2MOM ; FC relevée en fin de bloc).
- Leçons des élèves : locales à la tablette (`ct_lecons`), rangées par classe. Pas encore d'évaluation (onglets Évaluation / Bilans à brancher sur `eps-eval.js`).
