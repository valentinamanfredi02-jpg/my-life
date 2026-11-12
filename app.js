const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const EMOJIS=['💃🏻','❤️','🎂','🐰','🐾','🩸','🍿','💋','🍸','🍣','🍔','🍕','🏥','🎄','👻','✈️'];
const COLORS=[['Rosa chiaro','#f3cddd'],['Blu','#8eb6d8'],['Grigio','#a9a9b2'],['Viola','#b8a1d8'],['Verde','#9dbfa5'],['Nero','#403640'],['Fucsia','#df78a8'],['Rosso','#d96b75'],['Bianco','#ffffff']];
const todayISO=()=>{let d=new Date();return iso(d)};
const iso=d=>{let x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`};
const parse=s=>new Date(s+'T12:00:00');
const addDays=(s,n)=>{let d=parse(s);d.setDate(d.getDate()+n);return iso(d)};
const fmt=(s,opt={day:'numeric',month:'long',year:'numeric'})=>parse(s).toLocaleDateString('it-IT',opt);
const defaults={events:[],lists:[{id:'personal',name:'Personale',color:'#d99bb4',tasks:[]}],periods:[],ring:null};
let data={...defaults,...JSON.parse(localStorage.getItem('mylife-data')||'{}')};
function save(){localStorage.setItem('mylife-data',JSON.stringify(data))}
let selectedDate=todayISO(),monthDate=parse(todayISO()),selectedEmoji=EMOJIS[0],selectedColor=COLORS[0][1],selectedListColor=COLORS[0][1],tab='day';
function setTab(name){tab=name;$$('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));$$('.view').forEach(v=>v.classList.remove('active'));$('#'+name+'View').classList.add('active');$('#addBtn').style.display=name==='month'?'none':'grid';if(name==='day')renderDay();if(name==='month')renderMonth();if(name==='tasks')renderLists();if(name==='cycle')renderCycle()}
$$('.tab').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
function renderDay(){
 let d=parse(selectedDate);$('#dayName').textContent=d.toLocaleDateString('it-IT',{weekday:'long'});$('#dayDate').textContent=fmt(selectedDate);
 let events=data.events.filter(e=>e.date===selectedDate).sort((a,b)=>(a.start||'').localeCompare(b.start||''));
 $('#eventCount').textContent=events.length?`${events.length} ${events.length===1?'evento':'eventi'}`:'';
 $('#eventList').innerHTML=events.map(e=>`<article class="event-card"><div class="event-dot" style="background:${e.color}"></div><div class="event-emoji">${e.emoji}</div><div class="event-main"><b>${esc(e.name)}</b><div class="event-time">${e.start||''}${e.end?' – '+e.end:''}</div></div><button class="delete-btn" data-del-event="${e.id}" aria-label="Elimina">×</button></article>`).join('');
 $('#emptyEvents').style.display=events.length?'none':'block';
 $$('[data-del-event]').forEach(b=>b.onclick=()=>{data.events=data.events.filter(e=>e.id!==b.dataset.delEvent);save();renderDay()});
 const tasks=data.lists.flatMap(l=>l.tasks.map(t=>({...t,listName:l.name,listId:l.id}))).filter(t=>!t.done&&(!t.due||t.due===selectedDate));
 $('#todayTasks').innerHTML=tasks.length?tasks.map(t=>`<label class="today-task"><input type="checkbox" data-task="${t.id}" data-list="${t.listId}"><span>${esc(t.name)}</span></label>`).join(''):'<div class="no-items">Nessuna attività in scadenza oggi.</div>';
 $$('[data-task]').forEach(c=>c.onchange=()=>toggleTask(c.dataset.list,c.dataset.task,c.checked));
}
function renderMonth(){
 let y=monthDate.getFullYear(),m=monthDate.getMonth();$('#monthLabel').textContent=monthDate.toLocaleDateString('it-IT',{month:'long',year:'numeric'});
 let first=new Date(y,m,1),offset=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),prevDays=new Date(y,m,0).getDate(),html='';
 for(let i=0;i<42;i++){let n=i-offset+1,dt,cls='calendar-day';if(n<1){dt=new Date(y,m-1,prevDays+n);cls+=' muted-day'}else if(n>days){dt=new Date(y,m+1,n-days);cls+=' muted-day'}else dt=new Date(y,m,n);
 let s=iso(dt);if(s===todayISO())cls+=' today';if(s===selectedDate)cls+=' selected';if(data.events.some(e=>e.date===s))cls+=' has-event';if(data.periods.some(p=>s>=p.start&&s<=p.end))cls+=' period';
 html+=`<button class="${cls}" data-date="${s}">${dt.getDate()}</button>`}
 $('#calendar').innerHTML=html;$$('[data-date]').forEach(b=>b.onclick=()=>{selectedDate=b.dataset.date;monthDate=parse(selectedDate);setTab('day')});
}
function renderLists(){
 $('#listsContainer').innerHTML=data.lists.map(l=>`<div class="list-card"><div class="list-title"><span class="list-swatch" style="background:${l.color}"></span><b>${esc(l.name)}</b><button data-add-to-list="${l.id}">+ attività</button>${l.id!=='personal'?`<button data-del-list="${l.id}" aria-label="Elimina lista">×</button>`:''}</div>${l.tasks.length?l.tasks.map(t=>`<label class="task-row ${t.done?'done':''}"><input type="checkbox" data-list="${l.id}" data-task="${t.id}" ${t.done?'checked':''}><span>${esc(t.name)}</span>${t.due?`<small class="task-due">${fmt(t.due,{day:'numeric',month:'short'})}</small>`:''}<button class="delete-btn" data-del-task="${t.id}" data-list="${l.id}">×</button></label>`).join(''):'<div class="no-items">La lista è ancora vuota.</div>'}</div>`).join('');
 $$('[data-list][data-task]').forEach(c=>c.onchange=()=>toggleTask(c.dataset.list,c.dataset.task,c.checked));
 $$('[data-del-task]').forEach(b=>b.onclick=()=>{let l=data.lists.find(x=>x.id===b.dataset.list);l.tasks=l.tasks.filter(t=>t.id!==b.dataset.delTask);save();renderLists()});
 $$('[data-del-list]').forEach(b=>b.onclick=()=>{if(confirm('Eliminare questa lista e le sue attività?')){data.lists=data.lists.filter(l=>l.id!==b.dataset.delList);save();renderLists()}});
 $$('[data-add-to-list]').forEach(b=>b.onclick=()=>{openSheet('task');$('#taskListSelect').value=b.dataset.addToList});
}
function toggleTask(lid,tid,done){let l=data.lists.find(x=>x.id===lid);let t=l?.tasks.find(x=>x.id===tid);if(t)t.done=done;save();if(tab==='tasks')renderLists();else renderDay()}
function renderCycle(){
 let p=data.periods.slice().sort((a,b)=>b.start.localeCompare(a.start));$('#periodHistory').innerHTML=p.length?'<b>Storico registrato</b><br>'+p.map(x=>`${fmt(x.start)} – ${fmt(x.end)}`).join('<br>'):'Nessun ciclo registrato.';
 if(data.ring){$('#ringDate').value=data.ring.inserted;$('#ringIn').value=data.ring.inDays;$('#ringOff').value=data.ring.offDays;let removal=addDays(data.ring.inserted,data.ring.inDays),next=addDays(removal,data.ring.offDays);$('#ringInfo').innerHTML=`<b>Prossima rimozione prevista:</b> ${fmt(removal)}<br><b>Nuovo inserimento previsto:</b> ${fmt(next)}`}else $('#ringInfo').textContent='Inserisci la data in cui hai messo l’anello per calcolare le prossime date.';
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
$('#prevDay').onclick=()=>{selectedDate=addDays(selectedDate,-1);renderDay()};$('#nextDay').onclick=()=>{selectedDate=addDays(selectedDate,1);renderDay()};
let touchX=null;$('#dayView').addEventListener('touchstart',e=>touchX=e.changedTouches[0].screenX,{passive:true});$('#dayView').addEventListener('touchend',e=>{if(touchX===null)return;let dx=e.changedTouches[0].screenX-touchX;if(Math.abs(dx)>55){selectedDate=addDays(selectedDate,dx<0?1:-1);renderDay()}touchX=null},{passive:true});
$('#prevMonth').onclick=()=>{monthDate.setMonth(monthDate.getMonth()-1);renderMonth()};$('#nextMonth').onclick=()=>{monthDate.setMonth(monthDate.getMonth()+1);renderMonth()};
$('#toTasks').onclick=()=>setTab('tasks');
function openSheet(which='menu'){closeSettings();$('#sheetBackdrop').classList.add('open');$('#addMenu').classList.toggle('hidden',which!=='menu');$('#eventForm').classList.toggle('hidden',which!=='event');$('#taskForm').classList.toggle('hidden',which!=='task');$('#listForm').classList.toggle('hidden',which!=='list');$('#sheetTitle').textContent=({menu:'Aggiungi',event:'Nuovo evento',task:'Nuova attività',list:'Nuova lista'})[which];if(which==='task')$('#taskListSelect').innerHTML=data.lists.map(l=>`<option value="${l.id}">${esc(l.name)}</option>`).join('')}
function closeSheet(){$('#sheetBackdrop').classList.remove('open')}
$('#addBtn').onclick=()=>openSheet();$('#closeSheet').onclick=closeSheet;$('#sheetBackdrop').onclick=e=>{if(e.target.id==='sheetBackdrop')closeSheet()};
$('#addEventChoice').onclick=()=>openSheet('event');$('#addTaskChoice').onclick=()=>openSheet('task');
function makeColorPicker(el,selected,callback){$(el).innerHTML=COLORS.map(([n,c])=>`<button type="button" class="color-option ${c===selected?'selected':''}" style="background:${c}" title="${n}" data-color="${c}"></button>`).join('');$$(`${el} [data-color]`).forEach(b=>b.onclick=()=>{callback(b.dataset.color);makeColorPicker(el,b.dataset.color,callback)})}
function makeEmojiPicker(){ $('#emojiPicker').innerHTML=EMOJIS.map(e=>`<button type="button" class="emoji-option ${e===selectedEmoji?'selected':''}" data-emoji="${e}">${e}</button>`).join('');$$('[data-emoji]').forEach(b=>b.onclick=()=>{selectedEmoji=b.dataset.emoji;makeEmojiPicker()})}
$('#eventForm').onsubmit=e=>{e.preventDefault();data.events.push({id:crypto.randomUUID(),date:selectedDate,name:$('#eventName').value.trim(),start:$('#eventStart').value,end:$('#eventEnd').value,emoji:selectedEmoji,color:selectedColor});save();$('#eventForm').reset();closeSheet();renderDay()};
$('#taskForm').onsubmit=e=>{e.preventDefault();let l=data.lists.find(x=>x.id===$('#taskListSelect').value);l.tasks.push({id:crypto.randomUUID(),name:$('#taskName').value.trim(),due:$('#taskDue').value,done:false});save();$('#taskForm').reset();closeSheet();if(tab==='tasks')renderLists();else renderDay()};
$('#newListBtn').onclick=()=>openSheet('list');$('#addTaskChoice').onclick=()=>openSheet('task');
$('#listForm').onsubmit=e=>{e.preventDefault();data.lists.push({id:crypto.randomUUID(),name:$('#listName').value.trim(),color:selectedListColor,tasks:[]});save();$('#listForm').reset();closeSheet();renderLists()};
$('#savePeriod').onclick=()=>{let s=$('#periodStart').value,e=$('#periodEnd').value;if(!s||!e||e<s){alert('Inserisci un intervallo di date valido.');return}data.periods.push({start:s,end:e});save();renderCycle();renderMonth();alert('Ciclo salvato.')};
$('#saveRing').onclick=()=>{let s=$('#ringDate').value,inside=Number($('#ringIn').value),off=Number($('#ringOff').value);if(!s||inside<1||off<0){alert('Controlla le date e la durata inserita.');return}data.ring={inserted:s,inDays:inside,offDays:off};save();renderCycle();alert('Impostazioni dell’anello salvate.')};
$('#settingsBtn').onclick=()=>$('#settingsBackdrop').classList.add('open');function closeSettings(){$('#settingsBackdrop').classList.remove('open')}$('#closeSettings').onclick=closeSettings;$('#settingsBackdrop').onclick=e=>{if(e.target.id==='settingsBackdrop')closeSettings()};
$('#exportData').onclick=()=>{let blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='my-life-backup.json';a.click();URL.revokeObjectURL(a.href)};
$('#clearData').onclick=()=>{if(confirm('Vuoi cancellare tutti gli eventi, le liste e i dati del ciclo?')){data=JSON.parse(JSON.stringify(defaults));save();closeSettings();renderDay();renderLists();renderCycle()}};
makeEmojiPicker();makeColorPicker('#colorPicker',selectedColor,c=>selectedColor=c);makeColorPicker('#listColorPicker',selectedListColor,c=>selectedListColor=c);
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
renderDay();renderMonth();renderLists();renderCycle();
