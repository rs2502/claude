# Ad Director Studio

Web-App zum Ad-Director-Ablauf. Eine Datei, kein Server, kein API-Key: `index.html` per
Doppelklick öffnen oder den Ordner auf den Webspace hochladen.

## Ablauf

1. **Kit**: Marke, Slogan und Logo, dazu die Figuren mit Outfits, die Schauplätze und das Produkt.
   Jedes Element bekommt einen Referenz-Code (A1, B1, D1, P1). Die festen Beschreibungen
   (Englisch) werden wörtlich in jeden Akt kopiert, damit Gesicht, Ort und Produkt gleich bleiben.
   * Figur mit echtem Foto: Es gibt keinen Face-Lock-Prompt, das Foto ist die Referenz.
   * Echter Ort mit Foto: Statt einer erfundenen Kulisse kommt ein Prompt, der das Foto aufräumt.
     Nichts wird dazuerfunden.
   * Produkt mit Foto: Es wird nichts generiert, das Foto wird nur angehängt.
2. **Spot**: Akte in der Reihenfolge der Geschichte. Pro Akt wählst du Ort, Figur, Outfit und
   Produkt, schreibst die Aktion und klickst die Wow-Effekte an. Zwischen zwei Akten verdeckt ein
   echtes Objekt die Linse (fliegendes Objekt, Dampf, Reißschwenk, Match Cut). Im letzten Akt
   werden Ort und Kamera gesperrt, und das Produkt geht in die Kamera.
3. **Prompts**: entweder ein durchgehender Prompt für alle Akte, mit der Reihenfolge der
   Referenzen, oder Einzelclips pro Akt. Dazu kommen die Einblendungen für den Schnitt.
4. **Prüfen**: Checkliste der häufigsten Fehler in generierten Videos, außerdem das Projekt als
   Text kopieren, einfügen oder neu anlegen.

Das Projekt wird im Browser gespeichert (localStorage). Beim ersten Start ist das Beispiel
„Da Mimmo“ geladen.
