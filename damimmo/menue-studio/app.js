/* ==========================================================================
   Da Mimmo · Menü-Studio
   Eine Eingabe -> Aushang A4 (Druck/PDF), Instagram-Post, Story, Gästeseite.
   Reines Frontend, alles im Browser (localStorage). Keine Abhängigkeiten.
   ========================================================================== */

const SPEICHER     = 'damimmo.karte.v1';     /* alt: nur eine Karte */
const SPEICHER_V2  = 'damimmo.studio.v2';    /* neu: zwei Karten + Sprache */

/* Die beiden Karten des Hauses */
const KARTEN = [
  { id:'wochenkarte',  label:'Extra Karte',  titel:'Extra Karte'  },
  { id:'mittagstisch', label:'Mittagstisch', titel:'Mittagstisch' },
];

const HINTERGRUENDE = [
  { datei:'hintergrund.jpeg',  name:'Kamin' },
  { datei:'hintergrund2.jpeg', name:'Tageslicht' },
  { datei:'hintergrund3.jpeg', name:'Hell' },
  { datei:'hintergrund4.jpeg', name:'Abend' },
  { datei:'hintergrund5.jpeg', name:'Advent' },
  { datei:'Hintergrund6.jpeg', name:'Festlich' },
];

const HINWEISE_STANDARD =
  'Keine kleinen Portionen.\nAn Feiertagen gilt die Wochenkarte nicht. · Außer-Haus-Verkauf & Lieferung.';

/* Feste Beschriftungen in beiden Sprachen */
const TEXTE = {
  de:{ speisen:'Speisen', getraenke:'Empfohlene Getränke', ruf:'Tisch reservieren',
       preis:'Alle Preise in € inklusive Mehrwertsteuer und Dienstleistung, vorbehaltlich von Änderungen',
       allergene:'Allergene und Zusatzstoffe: Auskunft erhalten Sie von unserem Servicepersonal.',
       hinweis:'WICHTIGE HINWEISE:', bis:'bis' },
  en:{ speisen:'Food', getraenke:'Recommended Drinks', ruf:'Reserve a table',
       preis:'All prices include VAT and service. Prices are subject to change.',
       allergene:'Allergens and additives: please ask our staff for information.',
       hinweis:'PLEASE NOTE:', bis:'to' },
};
function istEnglisch(){ return (studio && studio.sprache) === 'en'; }
function T(schluessel){ return TEXTE[istEnglisch()?'en':'de'][schluessel]; }

/* Übersetzt einen Text, wenn Englisch gewählt ist — eigene Fassung hat Vorrang */
function eng(deutsch, eigene){
  if(!istEnglisch()) return deutsch;
  if(eigene && eigene.trim()) return eigene.trim();
  const woerterbuch = window.Woerterbuch;
  return woerterbuch ? woerterbuch.uebersetzen(deutsch) : deutsch;
}

/* Vorschlag für eine neue Karte — die Blöcke lassen sich frei
   umbenennen, verschieben, ergänzen und löschen. */
const BEREICHE = [
  { id:'speisen',   label:'Speisen',             rahmen:false },
  { id:'getraenke', label:'Empfohlene Getränke', rahmen:true  },
];
/* Vorschläge im Auswahlfeld „Block hinzufügen" */
const BLOCK_VORSCHLAEGE = ['Aperitivo','Vorspeisen','Speisen','Pasta','Pizza',
  'Fisch','Fleisch','Beilagen','Nachspeisen','Weine','Empfohlene Getränke','Getränke'];

const VORLAGE = {
  restaurant: { name:'Ristorante Da Mimmo', street:'Oldenburger Str. 160', city:'27753 Delmenhorst', phone:'04221 16647' },
  title:'Wochenkarte', from:'', to:'', intro:'', logo:null, stil:'stil-weiss',
  hintergrund:'hintergrund.jpeg', symbole:true, layout:'symbole',
  datumZeigen:true, tageZeigen:true, adresseZeigen:false, logoZeigen:true, fusszeile:true, qrZeigen:false, knopfZeigen:true, linienZeigen:false, blockTitel:true, ueberschrift:'keine',
  sections:[], footnote:HINWEISE_STANDARD
};

/* Sorgt dafür, dass jeder Block vollständig ist. Leere Karten bekommen
   den Vorschlag Speisen + Empfohlene Getränke. */
function bereicheSichern(){
  let vorhanden = daten.sections || [];
  if(!vorhanden.length)
    vorhanden = BEREICHE.map(b=> ({ id:b.id, label:b.label, rahmen:b.rahmen, items:[] }));
  daten.sections = vorhanden.map(s=> ({
    id: s.id || id(),
    label: s.label !== undefined ? s.label : '',
    rahmen: !!s.rahmen,
    links: !!s.links,
    /* Blocküberschriften stehen nur auf der Karte, wenn es ausdrücklich
       gewünscht ist — alte Karten ohne Angabe bleiben ohne Überschrift. */
    titelZeigen: s.titelZeigen === true || s.titelAus === false,
    items: (s.items||[]).map(i=> ({ id:i.id||id(), ...i })),
  }));
  if(offenerBereich >= daten.sections.length) offenerBereich = daten.sections.length - 1;
  if(offenerBereich < 0) offenerBereich = 0;
}

let studio = null;             /* { aktiv, sprache, karten:{...} } */
let daten  = null;             /* zeigt immer auf die gerade offene Karte */
let ansicht = 'story';

/* ---------------------------------------------------------------- Helfer */
const $  = (s,w=document)=>w.querySelector(s);
const $$ = (s,w=document)=>[...w.querySelectorAll(s)];
const id = ()=> Math.random().toString(36).slice(2,9);

/* Schreibweise der Vorlage: ohne €-Zeichen, ohne Null am Ende — 8,5 · 22 */
function preisKurz(p){
  if(p===null||p===undefined||p==='') return '';
  const n = Number(p);
  if(!isFinite(n)) return String(p);
  return n.toLocaleString('de-DE',{minimumFractionDigits:0,maximumFractionDigits:2});
}

