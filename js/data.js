'use strict';
/* Mouadz Escapes Trump: game data (characters, chasers, worlds, missions, upgrades) */
const $ = id => document.getElementById(id);
const fmt = n => Math.floor(n).toLocaleString('de-DE');
const pick = a => a[(Math.random()*a.length)|0];

if (!window.THREE){
  document.body.insertAdjacentHTML('beforeend', '<div id="err">Three.js konnte nicht geladen werden. Prüfe die Internetverbindung und lade neu.</div>');
  throw new Error('THREE missing');
}

/* ================= Runner skins ================= */
const SKINS = [
  {id:'mouadz', name:'Mouadz', price:0, emoji:'🏃', desc:'Der Klassiker: Hoodie, Cap, schnelle Beine.',
   skin:0xc98d5e, shirt:0x2f6bff, pants:0x2b3550, shoes:0xffffff, hair:0x2a1a10, accent:0xe8323c, extra:'cap'},
  {id:'ninja', name:'Ninja', price:150, emoji:'🥷', desc:'Lautlos, schwarz, mit Schwert auf dem Rücken.',
   skin:0xd9a074, shirt:0x1b1b24, pants:0x1b1b24, shoes:0x111111, hair:0x111111, accent:0xe8323c, extra:'ninja'},
  {id:'soccer', name:'Fußballer', price:250, emoji:'⚽', desc:'Trikot mit der 10. Rennt wie im Finale.',
   skin:0xb87a4e, shirt:0x1fa34a, pants:0xffffff, shoes:0x111111, hair:0x1a1008, accent:0xffffff, extra:'soccer'},
  {id:'hero', name:'Superheld', price:350, emoji:'🦸', desc:'Umhang im Wind, Maske auf. Rettet nur sich selbst.',
   skin:0xe0aa7e, shirt:0x1f4fd8, pants:0x1f4fd8, shoes:0xd62b2b, hair:0x222222, accent:0xd62b2b, extra:'hero'},
  {id:'astro', name:'Astronaut', price:500, emoji:'👨‍🚀', desc:'Raumanzug mit Glashelm. Nächster Halt: Mars.',
   skin:0xf0c39a, shirt:0xeeeeee, pants:0xdedede, shoes:0x8a8f99, hair:0x5a3a20, accent:0xff7a00, extra:'astro'},
  {id:'chef', name:'Koch', price:600, emoji:'👨‍🍳', desc:'Kochmütze, Schnurrbart, weiße Jacke.',
   skin:0xe8b48a, shirt:0xffffff, pants:0x2b2b33, shoes:0x111111, hair:0x3a2a1a, accent:0xe8323c, extra:'chef'},
  {id:'pirate', name:'Pirat', price:700, emoji:'🏴‍☠️', desc:'Augenklappe, Bart, Ringelshirt. Arrr!',
   skin:0xc68a5a, shirt:0xf2efe6, pants:0x5a3b22, shoes:0x2a1a10, hair:0x1a1008, accent:0xc0262d, extra:'pirate'},
  {id:'gamer', name:'Gamer', price:800, emoji:'🎧', desc:'Neon-Hoodie und Kopfhörer. Lag gibt es nicht.',
   skin:0xd9a074, shirt:0x7a2cff, pants:0x1b1b24, shoes:0x35f0ff, hair:0x111111, accent:0x35f0ff, extra:'gamer'},
  {id:'rapper', name:'Rapper', price:900, emoji:'🎤', desc:'Goldkette, Sonnenbrille, Bucket Hat.',
   skin:0x8a5a3a, shirt:0x1b1b1b, pants:0x3a3f8a, shoes:0xffffff, hair:0x111111, accent:0xffd23a, extra:'rapper'},
  {id:'robo', name:'Robo-X', price:1100, emoji:'🤖', desc:'Metallkörper, Leuchtaugen, Antenne.',
   skin:0x9aa4b1, shirt:0x6d7785, pants:0x4b525c, shoes:0x30353c, hair:0x9aa4b1, accent:0x35f0ff, extra:'robot'},
  {id:'fire', name:'Feuerwehr', price:1200, emoji:'🧑‍🚒', desc:'Helm, Leuchtstreifen, keine Angst vor nichts.',
   skin:0xd9a074, shirt:0xf2c21a, pants:0x2b2b33, shoes:0x111111, hair:0x2a1a10, accent:0xd62b2b, extra:'fire'},
  {id:'zombie', name:'Zombie', price:1400, emoji:'🧟', desc:'Arme nach vorn, Hunger nach Hirn.',
   skin:0x8fb36b, shirt:0x6b5a8a, pants:0x3d4a3a, shoes:0x3a2a1a, hair:0x2e3a22, accent:0x8a1010, extra:'zombie'},
  {id:'knight', name:'Ritter', price:1800, emoji:'🛡️', desc:'Volle Rüstung, rote Feder, kleines Schild.',
   skin:0xd9a074, shirt:0xb8c0cc, pants:0x8a929e, shoes:0x6a717c, hair:0x2a1a10, accent:0xd62b2b, extra:'knight'},
  {id:'alien', name:'Alien', price:2000, emoji:'👽', desc:'Große Augen, zwei Antennen, Silberanzug.',
   skin:0x6fe36a, shirt:0xb9c3cf, pants:0xb9c3cf, shoes:0x6a7380, hair:0x6fe36a, accent:0x111111, extra:'alien'},
  {id:'viking', name:'Wikinger', price:2400, emoji:'🪓', desc:'Hörnerhelm, roter Bart, Fellweste.',
   skin:0xe8b48a, shirt:0x7a4a2a, pants:0x4a3a2a, shoes:0x3a2a1a, hair:0xd2691e, accent:0xb8c0cc, extra:'viking'},
  {id:'mummy', name:'Mumie', price:2800, emoji:'🧻', desc:'3000 Jahre alt und trotzdem schneller als er.',
   skin:0xe8dfc4, shirt:0xe8dfc4, pants:0xd8cfb4, shoes:0xc8bfa4, hair:0xe8dfc4, accent:0x8a7a5a, extra:'mummy'},
  {id:'gold', name:'Goldjunge', price:3500, emoji:'👑', desc:'Komplett aus Gold. Mit Krone. Teuer.',
   skin:0xffd24a, shirt:0xffc21a, pants:0xe8a90f, shoes:0xffe27a, hair:0xffd24a, accent:0xff3b6b, extra:'gold'},
  {id:'dino', name:'Dino', price:4000, emoji:'🦖', desc:'Dino-Kostüm mit Zähnen, Stacheln und Schwanz.',
   skin:0xd9a074, shirt:0x4cbf4a, pants:0x4cbf4a, shoes:0x2f8a3a, hair:0x4cbf4a, accent:0xff8a2a, extra:'dino'},
];
const AGENT = {id:'agent', skin:0xd9a074, shirt:0x22262e, pants:0x2a2f38, shoes:0x111111, hair:0x3a2a1a, accent:0x111111, extra:'ice'};

