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

/* ================= Countries and their worlds ================= */
// Inside a run, the next world of the chosen country starts once your score passes its threshold.
const WORLD_AT = [0, 2500, 6000, 11000, 18000, 27000];
const WORLD_DEFAULTS = {
  hemiI:1, sunI:.95, glow:.15, stars:0, walk:0xffffff, road:0xffffff, litChance:.45, lit:['#ffe9a8', '#fff4c8'], dark:'#2a3050',
  prop:'tree', low:'barrier', train:'#2f6bff', facade:'city', roof:'flat', roofColor:0x3a3646, bh:[7, 24],
  landmark:null, lmColor:null, clouds:true, celestial:'sun', snow:false, banner:null
};
function W_(o){ return Object.assign({}, WORLD_DEFAULTS, o); }
const NIGHT = {glow:1, stars:1, celestial:'moon', clouds:false, sunI:.45, hemiI:.75};
const COUNTRIES = [
  {id:'usa', name:'USA', flag:'🇺🇸', need:0, banner:'FAKE NEWS', worlds:[
    W_({id:'dc', name:'Washington', emoji:'🏛️', sky:['#3a3f9a','#7a5ac8','#ff8ab0','#ffc27a'], fog:0xf0a0a0, hemiSky:0xffe6d0, hemiGround:0x4a3a70,
        ground:0x3a3460, buildings:['#5b6bd8','#e06a8a','#3fa0c8','#f0a050','#8a6ad8','#4ab890'], landmark:'capitol', glow:.3, stars:.3}),
    W_(Object.assign({}, NIGHT, {id:'ny', name:'New York bei Nacht', emoji:'🗽', sky:['#05061a','#141a52','#2a2f86','#6a3aa0'], fog:0x2a2a6a, hemiSky:0xa8b8ff, hemiGround:0x1a1a3a,
        ground:0x1a1c38, walk:0x9a98c8, road:0xb4b8e0, buildings:['#2a3060','#3a2a5a','#203a5a','#4a2a4a','#2a2a3a'], lit:['#7df9ff','#ff6ae0','#ffe066'], dark:'#121430', litChance:.6,
        prop:'neon', low:'cones', train:'#c8ced8', landmark:'liberty'})),
    W_({id:'desert', name:'Wüste von Nevada', emoji:'🏜️', sky:['#3a8ae8','#7cc0f4','#ffd9a0','#ffb070'], fog:0xf6c890, hemiSky:0xfff4dc, hemiGround:0x9a6a3a,
        ground:0xe8b070, walk:0xf6dcac, road:0xf0e4d0, buildings:['#e8a060','#d88a50','#f0c080','#c87848'], lit:['#6a4020'], dark:'#8a5030', litChance:.55, bh:[3, 8],
        prop:'cactus', low:'hay', train:'#c8502a', landmark:'mesa', facade:'arch'}),
    W_({id:'snow', name:'Winter in Alaska', emoji:'❄️', sky:['#5a8ad8','#9cc4ec','#dceaf8','#f6fbff'], fog:0xe4eef8, hemiSky:0xffffff, hemiGround:0x8aa0c8, sunI:.85,
        ground:0xf6faff, road:0xd8e2f0, buildings:['#c85a4a','#5a7ab8','#d88a4a','#4a8a8a'], lit:['#ffd98a'], dark:'#2a3450', litChance:.4, glow:.25,
        prop:'pine', low:'snowman', train:'#e03030', landmark:'mountains', snow:true, roof:'pitched', roofColor:0xf4f8ff}),
    W_({id:'florida', name:'Strand von Florida', emoji:'🌴', sky:['#1a90e8','#4cc8f8','#a8eefc','#fff6c8'], fog:0xc4f0fa, hemiSky:0xffffff, hemiGround:0x6ab0b0,
        ground:0xf6e0a0, walk:0xfff2d6, buildings:['#ff9ab8','#7ee0d0','#ffd77a','#c8b0ff','#ffffff'], lit:['#3a7aa8'], dark:'#5a9ac0', litChance:.5,
        prop:'palm', low:'sandcastle', train:'#ff7a1a', landmark:'lighthouse'}),
    W_(Object.assign({}, NIGHT, {id:'vegas', name:'Las Vegas', emoji:'🎰', sky:['#12051a','#3a0a4a','#a01a6a','#ff8a3a'], fog:0x6a1a5a, hemiSky:0xffd0f0, hemiGround:0x2a1030,
        ground:0x2a1430, walk:0xf0c8ff, road:0xf0d8ff, buildings:['#c9a227','#e04aa0','#4a2a8a','#e8b84a'], lit:['#fff4c0','#ff6ae0','#7df9ff'], dark:'#2a1040', litChance:.65,
        prop:'goldtree', low:'goldbars', train:'#ffd23a', landmark:'skyline'})),
  ]},
  {id:'de', name:'Deutschland', flag:'🇩🇪', need:0, banner:'BAUSTELLE', worlds:[
    W_({id:'berlin', name:'Berlin', emoji:'🐻', sky:['#3a6ad0','#78a8ec','#c8e2fa','#fff0d8'], fog:0xd8e4f0, hemiSky:0xfff8f0, hemiGround:0x5a5a70,
        ground:0x6a8a5a, buildings:['#f0e0c0','#e8c8a0','#c8d8e8','#f4f0e8','#e8b0a0'], lit:['#ffe9a8'], dark:'#3a4a6a', facade:'euro', roof:'pitched', roofColor:0xb04a3a,
        low:'crates', train:'#f2c21a', landmark:'brandenburg'}),
    W_({id:'hamburg', name:'Hamburger Hafen', emoji:'⚓', sky:['#4a6a9a','#8aa8c8','#c8d8e4','#e8eef2'], fog:0xc8d4e0, hemiSky:0xf0f4ff, hemiGround:0x4a5060, sunI:.75,
        ground:0x5a6a7a, buildings:['#a8483a','#8a3a30','#b85a40','#7a3a34'], lit:['#ffe0a0'], dark:'#2a2a3a', facade:'brick', roof:'pitched', roofColor:0x3a4a4a,
        low:'crates', train:'#d62b2b', landmark:'cranes'}),
    W_(Object.assign({}, NIGHT, {id:'koeln', name:'Köln bei Nacht', emoji:'⛪', sky:['#060a20','#16205a','#3a3a8a','#8a5aa0'], fog:0x2a2a5a, hemiSky:0xb0c0ff, hemiGround:0x1a1a3a,
        ground:0x22243a, walk:0xa8a8c8, buildings:['#5a5a7a','#6a5a6a','#4a5a7a','#7a6a5a'], lit:['#ffd27a','#fff0b0'], dark:'#1a1c34', litChance:.55,
        facade:'euro', roof:'pitched', roofColor:0x2a2a3a, low:'crates', train:'#c8ced8', landmark:'dom'})),
    W_({id:'schwarzwald', name:'Schwarzwald', emoji:'🌲', sky:['#2a8ad8','#6ac0f0','#c8f0d0','#f0ffd8'], fog:0xc8e8c8, hemiSky:0xffffff, hemiGround:0x3a5a3a,
        ground:0x4a9a4a, walk:0xe8e0c8, buildings:['#f4ecd8','#f0e0c0','#e8d8b8'], lit:['#ffd98a'], dark:'#4a3a2a', bh:[5, 11], facade:'timber', roof:'pitched', roofColor:0x6a3a2a,
        prop:'pine', low:'hay', train:'#d62b2b', landmark:'hills'}),
    W_({id:'alpen', name:'Bayerische Alpen', emoji:'🏰', sky:['#3a7ae0','#8ac0f4','#e0f0fc','#ffffff'], fog:0xe8f2fc, hemiSky:0xffffff, hemiGround:0x8aa0c8, sunI:.85,
        ground:0xf6faff, road:0xd8e2f0, buildings:['#f4ecd8','#f0e0c0','#e8d8b8'], lit:['#ffd98a'], dark:'#4a3a2a', bh:[5, 12], facade:'timber', roof:'pitched', roofColor:0xf4f8ff,
        prop:'pine', low:'snowman', train:'#2f6bff', landmark:'castle', snow:true}),
  ]},
  {id:'ma', name:'Marokko', flag:'🇲🇦', need:0, banner:'STOP', worlds:[
    W_({id:'marrakesch', name:'Marrakesch', emoji:'🕌', sky:['#3a8ae8','#7ac4f4','#ffe0b0','#ffc080'], fog:0xf8d0a0, hemiSky:0xfff0dc, hemiGround:0x8a4a2a,
        ground:0xd8885a, walk:0xf0c8a0, road:0xf4dcc8, buildings:['#d8784a','#c86a40','#e88a5a','#c85a3a','#e8a070'], lit:['#5a2a1a'], dark:'#7a3a20', litChance:.5, bh:[5, 13],
        facade:'arch', prop:'palm', low:'pots', train:'#1a8a5a', landmark:'minaret'}),
    W_({id:'sahara', name:'Sahara', emoji:'🐪', sky:['#2a7ae0','#6ab8f4','#ffe8b8','#ffcf8a'], fog:0xfcdcaa, hemiSky:0xfff6e0, hemiGround:0xa86a3a,
        ground:0xf2c070, walk:0xf8dca8, road:0xfaead0, buildings:['#e8b070','#d89a5a','#f0c88a'], lit:['#6a4020'], dark:'#8a5a30', bh:[2.5, 6],
        facade:'arch', prop:'palm', low:'camel', train:'#c8502a', landmark:'dunes'}),
    W_({id:'chefchaouen', name:'Chefchaouen', emoji:'💙', sky:['#2a7ae0','#6ab8f4','#c8ecfc','#f4fbff'], fog:0xd0ecfa, hemiSky:0xffffff, hemiGround:0x3a5a9a,
        ground:0x8ab0e0, walk:0xc8dcf8, road:0xd8e8ff, buildings:['#3a7ae0','#5a9af0','#7ab4f8','#2a5ac8','#a8d0ff'], lit:['#1a2a5a'], dark:'#2a3a7a', bh:[4, 10],
        facade:'arch', prop:'bush', low:'pots', train:'#f0f0f0', landmark:'mountains'}),
    W_(Object.assign({}, NIGHT, {id:'casablanca', name:'Casablanca bei Nacht', emoji:'🌙', sky:['#050a24','#10205a','#1a4a8a','#3a8aa0'], fog:0x1a3a6a, hemiSky:0xa8c8ff, hemiGround:0x1a2a3a,
        ground:0x1a2438, walk:0xa8b8c8, buildings:['#e8e8f0','#d8d8e8','#c8d0e0'], lit:['#ffd27a','#fff0b0'], dark:'#2a3450', litChance:.55,
        facade:'arch', prop:'palm', low:'pots', train:'#1a8a5a', landmark:'mosque'})),
    W_({id:'atlas', name:'Atlas-Gebirge', emoji:'⛰️', sky:['#3a6ad0','#7ab0ec','#e0ecf8','#fff4e8'], fog:0xe8e4e0, hemiSky:0xffffff, hemiGround:0x7a5a4a,
        ground:0xb07a5a, walk:0xe0c8b0, buildings:['#b86a4a','#a85a3a','#c87a5a'], lit:['#5a2a1a'], dark:'#6a3a2a', bh:[4, 9],
        facade:'arch', prop:'pine', low:'camel', train:'#d62b2b', landmark:'mountains', snow:true}),
  ]},
  {id:'fr', name:'Frankreich', flag:'🇫🇷', need:5000, banner:'ATTENTION', worlds:[
    W_({id:'paris', name:'Paris', emoji:'🗼', sky:['#4a7ae0','#8ab8f4','#f0e0f0','#ffe0c8'], fog:0xf0dce0, hemiSky:0xfff8f0, hemiGround:0x5a5a7a,
        ground:0x7a9a6a, buildings:['#f4e8d0','#f0dcc0','#e8d4b8','#f8f0e0'], lit:['#ffe9a8'], dark:'#3a4a6a', facade:'euro', roof:'pitched', roofColor:0x5a6a88,
        low:'cafe', train:'#2f6bff', landmark:'eiffel'}),
    W_(Object.assign({}, NIGHT, {id:'parisnacht', name:'Paris bei Nacht', emoji:'✨', sky:['#060824','#1a1a5a','#4a3a8a','#c06a8a'], fog:0x3a2a6a, hemiSky:0xc0c8ff, hemiGround:0x1a1a3a,
        ground:0x22243a, walk:0xb0a8c8, buildings:['#8a7a8a','#7a6a7a','#9a8a8a'], lit:['#ffd27a','#fff0b0'], dark:'#1a1c34', litChance:.6,
        facade:'euro', roof:'pitched', roofColor:0x2a2a44, low:'cafe', train:'#c8ced8', landmark:'eiffel', lmGlow:true})),
    W_({id:'provence', name:'Provence', emoji:'💜', sky:['#3a8ae8','#7ac4f4','#f0e0ff','#fff0d8'], fog:0xf0e0f0, hemiSky:0xffffff, hemiGround:0x6a4a8a,
        ground:0x8a6ac8, walk:0xf0e0c8, buildings:['#f0dcb0','#e8c898','#f4e4c0'], lit:['#6a4a2a'], dark:'#8a6a4a', bh:[4, 9], facade:'euro', roof:'pitched', roofColor:0xd8744a,
        prop:'lavender', low:'hay', train:'#9a4ad8', landmark:'hills'}),
    W_({id:'cotedazur', name:'Côte d’Azur', emoji:'⛵', sky:['#1a80e0','#4ac0f8','#a8ecfc','#fff6d8'], fog:0xc4f0fa, hemiSky:0xffffff, hemiGround:0x6ab0c0,
        ground:0xf6e0a0, walk:0xfff2d6, buildings:['#ffd0a0','#ffe8b0','#ffb0a0','#fff4e0'], lit:['#3a7aa8'], dark:'#5a9ac0', facade:'euro', roof:'pitched', roofColor:0xd8744a,
        prop:'palm', low:'sandcastle', train:'#ff7a1a', landmark:'lighthouse'}),
    W_({id:'montblanc', name:'Mont Blanc', emoji:'🏔️', sky:['#2a6ad8','#7ab4f0','#e0f0fc','#ffffff'], fog:0xe8f2fc, hemiSky:0xffffff, hemiGround:0x8aa0c8, sunI:.85,
        ground:0xf6faff, road:0xd8e2f0, buildings:['#f4ecd8','#e8d0b0','#d8c0a0'], lit:['#ffd98a'], dark:'#4a3a2a', bh:[5, 12], facade:'timber', roof:'pitched', roofColor:0xf4f8ff,
        prop:'pine', low:'snowman', train:'#d62b2b', landmark:'mountains', snow:true}),
  ]},
  {id:'jp', name:'Japan', flag:'🇯🇵', need:10000, banner:'ACHTUNG 注意', worlds:[
    W_({id:'tokio', name:'Tokio', emoji:'🗾', sky:['#3a7ae0','#8ab8f4','#ffe0e8','#fff0d8'], fog:0xf4dce4, hemiSky:0xfff8f8, hemiGround:0x5a5a7a,
        ground:0x6a6a7a, buildings:['#e8e8f0','#c8d8e8','#f0d0d8','#d8e0f0','#b0c0d8'], lit:['#ffe9a8'], dark:'#3a4a6a', facade:'shop', bh:[10, 28],
        prop:'blossom', low:'cones', train:'#3ac850', landmark:'tokyo'}),
    W_({id:'kyoto', name:'Kyoto Kirschblüte', emoji:'🌸', sky:['#4a8ae8','#9ac8f4','#ffe0f0','#fff4f8'], fog:0xffe4f0, hemiSky:0xffffff, hemiGround:0x8a5a7a,
        ground:0x8ab07a, walk:0xf4e8e0, buildings:['#8a4a3a','#a85a3a','#f4e8d8','#6a3a2a'], lit:['#ffe0a0'], dark:'#3a2a2a', bh:[4, 9], facade:'japan', roof:'pagoda', roofColor:0x3a3a4a,
        prop:'blossom', low:'lanterns', train:'#d62b2b', landmark:'pagoda'}),
    W_({id:'fuji', name:'Am Berg Fuji', emoji:'🗻', sky:['#2a7ae0','#6ab8f4','#d8f0fc','#fff8f0'], fog:0xe0f0fa, hemiSky:0xffffff, hemiGround:0x4a6a5a,
        ground:0x6aa06a, walk:0xf0e8d8, buildings:['#8a4a3a','#f4e8d8','#a85a3a'], lit:['#ffe0a0'], dark:'#3a2a2a', bh:[4, 9], facade:'japan', roof:'pagoda', roofColor:0x2a3a4a,
        prop:'blossom', low:'lanterns', train:'#f4f4f4', landmark:'fuji'}),
    W_(Object.assign({}, NIGHT, {id:'osaka', name:'Osaka bei Nacht', emoji:'🏮', sky:['#0a0418','#2a0a4a','#6a1a6a','#d04a6a'], fog:0x4a1a4a, hemiSky:0xffc0e0, hemiGround:0x2a1030,
        ground:0x22142a, walk:0xc8a8c8, buildings:['#2a2040','#3a2030','#202a40','#402a3a'], lit:['#ff5a5a','#7df9ff','#ffe066','#ff6ae0'], dark:'#120a1a', litChance:.65,
        facade:'shop', prop:'lantern', low:'cones', train:'#3ac850', landmark:'skyline'})),
    W_({id:'hokkaido', name:'Winter in Hokkaido', emoji:'⛄', sky:['#5a8ad8','#9cc4ec','#dceaf8','#f6fbff'], fog:0xe4eef8, hemiSky:0xffffff, hemiGround:0x8aa0c8, sunI:.85,
        ground:0xf6faff, road:0xd8e2f0, buildings:['#8a4a3a','#f4e8d8','#a85a3a'], lit:['#ffd98a'], dark:'#3a2a2a', bh:[4, 9], facade:'japan', roof:'pagoda', roofColor:0xf4f8ff,
        prop:'pine', low:'snowman', train:'#d62b2b', landmark:'mountains', snow:true}),
  ]},
  {id:'eg', name:'Ägypten', flag:'🇪🇬', need:16000, banner:'STOP', worlds:[
    W_({id:'kairo', name:'Kairo', emoji:'🐫', sky:['#3a8ae8','#7cc0f4','#ffe8c0','#ffd090'], fog:0xf8dcaa, hemiSky:0xfff4e0, hemiGround:0x9a6a3a,
        ground:0xe0b070, walk:0xf0d8b0, road:0xf4e8d0, buildings:['#e8c890','#d8b078','#f0d8a8','#c8a068'], lit:['#5a3a1a'], dark:'#7a5a30', bh:[5, 14],
        facade:'arch', prop:'palm', low:'pots', train:'#1a6ac8', landmark:'pyramids'}),
    W_({id:'gizeh', name:'Gizeh-Plateau', emoji:'🔺', sky:['#2a7ae0','#6ab8f4','#ffeac0','#ffd494'], fog:0xfcdcaa, hemiSky:0xfff6e0, hemiGround:0xa86a3a,
        ground:0xf2c878, walk:0xf8dca8, road:0xfaead0, buildings:['#e8c080','#d8a868'], lit:['#6a4020'], dark:'#8a5a30', bh:[2.5, 6],
        facade:'arch', prop:'palm', low:'camel', train:'#c8502a', landmark:'sphinx'}),
    W_({id:'luxor', name:'Luxor', emoji:'🏺', sky:['#3a7ae0','#7ab8f4','#ffd8b0','#ffb878'], fog:0xf8c898, hemiSky:0xfff0dc, hemiGround:0x8a5a3a,
        ground:0xd8a868, walk:0xf0d0a0, road:0xf4e0c8, buildings:['#e0b878','#c8a060','#e8c890'], lit:['#5a3a1a'], dark:'#7a5a30', bh:[4, 10],
        facade:'arch', prop:'palm', low:'pots', train:'#1a6ac8', landmark:'obelisk'}),
    W_(Object.assign({}, NIGHT, {id:'nil', name:'Nil bei Nacht', emoji:'🌌', sky:['#04061a','#101a4a','#2a2a6a','#6a3a6a'], fog:0x2a2050, hemiSky:0xc0c0ff, hemiGround:0x1a1a2a,
        ground:0x2a2420, walk:0xc8b8a0, buildings:['#8a7058','#7a6048','#9a7a5a'], lit:['#ffd27a','#fff0b0'], dark:'#2a2018', litChance:.55,
        facade:'arch', prop:'palm', low:'camel', train:'#c8ced8', landmark:'pyramids'})),
    W_({id:'rotesmeer', name:'Rotes Meer', emoji:'🐠', sky:['#1a80e0','#4ac0f8','#a8ecfc','#fff0d0'], fog:0xc8eef8, hemiSky:0xffffff, hemiGround:0x6aa0b0,
        ground:0xf0d898, walk:0xfff0d0, buildings:['#fff4e0','#ffe0c0','#e8f8ff','#ffd8a8'], lit:['#3a7aa8'], dark:'#5a9ac0', bh:[4, 12], facade:'arch',
        prop:'umbrella', low:'sandcastle', train:'#ff7a1a', landmark:'mesa'}),
  ]},
  {id:'br', name:'Brasilien', flag:'🇧🇷', need:24000, banner:'PARE', worlds:[
    W_({id:'rio', name:'Rio de Janeiro', emoji:'🙏', sky:['#1a80e8','#5ac0f8','#c8f0fc','#fff4d8'], fog:0xd0f0f8, hemiSky:0xffffff, hemiGround:0x4a7a5a,
        ground:0x4ab05a, buildings:['#ffd04a','#4ac8a0','#ff7a5a','#5a9af0','#f4f4f4'], lit:['#2a5a8a'], dark:'#3a4a6a', facade:'favela',
        prop:'palm', low:'drums', train:'#3ac850', landmark:'cristo'}),
    W_({id:'copacabana', name:'Copacabana', emoji:'🏖️', sky:['#1a80e0','#4ac0f8','#a8ecfc','#fff6d8'], fog:0xc4f0fa, hemiSky:0xffffff, hemiGround:0x6ab0b0,
        ground:0xf6e0a0, walk:0xfff2d6, buildings:['#ffffff','#ffe8b0','#c8f0ff','#ffd0c0'], lit:['#3a7aa8'], dark:'#5a9ac0',
        prop:'umbrella', low:'sandcastle', train:'#ffd23a', landmark:'sugarloaf'}),
    W_({id:'amazonas', name:'Amazonas', emoji:'🦜', sky:['#3a9ae0','#7ad0f0','#c8f4d8','#e8ffd0'], fog:0xb8e8b8, hemiSky:0xf0fff0, hemiGround:0x2a5a2a,
        ground:0x2a8a3a, walk:0xc8b890, road:0xe0d8c0, buildings:['#8a6a4a','#a8805a','#6a5a3a'], lit:['#3a2a1a'], dark:'#4a3a20', bh:[3, 6], facade:'timber', roof:'pitched', roofColor:0xc8a050,
        prop:'jungle', low:'crates', train:'#3ac850', landmark:'hills'}),
    W_({id:'favela', name:'Bunte Favela', emoji:'🎨', sky:['#2a8ae8','#6ac4f8','#ffe8d0','#ffd8a8'], fog:0xf8e0c0, hemiSky:0xffffff, hemiGround:0x6a4a3a,
        ground:0x8a6a4a, buildings:['#ff5a5a','#ffd04a','#4ac8a0','#5a9af0','#c86af0','#ff9a3a'], lit:['#2a3a5a'], dark:'#3a3a5a', bh:[5, 14], facade:'favela',
        prop:'bush', low:'drums', train:'#ffd23a', landmark:'cristo'}),
    W_(Object.assign({}, NIGHT, {id:'karneval', name:'Karneval bei Nacht', emoji:'🎉', sky:['#0a0420','#3a0a5a','#8a1a8a','#ff6a5a'], fog:0x5a1a6a, hemiSky:0xffd0ff, hemiGround:0x2a1040,
        ground:0x2a1438, walk:0xf0c8ff, road:0xf0d8ff, buildings:['#ff5a5a','#ffd04a','#4ac8a0','#5a9af0','#c86af0'], lit:['#fff4c0','#ff6ae0','#7df9ff','#7dff7a'], dark:'#2a1040', litChance:.65,
        facade:'favela', prop:'neon', low:'drums', train:'#ff3b6b', landmark:'sugarloaf'})),
  ]},
];
COUNTRIES.forEach(c => c.worlds.forEach((w, i) => { w.at = WORLD_AT[i]; w.country = c.id; }));
const countryById = id => COUNTRIES.find(c => c.id === id) || COUNTRIES[0];
let WORLDS = COUNTRIES[0].worlds;

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
  {id:'worlds', stat:'worldMax',     base:150, targets:[1,2,3,4,5], text:n => `Erreiche die ${n + 1}. Welt eines Landes`},
  {id:'lands',  stat:'countriesPlayed', base:120, targets:[2,3,5,7], text:n => `Lauf in ${n} verschiedenen Ländern`},
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
