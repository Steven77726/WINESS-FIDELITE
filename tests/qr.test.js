import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMemberCode} from '../core.js';
test('QR : carte historique et lien boutique ouvrent le même identifiant',()=>{
 const id='c37cf362-46c6-4234-8fb8-a571256c7110',origin='https://steven77726.github.io';
 assert.equal(parseMemberCode('winess-club:member:'+id,origin),id);
 assert.equal(parseMemberCode(origin+'/WINESS-FIDELITE/staff.html#card='+id,origin),id);
 assert.equal(parseMemberCode('http://127.0.0.1:4319/WINESS-STAFF.html#card='+id,'http://127.0.0.1:4319'),id);
});
test('QR : lien étranger, page client, données arbitraires et carte vide refusés',()=>{
 const origin='https://steven77726.github.io';
 for(const text of ['https://evil.example/staff.html#card=abc',origin+'/client.html#card=abc','javascript:alert(1)','not-a-card','winess-club:member:'])assert.equal(parseMemberCode(text,origin),'');
});
