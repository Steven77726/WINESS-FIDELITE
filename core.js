export function parseCSV(text) {
  text=text.replace(/^\uFEFF/,'');
  const first=text.split(/\r?\n/)[0];
  const delimiter=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';
  const rows=[];let row=[],value='',quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){
      if(quoted && text[i+1]==='"'){value+='"';i++;}
      else if(quoted){quoted=false;if(text[i+1]&&![';',',','\r','\n'].includes(text[i+1]))throw Error('Caractère inattendu après un champ entre guillemets.');}
      else if(value==='')quoted=true;else throw Error('Guillemet inattendu dans un champ.');
    }else if(!quoted&&c===delimiter){row.push(value);value='';}
    else if(!quoted&&(c==='\n'||c==='\r')){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(v=>v.trim()))rows.push(row);row=[];value='';}
    else value+=c;
  }
  if(quoted)throw Error('Champ entre guillemets non fermé.');
  row.push(value);if(row.some(v=>v.trim()))rows.push(row);
  return rows;
}
export const clean = v=>String(v??'').trim();
export function numberFR(v){const s=clean(v).replace(/[\s\u00a0\u202f€]/g,'').replace(',','.');return s!==''&&/^-?\d+(\.\d+)?$/.test(s)?Number(s):NaN;}
export function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===s;}
export function importCatalog(rows){
  const hi=rows.findIndex(r=>r.includes('SKU')&&r.includes('Nom du produit'));
  if(hi<0)throw Error('Colonnes requises : Nom du produit et SKU. Exportez le tableau Inventaire en CSV.');
  const header=rows[hi],si=header.indexOf('SKU'),ni=header.indexOf('Nom du produit'),vi=header.indexOf('Nom de la variante');
  const products=Object.create(null),errors=[],missing=[];
  rows.slice(hi+1).forEach((r,i)=>{const sku=clean(r[si]);if(!sku){missing.push(i+hi+2);return;}if(products[sku]){errors.push(`Ligne ${i+hi+2} : SKU répété ${sku}.`);return;}products[sku]={sku,name:clean(r[ni]),variant:vi>=0?clean(r[vi]):''};});
  if(!Object.keys(products).length)errors.push('Aucun SKU exploitable.');
  return {products,errors,missing};
}
export const purchaseHeaders=['id_ligne','id_ticket','date','id_client','sku','nom_produit','quantite','total_ttc'];
export function validatePurchases(rows,existing,members,catalog,rate){
  if(!rows.length)throw Error('Fichier vide.');
  const h=rows[0].map(clean),missing=purchaseHeaders.filter(k=>!h.includes(k));
  if(missing.length)throw Error('Colonnes absentes : '+missing.join(', '));
  if(new Set(h).size!==h.length)throw Error('En-têtes de colonnes répétés.');
  const errors=[],lines=[],seen=new Set(),allTickets=new Map();let duplicates=0,unknown=0;
  const prior=new Map(existing.map(l=>[l.id_ligne,l]));
  for(const l of existing)allTickets.set(l.id_ticket,{client:l.id_client,date:l.date});
  rows.slice(1).forEach((r,i)=>{
    const n=i+2;const o=Object.fromEntries(h.map((k,j)=>[k,clean(r[j])]));
    const l={...Object.fromEntries(purchaseHeaders.map(k=>[k,o[k]])),quantite:numberFR(o.quantite),total_ttc:numberFR(o.total_ttc)};
    const fail=m=>errors.push(`Ligne ${n} : ${m}`);
    if(r.length!==h.length)fail('nombre de colonnes incorrect.');
    if(!l.id_ligne||!l.id_ticket||!l.sku||!l.id_client)fail('identifiant, ticket, client ou SKU absent.');
    if(seen.has(l.id_ligne))fail('identifiant de ligne répété dans ce fichier.');seen.add(l.id_ligne);
    if(!validDate(l.date))fail('date invalide (format AAAA-MM-JJ).');
    if(!members.some(m=>m.id===l.id_client))fail('client inconnu. Créez ou vérifiez la fiche avant import.');
    if(!Number.isFinite(l.quantite)||l.quantite<=0)fail('quantité positive requise.');
    if(!Number.isFinite(l.total_ttc)||l.total_ttc<0||!Number.isSafeInteger(Math.round(l.total_ttc*100))||Math.abs(l.total_ttc*100-Math.round(l.total_ttc*100))>1e-6)fail('total TTC positif ou nul, avec au plus deux décimales et dans la plage numérique acceptée. Les retours restent à traiter séparément.');
    const ticket=allTickets.get(l.id_ticket);
    if(ticket&&(ticket.client!==l.id_client||ticket.date!==l.date))fail('ticket associé à plusieurs clients ou dates.');
    allTickets.set(l.id_ticket,{client:l.id_client,date:l.date});
    if(prior.has(l.id_ligne)){
      const before=prior.get(l.id_ligne);
      if(purchaseHeaders.some(k=>before[k]!==l[k]))fail('ligne déjà importée avec un contenu différent.');else duplicates++;
      return;
    }
    if(existing.some(e=>e.id_ticket===l.id_ticket))fail('ticket déjà importé : les ajouts partiels sont bloqués pour préserver les points.');
    if(!Object.hasOwn(catalog,l.sku))unknown++;
    lines.push(l);
  });
  if(!rows.slice(1).length)errors.push('Aucune ligne d’achat.');
  const tickets=Object.create(null);
  for(const l of lines){tickets[l.id_ticket]??={client:l.id_client,cents:0,points:0,rate};tickets[l.id_ticket].cents+=Math.round(l.total_ttc*100);}
  for(const t of Object.values(tickets))t.points=Math.floor(t.cents*rate/100+1e-9);
  return {errors,lines,duplicates,unknown,tickets};
}
export function safeProductURL(value){try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='winess.com'&&u.pathname.startsWith('/products/')?u.href:'';}catch{return '';}}
export function safeImageURL(value){try{const u=new URL(value);return u.protocol==='https:'&&['cdn.shopify.com','winess.com'].includes(u.hostname)?u.href:'';}catch{return '';}}

export function parseMemberCode(value,origin){
 const text=clean(value),prefix='winess-club:member:';
 if(text.startsWith(prefix))return text.slice(prefix.length);
 try{const url=new URL(text);if(url.origin!==origin||!/(?:staff|WINESS-STAFF)\.html$/.test(url.pathname))return '';return new URLSearchParams(url.hash.slice(1)).get('card')||'';}catch{return '';}
}
