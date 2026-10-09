/* ==========================================================================
   Da Mimmo · Social-Bühne
   Baut aus den Kartendaten dieselbe Karte wie der A4-Aushang — nur im
   Instagram-Format und in Bewegung. Standbild = letztes Bild der Szene.
   ========================================================================== */
const Social = (()=>{

/* ------------------------------------------------------------- Kurven --- */
const E = {
  raus:  t => 1 - Math.pow(1-t,3),
  rueck: t => { const c=1.70158+1, u=t-1; return 1 + (c+1)*u*u*u + c*u*u; },
};
/* Hinweise stehen in zwei Zeilen: eigene Zeilenumbrüche gelten,
   sonst kommt der letzte Satz in die zweite Zeile. */
function hinweisZeilen(text){
  const t = String(text||'').trim();
  /* Eigene Umbrüche haben Vorrang — jede Zeile bleibt eine Zeile. */
  if(t.includes('\n')) return t.split('\n').map(z=>z.trim()).filter(Boolean);
  const saetze = t.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [t];
  if(saetze.length < 2) return [t];
  return [saetze.slice(0,-1).join('').trim(), saetze[saetze.length-1].trim()];
}
const spanne = (t,ab,dauer)=> Math.max(0,Math.min(1,(t-ab)/dauer));

/* -------------------------------------------------------------- Welten --- */
/* Gill Sans ist auf dem Mac vorhanden, aber nicht als Webschrift lizenziert.
   Geräte ohne sie bekommen eine ähnliche humanistische Schrift. */
const KARTENSCHRIFT = '"Gill Sans","Gill Sans MT","Gill Sans Nova",Lato,Poppins,Inter,sans-serif';
let punktGroesse = 0;      /* zuletzt gesetzte Schriftgröße in pt */

const WELTEN = {
  nacht: { tinte:'#FFFFFF', weich:'#CFC3B0', adresse:'#DCD2C2',
           gold:'#E0B463', goldHell:'#EFD9A6', gang:'#F0E4CE',
           schleier:[[0,.94],[.34,.90],[.52,.72],[.68,.34],[.82,.12],[1,.30]],
           foto:true, grund:'#120E0A', hell:false },
  dunkel:{ tinte:'#FFFFFF', weich:'#CFC3B0', adresse:'#DCD2C2',
           gold:'#E0B463', goldHell:'#EFD9A6', gang:'#F0E4CE',
           schleier:null, foto:false, grund:'#14100B', hell:false },
  hell:  { tinte:'#161210', weich:'#574E43', adresse:'#574E43',
           gold:'#7A4710', goldHell:'#6B3C08', gang:'#241D14',
           schleier:null, foto:false, grund:'#FBF6EC', hell:true },
  /* Rein weiß — für Papier, das nicht vollflächig bedruckt werden soll */
  weiss: { tinte:'#161210', weich:'#574E43', adresse:'#574E43',
           gold:'#7A4710', goldHell:'#6B3C08', gang:'#241D14',
           schleier:null, foto:false, grund:'#FFFFFF', hell:true, schlicht:true },
};

/* Mittiges Layout auf Papier: Start bei 9,5 pt, bei wenig Text wächst die Schrift bis höchstens 14 pt. */
const FEST_MAX = 14/9.5;

/* ------------------------------------------------------------ Körnung --- */
let kornMuster = null;
function korn(ctx){
  if(!kornMuster){
    const k = document.createElement('canvas'); k.width=k.height=160;
    const kx = k.getContext('2d');
    const bild = kx.createImageData(160,160);
    for(let i=0;i<bild.data.length;i+=4){
      const w = 118 + Math.random()*46;
      bild.data[i]=bild.data[i+1]=bild.data[i+2]=w; bild.data[i+3]=255;
    }
    kx.putImageData(bild,0,0);
    kornMuster = ctx.createPattern(k,'repeat');
  }
  return kornMuster;
}

/* ------------------------------------------------------------- Helfer --- */
const mess = document.createElement('canvas').getContext('2d');

function umbrechen(ctx,text,maxBreite){
  /* Ein selbst gesetzter Umbruch (Eingabetaste) gilt — dahinter geht es
     in einer neuen Zeile weiter. */
  const roh = String(text);
  if(roh.includes('\n')){
    return roh.split('\n').flatMap(stueck=>
      stueck.trim() ? umbrechen(ctx, stueck, maxBreite) : ['']);
  }
  /* Gedankenstrich nie an den Zeilenanfang: er hängt am Wort davor.
     Geteilt wird nur an normalen Leerzeichen, nicht am geschützten. */
  const woerter = roh.replace(/ ([—–]) /g,'\u00A0$1 ')
                  .split(/[ \t]+/).filter(Boolean);
  const zeilen=[]; let zeile='';
  for(const w of woerter){
    const versuch = zeile ? zeile+' '+w : w;
    if(ctx.measureText(versuch).width > maxBreite && zeile){ zeilen.push(zeile); zeile=w; }
    else zeile = versuch;
  }
  if(zeile) zeilen.push(zeile);
  return zeilen.length?zeilen:[''];
}
/* Wie umbrechen, aber gleich lange Zeilen: die Breite wird so weit
   verringert, wie die Zeilenzahl gleich bleibt — kein einzelnes Wort
   allein in der letzten Zeile. */
function ausgewogen(ctx,text,maxBreite){
  const zeilen = umbrechen(ctx,text,maxBreite);
  if(zeilen.length < 2) return zeilen;
  /* Die Zeilen sollen die Breite nutzen. Nur wenn am Ende ein kurzer
     Rest allein stünde, wird gleichmäßig verteilt. */
  const letzte = ctx.measureText(zeilen[zeilen.length-1]).width;
  if(letzte > maxBreite*0.38) return zeilen;
  let lo = maxBreite*0.3, hi = maxBreite;
  for(let i=0;i<14;i++){
    const mitte = (lo+hi)/2;
    const probe = umbrechen(ctx,text,mitte);
    const passt = probe.length === zeilen.length &&
                  probe.every(z=> ctx.measureText(z).width <= mitte);
    if(passt) hi = mitte; else lo = mitte;
  }
  return umbrechen(ctx,text,hi);
}
/* **fett** im Text: in Stücke zerlegen */
function segmente(text){
  return String(text||'').split(/\*\*/).map((t,i)=> ({text:t, fett: i%2===1}))
         .filter(s=> s.text.length);
}
/* Umbruch für Stücke mit gemischter Strichstärke */
function umbrechenSeg(ctx, stuecke, maxBreite, schrift){
  const zeilen = []; let zeile = []; let breite = 0;
  stuecke.forEach(st=>{
    ctx.font = schrift(st.fett);
    st.text.split(/(\s+)/).forEach(w=>{
      if(!w) return;
      if(w === '\n'){ zeilen.push(zeile); zeile = []; breite = 0; return; }
      const b = ctx.measureText(w).width;
      if(breite + b > maxBreite && zeile.length && w.trim()){
        zeilen.push(zeile); zeile = []; breite = 0;
        if(!w.trim()) return;
      }
      zeile.push({text:w, fett:st.fett, breite:b}); breite += b;
    });
  });
  if(zeile.length) zeilen.push(zeile);
  return zeilen;
}

function gesperrt(text,px){
  const raum = String.fromCharCode(8202).repeat(Math.max(1,Math.round(px)));
  return String(text).split('').join(raum);
}
function goldSchrift(ctx,y,hoehe,hell){
  const v = ctx.createLinearGradient(0,y-hoehe*0.8,0,y+hoehe*0.15);
  if(hell){ v.addColorStop(0,'#A5651B'); v.addColorStop(1,'#6B3C08'); }
  else    { v.addColorStop(0,'#F5DFA8'); v.addColorStop(.45,'#E0B463'); v.addColorStop(1,'#C2873A'); }
  return v;
}
function pille(ctx,x,y,b,h,r){
  ctx.beginPath();
  if(ctx.roundRect) ctx.roundRect(x,y,b,h,r); else ctx.rect(x,y,b,h);
}

/* Kleine stehende Raute als Zierpunkt */
function raute(ctx,x,y,r,farbe,alpha){
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = farbe;
  ctx.beginPath(); ctx.moveTo(x,y-r); ctx.lineTo(x+r,y); ctx.lineTo(x,y+r); ctx.lineTo(x-r,y);
  ctx.closePath(); ctx.fill(); ctx.restore();
}

/* Telefonhörer, passend zum Knopf auf der Karte */
const TELEFON_PFAD = 'M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1.1z';

/* ========================================================== Szene bauen = */
function szeneKarte(format, daten, bilder, welt, sVorgabe){
  const {w:W,h:H} = format;
  punktGroesse = 0;      /* gilt nur für den festen Satz, sonst zurücksetzen */
  const P = WELTEN[welt] || WELTEN.nacht;
  const teile = [];
  const rand = W*0.06;
  const hoch = H/W > 1.5;

  const gerichte = [];
  (daten.sections||[]).forEach(s=>{
    const sichtbar = (s.items||[]).filter(i=>i.name||i.desc);
    if(sichtbar.length) gerichte.push({gang:s.label||'', rahmen:!!s.rahmen, links:!!s.links, posten:sichtbar});
  });
  const anzahl = gerichte.reduce((n,g)=>n+g.posten.length,0) || 1;

  /* Startgröße schätzen, die Feinabstimmung macht der Aufrufer */
  const kopfHoehe = hoch ? H*0.30 : H*0.28;
  const fussHoehe = hoch ? H*0.30 : H*0.26;
  const proGericht = (H - kopfHoehe - fussHoehe) / (anzahl + gerichte.length*0.8);
  const s = sVorgabe || Math.max(0.55, Math.min(1.25, proGericht/120));

  /* Bei fester Schriftgröße (mittig auf Papier) darf der Kopf nicht
     mitwachsen — sonst steht ein riesiger Titel über winzigen Zeilen. */
  const festerSatz = daten.layout === 'zentriert' && !!format.papier;
  const sk = festerSatz ? Math.min(1,s)*0.6 : s;     /* der Kopf wächst nicht mit der Schrift */
  const ohneFuss = daten.fusszeileAus === true || daten.fusszeile === false;

  /* ---------------- Kopf ---------------- */
  let y = hoch ? H*0.075 : H*0.075;      /* etwas mehr Luft oben */

  /* Das Logo steht ganz oben, über der Anschrift (Schalter „Logo“). */
  if(daten.logoZeigen !== false){
    teile.push({typ:'marke', x:W/2, y, hoehe:84*sk, ab:0.12});
    /* Text steht auf der Grundlinie — die Schriftgröße gehört mit in den Abstand */
    y += 84*sk + 16*sk + 28*sk;
  }

  const adresse = daten.adresseZeigen === false ? '' :
                  [daten.restaurant.street, daten.restaurant.city]
                  .filter(Boolean).join('   ·   ');
  if(adresse){
    teile.push({typ:'text', text:adresse, x:W/2, y, mitte:true,
                font:`400 ${Math.round(28*sk)}px Poppins, Inter, sans-serif`,
                farbe:P.adresse, ab:0.3});
    y += 54*sk;
  }

  /* Überschrift: keine (Standard), Text oder Grafik.
     Die Grafik ist flach gesetzt und kostet nur halb so viel Höhe. */
  const art = daten.ueberschrift || 'keine';
  if(art === 'bild' && daten.titelBild){
    const bild = daten.titelBild;
    const hoehe = Math.round(64*sk);
    const breite = hoehe * (bild.width/bild.height);
    teile.push({typ:'titelbild', bild, x:W/2, y, b:Math.min(breite, W*0.58),
                h:Math.min(breite, W*0.58)*(bild.height/bild.width), ab:0.4});
    y += Math.min(breite, W*0.58)*(bild.height/bild.width) + 22*sk;
  }

  const titelText = art === 'text' ? String(daten.title||'').trim().toUpperCase() : '';
  if(titelText){
  let titelGr = Math.round(96*sk);
  const titelBreite = g => {
    mess.font = `600 ${g}px "Playfair Display", Georgia, serif`;
    return mess.measureText(titelText).width + g*0.04*titelText.length;
  };
  if(titelBreite(titelGr) > W-rand*2)
    titelGr = Math.floor(titelGr * (W-rand*2)/titelBreite(titelGr));
  teile.push({typ:'titel', text:titelText, x:W/2, y,
              groesse:titelGr, maxBreite:W-rand*2, ab:0.45});
  y += titelGr*1.04;
  }

  if(daten.zeitraum){
    teile.push({typ:'datum', text:daten.zeitraum, x:W/2, y:y+44*sk,
                groesse:Math.round(52*sk), ab:0.7});
    y += 84*sk;
  }
  if(daten.wochentage){
    teile.push({typ:'band', text:gesperrt(daten.wochentage.toUpperCase(),3), x:W/2, y:y+14*sk,
                groesse:Math.round(25*sk), ab:0.85});
    y += 34*sk;
  }
  y += 78*sk;       /* Abstand Kopf → erste Speise */

  /* ---------------- Gerichte ---------------- */
  let ab = 1.1;
  let schlussTeile = [];      /* Teile des Schlusshinweises (Preiszeile) */
  /* Groß genug fürs Handy: das Bild wird dort auf ~⅓ verkleinert */
  const symbolR   = 32*s;
  const textX     = rand + symbolR*2 + 10*s;
  const nameGr    = Math.round(42*s);
  const descGr    = Math.round(36*s);
  const preisGr   = Math.round(42*s);

  /* Breite des längsten Preises = gemeinsame Preisspalte */
  mess.font = `600 ${preisGr}px Poppins, Inter, sans-serif`;
  const preisSpalte = Math.max(0, ...gerichte.flatMap(g=> g.posten.map(p=>
    p.price!=null ? mess.measureText(daten.preisText(p.price)).width : 0)));

  /* Zweites Layout nach der Vorlage: alles mittig, Preis hinter dem Namen,
     keine Symbole, feine Trennlinien zwischen den Blöcken. Passt viel mehr
     auf eine Seite. */
  if(daten.layout === 'zentriert'){
    /* Auf A4/A5 wird in Punkt gesetzt: 1080 Bildpunkte = 210 mm = 595 pt.
       9,5 pt für die Gerichte, 8 pt für die Beschreibung — fest, nicht
       automatisch verkleinert. */
    const ptPx = W/595.28;
    const fest = !!format.papier;
    /* 9,5 pt ist die Wunschgröße und zugleich die Obergrenze: passt der Satz
       nicht auf die Seite, geht er gemeinsam herunter — abgeschnitten wird
       nichts. Die wirkliche Größe steht unter der Vorschau. */
    const gr    = fest ? 9.5*ptPx*Math.min(FEST_MAX,s) : 33*s;
    const nameZ = Math.round(gr);
    /* Wie auf der Vorlage: die Beschreibung ist sogar eine Spur größer als
       der Gerichtname (dort 9,6 gegen 9,41 pt) — Versalien wirken ohnehin
       größer als Kleinbuchstaben. */
    const descZ = Math.round(fest ? gr*1.06 : 27*s);
    const z     = fest ? gr/33 : s;             /* Abstände passend dazu */
    punktGroesse = fest ? nameZ/ptPx : 0;

    /* Steht die Grafik seitlich, bekommt sie einen eigenen Streifen links —
       der Satz rückt nach rechts und verliert keine Höhe. */
    /* „daneben": die Grafik liegt waagerecht im freien Raum links neben dem
       ersten Block. Der Satz bleibt mittig und rutscht keinen Punkt. */
    const daneben = daten.ueberschrift === 'seitlich' && daten.titelBild;
    const breite = W - rand*2;
    const mitte  = W/2;
    let b1Breite = 0, b1Oben = null, b1Unten = null, ersterBlock = true;
    let schlussOben = null;
    let zuerst = true;

    gerichte.forEach(gruppe=>{
      if(!zuerst){
        /* Zwischen den Blöcken steht ein Absatz. Eine feine Linie nur,
           wenn sie ausdrücklich gewünscht ist (Schalter „Trennlinien"). */
        if(daten.linienZeigen && !gruppe.gang){
          teile.push({typ:'trennlinie', x:mitte, y:y+14*z, breite:breite*0.92, ab});
          y += 28*z;
        }else{
          y += 34*z;
        }
      }
      zuerst = false;

      if(gruppe.gang){
        teile.push({typ:'gang', text:gruppe.gang.toUpperCase(), x:mitte, y,
                    groesse:Math.round(30*z), breite, zier:2, ab});
        y += 56*z; ab += 0.08;
      }

      const schlussHinweis = gruppe.links && gruppe.posten.length === 1
                             && !(gruppe.posten[0].name||'').trim();
      if(schlussHinweis) schlussOben = y;

      if(gruppe.links){
        /* Linksbündiger Fließtext wie der Weinteil der Vorlage */
        const schrift = f => `${f?600:400} ${descZ}px ${KARTENSCHRIFT}`;
        gruppe.posten.forEach(gericht=>{
          const preis = gericht.price!=null ? daten.preisText(gericht.price) : '';
          const kopfText = '**' + (gericht.name||'') + '**' + (preis ? '  ·  ' + preis : '');
          const zeilen = [
            ...umbrechenSeg(mess, segmente(kopfText), breite, schrift),
            ...(gericht.desc ? umbrechenSeg(mess, segmente(gericht.desc), breite, schrift) : []),
          ];
          const hoehe = zeilen.length*descZ*1.25 + 10*z;
          const teil = {typ:'absatz', x:rand, y, zeilen, groesse:descZ, ab, hoehe};
          teile.push(teil);
          if(schlussHinweis) schlussTeile.push(teil);
          y += hoehe + 14*z;        /* Absatz zwischen den Einträgen */
          ab += 0.08;
        });
        y -= 1*z;
        if(ersterBlock){ b1Unten = y; ersterBlock = false; }
        return;
      }

      gruppe.posten.forEach(gericht=>{
        const preis = gericht.price!=null ? daten.preisText(gericht.price) : '';
        const kopf = (gericht.name||'').toUpperCase() + (preis ? '  •  ' + preis : '');
        mess.font = `500 ${nameZ}px ${KARTENSCHRIFT}`;
        /* leichte Sperrung über den Zeichenabstand, nicht über Leerzeichen —
           sonst zerfällt das Wort und bricht an falschen Stellen um */
        if('letterSpacing' in mess) mess.letterSpacing = Math.round(nameZ*0.05)+'px';
        const kopfZeilen = ausgewogen(mess, kopf, breite).slice(0,2);
        if('letterSpacing' in mess) mess.letterSpacing = '0px';

        mess.font = `400 ${descZ}px ${KARTENSCHRIFT}`;
        let descZeilen = [];
        if(gericht.desc){
          /* Im mittigen Layout wird nichts gekürzt — auch lange
             Weinbeschreibungen stehen vollständig da. */
          descZeilen = ausgewogen(mess, gericht.desc, breite*0.94).slice(0,10);
        }

        if(ersterBlock){
          if(b1Oben === null) b1Oben = y;
          mess.font = `500 ${nameZ}px ${KARTENSCHRIFT}`;
          kopfZeilen.forEach(zl=> b1Breite = Math.max(b1Breite, mess.measureText(zl).width));
          mess.font = `400 ${descZ}px ${KARTENSCHRIFT}`;
          descZeilen.forEach(zl=> b1Breite = Math.max(b1Breite, mess.measureText(zl).width));
        }
        const hoehe = kopfZeilen.length*nameZ*1.18 + descZeilen.length*descZ*1.2 + 8*z;
        teile.push({typ:'gerichtZ', x:mitte, y, kopfZeilen, descZeilen,
                    merkmale: gericht.merkmale||[],
                    nameGr:nameZ, descGr:descZ, ab, hoehe});
        y += hoehe; ab += 0.1;
      });
      /* der Nachlauf des letzten Gerichts zählt nicht zum Blockende */
      y -= 8*z;
      if(ersterBlock){ b1Unten = y; ersterBlock = false; }
    });

    if(daneben && b1Oben !== null){
      /* So breit, wie neben dem ersten Block wirklich Platz ist */
      const frei = (W - b1Breite)/2 - rand - 14*z;
      const verh = daten.titelBild.height/daten.titelBild.width;
      const b = Math.max(0, Math.min(frei, W*0.22)) * 0.7;   /* 30 % kleiner */
      if(b > W*0.08){
        teile.push({typ:'titelbild', bild:daten.titelBild,
                    x: rand + b/2, y: (b1Oben + b1Unten)/2 - b*verh/2,
                    b, h: b*verh, ab:0.4});
      }
    }

  }else{

  gerichte.forEach(gruppe=>{
    const blockStart = y;
    const eingerueckt = gruppe.rahmen ? 18*s : 0;

    /* „Speisen“ kommt ohne Überschrift (die App schickt sie leer),
       die Getränke behalten ihre. */
    if(gruppe.gang){
      y += eingerueckt;
      teile.push({typ:'gang', text:gruppe.gang.toUpperCase(), x:W/2, y,
                  groesse:Math.round(34*s), breite:W-rand*2,
                  zier: daten.zierStil === undefined ? 1 : daten.zierStil, ab});
      y += 62*s; ab += 0.1;
    }

    gruppe.posten.forEach(gericht=>{
      mess.font = `600 ${preisGr}px Poppins, Inter, sans-serif`;
      const preis = gericht.price!=null ? daten.preisText(gericht.price) : '';
      const preisB = preis ? mess.measureText(preis).width : 0;

      mess.font = `600 ${nameGr}px Poppins, Inter, sans-serif`;
      const platz = W - rand - textX - preisB - 14*s - eingerueckt;
      const nameZeilen = ausgewogen(mess, gericht.name||'', platz).slice(0,2);

      mess.font = `italic 400 ${descGr}px Poppins, Inter, sans-serif`;
      let descZeilen = [];
      if(gericht.desc){
        /* Die Beschreibung endet vor der Preisspalte, nie unter dem Preis */
        const alle = ausgewogen(mess, gericht.desc, W - rand - textX - preisSpalte - 14*s - eingerueckt);
        descZeilen = alle.slice(0,4);
        if(alle.length > 4) descZeilen[3] = descZeilen[3].replace(/[,;]?$/,'') + ' …';
      }

      const hoehe = nameZeilen.length*nameGr*1.16 + descZeilen.length*descGr*1.32 + 30*s;   /* fester Abstand zum nächsten Gericht */
      teile.push({typ:'gericht', gericht, symbol:gericht.symbol,
                  x:textX+eingerueckt, symbolX:rand+symbolR+eingerueckt, y,
                  rechts:W-rand-eingerueckt, symbolR,
                  nameGr, descGr, preisGr, preis, nameZeilen, descZeilen,
                  ab, skala:s, hoehe});
      y += hoehe; ab += 0.14;
    });

    if(gruppe.rahmen){
      y += eingerueckt;
      teile.push({typ:'rahmen', x:rand-6*s, y:blockStart, b:W-(rand-6*s)*2,
                  h:y-blockStart, ab:ab-0.3});
    }
    y += 26*s;
  });

  }

  /* Kurze Erklärung der Merkmale, sobald eines benutzt wird.
     Sie steht unter den Gerichten, der Preishinweis bleibt die letzte Zeile. */
  const benutzt = [];
  gerichte.forEach(g=> g.posten.forEach(p=> (p.merkmale||[]).forEach(m=>{
    if(!benutzt.includes(m)) benutzt.push(m);
  })));
  if(benutzt.length && typeof MERKMALE !== 'undefined'){
    const lg = Math.round((daten.layout === 'zentriert' && format.papier ? 9.5*(W/595.28)*Math.min(FEST_MAX,s) : 26*s) * 0.92);
    const hoehe = lg*1.9 + 16*s;
    if(schlussTeile.length){
      /* Die Erklärung steht über dem Preishinweis, nicht darunter */
      const platz = schlussTeile[0].y;
      schlussTeile.forEach(t=> t.y += hoehe);
      teile.push({typ:'legende', x:W/2, y:platz + 16*s, merkmale:benutzt, groesse:lg, ab: ab+0.2});
    }else{
      teile.push({typ:'legende', x:W/2, y:y+16*s, merkmale:benutzt, groesse:lg, ab: ab+0.2});
    }
    y += hoehe;
  }

  const listenEnde = y;

  /* ---------------- Fuß ---------------- */
  /* Von unten nach oben setzen: Knopf, Kleingedrucktes, Spruch.
     Der Spruch wächst nach unten — seine Höhe wird deshalb vorher gerechnet. */
  const fussS  = Math.min(sk, 1.12);       /* der Fuß wächst nur gedämpft mit */
  const rufGr  = Math.round(32*fussS);
  /* Unten steht (wenn gewählt) der QR-Code in der Mitte. */
  const mitQR    = !!daten.qrBild;
  const fussZeile = !ohneFuss && mitQR;
  /* Die Zeile muss samt QR-Feld innerhalb des Zierrahmens (W*0.035) bleiben. */
  const zeileHalb = rufGr*2.4 * 1.06;
  const rufY   = fussZeile ? Math.min(H - H*0.068, H - W*0.035 - zeileHalb - H*0.012)
                           : H - (hoch ? H*0.068 : H*0.072);
  if(fussZeile){
    teile.push({typ:'ruf', qr: true,
                x:W/2, y:rufY, groesse:rufGr,
                breite:Math.min(W-rand*2, 780*fussS), ab:ab+0.35});
  }

  const hinweisGr = Math.round(27*fussS);
  const praefix   = (daten.hinweisPraefix || 'WICHTIGE HINWEISE:') + ' ';
  /* Der QR-Code ist höher als der Knopf — die Hinweiszeile muss darüber
     bleiben, sonst klebt sie am weißen Feld des Codes. */
  const rufHoehe = rufGr*2.4;
  const fussHoch = rufHoehe*1.0;
  let hinweisOben = ohneFuss ? H - H*0.03
                  : fussZeile ? rufY - fussHoch - 34*fussS
                  : rufY;          /* ohne Logo und QR rückt der Hinweis nach unten */
  if(daten.footnote && !ohneFuss){
    mess.font = `400 ${hinweisGr}px Poppins, Inter, sans-serif`;
    const stuecke = hinweisZeilen(daten.footnote);
    const zeilen = stuecke.flatMap((st,i)=>
      umbrechen(mess, (i===0 ? praefix : '') + st, W-rand*2));
    hinweisOben -= (zeilen.length-1)*hinweisGr*1.45;
    teile.push({typ:'hinweise', zeilen, praefix:praefix.trim(), x:W/2, y:hinweisOben,
                groesse:hinweisGr, ab:ab+0.25});
  }

  if(daten.claim){
    const claimGr = Math.round(46*fussS);
    mess.font = `600 ${claimGr}px "Dancing Script", cursive`;
    const claimZeilen = umbrechen(mess, daten.claim, W*0.46);
    const claimHoehe  = (claimZeilen.length-1)*claimGr*0.95 + claimGr*1.35;  /* mit Herz */
    teile.push({typ:'claim', text:daten.claim, zeilen:claimZeilen,
                x:rand+10*fussS, y:hinweisOben - 34*fussS - claimHoehe,
                groesse:claimGr, ab:ab+0.15});
  }
  const claimY = hinweisOben - 34*fussS;

  return { teile, dauer: ab + 2.0, welt:P, s, punkt: punktGroesse,
           hoehe: listenEnde, rand, hinweisOben,
           /* Ohne Fußzeile darf der Satz bis kurz über den Zierrahmen laufen —
              sonst bleibt unten Platz ungenutzt und die Schrift wird grundlos
              kleiner gerechnet. */
           zielHoehe: ohneFuss ? H*0.962
                    : (daten.claim ? claimY - 150*s : hinweisOben - 90*s) };
}

/* ============================================================= Zeichnen = */
function zeichnen(ctx, szene, format, t, daten){
  const {w:W,h:H} = format;
  const P = szene.welt;

  ctx.fillStyle = P.grund; ctx.fillRect(0,0,W,H);

  /* Foto-Hintergrund wie auf der gedruckten Karte */
  if(P.foto && daten.hintergrund){
    const bild = daten.hintergrund;
    const zoom = 1.03 + 0.022*Math.sin(t*0.22);
    const skala = Math.max(W/bild.width, H/bild.height) * zoom;
    const b = bild.width*skala, h = bild.height*skala;
    ctx.drawImage(bild, (W-b)/2, (H-h)/2, b, h);
  }

  /* Schleier für die Lesbarkeit */
  if(P.schleier){
    const v = ctx.createLinearGradient(0,0,0,H);
    P.schleier.forEach(([pos,alpha])=> v.addColorStop(pos,`rgba(12,9,6,${alpha})`));
    ctx.fillStyle=v; ctx.fillRect(0,0,W,H);
    const licht = ctx.createRadialGradient(W*0.5,H*0.05,0,W*0.5,H*0.05,W*0.9);
    licht.addColorStop(0,'rgba(227,184,95,.10)'); licht.addColorStop(1,'rgba(227,184,95,0)');
    ctx.fillStyle=licht; ctx.fillRect(0,0,W,H);
  }else if(P.foto === false && !P.hell){
    const licht = ctx.createRadialGradient(W*0.5,H*0.08,0,W*0.5,H*0.08,W*0.95);
    licht.addColorStop(0,'rgba(227,184,95,.12)'); licht.addColorStop(1,'rgba(227,184,95,0)');
    ctx.fillStyle=licht; ctx.fillRect(0,0,W,H);
  }

  /* Sockel unten, damit Spruch und Knopf stehen */
  if(P.foto){
    const sockel = ctx.createLinearGradient(0,H*0.62,0,H);
    sockel.addColorStop(0,'rgba(10,7,5,0)');
    sockel.addColorStop(.45,'rgba(10,7,5,.5)');
    sockel.addColorStop(1,'rgba(10,7,5,.85)');
    ctx.fillStyle=sockel; ctx.fillRect(0,H*0.62,W,H*0.38);
  }

  /* Zierrahmen */
  const r = W*0.035;
  const rahmenAuf = E.raus(spanne(t,0.05,0.9));
  ctx.save();
  ctx.globalAlpha = rahmenAuf*0.6;
  ctx.strokeStyle = P.gold; ctx.lineWidth = 1.6;
  ctx.strokeRect(r,r,W-r*2,H-r*2);
  ctx.restore();

  szene.teile.forEach(teil=> teilZeichnen(ctx, teil, t, P, format, szene, daten));

  /* Körnung */
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  if(!P.schlicht){                       /* weißer Grund bleibt ohne Körnung */
    ctx.globalAlpha = P.foto ? 0.045 : 0.035;
    ctx.fillStyle = korn(ctx);
    ctx.translate((t*13)%160-160,(t*7)%160-160);
    ctx.fillRect(0,0,W+160,H+160);
  }
  ctx.restore();
}

function teilZeichnen(ctx, teil, t, P, format, szene, daten){
  const {w:W} = format;
  const auf = E.raus(spanne(t, teil.ab||0, 0.65));
  if(auf <= 0) return;
  const heben = (1-auf)*24;

  switch(teil.typ){

  /* Logo-Kachel + Wortmarke nebeneinander */
  case 'marke': {
    ctx.save(); ctx.globalAlpha = auf;
    const h = teil.hoehe;
    if(daten.logoBild){
      const faktor = Math.min(W*0.72/daten.logoBild.width, h/daten.logoBild.height);
      const b = daten.logoBild.width*faktor, hh = daten.logoBild.height*faktor;
      ctx.drawImage(daten.logoBild, teil.x-b/2, teil.y+heben, b, hh);
    }else{
      ctx.font = `500 ${Math.round(h*0.8)}px Poppins, Inter, sans-serif`;
      const v = ctx.createLinearGradient(teil.x-W*0.3,0,teil.x+W*0.3,0);
      v.addColorStop(0,'#E7C176'); v.addColorStop(.3,'#D8A44F');
      v.addColorStop(.62,'#9C561D'); v.addColorStop(1,'#E9C87F');
      ctx.fillStyle = v; ctx.textAlign='center';
      ctx.fillText('Da Mimmo', teil.x, teil.y+heben+h*0.78);
    }
    ctx.restore(); break;
  }

  case 'text': {
    ctx.save(); ctx.globalAlpha=auf*0.95;
    ctx.textAlign = teil.mitte ? 'center' : 'left';
    ctx.font = teil.font; ctx.fillStyle = teil.farbe;
    ctx.fillText(teil.text, teil.x, teil.y+heben*0.4);
    ctx.restore(); break;
  }

  /* WOCHENKARTE — groß, gesperrt, mit Goldverlauf und einmaligem Glanz */
  case 'titel': {
    ctx.save(); ctx.textAlign='center'; ctx.globalAlpha=auf;
    let gr = teil.groesse;
    const sperre = gr*0.04;
    const setze = g => { ctx.font = `600 ${g}px "Playfair Display", Georgia, serif`;
                         if(ctx.letterSpacing!==undefined) ctx.letterSpacing = `${g*0.04}px`; };
    setze(gr);
    let breite = ctx.measureText(teil.text).width + sperre*teil.text.length;
    if(breite > teil.maxBreite){ gr = Math.floor(gr*teil.maxBreite/breite); setze(gr); }
    const basis = teil.y + gr*0.78 + heben*0.5;
    ctx.fillStyle = goldSchrift(ctx, basis, gr, P.hell);
    ctx.fillText(teil.text, teil.x, basis);

    const glanz = spanne(t, (teil.ab||0)+0.45, 1.15);
    if(glanz>0 && glanz<1){
      const tb = ctx.measureText(teil.text).width;
      const x0 = teil.x-tb/2, pos = x0 - tb*0.3 + glanz*tb*1.6;
      const sweep = ctx.createLinearGradient(pos-tb*0.2,0,pos+tb*0.2,0);
      sweep.addColorStop(0,'rgba(255,255,255,0)');
      sweep.addColorStop(.5,'rgba(255,250,232,.9)');
      sweep.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle = sweep;
      ctx.fillText(teil.text, teil.x, basis);
    }
    if(ctx.letterSpacing!==undefined) ctx.letterSpacing = '0px';
    ctx.restore(); break;
  }

  /* Datum zwischen zwei feinen Linien */
  case 'datum': {
    ctx.save(); ctx.globalAlpha=auf; ctx.textAlign='center';
    ctx.font = `600 ${teil.groesse}px "Playfair Display", Georgia, serif`;
    ctx.fillStyle = P.goldHell;
    ctx.fillText(teil.text, teil.x, teil.y+heben*0.4);
    const tb = ctx.measureText(teil.text).width;
    const linie = Math.min(W*0.13, 150);
    ctx.globalAlpha = auf*0.65; ctx.fillStyle = P.gold;
    ctx.fillRect(teil.x - tb/2 - 26 - linie, teil.y-teil.groesse*0.3, linie, 1.4);
    ctx.fillRect(teil.x + tb/2 + 26, teil.y-teil.groesse*0.3, linie, 1.4);
    ctx.restore(); break;
  }

  case 'band': {
    ctx.save(); ctx.globalAlpha=auf; ctx.textAlign='center';
    ctx.fillStyle = P.gold;
    ctx.font = `600 ${teil.groesse}px Poppins, Inter, sans-serif`;
    ctx.fillText(teil.text, teil.x, teil.y+heben*0.4);
    ctx.restore(); break;
  }

  /* Überschrift eines Blocks, mit Zierlinien wie beim Datum.
     Stil 1 = Linien + Raute, 2 = nur Linien, 3 = Raute darüber. */
  case 'gang': {
    ctx.save(); ctx.globalAlpha=auf; ctx.textAlign='center';
    ctx.font = `500 ${teil.groesse}px "Playfair Display", Georgia, serif`;
    /* Überschrift leicht gesperrt — über den Zeichenabstand, nicht über
       eingefügte Leerzeichen; sonst zerfällt das Wort beim Lesen. */
    if('letterSpacing' in ctx) ctx.letterSpacing = Math.round(teil.groesse*0.16)+'px';
    const y = teil.y + teil.groesse*0.8 + heben*0.4;
    const zier = teil.zier === undefined ? 1 : teil.zier;

    if(zier === 3){
      /* kleine Raute über der Überschrift */
      raute(ctx, teil.x, y - teil.groesse*1.25, teil.groesse*0.22, P.gold, auf*0.8);
    }
    if(zier === 1 || zier === 2){
      const tb = ctx.measureText(teil.text).width;
      const luft = teil.groesse*0.9;
      const platz = (teil.breite || W*0.86)/2 - tb/2 - luft;
      const linie = Math.max(0, Math.min(platz, teil.groesse*5));
      if(linie > 8){
        const mitteY = y - teil.groesse*0.32;
        const start = tb/2 + luft;
        [-1,1].forEach(seite=>{
          /* zum Rand hin auslaufend — wirkt ruhiger als ein harter Strich */
          const x0 = teil.x + seite*start;
          const v = ctx.createLinearGradient(x0, 0, x0 + seite*linie, 0);
          v.addColorStop(0, P.gold); v.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalAlpha = auf*0.75; ctx.fillStyle = v;
          ctx.fillRect(Math.min(x0, x0+seite*linie), mitteY, linie, 1.4);
          if(zier === 1) raute(ctx, x0 + seite*(linie*0.5), mitteY+0.7,
                               teil.groesse*0.16, P.gold, auf*0.85);
        });
      }
    }

    ctx.globalAlpha = auf; ctx.fillStyle = P.gang; ctx.textAlign='center';
    ctx.fillText(teil.text, teil.x, y);
    if('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.restore(); break;
  }

  /* Zentriertes Gericht: Name mit Preis, Beschreibung darunter */
  case 'gerichtZ': {
    ctx.save(); ctx.globalAlpha = auf; ctx.textAlign = 'center';
    const schub = (1-auf)*18;
    let y = teil.y + teil.nameGr*0.9 + heben*0.4;

    ctx.font = `500 ${teil.nameGr}px ${KARTENSCHRIFT}`;
    if('letterSpacing' in ctx) ctx.letterSpacing = Math.round(teil.nameGr*0.05)+'px';
    ctx.fillStyle = P.tinte;
    teil.kopfZeilen.forEach((z,i)=>{
      /* Der Preis steht hinter dem Punkt und bekommt die Goldfarbe */
      const teilung = z.lastIndexOf('  •  ');
      if(teilung > 0){
        const name = z.slice(0, teilung), rest = z.slice(teilung);
        const nb = ctx.measureText(name).width, rb = ctx.measureText(rest).width;
        const x0 = teil.x - (nb+rb)/2;
        ctx.textAlign = 'left';
        /* alles in einer Schriftfarbe — wie auf der Vorlage */
        ctx.fillStyle = P.tinte; ctx.fillText(name, x0, y + i*teil.nameGr*1.18 + schub);
        ctx.fillText(rest, x0+nb, y + i*teil.nameGr*1.18 + schub);
        ctx.textAlign = 'center';
      }else{
        ctx.fillStyle = P.tinte;
        ctx.fillText(z, teil.x, y + i*teil.nameGr*1.18 + schub);
      }
      /* Merkmale hinter die letzte Kopfzeile */
      if(i === teil.kopfZeilen.length-1 && (teil.merkmale||[]).length){
        const g = teil.nameGr*0.92, luft = teil.nameGr*0.42;
        const zb = ctx.measureText(z).width;
        let mx = teil.x + zb/2 + luft;
        teil.merkmale.forEach(m=>{
          merkmalZeichnen(ctx, m, mx, y + i*teil.nameGr*1.18 - g*0.3 + schub, g, P.tinte, 1.7);
          mx += g*1.2;
        });
      }
    });
    if('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    y += (teil.kopfZeilen.length-1)*teil.nameGr*1.18;

    if(teil.descZeilen.length){
      ctx.font = `400 ${teil.descGr}px ${KARTENSCHRIFT}`;
      ctx.fillStyle = P.tinte;
      const basis = y + teil.descGr*1.2;
      teil.descZeilen.forEach((z,i)=>
        ctx.fillText(z, teil.x, basis + i*teil.descGr*1.2 + schub));
    }
    ctx.restore(); break;
  }

  /* Erklärung der Merkmale: Zeichen und Wort, mittig */
  case 'legende': {
    ctx.save(); ctx.globalAlpha = auf*0.9;
    const g = teil.groesse;
    ctx.font = `400 ${g}px ${KARTENSCHRIFT}`;
    const stuecke = teil.merkmale.map(m=> ({ m, text: (MERKMALE[m]||{}).name || m }));
    const luft = g*0.5, zwischen = g*1.6;
    const breiteGesamt = stuecke.reduce((n,st,i)=>
      n + g + luft + ctx.measureText(st.text).width + (i ? zwischen : 0), 0);
    let x = teil.x - breiteGesamt/2;
    ctx.textAlign = 'left'; ctx.fillStyle = P.weich;
    stuecke.forEach((st,i)=>{
      if(i) x += zwischen;
      merkmalZeichnen(ctx, st.m, x, teil.y + g*0.1 + heben*0.3, g, P.weich, 1.7);
      x += g + luft;
      ctx.fillText(st.text, x, teil.y + g*0.45 + heben*0.3);
      x += ctx.measureText(st.text).width;
    });
    ctx.restore(); break;
  }

  /* Feine Linie zwischen zwei Blöcken */
  case 'trennlinie': {
    ctx.save();
    ctx.globalAlpha = auf*0.45; ctx.fillStyle = P.weich;
    ctx.fillRect(teil.x-teil.breite/2, teil.y, teil.breite, 1);
    ctx.restore(); break;
  }

  /* Linksbündiger Absatz mit **fetten** Stellen */
  case 'absatz': {
    ctx.save(); ctx.globalAlpha = auf; ctx.textAlign = 'left';
    ctx.fillStyle = P.tinte;
    teil.zeilen.forEach((zeile,i)=>{
      let x = teil.x;
      const y = teil.y + teil.groesse*1.1 + i*teil.groesse*1.25 + heben*0.3;
      zeile.forEach(st=>{
        ctx.font = `${st.fett?600:400} ${teil.groesse}px ${KARTENSCHRIFT}`;
        ctx.fillText(st.text, x, y);
        x += ctx.measureText(st.text).width;
      });
    });
    ctx.restore(); break;
  }

  /* Überschrift als Grafik, hochkant am linken Rand */
  case 'titelbildSeite': {
    ctx.save(); ctx.globalAlpha = auf;
    ctx.translate(teil.x, teil.y); ctx.rotate(-Math.PI/2);
    const b = teil.laenge, h = b * (teil.bild.height/teil.bild.width);
    ctx.drawImage(teil.bild, -b/2, -h/2, b, h);
    ctx.restore(); break;
  }

  /* Überschrift als Grafik */
  case 'titelbild': {
    ctx.save(); ctx.globalAlpha = auf;
    ctx.drawImage(teil.bild, teil.x - teil.b/2, teil.y + heben*0.4, teil.b, teil.h);
    ctx.restore(); break;
  }

  case 'rahmen': {
    ctx.save(); ctx.globalAlpha = auf*0.42;
    ctx.strokeStyle = P.gold; ctx.lineWidth = 1.2;
    pille(ctx, teil.x, teil.y, teil.b, teil.h, 14);
    ctx.stroke(); ctx.restore(); break;
  }

  case 'gericht': {
    const g = teil.gericht, s = teil.skala;
    const schub = (1-auf)*30;
    ctx.save(); ctx.globalAlpha = auf;

    const ersteZeile = teil.y + teil.nameGr*0.84;

    if(teil.symbol){
      const poppen = E.rueck(spanne(t,(teil.ab||0)+0.04,0.5));
      ctx.save(); ctx.globalAlpha = auf*poppen;
      symbolZeichnen(ctx, teil.symbol, teil.symbolX, ersteZeile - teil.nameGr*0.26,
                     teil.symbolR*1.9*poppen, P.gold, P.hell ? 1.8 : 1.5);
      ctx.restore();
    }

    if(teil.preis){
      ctx.font = `600 ${teil.preisGr}px Poppins, Inter, sans-serif`;
      ctx.textAlign='right'; ctx.fillStyle = P.gold;
      ctx.fillText(teil.preis, teil.rechts+schub, ersteZeile);
    }

    ctx.textAlign='left';
    ctx.font = `600 ${teil.nameGr}px Poppins, Inter, sans-serif`;
    ctx.fillStyle = P.tinte;
    teil.nameZeilen.forEach((z,i)=>{
      ctx.fillText(z, teil.x-schub, ersteZeile + i*teil.nameGr*1.16);
      if(i === teil.nameZeilen.length-1 && (g.merkmale||[]).length){
        const mg = teil.nameGr*0.86;
        let mx = teil.x - schub + ctx.measureText(z).width + teil.nameGr*0.35;
        g.merkmale.forEach(m=>{
          merkmalZeichnen(ctx, m, mx, ersteZeile + i*teil.nameGr*1.16 - mg*0.32, mg, P.gold, 1.7);
          mx += mg*1.2;
        });
      }
    });

    if(teil.descZeilen.length){
      ctx.font = `italic 400 ${teil.descGr}px Poppins, Inter, sans-serif`;
      ctx.fillStyle = P.weich;
      const basis = ersteZeile + (teil.nameZeilen.length-1)*teil.nameGr*1.16 + teil.descGr*1.32;
      teil.descZeilen.forEach((z,i)=>
        ctx.fillText(z, teil.x-schub, basis + i*teil.descGr*1.32));
    }
    ctx.restore(); break;
  }

  /* Handschriftlicher Spruch mit Herz */
  case 'claim': {
    ctx.save(); ctx.globalAlpha = auf;
    ctx.translate(teil.x, teil.y); ctx.rotate(-0.14);
    ctx.font = `600 ${teil.groesse}px "Dancing Script", cursive`;
    ctx.fillStyle = P.hell ? '#8A5214' : '#EFD192'; ctx.textAlign='left';
    const zeilen = teil.zeilen || umbrechen(ctx, teil.text, W*0.46);
    zeilen.forEach((z,i)=> ctx.fillText(z, 0, i*teil.groesse*0.95));
    /* Herz */
    const hy = (zeilen.length-1)*teil.groesse*0.95 + teil.groesse*0.34;
    const hg = teil.groesse*0.36;
    ctx.strokeStyle = P.hell ? '#8A5214' : '#EFD192';
    ctx.lineWidth = Math.max(2, teil.groesse*0.045);
    ctx.beginPath();
    const hx = teil.groesse*1.1;
    ctx.moveTo(hx+hg*0.9, hy+hg*0.35);
    ctx.bezierCurveTo(hx+hg*0.9, hy+hg*0.05, hx+hg*0.45, hy+hg*0.05, hx+hg*0.45, hy+hg*0.38);
    ctx.bezierCurveTo(hx+hg*0.45, hy+hg*0.68, hx+hg*0.9, hy+hg*0.9, hx+hg*0.9, hy+hg*1.1);
    ctx.bezierCurveTo(hx+hg*0.9, hy+hg*0.9, hx+hg*1.35, hy+hg*0.68, hx+hg*1.35, hy+hg*0.38);
    ctx.bezierCurveTo(hx+hg*1.35, hy+hg*0.05, hx+hg*0.9, hy+hg*0.05, hx+hg*0.9, hy+hg*0.35);
    ctx.stroke();
    ctx.restore(); break;
  }

  case 'hinweise': {
    ctx.save(); ctx.globalAlpha = auf*0.85;
    ctx.fillStyle = P.weich;
    const normal = `400 ${teil.groesse}px Poppins, Inter, sans-serif`;
    const fett   = `600 ${teil.groesse}px Poppins, Inter, sans-serif`;
    teil.zeilen.forEach((z,i)=>{
      const y = teil.y + i*teil.groesse*1.45 + heben*0.3;
      /* „WICHTIGE HINWEISE:“ steht fett vor dem Text */
      if(i === 0 && teil.praefix && z.startsWith(teil.praefix)){
        const rest = z.slice(teil.praefix.length);
        ctx.font = fett;   const pb = ctx.measureText(teil.praefix).width;
        ctx.font = normal; const rb = ctx.measureText(rest).width;
        let x = teil.x - (pb+rb)/2;
        ctx.textAlign='left';
        ctx.font = fett;   ctx.fillText(teil.praefix, x, y);
        ctx.font = normal; ctx.fillText(rest, x+pb, y);
      }else{
        ctx.textAlign='center'; ctx.font = normal;
        ctx.fillText(z, teil.x, y);
      }
    });
    ctx.restore(); break;
  }

  /* Fußzeile: Logo links, QR-Code rechts daneben, beides mittig */
  case 'ruf': {
    ctx.save(); ctx.globalAlpha=auf;
    ctx.translate(teil.x, teil.y);
    const g = teil.groesse, h = g*2.4;
    const logo = (teil.marke && daten.logoBild) ? daten.logoBild : null;
    const qr   = teil.qr ? daten.qrBild : null;
    const abstand = g*2;
    let lw = 0, lh = 0;
    if(logo){
      lh = h*0.85; lw = lh * (logo.width/logo.height);
      const maxB = W*0.5;
      if(lw > maxB){ lw = maxB; lh = lw * (logo.height/logo.width); }
    }
    const qs = qr ? h*2.0 : 0;                 /* QR ist quadratisch */
    const gesamt = lw + (logo && qr ? abstand : 0) + qs;
    /* Alles zusammen darf nie breiter als die Karte sein */
    const verfuegbar = W*0.90;
    if(gesamt > verfuegbar) ctx.scale(verfuegbar/gesamt, verfuegbar/gesamt);
    let x = -gesamt/2;
    if(logo){ ctx.drawImage(logo, x, -lh/2, lw, lh); x += lw + abstand; }
    if(qr){
      /* weißes Feld unter dem Code, sonst ist er auf dem Foto nicht lesbar */
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x - qs*0.06, -qs/2 - qs*0.06, qs*1.12, qs*1.12);
      ctx.drawImage(qr, x, -qs/2, qs, qs);
    }
    ctx.restore(); break;
  }
  }
}

return { szeneKarte, zeichnen, WELTEN, hinweisZeilen, FEST_MAX };
})();
