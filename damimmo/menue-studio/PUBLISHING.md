# Veröffentlichung

Die Anwendung sendet die Karte per HTTPS an `publish.php`. Dafür wird ein separater, 64-stelliger Hex-Schlüssel benötigt. Lege im selben Ordner eine Datei `.publish-secret.php` an, die den Schlüssel zurückgibt. Als Vorlage dient `publisher-secret.example.php`.

Der Schlüssel wird im Veröffentlichungsdialog abgefragt und nicht im FTP-Passwortfeld verwendet. `publish.php` prüft ihn und schreibt die veröffentlichte Datei als `../menue/menu.json`.
