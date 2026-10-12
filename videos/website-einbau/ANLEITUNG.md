# Video im oberen Bereich der Startseite

Das Video ersetzt das Foto rechts oben. Läuft es auf einem Gerät nicht
(z. B. iPhone im Stromsparmodus oder Server ohne Video-Streaming), wird nach
spätestens 3,5 Sekunden automatisch dieselbe Animation als Bild (AVIF, 0,5 MB) gezeigt.

## 1. Sicherung
Kopie von `/start/startseite.html` aufheben.

## 2. Dateien hochladen nach `/start/assets/`
- `italia-hero.mp4`
- `italia-hero.webm`
- `italia-hero-poster.jpg`
- `italia-hero-anim.avif`  ← neu

Dateinamen nicht ändern.

## 3. Code austauschen
In `/start/startseite.html` den kompletten Video-Block (von `<video class="hero-photo"`
bis `</video>`) durch den Inhalt von `zeile-ersetzen.html` ersetzen (ab „ERSETZEN DURCH“).

## 4. Speichern, hochladen, auf dem iPhone neu laden
Falls Safari noch die alte Seite zeigt: Tab schließen und Seite neu öffnen.
