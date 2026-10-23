import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFile(path.join(root,p),'utf8');
const [template,css,core,application,catalog,qr,reader,example]=await Promise.all([
 'index.html','styles.css','core.js','app.js','data/catalog.json','vendor/qrcode.js','vendor/jsQR.js','examples/achats-demo.csv'
].map(read));
const main=application.replace(/^import[^\n]+\n/,'').replace("const r=await fetch('data/catalog.json');if(!r.ok)throw Error('catalogue');const data=await r.json();", "const data=JSON.parse(document.getElementById('embedded-catalog').textContent);")
 .replace('href="examples/achats-demo.csv" download',`href="data:text/csv;base64,${Buffer.from(example).toString('base64')}" download="achats-demo.csv"`);
let html=template.replace('<link rel="stylesheet" href="styles.css">',()=>`<style>${css}</style>`)
 .replace('<a href="docs/CAHIER-DES-CHARGES.md" target="_blank">Cahier des charges ↗</a>','');
const scripts=`<script id="embedded-catalog" type="application/json">${catalog.replace(/</g,'\\u003c')}</script><script>${qr}</script><script>${reader}</script><script type="module">${core.replace(/^export /gm,'')}\n${main}</script>`;
html=html.replace('<script src="vendor/qrcode.js"></script><script src="vendor/jsQR.js"></script><script type="module" src="app.js"></script>',()=>scripts);
const dist=path.join(root,'dist');await fs.mkdir(dist,{recursive:true});
for(const entry of ['staff','client'])await fs.writeFile(path.join(dist,entry+'.html'),html.replace('<body>',`<body data-entry="${entry}">`));
await fs.writeFile(path.join(dist,'index.html'),`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#191919"><title>Winess Club — Accès à la démonstration</title><style>body{margin:0;background:#faf9f6;color:#191919;font:16px Arial,sans-serif}main{max-width:540px;margin:12vh auto;padding:24px}h1{font:42px Georgia,serif}p{line-height:1.7;color:#666}a{display:block;text-align:center;padding:18px;margin:16px 0;background:#191919;color:#fff;text-decoration:none;border-radius:6px}a.client{background:white;color:#191919;border:1px solid #ccc}small{display:block;margin-top:28px;color:#777;line-height:1.6}</style></head><body><main><h1>Winess Club</h1><p>Démonstration à tester sur ordinateur ou iPhone.</p><a href="staff.html">Boutique · Vendeur et administration</a><a class="client" href="client.html">Espace client</a><small>Utilisez uniquement des informations fictives. Les données restent dans le navigateur de chaque appareil. La synchronisation entre appareils et les accès sécurisés ne sont pas encore activés.</small></main></body></html>`);
await fs.writeFile(path.join(dist,'.nojekyll'),'');
console.log('Deux accès générés : dist/staff.html et dist/client.html.');
