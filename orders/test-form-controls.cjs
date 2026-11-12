/* clicks every seg/multi/frame button and every checkbox in every item type; reports any that do not change state */
const {chromium}=require('playwright');const http=require('http'),fs=require('fs');
const srv=http.createServer((q,r)=>{r.setHeader('content-type','text/html; charset=utf-8');r.end('<!doctype html><html><head><meta charset=utf-8></head><body>'+fs.readFileSync(process.argv[2],'utf8')+'</body></html>')}).listen(8836);
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:900}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:8836/');await p.waitForTimeout(300);
const n=await p.evaluate(()=>document.querySelectorAll('.room .addgrid button').length);
for(let i=0;i<n;i++)await p.evaluate(i=>document.querySelectorAll('.room .addgrid button')[i].click(),i);
await p.waitForTimeout(200);
const res=await p.evaluate(async()=>{const bad=[];let ok=0;const items=[...document.querySelectorAll('.item')];
 for(const it of items){const name=it.querySelector('.ih strong').textContent;
  for(const cb of [...it.querySelectorAll('input[type=checkbox]')]){const before=cb.checked;cb.closest('label').click();await new Promise(r=>setTimeout(r,5));const now=it.isConnected&&document.getElementById(cb.id);if(!now||now.checked===before)bad.push(name+' ☐ '+cb.id);else ok++}
  for(const g of [...it.querySelectorAll('.seg,.frames')]){const btns=[...g.querySelectorAll('button')];const tgt=btns.find(x=>x.getAttribute('aria-pressed')!=='true')||btns[0];if(!tgt)continue;const id=g.id,txt=tgt.textContent;tgt.click();await new Promise(r=>setTimeout(r,5));const g2=document.getElementById(id);const b2=g2&&[...g2.querySelectorAll('button')].find(x=>x.textContent===txt);if(!b2||b2.getAttribute('aria-pressed')!=='true')bad.push(name+' ◉ '+id+' '+txt);else ok++}
 }
 // header
 for(const g of document.querySelectorAll('#hdr .seg')){const t=g.querySelector('button');t.click();await new Promise(r=>setTimeout(r,5));if(document.getElementById(g.id).querySelector('button').getAttribute('aria-pressed')!=='true')bad.push('hdr '+g.id);else ok++}
 for(const cb of document.querySelectorAll('#hdr input[type=checkbox]')){const b=cb.checked;cb.closest('label').click();if(document.getElementById(cb.id).checked===b)bad.push('hdr '+cb.id);else ok++}
 return {ok,bad}});
console.log(process.argv[2],JSON.stringify(res));await b.close();srv.close()})();
