const data = window.CATROOMMATE_DATA;
const formatPrice = (value) => new Intl.NumberFormat('zh-TW').format(value);
const roomGrid = document.querySelector('#roomGrid');

roomGrid.innerHTML = data.rooms.map((room) => `
  <article class="room-card" data-room="${room.name}">
    <div class="room-photo"><img src="${room.image}" alt="${room.name}官方房型照片" loading="lazy"><span class="room-id">${room.id}</span></div>
    <div class="room-content">
      <h3>${room.name}</h3>
      <div class="room-price"><strong>${formatPrice(room.price)}</strong><small>元／晚</small></div>
      <dl class="room-facts">
        <div><dt>上限</dt><dd>${room.capacity} 隻</dd></div>
      </dl>
      <button class="memory-btn" type="button" aria-expanded="false">看尺寸、加貓與口訣</button>
    </div><p class="memory-note"><b>加貓：</b>${room.extra}<br><b>尺寸：</b>${room.size}<br><b>特色：</b>${room.feature}<br><b>口訣：</b>${room.memory}</p>
  </article>`).join('');

roomGrid.addEventListener('click', (event) => {
  const button = event.target.closest('.memory-btn'); if (!button) return;
  const card = button.closest('.room-card'); const open = card.classList.toggle('open');
  button.setAttribute('aria-expanded', open); button.textContent = open ? '收起詳細資料' : '看尺寸、加貓與口訣';
});

const priceTabs = document.querySelector('#priceTabs');
const priceBody = document.querySelector('#priceBody');
function renderPriceTable(name) {
  priceBody.innerHTML = data.multiRoom[name].map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
  priceTabs.querySelectorAll('button').forEach(button => button.classList.toggle('active', button.dataset.name === name));
}
priceTabs.innerHTML = Object.keys(data.multiRoom).map((name, index) => `<button type="button" role="tab" data-name="${name}" aria-selected="${index === 0}">${name.replace('小木屋','')}</button>`).join('');
priceTabs.addEventListener('click', (event) => { const button = event.target.closest('button'); if (button) renderPriceTable(button.dataset.name); });
renderPriceTable(Object.keys(data.multiRoom)[0]);

document.querySelector('#cancelBody').innerHTML = data.cancellation.map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td></tr>`).join('');
document.querySelector('#faqList').innerHTML = data.faq.map(([q,a], i) => `<details class="faq-item"><summary>${String(i+1).padStart(2,'0')}｜${q}</summary><p>${a}</p></details>`).join('');

const icon = (name) => `<svg class="ui-icon" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
document.querySelector('#sopTimeline').innerHTML = data.sopTimeline.map((item, index) => `
  <li class="timeline-item">
    <div class="timeline-mark">${icon(item.icon)}<span>${String(index + 1).padStart(2, '0')}</span></div>
    <div class="timeline-copy"><time>${item.time}</time><span class="timeline-label">這段要做</span><h3>${item.title}</h3><ul>${item.points.map(point => `<li>${point}</li>`).join('')}</ul></div>
  </li>`).join('');
document.querySelector('#sopModuleGrid').innerHTML = data.sopModules.map(module => `
  <details class="sop-module ${module.tone || ''}">
    <summary><span class="sop-module-icon">${icon(module.icon)}</span><span><small>${module.code}｜${module.title}</small><strong><i>先記這句</i>${module.cue}</strong><em>點開看完整做法</em></span></summary>
    <ul>${module.items.map(item => `<li>${item}</li>`).join('')}</ul>
  </details>`).join('');
document.querySelector('#serviceFlowList').innerHTML = data.serviceFlows.map(flow => `
  <details class="service-flow">
    <summary><span>${icon(flow.icon)}</span><span><strong>${flow.title}</strong><small>${flow.note}。點開後照 1、2、3 往下做。</small></span></summary>
    <ol>${flow.steps.map((step, index) => `<li><i>${index + 1}</i><span>${step}</span></li>`).join('')}</ol>
  </details>`).join('');