function preisText(p){
  if(p===null||p===undefined||p==='') return '';
  const n = Number(p);
  if(!isFinite(n)) return String(p);
  return n.toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' €';
}
function preisLesen(text){
  const s = String(text).replace(/[^0-9,.-]/g,'').replace(',','.');
  const n = parseFloat(s);
  return isFinite(n) ? n : null;
}
function datumLang(iso){
  if(!iso) return '';
  const d = new Date(iso+'T12:00:00');
  if(isNaN(d)) return '';
  return d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
}
function wochentag(iso){
  if(!iso) return '';
  const d = new Date(iso+'T12:00:00');
  if(isNaN(d)) return '';
  return d.toLocaleDateString('de-DE',{weekday:'long'});
}
function zeitraumText(){
  const {from,to} = daten;
  if(!from && !to) return '';
  if(from && to){
    const a = wochentag(from), b = wochentag(to);
    return `${a}, ${datumLang(from)} – ${b}, ${datumLang(to)}`;
  }
  return datumLang(from||to);
}
function zeitraumKurz(){
  const {from,to} = daten;
  if(!from && !to) return '';
  if(from && to){
    const a = new Date(from+'T12:00:00'), b = new Date(to+'T12:00:00');
    if(!isNaN(a) && !isNaN(b) && a.getFullYear() === b.getFullYear()){
      /* Jahr nur einmal nennen: 15.09. – 19.09.2026 */
      const tm = d => String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0');
      return `${tm(a)}. – ${tm(b)}.${b.getFullYear()}`;
    }
    return `${datumLang(from)} – ${datumLang(to)}`;
  }
  return datumLang(from||to);
}
/* -------------------------------------------------------------- Speicher */
function karteAufbereiten(roh, vorgabe){
  const k = Object.assign({}, VORLAGE, roh||{});
  k.restaurant = Object.assign({}, VORLAGE.restaurant, (roh&&roh.restaurant)||{});
  /* Jede Karte trägt ihren eigenen Namen */
  k.title = (roh && roh.title) ? roh.title : vorgabe;
  if(!k.footnote) k.footnote = HINWEISE_STANDARD;
  if(k.footnote.includes('Feiertage ausgenommen')) k.footnote = HINWEISE_STANDARD;
  if(k.ueberschrift === 'bild') k.ueberschrift = 'seitlich';
  k.sections = k.sections || [];
  return k;
}
function studioVorlage(){
  return { aktiv:'wochenkarte', sprache:'de', weissGesetzt:true, stand:'', karten:{
    wochenkarte:  karteAufbereiten(null,'Wochenkarte'),
    mittagstisch: karteAufbereiten(null,'Mittagstisch'),
  }};
}
function laden(){
  try{
    const neu = localStorage.getItem(SPEICHER_V2);
    if(neu){
      const s = JSON.parse(neu);
      const f = studioVorlage();
      /* Einmalige Umstellung auf den weißen Grund — wer danach einen
         anderen Stil wählt, behält ihn. */
      if(!s.weissGesetzt){
        Object.values(s.karten||{}).forEach(k=>{
          if(!k.stil || k.stil === 'stil-klassisch') k.stil = 'stil-weiss';
        });
        s.weissGesetzt = true;
      }
      f.weissGesetzt = true;
      f.aktiv   = KARTEN.some(k=>k.id===s.aktiv) ? s.aktiv : 'wochenkarte';
      f.sprache = s.sprache === 'en' ? 'en' : 'de';
      f.stand   = s.stand || '';
      KARTEN.forEach(k=> f.karten[k.id] = karteAufbereiten((s.karten||{})[k.id], k.titel));
      return f;
    }
    /* Die alte Fassung kannte nur eine Karte — sie wird zur Wochenkarte */
    const alt = localStorage.getItem(SPEICHER);
    if(alt){
      const f = studioVorlage();
      f.karten.wochenkarte = karteAufbereiten(JSON.parse(alt),'Wochenkarte');
      return f;
    }
  }catch(e){ console.warn('Konnte nicht laden:',e); }
  return null;
}
let sicherungsFehlerGemeldet = false;
function sichern(){
  try{ localStorage.setItem(SPEICHER_V2, JSON.stringify(studio)); sicherungsFehlerGemeldet = false; }
  catch(e){
    console.warn('Konnte nicht sichern:',e);
    /* Meist ist der Browserspeicher voll (eigene Fotos, Logo). Nicht still weitermachen. */
    if(!sicherungsFehlerGemeldet && typeof meldung === 'function'){
      sicherungsFehlerGemeldet = true;
      meldung('Achtung: Der Browser konnte die Karte nicht speichern (Speicher voll?). Bitte jetzt „Karte sichern“ drücken und große Fotos entfernen.');
    }
  }
}

/* Karte wechseln (Wochenkarte / Mittagstisch) */
function karteWechseln(welche){
  if(!studio.karten[welche]) return;
  studio.aktiv = welche;
  daten = studio.karten[welche];
  kartenReiterMarkieren();
  editorAufbauen();
  aktualisieren();
}
function kartenReiterMarkieren(){
  $$('#kartenReiter button').forEach(b=>
    b.classList.toggle('an', b.dataset.karte === studio.aktiv));
  const f = $('#fSprache');
  if(f) f.value = studio.sprache;
}

/* ============================================================== EDITOR == */
function editorAufbauen(){
  $('#fTitel').value   = daten.title || '';
  $('#fVon').value     = daten.from || '';
  $('#fBis').value     = daten.to || '';
  $('#fIntro').value   = daten.intro || '';
  $('#fFuss').value    = daten.footnote || '';
  $('#fName').value    = daten.restaurant.name || '';
  $('#fStrasse').value = daten.restaurant.street || '';
  $('#fOrt').value     = daten.restaurant.city || '';
  $('#fTel').value     = daten.restaurant.phone || '';
  $('#fStil').value    = daten.stil || 'stil-klassisch';
  $('#fLayout').value  = daten.layout || 'symbole';
  $('#fDatumZeigen').checked = daten.datumZeigen !== false;
  $('#fTageZeigen').checked  = daten.tageZeigen  !== false;
  $('#fAdresse').checked     = daten.adresseZeigen !== false;
  $('#fQR').checked          = daten.qrZeigen === true;
  $('#fLinien').checked      = daten.linienZeigen === true;
  $('#fUeberschrift').value  = daten.ueberschrift || 'keine';
  $('#fLogoZeigen').checked  = daten.logoZeigen !== false;
  logoVorschauSetzen();
  hintergrundGalerie();
  sektionenAufbauen();
}

/* Galerie der Hintergründe im Editor */
function hintergrundGalerie(){
  const ziel = $('#hgWahl');
  if(!ziel) return;
  ziel.innerHTML = HINTERGRUENDE.map(h=>
    `<button type="button" data-hg="${h.datei}" title="${h.name}">
       <img src="bilder/${h.datei}" alt="${h.name}" loading="lazy"><span>${h.name}</span>
     </button>`).join('');
  hintergrundMarkieren();
}
function hintergrundMarkieren(){
  $$('#hgWahl button').forEach(b=>
    b.classList.toggle('an', b.dataset.hg === (daten.hintergrund||HINTERGRUENDE[0].datei)));
}

function logoVorschauSetzen(){
  const huelle = $('#logoVorschau');
  if(daten.logo){ $('#logoBild').src = daten.logo; huelle.hidden = false; }
  else huelle.hidden = true;
}

let offenerBereich = 0;        /* welcher Umschalter gerade gewählt ist */

function sektionenAufbauen(){
  bereicheSichern();
  const ziel = $('#sektionen');
  ziel.innerHTML = '';

  const box = document.createElement('div');
  box.className = 'bereich-box';

  /* Umschalter: ein Reiter je Block, in der Reihenfolge der Karte */
  const reiter = document.createElement('div');
  reiter.className = 'bereich-reiter';
  daten.sections.forEach((s,i)=>{
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.textContent = s.label || 'Ohne Titel';
    knopf.className = i === offenerBereich ? 'an' : '';
    knopf.addEventListener('click',()=>{ offenerBereich = i; sektionenAufbauen(); });
    reiter.appendChild(knopf);
  });

  /* Neuer Block */
  const neu = document.createElement('button');
  neu.type = 'button'; neu.className = 'neu';
  neu.textContent = '+';
  neu.title = 'Block hinzufügen';
  neu.addEventListener('click',()=>{
    const name = prompt('Name des neuen Blocks\n\nzum Beispiel: ' +
      BLOCK_VORSCHLAEGE.slice(0,6).join(', '), 'Aperitivo');
    if(name === null) return;
    daten.sections.push({ id:id(), label:name.trim(), rahmen:false, items:[] });
    offenerBereich = daten.sections.length - 1;
    aktualisieren();
  });
  reiter.appendChild(neu);
  box.appendChild(reiter);

  const sek = daten.sections[offenerBereich];

  /* Kopfzeile des Blocks: Name, verschieben, Rahmen, löschen */
  const kopf = document.createElement('div');
  kopf.className = 'block-kopf';

  const name = document.createElement('input');
  name.type = 'text'; name.className = 'block-name';
  name.placeholder = 'Überschrift (leer = keine)';
  name.value = sek.label || '';
  name.addEventListener('input',()=>{
    sek.label = name.value;
    reiter.children[offenerBereich].textContent = sek.label || 'Ohne Titel';
    aktualisieren(false);
  });

  const werkzeuge = document.createElement('div');
  werkzeuge.className = 'block-werkzeuge';
  werkzeuge.appendChild(knopf('↑','Block nach vorn',()=>{
    if(offenerBereich === 0) return;
    tauschen(daten.sections, offenerBereich, offenerBereich-1);
    offenerBereich--; aktualisieren();
  }));
  werkzeuge.appendChild(knopf('↓','Block nach hinten',()=>{
    if(offenerBereich >= daten.sections.length-1) return;
    tauschen(daten.sections, offenerBereich, offenerBereich+1);
    offenerBereich++; aktualisieren();
  }));
  werkzeuge.appendChild(knopf('T','Überschrift auf der Karte zeigen',()=>{
    sek.titelZeigen = !sek.titelZeigen;
    aktualisieren();
  }, sek.titelZeigen ? 'an' : ''));
  werkzeuge.appendChild(knopf('◫','Fließtext links (für Weine)',()=>{
    sek.links = !sek.links;
    aktualisieren();
  }, sek.links ? 'an' : ''));
  const rahmenKnopf = knopf('▭','Block einrahmen',()=>{
    sek.rahmen = !sek.rahmen;
    aktualisieren();
  }, sek.rahmen ? 'an' : '');
  werkzeuge.appendChild(rahmenKnopf);
  werkzeuge.appendChild(knopf('×','Block löschen',()=>{
    if(daten.sections.length <= 1){ alert('Die Karte braucht mindestens einen Block.'); return; }
    if(sek.items.length && !confirm(`Block „${sek.label||'Ohne Titel'}" mit ${sek.items.length} Einträgen löschen?`)) return;
    daten.sections.splice(offenerBereich,1);
    offenerBereich = Math.max(0, offenerBereich-1);
    aktualisieren();
  },'btn--gefahr'));

  kopf.append(name, werkzeuge);
  box.appendChild(kopf);

  const body = document.createElement('div');
  body.className = 'bereich-body';
  sek.items.forEach((gericht,gi)=> body.appendChild(gerichtFeld(sek,gericht,gi)));

  const plus = document.createElement('button');
  plus.className = 'btn btn--zufuegen';
  plus.textContent = '+ Eintrag hinzufügen';
  plus.addEventListener('click',()=>{
    sek.items.push({id:id(),name:'',desc:'',price:null});
    aktualisieren();
    const felder = $$('.bereich-body input.name');
    felder[felder.length-1]?.focus();
  });
  body.appendChild(plus);

  box.appendChild(body);
  ziel.appendChild(box);
}

