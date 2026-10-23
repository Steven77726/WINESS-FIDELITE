import {parseCSV,clean,importCatalog,validatePurchases,safeProductURL,safeImageURL} from './core.js';
const $=s=>document.querySelector(s);
const entry=document.body.dataset.entry||'demo';
let clientEntered=false,adminEntered=false,sellerEntered=false;
let sellerIdentity=null,adminIdentity=null;
const CLIENT_SESSION='winess-demo-client-session-v1',STAFF_SESSION='winess-demo-staff-session-v1';
const STORE_KEY='winess-club-demo-shared-v4';let storeRevision=0,sharedReady=false,cameraStop=null,sharedNeedsRender=false;
const localShared=location.protocol==='http:'||location.protocol==='https:';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const euro=n=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n);
const fmt=n=>new Intl.NumberFormat('fr-FR').format(n);
const state={notifications:[],view:'client',member:'DEMO-001',seller:'DEMO-001',rate:1,vip:10,threshold:1000,catalog:{},summary:null,sourceCatalog:null,pending:null,members:[{id:'DEMO-001',first:'Camille',last:'Martin',phone:'336000000001',vip:true},{id:'DEMO-002',first:'Alex',last:'Bernard',phone:'336000000002',vip:false}],lines:[],tickets:Object.create(null)};
let loaded=false,siteProducts={};
function notice(text){$('#notice').textContent=text;$('#notice').style.display='block';clearTimeout(notice.timer);notice.timer=setTimeout(()=>$('#notice').style.display='none',5000);}
function qr(id){if(!window.qrcode)return '<p>QR indisponible. Utilisez l’identifiant membre.</p>';const q=window.qrcode(0,'M');q.addData('winess-club:member:'+id);q.make();return q.createSvgTag({cellSize:4,margin:4,scalable:true});}
function points(id){return Object.values(state.tickets).filter(t=>t.client===id).reduce((n,t)=>n+t.points,0);}
function member(id){return state.members.find(m=>m.id===id);}
function personOptions(id){return state.members.map(m=>`<option value="${esc(m.id)}" ${m.id===id?'selected':''}>${esc(m.first+' '+m.last)}</option>`).join('');}
function modal(html){$('#modal-content').innerHTML=html;$('#modal').showModal();}
function date(s){return new Date(s+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});}
function purchaseRows(m){
  const groups=Map.groupBy?Map.groupBy(state.lines.filter(l=>l.id_client===m.id),l=>l.id_ticket):state.lines.filter(l=>l.id_client===m.id).reduce((map,l)=>{map.set(l.id_ticket,[...(map.get(l.id_ticket)||[]),l]);return map;},new Map());
  if(!groups.size)return '<div class="panel empty">Aucun achat pour ce membre. L’administration peut importer un fichier de test.</div>';
  return [...groups.entries()].sort((a,b)=>b[1][0].date.localeCompare(a[1][0].date)).map(([id,ls])=>`<article class="purchase"><div class="purchase-head"><div><strong>${esc(date(ls[0].date))}</strong> <span> · Boutique · ${esc(id)}</span></div><strong>+ ${fmt(state.tickets[id]?.points||0)} points</strong></div>${ls.map(l=>{
    const p=Object.hasOwn(state.catalog,l.sku)?state.catalog[l.sku]:null,url=safeProductURL(p?.url),image=safeImageURL(p?.image);
    const picture=image?`<img src="${esc(image)}" alt="${esc(p.name)}" loading="lazy" referrerpolicy="no-referrer">`:'<span class="placeholder" aria-label="Photo indisponible">◇</span>';
    return `<div class="product-row">${url?`<a class="product-photo" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="Voir ${esc(p.name)} sur winess.com">${picture}</a>`:`<div class="product-photo">${picture}</div>`}<div class="product-copy"><strong>${esc(l.nom_produit||p?.name||l.sku)}</strong><p>${esc(p?.variant==='Default Title'?'':p?.variant||'')} · SKU ${esc(l.sku)}</p>${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Retrouver sur winess.com ↗</a>`:'<span class="muted">Correspondance à vérifier</span>'}</div><div class="row-price">${euro(l.total_ttc)}<small>Quantité : ${fmt(l.quantite)}</small></div></div>`;
  }).join('')}</article>`).join('');
}
function renderClient(){
  if(!member(state.member)){state.member=state.members[0].id;}
  const m=member(state.member),p=points(m.id),progress=Math.min(100,p/state.threshold*100);
  $('#main').innerHTML=`<div class="intro"><div><p class="eyebrow">BIENVENUE DANS VOTRE CLUB</p><h1>Bonjour ${esc(m.first)}.</h1><p class="sub">Vos découvertes d’hier. Vos privilèges de demain.</p></div><label class="select-label">Membre de démonstration<select id="member-select">${personOptions(m.id)}</select></label></div><div class="hero-grid"><section class="member-card" aria-label="Carte membre"><div class="card-top"><span class="wordmark">winess club</span><span class="vip">${m.vip?'MEMBRE VIP':'MEMBRE CLUB'}</span></div><div><div class="card-name">${esc(m.first+' '+m.last)}</div><div class="card-id">${esc(m.id)}</div></div><div class="card-bottom"><button id="show-card">Présenter ma carte ↗</button><button id="zoom-qr" class="qr-small" aria-label="Agrandir mon QR code">${qr(m.id)}</button></div></section><section class="panel"><p class="eyebrow">VOTRE FIDÉLITÉ RÉCOMPENSÉE</p><div class="points">${fmt(p)}<small>points cumulés</small></div><p class="muted">Objectif de démonstration : ${fmt(state.threshold)} points</p><div class="progress" role="progressbar" aria-label="Progression vers l’objectif de démonstration" aria-valuemin="0" aria-valuemax="${state.threshold}" aria-valuenow="${Math.min(p,state.threshold)}"><span style="width:${progress}%"></span></div><p class="muted">${Math.max(0,state.threshold-p)} points avant cet objectif. Aucun avantage automatique n’est encore défini.</p></section></div><div class="privilege"><span class="symbol">✧</span><div><strong>${m.vip?`Votre privilège VIP : ${state.vip} % de remise`:'Votre carte vous accompagne en boutique'}</strong><p>${m.vip?'Présentez votre carte. Votre vendeur applique la remise dans Wino.':'Retrouvez vos achats et vos points dans votre espace.'}</p></div></div><div class="section-title"><h2>Vos dernières découvertes</h2><span>${state.lines.filter(l=>l.id_client===m.id).length} lignes d’achat</span></div>${purchaseRows(m)}`;
  $('#member-select').onchange=e=>{state.member=e.target.value;renderClient();};
  const showQR=()=>{modal(`<div class="qr-full"><p class="eyebrow">VOTRE CARTE WINESS CLUB</p><h2>${esc(m.first+' '+m.last)}</h2><button id="dismiss-qr" class="qr-zoom" aria-label="Refermer le QR code">${qr(m.id)}</button><p class="code">${esc(m.id)}</p><p class="muted">Présentez ce QR en boutique.<br>Touchez le QR pour le refermer.</p></div>`);$('#dismiss-qr').onclick=()=>$('#modal').close();};
  $('#show-card').onclick=showQR;$('#zoom-qr').onclick=showQR;
  const edit=document.createElement('button');edit.className='btn secondary';edit.textContent='Modifier mes informations';edit.onclick=()=>editMember(m);$('#main .intro').append(edit);

  renderNotifications(m);
  bindImages();
}
function bindImages(){document.querySelectorAll('.product-photo img').forEach(img=>img.onerror=()=>{const e=document.createElement('span');e.className='placeholder';e.textContent='◇';e.setAttribute('aria-label','Photo indisponible');img.replaceWith(e);});}
function editMember(m){modal(`<h2>Corriger la fiche</h2><p class="hint">Modifications de démonstration partagées dans ce navigateur via les liens locaux.</p><form id="edit-form" class="form-grid"><label>Prénom<input name="first" value="${esc(m.first)}" required maxlength="80"></label><label>Nom<input name="last" value="${esc(m.last)}" required maxlength="80"></label><label class="wide">Téléphone (facultatif, 12 chiffres)<input name="phone" minlength="12" maxlength="12" inputmode="numeric" title="Saisissez exactement 12 chiffres, sans espace ni signe +." value="${esc(m.phone||'Téléphone non renseigné')}" pattern="[0-9]{12}"></label><button class="btn wide">Enregistrer</button></form>`);$('#edit-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),phone=clean(f.get('phone'));if(phone&&state.members.some(x=>x.id!==m.id&&x.phone===phone)){notice('Téléphone déjà associé à un autre membre.');return;}const first=clean(f.get('first')),last=clean(f.get('last'));if(!first||!last){notice('Nom et prénom requis.');return;}Object.assign(m,{first,last,phone});saveShared();$('#modal').close();render();notice('Fiche mise à jour dans la démonstration.');};}
function renderAdmin(){
  const s=state.summary;
  $('#main').innerHTML=`<p class="eyebrow">ADMINISTRATION</p><h1>Le club, côté coulisses.</h1><p class="sub">Préparez vos imports, vérifiez vos produits et ajustez les règles du club.</p><div class="metric-grid"><div class="panel metric"><span>MEMBRES DE TEST</span><strong>${state.members.length}</strong></div><div class="panel metric"><span>PRODUITS RELIÉS AU SITE</span><strong>${fmt(Object.values(state.catalog).filter(p=>p.url).length)}</strong></div><div class="panel metric"><span>TICKETS IMPORTÉS</span><strong>${Object.keys(state.tickets).length}</strong></div></div><div class="note">Cette première version sert à valider les parcours. Avec les liens HTTP locaux, membres, achats et règles sont partagés entre les trois espaces dans ce navigateur et conservés sur cet ordinateur. Les comptes, SMS et droits d’accès réels ne sont pas encore connectés.</div><div class="grid2"><div class="stack"><section class="panel"><h2>1. Catalogue produits</h2><p class="hint">L’export Numbers fourni contient le catalogue, pas les achats. Pour un nouvel import, utilisez Numbers → Fichier → Exporter vers → CSV. Les SKU sont conservés comme du texte.</p>${s?`<p class="hint">Analyse du 23 octobre 2026 : ${fmt(s.sourceRows)} références · ${fmt(s.matchedSku)} correspondances exactes · ${fmt(s.unmatchedSku)} SKU sans correspondance · ${s.missingSku} lignes sans SKU.</p>`:'<p class="error">Le catalogue n’a pas pu être chargé. Rechargez depuis le serveur local.</p>'}<label class="field">Catalogue CSV<input id="catalog-file" type="file" accept=".csv,text/csv"></label><div id="catalog-report"></div><div class="actions"><button class="btn secondary" id="inspect-catalog">Voir les correspondances</button></div></section><section class="panel"><h2>2. Importer des achats</h2><p class="hint">Un fichier distinct doit contenir les tickets, les clients, les SKU, les quantités et les montants. Tous les achats d’un ticket doivent figurer dans le même import. Le total TTC est le montant de la ligne après remise, pas le prix unitaire.</p><a href="examples/achats-demo.csv" download class="hint">Télécharger le modèle d’achats CSV ↗</a><label class="field" style="margin-top:15px">Achats CSV<input id="purchase-file" type="file" accept=".csv,text/csv"></label><div id="purchase-report"></div></section></div><div class="stack"><section class="panel"><h2>Règles de fidélité</h2><p class="hint">Valeurs de démonstration à valider. Les nouvelles règles s’appliquent aux prochains tickets, sans modifier les points déjà attribués.</p><form id="settings" class="form-grid"><label>Points par euro TTC<input name="rate" type="number" step="0.01" min="0" max="100" value="${state.rate}" required></label><label>Remise VIP (%)<input name="vip" type="number" step="1" min="0" max="100" value="${state.vip}" required></label><label class="wide">Objectif affiché (points)<input name="threshold" type="number" step="1" min="1" max="1000000" value="${state.threshold}" required></label><button class="btn wide">Enregistrer les règles</button></form></section><section class="panel"><h2>Membres</h2><p class="hint">Le statut VIP est attribué manuellement dans cette démonstration. La règle d’attribution reste à définir.</p><div id="member-list">${state.members.map(m=>`<div class="product-row" style="padding:13px 0"><span class="product-copy">${esc(m.first+' '+m.last)}<p>${esc(m.id)}</p></span><label class="check"><input type="checkbox" data-vip="${esc(m.id)}" ${m.vip?'checked':''}>VIP</label></div>`).join('')}</div><div class="actions"><button id="add-member" class="btn secondary">Ajouter un membre de test</button></div></section><section class="panel"><h2>Repartir à zéro</h2><p class="hint">Efface les données partagées de démonstration de ce navigateur et recharge les exemples. Aucun serveur n’est modifié.</p><button id="reset" class="btn danger">Réinitialiser la démonstration</button></section></div></div>`;
  const saleTickets=Object.entries(state.tickets).map(([id,t])=>{const m=member(t.client),lines=state.lines.filter(l=>l.id_ticket===id);return `<tr><td>${esc(id)}</td><td>${esc(m?m.first+' '+m.last:t.client)}</td><td>${lines.length}</td><td>${euro(lines.reduce((n,l)=>n+l.total_ttc,0))}</td><td>${t.points}</td></tr>`;}).join('');
  $('#main').insertAdjacentHTML('beforeend',`<section class="panel" style="margin-top:24px"><h2>Achats enregistrés en boutique</h2><p class="hint">Même historique que les espaces vendeur et client, partagé dans ce navigateur.</p><div class="table-wrap"><table><thead><tr><th>Ticket</th><th>Client</th><th>Lignes</th><th>Total TTC</th><th>Points</th></tr></thead><tbody>${saleTickets}</tbody></table></div></section>`);
  $('#settings').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);state.rate=Number(f.get('rate'));state.vip=Number(f.get('vip'));state.threshold=Number(f.get('threshold'));state.pending=null;saveShared();renderAdmin();notice('Règles enregistrées pour les prochains tickets.');};
  document.querySelectorAll('[data-vip]').forEach(i=>i.onchange=()=>{member(i.dataset.vip).vip=i.checked;saveShared();notice('Statut VIP mis à jour.');});
  $('#reset').onclick=()=>modal('<h2>Réinitialiser la démonstration ?</h2><p>Les imports et modifications partagés de cette démonstration seront perdus dans tous les espaces de ce navigateur.</p><button class="btn danger" id="confirm-reset">Réinitialiser</button>');
  $('#reset').addEventListener('click',()=>{$('#confirm-reset').onclick=()=>{try{localStorage.removeItem(STORE_KEY);sessionStorage.removeItem('winess-client-demo');localStorage.removeItem(CLIENT_SESSION);localStorage.removeItem(STAFF_SESSION);}catch{}location.reload();};});
  $('#add-member').onclick=()=>addMember();
  $('#inspect-catalog').onclick=()=>showCatalog();
  $('#catalog-file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>5e6)throw Error('Fichier limité à 5 Mo pour cette démonstration.');const result=importCatalog(parseCSV(await file.text()));$('#catalog-report').innerHTML=`<div class="report">${Object.keys(result.products).length} SKU reconnus · ${result.missing.length} lignes sans SKU, exclues.${result.errors.length?`<ul class="error">${result.errors.slice(0,10).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p>Les liens seront repris uniquement pour les SKU exacts du catalogue Winess vérifié.</p><button class="btn" id="confirm-catalog">Confirmer le catalogue</button>'}</div>`;if(!result.errors.length)$('#confirm-catalog').onclick=()=>{state.catalog=Object.fromEntries(Object.entries(result.products).map(([k,v])=>[k,{...v,...siteProducts[k]}]));state.pending=null;saveShared();renderAdmin();notice('Catalogue chargé en mémoire.');};}catch(err){$('#catalog-report').innerHTML=`<p class="error">${esc(err.message)}</p>`;}};
  $('#purchase-file').onchange=async e=>{state.pending=null;try{const file=e.target.files[0];if(!file)return;if(file.size>5e6)throw Error('Fichier limité à 5 Mo.');const result=validatePurchases(parseCSV(await file.text()),state.lines,state.members,state.catalog,state.rate);state.pending=result;$('#purchase-report').innerHTML=`<div class="report"><strong>${result.lines.length} nouvelles lignes · ${Object.keys(result.tickets).length} tickets</strong><p>${result.duplicates} doublons déjà importés ignorés · ${result.unknown} SKU absents du catalogue courant.</p>${result.errors.length?`<p class="error">${result.errors.length} erreur(s). Aucun achat ne sera importé.</p><ul class="error">${result.errors.slice(0,12).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:`<p>${fmt(Object.values(result.tickets).reduce((n,t)=>n+t.points,0))} points à attribuer. Les SKU inconnus restent visibles sans lien produit.</p><button class="btn" id="confirm-purchases" ${result.lines.length?'':'disabled'}>Confirmer l’import</button>`}</div>`;if(!result.errors.length)$('#confirm-purchases').onclick=()=>{if(state.pending!==result)return;if(!refreshBeforeWrite())return;const check=validatePurchases(parseCSVRows(result.lines),state.lines,state.members,state.catalog,state.rate);if(check.errors.length||check.duplicates){notice('Données modifiées : rechargez et vérifiez cet import.');return;}state.lines.push(...result.lines);Object.assign(state.tickets,result.tickets);createPurchaseNotifications(result.tickets);state.pending=null;saveShared();renderAdmin();notice('Achats importés. Ils sont visibles dans l’espace du membre concerné.');};}catch(err){$('#purchase-report').innerHTML=`<p class="error">${esc(err.message)}</p>`;}};
}
function addMember(){modal(`<h2>Ajouter un membre de test</h2><p class="hint">Aucun SMS ne sera envoyé. Ce membre n’aura pas de compte de connexion.</p><form id="add-form" class="form-grid"><label>Prénom<input name="first" required maxlength="80"></label><label>Nom<input name="last" required maxlength="80"></label><label class="wide">Téléphone (facultatif, 12 chiffres)<input name="phone" minlength="12" maxlength="12" inputmode="numeric" title="Saisissez exactement 12 chiffres, sans espace ni signe +." placeholder="123456789012" pattern="[0-9]{12}"></label><button class="btn wide">Créer la fiche de test</button></form>`);$('#add-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),phone=clean(f.get('phone')),first=clean(f.get('first')),last=clean(f.get('last'));if(!first||!last){notice('Nom et prénom requis.');return;}if(phone&&state.members.some(m=>m.phone===phone)){notice('Ce téléphone existe déjà.');return;}const id='DEMO-'+crypto.randomUUID().slice(0,8).toUpperCase();state.members.push({id,first,last,phone,vip:false});saveShared();$('#modal').close();renderAdmin();notice('Fiche créée : '+id);};}
function showCatalog(){modal(`<h2>Produits & correspondances</h2><label class="field">Rechercher un SKU ou un produit<input id="catalog-search" class="search" placeholder="SKU exact ou nom"></label><div id="catalog-results"></div>`);const search=q=>{const matches=Object.values(state.catalog).filter(p=>(p.sku+' '+p.name).toLowerCase().includes(q.toLowerCase())).slice(0,15);$('#catalog-results').innerHTML=matches.length?matches.map(p=>`<div class="product-row" style="padding:10px 0"><div class="product-copy"><strong>${esc(p.name)}</strong><p>${esc(p.sku)}</p>${safeProductURL(p.url)?`<a href="${esc(safeProductURL(p.url))}" target="_blank" rel="noopener noreferrer">Fiche exacte sur winess.com ↗</a>`:'Correspondance à vérifier'}</div></div>`).join(''):'<p class="empty">Aucun résultat.</p>';};$('#catalog-search').oninput=e=>search(e.target.value);search('');}
function render(){renderAccount();if(['staff','seller'].includes(entry)&&state.view==='seller'&&!sellerEntered&&!adminEntered){renderSellerEntry();return;}document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));if(entry==='client'&&!clientEntered){renderClientEntry();return;}if((entry==='admin'||(entry==='staff'&&state.view==='admin'))&&!adminEntered){renderAdminEntry();return;}document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));$('#breadcrumb').textContent='Le club / '+({client:'Mon espace',seller:'Boutique',admin:'Administration'}[state.view]);({client:renderClient,seller:renderSeller,admin:renderAdmin})[state.view]();}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;history.replaceState(null,'','#'+state.view);render();window.scrollTo({top:0});});
$('#close-modal').onclick=()=>$('#modal').close();
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))$('#modal').close();});
try{const r=await fetch('data/catalog.json');if(!r.ok)throw Error('catalogue');const data=await r.json();state.catalog=data.products;siteProducts={...data.products};state.summary=data.summary;loaded=true;}catch{notice('Catalogue indisponible. Ouvrez cette version via le serveur local.');}
if(loaded){
  const picks=Object.values(state.catalog).filter(p=>p.image).slice(0,4);
  picks.forEach((p,i)=>{const id=i<3?'DEMO-TICKET-01':'DEMO-TICKET-02',client=i<3?'DEMO-001':'DEMO-002';state.lines.push({id_ligne:'DEMO-LIGNE-'+i,id_ticket:id,date:i<3?'2026-10-20':'2026-10-19',id_client:client,sku:p.sku,nom_produit:p.name,quantite:1,total_ttc:[29.9,45,32.5,19.9][i]});});
  for(const l of state.lines){state.tickets[l.id_ticket]??={client:l.id_client,cents:0,rate:1,points:0};state.tickets[l.id_ticket].cents+=Math.round(l.total_ttc*100);}
  for(const t of Object.values(state.tickets))t.points=Math.floor(t.cents/100);
}
const v=location.hash.slice(1);if(entry==='demo'&&['client','seller','admin'].includes(v))state.view=v;
if(['client','admin','seller','staff'].includes(entry)){state.view=entry==='staff'?'seller':entry;document.body.classList.add('dedicated-entry');if(entry==='staff')document.body.classList.add('staff-entry');}
if(entry==='staff'&&['seller','admin'].includes(v))state.view=v;
initShared();
state.seller='';
restoreRemembered();
render();

function renderClientEntry(){
  $('#breadcrumb').textContent='Le club / Inscription';
  $('#main').innerHTML=`<div class="entry-wrap"><p class="eyebrow">BIENVENUE CHEZ WINESS</p><h1>Votre place au club.</h1><p class="sub">Renseignez vos informations pour découvrir votre espace et votre carte membre.</p><section class="panel"><h2>Rejoindre le club</h2><p class="hint">Inscription de démonstration : aucun SMS n’est envoyé. Utilisez des informations fictives. Votre fiche de test est conservée dans ce navigateur et visible dans son espace boutique. Le téléphone est facultatif.</p><form id="client-entry" class="form-grid"><label>Prénom<input name="first" autocomplete="given-name" required maxlength="80" placeholder="Camille"></label><label>Nom<input name="last" autocomplete="family-name" required maxlength="80" placeholder="Martin"></label><label class="wide">Téléphone (facultatif, 12 chiffres)<input name="phone" minlength="12" maxlength="12" inputmode="numeric" title="Saisissez exactement 12 chiffres, sans espace ni signe +." type="tel" autocomplete="tel" pattern="[0-9]{12}" placeholder="123456789012"></label><p class="hint wide">La vérification SMS et la connexion sécurisée seront activées avec le serveur. Cette démonstration partage la fiche avec la boutique et l’administration dans ce navigateur. Aucune connexion sécurisée n’est encore active.</p><button class="btn wide">Créer ma carte de démonstration</button></form><div class="actions"><button id="existing-demo" class="btn secondary">Découvrir avec un membre fictif</button></div></section></div>`;
  $('#client-entry').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),first=clean(f.get('first')),last=clean(f.get('last')),phone=clean(f.get('phone'));if(!first||!last){notice('Nom et prénom requis.');return;}if(phone&&state.members.some(m=>m.phone===phone)){notice('Ce téléphone est déjà utilisé dans cette démonstration. Utilisez un autre numéro fictif.');return;}const id='DEMO-'+crypto.randomUUID().slice(0,8).toUpperCase();state.members.push({id,first,last,phone,vip:false});state.member=id;clientEntered=true;state.view='client';saveShared();rememberClient();render();window.scrollTo({top:0});};
  $('#existing-demo').onclick=()=>{clientEntered=true;state.view='client';rememberClient();render();window.scrollTo({top:0});};
  $('#existing-demo').insertAdjacentHTML('beforebegin','<button id="returning-client" class="btn secondary">Retrouver ma carte</button>');
  $('#returning-client').onclick=()=>{modal(`<h2>Retrouver ma carte de démonstration</h2><p class="hint">Utilisez votre identifiant de carte, ou votre téléphone s’il a été renseigné. Ce parcours de test ne vérifie pas votre identité.</p><form id="return-form" class="stack"><label class="field">Identifiant carte ou téléphone<input name="identifier" required maxlength="100" autocomplete="off" placeholder="DEMO-… ou votre téléphone"></label><button class="btn">Retrouver ma carte</button><p id="return-error" class="error" role="status"></p></form>`);$('#return-form').onsubmit=e=>{e.preventDefault();const identifier=clean(new FormData(e.target).get('identifier'));const found=state.members.find(m=>m.id===identifier||(m.phone&&m.phone===identifier));if(!found){$('#return-error').textContent='Aucune carte correspondante dans cette démonstration.';return;}state.member=found.id;clientEntered=true;rememberClient();$('#modal').close();render();};};

}
function renderAdminEntry(){
  $('#breadcrumb').textContent='Le club / Administration';
  $('#main').innerHTML=`<div class="entry-wrap"><p class="eyebrow">WINESS · ÉQUIPE</p><h1>Votre espace administrateur.</h1><p class="sub">Gérez les membres, les imports et les règles du club.</p><section class="panel"><h2>Accès de démonstration</h2><p class="hint">Ce formulaire identifie le testeur pour cet onglet. Il ne protège pas l’accès à l’administration. N’utilisez pas de mot de passe ni de données réelles.</p><form id="admin-entry" class="form-grid"><label class="wide">Votre nom de test<input name="name" required maxlength="100" placeholder="Équipe Winess"></label><label class="wide">Adresse e-mail de test<input name="email" type="email" required maxlength="150" placeholder="admin@example.com"></label><button class="btn wide">Ouvrir l’administration de démonstration</button></form></section></div>`;
  $('#admin-entry').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);if(!clean(f.get('name')))return;adminIdentity={name:clean(f.get('name')),email:clean(f.get('email'))};adminEntered=true;rememberStaff();state.view='admin';render();notice('Administration de démonstration ouverte pour '+clean(f.get('name'))+'.');};
}

function rememberClient(){try{localStorage.setItem(CLIENT_SESSION,JSON.stringify({memberId:state.member}));sessionStorage.removeItem('winess-client-demo');}catch{notice('La mémorisation est indisponible dans ce navigateur.');}}
function snapshotShared(){return {notifications:state.notifications,rev:storeRevision+1,members:state.members,lines:state.lines,tickets:state.tickets,rate:state.rate,vip:state.vip,threshold:state.threshold,catalog:state.catalog};}
function restoreShared(data){
  if(!data||!Number.isInteger(data.rev)||!Array.isArray(data.members)||!data.members.length||!Array.isArray(data.lines)||!data.tickets||!data.catalog)throw Error('Données locales incompatibles.');
  for(const k of ['members','lines','rate','vip','threshold','catalog'])state[k]=data[k];
  state.notifications=Array.isArray(data.notifications)?data.notifications:[];state.tickets=Object.assign(Object.create(null),data.tickets);storeRevision=data.rev;state.pending=null;
}
function initShared(){
  if(!localShared){$('.demo').textContent='DÉMONSTRATION · fichier isolé';return;}
  try{const current=localStorage.getItem(STORE_KEY);const raw=current||localStorage.getItem('winess-club-demo-shared-v3');if(raw)restoreShared(JSON.parse(raw));sharedReady=true;if(!current)saveShared();$('.demo').textContent='DÉMONSTRATION · données dans ce navigateur';}
  catch{sharedReady=false;notice('Stockage local indisponible. Les espaces ne peuvent pas être synchronisés.');}
}
function refreshBeforeWrite(){
  if(!sharedReady)return true;
  try{const raw=localStorage.getItem(STORE_KEY);if(raw){const data=JSON.parse(raw);if(data.rev!==storeRevision){restoreShared(data);render();notice('Un autre espace a modifié les données. Vérifiez puis recommencez.');return false;}}return true;}
  catch{notice('Impossible de relire les données partagées. Enregistrement interrompu.');return false;}
}
function saveShared(){
  if(!sharedReady)return true;
  if(!refreshBeforeWrite())return false;
  try{const data=snapshotShared();localStorage.setItem(STORE_KEY,JSON.stringify(data));storeRevision=data.rev;return true;}
  catch{notice('Stockage local plein ou indisponible. La modification n’a pas été sauvegardée.');return false;}
}
window.addEventListener('storage',e=>{
  if(!sharedReady||e.key!==STORE_KEY)return;
  if(!e.newValue){location.reload();return;}
  try{const known=new Set(state.notifications.map(n=>n.id));restoreShared(JSON.parse(e.newValue));const added=state.notifications.filter(n=>n.memberId===state.member&&!known.has(n.id));if($('#modal').open)sharedNeedsRender=true;else if(!$('#client-entry')&&!$('#admin-entry'))render();if(entry==='client'&&clientEntered&&added.length)notice(added[added.length-1].body);else if(entry!=='client')notice('Membres, achats et points actualisés depuis un autre espace.');}catch{notice('La mise à jour locale n’a pas pu être chargée.');}
});
function parseCSVRows(lines){const keys=['id_ligne','id_ticket','date','id_client','sku','nom_produit','quantite','total_ttc'];return [keys,...lines.map(l=>keys.map(k=>String(l[k])))];}
function findQR(value){
  const text=clean(value),prefix='winess-club:member:';
  if(!text.startsWith(prefix)||!text.slice(prefix.length)){notice('Ce QR n’est pas une carte Winess Club reconnue.');return false;}
  const id=text.slice(prefix.length);if(!refreshBeforeWrite())return false;
  const m=member(id);if(!m){notice('Client inconnu sur cet ordinateur. Utilisez les trois liens HTTP dans le même navigateur.');return false;}
  state.seller=m.id;$('#modal').close();renderSeller();notice('Client identifié : '+m.first+' '+m.last);return true;
}
function renderSeller(){
  const m=member(state.seller);
  $('#main').innerHTML=`<p class="eyebrow">ESPACE VENDEUR</p><h1>Une carte, un client, ses achats.</h1><p class="sub">Scannez la carte pour identifier le client, puis enregistrez son ticket.</p><div class="note">Démonstration : les deux espaces partagent les données dans ce navigateur. Les données ne sont pas encore synchronisées entre appareils. Aucun achat n’est envoyé à Wino.</div><div class="grid2"><section class="panel"><h2>Identifier le client</h2><div class="actions"><button id="camera-qr" class="btn">Scanner le QR avec la caméra</button><label class="btn secondary" for="qr-image">Lire une image du QR</label><input id="qr-image" type="file" accept="image/*" class="visually-hidden"></div><p class="hint">La caméra demande votre autorisation. Vous pouvez aussi utiliser un lecteur QR ou rechercher le nom du client.</p><form id="qr-form"><label class="field">QR, identifiant membre, nom ou téléphone<input id="search" class="search" autocomplete="off" placeholder="Scannez ou recherchez un client"></label><button class="btn secondary">Identifier ce membre</button></form><div id="results" class="results" style="margin-top:20px"></div></section><section class="panel"><p class="eyebrow">CLIENT SÉLECTIONNÉ</p>${m?`<h2>${esc(m.first+' '+m.last)}</h2><p class="muted">${esc(m.id)} · ${esc(m.phone||'Téléphone non renseigné')}</p><span class="status-tag">${m.vip?'MEMBRE VIP':'MEMBRE CLUB'}</span><div class="vip-big">${m.vip?state.vip+' %':'—'}</div><p>${m.vip?'Remise à appliquer manuellement dans Wino.':'Aucune remise VIP.'}</p><p>${fmt(points(m.id))} points cumulés</p><div class="actions"><button class="btn" id="add-sale">Ajouter ses achats</button><button class="btn secondary" id="edit-member">Corriger la fiche</button></div>`:'<h2>En attente d’une carte</h2><p class="hint">Scannez ou sélectionnez un client. Son nom sera affiché ici avant toute saisie d’achat.</p>'}</section></div>${m?`<div class="section-title"><h2>Achats de ${esc(m.first)}</h2></div>${purchaseRows(m)}`:''}`;
  const results=q=>{const normalized=clean(q).replace(/^winess-club:member:/,'').toLowerCase();const matches=state.members.filter(m=>(m.first+' '+m.last+' '+m.phone+' '+m.id).toLowerCase().includes(normalized)).slice(0,12);$('#results').innerHTML=matches.length?matches.map(m=>`<button class="result" data-member="${esc(m.id)}"><span>${esc(m.first+' '+m.last)}<small>${esc(m.id)} · ${esc(m.phone||'Téléphone non renseigné')}</small></span><span>Sélectionner ↗</span></button>`).join(''):'<p class="empty">Aucun membre trouvé.</p>';document.querySelectorAll('[data-member]').forEach(b=>b.onclick=()=>{state.seller=b.dataset.member;renderSeller();});};
  $('#search').oninput=e=>results(e.target.value);results('');
  $('#qr-form').onsubmit=e=>{e.preventDefault();const text=clean($('#search').value);if(text.startsWith('winess-club:member:')){findQR(text);return;}const direct=member(text);if(direct){state.seller=direct.id;renderSeller();}else notice('Choisissez le client dans les résultats ci-dessous.');};
  $('#camera-qr').onclick=startCamera;
  $('#qr-image').onchange=readQRImage;
  if(m){$('#edit-member').onclick=()=>editMember(m);$('#add-sale').onclick=()=>openSale(m.id);}
  bindImages();
}
function stopCamera(){if(cameraStop){cameraStop();cameraStop=null;}}
document.getElementById('modal').addEventListener('close',()=>{stopCamera();if(sharedNeedsRender){sharedNeedsRender=false;render();}});
window.addEventListener('pagehide',stopCamera);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera();});
async function startCamera(){
  if(!navigator.mediaDevices?.getUserMedia||!window.isSecureContext){notice('Caméra indisponible ici. Ouvrez le lien local HTTP ou utilisez une image du QR / un lecteur.');return;}
  if(!window.jsQR){notice('Lecteur QR indisponible. Utilisez la saisie de l’identifiant.');return;}
  modal('<h2>Scanner la carte client</h2><p class="hint">Placez le QR dans le cadre. L’image est analysée sur cet appareil, sans envoi.</p><video id="qr-video" autoplay playsinline muted class="scan-video"></video><p class="hint" id="scan-status">Ouverture de la caméra…</p>');
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
    if(!$('#modal').open||!$('#qr-video')){stream.getTracks().forEach(t=>t.stop());return;}
    const video=$('#qr-video');let active=true,frame=0;const canvas=document.createElement('canvas'),context=canvas.getContext('2d',{willReadFrequently:true});
    cameraStop=()=>{active=false;cancelAnimationFrame(frame);stream.getTracks().forEach(t=>t.stop());video.srcObject=null;};
    video.srcObject=stream;await video.play();$('#scan-status').textContent='Présentez le QR du client à la caméra.';
    const scan=()=>{if(!active)return;if(video.readyState>=2&&video.videoWidth){const scale=Math.min(1,800/video.videoWidth);canvas.width=video.videoWidth*scale;canvas.height=video.videoHeight*scale;context.drawImage(video,0,0,canvas.width,canvas.height);const pixels=context.getImageData(0,0,canvas.width,canvas.height);const code=window.jsQR(pixels.data,pixels.width,pixels.height,{inversionAttempts:'attemptBoth'});if(code){if(findQR(code.data)){stopCamera();return;}$('#scan-status').textContent='QR non reconnu. Présentez une carte Winess Club.';}}frame=requestAnimationFrame(scan);};scan();
  }catch{stopCamera();const status=$('#scan-status');if(status)status.textContent='Caméra refusée ou indisponible. Fermez cette fenêtre et utilisez une image du QR ou un lecteur.';}
}
async function readQRImage(e){
  const file=e.target.files[0];if(!file)return;
  try{if(file.size>10e6)throw Error('Image limitée à 10 Mo.');if(!window.jsQR)throw Error('Lecteur QR indisponible.');const image=await createImageBitmap(file);const scale=Math.min(1,1600/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0,canvas.width,canvas.height);image.close();const pixels=context.getImageData(0,0,canvas.width,canvas.height);const code=window.jsQR(pixels.data,pixels.width,pixels.height,{inversionAttempts:'attemptBoth'});if(!code)throw Error('Aucun QR lisible dans cette image.');findQR(code.data);}catch(err){notice(err.message);}finally{e.target.value='';}
}
function openSale(id){
  if(!refreshBeforeWrite())return;const m=member(id);if(!m)return;
  let draft=[];
  modal(`<h2>Achats de ${esc(m.first+' '+m.last)}</h2><p class="hint">Vérifiez le nom du client avant d’enregistrer. Le ticket sera visible dans ses espaces client et administrateur.</p><form id="sale-ticket" class="form-grid"><label>Référence du ticket Wino<input id="ticket-ref" required maxlength="100" placeholder="Ex. WINO-2026-001"></label><label>Date d’achat<input id="ticket-date" type="date" value="${new Date().toLocaleDateString('en-CA')}" required></label></form><hr><form id="sale-line" class="form-grid"><label class="wide">SKU du produit<input id="line-sku" required list="sku-list" placeholder="SKU exact du catalogue" autocomplete="off"><datalist id="sku-list">${Object.values(state.catalog).slice(0,1500).map(p=>`<option value="${esc(p.sku)}">${esc(p.name)}</option>`).join('')}</datalist></label><label>Quantité<input id="line-qty" type="number" min="0.001" step="any" value="1" required></label><label>Total TTC de la ligne (€)<input id="line-total" type="number" min="0" step="0.01" required placeholder="29.90"></label><button class="btn secondary wide">Ajouter cette ligne au ticket</button></form><div id="sale-preview"></div><div class="actions"><button class="btn" id="save-sale" disabled>Enregistrer pour ${esc(m.first)}</button></div><p class="hint">Le total TTC est le montant de la ligne après remise, pour toute la quantité. Les points sont arrondis une fois par ticket. Aucun ticket n’est créé dans Wino.</p>`);
  const preview=()=>{$('#sale-preview').innerHTML=draft.length?`<div class="table-wrap"><table><thead><tr><th>Produit</th><th>Qté</th><th>TTC</th><th></th></tr></thead><tbody>${draft.map((l,i)=>`<tr><td>${esc(l.nom_produit)}<br><small>${esc(l.sku)}</small></td><td>${l.quantite}</td><td>${euro(l.total_ttc)}</td><td><button type="button" data-remove="${i}" aria-label="Retirer la ligne ${i+1}">×</button></td></tr>`).join('')}</tbody></table></div><p><strong>Total : ${euro(draft.reduce((n,l)=>n+l.total_ttc,0))}</strong> · ${Math.floor(draft.reduce((n,l)=>n+Math.round(l.total_ttc*100),0)*state.rate/100+1e-9)} points</p>`:'';$('#save-sale').disabled=!draft.length;document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{draft.splice(Number(b.dataset.remove),1);preview();});};
  $('#sale-ticket').onsubmit=e=>e.preventDefault();
  $('#sale-line').onsubmit=e=>{e.preventDefault();const sku=clean($('#line-sku').value);const p=Object.hasOwn(state.catalog,sku)?state.catalog[sku]:null;if(!p){notice('SKU inconnu. Vérifiez le catalogue avec l’administrateur.');return;}draft.push({sku,nom_produit:p.name,quantite:Number($('#line-qty').value),total_ttc:Number($('#line-total').value)});$('#line-sku').value='';$('#line-qty').value='1';$('#line-total').value='';preview();};
  $('#save-sale').onclick=()=>{
    if(!$('#sale-ticket').reportValidity()||!draft.length)return;
    if(!localShared||!sharedReady){notice('Ouvrez les liens HTTP locaux pour enregistrer un ticket partagé.');return;}
    if(!refreshBeforeWrite())return;
    const ticket=clean($('#ticket-ref').value),day=$('#ticket-date').value;
    if(state.lines.some(l=>l.id_ticket===ticket)){notice('Ce ticket existe déjà. Aucun achat ajouté.');return;}
    const candidate=draft.map(l=>({...l,id_ligne:'VENDEUR-'+crypto.randomUUID(),id_ticket:ticket,date:day,id_client:id}));
    const checked=validatePurchases(parseCSVRows(candidate),state.lines,state.members,state.catalog,state.rate);
    if(checked.errors.length){notice(checked.errors[0]);return;}
    state.lines.push(...checked.lines);Object.assign(state.tickets,checked.tickets);createPurchaseNotifications(checked.tickets);if(!saveShared())return;
    $('#modal').close();renderSeller();notice('Ticket enregistré pour '+m.first+' '+m.last+' : achats et points partagés.');
  };
}

function createPurchaseNotifications(tickets){
  for(const [ticket,t] of Object.entries(tickets)){
    if(state.notifications.some(n=>n.ticket===ticket))continue;
    state.notifications.push({id:crypto.randomUUID(),memberId:t.client,ticket,title:'Votre achat a été enregistré',body:`Ticket ${ticket} : ${t.points} points ajoutés à votre compte.`,createdAt:new Date().toISOString(),read:false});
  }
}
function renderNotifications(m){
  const list=state.notifications.filter(n=>n.memberId===m.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const unread=list.filter(n=>!n.read).length;
  $('#main .intro').insertAdjacentHTML('afterend',`<section class="panel notification-panel" aria-label="Vos notifications"><div class="section-title" style="margin:0 0 12px"><h2>Notifications ${unread?`<span class="notification-count">${unread}</span>`:''}</h2>${unread?'<button class="btn secondary" id="read-notifications">Tout marquer comme lu</button>':''}</div>${list.length?list.slice(0,10).map(n=>`<article class="notification-item ${n.read?'':'unread'}"><strong>${esc(n.title)}</strong><p>${esc(n.body)}</p><small>${esc(new Date(n.createdAt).toLocaleString('fr-FR'))}</small></article>`).join(''):'<p class="muted">Vos prochains achats apparaîtront ici.</p>'}<p class="hint">Messages dans votre espace. Les notifications push et SMS, application fermée, ne sont pas activées.</p></section>`);
  if($('#read-notifications'))$('#read-notifications').onclick=()=>{if(!refreshBeforeWrite())return;state.notifications.filter(n=>n.memberId===m.id).forEach(n=>n.read=true);if(saveShared())renderClient();};
}

function restoreRemembered(){
  try{
    const remembered=JSON.parse(localStorage.getItem(CLIENT_SESSION)||'null');
    if(entry==='client'&&remembered&&member(remembered.memberId)){state.member=remembered.memberId;clientEntered=true;}
    const staff=JSON.parse(localStorage.getItem(STAFF_SESSION)||'null');
    sellerIdentity=staff?.seller||null;adminIdentity=staff?.admin||null;
    sellerEntered=!!sellerIdentity;adminEntered=!!adminIdentity;
  }catch{notice('La session mémorisée n’a pas pu être restaurée.');}
}
function rememberStaff(){
  try{localStorage.setItem(STAFF_SESSION,JSON.stringify({seller:sellerIdentity,admin:adminIdentity}));}
  catch{notice('La mémorisation est indisponible dans ce navigateur.');}
}
function renderAccount(){
  let box=$('#account-controls');
  if(!box){box=document.createElement('div');box.id='account-controls';box.className='account-controls';document.querySelector('header').append(box);}
  const isClient=entry==='client';
  const identity=isClient?(clientEntered?member(state.member):null):(adminEntered?adminIdentity:sellerEntered?sellerIdentity:null);
  if(!identity){box.innerHTML='';return;}
  const name=isClient?identity.first+' '+identity.last:identity.name;
  box.innerHTML=`<span class="account-name">${esc(name)}</span><button id="sign-out" class="btn secondary">Déconnexion</button>`;
  $('#sign-out').onclick=()=>{
    stopCamera();if($('#modal').open)$('#modal').close();
    try{if(isClient){localStorage.removeItem(CLIENT_SESSION);sessionStorage.removeItem('winess-client-demo');}else localStorage.removeItem(STAFF_SESSION);}catch{notice('La session locale n’a pas pu être effacée.');return;}
    if(isClient){clientEntered=false;state.member=state.members[0].id;state.view='client';}
    else{sellerEntered=false;adminEntered=false;sellerIdentity=null;adminIdentity=null;state.seller='';state.view=entry==='admin'?'admin':'seller';}
    history.replaceState(null,'',location.pathname);render();notice('Vous êtes déconnecté. Les fiches et achats restent conservés.');
  };
}
function renderSellerEntry(){
  $('#breadcrumb').textContent='Le club / Accès boutique';
  $('#main').innerHTML=`<div class="entry-wrap"><p class="eyebrow">WINESS · BOUTIQUE</p><h1>Votre espace vendeur.</h1><p class="sub">Identifiez-vous une première fois pour retrouver cet espace à votre prochaine visite.</p><section class="panel"><h2>Accès de démonstration</h2><p class="hint">Votre nom et votre e-mail de test restent mémorisés dans ce navigateur jusqu’à Déconnexion. Ce formulaire ne constitue pas une connexion sécurisée.</p><form id="seller-entry" class="form-grid"><label class="wide">Votre nom de test<input name="name" required maxlength="100" autocomplete="name"></label><label class="wide">Adresse e-mail de test<input name="email" type="email" required maxlength="150" autocomplete="email"></label><button class="btn wide">Ouvrir mon espace vendeur</button></form></section></div>`;
  $('#seller-entry').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),name=clean(f.get('name')),email=clean(f.get('email'));if(!name)return;sellerIdentity={name,email};sellerEntered=true;rememberStaff();state.view='seller';render();window.scrollTo({top:0});};
}
window.addEventListener('storage',e=>{
  if(e.key!==CLIENT_SESSION&&e.key!==STAFF_SESSION)return;
  if(entry==='client'&&e.key===CLIENT_SESSION){clientEntered=false;restoreRemembered();if($('#modal').open)$('#modal').close();render();}
  if(['staff','seller','admin'].includes(entry)&&e.key===STAFF_SESSION){sellerEntered=false;adminEntered=false;restoreRemembered();if($('#modal').open)$('#modal').close();if(!sellerEntered&&!adminEntered)state.seller='';render();}
});