/* ================= Chaser skins ================= */
const CHASERS = [
  {id:'classic', name:'Klassik', price:0, emoji:'👔', desc:'Blauer Anzug, extra lange rote Krawatte.',
   suit:0x1d2a4a, pants:0x1d2a4a, shirt:0xffffff, tie:0xd3122a},
  {id:'golf', name:'Golfer', price:400, emoji:'⛳', desc:'Weißes Polo, rote Kappe und ein Golfschläger.',
   suit:0xf4f4f4, pants:0xd8c9a0, shirt:0xf4f4f4, tie:null, shoes:0xffffff, extra:'golf'},
  {id:'cowboy', name:'Cowboy', price:800, emoji:'🤠', desc:'Riesenhut, Lederweste, Stiefel.',
   suit:0x8a5a2b, pants:0x2f4a7a, shirt:0xe8e0d0, tie:0xd3122a, shoes:0x5a3b22, extra:'cowboy'},
  {id:'pirate', name:'Piraten-Trump', price:1000, emoji:'🦜', desc:'Dreispitz, Augenklappe, roter Mantel.',
   suit:0xa01c22, pants:0x2a2a33, shirt:0xffffff, tie:null, shoes:0x2a1a10, extra:'pirate'},
  {id:'santa', name:'Weihnachtsmann', price:1200, emoji:'🎅', desc:'Ho ho ho! Du bist trotzdem gefeuert.',
   suit:0xc81d25, pants:0xc81d25, shirt:0xc81d25, tie:null, extra:'santa'},
  {id:'ninja', name:'Ninja-Trump', price:1400, emoji:'🗡️', desc:'Schwarzer Anzug, rotes Stirnband, Maske.',
   suit:0x1b1b24, pants:0x1b1b24, shirt:0x1b1b24, tie:null, extra:'ninja'},
  {id:'super', name:'Super-Trump', price:1600, emoji:'🦸‍♂️', desc:'Umhang, Maske und ein goldenes T.',
   suit:0x1f4fd8, pants:0x1f4fd8, shirt:0x1f4fd8, tie:0xd3122a, shoes:0xd62b2b, extra:'cape'},
  {id:'icechef', name:'ICE-Chef', price:2000, emoji:'🚨', desc:'Taktische Weste, Sonnenbrille, ICE-Aufdruck.',
   suit:0x22262e, pants:0x22262e, shirt:0x22262e, tie:null, extra:'ice'},
  {id:'astro', name:'Astro-Trump', price:2400, emoji:'🚀', desc:'Raumanzug, Glashelm, Mission Mars.',
   suit:0xeeeeee, pants:0xdedede, shirt:0xeeeeee, tie:null, shoes:0x8a8f99, extra:'astro'},
  {id:'robot', name:'Robo-Trump', price:2800, emoji:'🦾', desc:'Metallanzug, rote Laseraugen, Antenne.',
   suit:0x6d7785, pants:0x4b525c, shirt:0x9aa4b1, tie:0xff3030, skin:0x9aa4b1, hair:0xc9ced6, eyes:0xff2a2a, extra:'robot'},
  {id:'zombie', name:'Zombie-Trump', price:3000, emoji:'🧟‍♂️', desc:'Grün, zerrissener Anzug, Arme nach vorn.',
   suit:0x2a3448, pants:0x2a3448, shirt:0xd8d8c0, tie:0x7a1018, skin:0x8fb36b, hair:0xc8c890, extra:'zombie'},
  {id:'gold', name:'Gold-Trump', price:3500, emoji:'🏆', desc:'Alles aus Gold. Natürlich.',
   suit:0xffc21a, pants:0xe8a90f, shirt:0xffe27a, tie:0xff3b6b, skin:0xffd24a, hair:0xfff0a0, shoes:0xe8a90f, extra:'gold'},
  {id:'king', name:'König Trump', price:4000, emoji:'🤴', desc:'Krone, Hermelinmantel, Zepter.',
   suit:0x5a1a7a, pants:0x3a1050, shirt:0xffffff, tie:0xffc21a, extra:'king'},
  {id:'baby', name:'Baby-Trump', price:4500, emoji:'🍼', desc:'Riesenkopf, Windel, Handy. Wutanfall garantiert.',
   suit:0xf0a457, pants:0xf0a457, shirt:0xf0a457, tie:null, shoes:0xf0a457, extra:'baby'},
  {id:'bling', name:'Bling-Trump', price:5000, emoji:'💎', desc:'Weißer Anzug, Goldketten, Sonnenbrille.',
   suit:0xf4f1ea, pants:0xf4f1ea, shirt:0x111111, tie:0xffc21a, shoes:0xffc21a, extra:'bling'},
];
const skinById = id => SKINS.find(s => s.id === id) || SKINS[0];
const chaserById = id => CHASERS.find(s => s.id === id) || CHASERS[0];