const KAMERA = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" '+
  'stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">'+
  '<path d="M3.5 7.5h3.6l1.4-2h7l1.4 2h3.6v11h-17z"/>'+
  '<circle cx="12" cy="12.8" r="3.3"/></svg>';

function knopf(zeichen,titel,fn,extra=''){
  const b = document.createElement('button');
  b.className = 'btn btn--icon '+extra;
  /* Manche Sonderzeichen fehlen auf dem iPhone — dann lieber ein SVG */
  if(zeichen.startsWith('<')) b.innerHTML = zeichen; else b.textContent = zeichen;
  b.title = titel;
  b.addEventListener('click',fn);
  return b;
}
function tauschen(arr,a,b){
  if(b<0||b>=arr.length) return;
  [arr[a],arr[b]] = [arr[b],arr[a]];
}

function gerichtFeld(sek,gericht,gi){
  const box = document.createElement('div');
  box.className = 'gericht';

  const kopf = document.createElement('div');
  kopf.className = 'gericht-kopf';

  const name = document.createElement('input');
  name.className='name'; name.type='text';
  name.placeholder = 'Name — hier eingeben';
  name.value = gericht.name||'';
  name.addEventListener('input',()=>{ gericht.name = name.value; aktualisieren(false); });

  const preis = document.createElement('input');
  preis.className='preis'; preis.type='text'; preis.placeholder='Preis';
  preis.value = gericht.price!=null ? String(gericht.price).replace('.',',') : '';
  preis.addEventListener('input',()=>{ gericht.price = preisLesen(preis.value); aktualisieren(false); });
  preis.addEventListener('blur',()=>{
    preis.value = gericht.price!=null ? gericht.price.toLocaleString('de-DE',{minimumFractionDigits:2}) : '';
  });

  kopf.append(name,preis);
  box.appendChild(kopf);

  const desc = document.createElement('textarea');
  desc.placeholder = 'Beschreibung — Zutaten, Menge, Beilagen';
  desc.value = gericht.desc||'';
  desc.addEventListener('input',()=>{ gericht.desc = desc.value; aktualisieren(false); });
  box.appendChild(desc);

  /* Englische Fassung — nur sichtbar, wenn Englisch gewählt ist.
     Leer heißt: die App übersetzt selbst (steht blass im Feld). */
  if(istEnglisch()){
    const enKopf = document.createElement('div');
    enKopf.className = 'gericht-en';

    const nameEn = document.createElement('input');
    nameEn.type = 'text'; nameEn.className = 'name';
    nameEn.placeholder = (window.Woerterbuch ? window.Woerterbuch.uebersetzen(gericht.name||'') : '') || 'English name';
    nameEn.value = gericht.nameEn || '';
    nameEn.addEventListener('input',()=>{ gericht.nameEn = nameEn.value; aktualisieren(false); });

    const descEn = document.createElement('textarea');
    descEn.placeholder = (window.Woerterbuch ? window.Woerterbuch.uebersetzen(gericht.desc||'') : '') || 'English description';
    descEn.value = gericht.descEn || '';
    descEn.addEventListener('input',()=>{ gericht.descEn = descEn.value; aktualisieren(false); });

    const marke = document.createElement('span');
    marke.className = 'en-marke'; marke.textContent = 'English';

    enKopf.append(marke, nameEn, descEn);
    box.appendChild(enKopf);
  }

  /* Symbol, eigenes Foto, Gericht der Woche */
  const zeile = document.createElement('div');
  zeile.className = 'bild-zeile';

  const schau = document.createElement('span');
  schau.className = 'symbol-schau';

  const wahl = document.createElement('select');
  wahl.innerHTML = '<option value="auto">Symbol: automatisch</option>' +
    Object.entries(SYMBOLE).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join('');
  wahl.value = gericht.symbol || 'auto';

  const schauSetzen = ()=>{
    schau.innerHTML = symbolSVG(symbolFuer(sek.label, gericht), '');
    schau.classList.toggle('eigenes', !!(gericht.bild && gericht.bild.startsWith('data:')));
  };
  wahl.addEventListener('change',()=>{
    gericht.symbol = wahl.value === 'auto' ? null : wahl.value;
    schauSetzen(); aktualisieren(false);
  });

  /* Eigenes Foto — es erscheint im Kopf der Karte und groß in der Story. */
  const fotoFeld = document.createElement('input');
  fotoFeld.type='file'; fotoFeld.accept='image/*'; fotoFeld.hidden=true;
  fotoFeld.addEventListener('change',e=>{
    const datei = e.target.files[0]; if(!datei) return;
    if(datei.size > 4e6){ alert('Bitte ein Foto unter 4 MB wählen.'); return; }
    const leser = new FileReader();
    leser.onload = async ()=>{
      gericht.bild = leser.result;
      delete bilder['eigen:'+gericht.id];
      await bildLaden('eigen:'+gericht.id, gericht.bild);
      schauSetzen(); aktualisieren(false);
    };
    leser.readAsDataURL(datei);
  });

  const foto = knopf(KAMERA,'Eigenes Foto für dieses Gericht',()=>{
    if(gericht.bild && gericht.bild.startsWith('data:')){
      if(confirm('Eigenes Foto entfernen?')){
        gericht.bild = 'auto'; delete bilder['eigen:'+gericht.id];
        schauSetzen(); aktualisieren(false); return;
      }
      return;
    }
    fotoFeld.click();
  });
  foto.classList.toggle('an', !!(gericht.bild && gericht.bild.startsWith('data:')));

  schauSetzen();
  zeile.append(schau, wahl, fotoFeld, foto);
  box.appendChild(zeile);

  /* Merkmale: vegetarisch / laktosefrei */
  const merkmalZeile = document.createElement('div');
  merkmalZeile.className = 'merkmal-zeile';
  Object.entries(MERKMALE).forEach(([schluessel, m])=>{
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn--merkmal' + ((gericht.merkmale||[]).includes(schluessel) ? ' an' : '');
    b.innerHTML = merkmalSVG(schluessel,'') + '<span>' + m.name + '</span>';
    b.title = m.name + ' kennzeichnen';
    b.addEventListener('click',()=>{
      const liste = new Set(gericht.merkmale||[]);
      liste.has(schluessel) ? liste.delete(schluessel) : liste.add(schluessel);
      gericht.merkmale = [...liste];
      b.classList.toggle('an', liste.has(schluessel));
      aktualisieren(false);
    });
    merkmalZeile.appendChild(b);
  });
  box.appendChild(merkmalZeile);

  const fuss = document.createElement('div');
  fuss.className='gericht-fuss';
  fuss.appendChild(knopf('↑','nach oben',()=>{ tauschen(sek.items,gi,gi-1); aktualisieren(); }));
  fuss.appendChild(knopf('↓','nach unten',()=>{ tauschen(sek.items,gi,gi+1); aktualisieren(); }));
  fuss.appendChild(knopf('×','Gericht löschen',()=>{ sek.items.splice(gi,1); aktualisieren(); },'btn--gefahr'));
  box.appendChild(fuss);

  return box;
}