const roomQuestions = data.rooms.map(room => ({
  category: '房型', question: '看照片回答：這是哪一種房型？', image: room.image,
  answer: `${room.name}｜${formatPrice(room.price)} 元／晚｜最多 ${room.capacity} 隻｜${room.extra}｜${room.size}`
}));
const quizQuestions = [...roomQuestions, ...data.quizQuestions];
const quizCategoryNames = ['全部', '房型', '值班SOP', '接待流程', '時間費用', '健康入住', '照顧應變', '取消優惠', '春節'];
const quizCategories = document.querySelector('#quizCategories');
const quizCard = document.querySelector('#quizCard');
const quizImage = document.querySelector('#quizImage');
const quizQuestion = document.querySelector('#quizQuestion');
const quizAnswer = document.querySelector('#quizAnswer');
const quizCategory = document.querySelector('#quizCategory');
const quizProgress = document.querySelector('#quizProgress');
let activeQuizCategory = '全部';
let quizDeck = [];
let quizPosition = 0;

function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function resetQuizDeck() {
  const pool = activeQuizCategory === '全部' ? quizQuestions : quizQuestions.filter(item => item.category === activeQuizCategory);
  quizDeck = shuffled(pool); quizPosition = 0; renderQuiz();
}
function renderQuiz() {
  const item = quizDeck[quizPosition]; if (!item) return;
  const hasImage = Boolean(item.image);
  quizCard.classList.remove('revealed'); quizCard.classList.toggle('text-only', !hasImage);
  quizQuestion.textContent = item.question; quizAnswer.textContent = '答案會顯示在這裡。';
  quizCategory.textContent = item.category; quizProgress.textContent = `第 ${quizPosition + 1}／${quizDeck.length} 題`;
  if (hasImage) { quizImage.src = item.image; quizImage.alt = '房型辨認題照片'; } else { quizImage.removeAttribute('src'); quizImage.alt = ''; }
}
function revealQuiz(){ quizCard.classList.add('revealed'); quizAnswer.textContent = quizDeck[quizPosition].answer; }

quizCategories.innerHTML = quizCategoryNames.map(name => `<button type="button" data-category="${name}" class="${name === '全部' ? 'active' : ''}">${name}</button>`).join('');
quizCategories.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  activeQuizCategory = button.dataset.category;
  quizCategories.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
  resetQuizDeck();
});
document.querySelector('#quizReveal').addEventListener('click', revealQuiz);
function advanceQuiz() {
  quizPosition += 1;
  if (quizPosition >= quizDeck.length) quizDeck = shuffled(quizDeck), quizPosition = 0;
  renderQuiz();
}
document.querySelector('#nextQuiz').addEventListener('click', advanceQuiz);
document.querySelector('#retryQuiz').addEventListener('click', () => {
  const insertAt = Math.min(quizPosition + 4, quizDeck.length);
  quizDeck.splice(insertAt, 0, quizDeck[quizPosition]);
  advanceQuiz();
});
resetQuizDeck();

const mobileQuery=window.matchMedia('(max-width: 699px)');
const viewButtons=[...document.querySelectorAll('.jump-nav [data-view], .mobile-nav [data-view]')];
const viewPanels=[...document.querySelectorAll('[data-view-panel]')];
const availableViews=viewPanels.map(panel=>panel.dataset.viewPanel);
let activeView=availableViews.includes(location.hash.slice(1))?location.hash.slice(1):'numbers';
function applyView(){
  viewPanels.forEach(panel=>panel.classList.toggle('view-hidden',panel.dataset.viewPanel!==activeView));
  viewButtons.forEach(button=>{const active=button.dataset.view===activeView;button.classList.toggle('active',active);button.setAttribute('aria-current',active?'page':'false');});
}
function switchView(nextView,{updateHistory=true,scroll=true}={}){
  if(!availableViews.includes(nextView))return;
  activeView=nextView;
  applyView();
  if(updateHistory)history.pushState(null,'',`#${activeView}`);
  if(scroll)window.scrollTo({top:document.querySelector('main').offsetTop,behavior:'smooth'});
}
viewButtons.forEach(button=>button.addEventListener('click',event=>{event.preventDefault();switchView(button.dataset.view);}));

window.addEventListener('popstate',()=>switchView(location.hash.slice(1),{updateHistory:false,scroll:false}));
mobileQuery.addEventListener('change',applyView); applyView();