const TRUMP_LINES = [
  "You're fired!", "Komm sofort zurück!", "Niemand rennt besser als ich. Niemand!",
  "Fake News! Du bist gar nicht schnell!", "Ich baue eine Mauer! Eine wunderschöne Mauer!",
  "Tremendous! Aber ich krieg dich!", "Das wird ein riesiger Deal!", "Believe me, ich bin schneller!",
  "Sad!", "Make Running Great Again!", "Bleib stehen, wir machen einen Deal!", "Du bist ein Loser! Ein großer Loser!",
  "ICE! Schnappt ihn euch!", "Zeig mal deine Papiere!", "Ich habe die besten Beine. Alle sagen das.",
  "Das ist der unfairste Lauf aller Zeiten!", "Ich kaufe einfach die ganze Straße!"
];
const STUMBLE_LINES = ["HAB DICH GLEICH!", "Gleich bist du gefeuert!", "Jetzt wird's eng, Loser!", "Ha! Gestolpert! Sad!", "ICE, jetzt zugreifen!"];
const JET_LINES = ["Unfair! Der fliegt!", "Ich will auch so ein Ding!", "Komm sofort runter!"];

/* ================= Worlds (unlock by score) ================= */
const WORLDS = [
  {id:'dc', name:'Washington', emoji:'🏛️', at:0,
   sky:['#141a45','#4a2f6e','#c4587a','#ff9e62'], fog:0xb5607a, hemiSky:0xffe2c8, hemiGround:0x3a3060, hemiI:.95, sunI:.9, glow:.35,
   ground:0x2a2540, walk:0xffffff, road:0xffffff, stars:.4,
   buildings:['#3b3f6b','#5a3d5c','#2e4a62','#6b4a3a','#4a4f5f','#384a40','#6a3846'], lit:['#ffd98a','#ffe9b8'], dark:'#1b1d33', litChance:.45,
   prop:'tree', low:'barrier', train:'#2f6bff'},
  {id:'ny', name:'New York bei Nacht', emoji:'🌃', at:1500,
   sky:['#04050d','#0c1134','#1c2462','#4a2a7a'], fog:0x1c1f4a, hemiSky:0x9fb0ff, hemiGround:0x14142c, hemiI:.75, sunI:.45, glow:1,
   ground:0x15172a, walk:0x8c8aae, road:0xb4b8dc, stars:1,
   buildings:['#1c2033','#25223a','#1a2a3a','#2a1f2f','#202530'], lit:['#7df9ff','#ff5ad9','#ffe066'], dark:'#0b0c18', litChance:.55,
   prop:'neon', low:'cones', train:'#c0c6d0'},
  {id:'desert', name:'Wüste von Nevada', emoji:'🏜️', at:4000,
   sky:['#3d7fd6','#7fb5ea','#f2c88c','#ffb067'], fog:0xf0c08a, hemiSky:0xfff2d8, hemiGround:0x8a5a30, hemiI:1.0, sunI:1.0, glow:0,
   ground:0xd9a866, walk:0xf3d6a6, road:0xe6dccc, stars:0, lowBuildings:true,
   buildings:['#c9925a','#b97a46','#d8a872','#a8683a'], lit:['#5a3a20'], dark:'#7a4a28', litChance:.6,
   prop:'cactus', low:'hay', train:'#b0442a'},
  {id:'snow', name:'Winter in Alaska', emoji:'❄️', at:7500,
   sky:['#6d8fb8','#a9c3dd','#dde8f2','#f4f8fb'], fog:0xdfe8f0, hemiSky:0xffffff, hemiGround:0x8095b0, hemiI:.95, sunI:.8, glow:.2,
   ground:0xf2f6fa, walk:0xffffff, road:0xd4dce8, stars:0, snow:true,
   buildings:['#7a4a3a','#5a6a7a','#8a5a40','#4a5a6a'], lit:['#ffd98a'], dark:'#2a3040', litChance:.4,
   prop:'pine', low:'snowman', train:'#d62b2b'},
  {id:'florida', name:'Strand von Florida', emoji:'🌴', at:12000,
   sky:['#1e8fd6','#5cc2f0','#a6e6f7','#fff1c4'], fog:0xbfe9f5, hemiSky:0xffffff, hemiGround:0x6aa0a0, hemiI:1.0, sunI:1.0, glow:0,
   ground:0xf0dca0, walk:0xfff0d0, road:0xffffff, stars:0,
   buildings:['#f2a7b5','#9fdbd0','#f7d58a','#c6b3f0','#f4f4f4'], lit:['#3a6a8a'], dark:'#5a8aa8', litChance:.5,
   prop:'palm', low:'sandcastle', train:'#ff7a00'},
  {id:'gold', name:'Goldene Stadt', emoji:'🏆', at:18000,
   sky:['#1a0f05','#4a2a08','#a8661a','#ffcf5a'], fog:0x8a5a1a, hemiSky:0xffe6a8, hemiGround:0x4a3010, hemiI:1.0, sunI:.8, glow:.8,
   ground:0x3a2a10, walk:0xffe08a, road:0xffe6a0, stars:.6,
   buildings:['#c9a227','#a8841a','#e0b84a','#8a6a10'], lit:['#fff4c0'], dark:'#5a4208', litChance:.6,
   prop:'goldtree', low:'goldbars', train:'#ffd23a'},
];