/* =========================================================== A4 / KARTE = */
function karteZeichnen(){
  const blatt = $('#blatt');
  blatt.className = 'blatt ' + (daten.stil||'stil-klassisch');
  blatt.style.backgroundImage = `url('bilder/${daten.hintergrund||HINTERGRUENDE[0].datei}')`;

  /* Kopf */
  const kopf = $('#karteKopf');
  kopf.innerHTML = '';
  const marke = document.createElement('div');
  marke.className = 'karte-marke';
  const bild = document.createElement('img');
  bild.className = 'logo-bild';
  bild.src = daten.logo || 'bilder/Logo-schrift.png';
  bild.alt = daten.restaurant.name || 'Da Mimmo';
  marke.appendChild(bild);
  kopf.appendChild(marke);

  const adresse = document.createElement('div');
  adresse.className='adresse';
  adresse.innerHTML = [daten.restaurant.street, daten.restaurant.city]
    .filter(Boolean).map(t=>`<span>${escapeHTML(t)}</span>`).join(' ');
  kopf.appendChild(adresse);

  /* Band */
  const spanne = zeitraumKurz();
  $('#karteTitel').textContent = daten.title || 'Wochenkarte';
  $('#karteDatum').innerHTML = spanne
    ? `<span class="strich"></span><span class="spanne">${escapeHTML(spanne)}</span><span class="strich"></span>`
    : '';
  $('#karteZeitraum').textContent = wochentageText();
  const intro = $('#karteIntro');
  intro.textContent = daten.intro||'';
  intro.style.display = daten.intro ? '' : 'none';

  /* Gänge */
  const ziel = $('#karteGaenge');
  ziel.innerHTML = '';
  daten.sections.forEach(sek=>{
    const sichtbar = sek.items.filter(i=>i.name||i.desc);
    if(!sichtbar.length) return;        /* leerer Bereich bleibt ohne Überschrift */
    const gang = document.createElement('section');
    gang.className = 'gang' + (sek.rahmen ? ' rahmen' : '');
    if(sek.label){
      const t = document.createElement('div');
      t.className='gang-titel'; t.innerHTML = `<span>${escapeHTML(sek.label)}</span>`;
      gang.appendChild(t);
    }
    sichtbar.forEach(gericht=>{
      const s = document.createElement('div');
      s.className='speise';
      const symbol = daten.symbole === false
        ? '<span class="speise-symbol"></span>'
        : symbolSVG(symbolFuer(sek.label, gericht));
      const preis = gericht.price!=null ? preisText(gericht.price) : '';
      s.innerHTML = `
        ${symbol}
        <div class="speise-text">
          <div class="speise-name">${escapeHTML(gericht.name||'')}</div>
          ${gericht.desc?`<div class="speise-desc">${escapeHTML(gericht.desc)}</div>`:''}
        </div>
        <div class="speise-preis">${preis}</div>`;
      gang.appendChild(s);
    });
    ziel.appendChild(gang);
  });

  /* Fuß */
  const fuss = $('#karteFuss');
  const telefon = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1.1z"/></svg>`;
  fuss.innerHTML =
    (daten.footnote?(()=>{ const [a,b] = Social.hinweisZeilen(daten.footnote);
      return `<div class="hinweise"><b>WICHTIGE HINWEISE:</b> ${escapeHTML(a)}${b?'<br>'+escapeHTML(b):''}</div>`; })():'') +
    (daten.restaurant.phone
      ? `<div class="karte-ruf">${telefon}<span>Tisch reservieren</span><span class="trenner"></span><span>${escapeHTML(daten.restaurant.phone)}</span></div>`
      : '');
  fuss.style.display = '';
}

/* Die Überschrift füllt die Blattbreite — wie auf der Vorlage. */
function titelEinpassen(){
  const el = $('#karteTitel'), blatt = $('#blatt');
  if(!el || !blatt) return;
  const stil = getComputedStyle(blatt);
  const innen = blatt.clientWidth
              - parseFloat(stil.paddingLeft) - parseFloat(stil.paddingRight);
  const ziel = innen * 0.94;
  const zoom = parseFloat(blatt.style.zoom) || 1;   /* Vorschau-Zoom herausrechnen */
  el.style.fontSize = '';
  let gr = parseFloat(getComputedStyle(el).fontSize);
  for(let runde=0; runde<8; runde++){
    const breite = el.getBoundingClientRect().width / zoom;
    if(!breite) break;
    if(Math.abs(breite-ziel)/ziel < 0.015) break;
    gr = Math.max(18, Math.min(220, gr * ziel/breite));
    el.style.fontSize = gr.toFixed(1)+'px';
  }
}

/* Wochentage als Unterzeile: „Dienstag bis Samstag" */
function wochentageText(){
  const sp = istEnglisch() ? 'en-GB' : 'de-DE';
  const tag = iso=>{
    if(!iso) return '';
    const d = new Date(iso+'T12:00:00');
    return isNaN(d) ? '' : d.toLocaleDateString(sp,{weekday:'long'});
  };
  const a = tag(daten.from), b = tag(daten.to);
  if(a && b && a!==b) return `${a} ${T('bis')} ${b}`;
  return a || b || '';
}

/* Datum: deutsch 15.09. – 19.09.2026, englisch 15 – 19 September 2026 */
function zeitraumAnzeige(){
  if(!istEnglisch()) return zeitraumKurz();
  const {from,to} = daten;
  if(!from && !to) return '';
  const d = iso=> iso ? new Date(iso+'T12:00:00') : null;
  const a = d(from), b = d(to);
  const lang = x=> x.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  if(a && b && !isNaN(a) && !isNaN(b)){
    if(a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear())
      return `${a.getDate()} – ${lang(b)}`;
    return `${lang(a)} – ${lang(b)}`;
  }
  const eins = a || b;
  return eins && !isNaN(eins) ? lang(eins) : '';
}

/* Die Hinweiszeilen übersetzen — Satz für Satz, Zeilenumbruch bleibt */
function hinweisAnzeige(){
  const roh = daten.footnote || '';
  if(!istEnglisch()) return roh;
  if(daten.footnoteEn && daten.footnoteEn.trim()) return daten.footnoteEn.trim();
  return roh.split('\n').map(zeile=>
    zeile.split(/(\s·\s)/).map(teil=>
      teil.trim() && teil !== ' · '
        ? teil.replace(/\.\s+/g,'.\n').split('\n').map(satz=> window.Woerterbuch ? window.Woerterbuch.uebersetzen(satz) : satz).join(' ')
        : teil).join('')
  ).join('\n');
}

function alleGerichte(){
  return daten.sections.flatMap(s=> (s.items||[]).filter(i=>i.name||i.desc));
}

