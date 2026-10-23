import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCSV,importCatalog,validatePurchases,safeProductURL,validDate} from '../core.js';
const header=['id_ligne','id_ticket','date','id_client','sku','nom_produit','quantite','total_ttc'];
const row=['L1','T1','2026-10-23','M1','00123','Vin', '2','29,90'];
const members=[{id:'M1'}];
test('CSV français : guillemets, retours ligne, BOM et zéros SKU',()=>{
 assert.deepEqual(parseCSV('\uFEFFSKU;Nom\r\n00123;"Vin; \"\"rouge\"\"\n2024"\r\n'),[['SKU','Nom'],['00123','Vin; "rouge"\n2024']]);
 assert.throws(()=>parseCSV('SKU;Nom\n1;"ouvert'));
});
test('Catalogue Numbers exporté : 2 lignes de titre, SKU textuel, absents et doublons',()=>{
 const r=importCatalog([['Informations produit générales'],['Nom du produit','SKU'],['Vin','00123'],['Autre','']]);
 assert.ok(r.products['00123']);assert.equal(r.missing.length,1);
 assert.equal(importCatalog([['Nom du produit','SKU'],['A','X'],['B','X']]).errors.length,1);
});
test('Points arrondis par ticket, total ligne et taux figé',()=>{
 const r=validatePurchases([header,row,['L2','T1','2026-10-23','M1','00124','Autre','1','0,90']],[],members,{},1);
 assert.equal(r.errors.length,0);assert.equal(r.tickets.T1.points,30);assert.equal(r.tickets.T1.cents,3080);
 assert.equal(r.lines[0].sku,'00123');
});
test('Réimport identique ignoré, changement et ticket partiel bloqués',()=>{
 const r=validatePurchases([header,row],[],members,{},1);
 assert.equal(validatePurchases([header,row],r.lines,members,{},2).duplicates,1);
 assert.equal(validatePurchases([header,row],r.lines,members,{},2).lines.length,0);
 assert.ok(validatePurchases([header,[...row.slice(0,7),'99']],r.lines,members,{},1).errors.length);
 assert.ok(validatePurchases([header,['L2',...row.slice(1)]],r.lines,members,{},1).errors.length);
});
test('Clients, dates, montants, identifiants et tickets ambigus contrôlés',()=>{
 assert.equal(validDate('2026-02-30'),false);
 for(const [column,value] of [[2,'2026-02-30'],[3,'inconnu'],[6,'-1'],[7,''],[7,'1,999'],[7,'-20']]){
  const line=[...row];line[column]=value;assert.ok(validatePurchases([header,line],[],members,{},1).errors.length);
 }
 assert.ok(validatePurchases([header,row,row],[],members,{},1).errors.length);
 assert.ok(validatePurchases([header,row,['L2','T1','2026-10-22','M1','ABC','Vin','1','2']],[],members,{},1).errors.length);
});
test('Liens limités aux fiches Winess HTTPS',()=>{
 assert.equal(safeProductURL('javascript:alert(1)'),'');assert.equal(safeProductURL('https://winess.com.evil.com/products/a'),'');
 assert.ok(safeProductURL('https://winess.com/products/vin?variant=123'));
});
