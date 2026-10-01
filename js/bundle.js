/* ═══════════════════════════════════════
   data.js — Core Data, SaaS, Config
   ═══════════════════════════════════════ */
const DS={
  _p:'bk_',
  get(k){try{return JSON.parse(localStorage.getItem(this._p+k))}catch{return null}},
  set(k,v){try{localStorage.setItem(this._p+k,JSON.stringify(v))}catch(e){console.warn(e)}},
  remove(k){localStorage.removeItem(this._p+k)}
};

const TIERS={
  free:   {id:'free',   label:'Temel',    icon:'📖',color:'#8A90A0',price:0,    priceLabel:'Ücretsiz',   credits:10, maxNotes:10, dailyLimit:5,   features:['10 AI Kredisi/ay','Günde max 5 mesaj','10 Kişisel Not','Temel not akışı','Topluluk'],missing:['Kredi aktarma','Detaylı analiz','VIP paketler','Öncelikli destek']},
  starter:{id:'starter',label:'Başlangıç',icon:'🚀',color:'#007AFF',price:49.9, priceLabel:'₺49,90/ay',  credits:75, maxNotes:15, dailyLimit:15,  features:['75 AI Kredisi/ay','Günde max 15 mesaj','15 Kişisel Not','Kredi aktarma','Topluluk','E-posta destek'],missing:['Detaylı analiz','VIP paketler']},
  pro:    {id:'pro',    label:'Pro',      icon:'⚡',color:'#FF9F0A',price:99.9, priceLabel:'₺99,90/ay',  credits:200,maxNotes:30, dailyLimit:40,  popular:true,features:['200 AI Kredisi/ay','Günde max 40 mesaj','30 Kişisel Not','Kredi aktarma','Detaylı analiz','Gelişmiş plan','Öncelikli destek'],missing:['VIP paketler']},
  ultra:  {id:'ultra',  label:'Ultra',    icon:'👑',color:'#AF52DE',price:179.9,priceLabel:'₺179,90/ay', credits:500,maxNotes:200,dailyLimit:100, features:['500 AI Kredisi/ay','Günde max 100 mesaj','200 Kişisel Not','Kredi aktarma','VIP sınav paketleri','Detaylı analiz','7/24 destek','Erken erişim'],missing:[]}
};

const CREDIT_PACKS=[
  {id:'cp25', amount:25,  price:14.90, priceLabel:'₺14,90', desc:'Küçük takviye'},
  {id:'cp75', amount:75,  price:34.90, priceLabel:'₺34,90', desc:'Orta paket'},
  {id:'cp200',amount:200, price:74.90, priceLabel:'₺74,90', desc:'Büyük paket'},
  {id:'cp400',amount:400, price:129.90,priceLabel:'₺129,90',desc:'Mega paket'}
];

const ADDONS=[
  {id:'tus', name:'TUS Özel Paketi',  desc:'Tıpta uzmanlık — 500+ soru ve analiz',price:'₺149,90',icon:'🏥'},
  {id:'yks', name:'YKS Deneme Kampı', desc:'12 haftalık yoğun deneme + AI analiz', price:'₺199,90',icon:'🎯'},
  {id:'kpss',name:'KPSS Hazırlık Seti',desc:'Tüm alanlar — kapsamlı not + soru',  price:'₺129,90',icon:'📋'},
  {id:'dil', name:'YDS/YÖKDİL Paketi',desc:'Kelime, gramer, deneme seti',          price:'₺99,90', icon:'🌍'}
];

const Credits={
  _sub(){
    let s=DS.get('subscription')||{};
    if(s.used!==undefined&&s.monthlyUsed===undefined){s.monthlyUsed=s.used||0;delete s.used}
    s.tier=s.tier||'free';s.monthlyUsed=s.monthlyUsed||0;s.extraCredits=s.extraCredits||0;s.carryOver=s.carryOver||0;s.notes=s.notes||0;s.dailyUsed=s.dailyUsed||0;s.referrals=s.referrals||0;s.bonusNotes=s.bonusNotes||0;
    const now=new Date();
    if(!s.resetDate||new Date(s.resetDate)<now){
      const tier=TIERS[s.tier]||TIERS.free;
      if(s.tier!=='free'&&s.resetDate){const unused=Math.max(tier.credits-s.monthlyUsed,0);s.carryOver=s.carryOver+unused;}
      s.monthlyUsed=0;s.resetDate=new Date(now.getFullYear(),now.getMonth()+1,1).toISOString();
    }
    const today=now.toISOString().slice(0,10);
    if(s.dailyDate!==today){s.dailyUsed=0;s.dailyDate=today}
    DS.set('subscription',s);return s;
  },
  tier(){return TIERS[this._sub().tier]||TIERS.free},
  monthlyRemaining(){const s=this._sub(),t=this.tier();return Math.max(t.credits-s.monthlyUsed,0)},
  extraTotal(){const s=this._sub();return(s.carryOver||0)+(s.extraCredits||0)},
  remaining(){return this.monthlyRemaining()+this.extraTotal()},
  total(){return this.tier().credits+this.extraTotal()},
  dailyRemaining(){const s=this._sub(),t=this.tier();return Math.max(t.dailyLimit-s.dailyUsed,0)},
  dailyTotal(){return this.tier().dailyLimit},
  canSend(){return this.remaining()>0&&this.dailyRemaining()>0},
  use(n=1){
    if(!this.canSend())return false;
    const s=this._sub(),tier=TIERS[s.tier]||TIERS.free;
    s.dailyUsed=(s.dailyUsed||0)+n;
    let need=n;
    const monthlyLeft=Math.max(tier.credits-(s.monthlyUsed||0),0);
    const fromMonthly=Math.min(need,monthlyLeft);
    s.monthlyUsed=(s.monthlyUsed||0)+fromMonthly;need-=fromMonthly;
    if(need>0){const fc=Math.min(need,s.carryOver||0);s.carryOver=(s.carryOver||0)-fc;need-=fc}
    if(need>0){s.extraCredits=Math.max((s.extraCredits||0)-need,0)}
    DS.set('subscription',s);return true;
  },
  buyCredits(amount){const s=this._sub();s.extraCredits=(s.extraCredits||0)+amount;DS.set('subscription',s)},
  canAddNote(){const s=this._sub(),t=this.tier();return(s.notes||0)<t.maxNotes+(s.bonusNotes||0)},
  notesUsed(){return this._sub().notes||0},
  notesMax(){const s=this._sub(),t=this.tier();return t.maxNotes+(s.bonusNotes||0)},
  upgrade(tid){if(TIERS[tid]){const s=this._sub();s.tier=tid;s.monthlyUsed=0;DS.set('subscription',s)}},
  addReferral(){const s=this._sub();s.referrals=(s.referrals||0)+1;s.bonusNotes=(s.bonusNotes||0)+2;DS.set('subscription',s)},
  pct(){const t=this.tier();return t.credits?Math.round((this._sub().monthlyUsed||0)/t.credits*100):0},
  info(){
    const s=this._sub(),t=this.tier();
    return{monthly:Math.max(t.credits-(s.monthlyUsed||0),0),monthlyMax:t.credits,carry:s.carryOver||0,extra:s.extraCredits||0,daily:Math.max(t.dailyLimit-(s.dailyUsed||0),0),dailyMax:t.dailyLimit,total:this.remaining()};
  }
};

const EDU={
  ortaokul:{label:'Ortaokul',classes:['5. Sınıf','6. Sınıf','7. Sınıf','8. Sınıf'],exams:[{name:'LGS',date:'2026-06-07'}],goals:['LGS\'ye hazırlanmak','Derslerimi yükseltmek','Özel okul sınavlarına hazırlanmak']},
  lise:{label:'Lise',classes:['9. Sınıf','10. Sınıf','11. Sınıf','12. Sınıf'],exams:[{name:'YKS-TYT',date:'2026-06-20'},{name:'YKS-AYT',date:'2026-06-21'}],goals:['YKS\'de derece yapmak','İstediğim bölüme girmek','Derslerimi yükseltmek','Burs kazanmak']},
  universite:{label:'Üniversite',faculties:['Mühendislik','Tıp','Hukuk','İşletme','İktisat','Eğitim','Fen-Edebiyat','Mimarlık','İletişim','Güzel Sanatlar','Sağlık Bilimleri','Diğer'],exams:[{name:'ALES',date:'2026-05-10'}],goals:['Yüksek lisansa hazırlanmak','Derslerimi geçmek','Staj bulmak','Mezun olmak']},
  mezun:{label:'Mezun / Sınav Hazırlık',exams_list:['KPSS','YDS','ALES','DGS','TUS','DUS','EKPSS','YÖKDİL','MSÜ','Diğer'],exam_dates:{KPSS:'2026-09-12',YDS:'2026-05-24',ALES:'2026-05-10',DGS:'2026-07-05',TUS:'2026-04-19',DUS:'2026-04-19',EKPSS:'2026-04-26',YÖKDİL:'2026-07-12',MSÜ:'2026-03-29'},goals:['Sınavı geçmek','Yüksek puan almak','Derece yapmak','Atanmak']}
};

const SKILL_LABELS={beginner:'Başlangıç',developing:'Gelişiyor',good:'İyi',advanced:'İleri Seviye'};
const MOTIVATIONS=['Bugün dünden daha iyisin.','Her adım seni hedefe yaklaştırır.','Küçük adımlar, büyük sonuçlar.','Vazgeçme, en iyi yatırım kendinedir.','Başarı sabırla gelir.','Bugün başla, yarın teşekkür edersin.','Zorluklar güçlü olduğunun kanıtı.','Hayallerinin peşinden git.','Öğrenmek hiç bitmez.','Sen düşündüğünden güçlüsün.'];

function seedNotes(){
  const c=['#007AFF','#5856D6','#FF2D55','#FF9F0A','#34C759','#AF52DE'];
  DS.set('users',[{id:'u1',name:'Zeynep Kaya',initials:'ZK',color:c[0]},{id:'u2',name:'Emre Demir',initials:'ED',color:c[1]},{id:'u3',name:'Elif Çelik',initials:'EÇ',color:c[2]},{id:'u4',name:'Burak Öztürk',initials:'BÖ',color:c[3]},{id:'u5',name:'Selin Arslan',initials:'SA',color:c[4]},{id:'u6',name:'Mert Yıldız',initials:'MY',color:c[5]}]);
  DS.set('notes',[
    {id:'n1',userId:'u1',subject:'Matematik',tag:'Formül',title:'Türev Alma Kuralları',excerpt:'Temel türev formülleri, zincir kuralı ve örnekler.',likes:42,comments:8,downloads:156,time:'2 saat önce'},
    {id:'n2',userId:'u2',subject:'Fizik',tag:'Konu Anlatımı',title:'Newton Hareket Yasaları',excerpt:'F=ma, eylemsizlik, etki-tepki yasaları.',likes:38,comments:12,downloads:98,time:'5 saat önce'},
    {id:'n3',userId:'u3',subject:'Edebiyat',tag:'Özet',title:'Divan Edebiyatı Nazım Biçimleri',excerpt:'Gazel, kaside, mesnevi, rubai özellikleri.',likes:27,comments:5,downloads:67,time:'Dün'},
    {id:'n4',userId:'u4',subject:'Kimya',tag:'Not',title:'Periyodik Tablo Trendleri',excerpt:'Atom yarıçapı, iyonlaşma enerjisi, elektronegatiflik.',likes:55,comments:15,downloads:203,time:'Dün'},
    {id:'n5',userId:'u5',subject:'Tarih',tag:'Özet',title:'Kurtuluş Savaşı Kronolojisi',excerpt:'1919-1923 olaylar, cepheler, antlaşmalar.',likes:89,comments:23,downloads:312,time:'2 gün önce'},
    {id:'n6',userId:'u6',subject:'Biyoloji',tag:'Çözüm',title:'Hücre Bölünmesi Soruları',excerpt:'Mitoz, mayoz — 25 çözümlü soru.',likes:34,comments:9,downloads:145,time:'3 gün önce'}
  ]);
}

/* ═══════════════════════════════════════
   saas.js — SaaS Engine (kredi satışı + paketler + günlük limit)
   ═══════════════════════════════════════ */
function updateCreditUI(){
  /* Kredi sadece Bilge sayfasında gösterilir — navbar'da yok */
  if(typeof _updateBilgeBadge==='function')_updateBilgeBadge();
}

function showUpgradePopup(reason){
  const reasons={credits:'Kredin tükendi. Ek kredi al veya paketini yükselt.',daily:'Bugünkü mesaj limitine ulaştın. Paketini yükselt veya yarın devam et.',notes:'Not alanı limitine ulaştın.',feature:'Bu özellik mevcut paketinde yok.'};
  const re=$('#upgradeReason');if(re)re.textContent=reasons[reason]||reasons.feature;
  const cur=Credits.tier(),grid=$('#upgradeTiers');
  if(grid){
    grid.innerHTML=Object.values(TIERS).filter(t=>t.id!=='free').map(t=>`
      <div class="tier-card ${t.popular?'tier-pop':''} ${t.id===cur.id?'tier-cur':''}">
        ${t.popular?'<div class="tier-pop-badge">Popüler</div>':''}
        <div style="font-size:32px">${t.icon}</div>
        <div class="tier-name">${t.label}</div>
        <div class="tier-price">${t.priceLabel}</div>
        <ul class="tier-feats">${t.features.map(f=>`<li>✓ ${f}</li>`).join('')}</ul>
        ${t.id===cur.id?'<button class="tier-btn-dis" disabled>Mevcut</button>':`<button class="tier-btn-up" data-t="${t.id}">Yükselt</button>`}
      </div>`).join('');
    grid.querySelectorAll('[data-t]').forEach(b=>b.addEventListener('click',()=>{Credits.upgrade(b.dataset.t);updateCreditUI();closePopup('upgradePopup');showToast(`${TIERS[b.dataset.t].icon} ${TIERS[b.dataset.t].label} aktif!`)}));
  }
  openPopup('upgradePopup');
}

function renderPackages(){
  const c=$('#packagesContent');if(!c)return;
  const cur=Credits.tier(),info=Credits.info(),sub=Credits._sub();

  c.innerHTML=`
    <div style="margin-bottom:28px"><h2 style="font-family:var(--fh);font-size:clamp(22px,3vw,28px);font-weight:800;margin-bottom:4px">Paketler & Kredi</h2><p style="font-size:14px;color:var(--txt2)">Sana en uygun planı seç veya ek kredi al.</p></div>

    <!-- Mevcut Plan Detay -->
    <div class="cur-plan">
      <div style="display:flex;align-items:center;gap:14px"><span style="font-size:28px">${cur.icon}</span><div><div style="font-family:var(--fh);font-size:18px;font-weight:700">${cur.label} Plan</div><div style="font-size:13px;color:var(--txt2)">${cur.priceLabel}</div></div></div>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <div style="text-align:center"><b style="font-family:var(--fh);color:var(--acc)">⚡ ${info.monthly}/${info.monthlyMax}</b><div style="font-size:10px;color:var(--txt3)">Aylık Kredi</div></div>
        ${info.carry>0?`<div style="text-align:center"><b style="font-family:var(--fh);color:var(--success)">🔄 ${info.carry}</b><div style="font-size:10px;color:var(--txt3)">Aktarılan</div></div>`:''}
        ${info.extra>0?`<div style="text-align:center"><b style="font-family:var(--fh);color:#FF9F0A">🛒 ${info.extra}</b><div style="font-size:10px;color:var(--txt3)">Ek Kredi</div></div>`:''}
        <div style="text-align:center"><b style="font-family:var(--fh)">📅 ${info.daily}/${info.dailyMax}</b><div style="font-size:10px;color:var(--txt3)">Bugün</div></div>
        <div style="text-align:center"><b style="font-family:var(--fh)">📝 ${sub.notes||0}/${Credits.notesMax()}</b><div style="font-size:10px;color:var(--txt3)">Not Alanı</div></div>
      </div>
    </div>
    ${cur.id!=='free'?'<p style="font-size:12px;color:var(--success);margin:-16px 0 20px 0">🔄 Kullanılmayan aylık krediler bir sonraki aya aktarılır.</p>':'<p style="font-size:12px;color:var(--txt3);margin:-16px 0 20px 0">Temel planda kredi aktarma yoktur. Yükseltme yaparak bu özelliği aç!</p>'}

    <!-- Abonelik Paketleri -->
    <h3 style="font-family:var(--fh);font-size:18px;font-weight:700;margin:0 0 16px">Aylık Abonelik</h3>
    <div class="tiers-grid">${Object.values(TIERS).map(t=>`
      <div class="tier-card ${t.popular?'tier-pop':''} ${t.id===cur.id?'tier-cur':''}">
        ${t.popular?'<div class="tier-pop-badge">En Popüler</div>':''}
        <div style="font-size:32px">${t.icon}</div>
        <div class="tier-name">${t.label}</div>
        <div class="tier-price">${t.priceLabel}</div>
        <ul class="tier-feats">${t.features.map(f=>`<li>✓ ${f}</li>`).join('')}${t.missing.map(f=>`<li class="tier-miss">✕ ${f}</li>`).join('')}</ul>
        ${t.id===cur.id?'<button class="tier-btn-dis" disabled>Mevcut Paket</button>':`<button class="tier-btn-up" data-up="${t.id}">${t.price===0?'Ücretsiz':'Yükselt'}</button>`}
      </div>`).join('')}</div>

    <!-- Ek Kredi Paketleri -->
    <h3 style="font-family:var(--fh);font-size:18px;font-weight:700;margin:32px 0 8px">Ek Kredi Al</h3>
    <p style="font-size:13px;color:var(--txt2);margin-bottom:16px">Tek seferlik satın al, süresiz kullan. Ek krediler hiçbir zaman sıfırlanmaz, bitene kadar kalır.</p>
    <div class="credit-packs-grid">${CREDIT_PACKS.map(p=>`
      <div class="credit-pack-card">
        <div class="cp-amount">⚡ ${p.amount}</div>
        <div class="cp-desc">${p.desc}</div>
        <div class="cp-price">${p.priceLabel}</div>
        <div class="cp-per">₺${(p.price/p.amount).toFixed(2)}/kredi</div>
        <button class="tier-btn-up" data-buy="${p.id}">Satın Al</button>
      </div>`).join('')}</div>

    <!-- Özel Sınav Paketleri -->
    <h3 style="font-family:var(--fh);font-size:18px;font-weight:700;margin:32px 0 16px">Özel Sınav Paketleri</h3>
    <div class="addons-grid">${ADDONS.map(a=>`<div class="addon-card"><div class="addon-lock">🔒</div><span style="font-size:28px">${a.icon}</span><div class="addon-name">${a.name}</div><div class="addon-desc">${a.desc}</div><div class="addon-price">${a.price}</div><button class="tier-btn-up addon-buy">Satın Al</button></div>`).join('')}</div>

    <!-- Davet -->
    <div class="invite-card"><div style="display:flex;align-items:center;gap:14px;flex:1;min-width:220px"><span style="font-size:28px">🎁</span><div><div style="font-family:var(--fh);font-size:16px;font-weight:700">Arkadaşını Davet Et</div><div style="font-size:13px;color:var(--txt2)">Her davet = <b>+2 Not Alanı</b></div><div style="font-size:12px;color:var(--txt3);margin-top:2px">${sub.referrals||0} davet · +${sub.bonusNotes||0} bonus</div></div></div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input class="invite-link" id="invLink" readonly value="https://bilgikaynagim.com/davet/${(DS.get('user')?.name||'link').toLowerCase().replace(/\s/g,'')}"><button class="tier-btn-up" id="copyInvBtn" style="white-space:nowrap;padding:10px 16px">Kopyala</button></div></div>`;

  /* Event listeners */
  c.querySelectorAll('[data-up]').forEach(b=>b.addEventListener('click',()=>{Credits.upgrade(b.dataset.up);updateCreditUI();renderPackages();showToast(`${TIERS[b.dataset.up].icon} ${TIERS[b.dataset.up].label} aktif!`)}));
  c.querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>{
    const pack=CREDIT_PACKS.find(p=>p.id===b.dataset.buy);
    if(pack){Credits.buyCredits(pack.amount);updateCreditUI();renderPackages();showToast(`⚡ ${pack.amount} kredi eklendi!`)}
  }));
  c.querySelectorAll('.addon-buy').forEach(b=>b.addEventListener('click',()=>showToast('Ödeme sistemi yakında!')));
  $('#copyInvBtn')?.addEventListener('click',()=>{navigator.clipboard?.writeText($('#invLink').value).then(()=>showToast('Link kopyalandı!')).catch(()=>showToast('Kopyalandı!'))});
}

function maybeGoldenTicket(){
  const last=DS.get('goldenTicket');if(last&&Date.now()-last<864e5)return;
  if(Math.random()>0.1)return;DS.set('goldenTicket',Date.now());
  setTimeout(()=>openPopup('goldenPopup'),15000);
}

function initSaaS(){
  updateCreditUI();maybeGoldenTicket();
  $('#goldClaim')?.addEventListener('click',()=>{Credits.upgrade('pro');updateCreditUI();closePopup('goldenPopup');showToast('🎫 1 Ay Pro aktif!');window.open('https://instagram.com','_blank')});
  $('#goldSkip')?.addEventListener('click',()=>closePopup('goldenPopup'));
}
/* feed.js */
function renderNotes(f='all'){
  const ng=$('#noteGrid');if(!ng)return;const notes=DS.get('notes')||[],users=DS.get('users')||[];let list=[...notes];
  if(f==='popular')list.sort((a,b)=>b.likes-a.likes);
  ng.innerHTML=list.map(n=>{const u=users.find(x=>x.id===n.userId)||{initials:'?',color:'#999',name:'Anonim'};const lk=DS.get('liked_'+n.id);
  return`<article class="ncard"><div class="ncard-top"><div class="ncard-av" style="background:${u.color}">${u.initials}</div><span class="ncard-author">${u.name}</span><span class="ncard-time">${n.time}</span></div><span class="ncard-tag">${n.tag} · ${n.subject}</span><h3 class="ncard-title">${n.title}</h3><p class="ncard-excerpt">${n.excerpt}</p><div class="ncard-bot"><span class="ncard-stat ${lk?'liked':''}" data-like="${n.id}"><svg viewBox="0 0 24 24" fill="${lk?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>${n.likes}</span><span class="ncard-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>${n.comments}</span><span class="ncard-dl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>${n.downloads}</span></div></article>`}).join('');
  ng.querySelectorAll('[data-like]').forEach(el=>{el.addEventListener('click',e=>{e.stopPropagation();const id=el.dataset.like,all=DS.get('notes'),n=all.find(x=>x.id===id);if(!n)return;const was=DS.get('liked_'+id);if(was){n.likes--;DS.remove('liked_'+id);el.classList.remove('liked')}else{n.likes++;DS.set('liked_'+id,true);el.classList.add('liked')}DS.set('notes',all);el.querySelector('svg').setAttribute('fill',was?'none':'currentColor')})});
}
function initFeed(){
  $$('.feed-tab').forEach(t=>{t.addEventListener('click',()=>{$$('.feed-tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');renderNotes(t.dataset.f)})});
  const si=$('#searchInp');let to;si&&si.addEventListener('input',()=>{clearTimeout(to);to=setTimeout(()=>{const q=si.value.trim().toLowerCase();if(!q){renderNotes();return}navigateTo('feed');const notes=DS.get('notes')||[];const f=notes.filter(n=>n.title.toLowerCase().includes(q)||n.subject.toLowerCase().includes(q));const ng=$('#noteGrid');if(!f.length){ng.innerHTML='<p style="grid-column:1/-1;text-align:center;color:var(--txt2);padding:40px">Sonuç bulunamadı.</p>';return}const o=DS.get('notes');DS.set('notes',f);renderNotes();DS.set('notes',o)},250)});
  renderNotes();
}
/* profile.js */
function buildDashboard(u){
  const info=EDU[u.level];let tags=[info?.label||''];if(u.classOrDetail)tags.push(u.classOrDetail);
  const mi=Math.floor(Math.random()*MOTIVATIONS.length);
  $('#dashWelcome').innerHTML=`<div class="dash-welcome"><div class="dw-title">${u.name}, hoş geldin!</div><div class="dw-sub">${SKILL_LABELS[u.skill]||''} · ${info?.label||''}</div><div class="dw-tags">${tags.map(t=>`<span class="dw-tag">${t}</span>`).join('')}</div><div class="dw-motiv">"${MOTIVATIONS[mi]}"</div></div>`;
  let exams=[];if(u.level==='mezun'&&u.examChoice){const d=info.exam_dates[u.examChoice];if(d)exams.push({name:u.examChoice,date:d})}else if(info?.exams)exams=info.exams;
  if(exams.length){const now=new Date();$('#examCountdown').innerHTML=`<div class="countdown-row">${exams.map(ex=>{const diff=Math.ceil((new Date(ex.date)-now)/864e5);return`<div class="cd-card"><div><div class="cd-days">${diff>0?diff:'Geçti'}</div><div class="cd-unit">${diff>0?'gün kaldı':''}</div></div><div><div class="cd-label">${ex.name}</div><div class="cd-date">${new Date(ex.date).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})}</div></div></div>`}).join('')}</div>`}
}
function buildProfile(u){
  const info=EDU[u.level],tier=Credits.tier(),ci=Credits.info(),ini=u.initials||'?';
  let mi=Math.floor(Math.random()*MOTIVATIONS.length);
  let items=[['Seviye',info?.label||''],['Detay',u.classOrDetail||''],['Durum',SKILL_LABELS[u.skill]||''],['Paket',`${tier.icon} ${tier.label}`]];
  if(u.dreamJob)items.push(['Meslek',u.dreamJob]);
  $('#profileBody').innerHTML=`
    <div style="display:flex;flex-direction:column;align-items:center;gap:12px;margin-bottom:24px">
      <div class="pf-avatar">${ini}</div><div class="pf-name">${u.name}</div>
      <div style="font-size:13px;color:var(--txt2)">${tier.icon} ${tier.label} · ${u.xp||0} XP</div>
      <div style="display:flex;gap:14px;margin-top:8px;flex-wrap:wrap;justify-content:center">
        <div style="text-align:center"><b style="font-family:var(--fh);color:var(--acc)">⚡ ${ci.monthly}/${ci.monthlyMax}</b><div style="font-size:10px;color:var(--txt3)">Aylık</div></div>
        ${ci.carry>0?`<div style="text-align:center"><b style="font-family:var(--fh);color:var(--success)">🔄 ${ci.carry}</b><div style="font-size:10px;color:var(--txt3)">Aktarılan</div></div>`:''}
        ${ci.extra>0?`<div style="text-align:center"><b style="font-family:var(--fh);color:#FF9F0A">🛒 ${ci.extra}</b><div style="font-size:10px;color:var(--txt3)">Ek</div></div>`:''}
        <div style="text-align:center"><b style="font-family:var(--fh)">📅 ${ci.daily}/${ci.dailyMax}</b><div style="font-size:10px;color:var(--txt3)">Bugün</div></div>
        <div style="text-align:center"><b style="font-family:var(--fh)">📝 ${Credits.notesUsed()}/${Credits.notesMax()}</b><div style="font-size:10px;color:var(--txt3)">Not</div></div>
      </div>
      <div class="pf-motiv" id="pfMotiv">"${MOTIVATIONS[mi]}"</div>
    </div>
    <div class="pf-info-grid">${items.map(([l,v])=>`<div class="pf-info-item"><div class="pf-info-lbl">${l}</div><div class="pf-info-val">${v}</div></div>`).join('')}</div>
    ${tier.id==='free'?`<button class="pf-upgrade-btn" onclick="closePopup('profilePopup');navigateTo('packages')">⚡ Paketi Yükselt</button>`:''}
    <button class="pf-edit-btn" id="pfEditBtn">Bilgilerimi Düzenle</button>`;
  setInterval(()=>{const el=$('#pfMotiv');if(!el)return;let ni;do{ni=Math.floor(Math.random()*MOTIVATIONS.length)}while(ni===mi);mi=ni;el.style.opacity='0';setTimeout(()=>{el.textContent=`"${MOTIVATIONS[ni]}"`;el.style.opacity='1'},300)},20*6e4);
  setTimeout(()=>{$('#pfEditBtn')?.addEventListener('click',()=>{closePopup('profilePopup');restartOnboarding()})},100);
}
/* bilge.js — Offline AI Asistan */
let _chatHistory=[],_streaming=false;
const BILGE_MODES={friendly:{id:'friendly',label:'Samimi',emoji:'😊'},serious:{id:'serious',label:'Ciddi',emoji:'🎓'},funny:{id:'funny',label:'Eğlenceli',emoji:'😄'}};
function _getMode(){return DS.get('bilge_mode')||'friendly'}

const BilgeMemory={
  _key:'bilge_memory',get(){return DS.get(this._key)||{}},save(k,v){const m=this.get();m[k]=v;m._updated=Date.now();DS.set(this._key,m)},getAll(){return this.get()},clear(){DS.remove(this._key)},
  extract(text){const l=text.toLowerCase();if(text.match(/(\d+[\.,]?\d*)\s*(net|puan|doğru)/i))this.save('nets',text.substring(0,150));if(l.includes('zorlanıyorum')||l.includes('yapamıyorum')){const e=this.get().weakSubjects||'';const s=text.substring(0,80);if(!e.includes(s.substring(0,25)))this.save('weakSubjects',e?(e+' | '+s):s)}if(l.includes('hedefim'))this.save('goals',text.substring(0,100));this.save('lastActive',new Date().toLocaleDateString('tr-TR',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}));this.save('totalMessages',(this.get().totalMessages||0)+1)},
  display(){const m=this.get();const e=Object.entries(m).filter(([k])=>!k.startsWith('_'));return e.length?e.map(([k,v])=>`${k}: ${v}`).join('\n'):null}
};

function _bilgeRespond(msg){
  const l=msg.toLowerCase().trim(),u=DS.get('user')||{},name=u.name?.split(' ')[0]||'',mode=_getMode(),mem=BilgeMemory.getAll(),h=new Date().getHours();
  const e=mode==='funny'?['😄','🚀','💥','🎉'][Math.floor(Math.random()*4)]:mode==='friendly'?['😊','💪','🌟','📚'][Math.floor(Math.random()*4)]:'';
  const p=mode==='funny'?(name?`Eyyy ${name}! `:'Dostum! '):mode==='friendly'?(name?`${name}, `:''):'';
  const memNote=mem.weakSubjects?`\n\n💡 Daha önce **${mem.weakSubjects.split('|')[0].trim()}** konusunda zorlandığını söylemiştin.`:'';

  if(l.match(/^(merhaba|selam|hey|sa|günaydın|iyi günler|nasılsın|naber)/)){
    const tg=h>=5&&h<12?'Günaydın':h>=12&&h<18?'İyi günler':h>=18&&h<22?'İyi akşamlar':'Gece kuşu musun';
    if(mode==='serious')return`${tg}. Ben Bilge, eğitim asistanınız. Ders anlatımı, soru çözümü ve çalışma planlaması konularında yardımcı olabilirim.`;
    if(mode==='funny')return`${tg} ${name}! 🎉 Ben Bilge! Bugün hangi dersi alt üst edelim? 😄${memNote}`;
    return`${tg} ${name}! 😊 Nasılsın? Bugün sana nasıl yardımcı olabilirim?\n\n- 📚 **Ders anlatımı** — adım adım\n- 🔢 **Soru çözümü** — birlikte çözelim\n- 📅 **Çalışma planı** — sana özel\n- 💪 **Motivasyon** — bazen lazım olur${memNote}`;
  }
  if(l.match(/(kimsin|kim yaptı|yapay zeka|gpt|gemini|openai|claude|model|altyapı)/)){
    if(mode==='funny')return`Ben Bilge! 🧠 bilgi kaynağım'ın en zeki asistanıyım! Perde arkasını sormak yerine gel soru çözelim 😄`;
    return`${p}Ben **Bilge** — bilgi kaynağım ekibi tarafından geliştirilmiş eğitim asistanıyım ${e}\n\nTeknik detaylar yerine sana nasıl yardımcı olabileceğime odaklanalım!`;
  }
  if(l.match(/(matematik|türev|integral|limit|denklem|fonksiyon|geometri|üçgen|daire|logaritma|matris|olasılık|permütasyon)/)){
    if(l.includes('türev'))return`## 📐 Türev\n\n${p}Türev, fonksiyonun **anlık değişim hızıdır**.\n\n### Kurallar:\n1. **(xⁿ)' = n·xⁿ⁻¹**\n2. **(f+g)' = f' + g'**\n3. **(f·g)' = f'·g + f·g'**\n4. **(f/g)' = (f'·g - f·g') / g²**\n\n### Örnek:\nf(x) = 3x² + 5x - 2 → f'(x) = **6x + 5**\n\nDetay ister misin? ${e}`;
    if(l.includes('integral'))return`## ∫ İntegral\n\n${p}İntegral, türevin **tersidir** — eğri altı alan hesaplar.\n\n### Kurallar:\n- **∫xⁿ dx = xⁿ⁺¹/(n+1) + C**\n- **∫k dx = kx + C**\n\n### Örnek:\n∫(3x² + 2x) dx = **x³ + x² + C**\n\nBelirli mi belirsiz mi? ${e}`;
    if(l.includes('limit'))return`## Limit\n\n${p}Limit, fonksiyonun bir noktaya **yaklaşırken** aldığı değer.\n\n### Yöntemler:\n1. Yerine koyma\n2. Sadeleştirme\n3. L'Hôpital\n\n### Örnek:\nlim(x→2) (x²-4)/(x-2) = lim(x→2) (x+2) = **4**\n\n${e}`;
    return`## 📐 Matematik\n\n${p}Hangi konuda yardım istiyorsun?\n\n- Denklemler, fonksiyonlar\n- Türev, integral, limit\n- Geometri, trigonometri\n- Olasılık, istatistik\n- Matris, logaritma\n\nKonuyu söyle! ${e}`;
  }
  if(l.match(/(fizik|kuvvet|hız|ivme|newton|enerji|elektrik|optik|dalga)/)){
    return`## ⚡ Fizik\n\n${p}Fizik konuları:\n\n### Mekanik:\n- **F = m·a** (Newton 2)\n- **v = v₀ + a·t**\n- **Ek = ½mv²**, **Ep = mgh**\n\n### Elektrik:\n- **V = I·R** (Ohm)\n- **P = V·I**\n\nHangi konuda detay? ${e}`;
  }
  if(l.match(/(kimya|atom|molekül|element|periyodik|mol|asit|baz|tepkime)/)){
    return`## 🧪 Kimya\n\n${p}Kimya:\n\n- **Atom:** Proton, nötron, elektron\n- **Bağlar:** İyonik, kovalent, metalik\n- **Mol:** n = m/M, 1 mol = 6.02×10²³\n- **Asit-Baz:** pH < 7 asit, pH > 7 baz\n\nDetay? ${e}`;
  }
  if(l.match(/(biyoloji|hücre|dna|gen|mitoz|fotosentez|enzim|ekosistem)/)){
    return`## 🧬 Biyoloji\n\n${p}Biyoloji:\n\n- **Hücre:** Mitoz (2n→2n), Mayoz (2n→n)\n- **DNA:** A-T, G-C çift sarmal\n- **Fotosentez:** 6CO₂+6H₂O → C₆H₁₂O₆+6O₂\n\nDetay? ${e}`;
  }
  if(l.match(/(türkçe|edebiyat|dilbilgisi|paragraf|fiil|isim|sıfat|cümle|anlam)/)){
    return`## 📖 Türkçe\n\n${p}Konular:\n\n- **Sözcük türleri:** İsim, fiil, sıfat, zarf...\n- **Cümle ögeleri:** Özne, yüklem, nesne\n- **Edebi sanatlar:** Teşbih, istiare, mecaz\n- **Paragraf:** Ana düşünce, yardımcı düşünce\n\nHangi konu? ${e}`;
  }
  if(l.match(/(tarih|osmanlı|cumhuriyet|atatürk|savaş|inkılap|antlaşma)/)){
    return`## 🏛️ Tarih\n\n${p}Konular:\n\n- Osmanlı dönemleri\n- Kurtuluş Savaşı\n- Atatürk ilke ve inkılapları\n- Cumhuriyet dönemi\n\nHangi dönem? ${e}`;
  }
  if(l.match(/(plan|program|ne çalışayım|çalışma planı|nasıl çalış)/)){
    const wn=mem.weakSubjects?`\n\n⚠️ **Öncelik:** ${mem.weakSubjects.split('|')[0].trim()}`:'';
    return`## 📅 Çalışma Planı\n\n${p}Günlük program:${wn}\n\n| Saat | Aktivite |\n|------|----------|\n| 09:00-10:30 | 📚 Ana ders (90dk) |\n| 10:45-12:00 | 🔢 Soru çözümü |\n| 14:00-15:30 | 📖 İkinci ders |\n| 15:45-16:45 | ✍️ Test/Deneme |\n| 19:00-20:00 | 📝 Tekrar |\n\n**İpuçları:**\n- Pomodoro: 25dk çalış, 5dk mola\n- Zayıf konulara fazla zaman\n- Günde en az 1 deneme\n\nÖzelleştirelim mi? ${e}`;
  }
  if(l.match(/(motivasyon|moral|bıktım|yapamıyorum|yoruldum|pes|sıkıldım)/)){
    const q=['"Her gün tekrarlanan küçük çabaların toplamıdır başarı."','"Bugün yaptıkların yarını belirler."','"Zor olan doğru olandır."'][Math.floor(Math.random()*3)];
    if(mode==='funny')return`## 💪 Hey ${name}!\n\nBiliyorum zor, ben de bazen neden bu kadar akıllıyım diye düşünüyorum 😄\n\n> ${q}\n\n5 dakika başla — genelde devam edersin! 🚀`;
    return`## 💪 Motivasyon\n\n${p}Yorulmak normal. Ama unutma:\n\n> ${q}\n\n- 🎯 Hedefin var — her adım yaklaştırıyor\n- 📈 İlerliyorsun\n- 🏆 Yarın teşekkür edeceksin\n\n**5 dakika kuralı:** Sadece 5dk başla! ${e}`;
  }
  if(l.match(/(net|deneme|puan|kaç net|tyt|ayt|lgs)/)){
    return`## 📊 Deneme Analizi\n\n${p}Netlerini söyle, analiz edelim!\n\n1. Hangi sınav? (TYT/AYT/LGS)\n2. Kaç net? (Mat: ?, Türkçe: ?)\n3. Hedef netin?\n\n${mem.nets?'📊 **Kayıt:** '+mem.nets:''}`;
  }
  if(l.match(/(soru|çöz|hesapla|bul |kaçtır|formül)/)){
    return`## ✏️ Soru Çözümü\n\n${p}Soruyu yaz, adım adım çözelim!\n\n- Tam metni yaz\n- Hangi ders?\n- Şıklar varsa ekle\n\nSadece cevap vermem, her adımı açıklarım! ${e}`;
  }
  if(l.match(/(teşekkür|sağol|eyvallah|tşk|harikasın)/)){
    if(mode==='funny')return`Bir şey değil! 😄 Sen sordukça ben anlatırım! 🚀`;
    return`Rica ederim${name?' '+name:''}! ${e} Başka sorun olursa buradayım!`;
  }
  if(l.match(/(görüşürüz|hoşça kal|bye|iyi geceler|güle güle)/)){
    return`Görüşürüz${name?' '+name:''}! 👋 İyi çalışmalar! ${e}`;
  }
  return`${p}Bu konuda detaylı anlatır mısın? ${e}\n\nYapabileceklerim:\n- 📚 Ders anlatımı\n- ✏️ Soru çözümü\n- 📅 Çalışma planı\n- 💪 Motivasyon\n- 📊 Net analizi`;
}