function wortmarkeSVG(){
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 300 60');
  svg.setAttribute('class','wortmarke');
  const t = document.createElementNS(ns,'text');
  t.setAttribute('x','150'); t.setAttribute('y','46');
  t.setAttribute('text-anchor','middle');
  t.setAttribute('font-family','Inter,sans-serif');
  t.setAttribute('font-size','46'); t.setAttribute('font-weight','300');
  t.setAttribute('letter-spacing','1');
  t.setAttribute('fill','url(#goldVerlauf)');
  t.textContent = 'Da Mimmo';
  svg.appendChild(t);
  return svg;
}

function escapeHTML(s){
  return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ====================================================== SOCIAL / BEWEGUNG =
   Vorschau und Export sind dieselbe Szene: das Standbild ist ihr letzter
   Bild, das Video ist der Weg dorthin.
   ========================================================================== */

const FORMATE = {
  story: { w:1080, h:1920, name:'Instagram-Story 9:16', art:'karte', k:1 },
  /* A4 wird genauso gezeichnet und in Druckauflösung (300 dpi) ausgegeben —
     gedruckt wird dieses Bild, damit Safari nichts verschieben kann. */
  a4:    { w:1080, h:1527, name:'Aushang A4 · 300 dpi', art:'karte', k:2480/1080, papier:'A4' },
  /* A5 hat dasselbe Seitenverhältnis wie A4 — gleiche Karte, halbe Größe */
  a5:    { w:1080, h:1527, name:'Tischkarte A5 · 300 dpi', art:'karte', k:1748/1080, papier:'A5' },
};

/* ------------------------------------------------------------- Bilder --- */
const bilder = {};            /* Schlüssel -> Image */
let bilderBereit = false;

function bildLaden(schluessel, quelle){
  return new Promise(fertig=>{
    if(bilder[schluessel]) return fertig(bilder[schluessel]);
    const b = new Image();
    b.onload = ()=>{ bilder[schluessel]=b; fertig(b); };
    b.onerror = ()=> fertig(null);
    b.src = quelle;
  });
}
async function bilderVorbereiten(){
  await Promise.all([
    ...HINTERGRUENDE.map(h=> bildLaden('hg:'+h.datei,'bilder/'+h.datei)),
    bildLaden('logo','bilder/Logo-schrift.png'),
    bildLaden('qr','bilder/qr-code-speisekarte-kompakt.png'),
    bildLaden('titelbild','bilder/titel-extra.png'),
    ...Object.entries(TELLER).map(([k,q])=> bildLaden(k,q)),
  ]);
  /* eigene Bilder der Gerichte */
  const eigene = [];
  daten.sections.forEach(s=> s.items.forEach(i=>{
    if(i.bild && i.bild.startsWith('data:')) eigene.push(bildLaden('eigen:'+i.id, i.bild));
  }));
  if(daten.logo) eigene.push(bildLaden('logo:'+kurzHash(daten.logo), daten.logo));
  await Promise.all(eigene);
  bilderBereit = true;
}
function kurzHash(s){
  let h=0; for(let i=0;i<s.length;i+=97) h=(h*31+s.charCodeAt(i))|0;
  return String(h);
}

/* Welchen Bildschlüssel benutzt dieses Gericht? */
function bildSchluessel(gangName, gericht){
  if(gericht.bild === 'keins') return null;
  if(gericht.bild && gericht.bild.startsWith('data:')) return 'eigen:'+gericht.id;
  if(gericht.bild && TELLER[gericht.bild]) return gericht.bild;
  return bildRaten(gangName, gericht);     /* 'auto' */
}

/* --------------------------------------------------- Daten für die Szene */
/* Überschrift eines Blocks — englisch über das Wörterbuch */
function blockTitel(s){
  const roh = (s.label||'').trim();
  if(!roh) return '';
  if(!istEnglisch()) return roh;
  if(s.labelEn && s.labelEn.trim()) return s.labelEn.trim();
  return window.Woerterbuch ? window.Woerterbuch.uebersetzen(roh) : roh;
}

function szeneDaten(){
  const sections = daten.sections.map(s=>({
    label: s.titelZeigen ? blockTitel(s) : '',
    rahmen: !!s.rahmen,
    links: !!s.links,
    items: (s.items||[]).filter(i=>i.name||i.desc).map(i=>({
      ...i,
      merkmale: i.merkmale || [],
      name: eng(i.name||'', i.nameEn),
      desc: eng(i.desc||'', i.descEn),
      bildSchluessel: bildSchluessel(s.label, i),
      symbol: daten.symbole === false ? null : symbolFuer(s.label, i),
    })),
  }));
  return {
    restaurant: daten.restaurant,
    title: eng(daten.title, daten.titleEn),
    zeitraum:    daten.datumZeigen === false ? '' : zeitraumAnzeige(),
    wochentage:  daten.tageZeigen  === false ? '' : wochentageText(),
    rufText: T('ruf'), hinweisPraefix: T('hinweis'), preisHinweis: T('preis'), allergenHinweis: T('allergene'),
    layout: daten.layout || 'symbole',
    fusszeile: true,
    logoZeigen: daten.logoZeigen !== false,
    adresseZeigen: daten.adresseZeigen !== false,
    claim: '',                    /* Spruch auf Wunsch entfernt */
    footnote: hinweisAnzeige(),
    sections,
    preisText: preisKurz,        /* überall ohne € und ohne Null am Ende */
    logoBild: daten.logo ? bilder['logo:'+kurzHash(daten.logo)] : (bilder['logo'] || null),
    qrBild: daten.qrZeigen === true ? (bilder['qr'] || null) : null,
    linienZeigen: daten.linienZeigen === true,
    ueberschrift: daten.ueberschrift || 'keine',
    titelBild: bilder['titelbild'] || null,
    hintergrund: bilder['hg:'+(daten.hintergrund||HINTERGRUENDE[0].datei)] || null,
  };
}

/* Der Stil der Karte bestimmt auch den Look von Post und Story. */
function weltFuerStil(){
  const stil = daten.stil || 'stil-klassisch';
  if(stil === 'stil-weiss')  return 'weiss';
  if(stil === 'stil-hell')   return 'hell';
  if(stil === 'stil-dunkel') return 'dunkel';
  return 'nacht';
}

/* ---------------------------------------------------------- Abspielen --- */
let szene = null, laeuft = false, startZeit = 0, rafKennung = 0, standbildZeit = null;

function szeneBauen(){
  const format = FORMATE[ansicht];
  if(!format) return null;
  let d = szeneDaten();
  const welt = weltFuerStil();

  /* Mittiges Layout auf Papier: Start bei 9,5 pt. Ist die Karte zu lang, wird die Schrift
     kleiner; bleibt Platz, wächst sie bis höchstens 14 pt. */
  const festeSchrift = !!format.papier && d.layout === 'zentriert';
  if(festeSchrift){
    let fest = Social.szeneKarte(format, d, bilder, welt, 1);
    /* Reicht der Platz nicht, fliegt zuerst die Fußzeile raus —
       erst danach wird die Schrift kleiner als 9,5 pt. */
    if(fest.hoehe > fest.zielHoehe*1.02){
      const ohne = Object.assign({}, d, {fusszeileAus:true});
      const versuch = Social.szeneKarte(format, ohne, bilder, welt, 1);
      if(versuch.hoehe <= versuch.zielHoehe*1.02) return versuch;
      fest = versuch;
      d = ohne;
    }
    if(fest.hoehe <= fest.zielHoehe){
      /* Bleibt Platz übrig, wächst die Schrift — von 9,5 pt bis höchstens 14 pt. */
      let unten = 1, oben = Social.FEST_MAX, groesste = fest;
      for(let i=0;i<10;i++){
        const mitte = (unten+oben)/2;
        const versuch = Social.szeneKarte(format, d, bilder, welt, mitte);
        if(versuch.hoehe <= versuch.zielHoehe){ groesste = versuch; unten = mitte; }
        else oben = mitte;
      }
      return groesste;
    }

    /* Größtmögliche Schrift suchen, die noch passt (Intervallhalbierung) —
       grobe Schritte ließen sonst Platz ungenutzt. */
    let unten = 0.36, oben = 1, beste = null;
    for(let i=0;i<12;i++){
      const mitte = (unten+oben)/2;
      const versuch = Social.szeneKarte(format, d, bilder, welt, mitte);
      if(versuch.hoehe <= versuch.zielHoehe){ beste = versuch; unten = mitte; }
      else oben = mitte;
    }
    return beste || Social.szeneKarte(format, d, bilder, welt, 0.36);
  }

  /* Maßstab so lange nachjustieren, bis der Satz die Fläche füllt. */
  let bau = Social.szeneKarte(format, d, bilder, welt);
  for(let runde=0; runde<4; runde++){
    const abweichung = Math.abs(bau.hoehe-bau.zielHoehe)/bau.zielHoehe;
    if(abweichung < 0.02) break;
    const s = Math.max(0.36, Math.min(1.3, bau.s * Math.pow(bau.zielHoehe/bau.hoehe, 0.6)));
    if(Math.abs(s-bau.s) < 0.005) break;
    bau = Social.szeneKarte(format, d, bilder, welt, s);
  }
  /* Lieber etwas kleiner als über den Rand hinaus. */
  let schutz = 0;
  while(bau.hoehe > bau.zielHoehe*1.02 && bau.s > 0.36 && schutz++ < 16)
    bau = Social.szeneKarte(format, d, bilder, welt, bau.s*0.96);
  return bau;
}

async function socialZeichnen(neuStarten = true){
  const format = FORMATE[ansicht];
  if(!format) return;
  if(!bilderBereit) await bilderVorbereiten();

  const leinwand = $('#socialCanvas');
  leinwand.width = Math.round(format.w*format.k); leinwand.height = Math.round(format.h*format.k);
  leinwand.classList.toggle('a4', !!format.papier);
  szene = szeneBauen();
  if(!szene) return;

  /* Bei fester Schriftgröße kann der Satz länger werden als die Seite */
  const warnung = $('#seitenWarnung');
  if(warnung){
    warnung.hidden = true;     /* der Hinweis steht jetzt unter der Vorschau */
  }

  $('#canvasInfo').innerHTML =
    `${format.name} · ${leinwand.width}×${leinwand.height} px` +
    (szene.punkt ? ` · Schrift ${szene.punkt.toFixed(1).replace('.',',')} pt`
                 + (szene.punkt < 9.3 ? ' — für 9,5 pt ist zu viel Text auf der Karte' : '') : '');

  /* Nur noch Standbild: immer das fertige Bild zeigen */
  laeuft = false; standbildZeit = szene.dauer + 0.4;
  schleife();
}

function schleife(){
  cancelAnimationFrame(rafKennung);
  const format = FORMATE[ansicht];
  if(!format || !szene) return;
  const ctx = $('#socialCanvas').getContext('2d');
  ctx.setTransform(format.k,0,0,format.k,0,0);
  const d = szeneDaten();

  const bild = ()=>{
    const t = standbildZeit!=null
      ? standbildZeit
      : (performance.now()-startZeit)/1000;
    Social.zeichnen(ctx, szene, format, t, d);
    if(standbildZeit==null && laeuft){
      if(t > szene.dauer + 1.6) startZeit = performance.now();   /* Schleife */
      rafKennung = requestAnimationFrame(bild);
    }
  };
  bild();
}

function standbild(){          /* Endzustand einfrieren */
  laeuft = false;
  standbildZeit = szene ? szene.dauer + 0.4 : 3;
  schleife();
  knopfBeschriften();
}
function knopfBeschriften(){}

/* ------------------------------------------------------------- Ausgabe --- */
async function bildSpeichern(){
  /* Bei A4 und A5 liegt „Bild speichern" auf dem zweiten Knopf */
  const knopf = FORMATE[ansicht].papier ? $('#btnBild') : $('#btnAusgabe');
  const vorher = standbildZeit;
  standbildZeit = szene ? szene.dauer + 0.4 : 3;
  laeuft = false; schleife();                       /* fertiges Bild zeigen */
  knopfBeschriften();

  const marke = (daten.from||'woche').replaceAll('-','');
  const name  = `da-mimmo-${studio.aktiv}-${ansicht}${istEnglisch()?'-en':''}-${marke}.png`;
  const leinwand = $('#socialCanvas');

  knopf.disabled = true; knopf.textContent = 'wird gespeichert …';
  try{
    await socialZeichnen(false);
    const blob = await new Promise(f=> leinwand.toBlob(f,'image/png'));
    if(!blob) throw new Error('Bild konnte nicht erzeugt werden');

    /* Läuft die App über den mitgelieferten Server, landet das Bild
       direkt im Ordner ausgabe/ — sonst lädt der Browser es herunter. */
    let gesichert = false;
    try{
      const antwort = await fetch('bild?name='+encodeURIComponent(name),
                                  {method:'POST',body:blob});
      if(antwort.ok){
        const ergebnis = await antwort.json();
        meldung('Bild gespeichert: '+ergebnis.datei);
        gesichert = true;
      }
    }catch(e){ /* kein Server mit Ablage */ }

    if(!gesichert){
      /* Direkt als Datei herunterladen — kein Teilen-Menü (AirDrop usw.) */
      const adresse = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = adresse; link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(()=> URL.revokeObjectURL(adresse), 60000);
      meldung('Bild gespeichert: '+name+' (Ordner „Downloads")');
    }
  }catch(e){
    meldung('Das Bild konnte nicht gespeichert werden: '+e.message);
  }finally{
    await socialZeichnen(false);
    knopf.disabled = false;
    knopf.textContent = 'Bild speichern';
    standbildZeit = vorher;
  }
}

function meldung(text){
  const box = $('#meldung');
  box.textContent = text; box.hidden = false;
  clearTimeout(meldung._takt);
  meldung._takt = setTimeout(()=> box.hidden = true, 9000);
}


/* --------------------------------------------------- Blatt einpassen --- */
const A4_BREIT = 210 * 96 / 25.4;   /* 210 mm in CSS-Pixeln */
const A4_HOCH  = 297 * 96 / 25.4;
function blattEinpassen(){
  const buehne = $('.buehne-inhalt');
  if(!buehne) return;
  const platz = buehne.clientWidth - 48;   /* Innenabstand der Bühne */
  $('#blatt').style.zoom = Math.min(1, Math.max(0.42, platz / A4_BREIT));
}

/* Den Satz so weit vergrößern, dass er die Seite füllt — und warnen,
   wenn selbst die kleinste Stufe nicht mehr auf eine Seite passt. */
function seitenPruefen(){
  const blatt = $('#blatt'), warnung = $('#seitenWarnung');
  if(!blatt || !warnung) return;
  const zoom = blatt.style.zoom || 1;
  blatt.style.zoom = 1;

  const messen = faktor => {
    blatt.style.setProperty('--s', faktor);
    blatt.style.minHeight = '0';
    const h = blatt.scrollHeight;
    blatt.style.minHeight = '';
    return h;
  };

  let s = 1, hoehe = messen(s);
  for(let runde=0; runde<7; runde++){
    const abweichung = (A4_HOCH - hoehe) / A4_HOCH;
    if(Math.abs(abweichung) < 0.012) break;
    const neu = Math.max(0.72, Math.min(1.5, s * Math.pow(A4_HOCH/hoehe, 0.55)));
    if(Math.abs(neu - s) < 0.004) break;
    s = neu; hoehe = messen(s);
  }
  /* Lieber knapp darunter bleiben als über den Rand laufen. */
  let schutz = 0;
  /* 1,5 % Luft: beim Drucken setzt der Browser Text minimal anders */
  while(hoehe > A4_HOCH*0.985 && s > 0.7 && schutz++ < 15){ s *= 0.975; hoehe = messen(s); }

  blatt.style.setProperty('--s', s.toFixed(3));
  blatt.style.zoom = zoom;
  warnung.hidden = hoehe <= A4_HOCH + 4;
}

/* ========================================================== STEUERUNG == */
let zeichenTakt = null;
function aktualisieren(editorNeu = true){
  if(editorNeu) sektionenAufbauen();
  karteZeichnen();
  titelEinpassen();
  seitenPruefen();
  sichern();
  clearTimeout(zeichenTakt);
  zeichenTakt = setTimeout(()=> socialZeichnen(false), 120);
}

function ansichtWechseln(neu){
  ansicht = neu;
  $$('#reiter button').forEach(b=> b.classList.toggle('aktiv', b.dataset.ansicht===neu));
  const papier = !!FORMATE[neu].papier;
  $('#btnAusgabe').textContent = papier ? 'Drucken / PDF' : 'Bild speichern';
  $('#btnBild').hidden = !papier;          /* bei A4/A5 zusätzlich als Bild */
  socialZeichnen(true);
}

function ausgeben(){
  if(FORMATE[ansicht].papier){ drucken(); return; }
  bildSpeichern();
}

/* Gedruckt wird das fertige Bild: Safari rechnet Millimeter, zoom und
   Scroll-Stand beim Drucken unzuverlässig, ein Bild auf Seitenbreite nicht. */
async function drucken(){
  const knopf = $('#btnAusgabe');
  knopf.disabled = true;
  try{
    /* Papierformat für diesen Druck setzen (A4 oder A5) */
    let regel = $('#druckSeite');
    if(!regel){ regel = document.createElement('style'); regel.id = 'druckSeite'; document.head.appendChild(regel); }
    regel.textContent = `@page{size:${FORMATE[ansicht].papier||'A4'} portrait;margin:5mm}`;
    await socialZeichnen(false);
    const blob = await new Promise(f=> $('#socialCanvas').toBlob(f,'image/jpeg',0.95));
    let bild = $('#druckBild');
    if(!bild){ bild = document.createElement('img'); bild.id = 'druckBild'; bild.alt = ''; document.body.appendChild(bild); }
    if(bild.src) URL.revokeObjectURL(bild.src);
    bild.src = URL.createObjectURL(blob);
    await bild.decode();
    window.print();
  }catch(e){
    meldung('Drucken ging nicht: '+e.message);
  }finally{
    knopf.disabled = false;
  }
}

function neueWoche(){
  if(!confirm('Neue Woche beginnen?\n\nDie Gänge bleiben erhalten, alle Gerichte werden geleert.\nSichere vorher die aktuelle Karte über „Karte sichern“, wenn du sie behalten willst.')) return;
  daten.sections.forEach(s=> s.items = []);
  const montag = naechsterMontag();
  daten.from = iso(montag);
  daten.to   = iso(new Date(montag.getTime()+4*864e5));
  editorAufbauen(); aktualisieren();
}
function naechsterMontag(){
  const d = new Date(); d.setHours(12,0,0,0);
  const tag = d.getDay();
  const bis = (8 - (tag||7)) % 7 || 7;
  return new Date(d.getTime()+bis*864e5);
}
function iso(d){ return d.toISOString().slice(0,10); }

/* menu.json enthält beide Karten. Ältere Dateien mit nur einer Karte
   werden weiterhin gelesen und zur Wochenkarte. */
function studioAusDatei(roh){
  const f = studioVorlage();
  f.stand = (roh && roh.stand) || '';
  if(roh && roh.karten){
    f.aktiv   = KARTEN.some(k=>k.id===roh.aktiv) ? roh.aktiv : 'wochenkarte';
    f.sprache = roh.sprache === 'en' ? 'en' : 'de';
    KARTEN.forEach(k=> f.karten[k.id] = karteAufbereiten(roh.karten[k.id], k.titel));
  }else{
    f.karten.wochenkarte = karteAufbereiten(roh,'Wochenkarte');
  }
  return f;
}

function exportieren(){
  const kopie = JSON.parse(JSON.stringify(studio));
  const blob = new Blob([JSON.stringify(kopie,null,2)],{type:'application/json'});
  const link = document.createElement('a');
  link.download = 'menu.json';
  link.href = URL.createObjectURL(blob);
  link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href),1000);
}