/* ================= Missions ================= */
const MISSIONS = [
  {id:'dist1',  stat:'bestDist',     base:60,  targets:[300,600,1000,1500,2500,4000,6000], text:n => `Lauf ${fmt(n)} m in einem Lauf`},
  {id:'distT',  stat:'distTotal',    base:80,  targets:[1000,3000,7500,15000,30000,60000,100000], text:n => `Lauf insgesamt ${fmt(n)} m`},
  {id:'scoreR', stat:'bestScore',    base:70,  targets:[1000,3000,6000,10000,18000,30000], text:n => `Erreiche ${fmt(n)} Punkte in einem Lauf`},
  {id:'coinsR', stat:'bestCoinsRun', base:60,  targets:[30,60,100,150,250,400], text:n => `Sammle ${fmt(n)} Münzen in einem Lauf`},
  {id:'coinsT', stat:'coinsTotal',   base:70,  targets:[100,300,750,1500,3000,6000,12000], text:n => `Sammle insgesamt ${fmt(n)} Münzen`},
  {id:'ice',    stat:'iceDodged',    base:60,  targets:[5,20,50,120,300,600], text:n => `Lass ${fmt(n)} ICE-Wagen hinter dir`},
  {id:'jumps',  stat:'jumps',        base:40,  targets:[25,75,200,500,1000,2000], text:n => `Spring ${fmt(n)} Mal`},
  {id:'slides', stat:'slides',       base:40,  targets:[20,60,150,400,800,1500], text:n => `Rutsch ${fmt(n)} Mal`},
  {id:'power',  stat:'powerups',     base:50,  targets:[3,10,25,60,150,300], text:n => `Sammle ${fmt(n)} Power-ups`},
  {id:'jet',    stat:'jetDist',      base:60,  targets:[200,800,2000,5000,12000], text:n => `Flieg ${fmt(n)} m mit dem Jetpack`},
  {id:'escape', stat:'escapes',      base:70,  targets:[2,8,25,60,120], text:n => `Entkomme ${fmt(n)} Mal nach einem Stolperer`},
  {id:'turns',  stat:'turns',        base:50,  targets:[3,10,30,80,200], text:n => `Biege ${fmt(n)} Mal an Kreuzungen ab`},
  {id:'roof',   stat:'roofDist',     base:60,  targets:[100,500,1500,4000,10000], text:n => `Lauf ${fmt(n)} m auf Zugdächern`},
  {id:'smash',  stat:'smashed',      base:50,  targets:[5,20,60,150,400], text:n => `Räum ${fmt(n)} Hindernisse mit Turbo oder Schild ab`},
  {id:'worlds', stat:'worldMax',     base:150, targets:[1,2,3,4,5], text:n => `Erreiche die Welt „${WORLDS[n].name}“`},
  {id:'runs',   stat:'runs',         base:40,  targets:[3,10,25,50,100,200], text:n => `Spiele ${fmt(n)} Läufe`},
  {id:'crates', stat:'cratesOpened', base:50,  targets:[1,5,15,40,80], text:n => n === 1 ? 'Öffne deine erste Kiste' : `Öffne ${fmt(n)} Kisten`},
  {id:'upg',    stat:'upgradesOwned',base:80,  targets:[1,4,8,14,20], text:n => n === 1 ? 'Kauf dein erstes Upgrade' : `Kauf ${fmt(n)} Upgrade-Stufen`},
  {id:'daily',  stat:'dailyClaimed', base:60,  targets:[1,3,7,14,30], text:n => n === 1 ? 'Hol deine erste Tagesbelohnung' : `Hol ${fmt(n)} Tagesbelohnungen`},
  {id:'skins',  stat:'skinsOwned',   base:100, targets:[3,5,8,12,16,22,30], text:n => `Besitze ${fmt(n)} Skins`},
];
const missionReward = (m, lvl) => ({coins: m.base*(lvl + 1), crates: lvl % 2 === 1 ? 1 : 0});

/* ================= Upgrades & daily rewards ================= */
const UPGRADES = [
  {id:'magnet', name:'Magnet', emoji:'🧲', base:9, desc:'Zieht Münzen in deiner Nähe an.'},
  {id:'double', name:'Doppelte Münzen', emoji:'💰', base:12, desc:'Jede Münze zählt doppelt.'},
  {id:'turbo', name:'Turbo', emoji:'🚀', base:4.5, desc:'Schneller und unverwundbar, Trump fällt zurück.'},
  {id:'jet', name:'Jetpack', emoji:'🎒', base:7, desc:'Flieg über alles hinweg und sammle Münzen in der Luft.'},
];
const UPGRADE_COST = [250, 600, 1200, 2500, 5000];
const UPGRADE_MAX = UPGRADE_COST.length;
const DAILY = [
  {coins:100}, {coins:150}, {crates:1}, {coins:250}, {coins:400}, {crates:2}, {coins:1000, crates:1}
];
