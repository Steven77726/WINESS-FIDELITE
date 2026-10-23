import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parseMemberCode} from '../core.js';
const source=fs.readFileSync(new URL('../connected.js',import.meta.url),'utf8');
const scan=source.slice(source.indexOf('async function selectClient('),source.indexOf('function renderNotifications('));
function fixture(){const events=[],state={seller:'',view:'admin',members:[]};const panel={scrollIntoView(){events.push('scroll');},focus(){events.push('focus');}};const dialog={open:true,close(){this.open=false;events.push('close');}};const context=vm.createContext({state,role:'seller',location:{origin:'https://example.test'},parseMemberCode,member:id=>state.members.find(m=>m.id===id),syncData:async()=>{events.push('server-read');state.members=[{id:'registered-client',first:'QA',last:'Client'}];},render:()=>events.push('render'),requestAnimationFrame:f=>f(),notice:s=>events.push(s),$:s=>s==='#modal'?dialog:s==='#selected-client'?panel:null});vm.runInContext(scan,context);return {context,events,state,dialog};}
test('Scan : lit la base, ferme la caméra et ouvre la bonne fiche boutique',async()=>{const f=fixture();assert.equal(await vm.runInContext("findQR('https://example.test/staff.html#card=registered-client')",f.context),true);assert.equal(f.state.seller,'registered-client');assert.equal(f.state.view,'seller');assert.equal(f.dialog.open,false);assert.deepEqual(f.events.slice(0,5),['server-read','close','render','scroll','focus']);});
test('Scan : carte inconnue ne sélectionne aucun autre client',async()=>{const f=fixture();assert.equal(await vm.runInContext("findQR('winess-club:member:missing')",f.context),false);assert.equal(f.state.seller,'');assert.ok(f.events.some(e=>e.includes('Aucune fiche')));assert.ok(!f.events.includes('render'));});
test('Scan : un compte client ne peut pas ouvrir une fiche boutique',async()=>{const f=fixture();f.context.role='client';assert.equal(await vm.runInContext("findQR('winess-club:member:registered-client')",f.context),false);assert.ok(!f.events.includes('server-read'));});