/* Was auf den Server geht: Die Sprache im Studio ist nur die Vorschau (Gäste sollen
   immer auf Deutsch starten), und Gerichtsfotos werden nirgends gezeigt — sie würden
   nur das Upload-Limit füllen. Die Karte im Browser bleibt unverändert. */
function veroeffentlichungsDaten(){
  const kopie = JSON.parse(JSON.stringify(studio));
  kopie.sprache = 'de';
  Object.values(kopie.karten||{}).forEach(k=> (k.sections||[]).forEach(s=> (s.items||[]).forEach(i=>{
    if(typeof i.bild === 'string' && i.bild.startsWith('data:')) delete i.bild;
  })));
  return kopie;
}

async function onlineStellen(){
  const dialog = $('#publishDialog');
  const button = $('#publishSenden');

  button.disabled = true;
  button.textContent = 'wird veröffentlicht …';
  try{
    const response = await fetch(new URL('publish.php', location.href), {
      method:'POST',
      headers:{'Content-Type':'application/json','X-Publish-Key':$('#publishKey').value.trim(),
               'X-Base-Stand':studio.stand || ''},
      body:JSON.stringify(veroeffentlichungsDaten()),
      cache:'no-store',
      credentials:'same-origin',
    });
    const result = await response.json().catch(()=>({}));
    if(response.status === 403 && result.error === 'invalid_key') throw new Error('Der Veröffentlichungsschlüssel stimmt nicht.');
    if(!response.ok){
      const meldungen = {
        key_not_configured:'Der Veröffentlichungsschlüssel ist auf dem Server noch nicht eingerichtet.',
        invalid_key:'Der Veröffentlichungsschlüssel stimmt nicht.',
        https_required:'Bitte das Studio über https://www.damimmo.de/menue-studio/ öffnen.',
        invalid_menu:'Die Karte enthält ungültige Daten oder ein nicht unterstütztes Bild.',
        payload_too_large:'Die Karte ist für den PHP-Upload zu groß (maximal 9 MB).',
        backup_failed:'Die Sicherung der bisherigen Karte ist fehlgeschlagen.',
        write_failed:'Der Server durfte menu.json nicht schreiben.',
        origin_not_allowed:'Der Browser hat keine gültige Herkunft mitgeschickt. Bitte das Studio direkt über https://www.damimmo.de/menue-studio/ öffnen (nicht aus einem Lesezeichen-Frame oder per Weiterleitung).',
        invalid_json:'Die Karte konnte nicht gelesen werden (ungültiges JSON). Bitte „Karte sichern“ drücken und die Seite neu laden.',
        stale_menu:'Die Karte wurde inzwischen von einem anderen Gerät veröffentlicht. Bitte „Karte sichern“ drücken, die Seite neu laden (der neue Stand wird geholt, deiner bleibt im Browser gesichert) und die Änderungen übertragen.',
        method_not_allowed:'Der Server erwartet eine andere Anfrageart — bitte publish.php prüfen.',
      };
      throw new Error(meldungen[result.error] || 'Der Server hat die Veröffentlichung abgelehnt.');
    }
    if(!result.ok || !result.stand) throw new Error('Der Server hat keine gültige Bestätigung zurückgegeben.');
    studio.stand = result.stand;
    sichern();
    dialog.close();
    meldung('Karte veröffentlicht. Zusatzkarte: www.damimmo.de/menue/karte.html');
  }catch(e){
    const status = $('#publishStatus');
    status.textContent = 'Veröffentlichung fehlgeschlagen: ' + e.message;
    status.hidden = false;
  }finally{
    button.disabled = false;
    button.textContent = 'Veröffentlichen';
  }
}

