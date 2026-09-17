#!/usr/bin/env node
/**
 * reinart — Konten verwalten.
 *
 *   node benutzer.js liste
 *   node benutzer.js anlegen <Name> <Klasse> [Passwort]
 *   node benutzer.js passwort <Name> [Passwort]
 *   node benutzer.js loeschen <Name>
 *
 * Ohne Passwort-Argument wird verdeckt danach gefragt — dann taucht es weder
 * in der Shell-History noch in der Prozessliste auf. Das ist der bessere Weg.
 */

const readline = require('readline');
const auth = require('./auth');

function frageVerdeckt(text) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const beiEingabe = () => rl.output.write('\x1B[2K\x1B[200D' + text);
    rl.output.write(text);
    rl.input.on('data', beiEingabe);
    rl.question('', antwort => {
      rl.input.removeListener('data', beiEingabe);
      rl.output.write('\n');
      rl.close();
      resolve(antwort);
    });
  });
}

async function passwortHolen(argument, name) {
  if (argument) {
    console.warn('Hinweis: Passwort als Argument steht in deiner Shell-History. Besser ohne Argument aufrufen.');
    return argument;
  }
  const eins = await frageVerdeckt(`Neues Passwort für ${name}: `);
  const zwei = await frageVerdeckt('Zur Bestätigung nochmal: ');
  if (eins !== zwei) {
    console.error('Die beiden Eingaben stimmen nicht überein.');
    process.exit(1);
  }
  return eins;
}

function hilfe() {
  console.log(`
reinart — Konten verwalten

  node benutzer.js liste
      Zeigt alle Konten (ohne Passwörter).

  node benutzer.js anlegen <Name> <Klasse> [Passwort]
      Legt ein Konto an. Klasse 5 bis 13.
      Beispiel:  node benutzer.js anlegen Jonte 5

  node benutzer.js passwort <Name> [Passwort]
      Setzt ein neues Passwort. Meldet den Nutzer überall ab.

  node benutzer.js loeschen <Name>
      Löscht ein Konto samt Sitzungen.
`);
}

async function main() {
  const [befehl, ...args] = process.argv.slice(2);

  try {
    switch (befehl) {
      case 'liste': {
        const alle = auth.alleOeffentlich();
        if (!alle.length) {
          console.log('Noch keine Konten. Lege eins an:');
          console.log('  node benutzer.js anlegen Jonte 5');
          return;
        }
        console.log(`\n${alle.length} Konto/Konten:\n`);
        for (const b of alle) {
          console.log(`  ${b.avatar}  ${b.name.padEnd(20)} Klasse ${String(b.klasse).padEnd(3)} ${b.rolle}`);
        }
        console.log(`\nGespeichert in: ${auth.BENUTZER_DATEI}\n`);
        return;
      }

      case 'anlegen': {
        const [name, klasse, pw] = args;
        if (!name || !klasse) {
          console.error('Aufruf: node benutzer.js anlegen <Name> <Klasse> [Passwort]');
          process.exit(1);
        }
        const passwort = await passwortHolen(pw, name);
        const b = auth.benutzerAnlegen({ name, passwort, klasse });
        console.log(`\n✓ Konto angelegt: ${b.avatar} ${b.name} (Klasse ${b.klasse})\n`);
        return;
      }

      case 'passwort': {
        const [name, pw] = args;
        if (!name) {
          console.error('Aufruf: node benutzer.js passwort <Name> [Passwort]');
          process.exit(1);
        }
        const passwort = await passwortHolen(pw, name);
        auth.passwortSetzen(name, passwort);
        console.log(`\n✓ Passwort für ${name} geändert. Alle Sitzungen wurden beendet.\n`);
        return;
      }

      case 'loeschen': {
        const [name] = args;
        if (!name) {
          console.error('Aufruf: node benutzer.js loeschen <Name>');
          process.exit(1);
        }
        auth.benutzerLoeschen(name);
        console.log(`\n✓ Konto ${name} gelöscht.\n`);
        return;
      }

      default:
        hilfe();
    }
  } catch (err) {
    console.error(`\nFehler: ${err.message}\n`);
    process.exit(1);
  }
}

main();