function _md(t){return t.replace(/```(\w*)\n([\s\S]*?)```/g,'<pre><code>$2</code></pre>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/^### (.+)$/gm,'<strong style="display:block;margin:10px 0 4px;font-size:14px">$1</strong>').replace(/^## (.+)$/gm,'<strong style="font-size:17px;display:block;margin:12px 0 6px">$1</strong>').replace(/^> (.+)$/gm,'<blockquote style="border-left:3px solid var(--acc);padding:8px 14px;margin:10px 0;color:var(--txt2);font-style:italic;background:var(--acc-l);border-radius:0 8px 8px 0">$1</blockquote>').replace(/^[•\-\*] (.+)$/gm,'<li style="margin:3px 0">$1</li>').replace(/^\d+\. (.+)$/gm,'<li style="margin:3px 0">$1</li>').replace(/((?:<li.*<\/li>\n?)+)/g,'<ul style="padding-left:20px;margin:6px 0">$1</ul>').replace(/\n\n/g,'</p><p style="margin:8px 0">').replace(/\n/g,'<br>')}

function _addMsg(role,text,save){const body=$('#bilgeChatBody'),wel=$('#bilgeWelcome');if(wel)wel.style.display='none';const u=DS.get('user'),ini=role==='user'?(u?.initials||'?'):'🧠';const el=document.createElement('div');el.className=`bilge-msg ${role}`;el.innerHTML=role==='assistant'?`<div class="bilge-msg-av">${ini}</div><div class="bilge-msg-bubble">${_md(text)}</div>`:`<div class="bilge-msg-av">${ini}</div><div class="bilge-msg-bubble">${text.replace(/</g,'&lt;')}</div>`;body.appendChild(el);body.scrollTop=body.scrollHeight;if(save!==false){_chatHistory.push({role,text});DS.set('bilge_history',_chatHistory)}}
function _showTyping(){const body=$('#bilgeChatBody'),t=document.createElement('div');t.className='bilge-msg assistant';t.id='bilgeTyping';t.innerHTML='<div class="bilge-msg-av">🧠</div><div class="bilge-msg-bubble"><div class="bilge-typing"><div class="bilge-dot"></div><div class="bilge-dot"></div><div class="bilge-dot"></div></div></div>';body.appendChild(t);body.scrollTop=body.scrollHeight}

async function bilgeSend(text){
  if(!text?.trim()||_streaming)return;_streaming=true;
  const inp=$('#bilgeInput'),btn=$('#bilgeSendBtn');inp.value='';inp.style.height='auto';btn.disabled=true;$('#bilgeStatus').textContent='Bilge düşünüyor...';
  BilgeMemory.extract(text);_updateMemBadge();_addMsg('user',text);_showTyping();
  const res=_bilgeRespond(text);const delay=Math.min(600+res.length*1.5,2000);
  await new Promise(r=>setTimeout(r,delay));
  $('#bilgeTyping')?.remove();_addMsg('assistant',res);
  Credits.use(1);updateCreditUI();
  $('#bilgeStatus').textContent='Çevrimiçi';_streaming=false;btn.disabled=!inp.value.trim();_updateBilgeBadge();
}

function _updateBilgeBadge(){const cd=$('#bilgeCreditBadge');if(!cd)return;const i=Credits.info();cd.textContent=`⚡ ${i.total} kredi · 📅 ${i.daily}/${i.dailyMax} bugün`}
function bilgeClear(){_chatHistory=[];DS.remove('bilge_history');const body=$('#bilgeChatBody');body.innerHTML=`<div class="bilge-welcome" id="bilgeWelcome"><div style="font-size:48px">🧠</div><h3>Merhaba! Ben Bilge.</h3><p>Ders anlatımı, soru çözümü, çalışma planı ve motivasyon — ne istersen sor.</p><div class="bilge-quick">${_quickBtns()}</div></div>`;body.querySelectorAll('.bilge-qbtn').forEach(b=>{b.addEventListener('click',()=>bilgeSend(b.dataset.p))});showToast('Temizlendi')}
function _quickBtns(){return[['📚','Bugün ne çalışayım?'],['💪','Motivasyon ver'],['🔢','Matematik anlat'],['📅','Çalışma planı yap']].map(([e,p])=>`<button class="bilge-qbtn" data-p="${p}">${e} ${p}</button>`).join('')}
function setBilgeMode(m){if(!BILGE_MODES[m])return;DS.set('bilge_mode',m);$$('.bilge-mode-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));showToast(BILGE_MODES[m].emoji+' '+BILGE_MODES[m].label+' modu aktif')}

function initBilge(){
  const inp=$('#bilgeInput'),btn=$('#bilgeSendBtn');
  btn?.addEventListener('click',()=>bilgeSend(inp.value));
  inp?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();if(!btn.disabled)bilgeSend(inp.value)}});
  inp?.addEventListener('input',()=>{inp.style.height='auto';inp.style.height=Math.min(inp.scrollHeight,100)+'px';btn.disabled=!inp.value.trim()||_streaming});
  $$('.bilge-qbtn').forEach(b=>b.addEventListener('click',()=>bilgeSend(b.dataset.p)));
  $('#bilgeClearBtn')?.addEventListener('click',bilgeClear);
  $$('.bilge-mode-btn').forEach(b=>{b.addEventListener('click',()=>setBilgeMode(b.dataset.mode));b.classList.toggle('active',b.dataset.mode===_getMode())});
  $('.bilge-mem-badge')?.addEventListener('click',showMemoryPopup);_updateMemBadge();
  const saved=DS.get('bilge_history'),body=$('#bilgeChatBody');
  if(saved?.length&&!body?.querySelectorAll('.bilge-msg').length){_chatHistory=saved;$('#bilgeWelcome')&&($('#bilgeWelcome').style.display='none');saved.forEach(m=>_addMsg(m.role,m.text,false))}
  _updateBilgeBadge();
}
function _updateMemBadge(){const b=$('.bilge-mem-badge');if(!b)return;const c=Object.keys(BilgeMemory.getAll()).filter(k=>k!=='_updated').length;b.textContent=c>0?`🧠 Hafıza (${c})`:'🧠 Hafıza'}
function showMemoryPopup(){const m=BilgeMemory.getAll(),u=DS.get('user');let pop=$('#memoryPopup');if(!pop){pop=document.createElement('div');pop.id='memoryPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}pop.innerHTML=`<div class="popup-card" style="max-width:400px"><div class="popup-hdr"><h2>🧠 Hafıza</h2><button class="popup-close" onclick="$('#memoryPopup').classList.remove('vis')">✕</button></div><div class="popup-body">${Object.keys(m).filter(k=>!k.startsWith('_')).length?Object.entries(m).filter(([k])=>!k.startsWith('_')).map(([k,v])=>`<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;border-bottom:1px solid var(--bg2)"><span style="color:var(--txt3)">${k}</span><span>${v}</span></div>`).join('')+'<button class="filter-btn" style="width:100%;margin-top:12px" onclick="BilgeMemory.clear();_updateMemBadge();$(\'#memoryPopup\').classList.remove(\'vis\');showToast(\'Temizlendi\')">🗑️ Temizle</button>':'<p style="text-align:center;color:var(--txt3);padding:20px">Henüz kayıt yok</p>'}</div></div>`;pop.classList.add('vis')}
/* ─── KURAL TABANLI AI (API gerektirmez) ─── */
async function _callBilge(msg){
  await new Promise(r=>setTimeout(r,1000+Math.random()*1500));
  return{ok:true,text:_generateResponse(msg)};
}
function _generateResponse(msg){
  const u=DS.get('user')||{};const mode=_getMode();const mem=BilgeMemory.getAll();
  const m=msg.toLowerCase().replace(/[?!.,]/g,'');const name=u.name?u.name.split(' ')[0]:'';const g=name?name+', ':'';
  if(m.match(/kimsin|nesin|kim yaptı|model|yapay zeka|google|gpt|gemini|openai|claude/))return'Ben **Bilge**, bilgi kaynağım ekibi tarafından geliştirilen eğitim asistanıyım. 🧠 Sana derslerde yardımcı olmak, plan oluşturmak ve motivasyon vermek için buradayım. Ne konuda yardım istersin?';
  if(m.match(/^(merhaba|selam|hey|sa|naber|nasılsın|günaydın|iyi günler|iyi akşamlar)/))return mode==='funny'?`Selamlar ${g}! 😄 Bugün derslere hazır mısın?\n\n📚 Ders çalışalım\n💪 Motivasyon\n📅 Plan yapalım\n❓ Soru sor`:`Merhaba ${g}! 😊 Nasıl yardımcı olabilirim?\n\n📚 Ders anlatımı\n❓ Soru çözümü\n📅 Çalışma planı\n💪 Motivasyon`;
  if(m.includes('matematik')||m.includes('mat ')){
    if(m.includes('türev'))return`**Türev** 📐\n\nTürev, fonksiyonun değişim hızıdır.\n\n**Kurallar:**\n1. c' = 0\n2. (xⁿ)' = n·xⁿ⁻¹\n3. (f+g)' = f' + g'\n4. (f·g)' = f'·g + f·g'\n5. (f/g)' = (f'g - fg') / g²\n\n**Örnek:** f(x)=3x²+5x-2 → f'(x)=6x+5`;
    if(m.includes('integral'))return`**İntegral** ∫\n\nTürevin tersi.\n\n**Kurallar:**\n1. ∫xⁿdx = xⁿ⁺¹/(n+1)+C\n2. ∫sinx dx = -cosx+C\n3. ∫cosx dx = sinx+C\n4. ∫eˣdx = eˣ+C\n\n**Örnek:** ∫(3x²+2x)dx = x³+x²+C`;
    if(m.includes('limit'))return`**Limit** 📊\n\nFonksiyonun bir noktaya yaklaşırken aldığı değer.\n\n**Kurallar:**\n• 0/0 → L'Hôpital\n• lim sin(x)/x = 1\n• lim (1+1/x)ˣ = e\n\nSoru tipi söyle, çözelim!`;
    return`**Matematik** 🔢\n\n${g}hangi konu?\n\n• Sayılar, denklemler\n• Geometri\n• Türev, integral, limit\n• Polinomlar, logaritma\n• Olasılık, kombinasyon`;
  }
  if(m.includes('fizik'))return`**Fizik** ⚡\n\n**Newton Yasaları:**\n1. Eylemsizlik\n2. F=m·a\n3. Etki-tepki\n\nKonular: Mekanik, elektrik, optik, dalgalar, modern fizik\nHangisini anlatalım?`;
  if(m.includes('kimya'))return`**Kimya** 🧪\n\nKonular: Atom, periyodik tablo, bağlar, tepkimeler, asit-baz, organik\n\n**Mol:** n=m/M\n1 mol = 6.022×10²³\n\nHangi konuyu anlatalım?`;
  if(m.includes('biyoloji'))return`**Biyoloji** 🧬\n\nKonular: Hücre, genetik, ekosistem, insan biyolojisi\n\n**Hücre Bölünmesi:**\n• Mitoz: 1→2 özdeş\n• Mayoz: 1→4 farklı\n\nHangi konuyu detaylandırayım?`;
  if(m.includes('plan')||m.includes('program')||m.includes('çalış'))return`**Çalışma Planı** 📅\n\n**Sabah (08-12):**\n• Zayıf konu tekrarı\n• Yeni konu\n• Test çöz\n\n**Öğle (14-17):**\n• Soru bankası\n• Video + not\n\n**Akşam (19-21):**\n• Günün tekrarı\n• Deneme\n\n✅ 45dk çalış, 10dk mola\n✅ Zayıf konulara %60 zaman`;
  if(m.match(/motivasyon|moral|pes|yapam/))return mode==='funny'?`💪😄 ${g}kalk hadi!\n\nEdison ampulü bulmadan 1000 kez başarısız olmuş. "Başarısız olmadım, 1000 yanlış yol buldum" demiş.\n\n🔥 25 dk çalış, başladıktan sonra durmak zor!\n🎯 Küçük adımlar büyük sonuçlar doğurur\n⭐ Sen yaparsın!`:`**Motivasyon** 💪\n\n${g}her gün bir adım at.\n\n• Bugün yarının temeli\n• Zor zamanlar güçlü yetiştirir\n• Küçük adımlar büyük sonuçlar\n\n> "Başarının sırrı, başlamaktır." — Mark Twain`;
  if(m.match(/deneme|net |puan/))return`**Deneme** 📊\n\n${g}analiz için:\n1. Yanlış soru analizi\n2. Konu bazlı değerlendirme\n3. Zaman yönetimi\n\n**Net:** Doğru-(Yanlış×0.25)\n**Hedef:** TYT 90+, AYT alan 60+\n\n${mem.nets?'Son kayıt: '+mem.nets:''}`;
  if(m.match(/soru|çöz|nasıl/))return`**Soru Çözümü** ❓\n\n${g}soruyu detaylı yaz:\n1. Verilenleri belirle\n2. Formülü bul\n3. Adım adım çöz\n4. Kontrol et\n\nSorunuzu yazın!`;
  if(m.match(/türkçe|edebiyat|paragraf/))return`**Türkçe** 📖\n\n• Sözcükte Anlam\n• Cümle Bilgisi\n• Paragraf — Ana düşünce\n• Anlatım Bozuklukları\n\n**İpucu:** Paragrafta son cümleyi önce oku! 💡`;
  if(m.includes('tarih'))return`**Tarih** 🏛️\n\nDönemler: İlk Türkler, İslam, Osmanlı, Kurtuluş Savaşı, Cumhuriyet\n\nHangi dönemi anlatalım?`;
  return`${g}bu konuda yardımcı olabilirim! 😊\n\n📚 Ders anlatımı\n❓ Soru çözümü\n📅 Çalışma planı\n💪 Motivasyon\n📊 Deneme analizi\n\nNe hakkında konuşalım?`;
}
/* ═══════════════════════════════════════
   pages.js — Tüm içerik sayfaları (AI entegrasyonlu)
   ═══════════════════════════════════════ */

/* ─── AI HELPER (kural tabanlı — API gerektirmez) ─── */
async function askBilgeForTool(prompt,targetEl){
  if(!Credits.canSend()){showToast('Kredi veya günlük limit doldu!');return null}
  targetEl.innerHTML='<div class="bilge-typing" style="padding:16px;display:flex;gap:4px"><div class="bilge-dot"></div><div class="bilge-dot"></div><div class="bilge-dot"></div></div>';
  /* Simüle edilmiş düşünme süresi */
  await new Promise(r=>setTimeout(r,800+Math.random()*700));
  const text=_localAIResponse(prompt);
  Credits.use(1);if(typeof updateCreditUI==='function')updateCreditUI();
  return text;
}
function _localAIResponse(prompt){
  const p=prompt.toLowerCase();
  if(p.includes('görev')||p.includes('plan'))return'📋 **Önerilen Görevler:**\n\n1. Zayıf konularını tekrar et (45 dk)\n2. 1 deneme çöz ve analiz et (90 dk)\n3. Formül kartlarını gözden geçir (20 dk)\n4. Yeni konu videosu izle (30 dk)\n5. Özet çıkar ve not al (25 dk)\n\n💡 Günde en az 3 saat düzenli çalışma hedefle!';
  if(p.includes('net')||p.includes('deneme'))return'📊 **Deneme Analizi:**\n\nGüçlü yönlerini korurken zayıf konulara odaklan. Her denemeden sonra yanlış soruları mutlaka çöz. Haftalık en az 2 deneme hedefle.';
  if(p.includes('motivasyon'))return'💪 **Motivasyon:**\n\nHer gün bir adım daha ileri! Başarı, küçük adımların toplamıdır. Bugün yapacağın çalışma, yarının başarısının temelidir. Vazgeçme, hedefe yakınsın!';
  return'📚 **Öneri:**\n\nDüzenli çalışma programı oluştur, zayıf konulara öncelik ver ve deneme çözerek kendini test et. İyi çalışmalar!';
}

/* ═══ GÖREVLER ═══ */
function renderTasks(){
  const c=$('#page-tasks');if(!c)return;
  let tasks=DS.get('tasks')||_seedTasks();
  const today=new Date().toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long'});
  const COLOR_PALETTE=['#007AFF','#FF3B30','#FF9F0A','#34C759','#5856D6','#FF2D55','#AF52DE','#5AC8FA','#FFD60A','#8E8E93','#00C7BE','#30B0C7'];
  const DEFAULT_CATS=[
    {id:'ders',label:'📚 Ders',color:'#007AFF'},
    {id:'soru',label:'✏️ Soru Çözümü',color:'#FF9F0A'},
    {id:'deneme',label:'📝 Deneme',color:'#FF3B30'},
    {id:'tekrar',label:'🔄 Tekrar',color:'#5856D6'},
    {id:'odev',label:'📋 Ödev',color:'#34C759'},
    {id:'diger',label:'⭐ Diğer',color:'#8E8E93'}
  ];
  /* Kullanıcı renk tercihleri */
  function _getCats(){
    const prefs=DS.get('task_cat_colors')||{};
    return DEFAULT_CATS.map(cat=>{
      const col=prefs[cat.id]||cat.color;
      return{...cat,color:col,bg:col+'10',border:col+'30'};
    });
  }
  function _saveCatColor(catId,color){const prefs=DS.get('task_cat_colors')||{};prefs[catId]=color;DS.set('task_cat_colors',prefs)}
  let TASK_CATS=_getCats();
  let activeFilter='daily';

  c.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px">
      <div><h2 style="font-family:var(--fh);font-size:clamp(22px,3vw,28px);font-weight:800">✅ Görevler</h2><p style="font-size:14px;color:var(--txt2)">${today}</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="tier-btn-up" style="width:auto;padding:10px 20px" id="taskAddOpenBtn">➕ Görev Ekle</button>
        <button class="filter-btn" id="taskAIBtn">🧠 Bilge ile öner</button>
      </div>
    </div>
    <div id="taskStats" style="margin-bottom:16px"></div>
    <div style="display:flex;gap:8px;margin-bottom:12px;align-items:center;flex-wrap:wrap">
      <div class="tasks-tabs"><button class="feed-tab active" data-tf="daily">Günlük</button><button class="feed-tab" data-tf="weekly">Haftalık</button><button class="feed-tab" data-tf="monthly">Aylık</button></div>
      <div id="taskProgress" style="flex:1;min-width:120px"></div>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:16px;align-items:center" id="taskColorFilters">
      <button class="tcf-dot active" data-cf="all" style="width:28px;height:28px;border-radius:50%;border:2px solid var(--acc);background:linear-gradient(135deg,#007AFF,#FF3B30,#34C759,#5856D6);cursor:pointer;transition:all .15s" title="Tümü"></button>
    </div>
    <div id="taskSections"></div>
    <div id="taskAIResult" style="margin-top:16px"></div>`;

  let activeColorFilter='all';

  function render(){
    TASK_CATS=_getCats();
    const filtered=tasks.filter(t=>t.type===activeFilter);
    const done=filtered.filter(t=>t.done).length,total=filtered.length;
    const pct=total?Math.round(done/total*100):0;

    /* Renk filtre dot'ları */
    const cf=$('#taskColorFilters');
    const usedCats=TASK_CATS.filter(cat=>filtered.some(t=>t.cat===cat.id));
    cf.innerHTML=`<button class="tcf-dot ${activeColorFilter==='all'?'active':''}" data-cf="all" style="width:28px;height:28px;border-radius:50%;border:2px solid ${activeColorFilter==='all'?'var(--txt)':'var(--border)'};background:linear-gradient(135deg,#007AFF,#FF3B30,#34C759);cursor:pointer;transition:all .15s;flex-shrink:0" title="Tümü"></button>${usedCats.map(cat=>{
      const count=filtered.filter(t=>t.cat===cat.id).length;
      return`<button class="tcf-dot ${activeColorFilter===cat.id?'active':''}" data-cf="${cat.id}" style="width:28px;height:28px;border-radius:50%;border:2px solid ${activeColorFilter===cat.id?'var(--txt)':'transparent'};background:${cat.color};cursor:pointer;transition:all .15s;flex-shrink:0;position:relative" title="${cat.label}"><span style="position:absolute;top:-6px;right:-6px;font-size:9px;background:var(--txt);color:var(--bg);border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-weight:700">${count}</span></button>`}).join('')}`;
    cf.querySelectorAll('.tcf-dot').forEach(d=>d.addEventListener('click',()=>{activeColorFilter=d.dataset.cf;render()}));

    /* İstatistik kartları */
    $('#taskStats').innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px">${TASK_CATS.map(cat=>{
      const catTasks=filtered.filter(t=>t.cat===cat.id);
      const catDone=catTasks.filter(t=>t.done).length;
      const catTotal=catTasks.length;
      const isActive=activeColorFilter===cat.id;
      return`<div style="background:${cat.bg};border:1.5px solid ${isActive?cat.color:cat.border};border-radius:12px;padding:10px 12px;text-align:center;cursor:pointer;transition:all .15s;${isActive?'transform:scale(1.05);box-shadow:0 2px 8px '+cat.color+'40':''}" data-statcat="${cat.id}"><div style="font-size:18px;font-weight:800;color:${cat.color}">${catDone}/${catTotal}</div><div style="font-size:11px;color:var(--txt2);margin-top:2px">${cat.label}</div></div>`}).join('')}</div>`;
    $('#taskStats').querySelectorAll('[data-statcat]').forEach(s=>s.addEventListener('click',()=>{activeColorFilter=activeColorFilter===s.dataset.statcat?'all':s.dataset.statcat;render()}));

    /* Progress */
    $('#taskProgress').innerHTML=total?`<div style="display:flex;align-items:center;gap:10px"><div style="flex:1;height:6px;background:var(--bg2);border-radius:3px;overflow:hidden"><div style="height:100%;background:var(--acc);border-radius:3px;width:${pct}%;transition:width .3s var(--ease)"></div></div><span style="font-size:12px;color:var(--txt3);white-space:nowrap">${done}/${total}</span></div>`:'';

    /* Filtrelenmiş görevler */
    const visibleTasks=activeColorFilter==='all'?filtered:filtered.filter(t=>t.cat===activeColorFilter);
    const sections=$('#taskSections');
    if(!visibleTasks.length){sections.innerHTML='<p style="text-align:center;color:var(--txt3);padding:40px">Görev yok.</p>';return}

    /* Renklere göre grupla */
    const catsToShow=activeColorFilter==='all'?TASK_CATS.filter(cat=>visibleTasks.some(t=>t.cat===cat.id)):[TASK_CATS.find(cat=>cat.id===activeColorFilter)].filter(Boolean);

    sections.innerHTML=catsToShow.map(cat=>{
      const catTasks=visibleTasks.filter(t=>t.cat===cat.id);
      const catDone=catTasks.filter(t=>t.done).length;
      return`<div style="background:${cat.bg};border:1.5px solid ${cat.border};border-left:4px solid ${cat.color};border-radius:var(--r);padding:16px;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><span style="width:10px;height:10px;border-radius:50%;background:${cat.color};flex-shrink:0"></span><span style="font-size:14px;font-weight:700;color:${cat.color}">${cat.label}</span><span style="font-size:12px;color:var(--txt3);margin-left:auto">${catDone}/${catTasks.length}</span></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">${catTasks.map(t=>`
          <div class="tcard ${t.done?'tcard-done':''}" style="--tcard-color:${cat.color}">
            <div class="tcard-top">
              <button class="task-check ${t.done?'checked':''}" data-check="${t.id}" style="--check-color:${cat.color}">${t.done?'✓':''}</button>
              <button class="task-del" data-del="${t.id}">✕</button>
            </div>
            <div class="tcard-text">${t.text}</div>
          </div>`).join('')}
        </div>
      </div>`}).join('');

    sections.querySelectorAll('[data-check]').forEach(b=>b.addEventListener('click',(e)=>{e.stopPropagation();const t=tasks.find(x=>x.id===b.dataset.check);if(t){t.done=!t.done;DS.set('tasks',tasks);render();_autoUpdateGoals()}}));
    sections.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',(e)=>{e.stopPropagation();tasks=tasks.filter(x=>x.id!==b.dataset.del);DS.set('tasks',tasks);render()}));
  }

  c.querySelectorAll('.feed-tab').forEach(t=>t.addEventListener('click',()=>{c.querySelectorAll('.feed-tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');activeFilter=t.dataset.tf;render()}));

  /* Add popup with color picker */
  $('#taskAddOpenBtn').addEventListener('click',()=>{
    TASK_CATS=_getCats();
    let pop=$('#taskAddPopup');
    if(!pop){pop=document.createElement('div');pop.id='taskAddPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
    pop.innerHTML=`<div class="popup-card" style="max-width:460px"><div class="popup-hdr"><h2>➕ Görev Ekle</h2><button class="popup-close" onclick="$('#taskAddPopup').classList.remove('vis')">✕</button></div><div class="popup-body">
      <div style="display:flex;flex-direction:column;gap:16px">
        <div><label class="sp-label">Görev</label><input class="task-input" id="tapInput" placeholder="Ne yapacaksın?" maxlength="120" style="width:100%"></div>
        <div><label class="sp-label">Kategori</label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px" id="tapCatGrid">${TASK_CATS.map(cat=>`<button class="tap-cat-btn" data-tapcat="${cat.id}" style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:12px;border:1.5px solid var(--border);font-size:13px;font-weight:500;background:var(--white);transition:all .15s;cursor:pointer;position:relative"><span style="width:12px;height:12px;border-radius:50%;background:${cat.color};flex-shrink:0"></span>${cat.label}<span class="tap-color-edit" data-coloredit="${cat.id}" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:10px;color:var(--txt3);cursor:pointer;padding:4px" title="Renk değiştir">🎨</span></button>`).join('')}</div>
        </div>
        <div id="tapColorPicker" style="display:none">
          <label class="sp-label">Renk Seç</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px" id="tapColorGrid">${COLOR_PALETTE.map(col=>`<button class="tap-color-dot" data-pickcolor="${col}" style="width:32px;height:32px;border-radius:50%;background:${col};border:2px solid transparent;cursor:pointer;transition:all .15s"></button>`).join('')}</div>
        </div>
        <div><label class="sp-label">Tür</label><div class="tasks-tabs" style="margin:0"><button class="feed-tab active" data-tapt="daily">Günlük</button><button class="feed-tab" data-tapt="weekly">Haftalık</button><button class="feed-tab" data-tapt="monthly">Aylık</button></div></div>
        <button class="tier-btn-up" id="tapSaveBtn">Ekle</button>
      </div>
    </div></div>`;
    pop.classList.add('vis');
    let selCat='ders',selType=activeFilter,colorEditCat=null;

    /* Kategori seçimi */
    pop.querySelectorAll('.tap-cat-btn').forEach(b=>{
      if(b.dataset.tapcat==='ders'){b.style.borderColor=TASK_CATS[0].color;b.style.background=TASK_CATS[0].bg}
      b.addEventListener('click',(e)=>{
        if(e.target.classList.contains('tap-color-edit'))return;
        pop.querySelectorAll('.tap-cat-btn').forEach(x=>{x.style.borderColor='var(--border)';x.style.background='var(--white)'});
        const cat=TASK_CATS.find(c=>c.id===b.dataset.tapcat);
        b.style.borderColor=cat.color;b.style.background=cat.bg;selCat=b.dataset.tapcat;
      });
    });

    /* Renk değiştir butonları */
    pop.querySelectorAll('.tap-color-edit').forEach(e=>e.addEventListener('click',(ev)=>{
      ev.stopPropagation();
      colorEditCat=e.dataset.coloredit;
      const picker=$('#tapColorPicker');
      picker.style.display='block';
      /* Mevcut rengi işaretle */
      const currentCat=TASK_CATS.find(c=>c.id===colorEditCat);
      pop.querySelectorAll('.tap-color-dot').forEach(d=>{d.style.borderColor=d.dataset.pickcolor===currentCat?.color?'var(--txt)':'transparent';d.style.transform=d.dataset.pickcolor===currentCat?.color?'scale(1.2)':'scale(1)'});
    }));

    /* Renk seçimi */
    pop.querySelectorAll('.tap-color-dot').forEach(d=>d.addEventListener('click',()=>{
      if(!colorEditCat)return;
      _saveCatColor(colorEditCat,d.dataset.pickcolor);
      TASK_CATS=_getCats();
      /* Kategori butonundaki rengi güncelle */
      const btn=pop.querySelector(`[data-tapcat="${colorEditCat}"]`);
      if(btn){const cat=TASK_CATS.find(c=>c.id===colorEditCat);btn.querySelector('span').style.background=cat.color;if(selCat===colorEditCat){btn.style.borderColor=cat.color;btn.style.background=cat.bg}}
      /* Dot highlight */
      pop.querySelectorAll('.tap-color-dot').forEach(x=>{x.style.borderColor='transparent';x.style.transform='scale(1)'});
      d.style.borderColor='var(--txt)';d.style.transform='scale(1.2)';
      $('#tapColorPicker').style.display='none';
      showToast('Renk değiştirildi');
    }));

    pop.querySelectorAll('[data-tapt]').forEach(b=>b.addEventListener('click',()=>{pop.querySelectorAll('[data-tapt]').forEach(x=>x.classList.remove('active'));b.classList.add('active');selType=b.dataset.tapt}));
    $('#tapSaveBtn').addEventListener('click',()=>{const v=$('#tapInput').value.trim();if(!v){showToast('Görev yazmalısın');return}tasks.push({id:'t'+Date.now(),text:v,done:false,type:selType,cat:selCat});DS.set('tasks',tasks);pop.classList.remove('vis');render();showToast('Görev eklendi!')});
    $('#tapInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('#tapSaveBtn').click()});
    setTimeout(()=>$('#tapInput')?.focus(),100);
  });

  /* AI */
  $('#taskAIBtn').addEventListener('click',async()=>{
    const u=DS.get('user')||{};const mem=DS.get('bilge_memory')||{};
    const prompt=`Öğrenci: ${u.name||'Öğrenci'}, ${EDU[u.level]?.label||''}, ${u.classOrDetail||''}. ${mem.weakSubjects?'Zayıf: '+mem.weakSubjects:''}. Bugün için 6 görev öner. Her satır: KATEGORİ|GÖREV. Kategoriler: ders, soru, deneme, tekrar, odev. Kısa net.`;
    const result=await askBilgeForTool(prompt,$('#taskAIResult'));
    if(result){
      const lines=result.split('\n').filter(l=>l.trim().length>3);
      $('#taskAIResult').innerHTML=`<div style="background:var(--acc-l);border:1px solid var(--acc);border-radius:var(--r);padding:16px"><div style="font-weight:600;margin-bottom:8px">🧠 Öneriler:</div>${lines.map(l=>`<div style="padding:6px 0;font-size:14px">${l.trim()}</div>`).join('')}<button class="tier-btn-up" style="margin-top:10px" id="taskAIAddAll">Hepsini Ekle</button></div>`;
      $('#taskAIAddAll')?.addEventListener('click',()=>{
        lines.forEach(l=>{const c=l.trim().replace(/^[\-\*•\d\.]+\s*/,'');const m=c.match(/^(ders|soru|deneme|tekrar|odev|diger)\s*[|:—]\s*(.+)/i);
          tasks.push({id:'t'+Date.now()+Math.random(),text:m?m[2].trim():c,done:false,type:'daily',cat:m?m[1].toLowerCase():'diger'})});
        DS.set('tasks',tasks);render();$('#taskAIResult').innerHTML='';showToast('Eklendi!')});
    }
  });
  render();
}
function _seedTasks(){const t=[
  {id:'t1',text:'Türev konusunu tekrarla',done:false,type:'daily',cat:'ders'},
  {id:'t2',text:'Newton soruları çöz (20 soru)',done:true,type:'daily',cat:'soru'},
  {id:'t3',text:'Şiir türlerini oku',done:false,type:'daily',cat:'ders'},
  {id:'t4',text:'TYT deneme sınavı çöz',done:false,type:'daily',cat:'deneme'},
  {id:'t5',text:'Formül kartları yap',done:false,type:'daily',cat:'tekrar'},
  {id:'t6',text:'Haftalık deneme çöz',done:false,type:'weekly',cat:'deneme'},
  {id:'t7',text:'Zayıf konuları listele',done:false,type:'weekly',cat:'tekrar'},
  {id:'t8',text:'Fizik ödevini teslim et',done:true,type:'weekly',cat:'odev'},
  {id:'t9',text:'Not defterini düzenle',done:true,type:'weekly',cat:'diger'}
];DS.set('tasks',t);return t}

/* ═══ BUGÜN NE ÇALIŞAYIM ═══ */
function renderStudy(){
  const c=$('#page-study');if(!c)return;
  let allPlans=DS.get('all_study_plans')||[];
  const _fmtDate=d=>new Date(d).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'});

  c.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px">
      <div><h2 style="font-family:var(--fh);font-size:clamp(22px,3vw,28px);font-weight:800">🧭 Bugün Ne Çalışayım?</h2><p style="font-size:14px;color:var(--txt2)">Planlarını oluştur, takip et</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="filter-btn" id="studyManualBtn">➕ Manuel Plan</button>
        <button class="tier-btn-up" style="width:auto;padding:10px 16px" id="studyAIBtn">🧠 AI ile Oluştur</button>
        <button class="filter-btn" id="studyHelpBtn" style="color:var(--acc);border-color:var(--acc)">🤔 Ne çalışacağımı bilmiyorum</button>
      </div>
    </div>
    <div class="tasks-tabs" style="margin-bottom:20px"><button class="feed-tab active" data-sp="daily">Günlük</button><button class="feed-tab" data-sp="weekly">Haftalık</button><button class="feed-tab" data-sp="monthly">Aylık</button></div>
    <div id="studyPlanList"></div>`;

  let activeType='daily';

  let _openGroups=new Set(); /* Hangi gruplar açık */

  function render(){
    const filtered=allPlans.filter(p=>p.type===activeType);
    const list=$('#studyPlanList');
    if(!filtered.length){list.innerHTML='<p style="text-align:center;color:var(--txt3);padding:40px 0">Henüz plan yok. Yukarıdan oluştur!</p>';return}

    const groups=[];const seen=new Set();
    filtered.forEach(p=>{
      if(p.groupId&&!seen.has(p.groupId)){
        seen.add(p.groupId);
        groups.push({type:'ai',groupId:p.groupId,date:p.createdDate,items:filtered.filter(x=>x.groupId===p.groupId)});
      }else if(!p.groupId){
        groups.push({type:'manual',items:[p],date:p.createdDate});
      }
    });
    groups.sort((a,b)=>(b.items[0]?.ts||0)-(a.items[0]?.ts||0));

    list.innerHTML=groups.map(g=>{
      if(g.type==='ai'){
        const done=g.items.filter(p=>p.done).length;
        const total=g.items.length;
        const isOpen=_openGroups.has(g.groupId);
        return`<div class="study-ai-group" data-gid="${g.groupId}">
          <div class="sag-header" data-toggle="${g.groupId}">
            <div class="sag-left"><span>🧠</span><b>${g.date||''}</b><span class="sag-count">${done}/${total} tamamlandı</span></div>
            <span class="sag-arrow">${isOpen?'▲':'▼'}</span>
          </div>
          <div class="sag-body" style="display:${isOpen?'block':'none'}">${g.items.map(p=>`
            <div class="sag-item ${p.done?'done':''}">
              <button class="task-check ${p.done?'checked':''}" data-spdone="${p.id}">${p.done?'✓':''}</button>
              <div class="sag-item-content">
                <span class="${p.done?'line-through':''}">${p.subject||''}</span>
                ${p.day?`<span class="sag-day">📅 ${p.day}</span>`:''}
              </div>
              <button class="task-del" data-spdel="${p.id}">✕</button>
            </div>`).join('')}
            <button class="sag-del-all" data-sgdel="${g.groupId}">🗑 Tüm grubu sil</button>
          </div>
        </div>`;
      }else{
        const p=g.items[0];
        return`<div class="study-plan-card ${p.done?'done':''}">
          <div class="spc-left">
            <button class="task-check ${p.done?'checked':''}" data-spdone="${p.id}">${p.done?'✓':''}</button>
            <div class="spc-content">
              ${p.time?`<span class="spc-time">${p.time}</span>`:''}
              <span class="spc-subject">${p.subject||''}</span>
              ${p.duration?`<span class="spc-dur">⏱ ${p.duration}</span>`:''}
              ${p.tip?`<span class="spc-tip">💡 ${p.tip}</span>`:''}
              ${p.day?`<span class="spc-day">📅 ${p.day}</span>`:''}
            </div>
          </div>
          <div class="spc-right">
            <span class="spc-date">${p.createdDate||''}</span>
            <button class="task-del" data-spdel="${p.id}">✕</button>
          </div>
        </div>`;
      }
    }).join('');

    /* Toggle grup aç/kapa */
    list.querySelectorAll('[data-toggle]').forEach(h=>h.addEventListener('click',()=>{
      const gid=h.dataset.toggle;
      if(_openGroups.has(gid))_openGroups.delete(gid);else _openGroups.add(gid);
      const body=h.nextElementSibling;
      body.style.display=_openGroups.has(gid)?'block':'none';
      h.querySelector('.sag-arrow').textContent=_openGroups.has(gid)?'▲':'▼';
    }));
    /* Done toggle — e.stopPropagation ile üst elementi tetikleme */
    list.querySelectorAll('[data-spdone]').forEach(b=>b.addEventListener('click',(e)=>{
      e.stopPropagation();
      const p=allPlans.find(x=>x.id===b.dataset.spdone);
      if(p){p.done=!p.done;DS.set('all_study_plans',allPlans);render();_autoUpdateGoals()}
    }));
    /* Delete single */
    list.querySelectorAll('[data-spdel]').forEach(b=>b.addEventListener('click',(e)=>{
      e.stopPropagation();
      allPlans=allPlans.filter(x=>x.id!==b.dataset.spdel);DS.set('all_study_plans',allPlans);render();
    }));
    /* Delete group */
    list.querySelectorAll('[data-sgdel]').forEach(b=>b.addEventListener('click',(e)=>{
      e.stopPropagation();
      const gid=b.dataset.sgdel;_openGroups.delete(gid);
      allPlans=allPlans.filter(x=>x.groupId!==gid);DS.set('all_study_plans',allPlans);render();
    }));
  }

  /* Tab switch */
  c.querySelectorAll('[data-sp]').forEach(t=>t.addEventListener('click',()=>{
    c.querySelectorAll('.feed-tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');
    activeType=t.dataset.sp;render();
  }));

  /* Manuel plan ekleme */
  $('#studyManualBtn').addEventListener('click',_openManualPlanPopup);
  /* AI plan */
  $('#studyAIBtn').addEventListener('click',_openStudyAIPopup);
  /* Ne çalışacağımı bilmiyorum */
  $('#studyHelpBtn').addEventListener('click',_openStudyHelpWizard);

  render();
}

/* ─── MANUEL PLAN POPUP ─── */
function _openManualPlanPopup(){
  let pop=$('#manualPlanPopup');
  if(!pop){pop=document.createElement('div');pop.id='manualPlanPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
  pop.innerHTML=`<div class="popup-card" style="max-width:480px"><div class="popup-hdr"><h2>➕ Plan Ekle</h2><button class="popup-close" onclick="$('#manualPlanPopup').classList.remove('vis')">✕</button></div><div class="popup-body">
    <div style="display:flex;flex-direction:column;gap:14px">
      <div><label class="sp-label">Plan Türü</label><select class="s-select" id="mpType" style="width:100%"><option value="daily">Günlük</option><option value="weekly">Haftalık</option><option value="monthly">Aylık</option></select></div>
      <div><label class="sp-label">Ders / Konu</label><input class="task-input" id="mpSubject" placeholder="ör: Matematik — Türev" style="width:100%"></div>
      <div style="display:flex;gap:10px">
        <div style="flex:1"><label class="sp-label">Başlangıç Saati</label><input type="time" class="task-input" id="mpTime" style="width:100%"></div>
        <div style="flex:1"><label class="sp-label">Süre</label><select class="s-select" id="mpDur" style="width:100%"><option value="">Seçiniz</option><option value="30 dk">30 dk</option><option value="45 dk">45 dk</option><option value="1 saat">1 saat</option><option value="1.5 saat">1.5 saat</option><option value="2 saat">2 saat</option><option value="3 saat">3 saat</option></select></div>
      </div>
      <div><label class="sp-label">Tarih</label><input type="date" class="task-input" id="mpDate" style="width:100%"></div>
      <div><label class="sp-label">Not (opsiyonel)</label><input class="task-input" id="mpTip" placeholder="ör: 10 soru çöz" style="width:100%"></div>
      <button class="tier-btn-up" id="mpSaveBtn">Kaydet</button>
    </div></div></div>`;
  /* Bugünün tarihini default yap */
  const today=new Date().toISOString().slice(0,10);
  $('#mpDate').value=today;
  pop.classList.add('vis');
  $('#mpSaveBtn').addEventListener('click',()=>{
    const subj=$('#mpSubject').value.trim();if(!subj){showToast('Ders/konu zorunlu');return}
    const dateVal=$('#mpDate').value;
    const dateStr=dateVal?new Date(dateVal+'T00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'}):new Date().toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'});
    const plans=DS.get('all_study_plans')||[];
    plans.push({id:'sp'+Date.now(),type:$('#mpType').value,subject:subj,time:$('#mpTime').value||'',duration:$('#mpDur').value||'',tip:$('#mpTip').value.trim(),done:false,aiGenerated:false,createdDate:dateStr});
    DS.set('all_study_plans',plans);pop.classList.remove('vis');renderStudy();showToast('Plan eklendi!');
  });
}

/* ─── AI PLAN POPUP (detaylı, dinamik alanlar) ─── */
function _openStudyAIPopup(){
  let pop=$('#studyAIPopup');
  if(!pop){pop=document.createElement('div');pop.id='studyAIPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}

  pop.innerHTML=`<div class="popup-card" style="max-width:620px"><div class="popup-hdr"><h2>🧠 AI ile Plan Oluştur</h2><button class="popup-close" onclick="$('#studyAIPopup').classList.remove('vis')">✕</button></div><div class="popup-body">
  <p style="font-size:13px;color:var(--txt3);margin-bottom:16px">⚡ 1 kredi · Detay verdikçe kalite artar</p>
  <div style="display:flex;flex-direction:column;gap:14px">
    <div><label class="sp-label">Plan türü</label><select class="s-select" id="aiPlanType" style="width:100%"><option value="daily">Günlük</option><option value="weekly">Haftalık</option><option value="monthly">Aylık</option></select></div>
    <div><label class="sp-label">Dersler</label><input class="task-input" id="aiPlanSubjects" placeholder="ör: Matematik, Fizik, Türkçe" style="width:100%"></div>
    <div style="display:flex;gap:10px"><div style="flex:1"><label class="sp-label">Günde kaç saat?</label><input class="task-input" id="aiPlanHours" type="number" min="1" max="16" value="4" style="width:100%"></div><div style="flex:1"><label class="sp-label">Başlangıç tarihi</label><input type="date" class="task-input" id="aiPlanDate" style="width:100%"></div></div>
    <div id="aiExtraFields"></div>
    <div><label class="sp-label">Özel not</label><textarea class="task-input" id="aiPlanNote" placeholder="ör: Cumartesi boşum, Türev'de çok zorlanıyorum..." style="width:100%;min-height:56px;resize:vertical;border-radius:var(--r);padding:12px 16px"></textarea></div>
    <button class="tier-btn-up" id="aiPlanGenBtn">🧠 Oluştur</button>
  </div>
  <div id="aiPlanResult" style="margin-top:16px"></div>
  </div></div>`;
  $('#aiPlanDate').value=new Date().toISOString().slice(0,10);
  _aiUpdateExtra();$('#aiPlanType').addEventListener('change',_aiUpdateExtra);
  pop.classList.add('vis');

  $('#aiPlanGenBtn').addEventListener('click',async()=>{
    const type=$('#aiPlanType').value,subj=$('#aiPlanSubjects').value,hours=$('#aiPlanHours').value,note=$('#aiPlanNote').value;
    const u=DS.get('user')||{};const mem=DS.get('bilge_memory')||{};
    const dateVal=$('#aiPlanDate').value;
    const startDay=dateVal?new Date(dateVal+'T00:00').toLocaleDateString('tr-TR',{weekday:'long'}):'';
    const dateStr=dateVal?new Date(dateVal+'T00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'}):new Date().toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'});
    let extra='';
    if(type==='daily'){extra=`Saatler: ${$('#aiStartTime')?.value||'09:00'} - ${$('#aiEndTime')?.value||'17:00'}.`}
    else if(type==='weekly'){const days=Array.from($$('#aiDayPicker .ai-day-btn.sel')).map(b=>b.dataset.day);extra=`Günler: ${days.join(', ')}. Saat: ${$('#aiStartTime')?.value||'09:00'}. Zorluk: ${$('#aiDifficulty')?.value||'normal'}.`}
    else{extra=`Hedef: ${$('#aiMonthGoal')?.value||'Genel'}. Haftada ${$('#aiWeekDays')?.value||'5'} gün. Zorluk: ${$('#aiDifficulty')?.value||'normal'}.`}
    const ctx=`Öğrenci: ${u.name||''}, ${EDU[u.level]?.label||''}, ${u.classOrDetail||''}. ${mem.weakSubjects?'Zayıf: '+mem.weakSubjects:''}. Dersler: ${subj||'Genel'}. Günde ${hours} saat. ${extra} ${note?'Not: '+note:''}`;
    const inst=type==='daily'?`Bugün (${startDay}) için detaylı saatli plan. Her satır: SAAT — DERS — Konu (süre). Araya mola ekle.`:type==='weekly'?`7 günlük detaylı plan. Her gün: GÜN: SAAT — DERS — Konu (süre). Çalışılmayacak gün varsa DİNLENME yaz. Her gün 2-3 farklı ders.`:`4 haftalık detaylı plan. Her hafta: Hafta X: Gün sayısı — Dersler — Konular — Hedefler (haftalık saat). Son hafta tekrar/deneme.`;
    const prompt=`3 farklı çalışma planı öner. Planları --- ile ayır.\n${ctx}\n${inst}\nHer planda ${type==='daily'?'5-8':type==='weekly'?'14-21':'12-16'} madde. Başlık/açıklama/yıldız YAZMA. Sadece madde yaz. Türkçe.`;
    const result=await askBilgeForTool(prompt,$('#aiPlanResult'));
    if(result){
      const plans3=result.split(/---+/).map(s=>s.trim()).filter(s=>s.length>10);
      const suggestions=plans3.length>=2?plans3.slice(0,3):[result];
      $('#aiPlanResult').innerHTML=`<p style="font-size:13px;color:var(--txt2);margin-bottom:12px">${suggestions.length} öneri — birini seç:</p>${suggestions.map((sg,idx)=>{
        const lines=sg.split('\n').filter(l=>{const t=l.trim();return t.length>3&&!t.startsWith('**')&&!t.startsWith('#')});
        return`<div style="background:var(--white);border:1.5px solid ${idx===0?'var(--acc)':'var(--border)'};border-radius:var(--r);overflow:hidden;margin-bottom:10px"><div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;cursor:pointer;background:${idx===0?'var(--acc-l)':'var(--bg)'}" onclick="const b=this.nextElementSibling;b.style.display=b.style.display==='none'?'block':'none'"><div style="display:flex;align-items:center;gap:8px"><span>${['⭐','📋','🔄'][idx]}</span><b>Öneri ${idx+1}</b><span style="font-size:12px;color:var(--txt3)">${lines.length} madde</span></div><span style="font-size:12px;color:var(--txt3)">▼</span></div><div style="display:${idx===0?'block':'none'};padding:4px 16px 12px;max-height:300px;overflow-y:auto">${lines.map(l=>`<div style="padding:7px 0;font-size:13px;border-bottom:1px solid var(--border);display:flex;gap:6px"><span style="color:var(--acc);flex-shrink:0">•</span><span>${l.trim().replace(/^[\-\*•\d\.]+\s*/,'')}</span></div>`).join('')}<button class="tier-btn-up" style="margin-top:12px" data-aisave="${idx}">Bu Planı Kaydet</button></div></div>`}).join('')}`;
      $('#aiPlanResult').querySelectorAll('[data-aisave]').forEach(btn=>btn.addEventListener('click',()=>{
        const sg=suggestions[parseInt(btn.dataset.aisave)]||suggestions[0];
        const lines=sg.split('\n').filter(l=>l.trim().length>3&&!l.trim().startsWith('**'));
        const plans=DS.get('all_study_plans')||[];const gid='g'+Date.now();const ts=Date.now();
        lines.forEach(l=>{const c=l.trim().replace(/^[\-\*•\d\.]+\s*/,'');const dm=c.match(/^(Pazartesi|Salı|Çarşamba|Perşembe|Cuma|Cumartesi|Pazar|Hafta\s*\d+)[:\s—\-]+(.+)/i);const tm=c.match(/^(\d{1,2}[:.]\d{2})\s*[-—]\s*(.+)/);
          plans.push({id:'sp'+Date.now()+Math.random(),type,subject:dm?dm[2].trim():tm?tm[2].trim():c,day:dm?dm[1]:'',time:tm?tm[1]:'',done:false,aiGenerated:true,groupId:gid,ts,createdDate:dateStr})});
        DS.set('all_study_plans',plans);pop.classList.remove('vis');renderStudy();showToast('Plan kaydedildi!');
      }));
    }
  });
}
function _aiUpdateExtra(){
  const type=$('#aiPlanType').value;const ef=$('#aiExtraFields');if(!ef)return;
  if(type==='daily'){ef.innerHTML=`<div style="display:flex;gap:10px"><div style="flex:1"><label class="sp-label">Başlangıç</label><input type="time" class="task-input" id="aiStartTime" value="09:00" style="width:100%"></div><div style="flex:1"><label class="sp-label">Bitiş</label><input type="time" class="task-input" id="aiEndTime" value="17:00" style="width:100%"></div></div>`}
  else if(type==='weekly'){ef.innerHTML=`<div><label class="sp-label">Çalışılacak günler</label><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px" id="aiDayPicker">${['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map((d,i)=>`<button type="button" class="wizard-opt ai-day-btn sel" data-day="${['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'][i]}" style="padding:8px 12px;font-size:12px">${d}</button>`).join('')}</div></div><div style="display:flex;gap:10px;margin-top:10px"><div style="flex:1"><label class="sp-label">Başlangıç saati</label><input type="time" class="task-input" id="aiStartTime" value="09:00" style="width:100%"></div><div style="flex:1"><label class="sp-label">Zorluk</label><select class="s-select" id="aiDifficulty" style="width:100%"><option value="normal">Normal</option><option value="yoğun">Yoğun</option><option value="hafif">Hafif</option></select></div></div>`;$$('#aiDayPicker .ai-day-btn').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();b.classList.toggle('sel')}))}
  else{ef.innerHTML=`<div><label class="sp-label">Aylık hedef</label><input class="task-input" id="aiMonthGoal" placeholder="ör: TYT'de 80 net, Fizik bitirmek" style="width:100%"></div><div style="display:flex;gap:10px;margin-top:10px"><div style="flex:1"><label class="sp-label">Haftalık gün</label><select class="s-select" id="aiWeekDays" style="width:100%"><option value="5">5 gün</option><option value="6">6 gün</option><option value="7">7 gün</option><option value="4">4 gün</option></select></div><div style="flex:1"><label class="sp-label">Zorluk</label><select class="s-select" id="aiDifficulty" style="width:100%"><option value="normal">Normal</option><option value="yoğun">Yoğun (sınav yakın)</option><option value="hafif">Hafif</option></select></div></div>`}
}

/* ─── NE ÇALIŞACAĞIMI BİLMİYORUM — Tam kişiselleştirilmiş ─── */
let _wizardStep=0;let _wizardAnswers={};
function _openStudyHelpWizard(){
  _wizardStep=0;_wizardAnswers={};
  let pop=$('#studyHelpPopup');
  if(!pop){pop=document.createElement('div');pop.id='studyHelpPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
  pop.classList.add('vis');
  _renderWizardStep(pop);
}

function _getWizardSteps(){
  const u=DS.get('user')||{};const lv=u.level||'lise';const cls=u.classOrDetail||'';
  let steps=[];

  /* ADIM 1: Ruh hali (herkes için aynı) */
  steps.push({q:'Bugün kendini nasıl hissediyorsun?',emoji:'🌟',opts:['💪 Enerjik ve motive','😊 Normal, idare eder','😴 Yorgun ama çalışmalıyım','😔 Motivasyonum düşük']});

  /* ADIM 2: Zaman (herkes için aynı) */
  steps.push({q:'Bugün ne kadar zamanın var?',emoji:'⏰',opts:['1-2 saat','3-4 saat','5-6 saat','Tüm gün boşum']});

  /* ADIM 3: Ders seçimi — seviyeye ve sınıfa göre tamamen farklı */
  if(lv==='ortaokul'){
    if(cls.includes('5')||cls.includes('6')){
      steps.push({q:'Hangi dersi çalışmak istersin?',emoji:'📚',opts:['Matematik','Türkçe','Fen Bilimleri','Sosyal Bilgiler','İngilizce','Hepsinden karışık']});
    }else if(cls.includes('7')){
      steps.push({q:'Hangi dersi çalışmak istersin?',emoji:'📚',opts:['Matematik','Türkçe','Fen Bilimleri','Sosyal Bilgiler','İngilizce','Din Kültürü','Hepsinden karışık']});
    }else{/* 8. sınıf = LGS */
      steps.push({q:'LGS için hangi dersi çalışacaksın?',emoji:'📚',opts:['Matematik (LGS)','Türkçe (LGS)','Fen Bilimleri (LGS)','T.C. İnkılap Tarihi','Din Kültürü','İngilizce','Tam deneme çözeceğim']});
    }
  }else if(lv==='lise'){
    if(cls.includes('9')||cls.includes('10')){
      steps.push({q:'Hangi dersi çalışmak istersin?',emoji:'📚',opts:['Matematik','Fizik','Kimya','Biyoloji','Türk Dili ve Edebiyatı','Tarih','Coğrafya','İngilizce','Karışık']});
    }else{/* 11-12 = YKS */
      steps.push({q:'YKS için hangi alanda çalışacaksın?',emoji:'📚',opts:['TYT Matematik','TYT Türkçe','TYT Fen','TYT Sosyal','AYT Matematik','AYT Fizik','AYT Kimya','AYT Biyoloji','AYT Edebiyat-Sosyal','Tam TYT Denemesi','Tam AYT Denemesi']});
    }
  }else if(lv==='universite'){
    steps.push({q:'Ne üzerinde çalışacaksın?',emoji:'📚',opts:['Bölüm dersleri','ALES hazırlık','YÖKDİL hazırlık','Staj/proje','Tez/ödev','Genel tekrar']});
  }else{/* mezun */
    const exam=u.examChoice||u.classOrDetail||'KPSS';
    if(exam.includes('KPSS')){
      steps.push({q:'KPSS için hangi alanı çalışacaksın?',emoji:'📚',opts:['Genel Yetenek (GY)','Genel Kültür (GK)','Eğitim Bilimleri','Alan Bilgisi','GY+GK Karma','Tam deneme']});
    }else if(exam.includes('YDS')||exam.includes('YÖKDİL')){
      steps.push({q:`${exam} için ne çalışacaksın?`,emoji:'📚',opts:['Kelime (Vocabulary)','Gramer (Grammar)','Okuma (Reading)','Çeviri (Translation)','Mini deneme','Tam deneme']});
    }else if(exam.includes('ALES')){
      steps.push({q:'ALES için hangi bölümü çalışacaksın?',emoji:'📚',opts:['Sayısal — Matematik','Sayısal — Geometri','Sözel — Türkçe','Sözel — Mantık','Karma çalışma','Deneme çözeceğim']});
    }else if(exam.includes('TUS')||exam.includes('DUS')){
      steps.push({q:`${exam} için hangi alanı çalışacaksın?`,emoji:'📚',opts:['Temel Tıp Bilimleri','Klinik Tıp Bilimleri','Anatomi','Fizyoloji','Biyokimya','Deneme çözeceğim']});
    }else{
      steps.push({q:`${exam} için ne çalışacaksın?`,emoji:'📚',opts:['Ana konu tekrarı','Soru çözümü','Deneme sınavı','Zayıf konular','Genel tekrar']});
    }
  }

  /* ADIM 4: Çalışma yöntemi */
  steps.push({q:'Nasıl çalışmak istersin?',emoji:'🎯',opts:['📖 Konu anlatımı + not alma','✏️ Soru çözümü ağırlıklı','📝 Deneme/test çözmek','🔄 Tekrar + zayıf konu kapatma','🎥 Video izle + not al']});

  /* ADIM 5: Özel durum */
  const examInfo=EDU[lv];
  let specialOpts=['Yeni konuya geçeceğim','Geride kaldım, yetişmeliyim','Normal, düzenli çalışma','Motivasyona ihtiyacım var'];
  if(examInfo?.exams?.length)specialOpts.unshift(`${examInfo.exams[0].name} yaklaşıyor, son hazırlık!`);
  if(lv==='mezun'&&u.examChoice)specialOpts.unshift(`${u.examChoice} sınavına son sprint!`);
  steps.push({q:'Özel bir durumun var mı?',emoji:'💡',opts:specialOpts});

  return steps;
}

function _renderWizardStep(pop){
  const steps=_getWizardSteps();
  if(_wizardStep>=steps.length){_generateWizardPlan(pop);return}
  const s=steps[_wizardStep];const total=steps.length;
  pop.innerHTML=`<div class="popup-card" style="max-width:480px"><div class="popup-hdr"><h2>${s.emoji} ${_wizardStep+1} / ${total}</h2><button class="popup-close" onclick="$('#studyHelpPopup').classList.remove('vis')">✕</button></div><div class="popup-body">
    <div style="height:4px;background:var(--bg2);border-radius:2px;margin-bottom:20px;overflow:hidden"><div style="height:100%;background:var(--acc);border-radius:2px;width:${((_wizardStep)/total*100)}%;transition:width .3s var(--ease)"></div></div>
    <h3 style="font-family:var(--fh);font-size:18px;font-weight:800;margin-bottom:20px;text-align:center">${s.q}</h3>
    <div style="display:flex;flex-direction:column;gap:8px">${s.opts.map((o,i)=>`<button class="wizard-opt" data-wo="${i}">${o}</button>`).join('')}</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px">
      ${_wizardStep>0?`<button class="filter-btn" id="wizBack">← Geri</button>`:'<span></span>'}
      <span style="font-size:11px;color:var(--txt3)">⚡ Son adımda 1 kredi</span>
    </div>
  </div></div>`;
  pop.querySelectorAll('.wizard-opt').forEach(b=>b.addEventListener('click',()=>{_wizardAnswers[_wizardStep]=b.textContent;_wizardStep++;_renderWizardStep(pop)}));
  $('#wizBack')?.addEventListener('click',()=>{_wizardStep--;_renderWizardStep(pop)});
}

async function _generateWizardPlan(pop){
  pop.innerHTML=`<div class="popup-card" style="max-width:480px"><div class="popup-hdr"><h2>🧠 Hazırlanıyor...</h2></div><div class="popup-body"><div id="wizResult"><div class="bilge-typing" style="padding:24px;display:flex;gap:4px;justify-content:center"><div class="bilge-dot"></div><div class="bilge-dot"></div><div class="bilge-dot"></div></div><p style="text-align:center;color:var(--txt3);margin-top:8px">⚡ 1 kredi harcanacak</p></div></div></div>`;
  const u=DS.get('user')||{};const mem=DS.get('bilge_memory')||{};
  const answers=Object.values(_wizardAnswers).join('. ');
  const prompt=`3 farklı çalışma planı öner. Her planı --- ile ayır.
Öğrenci: ${u.name||''}, ${EDU[u.level]?.label||''}, ${u.classOrDetail||''}. ${mem.weakSubjects?'Zayıf: '+mem.weakSubjects:''}${mem.strongSubjects?'. Güçlü: '+mem.strongSubjects:''}
Seçimleri: ${answers}
Her planda 5 madde. Her madde: DERS — Konu (süre). Başlık/açıklama/yıldız YAZMA. Sadece maddeleri yaz. Türkçe.`;
  const result=await askBilgeForTool(prompt,$('#wizResult'));
  if(result){
    const plans3=result.split(/---+/).map(s=>s.trim()).filter(s=>s.length>10);
    const suggestions=plans3.length>=2?plans3.slice(0,3):[result];
    const dateStr=new Date().toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'});
    pop.innerHTML=`<div class="popup-card" style="max-width:500px"><div class="popup-hdr"><h2>🧠 ${suggestions.length} öneri hazır!</h2><button class="popup-close" onclick="$('#studyHelpPopup').classList.remove('vis')">✕</button></div><div class="popup-body">
      <p style="font-size:13px;color:var(--txt2);margin-bottom:12px">Sana en uygun olanı seç:</p>
      ${suggestions.map((sg,idx)=>{
        const lines=sg.split('\n').filter(l=>{const t=l.trim();return t.length>3&&!t.startsWith('**')&&!t.startsWith('#')});
        return`<div style="background:var(--white);border:1.5px solid ${idx===0?'var(--acc)':'var(--border)'};border-radius:var(--r);overflow:hidden;margin-bottom:10px">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;cursor:pointer;background:${idx===0?'var(--acc-l)':'var(--bg)'}" onclick="const b=this.nextElementSibling;b.style.display=b.style.display==='none'?'block':'none'">
            <div style="display:flex;align-items:center;gap:8px"><span>${['⭐','📋','🔄'][idx]||'📋'}</span><b>Öneri ${idx+1}</b><span style="font-size:12px;color:var(--txt3)">${lines.length} madde</span></div><span style="font-size:12px;color:var(--txt3)">▼</span>
          </div>
          <div style="display:${idx===0?'block':'none'};padding:4px 16px 12px">${lines.map(l=>`<div style="padding:8px 0;font-size:13px;border-bottom:1px solid var(--border);display:flex;gap:6px"><span style="color:var(--acc)">•</span><span>${l.trim().replace(/^[\-\*•\d\.]+\s*/,'')}</span></div>`).join('')}<button class="tier-btn-up" style="margin-top:12px" data-wizsave="${idx}">Bu Planı Kaydet</button></div>
        </div>`}).join('')}
    </div></div>`;
    pop.querySelectorAll('[data-wizsave]').forEach(btn=>btn.addEventListener('click',()=>{
      const sg=suggestions[parseInt(btn.dataset.wizsave)]||suggestions[0];
      const lines=sg.split('\n').filter(l=>l.trim().length>3&&!l.trim().startsWith('**')&&!l.trim().startsWith('#'));
      const plans=DS.get('all_study_plans')||[];const gid='g'+Date.now();const ts=Date.now();
      lines.forEach(l=>{plans.push({id:'sp'+Date.now()+Math.random(),type:'daily',subject:l.trim().replace(/^[\-\*•\d\.]+\s*/,''),done:false,aiGenerated:true,groupId:gid,ts,createdDate:dateStr})});
      DS.set('all_study_plans',plans);pop.classList.remove('vis');renderStudy();showToast('Plan kaydedildi!');
    }));
  }else{
    pop.innerHTML=`<div class="popup-card" style="max-width:480px"><div class="popup-body" style="text-align:center;padding:32px"><p style="font-size:32px;margin-bottom:12px">😔</p><p style="color:var(--txt2)">Şu an yapamadım, birazdan tekrar dene.</p><button class="tier-btn-up" style="margin-top:16px" onclick="$('#studyHelpPopup').classList.remove('vis')">Kapat</button></div></div>`;
  }
}

/* ═══ ÖDEVLER ═══ */
function renderHomework(){
  const c=$('#page-homework');if(!c)return;
  let hw=DS.get('homework')||_seedHomework();
  const u=DS.get('user')||{};const lv=u.level||'lise';
  const _subjects=lv==='ortaokul'?['Matematik','Türkçe','Fen','Sosyal','İngilizce','Diğer']:
    lv==='lise'?['Matematik','Fizik','Kimya','Biyoloji','Türkçe','Edebiyat','Tarih','Coğrafya','İngilizce','Diğer']:
    ['Genel','Bölüm Dersi','Proje','Diğer'];
  const PRIORITIES=[{id:'low',label:'Düşük',color:'#8E8E93',icon:'🟢'},{id:'medium',label:'Orta',color:'#FF9F0A',icon:'🟡'},{id:'high',label:'Yüksek',color:'#FF3B30',icon:'🔴'},{id:'urgent',label:'Acil!',color:'#AF52DE',icon:'🟣'}];
  const COLUMNS=[{id:'todo',label:'Yapılacak',icon:'📋',color:'var(--acc)'},{id:'doing',label:'Yapılıyor',icon:'⏳',color:'#FF9F0A'},{id:'done',label:'Tamamlandı',icon:'✅',color:'#34C759'}];

  /* Stats hesapla */
  const totalHw=hw.length,doneHw=hw.filter(h=>h.status==='done').length;
  const overdue=hw.filter(h=>h.status!=='done'&&h.date&&new Date(h.date)<new Date()).length;

  c.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px">
      <div><h2 style="font-family:var(--fh);font-size:clamp(22px,3vw,28px);font-weight:800">📚 Ödevler</h2><p style="font-size:14px;color:var(--txt2)">Kanban board — sürükle bırak</p></div>
      <div style="display:flex;gap:8px"><button class="tier-btn-up" style="width:auto;padding:10px 20px" id="hwAddBtn">➕ Ödev Ekle</button><button class="filter-btn" id="hwAIBtn">🧠 Yardım</button></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-bottom:16px">
      <div style="background:var(--acc-l);border-radius:12px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--acc)">${totalHw}</div><div style="font-size:11px;color:var(--txt2)">Toplam</div></div>
      <div style="background:rgba(52,199,89,.08);border-radius:12px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:#34C759">${doneHw}</div><div style="font-size:11px;color:var(--txt2)">Tamamlanan</div></div>
      <div style="background:rgba(255,159,10,.08);border-radius:12px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:#FF9F0A">${totalHw-doneHw}</div><div style="font-size:11px;color:var(--txt2)">Bekleyen</div></div>
      ${overdue?`<div style="background:rgba(255,59,48,.08);border-radius:12px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:#FF3B30">${overdue}</div><div style="font-size:11px;color:var(--txt2)">Gecikmiş!</div></div>`:''}
    </div>
    <div class="hw-kanban" id="hwKanban"></div>
    <div id="hwAIResult" style="margin-top:16px"></div>`;

  function render(){
    const kb=$('#hwKanban');
    kb.innerHTML=COLUMNS.map(col=>{
      const items=hw.filter(h=>(h.status||'todo')===col.id);
      return`<div class="hw-col" data-col="${col.id}">
        <div class="hw-col-header" style="border-bottom:3px solid ${col.color}"><span>${col.icon} ${col.label}</span><span class="hw-col-count">${items.length}</span></div>
        <div class="hw-col-body" data-drop="${col.id}">${items.map(h=>{
          const pri=PRIORITIES.find(p=>p.id===h.priority)||PRIORITIES[0];
          const days=h.date?_daysLeft(h.date):null;
          const dayLabel=days===null?'':days<0?`<span style="color:#FF3B30;font-weight:600">${Math.abs(days)} gün geçti!</span>`:days===0?'<span style="color:#FF3B30;font-weight:600">Bugün!</span>':days<=3?`<span style="color:#FF9F0A;font-weight:600">${days} gün kaldı</span>`:`<span style="color:var(--txt3)">${days} gün</span>`;
          const curStatus=h.status||'todo';
          /* Durum değiştirme butonları — mevcut durum hariç diğer 2 sütun gösterilir */
          const moveButtons=COLUMNS.filter(c=>c.id!==curStatus).map(c=>`<button class="hw-move-btn" data-hwmove="${h.id}" data-hwto="${c.id}" style="font-size:10px;padding:4px 10px;border-radius:50px;border:1px solid ${c.color};color:${c.color};background:transparent;cursor:pointer;transition:all .15s;white-space:nowrap">${c.icon} ${c.label}</button>`).join('');
          return`<div class="hw-card" draggable="true" data-hwid="${h.id}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span style="font-size:10px;padding:2px 8px;border-radius:50px;background:${pri.color}20;color:${pri.color};font-weight:600">${pri.icon} ${pri.label}</span><button class="task-del" data-hwdel="${h.id}">✕</button></div>
            <div style="font-weight:600;font-size:14px;margin-bottom:4px;line-height:1.4">${h.text}</div>
            ${h.subject?`<div style="font-size:11px;color:var(--acc);margin-bottom:4px">📚 ${h.subject}</div>`:''}
            ${h.date?`<div style="font-size:11px;margin-bottom:4px">📅 ${new Date(h.date+'T00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long'})} · ${dayLabel}</div>`:''}
            ${h.note?`<div style="font-size:12px;color:var(--txt2);margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${h.note}</div>`:''}
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:6px">${moveButtons}<button class="hw-detail-btn" data-hwopen="${h.id}" style="font-size:10px;color:var(--acc);background:none;border:none;cursor:pointer;margin-left:auto">Detay →</button></div>
          </div>`}).join('')}
          ${!items.length?'<div style="text-align:center;padding:20px;color:var(--txt3);font-size:13px">Boş</div>':''}
        </div>
      </div>`}).join('');

    /* Drag & Drop */
    kb.querySelectorAll('.hw-card[draggable]').forEach(card=>{
      card.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',card.dataset.hwid);card.style.opacity='.5'});
      card.addEventListener('dragend',()=>{card.style.opacity='1'});
    });
    kb.querySelectorAll('[data-drop]').forEach(dropZone=>{
      dropZone.addEventListener('dragover',e=>{e.preventDefault();dropZone.style.background='var(--acc-l)'});
      dropZone.addEventListener('dragleave',()=>{dropZone.style.background=''});
      dropZone.addEventListener('drop',e=>{e.preventDefault();dropZone.style.background='';
        const hwid=e.dataTransfer.getData('text/plain');const newStatus=dropZone.dataset.drop;
        const item=hw.find(x=>x.id===hwid);if(item){item.status=newStatus;item.done=newStatus==='done';DS.set('homework',hw);render();_autoUpdateGoals()}
      });
    });
    /* Durum değiştirme butonları */
    kb.querySelectorAll('[data-hwmove]').forEach(b=>b.addEventListener('click',(e)=>{
      e.stopPropagation();
      const item=hw.find(x=>x.id===b.dataset.hwmove);
      if(item){item.status=b.dataset.hwto;item.done=b.dataset.hwto==='done';DS.set('homework',hw);render();_autoUpdateGoals();
        if(b.dataset.hwto==='done')showToast('Ödev tamamlandı! 🎉');
      }
    }));
    /* Detay */
    kb.querySelectorAll('[data-hwopen]').forEach(b=>b.addEventListener('click',(e)=>{e.stopPropagation();_openHwDetail(b.dataset.hwopen)}));
    /* Sil */
    kb.querySelectorAll('[data-hwdel]').forEach(b=>b.addEventListener('click',(e)=>{e.stopPropagation();hw=hw.filter(x=>x.id!==b.dataset.hwdel);DS.set('homework',hw);render()}));
  }

  function _daysLeft(dateStr){const d=new Date(dateStr+'T00:00');const now=new Date();now.setHours(0,0,0,0);return Math.ceil((d-now)/(1000*60*60*24))}

  /* Ödev Ekle Popup */
  $('#hwAddBtn').addEventListener('click',()=>{
    let pop=$('#hwAddPopup');
    if(!pop){pop=document.createElement('div');pop.id='hwAddPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
    pop.innerHTML=`<div class="popup-card" style="max-width:480px"><div class="popup-hdr"><h2>➕ Ödev Ekle</h2><button class="popup-close" onclick="$('#hwAddPopup').classList.remove('vis')">✕</button></div><div class="popup-body">
      <div style="display:flex;flex-direction:column;gap:14px">
        <div><label class="sp-label">Ödev</label><input class="task-input" id="hwaText" placeholder="ör: Sayfa 45-50 soruları çöz" maxlength="120" style="width:100%"></div>
        <div style="display:flex;gap:10px">
          <div style="flex:1"><label class="sp-label">Ders</label><select class="s-select" id="hwaSubject" style="width:100%">${_subjects.map(s=>`<option>${s}</option>`).join('')}</select></div>
          <div style="flex:1"><label class="sp-label">Teslim Tarihi</label><input type="date" class="task-input" id="hwaDate" style="width:100%"></div>
        </div>
        <div><label class="sp-label">Öncelik</label><div style="display:flex;gap:6px">${PRIORITIES.map(p=>`<button class="wizard-opt hw-pri-btn" data-hwpri="${p.id}" style="padding:8px 12px;font-size:13px;display:flex;align-items:center;gap:4px">${p.icon} ${p.label}</button>`).join('')}</div></div>
        <div><label class="sp-label">Durum</label><div style="display:flex;gap:6px">${COLUMNS.map(col=>`<button class="wizard-opt hw-status-btn" data-hwstatus="${col.id}" style="padding:8px 12px;font-size:13px;display:flex;align-items:center;gap:4px">${col.icon} ${col.label}</button>`).join('')}</div></div>
        <div><label class="sp-label">Not (opsiyonel)</label><textarea class="task-input" id="hwaNote" placeholder="Ek açıklama..." style="width:100%;min-height:50px;resize:vertical;border-radius:var(--r);padding:12px 16px"></textarea></div>
        <button class="tier-btn-up" id="hwaSave">Ekle</button>
      </div></div></div>`;
    pop.classList.add('vis');
    let selPri='medium',selStatus='todo';
    pop.querySelectorAll('.hw-pri-btn').forEach(b=>{
      if(b.dataset.hwpri==='medium')b.style.borderColor='#FF9F0A';
      b.addEventListener('click',()=>{pop.querySelectorAll('.hw-pri-btn').forEach(x=>x.style.borderColor='var(--border)');const p=PRIORITIES.find(x=>x.id===b.dataset.hwpri);b.style.borderColor=p.color;selPri=b.dataset.hwpri});
    });
    pop.querySelectorAll('.hw-status-btn').forEach(b=>{
      if(b.dataset.hwstatus==='todo')b.style.borderColor='var(--acc)';
      b.addEventListener('click',()=>{pop.querySelectorAll('.hw-status-btn').forEach(x=>x.style.borderColor='var(--border)');const col=COLUMNS.find(x=>x.id===b.dataset.hwstatus);b.style.borderColor=col.color;selStatus=b.dataset.hwstatus});
    });
    $('#hwaSave').addEventListener('click',()=>{
      const text=$('#hwaText').value.trim();if(!text){showToast('Ödev yazmalısın');return}
      hw.push({id:'hw'+Date.now(),text,subject:$('#hwaSubject').value,date:$('#hwaDate').value,priority:selPri,note:$('#hwaNote').value.trim(),status:selStatus,done:selStatus==='done'});
      DS.set('homework',hw);pop.classList.remove('vis');renderHomework();showToast('Ödev eklendi!');
    });
  });

  /* Ödev Detay Popup */
  function _openHwDetail(hwid){
    const h=hw.find(x=>x.id===hwid);if(!h)return;
    const pri=PRIORITIES.find(p=>p.id===h.priority)||PRIORITIES[0];
    const days=h.date?_daysLeft(h.date):null;
    let pop=$('#hwDetailPopup');
    if(!pop){pop=document.createElement('div');pop.id='hwDetailPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
    pop.innerHTML=`<div class="popup-card" style="max-width:500px"><div class="popup-hdr"><h2>📝 Ödev Detay</h2><button class="popup-close" onclick="$('#hwDetailPopup').classList.remove('vis')">✕</button></div><div class="popup-body">
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="font-size:18px;font-weight:700;font-family:var(--fh)">${h.text}</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          ${h.subject?`<span style="font-size:12px;padding:4px 12px;border-radius:50px;background:var(--acc-l);color:var(--acc)">📚 ${h.subject}</span>`:''}
          <span style="font-size:12px;padding:4px 12px;border-radius:50px;background:${pri.color}15;color:${pri.color}">${pri.icon} ${pri.label}</span>
          <span style="font-size:12px;padding:4px 12px;border-radius:50px;background:var(--bg2)">${{todo:'📋 Yapılacak',doing:'⏳ Yapılıyor',done:'✅ Tamamlandı'}[h.status||'todo']}</span>
        </div>
        ${h.date?`<div style="display:flex;align-items:center;gap:8px"><span style="font-size:14px">📅</span><span style="font-size:14px">${new Date(h.date+'T00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})}</span>${days!==null?`<span style="font-size:13px;font-weight:600;color:${days<0?'#FF3B30':days<=3?'#FF9F0A':'var(--txt3)'}"> · ${days<0?Math.abs(days)+' gün geçti!':days===0?'Bugün!':days+' gün kaldı'}</span>`:''}</div>`:''}
        <div><label class="sp-label">Not</label><textarea class="task-input" id="hwdNote" style="width:100%;min-height:80px;resize:vertical;border-radius:var(--r);padding:12px 16px">${h.note||''}</textarea></div>
        <div style="display:flex;gap:8px">
          <button class="tier-btn-up" style="flex:1" id="hwdSave">Kaydet</button>
          ${h.status!=='done'?`<button class="tier-btn-up" style="flex:1;background:#34C759" id="hwdComplete">✅ Tamamla</button>`:''}
        </div>
      </div></div></div>`;
    pop.classList.add('vis');
    $('#hwdSave').addEventListener('click',()=>{h.note=$('#hwdNote').value.trim();DS.set('homework',hw);pop.classList.remove('vis');render();showToast('Güncellendi')});
    $('#hwdComplete')?.addEventListener('click',()=>{h.status='done';h.done=true;DS.set('homework',hw);pop.classList.remove('vis');render();_autoUpdateGoals();showToast('Ödev tamamlandı! 🎉')});
  }

  /* AI yardım */
  $('#hwAIBtn').addEventListener('click',async()=>{
    const pending=hw.filter(h=>h.status!=='done');
    const prompt=`Öğrencinin ${pending.length} bekleyen ödevi var: ${pending.map(h=>h.text+(h.date?' (teslim: '+h.date+')':'')).join(', ')}. Hangi sırayla yapmalı? Kısa öneriler ver. 3-4 cümle, Türkçe.`;
    const result=await askBilgeForTool(prompt,$('#hwAIResult'));
    if(result)$('#hwAIResult').innerHTML=`<div style="background:var(--acc-l);border:1px solid var(--acc);border-radius:var(--r);padding:16px"><div style="font-weight:600;margin-bottom:8px">🧠 Öneri:</div><div style="font-size:14px;line-height:1.6">${result}</div></div>`;
  });

  render();
}

function _seedHomework(){const h=[
  {id:'hw1',text:'Sayfa 45-50 arası soruları çöz',subject:'Matematik',date:'2026-03-28',priority:'high',note:'',status:'todo',done:false},
  {id:'hw2',text:'Deney raporu yaz',subject:'Fizik',date:'2026-03-30',priority:'medium',note:'Laboratuvar defterinden bakarak yaz',status:'doing',done:false},
  {id:'hw3',text:'Roman özeti hazırla',subject:'Edebiyat',date:'2026-03-25',priority:'low',note:'Çalıkuşu romanı',status:'done',done:true},
  {id:'hw4',text:'Kimyasal tepkime denklemleri',subject:'Kimya',date:'2026-03-27',priority:'urgent',note:'',status:'todo',done:false},
  {id:'hw5',text:'İngilizce essay yaz',subject:'İngilizce',date:'2026-04-01',priority:'medium',note:'Topic: My future career',status:'todo',done:false}
];DS.set('homework',h);return h}

/* ═══ HEDEFLER (otomatik ilerleme) ═══ */
function renderGoals(){
  const c=$('#page-goals');if(!c)return;
  let goals=DS.get('mygoals')||_seedGoals();
  _calcGoalProgress(goals);
  const allDone=goals.filter(g=>g.progress>=100).length;
  const totalPct=goals.length?Math.round(goals.reduce((s,g)=>s+g.progress,0)/goals.length):0;

  c.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px">
      <div><h2 style="font-family:var(--fh);font-size:clamp(22px,3vw,28px);font-weight:800">🎯 Hedeflerim</h2><p style="font-size:14px;color:var(--txt2)">AI hedefleri otomatik ilerler · Kendi hedeflerin sen yönetirsin</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="tier-btn-up" style="width:auto;padding:10px 20px" id="goalAddBtn">➕ Hedef Ekle</button>
        <button class="filter-btn" id="goalAIBtn">🧠 Analiz et</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-bottom:20px">
      <div style="background:var(--acc-l);border:1px solid rgba(0,122,255,.15);border-radius:14px;padding:14px;text-align:center"><div style="font-size:24px;font-weight:800;color:var(--acc)">${totalPct}%</div><div style="font-size:11px;color:var(--txt2);margin-top:2px">Genel</div></div>
      <div style="background:rgba(52,199,89,.08);border:1px solid rgba(52,199,89,.15);border-radius:14px;padding:14px;text-align:center"><div style="font-size:24px;font-weight:800;color:#34C759">${allDone}</div><div style="font-size:11px;color:var(--txt2);margin-top:2px">Tamamlanan</div></div>
      <div style="background:rgba(255,159,10,.08);border:1px solid rgba(255,159,10,.15);border-radius:14px;padding:14px;text-align:center"><div style="font-size:24px;font-weight:800;color:#FF9F0A">${goals.length-allDone}</div><div style="font-size:11px;color:var(--txt2);margin-top:2px">Devam Eden</div></div>
      <div style="background:rgba(88,86,214,.08);border:1px solid rgba(88,86,214,.15);border-radius:14px;padding:14px;text-align:center"><div style="font-size:24px;font-weight:800;color:#5856D6">${goals.length}</div><div style="font-size:11px;color:var(--txt2);margin-top:2px">Toplam</div></div>
    </div>
    <div id="goalSections"></div>
    <div id="goalAIResult" style="margin-top:16px"></div>`;

  function _goalCard(g,isAuto){
    const pCol=g.progress>=100?'#34C759':g.progress>=60?'var(--acc)':g.progress>=30?'#FF9F0A':'#FF3B30';
    return`<div class="goal-card-v2" style="background:var(--white);border:1.5px solid var(--border);border-radius:var(--r);padding:18px;position:relative;transition:all .2s var(--ease)${g.progress>=100?';border-color:#34C759':''}">
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
        <span style="font-size:22px">${g.icon||'🎯'}</span>
        <div style="flex:1;min-width:0"><div style="font-weight:600;font-size:14px;line-height:1.4">${g.text}</div>${isAuto?'<div style="font-size:11px;color:var(--acc);margin-top:2px">🧠 Otomatik takip</div>':''}</div>
        <button class="task-del" data-gdel="${g.id}" style="flex-shrink:0">✕</button>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:${isAuto?'8':'12'}px">
        <div style="flex:1;height:8px;background:var(--bg2);border-radius:4px;overflow:hidden"><div class="gc-fill" style="height:100%;background:${pCol};border-radius:4px;width:${g.progress}%;transition:width .4s var(--ease)"></div></div>
        <span class="gc-pct" style="font-family:var(--fh);font-size:14px;font-weight:700;color:${pCol};min-width:36px;text-align:right">${g.progress>=100?'✅':g.progress+'%'}</span>
      </div>
      ${isAuto?`<button data-gdetail="${g.id}" style="font-size:12px;color:var(--acc);background:none;border:none;cursor:pointer;padding:0">▼ Neden bu ilerleme?</button><div style="display:none;font-size:12px;color:var(--txt2);padding:8px 0;line-height:1.6">${g.detail||'Görevlerin ve denemelerine göre hesaplanıyor.'}</div>`
      :`<div style="display:flex;gap:6px;align-items:center">${g.progress<100?`<input type="range" min="0" max="100" value="${g.progress}" data-gslider="${g.id}" style="flex:1;accent-color:${pCol}"><button data-gplus="${g.id}" style="font-size:12px;padding:4px 10px;border-radius:50px;background:var(--bg2);border:none;cursor:pointer;white-space:nowrap">+10%</button><button data-gcomplete="${g.id}" style="font-size:12px;padding:4px 10px;border-radius:50px;background:#34C759;color:#fff;border:none;cursor:pointer;white-space:nowrap">Tamamla</button>`:'<span style="font-size:13px;color:#34C759;font-weight:600">🎉 Tamamlandı!</span>'}</div>`}
    </div>`;
  }

  function render(){
    _calcGoalProgress(goals);
    const aiG=goals.filter(g=>g.auto);
    const myG=goals.filter(g=>!g.auto);
    const sec=$('#goalSections');
    sec.innerHTML=`
      ${aiG.length?`<div style="margin-bottom:24px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:14px"><span style="font-size:18px">🧠</span><span style="font-family:var(--fh);font-size:16px;font-weight:700">AI Hedefleri</span><span style="font-size:11px;color:var(--txt3);background:var(--bg2);padding:3px 10px;border-radius:50px">Otomatik</span></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">${aiG.map(g=>_goalCard(g,true)).join('')}</div></div>`:''}
      ${myG.length?`<div><div style="display:flex;align-items:center;gap:8px;margin-bottom:14px"><span style="font-size:18px">🎯</span><span style="font-family:var(--fh);font-size:16px;font-weight:700">Kendi Hedeflerim</span><span style="font-size:11px;color:var(--txt3);background:var(--bg2);padding:3px 10px;border-radius:50px">Manuel</span></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">${myG.map(g=>_goalCard(g,false)).join('')}</div></div>`:''}
      ${!goals.length?'<p style="text-align:center;color:var(--txt3);padding:40px">Hedef ekle!</p>':''}`;
    sec.querySelectorAll('[data-gslider]').forEach(r=>r.addEventListener('input',()=>{const g=goals.find(x=>x.id===r.dataset.gslider);if(g){g.progress=parseInt(r.value);DS.set('mygoals',goals);const card=r.closest('.goal-card-v2');card.querySelector('.gc-fill').style.width=g.progress+'%';card.querySelector('.gc-pct').textContent=g.progress>=100?'✅':g.progress+'%'}}));
    sec.querySelectorAll('[data-gplus]').forEach(b=>b.addEventListener('click',()=>{const g=goals.find(x=>x.id===b.dataset.gplus);if(g){g.progress=Math.min(100,g.progress+10);DS.set('mygoals',goals);render()}}));
    sec.querySelectorAll('[data-gcomplete]').forEach(b=>b.addEventListener('click',()=>{const g=goals.find(x=>x.id===b.dataset.gcomplete);if(g){g.progress=100;DS.set('mygoals',goals);render();showToast('Hedef tamamlandı! 🎉')}}));
    sec.querySelectorAll('[data-gdel]').forEach(b=>b.addEventListener('click',()=>{goals=goals.filter(x=>x.id!==b.dataset.gdel);DS.set('mygoals',goals);render()}));
    sec.querySelectorAll('[data-gdetail]').forEach(b=>b.addEventListener('click',()=>{const el=b.nextElementSibling;if(el)el.style.display=el.style.display==='none'?'block':'none'}));
  }


  /* Hedef Ekle popup — AI: seviyeye göre hazır seçenekler, Manuel: serbest */
  $('#goalAddBtn').addEventListener('click',()=>{
    let pop=$('#goalAddPopup');
    if(!pop){pop=document.createElement('div');pop.id='goalAddPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
    const u=DS.get('user')||{};const lv=u.level||'lise';const cls=u.classOrDetail||'';
    pop.innerHTML=`<div class="popup-card" style="max-width:520px"><div class="popup-hdr"><h2>➕ Hedef Ekle</h2><button class="popup-close" onclick="$('#goalAddPopup').classList.remove('vis')">✕</button></div><div class="popup-body">
      <div class="tasks-tabs" style="margin-bottom:16px;width:100%"><button class="feed-tab active" data-goaltab="auto">🧠 AI Hedefi</button><button class="feed-tab" data-goaltab="manual">🎯 Kendi Hedefim</button></div>
      <div id="goalTabContent"></div>
    </div></div>`;
    pop.classList.add('vis');
    let activeTab='auto';
    function showTab(){
      const tc=$('#goalTabContent');
      if(activeTab==='auto'){
        const presets=_getGoalPresets(lv,cls);
        tc.innerHTML=`<p style="font-size:13px;color:var(--txt2);margin-bottom:14px">Seviyene uygun hedefler — istediğin kadar seç:</p>
          <div style="display:flex;flex-direction:column;gap:8px;max-height:340px;overflow-y:auto" id="goalPresetList">${presets.map((p,i)=>`
            <button class="goal-preset-btn" data-gpi="${i}" style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;border:1.5px solid var(--border);background:var(--white);font-size:14px;text-align:left;cursor:pointer;transition:all .15s">
              <span style="font-size:18px;flex-shrink:0">${p.icon}</span>
              <span style="flex:1">${p.text}</span>
              <span class="gp-check" style="width:22px;height:22px;border-radius:50%;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;transition:all .15s"></span>
            </button>`).join('')}
          </div>
          <button class="tier-btn-up" style="margin-top:16px" id="goalPresetSave">Seçilenleri Ekle</button>`;
        const selected=new Set();
        tc.querySelectorAll('.goal-preset-btn').forEach(b=>b.addEventListener('click',()=>{
          const idx=parseInt(b.dataset.gpi);const chk=b.querySelector('.gp-check');
          if(selected.has(idx)){selected.delete(idx);b.style.borderColor='var(--border)';b.style.background='var(--white)';chk.innerHTML='';chk.style.borderColor='var(--border)';chk.style.background='transparent'}
          else{selected.add(idx);b.style.borderColor='var(--acc)';b.style.background='var(--acc-l)';chk.innerHTML='✓';chk.style.borderColor='var(--acc)';chk.style.background='var(--acc)';chk.style.color='#fff'}
        }));
        $('#goalPresetSave')?.addEventListener('click',()=>{
          if(!selected.size){showToast('En az 1 hedef seç');return}
          const presetList=_getGoalPresets(lv,cls);
          selected.forEach(i=>{const p=presetList[i];if(p)goals.push({id:'g'+Date.now()+Math.random(),text:p.text,icon:p.icon,progress:0,auto:true,detail:p.detail||'',trackKey:p.trackKey||''})});
          DS.set('mygoals',goals);pop.classList.remove('vis');renderGoals();showToast(selected.size+' hedef eklendi!');
        });
      }else{
        const icons=['🎯','🏆','📊','📚','⏰','💪','🧠','✍️','🎓','🎨','🏃','🎵'];
        tc.innerHTML=`<div style="display:flex;flex-direction:column;gap:14px">
          <div><label class="sp-label">Hedef</label><input class="task-input" id="goalManualInp" placeholder="ör: Kitap okumayı bitirmek" maxlength="100" style="width:100%"></div>
          <div><label class="sp-label">İkon</label><div style="display:flex;gap:6px;flex-wrap:wrap">${icons.map(ic=>`<button class="wizard-opt" data-gmicon="${ic}" style="padding:8px 10px;font-size:18px;min-width:0">${ic}</button>`).join('')}</div></div>
          <button class="tier-btn-up" id="goalManualSave">Ekle</button>
        </div>`;
        let selIcon='🎯';
        tc.querySelectorAll('[data-gmicon]').forEach(b=>{if(b.dataset.gmicon==='🎯')b.style.borderColor='var(--acc)';b.addEventListener('click',()=>{tc.querySelectorAll('[data-gmicon]').forEach(x=>x.style.borderColor='var(--border)');b.style.borderColor='var(--acc)';selIcon=b.dataset.gmicon})});
        $('#goalManualSave')?.addEventListener('click',()=>{const v=$('#goalManualInp').value.trim();if(!v){showToast('Hedef yazmalısın');return}goals.push({id:'g'+Date.now(),text:v,icon:selIcon,progress:0,auto:false,detail:''});DS.set('mygoals',goals);pop.classList.remove('vis');renderGoals();showToast('Hedef eklendi!')});
      }
    }
    pop.querySelectorAll('[data-goaltab]').forEach(b=>b.addEventListener('click',()=>{pop.querySelectorAll('[data-goaltab]').forEach(x=>x.classList.remove('active'));b.classList.add('active');activeTab=b.dataset.goaltab;showTab()}));
    showTab();
  });

  $('#goalAIBtn').addEventListener('click',async()=>{
    const tasks=DS.get('tasks')||[];const nets=DS.get('mynets')||[];const hw=DS.get('homework')||[];
    const prompt=`Öğrenci hedefleri: ${goals.map(g=>g.text+' ('+g.progress+'%)').join(', ')}. Görevler: ${tasks.filter(t=>t.done).length}/${tasks.length}. Ödevler: ${hw.filter(h=>h.done).length}/${hw.length}. Denemeler: ${nets.slice(0,3).map(n=>n.name+': '+n.score).join(', ')}. Kısa analiz + öneriler. 3-4 cümle, Türkçe.`;
    const result=await askBilgeForTool(prompt,$('#goalAIResult'));
    if(result&&!result.includes('Yanıt alınamadı'))$('#goalAIResult').innerHTML=`<div style="background:var(--acc-l);border:1px solid var(--acc);border-radius:var(--r);padding:16px"><div style="font-weight:600;margin-bottom:8px">🧠 Analiz:</div><div style="font-size:14px;line-height:1.6">${result}</div></div>`;
  });
  render();
}

function _seedGoals(){const g=[
  {id:'g1',text:'YKS\'de ilk 10.000\'e girmek',icon:'🏆',progress:35,auto:true,detail:'Görev tamamlama ve deneme sonuçlarına göre.'},
  {id:'g2',text:'Matematik netimi 30\'a çıkarmak',icon:'🔢',progress:60,auto:true,detail:'Son deneme netine göre güncelleniyor.'},
  {id:'g3',text:'Her gün en az 4 saat çalışmak',icon:'⏰',progress:80,auto:true,detail:'Günlük görev tamamlama oranına göre.'},
  {id:'g4',text:'Edebiyat kitabını bitirmek',icon:'📚',progress:40,auto:false,detail:''},
  {id:'g5',text:'Yüzme kursuna yazılmak',icon:'💪',progress:0,auto:false,detail:''}
];DS.set('mygoals',g);return g}

/* Seviyeye göre hazır AI hedef seçenekleri */
function _getGoalPresets(level,cls){
  const common=[
    {icon:'⏰',text:'Her gün en az 4 saat çalışmak',trackKey:'study',detail:'Görev tamamlama oranına göre'},
    {icon:'📋',text:'Haftalık tüm görevleri tamamlamak',trackKey:'tasks',detail:'Haftalık görev oranına göre'},
    {icon:'📚',text:'Her gün en az 1 konu bitirmek',trackKey:'tasks',detail:'Ders kategorisindeki görevlere göre'},
    {icon:'🔄',text:'Her hafta zayıf konuları tekrar etmek',trackKey:'tekrar',detail:'Tekrar görevlerine göre'},
  ];
  if(level==='ortaokul'){
    const base=[
      {icon:'📊',text:'Tüm derslerde 85+ ortalama tutmak',trackKey:'net',detail:'Deneme sonuçlarına göre'},
      {icon:'🔢',text:'Matematik sınav notu 90+ yapmak',trackKey:'net',detail:'Matematik deneme netine göre'},
      {icon:'📖',text:'Türkçe sınav notu 85+ yapmak',trackKey:'net',detail:'Türkçe deneme netine göre'},
      {icon:'🔬',text:'Fen Bilimleri sınav notu 80+ yapmak',trackKey:'net',detail:'Fen deneme netine göre'},
      {icon:'🌍',text:'Sosyal Bilgiler sınav notu 85+ yapmak',trackKey:'net',detail:'Sosyal deneme netine göre'},
      {icon:'📝',text:'Her hafta en az 1 deneme çözmek',trackKey:'deneme',detail:'Deneme görevlerine göre'},
    ];
    if(cls.includes('8')){
      base.push(
        {icon:'🏆',text:'LGS\'de 400+ puan almak',trackKey:'net',detail:'Deneme sonuçlarına göre'},
        {icon:'🥇',text:'LGS\'de ilk 10.000\'e girmek',trackKey:'net',detail:'Genel ilerlemeye göre'},
        {icon:'🔢',text:'LGS Matematik 20 net yapmak',trackKey:'net',detail:'Matematik netine göre'},
        {icon:'📖',text:'LGS Türkçe 18+ net yapmak',trackKey:'net',detail:'Türkçe netine göre'},
        {icon:'🔬',text:'LGS Fen 18+ net yapmak',trackKey:'net',detail:'Fen netine göre'},
        {icon:'📝',text:'Haftada 2 LGS denemesi çözmek',trackKey:'deneme',detail:'Deneme görevlerine göre'},
      );
    }
    return[...base,...common];
  }
  if(level==='lise'){
    const base=[
      {icon:'📊',text:'Genel not ortalamasını 80+ tutmak',trackKey:'net',detail:'Deneme sonuçlarına göre'},
      {icon:'🔢',text:'Matematik notunu yükseltmek',trackKey:'net',detail:'Matematik netine göre'},
      {icon:'⚡',text:'Fizik notunu yükseltmek',trackKey:'net',detail:'Fizik netine göre'},
    ];
    if(cls.includes('11')||cls.includes('12')){
      base.push(
        {icon:'🏆',text:'YKS\'de ilk 10.000\'e girmek',trackKey:'net',detail:'Deneme sonuçlarına göre'},
        {icon:'🥇',text:'YKS\'de ilk 50.000\'e girmek',trackKey:'net',detail:'Deneme sonuçlarına göre'},
        {icon:'🎯',text:'TYT\'de 100+ net yapmak',trackKey:'net',detail:'TYT deneme netine göre'},
        {icon:'🔢',text:'TYT Matematik 30+ net yapmak',trackKey:'net',detail:'Matematik netine göre'},
        {icon:'📖',text:'TYT Türkçe 35+ net yapmak',trackKey:'net',detail:'Türkçe netine göre'},
        {icon:'⚡',text:'AYT Matematik 25+ net yapmak',trackKey:'net',detail:'AYT mat netine göre'},
        {icon:'🧪',text:'AYT Fen 20+ net yapmak',trackKey:'net',detail:'AYT fen netine göre'},
        {icon:'📝',text:'Haftada 2 TYT denemesi çözmek',trackKey:'deneme',detail:'Deneme görevlerine göre'},
        {icon:'📝',text:'Haftada 1 AYT denemesi çözmek',trackKey:'deneme',detail:'Deneme görevlerine göre'},
        {icon:'📈',text:'Her denemede netimi artırmak',trackKey:'net',detail:'Deneme trend analizi'},
      );
    }
    return[...base,...common];
  }
  if(level==='universite'){
    return[
      {icon:'🎓',text:'Dönem sonu GPA 3.0+ tutmak',trackKey:'net',detail:'Sınav sonuçlarına göre'},
      {icon:'📊',text:'Tüm derslerden geçmek',trackKey:'tasks',detail:'Görev tamamlamaya göre'},
      {icon:'📝',text:'ALES\'te 70+ puan almak',trackKey:'net',detail:'Deneme sonuçlarına göre'},
      {icon:'🌐',text:'YÖKDİL\'de 60+ puan almak',trackKey:'net',detail:'Deneme sonuçlarına göre'},
      {icon:'📚',text:'Tez/proje zamanında teslim etmek',trackKey:'tasks',detail:'Görev tamamlamaya göre'},
      {icon:'💼',text:'Staj başvurusu yapmak',trackKey:'tasks',detail:'Görev tamamlamaya göre'},
      ...common
    ];
  }
  /* Mezun / Sınav hazırlık */
  const examPresets=[];
  const exam=cls||'KPSS';
  if(exam.includes('KPSS')){
    examPresets.push(
      {icon:'🏆',text:'KPSS\'de 80+ puan almak',trackKey:'net',detail:'Deneme sonuçlarına göre'},
      {icon:'🥇',text:'KPSS\'de 70+ puan almak',trackKey:'net',detail:'Deneme sonuçlarına göre'},
      {icon:'📊',text:'KPSS GY\'de 40+ net yapmak',trackKey:'net',detail:'GY deneme netine göre'},
      {icon:'📋',text:'KPSS GK\'de 30+ net yapmak',trackKey:'net',detail:'GK deneme netine göre'},
      {icon:'🎓',text:'KPSS Eğitim Bilimleri 35+ net',trackKey:'net',detail:'EB deneme netine göre'},
      {icon:'📝',text:'Haftada 2 KPSS denemesi çözmek',trackKey:'deneme',detail:'Deneme görevlerine göre'},
      {icon:'📈',text:'Her denemede netimi artırmak',trackKey:'net',detail:'Deneme trend analizi'},
    );
  }
  if(exam.includes('YDS')||exam.includes('YÖKDİL')){
    examPresets.push(
      {icon:'🌐',text:`${exam}'de 80+ puan almak`,trackKey:'net',detail:'Deneme sonuçlarına göre'},
      {icon:'🌐',text:`${exam}'de 60+ puan almak`,trackKey:'net',detail:'Deneme sonuçlarına göre'},
      {icon:'📖',text:'Her gün 30 kelime ezberlemek',trackKey:'tasks',detail:'Görev tamamlamaya göre'},
      {icon:'📝',text:'Haftada 2 mini deneme çözmek',trackKey:'deneme',detail:'Deneme görevlerine göre'},
    );
  }
  if(exam.includes('ALES')){
    examPresets.push(
      {icon:'🏆',text:'ALES\'te 75+ puan almak',trackKey:'net',detail:'Deneme sonuçlarına göre'},
      {icon:'🔢',text:'ALES Sayısal 30+ net yapmak',trackKey:'net',detail:'Sayısal deneme netine göre'},
      {icon:'📖',text:'ALES Sözel 25+ net yapmak',trackKey:'net',detail:'Sözel deneme netine göre'},
      {icon:'📝',text:'Haftada 2 ALES denemesi çözmek',trackKey:'deneme',detail:'Deneme görevlerine göre'},
    );
  }
  if(exam.includes('TUS')||exam.includes('DUS')){
    examPresets.push(
      {icon:'🏥',text:`${exam}'ta ilk 5.000'e girmek`,trackKey:'net',detail:'Deneme sonuçlarına göre'},
      {icon:'📊',text:`${exam} denemesinde 50+ net yapmak`,trackKey:'net',detail:'Deneme netine göre'},
      {icon:'📝',text:'Haftada 1 tam deneme çözmek',trackKey:'deneme',detail:'Deneme görevlerine göre'},
    );
  }
  if(!examPresets.length){
    examPresets.push(
      {icon:'🏆',text:'Sınavda hedef puanı geçmek',trackKey:'net',detail:'Deneme sonuçlarına göre'},
      {icon:'📝',text:'Haftada 2 deneme çözmek',trackKey:'deneme',detail:'Deneme görevlerine göre'},
      {icon:'📈',text:'Her denemede ilerlemek',trackKey:'net',detail:'Deneme trendine göre'},
    );
  }
  return[...examPresets,...common];
}

function _calcGoalProgress(goals){
  const tasks=DS.get('tasks')||[];const hw=DS.get('homework')||[];const nets=DS.get('mynets')||[];const plans=DS.get('all_study_plans')||[];
  const taskPct=tasks.length?Math.round(tasks.filter(t=>t.done).length/tasks.length*100):0;
  const hwPct=hw.length?Math.round(hw.filter(h=>h.done).length/hw.length*100):0;
  goals.forEach(g=>{
    if(!g.auto)return;
    const txt=g.text.toLowerCase();
    if(txt.includes('çalış')||txt.includes('görev')){g.progress=Math.min(100,Math.max(g.progress,taskPct));g.detail=`Görev: ${taskPct}%, Ödev: ${hwPct}%`}
    else if(txt.includes('net')&&nets.length){const last=nets[0];const target=parseInt(txt.match(/(\d+)/)?.[1])||40;g.progress=Math.min(100,Math.round((last.score/target)*100));g.detail=`Son net: ${last.score}/${target}`}
    else if(txt.includes('deneme')){const d=tasks.filter(t=>t.cat==='deneme'&&t.done).length,t=tasks.filter(t=>t.cat==='deneme').length;g.progress=t?Math.round(d/t*100):g.progress;g.detail=`Deneme: ${d}/${t}`}
    else{g.progress=Math.min(100,Math.round((taskPct+hwPct)/2));g.detail=`Görev: ${taskPct}%, Ödev: ${hwPct}%`}
  });
  DS.set('mygoals',goals);
}
function _autoUpdateGoals(){const goals=DS.get('mygoals');if(goals){_calcGoalProgress(goals)}}

/* ═══ TAKVİM ═══ */
function renderCalendar(){
  const c=$('#page-calendar');if(!c)return;
  const now=new Date();let vM=now.getMonth(),vY=now.getFullYear();
  const u=DS.get('user')||{};const lv=u.level||'lise';
  const EVENT_TYPES=[
    {id:'ders',label:'📚 Ders',color:'#007AFF'},
    {id:'sinav',label:'📝 Sınav',color:'#FF3B30'},
    {id:'odev',label:'📋 Ödev',color:'#FF9F0A'},
    {id:'plan',label:'🧭 Plan',color:'#5856D6'},
    {id:'kisisel',label:'⭐ Kişisel',color:'#34C759'},
    {id:'hatirlatma',label:'🔔 Hatırlatma',color:'#AF52DE'}
  ];

  function _getEvents(dateStr){return DS.get('cal_'+dateStr)||[]}
  function _setEvents(dateStr,evs){DS.set('cal_'+dateStr,evs)}
  function _autoEvents(dateStr){
    /* Ödev teslim tarihleri */
    const hw=DS.get('homework')||[];
    const hwEvents=hw.filter(h=>h.date===dateStr&&h.status!=='done').map(h=>({text:'📋 '+h.text,type:'odev',auto:true}));
    /* Sınav tarihleri */
    const info=EDU[lv]||{};const examEvents=[];
    if(info.exams)info.exams.forEach(ex=>{if(ex.date===dateStr)examEvents.push({text:'📝 '+ex.name,type:'sinav',auto:true})});
    return[...hwEvents,...examEvents];
  }

  function build(){
    const months=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    const days=['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
    const first=new Date(vY,vM,1).getDay();const shift=first===0?6:first-1;
    const total=new Date(vY,vM+1,0).getDate();
    const todayStr=now.toISOString().slice(0,10);

    let cells='';
    for(let i=0;i<shift;i++)cells+='<div class="cal-cell empty"></div>';
    for(let d=1;d<=total;d++){
      const ds=`${vY}-${String(vM+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday=ds===todayStr;
      const events=_getEvents(ds);
      const autoEvs=_autoEvents(ds);
      const allEvs=[...events,...autoEvs];
      const dots=allEvs.length?allEvs.slice(0,3).map(e=>{const et=EVENT_TYPES.find(t=>t.id===e.type);return`<span style="width:5px;height:5px;border-radius:50%;background:${et?.color||'var(--acc)'}"></span>`}).join(''):'';
      cells+=`<div class="cal-cell ${isToday?'today':''} ${allEvs.length?'has-event':''}" data-date="${ds}"><span class="cal-day">${d}</span>${dots?`<div style="display:flex;gap:2px;margin-top:2px">${dots}</div>`:''}</div>`;
    }

    c.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px">
        <div><h2 style="font-family:var(--fh);font-size:clamp(20px,3vw,26px);font-weight:800">📅 Takvim</h2></div>
        <button class="tier-btn-up" style="width:auto;padding:8px 18px;font-size:13px" id="calAddBtn">➕ Etkinlik Ekle</button>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><button class="filter-btn" id="calPrev" style="padding:6px 12px">←</button><span style="font-family:var(--fh);font-size:17px;font-weight:700">${months[vM]} ${vY}</span><button class="filter-btn" id="calNext" style="padding:6px 12px">→</button></div>
      <div style="display:flex;gap:2px;background:var(--white);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;flex-direction:column">
        <div style="display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-size:11px;font-weight:600;color:var(--txt3);padding:10px 0;border-bottom:1px solid var(--border)">${days.map(d=>`<div>${d}</div>`).join('')}</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr)" id="calGrid">${cells}</div>
      </div>
      <div id="calDetail" style="margin-top:14px"></div>`;

    $('#calPrev').addEventListener('click',()=>{vM--;if(vM<0){vM=11;vY--}build()});
    $('#calNext').addEventListener('click',()=>{vM++;if(vM>11){vM=0;vY++}build()});
    $('#calAddBtn').addEventListener('click',()=>{_openCalAddPopup(todayStr)});

    /* Gün tıklama */
    c.querySelectorAll('.cal-cell[data-date]').forEach(cell=>cell.addEventListener('click',()=>{
      const ds=cell.dataset.date;
      const events=_getEvents(ds);const autoEvs=_autoEvents(ds);const allEvs=[...events,...autoEvs];
      const dateLabel=new Date(ds+'T00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',weekday:'long'});

      /* Tüm hücrelerin seçimini kaldır */
      c.querySelectorAll('.cal-cell').forEach(x=>x.classList.remove('selected'));
      cell.classList.add('selected');

      $('#calDetail').innerHTML=`<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="font-weight:600;font-size:14px">📅 ${dateLabel}</span><button class="filter-btn" style="font-size:11px;padding:4px 10px" onclick="_openCalAddPopup('${ds}')">➕ Ekle</button></div>
        ${allEvs.length?allEvs.map((e,i)=>{
          const et=EVENT_TYPES.find(t=>t.id===e.type);
          return`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;${i<allEvs.length-1?'border-bottom:1px solid var(--border)':''}">
            <span style="width:8px;height:8px;border-radius:50%;background:${et?.color||'var(--acc)'};flex-shrink:0"></span>
            <span style="flex:1;font-size:13px">${e.text}</span>
            ${e.time?`<span style="font-size:11px;color:var(--txt3)">${e.time}</span>`:''}
            ${!e.auto?`<button class="task-del" onclick="const ev=DS.get('cal_${ds}')||[];ev.splice(${i},1);DS.set('cal_${ds}',ev);renderCalendar()">✕</button>`:`<span style="font-size:9px;color:var(--txt3);background:var(--bg2);padding:2px 6px;border-radius:50px">otomatik</span>`}
          </div>`}).join(''):'<p style="font-size:13px;color:var(--txt3);text-align:center;padding:12px">Bu gün boş</p>'}
      </div>`;
    }));
  }

  /* Etkinlik Ekle Popup */
  window._openCalAddPopup=function(defaultDate){
    let pop=$('#calAddPopup');if(!pop){pop=document.createElement('div');pop.id='calAddPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
    pop.innerHTML=`<div class="popup-card" style="max-width:420px"><div class="popup-hdr"><h2>➕ Etkinlik Ekle</h2><button class="popup-close" onclick="$('#calAddPopup').classList.remove('vis')">✕</button></div><div class="popup-body">
      <div style="display:flex;flex-direction:column;gap:14px">
        <div><label class="sp-label">Ne?</label><input class="task-input" id="ceText" placeholder="ör: Matematik yazılı sınavı" maxlength="80" style="width:100%"></div>
        <div style="display:flex;gap:10px"><div style="flex:1"><label class="sp-label">Tarih</label><input type="date" class="task-input" id="ceDate" value="${defaultDate}" style="width:100%"></div><div style="flex:1"><label class="sp-label">Saat (opsiyonel)</label><input type="time" class="task-input" id="ceTime" style="width:100%"></div></div>
        <div><label class="sp-label">Tür</label><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">${EVENT_TYPES.map(t=>`<button class="wizard-opt ce-type-btn" data-cet="${t.id}" style="padding:8px;font-size:12px;display:flex;align-items:center;gap:4px;justify-content:center"><span style="width:8px;height:8px;border-radius:50%;background:${t.color}"></span>${t.label.split(' ')[1]}</button>`).join('')}</div></div>
        <button class="tier-btn-up" id="ceSave">Ekle</button>
      </div></div></div>`;
    pop.classList.add('vis');
    let selType='ders';
    pop.querySelectorAll('.ce-type-btn').forEach(b=>{
      if(b.dataset.cet==='ders')b.style.borderColor='#007AFF';
      b.addEventListener('click',()=>{pop.querySelectorAll('.ce-type-btn').forEach(x=>x.style.borderColor='var(--border)');const et=EVENT_TYPES.find(t=>t.id===b.dataset.cet);b.style.borderColor=et.color;selType=b.dataset.cet});
    });
    $('#ceSave').addEventListener('click',()=>{
      const text=$('#ceText').value.trim();if(!text){showToast('Etkinlik yazmalısın');return}
      const ds=$('#ceDate').value;const time=$('#ceTime').value||'';
      const events=_getEvents(ds);events.push({text,type:selType,time});_setEvents(ds,events);
      pop.classList.remove('vis');build();showToast('Etkinlik eklendi!');
    });
  };

  build();
}

/* ═══ GELİŞİM TAKİBİ ═══ */
function renderProgress(){
  const c=$('#page-progress');if(!c)return;
  const nets=DS.get('mynets')||[];
  const data=nets.length>=2?nets.slice(0,6).reverse().map(n=>({label:n.name.substring(0,8),score:n.score})):[{label:'Deneme 1',score:65},{label:'Deneme 2',score:72},{label:'Deneme 3',score:78},{label:'Deneme 4',score:82},{label:'Deneme 5',score:88}];
  const maxVal=Math.max(...data.map(d=>d.score),1);
  c.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px"><div><h2 style="font-family:var(--fh);font-size:clamp(22px,3vw,28px);font-weight:800">📈 Gelişim Takibi</h2><p style="font-size:14px;color:var(--txt2)">Net gelişim grafiğin</p></div><button class="filter-btn" id="progAIBtn">🧠 Bilge ile analiz et</button></div>
    <div class="chart-container">${data.map(d=>`<div class="chart-col"><div class="chart-bars"><div class="chart-bar" style="height:${d.score/maxVal*100}%;background:var(--acc)" title="${d.score} net"></div></div><div class="chart-label">${d.label}</div></div>`).join('')}</div>
    <div class="progress-summary"><div class="ps-card"><div class="ps-val" style="color:var(--acc)">${data.length>=2?(data[data.length-1].score-data[0].score>0?'+':'')+(data[data.length-1].score-data[0].score).toFixed(1):'—'}</div><div class="ps-lbl">Toplam Değişim</div></div><div class="ps-card"><div class="ps-val" style="color:var(--success)">${data[data.length-1]?.score||0}</div><div class="ps-lbl">Son Net</div></div><div class="ps-card"><div class="ps-val">${data.length}</div><div class="ps-lbl">Deneme Sayısı</div></div></div>
    <div id="progAIResult" style="margin-top:16px"></div>`;
  $('#progAIBtn')?.addEventListener('click',async()=>{
    const prompt=`Öğrencinin deneme sonuçları: ${data.map(d=>d.label+': '+d.score+' net').join(', ')}. Bu verilere göre kısa bir gelişim analizi yap. Trendy artıyor mu, düşüyor mu? Önerilerde bulun. 3-4 cümle, Türkçe.`;
    const result=await askBilgeForTool(prompt,$('#progAIResult'));
    if(result)$('#progAIResult').innerHTML=`<div style="background:var(--acc-l);border:1px solid var(--acc);border-radius:var(--r);padding:16px"><div style="font-weight:600;margin-bottom:8px">🧠 Bilge'nin Analizi:</div><div style="font-size:14px;line-height:1.6">${result}</div></div>`;
  });
}

/* ═══ NETLERİM (H/A/Y grafik) ═══ */
function renderNets(){
  const c=$('#page-nets');if(!c)return;
  let nets=DS.get('mynets')||_seedNets();
  const u=DS.get('user')||{};const lv=u.level||'lise';
  const EXAM_TYPES=lv==='ortaokul'?[
    {id:'lgs',label:'LGS Deneme',color:'#007AFF',icon:'📘'},
    {id:'okul',label:'Okul Sınavı',color:'#34C759',icon:'🏫'},
    {id:'yazili',label:'Yazılı',color:'#FF9F0A',icon:'📝'},
    {id:'test',label:'Test',color:'#5856D6',icon:'✏️'}
  ]:lv==='lise'?[
    {id:'tyt',label:'TYT Deneme',color:'#007AFF',icon:'📘'},
    {id:'ayt',label:'AYT Deneme',color:'#FF3B30',icon:'📕'},
    {id:'okul',label:'Okul Sınavı',color:'#34C759',icon:'🏫'},
    {id:'yazili',label:'Yazılı',color:'#FF9F0A',icon:'📝'},
    {id:'deneme',label:'Genel Deneme',color:'#5856D6',icon:'📋'}
  ]:lv==='universite'?[
    {id:'vize',label:'Vize',color:'#007AFF',icon:'📘'},
    {id:'final',label:'Final',color:'#FF3B30',icon:'📕'},
    {id:'quiz',label:'Quiz',color:'#34C759',icon:'✏️'},
    {id:'ales',label:'ALES Deneme',color:'#5856D6',icon:'📋'}
  ]:[
    {id:'kpss',label:'KPSS Deneme',color:'#007AFF',icon:'📘'},
    {id:'yds',label:'YDS Deneme',color:'#FF3B30',icon:'📕'},
    {id:'ales',label:'ALES Deneme',color:'#34C759',icon:'📋'},
    {id:'genel',label:'Genel Deneme',color:'#5856D6',icon:'📝'}
  ];
  const SUBJECTS=lv==='ortaokul'?['Türkçe','Matematik','Fen','Sosyal','İngilizce','Din']:
    lv==='lise'?['Matematik','Türkçe','Fizik','Kimya','Biyoloji','Tarih','Coğrafya','Edebiyat','Felsefe','İngilizce']:
    lv==='universite'?['Sayısal','Sözel','EA','Bölüm']:['GY','GK','Eğitim','Alan','İngilizce'];
  let activeFilter='all';
  const target=DS.get('net_target')||0;

  function _stats(){
    const f=activeFilter==='all'?nets:nets.filter(n=>n.examType===activeFilter);
    const total=f.length,avg=total?Math.round(f.reduce((s,n)=>s+n.score,0)/total*10)/10:0;
    const best=total?Math.max(...f.map(n=>n.score)):0,worst=total?Math.min(...f.map(n=>n.score)):0;
    return{total,avg,best,worst};
  }

  function fullRender(){
    const st=_stats();
    c.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px">
        <div><h2 style="font-family:var(--fh);font-size:clamp(22px,3vw,28px);font-weight:800">📊 Netlerim</h2><p style="font-size:14px;color:var(--txt2)">Deneme arşivin</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="tier-btn-up" style="width:auto;padding:10px 20px" id="netAddBtn">➕ Sonuç Ekle</button>
          <button class="filter-btn" id="netTargetBtn">🎯 ${target?'Hedef: '+target:'Hedef Belirle'}</button>
          <button class="filter-btn" id="netAIBtn">🧠 Analiz</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin-bottom:16px">
        <div style="background:var(--acc-l);border-radius:12px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--acc)">${st.avg}</div><div style="font-size:10px;color:var(--txt2)">Ortalama</div></div>
        <div style="background:rgba(52,199,89,.08);border-radius:12px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:#34C759">${st.best}</div><div style="font-size:10px;color:var(--txt2)">En İyi</div></div>
        <div style="background:rgba(255,59,48,.08);border-radius:12px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:#FF3B30">${st.worst}</div><div style="font-size:10px;color:var(--txt2)">En Düşük</div></div>
        <div style="background:rgba(88,86,214,.08);border-radius:12px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:#5856D6">${st.total}</div><div style="font-size:10px;color:var(--txt2)">Toplam</div></div>
        ${target?`<div style="background:rgba(255,159,10,.08);border-radius:12px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:#FF9F0A">${Math.max(0,(target-st.avg)).toFixed(1)}</div><div style="font-size:10px;color:var(--txt2)">Hedefe Kalan</div></div>`:''}
      </div>
      <div id="netChart" style="margin-bottom:16px"></div>
      <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;align-items:center">
        <button class="net-filter-chip ${activeFilter==='all'?'active':''}" data-nf="all" style="--nfc:var(--acc)">Tümü (${nets.length})</button>
        ${EXAM_TYPES.map(t=>{const cnt=nets.filter(n=>n.examType===t.id).length;return cnt?`<button class="net-filter-chip ${activeFilter===t.id?'active':''}" data-nf="${t.id}" style="--nfc:${t.color}">${t.icon} ${t.label} (${cnt})</button>`:''}).join('')}
      </div>
      <div id="netGrid"></div>
      <div id="netAIResult" style="margin-top:16px"></div>`;

    renderChart();renderGrid();

    c.querySelectorAll('[data-nf]').forEach(b=>b.addEventListener('click',()=>{c.querySelectorAll('[data-nf]').forEach(x=>x.classList.remove('active'));b.classList.add('active');activeFilter=b.dataset.nf;fullRender()}));
    $('#netAddBtn').addEventListener('click',openAddPopup);
    $('#netTargetBtn').addEventListener('click',openTargetPopup);
    $('#netAIBtn').addEventListener('click',runAI);
  }

  function renderChart(){
    const src=activeFilter==='all'?nets:nets.filter(n=>n.examType===activeFilter);
    const last8=src.slice(0,8).reverse();
    if(last8.length<2){$('#netChart').innerHTML='';return}
    const maxV=Math.max(...last8.map(n=>n.score),target||0,1);
    const avg=last8.reduce((s,n)=>s+n.score,0)/last8.length;
    $('#netChart').innerHTML=`<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:16px">
      <div style="font-family:var(--fh);font-size:13px;font-weight:700;margin-bottom:12px">Net Gelişimi</div>
      <div style="display:flex;align-items:flex-end;gap:6px;height:120px;position:relative">
        ${target?`<div style="position:absolute;left:0;right:0;bottom:${Math.min(95,target/maxV*100)}%;border-top:2px dashed #FF9F0A;z-index:1"><span style="position:absolute;right:0;top:-16px;font-size:10px;color:#FF9F0A;font-weight:600">🎯 ${target}</span></div>`:''}
        ${last8.map(n=>{const et=EXAM_TYPES.find(t=>t.id===n.examType);const col=et?.color||'var(--acc)';const h=Math.max(8,n.score/maxV*100);
          return`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><div style="font-size:10px;font-weight:700;color:${col}">${n.score}</div><div style="width:100%;height:${h}%;background:${col};border-radius:6px 6px 0 0;min-height:4px;transition:height .4s var(--ease);opacity:.85"></div><div style="font-size:8px;color:var(--txt3);text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${n.name?.substring(0,8)||''}</div></div>`}).join('')}
      </div>
    </div>`;
  }

  function renderGrid(){
    const filtered=activeFilter==='all'?nets:nets.filter(n=>n.examType===activeFilter);
    const grid=$('#netGrid');
    if(!filtered.length){grid.innerHTML='<p style="text-align:center;color:var(--txt3);padding:40px">Sonuç yok.</p>';return}
    grid.innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">${filtered.map(n=>{
      const et=EXAM_TYPES.find(t=>t.id===n.examType)||{color:'var(--acc)',icon:'📋',label:'Deneme'};
      const totalQ=(n.d||0)+(n.y||0)+(n.h||0);
      const subNets=n.subjects||[];
      return`<div class="net-card-v2" style="border-left:4px solid ${et.color}" data-netview="${n.id}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div style="min-width:0;flex:1"><div style="font-weight:700;font-size:14px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${n.name}</div><div style="font-size:11px;color:var(--txt3);margin-top:2px"><span style="color:${et.color};font-weight:600">${et.icon} ${et.label}</span> · ${n.date?new Date(n.date+'T00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'short'}):''}</div></div>
          <div style="text-align:right;flex-shrink:0;margin-left:8px"><div style="font-family:var(--fh);font-size:24px;font-weight:800;color:${et.color}">${n.score}</div><div style="font-size:9px;color:var(--txt3)">net</div></div>
        </div>
        ${totalQ?`<div style="display:flex;gap:8px;margin-top:8px;font-size:11px"><span style="color:#34C759;font-weight:600">✅${n.d||0}</span><span style="color:#FF3B30;font-weight:600">❌${n.y||0}</span><span style="color:var(--txt3)">➖${n.h||0}</span>${n.duration?`<span style="color:var(--txt3);margin-left:auto">⏱${n.duration}dk</span>`:''}</div>
        <div style="height:4px;background:var(--bg2);border-radius:2px;overflow:hidden;margin-top:6px"><div style="display:flex;height:100%"><div style="width:${(n.d||0)/totalQ*100}%;background:#34C759"></div><div style="width:${(n.y||0)/totalQ*100}%;background:#FF3B30"></div></div></div>`:''}
        ${subNets.length?`<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:6px">${subNets.slice(0,4).map(s=>`<span style="font-size:9px;padding:2px 6px;border-radius:50px;background:var(--bg2)">${s.name}:<b>${s.net}</b></span>`).join('')}${subNets.length>4?`<span style="font-size:9px;color:var(--txt3)">+${subNets.length-4}</span>`:''}</div>`:''}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><span style="font-size:10px;color:var(--acc);cursor:pointer" data-netview="${n.id}">Detay →</span><button class="task-del" data-netdel="${n.id}">✕</button></div>
      </div>`}).join('')}</div>`;

    grid.querySelectorAll('[data-netview]').forEach(el=>el.addEventListener('click',(e)=>{if(e.target.closest('.task-del'))return;openDetail(el.dataset.netview)}));
    grid.querySelectorAll('[data-netdel]').forEach(b=>b.addEventListener('click',(e)=>{e.stopPropagation();nets=nets.filter(x=>x.id!==b.dataset.netdel);DS.set('mynets',nets);fullRender()}));
  }

  /* Sonuç Ekle — önce tür seç, sonra form */
  function openAddPopup(){
    let pop=$('#netAddPopup');if(!pop){pop=document.createElement('div');pop.id='netAddPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
    pop.innerHTML=`<div class="popup-card" style="max-width:520px"><div class="popup-hdr"><h2>➕ Sonuç Ekle</h2><button class="popup-close" onclick="$('#netAddPopup').classList.remove('vis')">✕</button></div><div class="popup-body">
      <p style="font-size:13px;color:var(--txt2);margin-bottom:14px">Hangi tür sonuç eklemek istiyorsun?</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px" id="netTypeSelect">${EXAM_TYPES.map(t=>`<button class="wizard-opt" data-net-type="${t.id}" style="display:flex;align-items:center;gap:8px;padding:14px;border-radius:12px;border-left:4px solid ${t.color}"><span style="font-size:20px">${t.icon}</span><span style="font-weight:600">${t.label}</span></button>`).join('')}</div>
    </div></div>`;
    pop.classList.add('vis');
    pop.querySelectorAll('[data-net-type]').forEach(b=>b.addEventListener('click',()=>{
      const selType=EXAM_TYPES.find(t=>t.id===b.dataset.netType);
      showAddForm(pop,selType);
    }));
  }

  function showAddForm(pop,examType){
    pop.querySelector('.popup-body').innerHTML=`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--border)"><span style="font-size:20px">${examType.icon}</span><span style="font-weight:700;color:${examType.color}">${examType.label}</span><button class="filter-btn" style="margin-left:auto;font-size:11px" id="naBackType">← Tür Değiştir</button></div>
      <div style="display:flex;flex-direction:column;gap:12px;max-height:60vh;overflow-y:auto">
        <div style="display:flex;gap:10px"><div style="flex:1"><label class="sp-label">Deneme adı</label><input class="task-input" id="naName" placeholder="ör: ${examType.label} 5" style="width:100%"></div><div style="flex:1"><label class="sp-label">Tarih</label><input type="date" class="task-input" id="naDate" value="${new Date().toISOString().slice(0,10)}" style="width:100%"></div></div>
        <div style="display:flex;gap:10px"><div style="flex:1"><label class="sp-label">Süre (dk)</label><input class="task-input" id="naDur" type="number" placeholder="ör: 135" style="width:100%"></div></div>
        <div style="background:var(--bg);border-radius:var(--r);padding:14px"><div style="font-weight:600;font-size:13px;margin-bottom:10px">Genel Sonuç</div><div style="display:flex;gap:8px"><div style="flex:1"><label class="sp-label">Doğru</label><input class="task-input" id="naD" type="number" min="0" style="width:100%"></div><div style="flex:1"><label class="sp-label">Yanlış</label><input class="task-input" id="naY" type="number" min="0" style="width:100%"></div><div style="flex:1"><label class="sp-label">Boş</label><input class="task-input" id="naH" type="number" min="0" style="width:100%"></div></div><div style="font-size:12px;color:var(--txt3);margin-top:6px" id="naNetPreview">Net: —</div></div>
        <div style="background:var(--bg);border-radius:var(--r);padding:14px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span style="font-weight:600;font-size:13px">Derse Göre Net</span><button class="filter-btn" id="naAddSubject" style="font-size:11px;padding:4px 10px">➕ Ders</button></div><div id="naSubjectList" style="display:flex;flex-direction:column;gap:6px"></div></div>
        <button class="tier-btn-up" id="naSave">Kaydet</button>
      </div>`;
    /* Net önizleme */
    const updatePreview=()=>{const d=parseInt($('#naD')?.value)||0,y=parseInt($('#naY')?.value)||0;$('#naNetPreview').textContent=`Net: ${(d-y*0.25).toFixed(2)}`};
    $('#naD')?.addEventListener('input',updatePreview);$('#naY')?.addEventListener('input',updatePreview);
    /* Tür değiştir */
    $('#naBackType')?.addEventListener('click',()=>openAddPopup());
    /* Ders ekle */
    $('#naAddSubject')?.addEventListener('click',()=>{
      const row=document.createElement('div');row.style.cssText='display:flex;gap:6px;align-items:center';
      row.innerHTML=`<select class="s-select" style="flex:1">${SUBJECTS.map(s=>`<option>${s}</option>`).join('')}</select><input class="task-input" type="number" placeholder="Net" style="width:70px"><button class="task-del" onclick="this.parentElement.remove()">✕</button>`;
      $('#naSubjectList').appendChild(row);
    });
    /* Kaydet */
    $('#naSave')?.addEventListener('click',()=>{
      const name=$('#naName').value.trim();if(!name){showToast('Ad gerekli');return}
      const d=parseInt($('#naD').value)||0,y=parseInt($('#naY').value)||0,h=parseInt($('#naH').value)||0;
      const subjects=[];$('#naSubjectList').querySelectorAll('div').forEach(row=>{const sel=row.querySelector('select');const inp=row.querySelector('input');if(sel&&inp&&inp.value)subjects.push({name:sel.value,net:parseFloat(inp.value)})});
      nets.unshift({id:'net'+Date.now(),name,examType:examType.id,type:examType.label,date:$('#naDate').value,duration:$('#naDur').value||'',d,y,h,score:parseFloat((d-y*0.25).toFixed(2)),subjects});
      DS.set('mynets',nets);pop.classList.remove('vis');fullRender();_autoUpdateGoals();showToast('Kaydedildi!');
    });
  }

  /* Detay popup */
  function openDetail(nid){
    const n=nets.find(x=>x.id===nid);if(!n)return;
    const et=EXAM_TYPES.find(t=>t.id===n.examType)||{color:'var(--acc)',icon:'📋',label:'Deneme'};
    const totalQ=(n.d||0)+(n.y||0)+(n.h||0);const subNets=n.subjects||[];
    let worstSubj='';if(subNets.length){const sorted=[...subNets].sort((a,b)=>a.net-b.net);worstSubj=sorted[0]?.name||''}
    let pop=$('#netDetailPopup');if(!pop){pop=document.createElement('div');pop.id='netDetailPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
    pop.innerHTML=`<div class="popup-card" style="max-width:500px"><div class="popup-hdr"><h2>${et.icon} Detay</h2><button class="popup-close" onclick="$('#netDetailPopup').classList.remove('vis')">✕</button></div><div class="popup-body">
      <div style="text-align:center;margin-bottom:20px"><div style="font-size:42px;font-weight:800;font-family:var(--fh);color:${et.color}">${n.score}</div><div style="font-size:14px;color:var(--txt2)">toplam net</div><div style="font-size:16px;font-weight:700;margin-top:4px">${n.name}</div><div style="font-size:12px;color:var(--txt3)">${et.label} · ${n.date?new Date(n.date+'T00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'}):''} ${n.duration?'· ⏱ '+n.duration+' dk':''}</div></div>
      ${totalQ?`<div style="display:flex;justify-content:center;gap:20px;margin-bottom:16px"><div style="text-align:center"><div style="font-size:22px;font-weight:800;color:#34C759">${n.d||0}</div><div style="font-size:10px;color:var(--txt3)">Doğru</div></div><div style="text-align:center"><div style="font-size:22px;font-weight:800;color:#FF3B30">${n.y||0}</div><div style="font-size:10px;color:var(--txt3)">Yanlış</div></div><div style="text-align:center"><div style="font-size:22px;font-weight:800;color:var(--txt3)">${n.h||0}</div><div style="font-size:10px;color:var(--txt3)">Boş</div></div></div><div style="height:8px;background:var(--bg2);border-radius:4px;overflow:hidden;margin-bottom:16px"><div style="display:flex;height:100%"><div style="width:${(n.d||0)/totalQ*100}%;background:#34C759"></div><div style="width:${(n.y||0)/totalQ*100}%;background:#FF3B30"></div></div></div>`:''}
      ${subNets.length?`<div style="margin-bottom:16px"><div style="font-weight:600;font-size:13px;margin-bottom:10px">Derse Göre</div>${subNets.map(s=>{const pct=Math.min(100,Math.max(5,s.net/40*100));return`<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="font-size:13px;min-width:70px">${s.name}</span><div style="flex:1;height:6px;background:var(--bg2);border-radius:3px;overflow:hidden"><div style="height:100%;background:${et.color};width:${pct}%"></div></div><span style="font-size:13px;font-weight:700;min-width:30px;text-align:right">${s.net}</span></div>`}).join('')}</div>`:''}
      ${worstSubj?`<div style="background:rgba(255,59,48,.06);border:1px solid rgba(255,59,48,.12);border-radius:12px;padding:10px;margin-bottom:10px;font-size:13px;color:#FF3B30;font-weight:600">🔍 En zayıf: ${worstSubj}</div>`:''}
      ${target?`<div style="background:var(--acc-l);border-radius:12px;padding:10px;font-size:13px;color:var(--acc)">🎯 Hedef: ${target} · ${n.score>=target?'✅ Ulaştın!':'⏳ '+(target-n.score).toFixed(1)+' kaldı'}</div>`:''}
    </div></div>`;
    pop.classList.add('vis');
  }

  function openTargetPopup(){
    let pop=$('#netTargetPopup');if(!pop){pop=document.createElement('div');pop.id='netTargetPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
    pop.innerHTML=`<div class="popup-card" style="max-width:340px"><div class="popup-hdr"><h2>🎯 Hedef</h2><button class="popup-close" onclick="$('#netTargetPopup').classList.remove('vis')">✕</button></div><div class="popup-body"><div style="display:flex;flex-direction:column;gap:12px"><div><label class="sp-label">Hedef net</label><input class="task-input" id="netTI" type="number" placeholder="ör: 100" value="${target||''}" style="width:100%"></div><button class="tier-btn-up" id="netTS">Kaydet</button></div></div></div>`;
    pop.classList.add('vis');
    $('#netTS').addEventListener('click',()=>{DS.set('net_target',parseFloat($('#netTI').value)||0);pop.classList.remove('vis');fullRender()});
  }

  async function runAI(){
    const last5=nets.slice(0,5);const st=_stats();
    const prompt=`Deneme sonuçları: ${last5.map(n=>n.name+': '+n.score+' net'+(n.subjects?.length?(' ('+n.subjects.map(s=>s.name+':'+s.net).join(',')+')'):'')).join(' | ')}. Ort: ${st.avg}. ${target?'Hedef: '+target:''} Trend analizi, zayıf ders, öneri. 4 cümle, Türkçe.`;
    const result=await askBilgeForTool(prompt,$('#netAIResult'));
    if(result)$('#netAIResult').innerHTML=`<div style="background:var(--acc-l);border:1px solid var(--acc);border-radius:var(--r);padding:16px"><div style="font-weight:600;margin-bottom:8px">🧠 Analiz:</div><div style="font-size:14px;line-height:1.6">${result}</div></div>`;
  }

  fullRender();
}

function _seedNets(){const n=[
  {id:'net1',name:'TYT Deneme 3',examType:'tyt',type:'TYT Deneme',score:82.5,d:90,y:30,h:0,date:'2026-03-15',duration:'135',subjects:[{name:'Matematik',net:28},{name:'Türkçe',net:32},{name:'Fen',net:12},{name:'Sosyal',net:10.5}]},
  {id:'net2',name:'TYT Deneme 2',examType:'tyt',type:'TYT Deneme',score:76.25,d:84,y:31,h:5,date:'2026-03-08',duration:'130',subjects:[{name:'Matematik',net:24},{name:'Türkçe',net:30},{name:'Fen',net:12},{name:'Sosyal',net:10.25}]},
  {id:'net3',name:'TYT Deneme 1',examType:'tyt',type:'TYT Deneme',score:68,d:76,y:32,h:12,date:'2026-03-01',duration:'140',subjects:[{name:'Matematik',net:20},{name:'Türkçe',net:28},{name:'Fen',net:10},{name:'Sosyal',net:10}]},
  {id:'net4',name:'AYT Deneme 1',examType:'ayt',type:'AYT Deneme',score:52,d:60,y:32,h:28,date:'2026-03-10',duration:'180',subjects:[{name:'Matematik',net:22},{name:'Fizik',net:12},{name:'Kimya',net:10},{name:'Biyoloji',net:8}]},
  {id:'net5',name:'Mat Yazılı',examType:'yazili',type:'Yazılı',score:88,d:22,y:3,h:0,date:'2026-02-28',duration:'40',subjects:[]}
];DS.set('mynets',n);return n}

/* ═══ KENDİ ALANIM ═══ */
function renderMyNotes(){
  const c=$('#page-my-notes');if(!c)return;
  let data=DS.get('my_space')||{notes:[],links:[],folders:[],stickies:[],flashcards:[],summaries:[],locked:[]};
  const _save=()=>DS.set('my_space',data);
  const _date=()=>new Date().toLocaleDateString('tr-TR',{day:'numeric',month:'long'});
  const u=DS.get('user')||{};const lv=u.level||'lise';
  /* Seviyeye göre dersler */
  const _subjects=lv==='ortaokul'?['Matematik','Türkçe','Fen Bilimleri','Sosyal Bilgiler','İngilizce','Din Kültürü']:
    lv==='lise'?['Matematik','Fizik','Kimya','Biyoloji','Türkçe','Edebiyat','Tarih','Coğrafya','Felsefe','İngilizce']:
    lv==='universite'?['Bölüm Dersleri','Matematik','Fizik','İstatistik','Programlama','İngilizce','Diğer']:
    ['Genel Yetenek','Genel Kültür','Eğitim Bilimleri','Alan Bilgisi','İngilizce','Diğer'];

  c.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px">
      <div><h2 style="font-family:var(--fh);font-size:clamp(22px,3vw,28px);font-weight:800">✏️ Kendi Alanım</h2><p style="font-size:14px;color:var(--txt2)">Şahsi çalışma masan</p></div>
    </div>
    <div class="my-space-tabs" id="msTabBar">
      <button class="ms-tab active" data-mst="notes">📝 Notlar</button>
      <button class="ms-tab" data-mst="stickies">📌 Yapışkan</button>
      <button class="ms-tab" data-mst="links">🔗 Linkler</button>
      <button class="ms-tab" data-mst="folders">📂 Klasörler</button>
      <button class="ms-tab" data-mst="flashcards">🗂️ Kartlar</button>
      <button class="ms-tab" data-mst="summaries">📊 Özetler</button>
      <button class="ms-tab" data-mst="locked">🔒 Gizli</button>
    </div>
    <div id="msContent"></div>`;
  let activeTab='notes';
  c.querySelectorAll('.ms-tab').forEach(t=>t.addEventListener('click',()=>{c.querySelectorAll('.ms-tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');activeTab=t.dataset.mst;renderTab()}));

  function renderTab(){
    const mc=$('#msContent');
    ({notes:renderNotes,stickies:renderStickies,links:renderLinks,folders:renderFolders,flashcards:renderFlashcards,summaries:renderSummaries,locked:renderLocked})[activeTab]?.(mc);
  }

  /* ─── BÜYÜK NOT POPUP (resize edilebilir, 4 köşe + 4 kenar) ─── */
  let _isResizing=false;
  function _bigNotePopup(opts,callback){
    let pop=$('#msBigPopup');
    if(!pop){pop=document.createElement('div');pop.id='msBigPopup';pop.className='popup-ov';document.body.appendChild(pop);
      pop.addEventListener('click',e=>{if(e.target===pop&&!_isResizing)pop.classList.remove('vis')});
    }else{
      /* Overlay click'i yeniden ayarla */
      pop.onclick=e=>{if(e.target===pop&&!_isResizing)pop.classList.remove('vis')};
    }
    pop.innerHTML=`<div class="popup-card bn-resizable" id="bnCard" style="width:700px;height:520px;max-width:90vw;min-width:320px;max-height:90vh;min-height:280px;position:relative;overflow:hidden;display:flex;flex-direction:column">
      <div class="bn-resize-handle bn-h-top"></div><div class="bn-resize-handle bn-h-bottom"></div>
      <div class="bn-resize-handle bn-h-left"></div><div class="bn-resize-handle bn-h-right"></div>
      <div class="bn-resize-handle bn-h-tl"></div><div class="bn-resize-handle bn-h-tr"></div>
      <div class="bn-resize-handle bn-h-bl"></div><div class="bn-resize-handle bn-h-br"></div>
      <div class="popup-hdr" style="flex-shrink:0"><h2>${opts.title||'Not'}</h2><div style="display:flex;align-items:center;gap:8px"><span class="bn-resize-hint">⤡ Köşelerden boyutlandır</span><button class="popup-close" onclick="$('#msBigPopup').classList.remove('vis')">✕</button></div></div>
      <div class="popup-body" style="flex:1;display:flex;flex-direction:column;gap:14px;overflow-y:auto;min-height:0">
        <div style="flex-shrink:0"><label class="sp-label">Başlık</label><input class="task-input" id="bnTitle" placeholder="Başlık..." maxlength="100" style="width:100%" value="${opts.defTitle||''}"></div>
        ${opts.showSubject?`<div style="flex-shrink:0"><label class="sp-label">Konu / Ders</label><select class="s-select" id="bnSubject" style="width:100%">${_subjects.map(s=>`<option${opts.defSubject===s?' selected':''}>${s}</option>`).join('')}</select></div>`:''}
        <div style="flex:1;display:flex;flex-direction:column;min-height:0"><label class="sp-label" style="flex-shrink:0">${opts.bodyLabel||'İçerik'}</label><div class="bn-editor" contenteditable="true" id="bnBody" style="width:100%;flex:1;min-height:100px;overflow-y:auto;padding:14px;border-radius:var(--r);border:1.5px solid var(--border);font-size:14px;line-height:1.7;outline:none;background:var(--bg);transition:border-color .2s" onfocus="this.style.borderColor='var(--acc)'" onblur="this.style.borderColor='var(--border)'">${opts.defBody||''}</div></div>
        <button class="tier-btn-up" style="flex-shrink:0" id="bnSave">${opts.saveLabel||'Kaydet'}</button>
      </div>
    </div>`;
    pop.classList.add('vis');
    $('#bnSave').addEventListener('click',()=>{const t=$('#bnTitle').value.trim();if(!t){showToast('Başlık gerekli');return}callback(t,$('#bnBody').innerHTML,$('#bnSubject')?.value||'');pop.classList.remove('vis')});
    setTimeout(()=>$('#bnTitle')?.focus(),100);
    _initResize($('#bnCard'));
  }

  function _initResize(card){
    if(!card)return;
    const handles=card.querySelectorAll('.bn-resize-handle');
    handles.forEach(h=>{
      h.addEventListener('mousedown',e=>{e.preventDefault();e.stopPropagation();
        _isResizing=true;
        const startX=e.clientX,startY=e.clientY;
        const startW=card.offsetWidth,startH=card.offsetHeight;
        const isTop=h.classList.contains('bn-h-top')||h.classList.contains('bn-h-tl')||h.classList.contains('bn-h-tr');
        const isBottom=h.classList.contains('bn-h-bottom')||h.classList.contains('bn-h-bl')||h.classList.contains('bn-h-br');
        const isLeft=h.classList.contains('bn-h-left')||h.classList.contains('bn-h-tl')||h.classList.contains('bn-h-bl');
        const isRight=h.classList.contains('bn-h-right')||h.classList.contains('bn-h-tr')||h.classList.contains('bn-h-br');

        function onMove(ev){
          const dx=ev.clientX-startX,dy=ev.clientY-startY;
          let w=startW,nh=startH;
          if(isRight)w=Math.max(320,Math.min(window.innerWidth-40,startW+dx));
          if(isLeft)w=Math.max(320,Math.min(window.innerWidth-40,startW-dx));
          if(isBottom)nh=Math.max(280,Math.min(window.innerHeight-40,startH+dy));
          if(isTop)nh=Math.max(280,Math.min(window.innerHeight-40,startH-dy));
          card.style.width=w+'px';
          card.style.height=nh+'px';
        }
        function onUp(){
          document.removeEventListener('mousemove',onMove);
          document.removeEventListener('mouseup',onUp);
          document.body.style.cursor='';document.body.style.userSelect='';
          setTimeout(()=>{_isResizing=false},100);
        }
        document.body.style.cursor=getComputedStyle(h).cursor;
        document.body.style.userSelect='none';
        document.addEventListener('mousemove',onMove);
        document.addEventListener('mouseup',onUp);
      });
      /* Touch */
      h.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();_isResizing=true;
        const touch=e.touches[0];const startX=touch.clientX,startY=touch.clientY;
        const startW=card.offsetWidth,startH=card.offsetHeight;
        const isRight=h.classList.contains('bn-h-right')||h.classList.contains('bn-h-tr')||h.classList.contains('bn-h-br');
        const isBottom=h.classList.contains('bn-h-bottom')||h.classList.contains('bn-h-bl')||h.classList.contains('bn-h-br');
        const isLeft=h.classList.contains('bn-h-left')||h.classList.contains('bn-h-tl')||h.classList.contains('bn-h-bl');
        const isTop=h.classList.contains('bn-h-top')||h.classList.contains('bn-h-tl')||h.classList.contains('bn-h-tr');
        function onTM(ev){ev.preventDefault();const t=ev.touches[0];const dx=t.clientX-startX,dy=t.clientY-startY;
          let w=startW,nh=startH;if(isRight)w=Math.max(320,startW+dx);if(isLeft)w=Math.max(320,startW-dx);if(isBottom)nh=Math.max(280,startH+dy);if(isTop)nh=Math.max(280,startH-dy);
          card.style.width=w+'px';card.style.height=nh+'px'}
        function onTE(){document.removeEventListener('touchmove',onTM);document.removeEventListener('touchend',onTE);setTimeout(()=>{_isResizing=false},100)}
        document.addEventListener('touchmove',onTM,{passive:false});document.addEventListener('touchend',onTE);
      },{passive:false});
    });
  }

  /* ─── NOTLAR ─── */
  function renderNotes(mc){
    mc.innerHTML=`<div class="ms-section-header"><button class="tier-btn-up" style="width:auto;padding:8px 18px;font-size:13px" id="msNoteAdd">➕ Yeni Not</button></div><div id="msNoteList" class="ms-card-grid"></div>`;
    const list=$('#msNoteList');
    list.innerHTML=data.notes.length?data.notes.map(n=>`<div class="ms-note-card" data-noteopen="${n.id}"><div class="ms-note-hdr"><b>${n.title}</b><span style="font-size:11px;color:var(--txt3)">${n.subject?n.subject+' · ':''}${n.date}</span></div><div style="font-size:13px;color:var(--txt2);line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${n.content}</div><button class="task-del" data-ndel="${n.id}" style="position:absolute;top:8px;right:8px">✕</button></div>`).join(''):'<p class="ms-empty">İlk notunu ekle!</p>';
    list.querySelectorAll('[data-noteopen]').forEach(el=>el.addEventListener('click',(e)=>{if(e.target.closest('.task-del'))return;const n=data.notes.find(x=>x.id===el.dataset.noteopen);if(n)_bigNotePopup({title:'📝 Not Düzenle',defTitle:n.title,defBody:n.content,defSubject:n.subject,showSubject:true,saveLabel:'Güncelle'},(t,b,s)=>{n.title=t;n.content=b;n.subject=s;_save();renderNotes(mc)})}));
    list.querySelectorAll('[data-ndel]').forEach(b=>b.addEventListener('click',(e)=>{e.stopPropagation();data.notes=data.notes.filter(x=>x.id!==b.dataset.ndel);_save();renderNotes(mc)}));
    $('#msNoteAdd').addEventListener('click',()=>{_bigNotePopup({title:'📝 Yeni Not',showSubject:true,saveLabel:'Ekle'},(t,b,s)=>{data.notes.unshift({id:'n'+Date.now(),title:t,content:b,subject:s,date:_date()});_save();renderNotes(mc)})});
  }

  /* ─── YAPIŞKAN NOTLAR ─── */
  function renderStickies(mc){
    const colors=['#FFF3BF','#D3F9D8','#D0EBFF','#FFE0E0','#E8DAFF','#FFE8CC'];
    mc.innerHTML=`<div class="ms-section-header"><button class="tier-btn-up" style="width:auto;padding:8px 18px;font-size:13px" id="msStickyAdd">➕ Yapışkan</button></div><div id="msStickyList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px"></div>`;
    const list=$('#msStickyList');
    list.innerHTML=data.stickies.length?data.stickies.map(s=>`<div class="ms-sticky" style="background:${s.color||colors[0]}"><div contenteditable="true" data-sid="${s.id}" style="font-size:14px;line-height:1.5;min-height:60px;outline:none;color:#333">${s.text||''}</div><div style="display:flex;justify-content:space-between;margin-top:8px"><span style="font-size:10px;opacity:.5">${s.date||''}</span><button class="task-del" data-sdel="${s.id}" style="font-size:10px">✕</button></div></div>`).join(''):'<p class="ms-empty">Hızlı yapışkan not ekle!</p>';
    list.querySelectorAll('[data-sid]').forEach(el=>el.addEventListener('blur',()=>{const s=data.stickies.find(x=>x.id===el.dataset.sid);if(s){s.text=el.innerHTML;_save()}}));
    list.querySelectorAll('[data-sdel]').forEach(b=>b.addEventListener('click',()=>{data.stickies=data.stickies.filter(x=>x.id!==b.dataset.sdel);_save();renderStickies(mc)}));
    $('#msStickyAdd').addEventListener('click',()=>{const col=colors[data.stickies.length%colors.length];data.stickies.push({id:'s'+Date.now(),text:'',color:col,date:_date()});_save();renderStickies(mc)});
  }

  /* ─── LİNKLER ─── */
  function renderLinks(mc){
    mc.innerHTML=`<div class="ms-section-header"><button class="tier-btn-up" style="width:auto;padding:8px 18px;font-size:13px" id="msLinkAdd">➕ Link</button></div><div id="msLinkList" style="display:flex;flex-direction:column;gap:8px"></div>`;
    const list=$('#msLinkList');
    list.innerHTML=data.links.length?data.links.map(l=>`<div class="ms-link-card"><span style="font-size:18px">${l.icon||'🔗'}</span><div style="flex:1;min-width:0"><div style="font-weight:600;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.title}</div><div style="font-size:12px;color:var(--txt3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.url}</div></div><a href="${l.url}" target="_blank" style="font-size:12px;color:var(--acc);padding:6px 12px;border-radius:50px;background:var(--acc-l);flex-shrink:0">Aç</a><button class="task-del" data-ldel="${l.id}">✕</button></div>`).join(''):'<p class="ms-empty">Faydalı link kaydet!</p>';
    list.querySelectorAll('[data-ldel]').forEach(b=>b.addEventListener('click',()=>{data.links=data.links.filter(x=>x.id!==b.dataset.ldel);_save();renderLinks(mc)}));
    $('#msLinkAdd').addEventListener('click',()=>{
      let pop=$('#msLinkPopup');if(!pop){pop=document.createElement('div');pop.id='msLinkPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
      const icons=['🔗','🎬','📄','🌐','📺','🎵'];
      pop.innerHTML=`<div class="popup-card" style="max-width:420px"><div class="popup-hdr"><h2>🔗 Link Ekle</h2><button class="popup-close" onclick="$('#msLinkPopup').classList.remove('vis')">✕</button></div><div class="popup-body"><div style="display:flex;flex-direction:column;gap:12px"><div><label class="sp-label">Başlık</label><input class="task-input" id="msLnkT" placeholder="ör: Türev videosu" style="width:100%"></div><div><label class="sp-label">URL</label><input class="task-input" id="msLnkU" placeholder="https://..." style="width:100%"></div><div><label class="sp-label">İkon</label><div style="display:flex;gap:6px">${icons.map(ic=>`<button class="wizard-opt" data-lic="${ic}" style="padding:8px 10px;font-size:18px;min-width:0">${ic}</button>`).join('')}</div></div><button class="tier-btn-up" id="msLnkS">Kaydet</button></div></div></div>`;
      pop.classList.add('vis');let si='🔗';
      pop.querySelectorAll('[data-lic]').forEach(b=>{if(b.dataset.lic==='🔗')b.style.borderColor='var(--acc)';b.addEventListener('click',()=>{pop.querySelectorAll('[data-lic]').forEach(x=>x.style.borderColor='var(--border)');b.style.borderColor='var(--acc)';si=b.dataset.lic})});
      $('#msLnkS').addEventListener('click',()=>{const t=$('#msLnkT').value.trim(),ur=$('#msLnkU').value.trim();if(!t||!ur){showToast('İkisi de gerekli');return}data.links.push({id:'l'+Date.now(),title:t,url:ur,icon:si,date:_date()});_save();pop.classList.remove('vis');renderLinks(mc)});
    });
  }

  /* ─── KLASÖRLER ─── */
  function renderFolders(mc){
    mc.innerHTML=`<div class="ms-section-header"><button class="tier-btn-up" style="width:auto;padding:8px 18px;font-size:13px" id="msFolderAdd">➕ Klasör</button></div><div id="msFolderList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px"></div>`;
    const list=$('#msFolderList');
    list.innerHTML=data.folders.length?data.folders.map(f=>`<div class="ms-folder-card" data-fopen="${f.id}"><div style="font-size:32px;margin-bottom:8px">${f.icon||'📂'}</div><div style="font-weight:600;font-size:14px">${f.name}</div><div style="font-size:12px;color:var(--txt3)">${(f.items||[]).length} not</div><button class="task-del" data-fdel="${f.id}" style="position:absolute;top:8px;right:8px">✕</button></div>`).join(''):'<p class="ms-empty">Derslerine göre klasör oluştur!</p>';
    list.querySelectorAll('[data-fopen]').forEach(b=>b.addEventListener('click',(e)=>{if(e.target.closest('.task-del'))return;_openFolder(b.dataset.fopen,mc)}));
    list.querySelectorAll('[data-fdel]').forEach(b=>b.addEventListener('click',(e)=>{e.stopPropagation();data.folders=data.folders.filter(x=>x.id!==b.dataset.fdel);_save();renderFolders(mc)}));
    $('#msFolderAdd').addEventListener('click',()=>{
      const dIcons={'Matematik':'📐','Fizik':'⚡','Kimya':'🧪','Biyoloji':'🧬','Türkçe':'📖','Edebiyat':'📜','Tarih':'🏛️','Coğrafya':'🌍','İngilizce':'🇬🇧','Fen Bilimleri':'🔬','Sosyal Bilgiler':'🌐','Diğer':'📂'};
      let pop=$('#msFolderPopup');if(!pop){pop=document.createElement('div');pop.id='msFolderPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
      pop.innerHTML=`<div class="popup-card" style="max-width:420px"><div class="popup-hdr"><h2>📂 Klasör Oluştur</h2><button class="popup-close" onclick="$('#msFolderPopup').classList.remove('vis')">✕</button></div><div class="popup-body"><p style="font-size:13px;color:var(--txt2);margin-bottom:12px">Bir ders seç veya özel klasör oluştur:</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">${_subjects.map(s=>`<button class="wizard-opt" data-fsubj="${s}" style="display:flex;align-items:center;gap:8px;padding:10px 12px;font-size:13px"><span>${dIcons[s]||'📂'}</span>${s}</button>`).join('')}</div><div style="display:flex;gap:8px"><input class="task-input" id="msFolderCustom" placeholder="Özel klasör adı..." style="flex:1"><button class="filter-btn" id="msFolderCustomBtn">Oluştur</button></div></div></div>`;
      pop.classList.add('vis');
      pop.querySelectorAll('[data-fsubj]').forEach(b=>b.addEventListener('click',()=>{data.folders.push({id:'f'+Date.now(),name:b.dataset.fsubj,icon:dIcons[b.dataset.fsubj]||'📂',items:[]});_save();pop.classList.remove('vis');renderFolders(mc)}));
      $('#msFolderCustomBtn').addEventListener('click',()=>{const v=$('#msFolderCustom').value.trim();if(!v)return;data.folders.push({id:'f'+Date.now(),name:v,icon:'📂',items:[]});_save();pop.classList.remove('vis');renderFolders(mc)});
    });
  }
  function _openFolder(fid,mc){
    const f=data.folders.find(x=>x.id===fid);if(!f)return;
    mc.innerHTML=`<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px"><button class="filter-btn" id="msFolderBack">← Geri</button><span style="font-size:24px">${f.icon}</span><span style="font-family:var(--fh);font-size:18px;font-weight:700">${f.name}</span><span style="font-size:12px;color:var(--txt3)">${(f.items||[]).length} not</span></div>
      <div class="ms-section-header"><button class="tier-btn-up" style="width:auto;padding:8px 18px;font-size:13px" id="msFItemAdd">➕ Not Ekle</button></div>
      <div id="msFItemList" class="ms-card-grid"></div>`;
    const il=$('#msFItemList');const items=f.items||[];
    il.innerHTML=items.length?items.map(it=>`<div class="ms-note-card" data-fitopen="${it.id}"><div class="ms-note-hdr"><b>${it.title}</b><span style="font-size:11px;color:var(--txt3)">${it.date||''}</span></div><div style="font-size:13px;color:var(--txt2);line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${it.content}</div><button class="task-del" data-fitdel="${it.id}" style="position:absolute;top:8px;right:8px">✕</button></div>`).join(''):'<p class="ms-empty">Bu klasör boş</p>';
    il.querySelectorAll('[data-fitopen]').forEach(el=>el.addEventListener('click',(e)=>{if(e.target.closest('.task-del'))return;const it=items.find(x=>x.id===el.dataset.fitopen);if(it)_bigNotePopup({title:'📝 Not Düzenle',defTitle:it.title,defBody:it.content,saveLabel:'Güncelle'},(t,b)=>{it.title=t;it.content=b;_save();_openFolder(fid,mc)})}));
    il.querySelectorAll('[data-fitdel]').forEach(b=>b.addEventListener('click',(e)=>{e.stopPropagation();f.items=f.items.filter(x=>x.id!==b.dataset.fitdel);_save();_openFolder(fid,mc)}));
    $('#msFolderBack').addEventListener('click',()=>renderFolders(mc));
    $('#msFItemAdd').addEventListener('click',()=>{_bigNotePopup({title:'📝 Not Ekle',saveLabel:'Ekle'},(t,b)=>{f.items.push({id:'fi'+Date.now(),title:t,content:b,date:_date()});_save();_openFolder(fid,mc)})});
  }

  /* ─── FORMÜL KARTLARI — Derslere göre kategorili ─── */
  function renderFlashcards(mc){
    mc.innerHTML=`<div class="ms-section-header"><button class="tier-btn-up" style="width:auto;padding:8px 18px;font-size:13px" id="msCardAdd">➕ Yeni Kart</button></div><div id="msCardList"></div>`;
    /* Derslere göre grupla */
    const grouped={};data.flashcards.forEach(fc=>{const s=fc.subject||'Diğer';if(!grouped[s])grouped[s]=[];grouped[s].push(fc)});
    const list=$('#msCardList');
    if(!data.flashcards.length){list.innerHTML='<p class="ms-empty">Formül veya bilgi kartı oluştur!</p>';} 
    else{list.innerHTML=Object.entries(grouped).map(([subj,cards])=>`<div style="margin-bottom:20px"><div style="font-family:var(--fh);font-size:14px;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border)">${subj} (${cards.length})</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">${cards.map(fc=>`<div class="ms-flashcard" data-fcflip="${fc.id}"><div class="ms-fc-front"><div style="font-size:15px;font-weight:600;text-align:center;word-break:break-word">${fc.front}</div><div style="font-size:10px;color:var(--txt3);margin-top:8px">tıkla → cevap</div></div><div class="ms-fc-back" style="display:none"><div style="font-size:14px;text-align:center;word-break:break-word;line-height:1.6">${fc.back}</div></div><button class="task-del" data-fcdel="${fc.id}" style="position:absolute;top:6px;right:6px">✕</button></div>`).join('')}</div></div>`).join('')}
    list.querySelectorAll('[data-fcflip]').forEach(card=>card.addEventListener('click',(e)=>{if(e.target.closest('.task-del'))return;const fr=card.querySelector('.ms-fc-front'),bk=card.querySelector('.ms-fc-back');const show=fr.style.display!=='none';fr.style.display=show?'none':'block';bk.style.display=show?'block':'none'}));
    list.querySelectorAll('[data-fcdel]').forEach(b=>b.addEventListener('click',(e)=>{e.stopPropagation();data.flashcards=data.flashcards.filter(x=>x.id!==b.dataset.fcdel);_save();renderFlashcards(mc)}));
    $('#msCardAdd').addEventListener('click',()=>{
      let pop=$('#msFCPopup');if(!pop){pop=document.createElement('div');pop.id='msFCPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
      pop.innerHTML=`<div class="popup-card" style="max-width:500px"><div class="popup-hdr"><h2>🗂️ Formül / Bilgi Kartı</h2><button class="popup-close" onclick="$('#msFCPopup').classList.remove('vis')">✕</button></div><div class="popup-body"><div style="display:flex;flex-direction:column;gap:14px">
        <div><label class="sp-label">Ders</label><select class="s-select" id="msFCSubj" style="width:100%">${_subjects.map(s=>`<option>${s}</option>`).join('')}</select></div>
        <div><label class="sp-label">Ön yüz (soru / formül adı / terim)</label><textarea class="task-input" id="msFCFront" placeholder="ör: Pisagor Teoremi nedir?" style="width:100%;min-height:70px;resize:vertical;border-radius:var(--r);padding:12px 16px"></textarea></div>
        <div><label class="sp-label">Arka yüz (cevap / formül / açıklama)</label><textarea class="task-input" id="msFCBack" placeholder="ör: a² + b² = c²&#10;Dik üçgende hipotenüsün karesi..." style="width:100%;min-height:100px;resize:vertical;border-radius:var(--r);padding:12px 16px"></textarea></div>
        <button class="tier-btn-up" id="msFCSave">Ekle</button></div></div></div>`;
      pop.classList.add('vis');
      $('#msFCSave').addEventListener('click',()=>{const f=$('#msFCFront').value.trim(),b=$('#msFCBack').value.trim(),s=$('#msFCSubj').value;if(!f||!b){showToast('İki yüz de gerekli');return}data.flashcards.push({id:'fc'+Date.now(),front:f,back:b,subject:s});_save();pop.classList.remove('vis');renderFlashcards(mc)});
    });
  }

  /* ─── ÖZET ÇIKARMA ─── */
  function renderSummaries(mc){
    mc.innerHTML=`<div class="ms-section-header"><button class="tier-btn-up" style="width:auto;padding:8px 18px;font-size:13px" id="msSumAdd">➕ Yeni Özet</button></div><div id="msSumList" class="ms-card-grid"></div>`;
    const list=$('#msSumList');
    list.innerHTML=data.summaries.length?data.summaries.map(s=>`<div class="ms-note-card" style="border-left:4px solid var(--acc)" data-sumopen="${s.id}"><div class="ms-note-hdr"><b>${s.title}</b><span style="font-size:11px;color:var(--txt3)">${s.subject||''} · ${s.date||''}</span></div><div style="font-size:13px;color:var(--txt2);line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${s.content}</div><button class="task-del" data-sumdel="${s.id}" style="position:absolute;top:8px;right:8px">✕</button></div>`).join(''):'<p class="ms-empty">Konu özeti oluştur!</p>';
    list.querySelectorAll('[data-sumopen]').forEach(el=>el.addEventListener('click',(e)=>{if(e.target.closest('.task-del'))return;const s=data.summaries.find(x=>x.id===el.dataset.sumopen);if(s)_bigNotePopup({title:'📊 Özet Düzenle',defTitle:s.title,defBody:s.content,defSubject:s.subject,showSubject:true,saveLabel:'Güncelle'},(t,b,subj)=>{s.title=t;s.content=b;s.subject=subj;_save();renderSummaries(mc)})}));
    list.querySelectorAll('[data-sumdel]').forEach(b=>b.addEventListener('click',(e)=>{e.stopPropagation();data.summaries=data.summaries.filter(x=>x.id!==b.dataset.sumdel);_save();renderSummaries(mc)}));
    $('#msSumAdd').addEventListener('click',()=>{_bigNotePopup({title:'📊 Yeni Özet',showSubject:true,bodyLabel:'Özet içeriği',saveLabel:'Oluştur'},(t,b,s)=>{data.summaries.unshift({id:'sum'+Date.now(),title:t,content:b,subject:s,date:_date()});_save();renderSummaries(mc)})});
  }

  /* ─── ŞİFRELİ NOTLAR + PIN sıfırlama (popup) ─── */
  function renderLocked(mc){
    const unlocked=DS.get('ms_unlocked');
    if(!unlocked){
      mc.innerHTML=`<div style="text-align:center;padding:40px"><div style="font-size:48px;margin-bottom:12px">🔒</div><p style="font-size:14px;color:var(--txt2);margin-bottom:16px">Bu bölüm PIN ile korumalıdır</p>
        <div style="display:flex;gap:8px;justify-content:center;align-items:center;margin-bottom:12px"><input type="password" class="task-input" id="msLockPin" placeholder="● ● ● ●" maxlength="4" style="width:140px;text-align:center;letter-spacing:8px;font-size:20px"><button class="tier-btn-up" style="width:auto;padding:10px 20px" id="msLockBtn">${DS.get('ms_pin')?'Aç':'PIN Oluştur'}</button></div>
        ${DS.get('ms_pin')?`<button style="font-size:12px;color:var(--txt3);background:none;border:none;cursor:pointer" id="msPinReset">PIN'imi unuttum</button>`:''}</div>`;
      $('#msLockBtn').addEventListener('click',()=>{
        const pin=$('#msLockPin').value;if(pin.length!==4){showToast('4 haneli PIN gir');return}
        const saved=DS.get('ms_pin');
        if(!saved){
          /* Yeni PIN — güvenlik sorusu popup'ı */
          DS.set('ms_pin',pin);
          _pinSecurityPopup(()=>{DS.set('ms_unlocked',true);showToast('PIN oluşturuldu!');renderLocked(mc)});
          return;
        }
        if(pin===saved){DS.set('ms_unlocked',true);renderLocked(mc)}else showToast('Yanlış PIN!');
      });
      $('#msPinReset')?.addEventListener('click',()=>{
        const q=DS.get('ms_security_q');
        if(!q){_pinConfirmResetPopup(mc);return}
        _pinAnswerPopup(q,mc);
      });return;
    }
    mc.innerHTML=`<div class="ms-section-header"><button class="tier-btn-up" style="width:auto;padding:8px 18px;font-size:13px" id="msLockedAdd">➕ Gizli Not</button><button class="filter-btn" style="margin-left:auto" id="msLockAgain">🔒 Kilitle</button></div><div id="msLockedList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px"></div>`;
    const list=$('#msLockedList');
    list.innerHTML=data.locked.length?data.locked.map(l=>`<div class="ms-note-card" style="border-left:4px solid #FF3B30" data-lockopen="${l.id}"><div class="ms-note-hdr"><b>🔒 ${l.title}</b><span style="font-size:11px;color:var(--txt3)">${l.date||''}</span></div><div style="font-size:13px;color:var(--txt2);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${l.content}</div><button class="task-del" data-lockdel="${l.id}" style="position:absolute;top:8px;right:8px">✕</button></div>`).join(''):'<p class="ms-empty">Gizli not ekle — sadece PIN ile erişilir</p>';
    list.querySelectorAll('[data-lockopen]').forEach(el=>el.addEventListener('click',(e)=>{if(e.target.closest('.task-del'))return;const l=data.locked.find(x=>x.id===el.dataset.lockopen);if(l)_bigNotePopup({title:'🔒 Gizli Not',defTitle:l.title,defBody:l.content,saveLabel:'Güncelle'},(t,b)=>{l.title=t;l.content=b;_save();renderLocked(mc)})}));
    list.querySelectorAll('[data-lockdel]').forEach(b=>b.addEventListener('click',(e)=>{e.stopPropagation();data.locked=data.locked.filter(x=>x.id!==b.dataset.lockdel);_save();renderLocked(mc)}));
    $('#msLockedAdd').addEventListener('click',()=>{_bigNotePopup({title:'🔒 Gizli Not Ekle',saveLabel:'Ekle'},(t,b)=>{data.locked.push({id:'lk'+Date.now(),title:t,content:b,date:_date()});_save();renderLocked(mc)})});
    $('#msLockAgain').addEventListener('click',()=>{DS.remove('ms_unlocked');renderLocked(mc);showToast('Kilitlendi 🔒')});
  }

  /* ─── PIN POPUP HELPERS ─── */
  function _pinSecurityPopup(onDone){
    let pop=$('#msPinSecPopup');
    if(!pop){pop=document.createElement('div');pop.id='msPinSecPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
    pop.innerHTML=`<div class="popup-card" style="max-width:420px"><div class="popup-hdr"><h2>🔐 Güvenlik Sorusu</h2><button class="popup-close" onclick="$('#msPinSecPopup').classList.remove('vis')">✕</button></div><div class="popup-body">
      <p style="font-size:13px;color:var(--txt2);margin-bottom:14px">PIN'ini unutursan bu soruyla sıfırlayabilirsin.</p>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div><label class="sp-label">Güvenlik Sorusu</label><input class="task-input" id="pinSecQ" placeholder="ör: İlk okulunun adı neydi?" style="width:100%"></div>
        <div><label class="sp-label">Cevabı</label><input class="task-input" id="pinSecA" placeholder="Cevabını yaz..." style="width:100%"></div>
        <div style="display:flex;gap:8px"><button class="tier-btn-up" id="pinSecSave" style="flex:1">Kaydet</button><button class="filter-btn" id="pinSecSkip" style="flex:1">Atla</button></div>
      </div>
    </div></div>`;
    pop.classList.add('vis');
    $('#pinSecSave').addEventListener('click',()=>{const q=$('#pinSecQ').value.trim(),a=$('#pinSecA').value.trim();if(!q||!a){showToast('İkisi de gerekli');return}DS.set('ms_security_q',q);DS.set('ms_security_a',a.toLowerCase().trim());pop.classList.remove('vis');onDone()});
    $('#pinSecSkip').addEventListener('click',()=>{pop.classList.remove('vis');onDone()});
  }

  function _pinAnswerPopup(question,mc){
    let pop=$('#msPinAnsPopup');
    if(!pop){pop=document.createElement('div');pop.id='msPinAnsPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
    pop.innerHTML=`<div class="popup-card" style="max-width:420px"><div class="popup-hdr"><h2>🔐 PIN Sıfırlama</h2><button class="popup-close" onclick="$('#msPinAnsPopup').classList.remove('vis')">✕</button></div><div class="popup-body">
      <p style="font-size:14px;font-weight:600;margin-bottom:14px">${question}</p>
      <div style="display:flex;flex-direction:column;gap:14px">
        <input class="task-input" id="pinAnsInp" placeholder="Cevabını yaz..." style="width:100%">
        <button class="tier-btn-up" id="pinAnsCheck">Kontrol Et</button>
      </div>
    </div></div>`;
    pop.classList.add('vis');
    $('#pinAnsCheck').addEventListener('click',()=>{
      const ans=$('#pinAnsInp').value.trim();
      if(ans.toLowerCase()===DS.get('ms_security_a')){DS.remove('ms_pin');DS.remove('ms_unlocked');pop.classList.remove('vis');showToast('PIN sıfırlandı! Yeni PIN oluştur.');renderLocked(mc)}
      else showToast('Yanlış cevap!');
    });
  }

  function _pinConfirmResetPopup(mc){
    let pop=$('#msPinResetPopup');
    if(!pop){pop=document.createElement('div');pop.id='msPinResetPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
    pop.innerHTML=`<div class="popup-card" style="max-width:400px"><div class="popup-hdr"><h2>⚠️ PIN Sıfırlama</h2><button class="popup-close" onclick="$('#msPinResetPopup').classList.remove('vis')">✕</button></div><div class="popup-body" style="text-align:center">
      <p style="font-size:14px;color:var(--txt2);margin-bottom:16px">Güvenlik sorusu ayarlanmamış. PIN'i sıfırlamak için <b>tüm gizli notlar silinecek</b>.</p>
      <div style="display:flex;gap:8px"><button class="tier-btn-up" style="flex:1;background:var(--danger)" id="pinResetConfirm">Sıfırla</button><button class="filter-btn" style="flex:1" onclick="$('#msPinResetPopup').classList.remove('vis')">İptal</button></div>
    </div></div>`;
    pop.classList.add('vis');
    $('#pinResetConfirm').addEventListener('click',()=>{DS.remove('ms_pin');DS.remove('ms_unlocked');DS.remove('ms_security_q');DS.remove('ms_security_a');data.locked=[];_save();pop.classList.remove('vis');showToast('PIN sıfırlandı');renderLocked(mc)});
  }

  renderTab();
}

/* ═══ SORU CEVAP (yorumlu) ═══ */
function renderQA(){
  const c=$('#page-qa');if(!c)return;
  let questions=DS.get('qa')||_seedQA();
  const u=DS.get('user')||{};const lv=u.level||'lise';
  const myName=u.name||'Sen';
  const _subjects=lv==='ortaokul'?['Matematik','Türkçe','Fen','Sosyal','İngilizce']:
    lv==='lise'?['Matematik','Fizik','Kimya','Biyoloji','Türkçe','Edebiyat','Tarih','Coğrafya','İngilizce']:
    lv==='universite'?['Bölüm','Matematik','İngilizce','Proje']:['GY','GK','Alan','İngilizce'];

  /* Hazır soru şablonları — derse göre */
  const Q_TEMPLATES=[
    {cat:'❓ Konu Sorusu',items:['Bu konuyu anlamadım, açıklayabilir misiniz?','Bu formül nasıl uygulanır?','Bu kavram ne anlama geliyor?','Bu konunun özeti var mı?','Hangi kaynaktan çalışmalıyım?']},
    {cat:'📝 Soru Çözüm',items:['Şu soruyu çözen var mı?','Bu tarz sorular nasıl çözülür?','Çözüm yolunu anlatır mısınız?','Adım adım çözümü paylaşır mısınız?','Benzer soru önerebilir misiniz?']},
    {cat:'📚 Kaynak',items:['Bu konu için kaynak önerir misiniz?','Video anlatım bilen var mı?','PDF/not paylaşır mısınız?','Hangi kitaptan çalışayım?','Online test linki olan var mı?']},
    {cat:'🎯 Sınav',items:['Bu konu sınavda çıkar mı?','Sınava nasıl hazırlanmalıyım?','Deneme önerir misiniz?','Bu konunun sınav ağırlığı ne kadar?','Son tekrar için ne yapmalıyım?']}
  ];

  /* Hazır yorum/tepki seçenekleri */
  const REACTIONS_POSITIVE=['👍 Teşekkürler, anlaşıldı','💡 Çok faydalı oldu','✅ Doğru cevap','📌 Bunu da merak ediyordum','🙏 Çok sağ ol'];
  const REACTIONS_NEGATIVE=['❌ Yanlış bilgi sanırım','🤔 Tam anlamadım','📖 Daha detay lazım','⚠️ Farklı bir kaynak gerekli','🔄 Konuyu tekrar açıklar mısınız?'];

  let activeFilter='all';

  function fullRender(){
    c.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px">
        <div><h2 style="font-family:var(--fh);font-size:clamp(22px,3vw,28px);font-weight:800">💬 Soru Cevap</h2><p style="font-size:14px;color:var(--txt2)">Sor, cevapla, öğren</p></div>
        <button class="tier-btn-up" style="width:auto;padding:10px 20px" id="qaAddBtn">➕ Soru Sor</button>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap">
        <button class="net-filter-chip ${activeFilter==='all'?'active':''}" data-qf="all" style="--nfc:var(--acc)">Tümü (${questions.length})</button>
        ${_subjects.map(s=>{const cnt=questions.filter(q=>q.subject===s).length;return cnt?`<button class="net-filter-chip ${activeFilter===s?'active':''}" data-qf="${s}" style="--nfc:var(--txt2)">${s} (${cnt})</button>`:''}).join('')}
      </div>
      <div id="qaList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px"></div>`;

    renderCards();

    /* Filtre */
    c.querySelectorAll('[data-qf]').forEach(b=>b.addEventListener('click',()=>{c.querySelectorAll('[data-qf]').forEach(x=>x.classList.remove('active'));b.classList.add('active');activeFilter=b.dataset.qf;renderCards()}));

    /* Soru sor popup */
    $('#qaAddBtn').addEventListener('click',()=>{
      let pop=$('#qaAddPopup');if(!pop){pop=document.createElement('div');pop.id='qaAddPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
      pop.innerHTML=`<div class="popup-card" style="max-width:500px"><div class="popup-hdr"><h2>❓ Soru Sor</h2><button class="popup-close" onclick="$('#qaAddPopup').classList.remove('vis')">✕</button></div><div class="popup-body">
        <div style="display:flex;flex-direction:column;gap:16px">
          <div><label class="sp-label">Ders</label><select class="s-select" id="qaSubject" style="width:100%">${_subjects.map(s=>`<option>${s}</option>`).join('')}</select></div>
          <div><label class="sp-label">Kategori</label><div style="display:flex;flex-wrap:wrap;gap:4px" id="qaCatBtns">${Q_TEMPLATES.map((t,i)=>`<button class="wizard-opt" data-qact="${i}" style="padding:8px 12px;font-size:12px">${t.cat}</button>`).join('')}</div></div>
          <div id="qaTemplateItems" style="display:none"><label class="sp-label">Soru Seç</label><div style="display:flex;flex-direction:column;gap:6px" id="qaItemList"></div></div>
          <button class="tier-btn-up" id="qaSave" style="opacity:.5" disabled>Gönder</button>
        </div></div></div>`;
      pop.classList.add('vis');
      let selCat=null,selItem=null;
      pop.querySelectorAll('[data-qact]').forEach(b=>b.addEventListener('click',()=>{
        const ci=parseInt(b.dataset.qact);selCat=Q_TEMPLATES[ci];selItem=null;
        pop.querySelectorAll('[data-qact]').forEach(x=>x.style.borderColor='var(--border)');b.style.borderColor='var(--acc)';
        const area=$('#qaTemplateItems');area.style.display='block';
        const list=$('#qaItemList');
        list.innerHTML=selCat.items.map(it=>`<button class="grp-msg-item" data-qait="${it}" style="font-size:13px;padding:10px 14px;border-radius:12px;border:1px solid var(--border);background:var(--white);cursor:pointer;transition:all .12s;text-align:left;width:100%">${it}</button>`).join('');
        list.querySelectorAll('.grp-msg-item').forEach(mi=>mi.addEventListener('click',()=>{
          selItem=mi.dataset.qait;
          list.querySelectorAll('.grp-msg-item').forEach(x=>{x.style.borderColor='var(--border)';x.style.background='var(--white)'});
          mi.style.borderColor='var(--acc)';mi.style.background='var(--acc-l)';
          $('#qaSave').style.opacity='1';$('#qaSave').disabled=false;
        }));
      }));
      $('#qaSave').addEventListener('click',()=>{
        if(!selItem){showToast('Soru seç');return}
        const spam=_checkSpam();if(spam.blocked){showToast(spam.msg);return}
        questions.unshift({id:'qa'+Date.now(),userId:'self',subject:$('#qaSubject').value,text:selItem,likes:0,reactions:[],time:'Az önce'});
        DS.set('qa',questions);pop.classList.remove('vis');fullRender();showToast('Soru gönderildi!');
      });
    });
  }

  function renderCards(){
    const filtered=activeFilter==='all'?questions:questions.filter(q=>q.subject===activeFilter);
    const users=DS.get('users')||[];const me=DS.get('user');
    const list=$('#qaList');
    list.innerHTML=filtered.length?filtered.map(q=>{
      const usr=q.userId==='self'?{name:me?.name||'Sen',initials:me?.initials||'?',color:'var(--acc)'}:users.find(x=>x.id===q.userId)||{name:'Anonim',initials:'?',color:'#999'};
      const reactions=q.reactions||[];
      return`<div class="qa-card-v2">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div style="width:32px;height:32px;border-radius:50%;background:${usr.color};display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;flex-shrink:0">${usr.initials||usr.name[0]}</div>
          <div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13px">${usr.name}</div><div style="font-size:10px;color:var(--txt3)">${q.time||''}</div></div>
          ${q.subject?`<span style="font-size:10px;padding:3px 8px;border-radius:50px;background:var(--acc-l);color:var(--acc);font-weight:600;flex-shrink:0">${q.subject}</span>`:''}
        </div>
        <div style="font-size:14px;font-weight:500;line-height:1.5;margin-bottom:12px">${q.text}</div>
        ${reactions.length?`<div style="margin-bottom:10px;display:flex;flex-direction:column;gap:6px">${reactions.map(r=>`<div style="display:flex;gap:6px;align-items:flex-start;padding:8px 10px;background:var(--bg);border-radius:10px;font-size:12px"><span style="font-weight:600;flex-shrink:0">${r.author}:</span><span style="color:var(--txt2)">${r.text}</span></div>`).join('')}</div>`:''}
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
          <button style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--txt3);background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:50px;transition:all .12s" data-qlike="${q.id}">👍 ${q.likes}</button>
          <button style="font-size:11px;color:var(--acc);background:none;border:none;cursor:pointer;padding:4px 8px" data-qreact="${q.id}">💬 Yanıtla</button>
          ${q.userId==='self'?`<button class="task-del" style="margin-left:auto" data-qdel="${q.id}">✕</button>`:''}
        </div>
        <div class="qa-react-area" id="qr-${q.id}" style="display:none;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
          <div style="font-size:11px;color:var(--txt3);margin-bottom:6px">Yanıt seç:</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">${REACTIONS_POSITIVE.map(r=>`<button class="grp-msg-item qa-r-btn" data-qrid="${q.id}" data-qrtxt="${r}" style="font-size:10px;padding:5px 10px;border-radius:50px;border:1px solid var(--border);background:var(--white);cursor:pointer">${r}</button>`).join('')}</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">${REACTIONS_NEGATIVE.map(r=>`<button class="grp-msg-item qa-r-btn" data-qrid="${q.id}" data-qrtxt="${r}" style="font-size:10px;padding:5px 10px;border-radius:50px;border:1px solid var(--border);background:var(--white);cursor:pointer">${r}</button>`).join('')}</div>
        </div>
      </div>`}).join(''):'<p style="text-align:center;color:var(--txt3);padding:40px;grid-column:1/-1">Bu kategoride soru yok.</p>';

    /* Like */
    list.querySelectorAll('[data-qlike]').forEach(b=>b.addEventListener('click',()=>{const q=questions.find(x=>x.id===b.dataset.qlike);if(q){q.likes++;DS.set('qa',questions);renderCards()}}));
    /* Yanıtla toggle */
    list.querySelectorAll('[data-qreact]').forEach(b=>b.addEventListener('click',()=>{const area=$('#qr-'+b.dataset.qreact);if(area)area.style.display=area.style.display==='none'?'block':'none'}));
    /* Yanıt gönder */
    list.querySelectorAll('.qa-r-btn').forEach(b=>b.addEventListener('click',()=>{
      const q=questions.find(x=>x.id===b.dataset.qrid);if(!q)return;
      const spam=_checkSpam();if(spam.blocked){showToast(spam.msg);return}
      if(!q.reactions)q.reactions=[];
      q.reactions.push({author:myName,text:b.dataset.qrtxt});
      DS.set('qa',questions);renderCards();showToast('Yanıt eklendi');
    }));
    /* Sil */
    list.querySelectorAll('[data-qdel]').forEach(b=>b.addEventListener('click',()=>{questions=questions.filter(x=>x.id!==b.dataset.qdel);DS.set('qa',questions);renderCards()}));
  }

  fullRender();
}
function _seedQA(){return[
  {id:'qa1',userId:'u1',subject:'Matematik',text:'Bu formül nasıl uygulanır?',likes:12,reactions:[{author:'Emre D.',text:'👍 Teşekkürler, anlaşıldı'},{author:'Selin A.',text:'💡 Çok faydalı oldu'}],time:'1 saat önce'},
  {id:'qa2',userId:'u3',subject:'Türkçe',text:'Şu soruyu çözen var mı?',likes:28,reactions:[{author:'Burak Ö.',text:'✅ Doğru cevap'}],time:'3 saat önce'},
  {id:'qa3',userId:'u5',subject:'Fizik',text:'Bu konuyu anlamadım, açıklayabilir misiniz?',likes:15,reactions:[],time:'Dün'},
  {id:'qa4',userId:'u2',subject:'Kimya',text:'Bu konu sınavda çıkar mı?',likes:8,reactions:[{author:'Elif Ç.',text:'📌 Bunu da merak ediyordum'}],time:'2 gün önce'}
]}

/* ═══ NOT İSTE (yorumlu) ═══ */
function renderRequest(){
  const c=$('#page-request');if(!c)return;
  let requests=DS.get('note_requests')||_seedRequests();
  c.innerHTML=`<div style="margin-bottom:24px"><h2 style="font-family:var(--fh);font-size:clamp(22px,3vw,28px);font-weight:800">📋 Not İste</h2><p style="font-size:14px;color:var(--txt2)">Topluluktan ihtiyacın olan notu talep et</p></div>
    <div class="task-add-row"><input class="task-input" id="reqInput" placeholder="Hangi konuda not?" style="flex:1"><select class="s-select" id="reqSubject"><option>Matematik</option><option>Fizik</option><option>Kimya</option><option>Biyoloji</option><option>Türkçe</option><option>Tarih</option><option>Edebiyat</option><option>Diğer</option></select><button class="tier-btn-up" id="reqAddBtn" style="width:auto;padding:10px 20px">İste</button></div><div id="reqList"></div>`;
  function render(){
    const users=DS.get('users')||[];const me=DS.get('user');
    $('#reqList').innerHTML=requests.map(r=>{const u=r.userId==='self'?{name:me?.name||'Sen',initials:me?.initials||'?',color:'var(--acc)'}:users.find(x=>x.id===r.userId)||{name:'Anonim',initials:'?',color:'#999'};
      const comments=r.comments||[];
      return`<div class="qa-card"><div class="ncard-top"><div class="ncard-av" style="background:${u.color}">${u.initials}</div><span class="ncard-author">${u.name}</span><span class="ncard-tag" style="margin-left:auto">${r.subject}</span></div><p style="font-size:14px;margin:10px 0">${r.text}</p><div style="display:flex;gap:12px;font-size:12px;color:var(--txt3)"><button style="font-size:12px;color:var(--acc)" data-rcmt="${r.id}">💬 ${comments.length} yanıt</button><span>${r.time}</span></div>
      <div id="rc-${r.id}" style="display:none;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">${comments.map(cm=>`<div style="padding:6px 0;font-size:13px"><b>${cm.author}:</b> ${cm.text}</div>`).join('')}<div style="display:flex;gap:8px;margin-top:8px"><input class="task-input" placeholder="Yanıt yaz..." style="flex:1;height:36px" data-rcinp="${r.id}"><button class="filter-btn" style="font-size:12px" data-rcsend="${r.id}">Gönder</button></div></div></div>`}).join('');
    $('#reqList').querySelectorAll('[data-rcmt]').forEach(b=>b.addEventListener('click',()=>{const el=$('#rc-'+b.dataset.rcmt);if(el)el.style.display=el.style.display==='none'?'block':'none'}));
    $('#reqList').querySelectorAll('[data-rcsend]').forEach(b=>b.addEventListener('click',()=>{const inp=$(`[data-rcinp="${b.dataset.rcsend}"]`);const v=inp.value.trim();if(!v)return;const r=requests.find(x=>x.id===b.dataset.rcsend);if(r){r.comments=r.comments||[];r.comments.push({author:DS.get('user')?.name||'Sen',text:v});DS.set('note_requests',requests);render();$('#rc-'+r.id).style.display='block'}}));
  }
  $('#reqAddBtn').addEventListener('click',()=>{const v=$('#reqInput').value.trim(),s=$('#reqSubject').value;if(!v)return;requests.unshift({id:'req'+Date.now(),userId:'self',text:v,subject:s,comments:[],time:'Az önce'});DS.set('note_requests',requests);$('#reqInput').value='';render()});
  render();
}
function _seedRequests(){return[{id:'req1',userId:'u2',text:'İntegral alma kuralları özet not arıyorum',subject:'Matematik',comments:[{author:'Zeynep',text:'Paylaştım, profilimdeki notlara bak!'}],time:'2 saat önce'},{id:'req2',userId:'u4',text:'Osmanlı kronolojisi özet',subject:'Tarih',comments:[],time:'Dün'}]}

/* ═══ GRUP / SINIFIM ═══ */
function renderGroups(){
  const c=$('#page-groups');if(!c)return;
  let groups=DS.get('my_groups')||_seedGroups();
  const u=DS.get('user')||{};const lv=u.level||'lise';
  const myName=u.name||'Sen';
  const RANKS=[{id:'admin',label:'👑 Admin',color:'#FF9F0A'},{id:'mod',label:'⭐ Moderatör',color:'#5856D6'},{id:'member',label:'👤 Üye',color:'var(--txt3)'}];
  const _subjects=lv==='ortaokul'?['Matematik','Türkçe','Fen','Sosyal','İngilizce']:lv==='lise'?['Matematik','Fizik','Kimya','Biyoloji','Türkçe','Edebiyat','Tarih','Coğrafya','İngilizce']:lv==='universite'?['Bölüm','Matematik','İngilizce','Proje']:['GY','GK','Alan','İngilizce'];

  /* Aktif gruba giriş yapılmış mı */
  const activeGrp=groups.find(g=>g.joined&&g._active);
  if(activeGrp){_renderGroupInside(activeGrp);return}

  /* ═══ GRUP LİSTESİ ═══ */
  const joinedGroups=groups.filter(g=>g.joined);
  const otherGroups=groups.filter(g=>!g.joined);

  c.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px">
      <div><h2 style="font-family:var(--fh);font-size:clamp(22px,3vw,28px);font-weight:800">👥 Grup / Sınıfım</h2><p style="font-size:14px;color:var(--txt2)">Birlikte çalış, birlikte başar</p></div>
      <div style="display:flex;gap:8px"><button class="tier-btn-up" style="width:auto;padding:10px 18px;font-size:13px" id="grpCreateBtn">➕ Grup Oluştur</button><button class="filter-btn" id="grpJoinBtn">🔗 Koda Katıl</button></div>
    </div>
    ${joinedGroups.length?`<div style="margin-bottom:24px"><div style="font-family:var(--fh);font-size:14px;font-weight:700;margin-bottom:12px;color:var(--acc)">✅ Gruplarım</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px">${joinedGroups.map(g=>_groupCard(g,true)).join('')}</div></div>`:''}
    ${otherGroups.length?`<div><div style="font-family:var(--fh);font-size:14px;font-weight:700;margin-bottom:12px;color:var(--txt3)">🔍 Keşfet</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px">${otherGroups.map(g=>_groupCard(g,false)).join('')}</div></div>`:''}
    ${!groups.length?'<div style="text-align:center;padding:60px;color:var(--txt3)"><div style="font-size:48px;margin-bottom:12px">👥</div><p>Henüz grup yok — oluştur veya katıl!</p></div>':''}`;

  function _groupCard(g,isMember){
    const memberCount=g.memberList?.length||g.members||1;
    const rank=isMember?RANKS.find(r=>r.id===(g.memberList?.find(m=>m.name===myName)?.rank||'member')):null;
    return`<div class="group-card-v2" style="border-left:4px solid ${g.color||'var(--acc)'}">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="width:48px;height:48px;border-radius:14px;background:${g.color||'var(--acc)'}15;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">${g.icon||'👥'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g.name}</div>
          <div style="font-size:12px;color:var(--txt3);display:flex;gap:8px;align-items:center;margin-top:2px"><span>👥 ${memberCount} üye</span><span>·</span><span>${g.type||'Genel'}</span></div>
        </div>
      </div>
      ${g.desc?`<p style="font-size:13px;color:var(--txt2);line-height:1.5;margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${g.desc}</p>`:''}
      ${rank?`<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px"><span style="font-size:11px;padding:3px 10px;border-radius:50px;background:${rank.color}15;color:${rank.color};font-weight:600">${rank.label}</span></div>`:''}
      <div style="display:flex;gap:8px;align-items:center;margin-top:auto;padding-top:10px">
        ${isMember?`<button class="tier-btn-up" style="flex:1;padding:10px 16px;font-size:13px" data-grpenter="${g.id}">Gir →</button><button style="padding:10px 14px;font-size:12px;border-radius:var(--r);border:1px solid #FF3B30;color:#FF3B30;background:none;cursor:pointer" data-grpleave="${g.id}">Ayrıl</button>`
        :`<button class="tier-btn-up" style="flex:1;padding:10px;font-size:13px" data-grpask="${g.id}">Katılmak İster Misin?</button>`}
      </div>
    </div>`;
  }

  /* Event handlers */
  c.querySelectorAll('[data-grpask]').forEach(b=>b.addEventListener('click',()=>{
    const g=groups.find(x=>x.id===b.dataset.grpask);if(!g)return;
    _confirmPopup('👥 Gruba Katıl',`<b>${g.name}</b> grubuna katılmak istiyor musun?<br><br><span style="font-size:12px;color:var(--txt3)">${g.desc||''}<br>👥 ${g.memberList?.length||g.members||1} üye · ${g.type||'Genel'}</span>`,'Katıl','İptal',()=>{
      g.joined=true;if(!g.memberList)g.memberList=_fakeMemberList(g);g.memberList.push({name:myName,rank:'member',joined:new Date().toISOString().slice(0,10)});DS.set('my_groups',groups);_updateNavGroupBtn();renderGroups();showToast(g.name+' grubuna katıldın!');
    });
  }));
  c.querySelectorAll('[data-grpenter]').forEach(b=>b.addEventListener('click',()=>{const g=groups.find(x=>x.id===b.dataset.grpenter);if(g){groups.forEach(x=>x._active=false);g._active=true;DS.set('my_groups',groups);renderGroups()}}));
  c.querySelectorAll('[data-grpleave]').forEach(b=>b.addEventListener('click',()=>{
    const g=groups.find(x=>x.id===b.dataset.grpleave);if(!g)return;
    _confirmPopup('🚪 Gruptan Ayrıl',`<b>${g.name}</b> grubundan ayrılmak istediğine emin misin?`,'Ayrıl','Vazgeç',()=>{
      g.joined=false;g._active=false;if(g.owner){groups.splice(groups.indexOf(g),1)}DS.set('my_groups',groups);_updateNavGroupBtn();renderGroups();showToast('Gruptan ayrıldın');
    });
  }));

  /* Oluştur */
  $('#grpCreateBtn').addEventListener('click',()=>{
    let pop=$('#grpCreatePopup');if(!pop){pop=document.createElement('div');pop.id='grpCreatePopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
    const icons=['🏫','📚','🔢','⚡','🧪','📖','🌍','💻','🎯','👥','🎓','🏥'];
    const colors=['#007AFF','#FF3B30','#34C759','#FF9F0A','#5856D6','#AF52DE','#00C7BE','#FF2D55'];
    const types=['Sınıf','Ders Grubu','Sınav Hazırlık','Proje Grubu','Çalışma Grubu','Sosyal'];
    pop.innerHTML=`<div class="popup-card" style="max-width:500px"><div class="popup-hdr"><h2>➕ Yeni Grup Oluştur</h2><button class="popup-close" onclick="$('#grpCreatePopup').classList.remove('vis')">✕</button></div><div class="popup-body"><div style="display:flex;flex-direction:column;gap:16px">
      <div><label class="sp-label">Grup Adı</label><input class="task-input" id="gcName" placeholder="ör: 12-A Sınıfı, YKS Sayısal..." maxlength="40" style="width:100%"></div>
      <div><label class="sp-label">Açıklama</label><textarea class="task-input" id="gcDesc" placeholder="Grubun amacını kısaca anlat..." maxlength="120" style="width:100%;min-height:50px;resize:vertical;border-radius:var(--r);padding:12px 16px"></textarea></div>
      <div><label class="sp-label">Grup Türü</label><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">${types.map(t=>`<button class="wizard-opt" data-gctype="${t}" style="padding:10px;font-size:12px">${t}</button>`).join('')}</div></div>
      <div><label class="sp-label">İkon</label><div style="display:flex;gap:6px;flex-wrap:wrap">${icons.map(ic=>`<button class="wizard-opt" data-gcic="${ic}" style="padding:8px 10px;font-size:18px;min-width:0">${ic}</button>`).join('')}</div></div>
      <div><label class="sp-label">Renk</label><div style="display:flex;gap:8px;flex-wrap:wrap">${colors.map(col=>`<button data-gcc="${col}" style="width:30px;height:30px;border-radius:50%;background:${col};border:2.5px solid transparent;cursor:pointer;transition:all .15s"></button>`).join('')}</div></div>
      <button class="tier-btn-up" id="gcSave">Oluştur</button>
    </div></div></div>`;
    pop.classList.add('vis');
    let si='🏫',sc='#007AFF',st='Sınıf';
    pop.querySelectorAll('[data-gctype]').forEach(b=>{if(b.dataset.gctype==='Sınıf')b.style.borderColor='var(--acc)';b.addEventListener('click',()=>{pop.querySelectorAll('[data-gctype]').forEach(x=>x.style.borderColor='var(--border)');b.style.borderColor='var(--acc)';st=b.dataset.gctype})});
    pop.querySelectorAll('[data-gcic]').forEach(b=>{if(b.dataset.gcic==='🏫')b.style.borderColor='var(--acc)';b.addEventListener('click',()=>{pop.querySelectorAll('[data-gcic]').forEach(x=>x.style.borderColor='var(--border)');b.style.borderColor='var(--acc)';si=b.dataset.gcic})});
    pop.querySelectorAll('[data-gcc]').forEach(b=>{if(b.dataset.gcc==='#007AFF')b.style.borderColor='var(--txt)';b.addEventListener('click',()=>{pop.querySelectorAll('[data-gcc]').forEach(x=>x.style.borderColor='transparent');b.style.borderColor='var(--txt)';sc=b.dataset.gcc})});
    $('#gcSave').addEventListener('click',()=>{const name=$('#gcName').value.trim();if(!name){showToast('Grup adı gerekli');return}const code='BK'+Date.now().toString(36).toUpperCase().slice(-6);
      groups.unshift({id:'g'+Date.now(),name,desc:$('#gcDesc').value.trim(),type:st,icon:si,color:sc,members:1,joined:true,owner:true,code,notes:[],channels:{},memberList:[{name:myName,rank:'admin',joined:new Date().toISOString().slice(0,10)}]});
      DS.set('my_groups',groups);pop.classList.remove('vis');_updateNavGroupBtn();renderGroups();showToast('Grup oluşturuldu! Davet kodu: '+code)});
  });

  /* Koda Katıl */
  $('#grpJoinBtn').addEventListener('click',()=>{
    let pop=$('#grpJoinPopup');if(!pop){pop=document.createElement('div');pop.id='grpJoinPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
    pop.innerHTML=`<div class="popup-card" style="max-width:380px"><div class="popup-hdr"><h2>🔗 Davet Koduyla Katıl</h2><button class="popup-close" onclick="$('#grpJoinPopup').classList.remove('vis')">✕</button></div><div class="popup-body"><p style="font-size:13px;color:var(--txt2);margin-bottom:14px">Grubun davet kodunu gir:</p><div style="display:flex;flex-direction:column;gap:14px"><input class="task-input" id="gjCode" placeholder="BKABC123" maxlength="20" style="width:100%;text-transform:uppercase;letter-spacing:4px;text-align:center;font-size:20px;font-weight:700"><button class="tier-btn-up" id="gjJoin">Katıl</button></div></div></div>`;
    pop.classList.add('vis');
    $('#gjJoin').addEventListener('click',()=>{const code=$('#gjCode').value.trim().toUpperCase();if(!code){showToast('Kod gir');return}const f=groups.find(g=>g.code===code);
      if(f){if(f.joined){showToast('Zaten üyesin!');return}f.joined=true;if(!f.memberList)f.memberList=_fakeMemberList(f);f.memberList.push({name:myName,rank:'member',joined:new Date().toISOString().slice(0,10)});DS.set('my_groups',groups);pop.classList.remove('vis');_updateNavGroupBtn();renderGroups();showToast(f.name+' katıldın!')}
      else showToast('Geçersiz kod!');
    });
  });

  /* ═══ GRUP İÇ SAYFA ═══ */
  function _renderGroupInside(g){
    if(!g.memberList)g.memberList=_fakeMemberList(g);
    if(!g.channels)g.channels={};if(!g.notes)g.notes=[];
    const myRank=g.memberList.find(m=>m.name===myName)?.rank||'member';
    const isAdmin=myRank==='admin';
    let activeTab='chat';

    function renderInside(){
      const CHANNELS=['📢 Duyurular','❓ Soru-Cevap',..._subjects.map(s=>'📚 '+s),'📎 İstek-Cevap','💬 Genel'];
      c.innerHTML=`
        <div style="background:${g.color||'var(--acc)'}10;border:1px solid ${g.color||'var(--acc)'}25;border-radius:var(--r);padding:16px;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:50px;height:50px;border-radius:14px;background:${g.color||'var(--acc)'}20;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0">${g.icon}</div>
            <div style="flex:1;min-width:0"><div style="font-weight:800;font-size:18px;font-family:var(--fh)">${g.name}</div><div style="font-size:12px;color:var(--txt2);margin-top:2px">${g.memberList.length} üye · ${g.type||''} · <span style="color:${g.color||'var(--acc)'};font-weight:600">Kod: ${g.code||'—'}</span></div></div>
            <div style="display:flex;gap:6px">
              ${isAdmin?`<button class="filter-btn" style="font-size:11px;padding:8px 12px" id="grpSettingsBtn">⚙️</button>`:''}
              <button style="font-size:12px;padding:8px 14px;border-radius:var(--r);border:1px solid #FF3B30;color:#FF3B30;background:none;cursor:pointer" id="grpLeaveBtn">← Çık</button>
            </div>
          </div>
        </div>
        <div class="my-space-tabs" style="margin-bottom:16px">
          <button class="ms-tab ${activeTab==='chat'?'active':''}" data-gt="chat">💬 Sohbet</button>
          <button class="ms-tab ${activeTab==='notes'?'active':''}" data-gt="notes">📝 Notlar</button>
          <button class="ms-tab ${activeTab==='members'?'active':''}" data-gt="members">👥 Üyeler (${g.memberList.length})</button>
        </div>
        <div id="grpTabContent"></div>`;

      c.querySelectorAll('[data-gt]').forEach(t=>t.addEventListener('click',()=>{c.querySelectorAll('[data-gt]').forEach(x=>x.classList.remove('active'));t.classList.add('active');activeTab=t.dataset.gt;renderInside()}));
      $('#grpLeaveBtn').addEventListener('click',()=>{
        _confirmPopup('🚪 Gruptan Çık',`<b>${g.name}</b> grubundan çıkmak istediğine emin misin?`,'Çık','Vazgeç',()=>{
          g.joined=false;g._active=false;DS.set('my_groups',groups);_updateNavGroupBtn();renderGroups();showToast('Çıktın');
        });
      });
      $('#grpSettingsBtn')?.addEventListener('click',()=>_openGroupSettings(g));

      const tc=$('#grpTabContent');
      if(activeTab==='chat')_renderChat(tc,g,CHANNELS);
      else if(activeTab==='notes')_renderGroupNotes(tc,g);
      else if(activeTab==='members')_renderMembers(tc,g,isAdmin);
    }
    renderInside();
  }

  /* ─── SOHBET — HAZIR MESAJ SİSTEMİ ─── */
  function _renderChat(tc,g,channels){
    let activeCh=g._activeCh||channels[0];
    const msgs=g.channels[activeCh]||[];
    const myMember=g.memberList?.find(m=>m.name===myName);
    const isAdminOrMod=myMember?.rank==='admin'||myMember?.rank==='mod';
    const isDuyuru=activeCh.includes('Duyuru');
    const isSoru=activeCh.includes('Soru');
    const isDers=activeCh.includes('📚');
    const isIstek=activeCh.includes('İstek');
    const isGenel=activeCh.includes('Genel');

    /* Hazır mesaj kategorileri — kanala göre, çok zengin */
    let msgOptions=[];
    if(isDuyuru&&isAdminOrMod)msgOptions=[
      {cat:'📢 Duyuru',items:['Yarın sınav var','Ödev teslim tarihi değişti','Yeni kaynak eklendi','Toplantı var','Önemli hatırlatma','Ders programı güncellendi','Sınav ertelendi','Ek süre verildi','Proje teslim tarihi yaklaşıyor','Herkese iyi çalışmalar']}
    ];
    else if(isDuyuru)msgOptions=[];
    else if(isSoru)msgOptions=[
      {cat:'❓ Soru',items:['Bu konuyu anlamadım','Şu soruyu çözen var mı?','Bu formül nasıl kullanılıyor?','Bu konu sınavda çıkar mı?','Hangi kaynaktan çalışmalıyım?','Bu konunun özeti var mı?','Şu kavramı açıklayabilir misiniz?','Bu tür sorular nasıl çözülür?','Konu tekrarı yapan var mı?','Bu dersten zorlanıyorum']},
      {cat:'💡 Cevap',items:['Cevap şöyle...','Bu kaynağa bakabilirsin','Şu videoyu izlemeni öneririm','Ben şöyle çözdüm','Doğru yaklaşım bu','Formülü şöyle uygula','Adım adım anlatayım','Bu konuyu şuradan çalış','Benzer soru çözerek pratik yap','Konuyu tekrar etmeni öneririm']}
    ];
    else if(isDers)msgOptions=[
      {cat:'📝 Not',items:['Konu özeti paylaşıyorum','Formül listesi hazırladım','Çözümlü soru paylaşıyorum','Ders notu hazırladım','Özet çıkardım','Şema hazırladım','Konu haritası yaptım','Önemli noktaları derledim','Sınav notlarımı paylaşıyorum','Flashcard hazırladım']},
      {cat:'❓ Soru',items:['Bu konuyu anlatan var mı?','Şu soru nasıl çözülür?','Kaynak önerir misiniz?','Bu konuda zorlanıyorum','Pratik yapabileceğim soru var mı?','Hangi kitaptan çalışayım?','Bu konu hangi üniteye ait?','Benzer soru tipi paylaşır mısınız?']},
      {cat:'📎 Kaynak',items:['Faydalı video buldum','Bu siteye bakmanızı öneririm','PDF paylaşıyorum','Güzel bir anlatım videosu','Bu uygulamayı deneyin','Konu anlatım linki','Online test linki','Çözümlü sorular kaynağı']}
    ];
    else if(isIstek)msgOptions=[
      {cat:'🙋 İstek',items:['Bu konu için not lazım','Şu notlar var mı?','Bu konuyu anlatan var mı?','Deneme paylaşır mısınız?','Şu kitabın PDF var mı?','Formül kartı olan var mı?','Özet paylaşır mısınız?','Konu anlatım videosu önerir misiniz?','Çözümlü soru arıyorum','Bu derse çalışacak arkadaş arıyorum']},
      {cat:'✅ Yanıt',items:['Bende var paylaşıyorum','Şu kaynağa bak','Ben yardımcı olabilirim','Elimde şu kaynak var','Bu linke bakabilirsin','Not paylaştım yukarıda','Birazdan paylaşırım','Şu kanalda paylaşıldı','Hocaya sormanı öneririm','Ben de arıyorum']}
    ];
    else if(isGenel)msgOptions=[
      {cat:'💬 Sohbet',items:['Merhaba','İyi günler','Bugün nasıl çalıştınız?','Motivasyona ihtiyacım var','Deneme nasıl geçti?','İyi çalışmalar herkese','Bugün verimli geçti','Biraz yoruldum','Tekrar başlıyorum','Herkese kolay gelsin']},
      {cat:'🎯 Hedef',items:['Bu hafta hedefim şu...','Bugün 5 saat çalışacağım','Denemede 80 net hedefliyorum','Bu konuyu bitireceğim','Haftalık planımı tamamladım','Zayıf konularıma yoğunlaşıyorum','Her gün düzenli çalışacağım','Bu ay 3 deneme çözeceğim']},
      {cat:'💪 Motivasyon',items:['Hep birlikte başaracağız','Vazgeçme devam et','Azim başarının anahtarı','Her gün bir adım daha','Kendine güven','Emek boşa gitmez','Hedefe odaklan','Disiplinli çalışma kazandırır','Bugün de başardık','Yarın daha iyi olacak']}
    ];

    const noAccess=isDuyuru&&!isAdminOrMod;

    tc.innerHTML=`
      <div style="display:flex;gap:10px;min-height:360px;flex-wrap:wrap">
        <div style="width:155px;flex-shrink:0;background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:6px;overflow-y:auto;display:flex;flex-direction:column;gap:2px;max-height:400px">${channels.map(ch=>`<button class="grp-ch-btn ${ch===activeCh?'active':''}" data-ch="${ch}" style="text-align:left;padding:7px 10px;border-radius:8px;font-size:11px;border:none;cursor:pointer;transition:all .12s;background:${ch===activeCh?'var(--acc-l)':'transparent'};color:${ch===activeCh?'var(--acc)':'var(--txt2)'};font-weight:${ch===activeCh?'600':'400'}">${ch}</button>`).join('')}</div>
        <div style="flex:1;min-width:260px;display:flex;flex-direction:column;background:var(--white);border:1px solid var(--border);border-radius:var(--r);overflow:hidden">
          <div style="padding:10px 14px;border-bottom:1px solid var(--border);font-weight:600;font-size:12px;display:flex;align-items:center;gap:6px;flex-shrink:0"><span style="flex:1">${activeCh}</span><button style="font-size:10px;color:var(--txt3);background:none;border:none;cursor:pointer;flex-shrink:0" id="grpWhyBtn">ℹ️ Neden böyle?</button></div>
          <div style="flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:8px;min-height:160px;max-height:250px" id="grpMsgList">${msgs.length?msgs.map(m=>`<div style="display:flex;gap:8px;align-items:flex-start"><div style="width:26px;height:26px;border-radius:50%;background:${m.color||'var(--acc)'};display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;flex-shrink:0;cursor:pointer" data-mprof="${m.author}">${(m.author||'?')[0]}</div><div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:600;cursor:pointer" data-mprof="${m.author}">${m.author} <span style="font-weight:400;color:var(--txt3)">${m.time||''}</span></div><div style="font-size:13px;line-height:1.4;margin-top:2px;word-break:break-word">${m.text}</div></div></div>`).join(''):'<div style="text-align:center;color:var(--txt3);padding:30px;font-size:13px">Henüz mesaj yok</div>'}</div>
          ${noAccess?`<div style="padding:12px;border-top:1px solid var(--border);text-align:center;font-size:12px;color:var(--txt3)">📢 Bu kanala sadece admin/moderatör yazabilir</div>`
          :`<div style="padding:8px;border-top:1px solid var(--border);flex-shrink:0">
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">${msgOptions.map((cat,ci)=>`<button class="grp-cat-btn" data-msgcat="${ci}" style="font-size:10px;padding:5px 10px;border-radius:50px;border:1px solid var(--border);background:var(--bg);cursor:pointer;transition:all .12s;font-weight:600">${cat.cat}</button>`).join('')}</div>
            <div id="grpMsgItems" style="display:none;flex-wrap:wrap;gap:4px;margin-bottom:6px"></div>
            <div style="display:flex;gap:8px;align-items:center;margin-top:4px"><span style="font-size:10px;color:var(--txt3);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" id="grpSelLabel">↑ Kategori seç → mesaj seç → gönder</span><button class="tier-btn-up" style="padding:8px 20px;font-size:12px;flex-shrink:0;width:auto" id="grpMsgSend">Gönder</button></div>
          </div>`}
        </div>
      </div>`;

    /* Kanal değiştir */
    tc.querySelectorAll('[data-ch]').forEach(b=>b.addEventListener('click',()=>{g._activeCh=b.dataset.ch;DS.set('my_groups',groups);_renderChat(tc,g,channels)}));

    /* Mesaj seçim sistemi — sadece hazır mesajlar */
    let selectedMsg=null;
    tc.querySelectorAll('.grp-cat-btn').forEach(b=>b.addEventListener('click',()=>{
      const ci=parseInt(b.dataset.msgcat);const cat=msgOptions[ci];
      tc.querySelectorAll('.grp-cat-btn').forEach(x=>{x.style.borderColor='var(--border)';x.style.background='var(--bg)'});
      b.style.borderColor='var(--acc)';b.style.background='var(--acc-l)';
      selectedMsg=null;$('#grpSelLabel').textContent='↑ Mesaj seç';
      const items=$('#grpMsgItems');
      items.style.display='flex';
      items.innerHTML=cat.items.map(it=>`<button class="grp-msg-item" data-msg="${it}" style="font-size:11px;padding:6px 12px;border-radius:50px;border:1px solid var(--border);background:var(--white);cursor:pointer;transition:all .12s">${it}</button>`).join('');
      items.querySelectorAll('.grp-msg-item').forEach(mi=>mi.addEventListener('click',()=>{
        selectedMsg=mi.dataset.msg;
        items.querySelectorAll('.grp-msg-item').forEach(x=>{x.style.borderColor='var(--border)';x.style.background='var(--white)'});
        mi.style.borderColor='var(--acc)';mi.style.background='var(--acc-l)';
        $('#grpSelLabel').textContent='✅ '+selectedMsg;
      }));
    }));

    /* Gönder — spam kontrolü, serbest yazı yok */
    $('#grpMsgSend')?.addEventListener('click',()=>{
      if(!selectedMsg){showToast('Önce kategori seç, sonra mesaj seç');return}
      const spam=_checkSpam();
      if(spam.blocked){showToast(spam.msg);return}
      if(!g.channels[activeCh])g.channels[activeCh]=[];
      g.channels[activeCh].push({author:myName,text:selectedMsg,color:'var(--acc)',time:new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})});
      DS.set('my_groups',groups);_renderChat(tc,g,channels);
    });

    /* Profil popup */
    tc.querySelectorAll('[data-mprof]').forEach(el=>el.addEventListener('click',()=>_openProfilePopup(el.dataset.mprof,g)));

    /* Neden popup */
    $('#grpWhyBtn')?.addEventListener('click',()=>{
      let pop=$('#grpInfoPopup');if(!pop){pop=document.createElement('div');pop.id='grpInfoPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
      pop.innerHTML=`<div class="popup-card" style="max-width:440px"><div class="popup-hdr"><h2>ℹ️ Neden Özgürce Yazamıyorum?</h2><button class="popup-close" onclick="$('#grpInfoPopup').classList.remove('vis')">✕</button></div><div class="popup-body" style="line-height:1.8;font-size:14px">
        <p style="margin-bottom:12px">bilgi kaynağım bir <b>eğitim platformudur</b>.</p>
        <p style="margin-bottom:10px">Sohbet sistemi hazır mesaj seçenekleriyle çalışır. Bu tasarım iki nedenle yapılmıştır:</p>
        <p style="margin-bottom:8px">🎯 <b>Odak:</b> Rastgele sohbet yerine konu odaklı iletişim — herkes aradığını kolayca bulur.</p>
        <p style="margin-bottom:8px">🔒 <b>Güvenlik:</b> Öğrencilerin güvenliği önceliğimiz. Hazır mesajlar sayesinde uygunsuz içerik önlenir.</p>
        <p style="margin-top:12px;color:var(--txt3);font-size:12px">Mesaj göndermek için: Kategori seç → Mesaj seç → İstersen detay ekle → Gönder</p>
      </div></div>`;
      pop.classList.add('vis');
    });

    const ml=$('#grpMsgList');if(ml)ml.scrollTop=ml.scrollHeight;
  }

  /* ─── NOTLAR ─── */
  function _renderGroupNotes(tc,g){
    tc.innerHTML=`<div class="ms-section-header"><button class="tier-btn-up" style="width:auto;padding:8px 18px;font-size:13px" id="grpNoteAdd">➕ Not Paylaş</button></div>
      <div id="grpNoteList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px"></div>`;
    const list=$('#grpNoteList');
    list.innerHTML=g.notes.length?g.notes.map(n=>`<div class="ms-note-card"><div class="ms-note-hdr" style="padding-right:0"><div style="display:flex;align-items:center;gap:6px"><div style="width:22px;height:22px;border-radius:50%;background:var(--acc);display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:700">${(n.author||'?')[0]}</div><b style="font-size:13px">${n.title}</b></div><span style="font-size:10px;color:var(--txt3)">${n.author} · ${n.date||''}</span></div><div style="font-size:13px;color:var(--txt2);line-height:1.5;margin-top:8px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${n.content}</div></div>`).join(''):'<p class="ms-empty">Henüz not yok</p>';
    $('#grpNoteAdd').addEventListener('click',()=>{
      let pop=$('#grpNotePopup');if(!pop){pop=document.createElement('div');pop.id='grpNotePopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
      pop.innerHTML=`<div class="popup-card" style="max-width:440px"><div class="popup-hdr"><h2>📝 Not Paylaş</h2><button class="popup-close" onclick="$('#grpNotePopup').classList.remove('vis')">✕</button></div><div class="popup-body"><div style="display:flex;flex-direction:column;gap:12px"><div><label class="sp-label">Başlık</label><input class="task-input" id="gnTitle" placeholder="Not başlığı..." style="width:100%"></div><div><label class="sp-label">İçerik</label><textarea class="task-input" id="gnContent" placeholder="Notunu yaz..." style="width:100%;min-height:100px;resize:vertical;border-radius:var(--r);padding:12px"></textarea></div><button class="tier-btn-up" id="gnSave">Paylaş</button></div></div></div>`;
      pop.classList.add('vis');
      $('#gnSave').addEventListener('click',()=>{const t=$('#gnTitle').value.trim();if(!t){showToast('Başlık gerekli');return}g.notes.unshift({title:t,content:$('#gnContent').value.trim(),author:myName,date:new Date().toLocaleDateString('tr-TR',{day:'numeric',month:'long'})});DS.set('my_groups',groups);pop.classList.remove('vis');_renderGroupNotes(tc,g);showToast('Paylaşıldı!')});
    });
  }

  /* ─── ÜYELER ─── */
  function _renderMembers(tc,g,isAdmin){
    tc.innerHTML=`<div style="display:flex;flex-direction:column;gap:8px">${g.memberList.map(m=>{
      const rank=RANKS.find(r=>r.id===m.rank)||RANKS[2];
      return`<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--white);border:1px solid var(--border);border-radius:12px;transition:all .15s">
        <div style="width:38px;height:38px;border-radius:50%;background:${rank.color}20;display:flex;align-items:center;justify-content:center;color:${rank.color};font-size:15px;font-weight:700;flex-shrink:0;cursor:pointer" data-mprof="${m.name}">${m.name[0]}</div>
        <div style="flex:1;min-width:0"><div style="font-weight:600;font-size:14px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" data-mprof="${m.name}">${m.name}${m.name===myName?' (Sen)':''}</div><div style="font-size:11px;color:${rank.color};font-weight:600">${rank.label}</div></div>
        <div style="font-size:10px;color:var(--txt3)">${m.joined||''}</div>
        ${isAdmin&&m.name!==myName?`<select class="s-select" style="width:auto;font-size:10px;padding:4px 6px" data-mrankchange="${m.name}">${RANKS.map(r=>`<option value="${r.id}"${m.rank===r.id?' selected':''}>${r.label}</option>`).join('')}</select>`:''}
      </div>`}).join('')}</div>`;
    tc.querySelectorAll('[data-mrankchange]').forEach(sel=>sel.addEventListener('change',()=>{const member=g.memberList.find(m=>m.name===sel.dataset.mrankchange);if(member){member.rank=sel.value;DS.set('my_groups',groups);showToast('Rütbe güncellendi')}}));
    tc.querySelectorAll('[data-mprof]').forEach(el=>el.addEventListener('click',()=>_openProfilePopup(el.dataset.mprof,g)));
  }

  /* ─── PROFİL POPUP ─── */
  function _openProfilePopup(name,g){
    const member=g?.memberList?.find(m=>m.name===name);
    const rank=RANKS.find(r=>r.id===member?.rank)||RANKS[2];
    let pop=$('#grpProfilePopup');if(!pop){pop=document.createElement('div');pop.id='grpProfilePopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
    pop.innerHTML=`<div class="popup-card" style="max-width:340px"><div class="popup-hdr"><h2>👤 Profil</h2><button class="popup-close" onclick="$('#grpProfilePopup').classList.remove('vis')">✕</button></div><div class="popup-body" style="text-align:center">
      <div style="width:60px;height:60px;border-radius:50%;background:${rank.color}20;display:flex;align-items:center;justify-content:center;color:${rank.color};font-size:24px;font-weight:700;margin:0 auto 12px">${name[0]}</div>
      <div style="font-size:17px;font-weight:700;font-family:var(--fh)">${name}</div>
      <div style="font-size:12px;color:${rank.color};font-weight:600;margin-top:4px">${rank.label}</div>
      <div style="display:flex;justify-content:center;gap:20px;margin-top:16px"><div><div style="font-size:15px;font-weight:700">${member?.joined||'—'}</div><div style="font-size:10px;color:var(--txt3)">Katılma</div></div><div><div style="font-size:15px;font-weight:700">${g?.notes?.filter(n=>n.author===name).length||0}</div><div style="font-size:10px;color:var(--txt3)">Paylaşım</div></div></div>
    </div></div>`;
    pop.classList.add('vis');
  }

  /* ─── AYARLAR ─── */
  function _openGroupSettings(g){
    let pop=$('#grpSettingsPopup');if(!pop){pop=document.createElement('div');pop.id='grpSettingsPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
    pop.innerHTML=`<div class="popup-card" style="max-width:420px"><div class="popup-hdr"><h2>⚙️ Ayarlar</h2><button class="popup-close" onclick="$('#grpSettingsPopup').classList.remove('vis')">✕</button></div><div class="popup-body"><div style="display:flex;flex-direction:column;gap:14px">
      <div style="background:var(--acc-l);border-radius:12px;padding:12px;display:flex;align-items:center;gap:8px"><span style="font-size:12px">📨 Davet: <b>${g.code||'—'}</b></span><button class="filter-btn" style="font-size:11px;padding:4px 10px;margin-left:auto" onclick="navigator.clipboard?.writeText('${g.code||''}');showToast('Kopyalandı!')">Kopyala</button></div>
      <div><label class="sp-label">Ad</label><input class="task-input" id="gsName" value="${g.name}" style="width:100%"></div>
      <div><label class="sp-label">Açıklama</label><input class="task-input" id="gsDesc" value="${g.desc||''}" style="width:100%"></div>
      <button class="tier-btn-up" id="gsSave">Kaydet</button>
      <button style="padding:10px;border-radius:var(--r);border:1px solid #FF3B30;color:#FF3B30;background:none;cursor:pointer;font-size:13px" id="gsDelete">🗑️ Grubu Sil</button>
    </div></div></div>`;
    pop.classList.add('vis');
    $('#gsSave').addEventListener('click',()=>{g.name=$('#gsName').value.trim()||g.name;g.desc=$('#gsDesc').value.trim();DS.set('my_groups',groups);pop.classList.remove('vis');renderGroups();showToast('Güncellendi')});
    $('#gsDelete').addEventListener('click',()=>{_confirmPopup('🗑️ Grubu Sil','Bu grubu silmek istediğine emin misin? Bu işlem geri alınamaz.','Sil','Vazgeç',()=>{groups.splice(groups.indexOf(g),1);DS.set('my_groups',groups);pop.classList.remove('vis');_updateNavGroupBtn();renderGroups();showToast('Silindi')})});
  }

  /* ─── ONAY POPUP ─── */
  function _confirmPopup(title,msg,okText,cancelText,onOk){
    let pop=$('#grpConfirmPopup');if(!pop){pop=document.createElement('div');pop.id='grpConfirmPopup';pop.className='popup-ov';document.body.appendChild(pop);pop.addEventListener('click',e=>{if(e.target===pop)pop.classList.remove('vis')})}
    pop.innerHTML=`<div class="popup-card" style="max-width:380px"><div class="popup-hdr"><h2>${title}</h2><button class="popup-close" onclick="$('#grpConfirmPopup').classList.remove('vis')">✕</button></div><div class="popup-body"><div style="font-size:14px;line-height:1.6;margin-bottom:16px">${msg}</div><div style="display:flex;gap:8px"><button class="tier-btn-up" style="flex:1" id="gcOk">${okText}</button><button class="filter-btn" style="flex:1" onclick="$('#grpConfirmPopup').classList.remove('vis')">${cancelText}</button></div></div></div>`;
    pop.classList.add('vis');
    $('#gcOk').addEventListener('click',()=>{pop.classList.remove('vis');onOk()});
  }

  function _fakeNames(n){return['Zeynep K.','Emre D.','Elif Ç.','Burak Ö.','Selin A.','Mert Y.','Ayşe T.','Can B.'].slice(0,n)}
  function _fakeMemberList(g){return _fakeNames(Math.min(6,(g.members||4)-1)).map((n,i)=>({name:n,rank:i===0?'mod':'member',joined:'2026-03-0'+(i+1)}))}
}

function _updateNavGroupBtn(){
  const groups=DS.get('my_groups')||[];
  const joined=groups.filter(g=>g.joined);
  const btn=$('#navGroupBtn');
  if(btn)btn.style.display=joined.length?'':'none';
}

/* İçerik filtresi — BEYAZ LİSTE: sadece eğitim kelimeleri kabul edilir */
/* Toplam: ~850+ kelime haznesi */
const _EDU_WHITELIST=new Set([
  /* Genel eğitim */
  'ders','konu','sınav','test','deneme','soru','cevap','çözüm','formül','teorem','kural','tanım','ödev','proje','sunum','rapor','not','özet','kitap','sayfa','bölüm','ünite','başlık','paragraf','cümle','kelime','metin','makale','kaynak','video','anlatım','açıklama','örnek','alıştırma','pratik','tekrar','ezber','hafıza','anlama','analiz','sentez','yorum','değerlendirme',
  /* Dersler */
  'matematik','fizik','kimya','biyoloji','türkçe','edebiyat','tarih','coğrafya','felsefe','ingilizce','almanca','fransızca','arapça','din','müzik','resim','beden','teknoloji','bilgisayar','programlama','geometri','cebir','trigonometri','istatistik','olasılık',
  /* Matematik terimleri */
  'toplama','çıkarma','çarpma','bölme','kesir','ondalık','yüzde','oran','orantı','denklem','eşitsizlik','fonksiyon','grafik','türev','integral','limit','logaritma','üslü','köklü','mutlak','değer','matris','determinant','vektör','permütasyon','kombinasyon','faktöriyel','polinom','parabol','hiperbol','elips','açı','üçgen','kare','dikdörtgen','daire','çember','alan','çevre','hacim','prizma','piramit','küre','silindir','koni','eğim','doğru','nokta','koordinat','düzlem',
  /* Fizik terimleri */
  'kuvvet','hız','ivme','kütle','ağırlık','enerji','iş','güç','momentum','tork','denge','hareket','atış','düşme','sürtünme','yay','sarkaç','dalga','ses','ışık','optik','ayna','mercek','kırılma','yansıma','elektrik','akım','gerilim','direnç','manyetizma','indüksiyon','transformatör','newton','joule','watt','volt','amper','ohm','frekans','periyot','genlik',
  /* Kimya terimleri */
  'atom','molekül','element','bileşik','karışım','çözelti','asit','baz','tuz','ph','reaksiyon','tepkime','denkleştirme','mol','avogadro','periyodik','tablo','elektron','proton','nötron','orbital','bağ','iyon','iyonik','kovalent','metalik','organik','inorganik','hidrokarbonlar','polimer','madde','hal','gaz','sıvı','katı','erime','kaynama','buharlaşma','yoğuşma',
  /* Biyoloji terimleri */
  'hücre','mitoz','mayoz','dna','rna','protein','enzim','hormon','gen','genetik','mutasyon','evrim','ekosistem','popülasyon','besin','zincir','fotosentez','solunum','sindirim','dolaşım','boşaltım','sinir','kas','iskelet','organ','doku','bitki','hayvan','bakteri','virüs','mantar','canlı','ototrof','heterotrof',
  /* Türkçe/Edebiyat terimleri */
  'fiil','isim','sıfat','zarf','zamir','edat','bağlaç','ünlem','özne','yüklem','nesne','tümleç','cümlecik','bileşik','basit','türemiş','ek','kök','gövde','anlam','mecaz','benzetme','edebi','sanat','roman','hikaye','şiir','divan','halk','milli','dönem','akım','realizm','romantizm','natüralizm','yazar','eser','kahraman','olay','örgü','tema','çatışma','bakış','açısı','anlatıcı',
  /* Tarih terimleri */
  'osmanlı','cumhuriyet','atatürk','savaş','barış','antlaşma','devlet','padişah','sultan','reform','inkılap','devrim','milli','mücadele','kurtuluş','bağımsızlık','demokrasi','anayasa','meclis','seçim','siyasi','ekonomik','sosyal','kültürel','medeniyet','uygarlık','imparatorluk','hanedan','fetih','göç',
  /* Coğrafya terimleri */
  'iklim','sıcaklık','yağış','rüzgar','basınç','nem','mevsim','ekvator','kutup','meridyen','paralel','enlem','boylam','harita','ölçek','arazi','ova','dağ','plato','vadi','akarsu','göl','deniz','okyanus','deprem','volkan','erozyon','toprak','bitki','örtüsü','nüfus','yerleşim','tarım','sanayi','ticaret','ulaşım','enerji','maden',
  /* Sınav terimleri */
  'yks','tyt','ayt','lgs','kpss','yds','ales','tus','dus','dgs','msu','yokdil','puan','sıralama','tercih','yerleştirme','baraj','konteyjan','bölüm','fakülte','üniversite',
  /* Fiiller ve yardımcı kelimeler */
  'çöz','çözdüm','çözmek','çözüm','anlat','anlatır','anlamadım','anladım','bilmiyorum','biliyorum','yapamadım','yaptım','yazdım','okudum','çalıştım','çalışıyorum','hazırlanıyorum','tekrar','ettim','öğrendim','öğrenmek','başladım','bitirdim','tamamladım','geçtim','kaldım','zorlanıyorum','kolaylaştı','anlaşıldı',
  'yardım','lazım','gerekiyor','istiyorum','arıyorum','paylaşır','gönderir','önerir','tavsiye','teşekkür','teşekkürler','sağol','evet','hayır','tamam','peki','nasıl','neden','nerede','hangi','kaç','ne','kim','bu','şu','için','ile','var','yok','mı','mi','mu','mü','da','de','bir','iki','üç','dört','beş','altı','yedi','sekiz','dokuz','on',
  /* Zaman/planlama */
  'bugün','yarın','hafta','ay','yıl','gün','saat','dakika','süre','zaman','plan','program','takvim','hedef','amaç','strateji','yöntem','teknik',
  /* Ders araçları */
  'defter','kalem','silgi','cetvel','hesap','makinesi','bilgisayar','tablet','uygulama','site','platform','pdf','dosya','klasör','link','url',
  /* Duygusal/motivasyon (eğitim bağlamı) */
  'başarı','başarılı','başardım','motivasyon','azim','sabır','emek','çaba','gayret','disiplin','düzenli','planlı','odak','konsantrasyon','verimli','etkili','kolay','zor','orta','iyi','kötü','güzel','harika','mükemmel','süper',
  /* Sayılar yazıyla */
  'sıfır','yirmi','otuz','kırk','elli','altmış','yetmiş','seksen','doksan','yüz','bin','milyon',
  /* Genel */
  'konu','kısım','bölüm','madde','adım','aşama','seviye','düzey','tür','tip','çeşit','grup','sınıf','okul','lise','ortaokul','ilkokul','öğretmen','hoca','öğrenci','arkadaş','sınıf','deney','laboratuvar','kütüphane','müfredat',
  /* Netlerim/Deneme */
  'net','doğru','yanlış','boş','puan','ortalama','artış','düşüş','gelişim','ilerleme','grafik','istatistik','analiz','karşılaştırma','sonuç','performans'
]);

function _checkBadContent(text){
  if(!text||text.trim().length<2)return false;
  /* Kelimelere ayır */
  const words=text.toLowerCase().replace(/[^a-züöçşığ\s]/g,' ').split(/\s+/).filter(w=>w.length>1);
  if(!words.length)return true;/* sadece özel karakter = spam */
  /* En az %50 kelime beyaz listede olmalı */
  const goodCount=words.filter(w=>_EDU_WHITELIST.has(w)).length;
  const ratio=goodCount/words.length;
  if(ratio<0.4)return true;/* %40'tan az eğitim kelimesi = reddet */
  return false;
}

/* Spam koruması — 2 mesaj arası 5sn'den azsa → 5dk bekleme */
function _checkSpam(){
  const now=Date.now();
  let hist=DS.get('msg_timestamps')||[];
  /* Son 5dk içindeki mesajları tut */
  hist=hist.filter(t=>now-t<300000);
  /* Son 2 mesaj 5sn içinde mi? */
  if(hist.length>=2){
    const last2=hist.slice(-2);
    if(last2[1]-last2[0]<5000){
      /* Spam tespit — son mesajdan 5dk geçmeli */
      const timeSince=now-hist[hist.length-1];
      if(timeSince<300000){
        const remaining=Math.ceil((300000-timeSince)/60000);
        return{blocked:true,msg:`⏳ Çok hızlı mesaj! ${remaining} dk bekle.`};
      }
    }
  }
  hist.push(now);
  DS.set('msg_timestamps',hist);
  return{blocked:false};
}

function _seedGroups(){const g=[
  {id:'gr1',name:'12-A Sınıfı',type:'Sınıf',members:34,icon:'🏫',color:'#007AFF',joined:true,owner:false,code:'BK12A2026',desc:'12-A sınıfı ortak çalışma ve paylaşım grubu. Dersler, sınavlar ve ödevler hakkında iletişim.',notes:[{title:'Türev Formülleri',content:'Temel türev kuralları ve örnekler.',author:'Zeynep K.',date:'15 Mart'}],channels:{'📢 Duyurular':[{author:'Zeynep K.',text:'📢 Duyuru — Yarın matematik yazılı sınavı var, hazır olun!',time:'14:30',color:'#007AFF'}],'❓ Soru-Cevap':[{author:'Emre D.',text:'❓ Soru Sor — Türev konusundan limit sorusu nasıl çözülür?',time:'15:00',color:'#5856D6'},{author:'Elif Ç.',text:'💡 Cevap Ver — L\'Hôpital kuralını kullanman lazım',time:'15:10',color:'#34C759'}]},memberList:[{name:'Zeynep K.',rank:'admin',joined:'2026-01-10'},{name:'Emre D.',rank:'mod',joined:'2026-01-10'},{name:'Elif Ç.',rank:'member',joined:'2026-01-15'},{name:'Burak Ö.',rank:'member',joined:'2026-02-01'}]},
  {id:'gr2',name:'YKS Sayısal Grubu',type:'Sınav Hazırlık',members:128,icon:'🔢',color:'#FF3B30',joined:false,owner:false,code:'BKYKS2026',desc:'YKS sayısal çalışma, deneme paylaşım ve motivasyon grubu. Hep birlikte hedefe!',notes:[],channels:{},memberList:null},
  {id:'gr3',name:'KPSS Hazırlık',type:'Sınav Hazırlık',members:89,icon:'📋',color:'#5856D6',joined:false,owner:false,code:'BKKPSS26',desc:'KPSS GY-GK çalışma grubu. Kaynak paylaşımı ve soru çözümü.',notes:[],channels:{},memberList:null}
];DS.set('my_groups',g);return g}

/* ═══ LİDERLİK TABLOSU ═══ */
function renderLeaderboard(){
  const c=$('#page-leaderboard');if(!c)return;
  const users=DS.get('users')||[];const me=DS.get('user');
  const board=[...users.map((u,i)=>({...u,xp:Math.floor(Math.random()*5000)+500}))];
  if(me)board.push({name:me.name,initials:me.initials,color:'var(--acc)',xp:me.xp||0});
  board.sort((a,b)=>b.xp-a.xp).forEach((u,i)=>u.rank=i+1);
  c.innerHTML=`<div style="margin-bottom:24px"><h2 style="font-family:var(--fh);font-size:clamp(22px,3vw,28px);font-weight:800">🏆 Liderlik Tablosu</h2></div>
    <div class="lb-list">${board.map(u=>{const medal=u.rank===1?'🥇':u.rank===2?'🥈':u.rank===3?'🥉':'';const isMe=me&&u.name===me.name;
      return`<div class="lb-item ${isMe?'lb-me':''}"><span class="lb-rank">${medal||u.rank}</span><div class="ncard-av" style="background:${u.color||'var(--bg2)'};width:36px;height:36px;font-size:14px">${u.initials}</div><span style="flex:1;font-weight:${isMe?'700':'500'}">${u.name}${isMe?' (Sen)':''}</span><span class="lb-xp">${u.xp.toLocaleString('tr-TR')} XP</span></div>`}).join('')}</div>`;
}

/* ═══ INIT ═══ */
function initPages(){
  window._pageRenders={tasks:renderTasks,study:renderStudy,homework:renderHomework,goals:renderGoals,calendar:renderCalendar,progress:renderProgress,nets:renderNets,'my-notes':renderMyNotes,qa:renderQA,request:renderRequest,groups:renderGroups,leaderboard:renderLeaderboard};
}
/* ═══════════════════════════════════════
   tour.js — Giriş Tanıtım Turu
   6 adım, spotlight highlight, bulanık arka plan
   ═══════════════════════════════════════ */
let _tourCurrent=0;

const TOUR_STEPS=[
  {
    target:'.dash-welcome',
    title:'Hoş Geldin! 👋',
    desc:'Burası ana sayfan. Sınav geri sayımını, istatistiklerini ve not akışını burada görürsün. Her giriş yaptığında seni bir motivasyon cümlesi karşılar.',
    position:'bottom'
  },
  {
    target:'.nav-tab-bilge',
    title:'Bilge — AI Asistanın 🧠',
    desc:'Kişisel eğitim asistanın Bilge burada. Ders anlatımı, soru çözümü, çalışma planı — ne istersen sor. 3 farklı kişilik modundan birini seç ve Bilge\'nin sana özel hafızasını keşfet.',
    position:'bottom'
  },
  {
    target:'[data-mega="kesfet"]',
    title:'Keşfet 🔍',
    desc:'Not akışı, üniversite notları, akademik arşiv ve sınav bilgilerine buradan erişirsin. Binlerce öğrencinin paylaştığı notları keşfet.',
    position:'bottom'
  },
  {
    target:'[data-mega="araclar"]',
    title:'Araçlar 🧰',
    desc:'Günlük çalışma planı, görevler, hedefler, takvim, gelişim takibi — çalışmanı organize eden tüm araçlar burada. "Bugün Ne Çalışayım?" özelliğini mutlaka dene.',
    position:'bottom'
  },
  {
    target:'[data-nav="packages"]',
    title:'Paketler & Kredi 💎',
    desc:'AI kredi durumunu, aylık paketleri ve ek kredi seçeneklerini burada görürsün. Kullanılmayan krediler bir sonraki aya aktarılır. Ek kredi paketleri ile dilediğin zaman takviye yap.',
    position:'bottom'
  },
  {
    target:'.nav-profile',
    title:'Profil & Ayarlar ⚙️',
    desc:'Profiline tıklayarak bilgilerini gör, dişli simgesiyle ayarlara ulaş. Tema değiştir, bildirim tercihlerini ayarla, seviye bilgilerini güncelle. Hazırsan başlayalım!',
    position:'bottom-left'
  }
];

function startTour(){
  if($('#tourOverlay'))return; /* Zaten açık */
  _tourCurrent=0;
  _buildTourUI();
  _showTourStep(0);
}

function _buildTourUI(){
  /* Overlay */
  const ov=document.createElement('div');
  ov.id='tourOverlay';
  ov.className='tour-overlay';
  ov.innerHTML=`
    <div class="tour-backdrop" id="tourBackdrop"></div>
    <div class="tour-spotlight" id="tourSpotlight"></div>
    <div class="tour-card" id="tourCard">
      <div class="tour-card-inner">
        <div class="tour-step-counter" id="tourCounter"></div>
        <h3 class="tour-title" id="tourTitle"></h3>
        <p class="tour-desc" id="tourDesc"></p>
        <div class="tour-actions">
          <button class="tour-skip" id="tourSkip">Turu Atla</button>
          <button class="tour-next" id="tourNext">Anladım →</button>
        </div>
      </div>
      <div class="tour-arrow" id="tourArrow"></div>
    </div>
  `;
  document.body.appendChild(ov);

  /* Events */
  $('#tourNext').addEventListener('click',_nextTourStep);
  $('#tourSkip').addEventListener('click',_endTour);

  /* Animate in */
  requestAnimationFrame(()=>requestAnimationFrame(()=>ov.classList.add('active')));
}

function _showTourStep(idx){
  _tourCurrent=idx;
  const step=TOUR_STEPS[idx];if(!step)return _endTour();

  const target=document.querySelector(step.target);
  if(!target){/* Element bulunamadı — atla */return _nextTourStep()}

  const rect=target.getBoundingClientRect();
  const spotlight=$('#tourSpotlight');
  const card=$('#tourCard');
  const arrow=$('#tourArrow');

  /* Spotlight — hedef elemanın etrafında */
  const pad=8;
  spotlight.style.top=(rect.top-pad)+'px';
  spotlight.style.left=(rect.left-pad)+'px';
  spotlight.style.width=(rect.width+pad*2)+'px';
  spotlight.style.height=(rect.height+pad*2)+'px';
  spotlight.style.borderRadius='12px';

  /* Card konumu */
  const cardW=340;
  let cardLeft=rect.left+rect.width/2-cardW/2;
  let cardTop=rect.bottom+16;
  let arrowDir='top';

  if(step.position==='top'){
    cardTop=rect.top-16;
    arrowDir='bottom';
  }
  if(step.position==='bottom-left'){
    cardLeft=rect.right-cardW;
  }

  /* Ekran sınırları */
  if(cardLeft<16)cardLeft=16;
  if(cardLeft+cardW>window.innerWidth-16)cardLeft=window.innerWidth-16-cardW;
  if(cardTop+220>window.innerHeight){cardTop=rect.top-220;arrowDir='bottom'}

  card.style.left=cardLeft+'px';
  card.style.top=cardTop+'px';
  card.style.width=cardW+'px';
  card.className='tour-card tour-card-'+arrowDir;

  /* Arrow */
  const arrowLeft=Math.min(Math.max(rect.left+rect.width/2-cardLeft,20),cardW-20);
  arrow.style.left=arrowLeft+'px';

  /* Content */
  $('#tourTitle').textContent=step.title;
  $('#tourDesc').textContent=step.desc;
  $('#tourCounter').textContent=`${idx+1} / ${TOUR_STEPS.length}`;
  $('#tourNext').textContent=idx===TOUR_STEPS.length-1?'Başlayalım! 🚀':'Anladım →';

  /* Animate card */
  card.style.opacity='0';card.style.transform='translateY(10px)';
  requestAnimationFrame(()=>{card.style.transition='opacity .3s var(--ease),transform .3s var(--ease)';card.style.opacity='1';card.style.transform='translateY(0)'});

  /* Hedef elemanı scroll'a getir */
  target.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function _nextTourStep(){
  if(_tourCurrent+1>=TOUR_STEPS.length)return _endTour();
  /* Card çıkış animasyonu */
  const card=$('#tourCard');
  card.style.opacity='0';card.style.transform='translateY(-8px)';
  setTimeout(()=>_showTourStep(_tourCurrent+1),200);
}

function _endTour(){
  DS.set('tour_done',true);
  const ov=$('#tourOverlay');
  if(ov){
    ov.classList.remove('active');
    setTimeout(()=>ov.remove(),400);
  }
}
/* ═══════════════════════════════════════
   ui.js — Temel UI Yardımcıları
   ═══════════════════════════════════════ */
function $(sel, ctx) { return (ctx || document).querySelector(sel); }
function $$(sel, ctx) { return [...(ctx || document).querySelectorAll(sel)]; }

function showToast(msg, dur) {
  dur = dur || 3000;
  var c = document.querySelector('#toastC');
  if (!c) return;
  var t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  c.appendChild(t);
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ t.classList.add('show'); }); });
  setTimeout(function(){
    t.classList.remove('show');
    setTimeout(function(){ t.remove(); }, 400);
  }, dur);
}

function openPopup(id) {
  var el = document.querySelector('#' + id);
  if (!el) return;
  el.classList.add('vis');
  document.body.style.overflow = 'hidden';
}
function closePopup(id) {
  var el = document.querySelector('#' + id);
  if (!el) return;
  el.classList.remove('vis');
  document.body.style.overflow = '';
}

function navigateTo(page) {
  document.querySelectorAll('.page-section').forEach(function(s){ s.classList.remove('active'); });
  var target = document.querySelector('#page-' + page);
  if (target) target.classList.add('active');
  document.querySelectorAll('[data-nav]').forEach(function(b){
    b.classList.toggle('active', b.dataset.nav === page);
  });
  document.querySelectorAll('.mega').forEach(function(m){ m.classList.remove('open'); });
  var bd = document.querySelector('#megaBD');
  if (bd) bd.classList.remove('show');
  var mob = document.querySelector('#mobOverlay');
  if (mob) mob.classList.remove('vis');
  if (page === 'packages' && typeof renderPackages === 'function') renderPackages();
  if (typeof window._pageRenders !== 'undefined' && window._pageRenders[page]) {
    window._pageRenders[page]();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function checkCreditPaywall() {
  if (!Credits.canSend()) {
    if (Credits.dailyRemaining() <= 0) showUpgradePopup('daily');
    else showUpgradePopup('credits');
    return false;
  }
  return true;
}
function updateCreditCounter() {
  if (typeof _updateBilgeBadge === 'function') _updateBilgeBadge();
}

function _initToggles() {
  document.querySelectorAll('.tog').forEach(function(tog){
    var k = tog.dataset.k;
    if (!k) return;
    var saved = DS.get('tog_' + k);
    if (saved === false) tog.classList.remove('on');
    else if (saved === true) tog.classList.add('on');
    tog.addEventListener('click', function(){
      tog.classList.toggle('on');
      DS.set('tog_' + k, tog.classList.contains('on'));
    });
  });
  var themeTog = document.querySelector('#setThemeTog');
  if (themeTog) {
    if (document.body.classList.contains('dark')) themeTog.classList.add('on');
    themeTog.addEventListener('click', function(){
      document.body.classList.toggle('dark');
      localStorage.setItem('bk-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    });
  }
}

function _initMobile() {
  var ham = document.querySelector('#hamBtn');
  var ov  = document.querySelector('#mobOverlay');
  if (!ham || !ov) return;
  function _checkMob(){ ham.style.display = window.innerWidth < 768 ? '' : 'none'; }
  _checkMob();
  window.addEventListener('resize', _checkMob);
  ham.addEventListener('click', function(){ ov.classList.toggle('vis'); });
  ov.addEventListener('click', function(e){ if (e.target === ov) ov.classList.remove('vis'); });
  ov.querySelectorAll('[data-nav]').forEach(function(item){
    item.addEventListener('click', function(){ navigateTo(item.dataset.nav); ov.classList.remove('vis'); });
  });
}

function _initMega() {
  var bd = document.querySelector('#megaBD');
  var openMega = null;
  document.querySelectorAll('[data-mega]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var menu = document.querySelector('#mega-' + btn.dataset.mega);
      if (!menu) return;
      if (openMega && openMega !== menu) openMega.classList.remove('open');
      var isOpen = menu.classList.toggle('open');
      if (bd) bd.classList.toggle('show', isOpen);
      openMega = isOpen ? menu : null;
    });
  });
  if (bd) bd.addEventListener('click', function(){
    document.querySelectorAll('.mega').forEach(function(m){ m.classList.remove('open'); });
    bd.classList.remove('show');
    openMega = null;
  });
  document.querySelectorAll('.mega-link[data-nav]').forEach(function(link){
    link.addEventListener('click', function(){
      navigateTo(link.dataset.nav);
      document.querySelectorAll('.mega').forEach(function(m){ m.classList.remove('open'); });
      if (bd) bd.classList.remove('show');
      openMega = null;
    });
  });
  /* Global click — sadece nav dışına tıklayınca mega kapat */
  document.addEventListener('click', function(e){
    if (e.target.closest('nav')) return; /* nav içi tıklamalar mega'yı kapatmasın */
    document.querySelectorAll('.mega').forEach(function(m){ m.classList.remove('open'); });
    if (bd) bd.classList.remove('show');
    openMega = null;
  });
  document.querySelectorAll('.mega').forEach(function(m){
    m.addEventListener('click', function(e){ e.stopPropagation(); });
  });
}

function _initNav() {
  document.querySelectorAll('[data-nav]').forEach(function(btn){
    if (btn.closest('.mega') || btn.closest('.mob-drawer')) return;
    btn.addEventListener('click', function(){ navigateTo(btn.dataset.nav); });
  });
  var logo = document.querySelector('.nav-logo');
  if (logo) logo.addEventListener('click', function(){ navigateTo('feed'); });
  var notifBtn = document.querySelector('#notifBtn');
  if (notifBtn) notifBtn.addEventListener('click', function(e){
    e.stopPropagation();
    /* Ayarlar popup'ını aç, bildirimler sekmesine geç */
    openPopup('settingsPopup');
    setTimeout(function(){
      var notifTab = document.querySelector('.s-nav[data-s="notif"]');
      if (notifTab) notifTab.click();
    }, 50);
  });
  var settBtn = document.querySelector('#settingsBtn');
  if (settBtn) settBtn.addEventListener('click', function(e){
    e.stopPropagation();
    openPopup('settingsPopup');
  });
  var profBtn = document.querySelector('#profileBtn');
  if (profBtn) profBtn.addEventListener('click', function(e){
    e.stopPropagation();
    var u = DS.get('user');
    if (u && typeof buildProfile === 'function') buildProfile(u);
    openPopup('profilePopup');
  });
}

function _initPopups() {
  document.querySelectorAll('[data-close]').forEach(function(btn){
    btn.addEventListener('click', function(e){ e.stopPropagation(); closePopup(btn.dataset.close); });
  });
  document.querySelectorAll('.popup-ov').forEach(function(ov){
    /* Overlay'e tıklayınca kapat, popup-card'a tıklayınca kapatma */
    ov.addEventListener('click', function(e){ if (e.target === ov) closePopup(ov.id); });
  });
  /* Popup card içindeki tıklamalar dışarı sızmasın */
  document.querySelectorAll('.popup-card').forEach(function(card){
    card.addEventListener('click', function(e){ e.stopPropagation(); });
  });
}

function _initSettings() {
  /* ── Sekmeler ── */
  document.querySelectorAll('.s-nav[data-s]').forEach(function(tab){
    tab.addEventListener('click', function(){
      document.querySelectorAll('.s-nav').forEach(function(t){ t.classList.remove('active'); });
      tab.classList.add('active');
      document.querySelectorAll('.s-sec').forEach(function(s){ s.classList.remove('active'); });
      var t2 = document.querySelector('#stab-' + tab.dataset.s);
      if (t2) t2.classList.add('active');
    });
  });

  /* ── Profil: İsim göster ve inline düzenle ── */
  var u = DS.get('user') || {};
  var nameDisp = document.querySelector('#setNameDisplay');
  var nameBtn  = document.querySelector('#setNameBtn');
  var levelDisp = document.querySelector('#setLevelDisplay');
  var levelBtn  = document.querySelector('#resetOB');
  var subInfo   = document.querySelector('#setSubInfo');

  if (nameDisp) nameDisp.textContent = u.name || '';
  if (levelDisp) {
    var lvlLabel = (EDU[u.level] && EDU[u.level].label) ? EDU[u.level].label : '';
    levelDisp.textContent = (lvlLabel + (u.classOrDetail ? ' · ' + u.classOrDetail : '')) || 'Belirtilmedi';
  }
  if (subInfo) {
    var tier = Credits.tier();
    subInfo.innerHTML = '<div style="display:flex;align-items:center;gap:10px;padding:10px 0"><span style="font-size:24px">' + tier.icon + '</span><div><div style="font-weight:700">' + tier.label + ' Plan</div><div style="font-size:12px;color:var(--txt2)">' + tier.priceLabel + ' · ' + Credits.remaining() + ' kredi kaldı</div></div></div>';
  }

  /* İsim değiştir — popup açmadan inline ── */
  if (nameBtn) {
    nameBtn.addEventListener('click', function(){
      var current = (DS.get('user') || {}).name || '';
      var newName = prompt('Yeni ismin:', current);
      if (newName && newName.trim().length >= 2) {
        var usr = DS.get('user') || {};
        usr.name = newName.trim();
        usr.initials = newName.trim().split(' ').map(function(w){ return w[0]; }).join('').toUpperCase().slice(0,2);
        DS.set('user', usr);
        if (nameDisp) nameDisp.textContent = usr.name;
        var navNm = document.querySelector('#navName');
        if (navNm) navNm.textContent = usr.name.split(' ')[0];
        var navAv = document.querySelector('#navAvatar');
        if (navAv) navAv.textContent = usr.initials;
        showToast('İsim güncellendi!');
      }
    });
  }

  /* Seviye / Sınıf değiştir — mini popup ── */
  if (levelBtn) {
    levelBtn.addEventListener('click', function(){
      _showLevelEditPopup();
    });
  }

  /* ── Avatar rengi ── */
  var avatarColors = document.querySelector('#setAvatarColors');
  if (avatarColors) {
    var colors = ['#007AFF','#5856D6','#FF2D55','#FF9F0A','#34C759','#AF52DE','#FF3B30','#00C7BE'];
    var curColor = (DS.get('user') || {}).avatarColor || '#007AFF';
    avatarColors.innerHTML = colors.map(function(c){
      return '<div style="width:26px;height:26px;border-radius:50%;background:' + c + ';cursor:pointer;border:3px solid ' + (c===curColor?'var(--txt)':'transparent') + ';transition:border .15s" data-color="' + c + '"></div>';
    }).join('');
    avatarColors.querySelectorAll('[data-color]').forEach(function(dot){
      dot.addEventListener('click', function(){
        var usr = DS.get('user') || {};
        usr.avatarColor = dot.dataset.color;
        DS.set('user', usr);
        avatarColors.querySelectorAll('[data-color]').forEach(function(d){
          d.style.border = '3px solid ' + (d.dataset.color === dot.dataset.color ? 'var(--txt)' : 'transparent');
        });
        var navAv = document.querySelector('#navAvatar');
        if (navAv) navAv.style.background = dot.dataset.color;
        showToast('Renk güncellendi!');
      });
    });
  }

  /* ── Tema kartları (macOS Studio dahil) ── */
  var savedTheme = DS.get('viewTheme') || 'classic';
  document.querySelectorAll('[data-viewtheme]').forEach(function(card){
    var isActive = card.dataset.viewtheme === savedTheme;
    card.style.border = '2px solid ' + (isActive ? 'var(--acc)' : 'var(--border)');
    card.style.background = isActive ? 'var(--acc-l)' : '';
    var badge = card.querySelector('[style*="Aktif"]') || card.lastElementChild;

    card.addEventListener('click', function(e){
      e.stopPropagation();
      if (card.dataset.viewtheme === 'minimal') { showToast('Minimalist tema yakında!'); return; }
      if (card.dataset.viewtheme === 'modern') {
        /* Studio artık diğer temalar gibi seçilip kalıcı hale geliyor;
           macOS masaüstü modu varsa üstüne bonus olarak açılır. */
        if (window.MacStudio) { window.MacStudio.enter(); }
      }
      DS.set('viewTheme', card.dataset.viewtheme);
      document.querySelectorAll('[data-viewtheme]').forEach(function(c){
        var act = c.dataset.viewtheme === card.dataset.viewtheme;
        c.style.border = '2px solid ' + (act ? 'var(--acc)' : 'var(--border)');
        c.style.background = act ? 'var(--acc-l)' : '';
      });
      _applyViewTheme(card.dataset.viewtheme);
      showToast('Tema değiştirildi!');
    });
  });
  _applyViewTheme(savedTheme);

  /* ── Font boyutu ── */
  var fs = document.querySelector('#setFontSize');
  if (fs) {
    fs.value = DS.get('fontSize') || 'normal';
    fs.addEventListener('change', function(){
      DS.set('fontSize', fs.value);
      document.documentElement.style.fontSize = fs.value === 'large' ? '17px' : fs.value === 'small' ? '13px' : '15px';
    });
  }

  /* ── Başlangıç sayfası ── */
  var sp = document.querySelector('#startPage');
  if (sp) { sp.value = DS.get('startPage') || 'feed'; sp.addEventListener('change', function(){ DS.set('startPage', sp.value); }); }

  /* ── Sıfırlama butonları ── */
  document.querySelectorAll('.s-reset-btn').forEach(function(btn){
    btn.addEventListener('click', function(){ if (btn.dataset.reset){ DS.remove(btn.dataset.reset); showToast('Sıfırlandı!'); } });
  });
  var resetAll = document.querySelector('#setResetAll');
  if (resetAll) resetAll.addEventListener('click', function(){
    if (confirm('Tüm veriler silinecek. Emin misin?')){ localStorage.clear(); location.reload(); }
  });
  var resetOB2 = document.querySelector('#resetOB2');
  if (resetOB2) resetOB2.addEventListener('click', function(){ closePopup('settingsPopup'); if (typeof restartOnboarding === 'function') restartOnboarding(); });

  /* ── Diğer ── */
  var pinReset = document.querySelector('#setPinReset');
  if (pinReset) pinReset.addEventListener('click', function(){ DS.remove('myspace_pin'); showToast('PIN sıfırlandı!'); });
  var engBtn = document.querySelector('#setEngBtn');
  if (engBtn) engBtn.addEventListener('click', function(){ showToast('İngilizce desteği yakında!'); });
  var logoutBtn = document.querySelector('#logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', function(){
    /* Sadece oturumu kapat — tema, notlar, onboarding vb. veriler SİLİNMEZ.
       Tekrar giriş yapınca kullanıcı her şeyi olduğu gibi bulur. */
    if (confirm('Çıkış yapmak istiyor musun?')){ localStorage.removeItem('bk_auth'); location.href = 'index.html'; }
  });
}

/* ── Tema uygula ── */
function _applyViewTheme(theme) {
  document.body.classList.remove('modern');
  if (theme === 'modern') document.body.classList.add('modern');
  /* Tema kartlarındaki aktif badge'i güncelle */
  document.querySelectorAll('[data-viewtheme]').forEach(function(c){
    var badges = c.querySelectorAll('div');
    badges.forEach(function(b){
      if (b.textContent.includes('Aktif')) b.textContent = '';
    });
    if (c.dataset.viewtheme === theme) {
      var last = c.lastElementChild;
      if (last) last.textContent = '✓ Aktif';
    }
  });
}

/* ── Seviye/Sınıf mini popup ── */
function _showLevelEditPopup() {
  var existing = document.querySelector('#levelEditPopup');
  if (existing) existing.remove();

  var u = DS.get('user') || {};
  var pop = document.createElement('div');
  pop.id = 'levelEditPopup';
  pop.className = 'popup-ov';
  pop.style.zIndex = '1100';

  var levelOpts = Object.keys(EDU).map(function(k){
    return '<div class="ob-opt lep-opt" data-lv="' + k + '" style="flex-direction:row;text-align:left;gap:10px;padding:12px 14px;' + (u.level===k?'border-color:var(--acc);background:var(--acc-l)':'') + '">' +
      '<span>' + {ortaokul:'📚',lise:'🏫',universite:'🎓',mezun:'📋'}[k] + '</span>' +
      '<b>' + EDU[k].label + '</b></div>';
  }).join('');

  pop.innerHTML = '<div class="popup-card" style="max-width:400px"><div class="popup-hdr"><h2>📚 Seviye & Sınıf</h2><button class="popup-close" id="lepClose">✕</button></div><div class="popup-body"><div style="margin-bottom:16px"><div style="font-size:13px;font-weight:600;margin-bottom:8px">Seviyeni seç</div><div style="display:flex;flex-direction:column;gap:6px" id="lepLevelList">' + levelOpts + '</div></div><div id="lepDetailWrap" style="margin-bottom:16px;display:none"><div style="font-size:13px;font-weight:600;margin-bottom:8px" id="lepDetailTitle">Sınıf / Detay</div><div style="display:flex;flex-direction:column;gap:6px" id="lepDetailList"></div></div><button class="ob-btn ob-btn-p" id="lepSave" style="width:100%" disabled>Kaydet</button></div></div>';

  document.body.appendChild(pop);
  setTimeout(function(){ pop.classList.add('vis'); }, 10);

  var selLevel = u.level || '';
  var selDetail = u.classOrDetail || '';

  function renderDetail(lv) {
    var info = EDU[lv];
    var wrap = document.querySelector('#lepDetailWrap');
    var list = document.querySelector('#lepDetailList');
    var title = document.querySelector('#lepDetailTitle');
    if (!wrap || !list) return;
    var items = [];
    if (lv==='ortaokul'||lv==='lise') { title.textContent='Sınıfını seç'; items=info.classes; }
    else if (lv==='universite') { title.textContent='Fakülteni seç'; items=info.faculties; }
    else if (lv==='mezun') { title.textContent='Sınavını seç'; items=info.exams_list; }
    if (items.length) {
      wrap.style.display='';
      list.innerHTML = items.map(function(it){
        return '<div class="ob-opt lep-detail" data-val="' + it + '" style="flex-direction:row;text-align:left;gap:10px;padding:10px 14px;' + (selDetail===it?'border-color:var(--acc);background:var(--acc-l)':'') + '"><span>▸</span><span>' + it + '</span></div>';
      }).join('');
      list.querySelectorAll('.lep-detail').forEach(function(d){
        d.addEventListener('click', function(){
          list.querySelectorAll('.lep-detail').forEach(function(x){ x.style.borderColor=''; x.style.background=''; });
          d.style.borderColor='var(--acc)'; d.style.background='var(--acc-l)';
          selDetail = d.dataset.val;
          var saveBtn = document.querySelector('#lepSave');
          if (saveBtn) saveBtn.disabled = false;
        });
      });
    } else {
      wrap.style.display='none';
      var saveBtn = document.querySelector('#lepSave');
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  pop.querySelectorAll('.lep-opt').forEach(function(o){
    o.addEventListener('click', function(){
      pop.querySelectorAll('.lep-opt').forEach(function(x){ x.style.borderColor=''; x.style.background=''; });
      o.style.borderColor='var(--acc)'; o.style.background='var(--acc-l)';
      selLevel = o.dataset.lv;
      selDetail = '';
      var saveBtn = document.querySelector('#lepSave');
      if (saveBtn) saveBtn.disabled = true;
      renderDetail(selLevel);
    });
  });

  if (selLevel) renderDetail(selLevel);

  document.querySelector('#lepClose').addEventListener('click', function(){
    pop.classList.remove('vis');
    setTimeout(function(){ pop.remove(); }, 350);
  });
  pop.addEventListener('click', function(e){ if(e.target===pop){ pop.classList.remove('vis'); setTimeout(function(){ pop.remove(); },350); } });

  document.querySelector('#lepSave').addEventListener('click', function(){
    var usr = DS.get('user') || {};
    usr.level = selLevel;
    usr.classOrDetail = selDetail;
    DS.set('user', usr);
    /* levelDisp güncelle */
    var ld = document.querySelector('#setLevelDisplay');
    if (ld) {
      var ll = (EDU[selLevel]&&EDU[selLevel].label)||'';
      ld.textContent = ll + (selDetail?' · '+selDetail:'');
    }
    pop.classList.remove('vis');
    setTimeout(function(){ pop.remove(); }, 350);
    showToast('Seviye güncellendi!');
  });
}

function initPage() {
  var startPage = DS.get('startPage') || 'feed';
  navigateTo(startPage);
}
function _updateNavGroupBtn() {
  var btn = document.querySelector('#navGroupBtn');
  if (!btn) return;
  var group = DS.get('my_group');
  btn.style.display = group ? '' : 'none';
}
function initUI() {
  _initToggles();
  _initMobile();
  _initMega();
  _initNav();
  _initPopups();
  _initSettings();
}

/* ═══════════════════════════════════════
   onboarding.js
   ═══════════════════════════════════════ */
var obData = { name:'', level:'', classOrDetail:'', faculty:'', examChoice:'', skill:'', goals:[], dreamJob:'' };
var obStep = 1;

function showObStep(n) {
  obStep = n;
  document.querySelectorAll('.ob-step').forEach(function(s){ s.classList.remove('active'); });
  var s = document.querySelector('#ob-step-' + n);
  if (s) { void s.offsetWidth; s.classList.add('active'); }
  var prog = document.querySelector('#obProg');
  if (prog) prog.style.width = ((n - 1) / 5 * 100) + '%';
}

function buildStep3() {
  var list    = document.querySelector('#obClassList');
  var nextBtn = document.querySelector('#obN3');
  if (!list) return;
  list.innerHTML = '';
  if (nextBtn) { nextBtn.disabled = true; }
  var lv   = obData.level;
  var info = EDU[lv];
  if (!info) return;
  function addItem(icon, label, onSel) {
    var el = document.createElement('div');
    el.className = 'ob-scroll-item';
    el.innerHTML = '<span>' + icon + '</span>' + label;
    el.addEventListener('click', function(){
      document.querySelectorAll('#obClassList .ob-scroll-item').forEach(function(x){ x.classList.remove('sel'); });
      el.classList.add('sel');
      onSel();
      if (nextBtn) { nextBtn.disabled = false; }
    });
    list.appendChild(el);
  }
  if (lv === 'ortaokul' || lv === 'lise') {
    document.querySelector('#ob3Emoji').textContent = '📖';
    document.querySelector('#ob3Title').textContent = 'Sınıfını seç';
    document.querySelector('#ob3Sub').textContent   = 'Hangi sınıftasın?';
    info.classes.forEach(function(c){ addItem('📗', c, function(){ obData.classOrDetail = c; }); });
  } else if (lv === 'universite') {
    document.querySelector('#ob3Emoji').textContent = '🏛️';
    document.querySelector('#ob3Title').textContent = 'Fakülteni seç';
    document.querySelector('#ob3Sub').textContent   = 'Hangi fakültedesin?';
    info.faculties.forEach(function(f){ addItem('🎓', f, function(){ obData.faculty = f; obData.classOrDetail = f; }); });
  } else if (lv === 'mezun') {
    document.querySelector('#ob3Emoji').textContent = '📋';
    document.querySelector('#ob3Title').textContent = 'Hangi sınava hazırlanıyorsun?';
    document.querySelector('#ob3Sub').textContent   = 'Ana sınavını seç.';
    info.exams_list.forEach(function(x){ addItem('📝', x, function(){ obData.examChoice = x; obData.classOrDetail = x; }); });
  }
}

function buildStep5() {
  var grid = document.querySelector('#obGoalGrid');
  if (!grid) return;
  grid.innerHTML = '';
  var goals = (EDU[obData.level] && EDU[obData.level].goals) ? EDU[obData.level].goals : [];
  goals.forEach(function(gl){
    var el = document.createElement('div');
    el.className = 'ob-opt';
    el.style.cssText = 'flex-direction:row;text-align:left;gap:12px';
    el.dataset.g = gl;
    el.innerHTML = '<span>🎯</span><b>' + gl + '</b>';
    el.addEventListener('click', function(){
      el.classList.toggle('sel');
      obData.goals = Array.from(document.querySelectorAll('#obGoalGrid .sel')).map(function(x){ return x.dataset.g; });
    });
    grid.appendChild(el);
  });
}

function buildStep6() {
  var s = document.querySelector('#obSummary');
  if (!s) return;
  var ll = (EDU[obData.level] && EDU[obData.level].label) ? EDU[obData.level].label : '';
  var rows = [
    ['İsim', obData.name],
    ['Seviye', ll],
    ['Detay', obData.classOrDetail],
    ['Ders Durumu', SKILL_LABELS[obData.skill] || ''],
    ['Hedefler', obData.goals.join(', ') || 'Belirtilmedi']
  ];
  if (obData.dreamJob) rows.push(['Meslek', obData.dreamJob]);
  s.innerHTML = rows.map(function(r){
    return '<div class="ob-sum-row"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>';
  }).join('');
}

function finishOnboarding() {
  var ini = obData.name.split(' ').map(function(w){ return w[0] || ''; }).join('').toUpperCase().slice(0,2) || '?';
  var userData = { name: obData.name, initials: ini, xp: 0 };
  Object.keys(obData).forEach(function(k){ userData[k] = obData[k]; });
  DS.set('user', userData);
  DS.set('onboarded', true);
  seedNotes();
  var ob  = document.querySelector('#onboarding');
  var app = document.querySelector('#appShell');
  if (ob) ob.classList.add('hidden');
  setTimeout(function(){
    if (ob)  ob.style.display = 'none';
    if (app) app.classList.add('vis');
    initApp();
  }, 400);
}

function restartOnboarding() {
  DS.remove('onboarded');
  var u = DS.get('user');
  if (u) {
    Object.keys(u).forEach(function(k){ if (k in obData) obData[k] = u[k]; });
    var inp = document.querySelector('#obName');
    if (inp) inp.value = u.name || '';
  }
  var app = document.querySelector('#appShell');
  var ob  = document.querySelector('#onboarding');
  if (app) app.classList.remove('vis');
  if (ob)  { ob.style.display = 'flex'; ob.classList.remove('hidden'); }
  showObStep(1);
}

function initOnboarding() {
  var nameInp  = document.querySelector('#obName');
  var nextBtn1 = document.querySelector('#obN1');

  if (nameInp && nextBtn1) {
    function checkName() {
      var ok = nameInp.value.trim().length >= 2;
      nextBtn1.disabled = !ok;
    }
    nameInp.addEventListener('input',  checkName);
    nameInp.addEventListener('keyup',  checkName);
    nameInp.addEventListener('paste',  function(){ setTimeout(checkName, 10); });
    nameInp.addEventListener('change', checkName);
    checkName();

    nextBtn1.addEventListener('click', function(){
      var val = nameInp.value.trim();
      if (val.length >= 2) { obData.name = val; showObStep(2); }
    });
    nameInp.addEventListener('keydown', function(e){
      if (e.key === 'Enter' && !nextBtn1.disabled) nextBtn1.click();
    });
  }

  var nextBtn2 = document.querySelector('#obN2');
  var backBtn2 = document.querySelector('#obB2');
  document.querySelectorAll('#obLevelGrid .ob-opt').forEach(function(o){
    o.addEventListener('click', function(){
      document.querySelectorAll('#obLevelGrid .ob-opt').forEach(function(x){ x.classList.remove('sel'); });
      o.classList.add('sel');
      obData.level = o.dataset.level;
      if (nextBtn2) nextBtn2.disabled = false;
    });
  });
  if (nextBtn2) nextBtn2.addEventListener('click', function(){ buildStep3(); showObStep(3); });
  if (backBtn2) backBtn2.addEventListener('click', function(){ showObStep(1); });

  var nextBtn3 = document.querySelector('#obN3');
  var backBtn3 = document.querySelector('#obB3');
  if (nextBtn3) nextBtn3.addEventListener('click', function(){ showObStep(4); });
  if (backBtn3) backBtn3.addEventListener('click', function(){ showObStep(2); });

  var nextBtn4 = document.querySelector('#obN4');
  var backBtn4 = document.querySelector('#obB4');
  document.querySelectorAll('#obSkillGrid .ob-opt').forEach(function(o){
    o.addEventListener('click', function(){
      document.querySelectorAll('#obSkillGrid .ob-opt').forEach(function(x){ x.classList.remove('sel'); });
      o.classList.add('sel');
      obData.skill = o.dataset.skill;
      if (nextBtn4) nextBtn4.disabled = false;
    });
  });
  if (nextBtn4) nextBtn4.addEventListener('click', function(){ buildStep5(); showObStep(5); });
  if (backBtn4) backBtn4.addEventListener('click', function(){ showObStep(3); });

  var nextBtn5 = document.querySelector('#obN5');
  var backBtn5 = document.querySelector('#obB5');
  if (nextBtn5) nextBtn5.addEventListener('click', function(){
    var dj = document.querySelector('#obDreamJob');
    obData.dreamJob = dj ? dj.value.trim() : '';
    buildStep6();
    showObStep(6);
  });
  if (backBtn5) backBtn5.addEventListener('click', function(){ showObStep(4); });

  var backBtn6  = document.querySelector('#obB6');
  var finishBtn = document.querySelector('#obFinish');
  if (backBtn6)  backBtn6.addEventListener('click',  function(){ showObStep(5); });
  if (finishBtn) finishBtn.addEventListener('click', finishOnboarding);
}

/* ═══════════════════════════════════════
   app.js — Boot
   ═══════════════════════════════════════ */
function initApp() {
  try {
    var u = DS.get('user');
    if (!u) return;
    var navAv = document.querySelector('#navAvatar');
    var navNm = document.querySelector('#navName');
    if (navAv) navAv.textContent = u.initials || '?';
    if (navNm) navNm.textContent = u.name.split(' ')[0];
    if (u.avatarColor && navAv) navAv.style.background = u.avatarColor;
    var h = new Date().getHours();
    var g = 'Merhaba';
    if (h >= 5 && h < 12) g = 'Günaydın';
    else if (h >= 12 && h < 18) g = 'İyi günler';
    else if (h >= 18 && h < 22) g = 'İyi akşamlar';
    else g = 'İyi geceler';
    var greetEl = document.querySelector('#greeting');
    var feedSub = document.querySelector('#feedSub');
    if (greetEl) greetEl.textContent = g + ', ' + u.name.split(' ')[0] + '!';
    if (feedSub) feedSub.innerHTML = '<strong>3 yeni not</strong> ve <strong>5 görev</strong> seni bekliyor.';
    buildDashboard(u);
    buildProfile(u);
    initUI();
    initSaaS();
    initFeed();
    initBilge();
    initPages();
    initPage();
    if (!DS.get('tour_done')) setTimeout(function(){ startTour(); }, 800);
    setTimeout(function(){ if (typeof _updateNavGroupBtn === 'function') _updateNavGroupBtn(); }, 200);
  } catch (err) {
    console.error('initApp error:', err);
    try { initUI(); initPages(); initPage(); } catch (e2) { console.error('Recovery:', e2); }
  }
}

(function boot() {
  if (localStorage.getItem('bk-theme') === 'dark') document.body.classList.add('dark');
  try {
    var fs = localStorage.getItem('bk_fontSize');
    if (fs) {
      var v = JSON.parse(fs);
      document.documentElement.style.fontSize = v === 'large' ? '17px' : v === 'small' ? '13px' : '15px';
    }
  } catch(e) {}

  var onboarded = DS.get('onboarded');
  var obEl  = document.querySelector('#onboarding');
  var appEl = document.querySelector('#appShell');

  if (onboarded) {
    if (obEl)  obEl.style.display = 'none';
    if (appEl) appEl.classList.add('vis');
    initApp();
  } else {
    if (appEl) appEl.classList.remove('vis');
    if (obEl)  { obEl.style.display = 'flex'; obEl.classList.remove('hidden'); }
    initOnboarding();
  }
})();