function publishDialogOeffnen(){
  const host = location.hostname.toLowerCase();
  const pfad = location.pathname;
  if(location.protocol !== 'https:' || !['damimmo.de','www.damimmo.de'].includes(host) || !/^\/menue-studio(?:\/|$)/.test(pfad)){
    meldung('Zum Veröffentlichen das Studio unter https://www.damimmo.de/menue-studio/ öffnen.');
    return;
  }
  $('#publishStatus').textContent = '';
  $('#publishStatus').hidden = true;
  $('#publishKey').value = '';
  $('#publishDialog').showModal();
}

function importieren(datei){
  const leser = new FileReader();
  leser.onload = ()=>{
    try{
      studio = studioAusDatei(JSON.parse(leser.result));
      daten  = studio.karten[studio.aktiv];
      kartenReiterMarkieren();
      editorAufbauen(); aktualisieren();
    }catch(e){ alert('Diese Datei konnte nicht gelesen werden:\n'+e.message); }
  };
  leser.readAsText(datei);
}

/* ------------------------------------------------------------- Ereignisse */
function verdrahten(){
  const bindung = [
    ['#fTitel', v=> daten.title=v], ['#fVon', v=> daten.from=v], ['#fBis', v=> daten.to=v],
    ['#fIntro', v=> daten.intro=v], ['#fFuss', v=> daten.footnote=v],

    ['#fName', v=> daten.restaurant.name=v], ['#fStrasse', v=> daten.restaurant.street=v],
    ['#fOrt', v=> daten.restaurant.city=v], ['#fTel', v=> daten.restaurant.phone=v],
  ];
  bindung.forEach(([wahl,setzen])=>{
    $(wahl).addEventListener('input',e=>{ setzen(e.target.value); aktualisieren(false); });
  });

  $('#fLayout').addEventListener('change',e=>{
    daten.layout = e.target.value; aktualisieren();
  });

  $('#fUeberschrift').addEventListener('change',e=>{
    daten.ueberschrift = e.target.value; aktualisieren();
  });

  $('#fLinien').addEventListener('change',e=>{
    daten.linienZeigen = e.target.checked; aktualisieren(false);
  });

  $('#fQR').addEventListener('change',e=>{
    daten.qrZeigen = e.target.checked; aktualisieren(false);
  });

  $('#fAdresse').addEventListener('change',e=>{
    daten.adresseZeigen = e.target.checked; aktualisieren(false);
  });
  $('#fLogoZeigen').addEventListener('change',e=>{
    daten.logoZeigen = e.target.checked; aktualisieren(false);
    socialZeichnen(true);
  });

  $('#fDatumZeigen').addEventListener('change',e=>{
    daten.datumZeigen = e.target.checked; aktualisieren(false);
  });
  $('#fTageZeigen').addEventListener('change',e=>{
    daten.tageZeigen = e.target.checked; aktualisieren(false);
  });

  $('#kartenReiter').addEventListener('click',e=>{
    const knopf = e.target.closest('button[data-karte]');
    if(knopf) karteWechseln(knopf.dataset.karte);
  });

  $('#fSprache').addEventListener('change',e=>{
    studio.sprache = e.target.value === 'en' ? 'en' : 'de';
    document.documentElement.lang = studio.sprache === 'en' ? 'en' : 'de';
    sektionenAufbauen();          /* englische Felder ein- oder ausblenden */
    aktualisieren();
  });

  $('#hgWahl').addEventListener('click',e=>{
    const knopf = e.target.closest('button[data-hg]');
    if(!knopf) return;
    daten.hintergrund = knopf.dataset.hg;
    hintergrundMarkieren();
    aktualisieren(false);
    socialZeichnen(true);
  });

  $('#fStil').addEventListener('change',e=>{
    daten.stil = e.target.value; aktualisieren(false);
    socialZeichnen(true);
  });

  $$('#reiter button').forEach(b=> b.addEventListener('click',()=> ansichtWechseln(b.dataset.ansicht)));
  $('#btnAusgabe').addEventListener('click',ausgeben);
  $('#btnBild').addEventListener('click',bildSpeichern);
  $('#btnUmschalten').addEventListener('click',()=>{
    const an = !document.body.classList.contains('zeigt-vorschau');
    document.body.classList.toggle('zeigt-vorschau', an);
    $('#btnUmschalten').textContent = an ? 'Bearbeiten' : 'Vorschau';
    scrollTo(0,0);
    /* Nach dem Wechsel stimmen die Maße erst neu — und in der Vorschau
       soll sofort das fertige Bild stehen, nicht der Aufbau. */
    requestAnimationFrame(()=>{
      socialZeichnen(true).then(()=> standbild());
    });
  });

  $('#btnNeueWoche').addEventListener('click',neueWoche);
  $('#btnExport').addEventListener('click',exportieren);
  $('#btnVeroeffentlichen').addEventListener('click',publishDialogOeffnen);
  $('#publishAbbrechen').addEventListener('click',()=> $('#publishDialog').close());
  $('#publishForm').addEventListener('submit',e=>{ e.preventDefault(); onlineStellen(); });
  $('#btnImport').addEventListener('click',()=> $('#dateiImport').click());
  $('#dateiImport').addEventListener('change',e=>{ if(e.target.files[0]) importieren(e.target.files[0]); e.target.value=''; });

  $('#fLogo').addEventListener('change',e=>{
    const datei = e.target.files[0];
    if(!datei) return;
    if(datei.size > 2.5e6){ alert('Bitte ein Logo unter 2,5 MB wählen.'); return; }
    const leser = new FileReader();
    leser.onload = async ()=>{
      daten.logo = leser.result;
      await bildLaden('logo:'+kurzHash(daten.logo), daten.logo);   /* auch für Post und Story */
      logoVorschauSetzen();
      aktualisieren(false);
      socialZeichnen(true);
    };
    leser.readAsDataURL(datei);
  });
  $('#btnLogoWeg').addEventListener('click',()=>{
    daten.logo = null; $('#fLogo').value=''; logoVorschauSetzen(); aktualisieren(false);
    socialZeichnen(true);
  });

}

/* ------------------------------------------------------------------ Start */
async function start(){
  studio = laden();

  /* menu.json ist die mitgelieferte Karte. Trägt sie einen neueren „stand"
     als das, was im Browser liegt, wird sie übernommen — so steht eine neu
     eingepflegte Karte sofort im Editor. Der alte Stand wird vorher
     weggesichert und lässt sich über „Karte laden" zurückholen. */
  try{
    const antwort = await fetch(new URL('/menue/menu.json', location.origin),{cache:'no-store'});
    if(antwort.ok){
      const datei = await antwort.json();
      const neuerStand = datei.stand || '';
      if(!studio){
        studio = studioAusDatei(datei);
      }else if(neuerStand && neuerStand !== studio.stand){
        try{ localStorage.setItem('damimmo.studio.vorher', JSON.stringify(studio)); }catch(e){}
        studio = studioAusDatei(datei);
        setTimeout(()=> meldung('Karte vom '+neuerStand+' geladen. Der vorherige Stand liegt gesichert im Browser.'), 600);
      }
    }
  }catch(e){ /* offline geöffnet — gespeicherter Stand genügt */ }

  if(!studio) studio = studioVorlage();
  daten = studio.karten[studio.aktiv];

  verdrahten();
  kartenReiterMarkieren();
  editorAufbauen();
  karteZeichnen();
  blattEinpassen();
  titelEinpassen();
  seitenPruefen();
  window.addEventListener('resize', ()=>{ blattEinpassen(); titelEinpassen(); });

  bilderVorbereiten();
  if(document.fonts && document.fonts.ready){
    /* Das Bild wird auf Canvas gezeichnet — dafür jede Schrift ausdrücklich
       laden, sonst malt Safari mit einer Ersatzschrift. */
    await Promise.all([
      '600 40px "Playfair Display"', '500 40px "Playfair Display"',
      '400 40px Poppins', '500 40px Poppins', '600 40px Poppins', 'italic 400 40px Poppins',
    ].map(f=> document.fonts.load(f).catch(()=>{})));
    await document.fonts.ready;
    socialZeichnen(true);
  }
}
start();
