const data = window.CATROOMMATE_DATA;
const formatPrice = (value) => new Intl.NumberFormat('zh-TW').format(value);
const roomGrid = document.querySelector('#roomGrid');

roomGrid.innerHTML = data.rooms.map((room) => `
  <article class="room-card" data-room="${room.name}">
    <div class="room-photo"><img src="${room.image}" alt="${room.name}官方房型照片" loading="lazy"><span class="room-id">${room.id}</span></div>
    <div class="room-content">
      <h3>${room.name}</h3>
      <dl class="room-facts">
        <div><dt>上限</dt><dd>${room.capacity} 隻</dd></div>
      </dl>
      <button class="memory-btn" type="button" aria-expanded="false">看尺寸、特色與口訣</button>
    </div><p class="memory-note"><b>尺寸：</b>${room.size}<br><b>特色：</b>${room.feature}<br><b>口訣：</b>${room.memory}</p>
  </article>`).join('');

roomGrid.addEventListener('click', (event) => {
  const button = event.target.closest('.memory-btn'); if (!button) return;
  const card = button.closest('.room-card'); const open = card.classList.toggle('open');
  button.setAttribute('aria-expanded', open); button.textContent = open ? '收起詳細資料' : '看尺寸、特色與口訣';
});

const priceRoomGrid = document.querySelector('#priceRoomGrid');
priceRoomGrid.innerHTML = data.rooms.map((room) => `
  <article class="price-room-card">
    <small>${room.name}</small>
    <p><strong>${formatPrice(room.price)}</strong><span>元／晚</span></p>
    <dl><div><dt>入住上限</dt><dd>${room.capacity} 隻</dd></div><div><dt>加貓</dt><dd>${room.extra}</dd></div></dl>
  </article>`).join('');

const calcMethod = document.querySelector('#calcMethod');
const calcRoom = document.querySelector('#calcRoom');
const calcCats = document.querySelector('#calcCats');
const calcCheckinDate = document.querySelector('#calcCheckinDate');
const calcCheckinTime = document.querySelector('#calcCheckinTime');
const calcCheckoutDate = document.querySelector('#calcCheckoutDate');
const calcCheckoutTime = document.querySelector('#calcCheckoutTime');
const calcDaycareDate = document.querySelector('#calcDaycareDate');
const calcDaycareStart = document.querySelector('#calcDaycareStart');
const calcDaycareEnd = document.querySelector('#calcDaycareEnd');
const calcOldRoommate = document.querySelector('#calcOldRoommate');
const calcNotice = document.querySelector('#calcNotice');
const calcDateStatus = document.querySelector('#calcDateStatus');
const calcBreakdown = document.querySelector('#calcBreakdown');
const calcTotal = document.querySelector('#calcTotal');
const springRoomPrices = { CLS: 1500, SUN: 1800, SPC: 2400, LUX: 4200 };
const currency = value => `${formatPrice(Math.round(value))} 元`;
calcRoom.innerHTML = data.rooms.map(room => `<option value="${room.id}">${room.name}</option>`).join('');
const holidayRanges = [['2026-10-23','2026-10-26'],['2026-12-24','2026-12-27'],['2026-12-31','2027-01-03'],['2027-02-26','2027-03-01']];
const springStart = '2027-02-03';
const springEnd = '2027-02-10';
const dateMs = date => new Date(`${date}T00:00:00Z`).getTime();
const dateOffset = (date, days) => new Date(dateMs(date) + days * 86400000).toISOString().slice(0,10);
const dateLabel = date => date.replaceAll('-', '/');
const isSpring = date => date >= springStart && date <= springEnd;
const isHoliday = date => holidayRanges.some(([start,end]) => date >= start && date <= end);
const category = date => isSpring(date) ? '春節' : isHoliday(date) ? '連假' : '一般日';
const categoryName = type => type === '一般日' ? '非連續假期（一般日）' : type === '連假' ? '連續假期' : '春節特別價';
function setDateStatus(title, badge, rows, tone = 'regular') {
  calcDateStatus.className = `calc-date-status is-${tone}`;
  calcDateStatus.innerHTML = `<div class="calc-date-status-head"><b>日期判定</b><strong>${title}</strong><span>${badge}</span></div><ul>${rows.map(row => `<li>${row}</li>`).join('')}</ul>`;
}
function groupDateSegments(dates) {
  return dates.reduce((groups, date) => {
    const type = category(date);
    const current = groups[groups.length - 1];
    if (current && current.type === type && dateOffset(current.end, 1) === date) current.end = date;
    else groups.push({ type, start: date, end: date });
    return groups;
  }, []);
}
function showStayDateStatus(dates, checkout) {
  const types = new Set(dates.map(category));
  const hasHolidayDates = types.has('連假');
  const hasSpringDates = types.has('春節');
  const allSpecial = !types.has('一般日');
  const title = hasHolidayDates && hasSpringDates ? '跨連續假期與春節' : hasSpringDates ? (types.size > 1 ? '含春節特別價' : '春節特別價') : hasHolidayDates ? (allSpecial ? '連續假期' : '含連續假期') : '非連續假期（一般日）';
  const tone = hasSpringDates ? 'spring' : hasHolidayDates ? 'holiday' : 'regular';
  const rows = groupDateSegments(dates).map(group => {
    const count = dates.filter(date => date >= group.start && date <= group.end).length;
    return `<b>${categoryName(group.type)}</b>：${dateLabel(group.start)}${group.end !== group.start ? `–${dateLabel(group.end)}` : ''}（${count} 個住宿夜）`;
  });
  rows.push(`<b>退房日</b>：${dateLabel(checkout)}（${categoryName(category(checkout))}；不計住宿晚數）`);
  setDateStatus(title, `${dates.length} 個住宿夜`, rows, tone);
}
const normalNightPrice = room => room.price;
function perNight(room, cats, date) {
  const spring = isSpring(date);
  const roomPrice = spring ? springRoomPrices[room.id] : normalNightPrice(room);
  const firstExtraCat = spring && ['CLS','SUN'].includes(room.id) ? 2 : Number(room.extra.match(/第\s*(\d+)/)?.[1] || 2);
  const extraCatCount = Math.max(0, cats - firstExtraCat + 1);
  const catRate = spring ? 300 : 150;
  return { roomPrice, extraCatCount, catRate, total: roomPrice + extraCatCount * catRate };
}

function fillCatOptions() {
  const room = data.rooms.find(item => item.id === calcRoom.value) || data.rooms[0];
  const current = Math.min(Number(calcCats.value) || 1, room.capacity);
  calcCats.innerHTML = Array.from({ length: room.capacity }, (_, index) => `<option value="${index + 1}">${index + 1} 隻</option>`).join('');
  calcCats.value = String(current);
}

function updatePriceEstimate() {
  const room = data.rooms.find(item => item.id === calcRoom.value) || data.rooms[0];
  const cats = Number(calcCats.value) || 1;
  const stayMode = calcMethod.value === 'stay';
  document.querySelectorAll('.calc-stay-only').forEach(el => { el.hidden = !stayMode; });
  document.querySelectorAll('.calc-daycare-only').forEach(el => { el.hidden = stayMode; });
  let total = 0;
  let baseFee = 0;
  let timeFee = 0;
  let discountFee = 0;
  const steps = [];
  const notes = [];
  steps.push(`步驟 1｜房型與貓數：${room.name}，${cats} 隻（房型上限 ${room.capacity} 隻）；每晚按所選日期套用房價與加貓規則。`);
  if (!stayMode) {
    const date = calcDaycareDate.value;
    const start = calcDaycareStart.value;
    const end = calcDaycareEnd.value;
    if (!date || !start || !end || date < '2026-10-12' || date > '2027-03-31' || end <= start) {
      setDateStatus('請確認日期與時段', '尚未完成', ['安親日期需在 2026/10/12–2027/3/31，結束時間須晚於開始時間。'], 'invalid');
      calcNotice.textContent = '請選擇範圍內日期，並確認安親結束時間晚於開始時間。';
      calcBreakdown.innerHTML = '<li>資料未完整，暫不計價。</li>';
      calcTotal.textContent = '—'; return;
    }
    const daycareCategory = category(date);
    steps.push(`步驟 2｜服務方式：安親（不過夜）。`);
    steps.push(`步驟 3｜日期：${dateLabel(date)}，${categoryName(daycareCategory)}；安親不計住宿晚數。`);
    setDateStatus(categoryName(daycareCategory), `${dateLabel(date)} 安親`, [`選定日期為${categoryName(daycareCategory)}。${daycareCategory === '一般日' ? '安親僅依一般日規則試算。' : '此日依連假／春節規則處理，不能直接按一般安親估價。'}`], daycareCategory === '春節' ? 'spring' : daycareCategory === '連假' ? 'holiday' : 'regular');
    if (isHoliday(date) || isSpring(date)) {
      calcNotice.textContent = `${dateLabel(date)} 判定為${category(date)}；官網規定連假／春節不提供安親，不能直接估價，請問夥伴。`;
      calcBreakdown.innerHTML = '<li>日期規則不允許一般安親試算，請先向夥伴確認。</li>';
      calcTotal.textContent = '請確認'; return;
    }
    const duration = (Number(end.slice(0,2)) * 60 + Number(end.slice(3)) - Number(start.slice(0,2)) * 60 - Number(start.slice(3))) / 60;
    const billableHours = Math.max(6, duration);
    const rate = perNight(room, cats, date);
    const hourRate = rate.total * .10;
    baseFee = hourRate * billableHours;
    total = baseFee;
    steps.push(`步驟 4｜安親時段：${start}–${end}，實際 ${duration} 小時；計費時數 max(${duration}, 6) = ${billableHours} 小時。`);
    steps.push(`安親基準：${currency(rate.roomPrice)} 房型價 + ${rate.extraCatCount} 隻 × ${currency(rate.catRate)} 加貓費 = ${currency(rate.total)}／晚。`);
    steps.push(`安親費＝${currency(rate.total)} × 10% × ${billableHours} 小時 = ${currency(baseFee)}。安親沒有住宿折扣；日期不合規時不估價。`);
    calcNotice.textContent = duration < 6 ? `未滿 6 小時，依最低 6 小時計；依官網規則，安親限一般日營業時段，仍須預約確認。` : '安親以實際時數計，最低 6 小時；須預約確認。';
  } else {
    const start = calcCheckinDate.value;
    const checkout = calcCheckoutDate.value;
    const checkinTime = calcCheckinTime.value;
    const checkoutTime = calcCheckoutTime.value;
    if (!start || !checkout || !checkinTime || !checkoutTime || start < '2026-10-12' || start > '2027-03-30' || checkout > '2027-03-31' || checkout <= start) {
      setDateStatus('請先選擇有效日期', '尚未判定', ['住宿日期需介於 2026/10/12–2027/3/31，退房日須晚於入住日。'], 'invalid');
      calcNotice.textContent = '入住日須介於 2026/10/12–2027/3/30，退房日須晚於入住日且不超過 2027/3/31。';
      calcBreakdown.innerHTML = '<li>日期或時間尚未填完整，暫不計價。</li>';
      calcTotal.textContent = '—'; return;
    }
    const dates = [];
    for (let date = start; date < checkout; date = dateOffset(date, 1)) dates.push(date);
    if (dates.length > 170) { calcNotice.textContent = '所選住宿區間超出目前試算範圍。'; calcTotal.textContent = '—'; return; }
    const hasSpecial = dates.some(date => category(date) !== '一般日');
    showStayDateStatus(dates, checkout);
    const nights = dates.length;
    steps.push(`步驟 2｜服務方式：住宿（過夜）。`);
    steps.push(`步驟 3｜入住 ${dateLabel(start)}，退房 ${dateLabel(checkout)}；入住日計入、退房日不計，共 ${nights} 晚。系統已逐晚判別一般日／連假／春節。`);
    const priceRows = dates.map(date => { const rate = perNight(room, cats, date); baseFee += rate.total; return { date, rate }; });
    total = baseFee;
    priceRows.forEach(({date, rate}) => {
      steps.push(`${dateLabel(date)}｜${categoryName(category(date))}：${currency(rate.roomPrice)} 房費 + ${rate.extraCatCount} 隻 × ${currency(rate.catRate)} 加貓費 = ${currency(rate.total)}／晚。`);
    });
    steps.push(`住宿小計＝各晚房費與加貓費相加 = ${currency(baseFee)}。`);
    let timeAdjust = 0;
    const startRate = perNight(room, cats, start);
    const endRate = perNight(room, cats, dateOffset(checkout, -1));
    const extraNightRate = perNight(room, cats, checkout);
    const holidayCheckin = isHoliday(start);
    const springCheckin = isSpring(start);
    steps.push(`步驟 4｜時段：入住 ${checkinTime}；退房 ${checkoutTime}。正常時段入住 15:00–19:00、退房 12:00–14:00。`);
    if (checkinTime > '19:00') notes.push('入住晚於 19:00，超出一般入住時段；請先問夥伴，不以本工具自動報價。');
    if (checkinTime < '12:00') notes.push('入住早於 12:00，屬營業時間外安排；請先問夥伴，本工具未估營業外費用。');
    if (checkoutTime < '12:00') notes.push('退房早於 12:00，屬營業時間外安排；請先問夥伴，本工具未估營業外費用。');
    if (checkinTime < '15:00') {
      if (springCheckin) {
        if (start === springStart && checkinTime >= '10:00') {
          const hours = (15 * 60 - (Number(checkinTime.slice(0,2))*60 + Number(checkinTime.slice(3)))) / 60;
          timeAdjust += startRate.total * .10 * hours;
          steps.push(`春節 2/3 提前入住 ${hours} 小時：${currency(startRate.total)} × 10% × ${hours} = ${currency(startRate.total * .10 * hours)}。`);
        } else notes.push('春節非 2/3 提前入住，或早於 10:00：不符合公告可試算條件，請問夥伴。');
      } else if (holidayCheckin) {
        timeAdjust += startRate.total;
        steps.push(`連假時段提前入住（須夥伴核准）：加 1 晚 ${currency(startRate.total)}。`);
      } else {
        const halfHours = Math.floor((15*60 - (Number(checkinTime.slice(0,2))*60 + Number(checkinTime.slice(3)))) / 30);
        const fee = startRate.total * .05 * halfHours;
        timeAdjust += fee;
        steps.push(`一般日提早 ${halfHours/2} 小時：${currency(startRate.total)} × 5% × ${halfHours} 個半小時 = ${currency(fee)}。`);
      }
    }
    if (checkoutTime > '14:00') {
      if (isSpring(checkout)) notes.push('春節延後退房不在公告可試算安排內，請問夥伴。');
      else if (isHoliday(checkout)) {
        timeAdjust += extraNightRate.total;
        steps.push(`連假時段延後退房（須夥伴核准）：以退房日期 ${dateLabel(checkout)} 的房價加 1 晚 ${currency(extraNightRate.total)}。`);
      } else {
        const lateMinutes = Number(checkoutTime.slice(0,2))*60 + Number(checkoutTime.slice(3)) - 14*60;
        if (checkoutTime > '19:00') {
          timeAdjust += perNight(room, cats, checkout).total;
          steps.push(`超過 19:00 退房：以多住 1 晚計 ${currency(perNight(room,cats,checkout).total)}。`);
        } else {
          const halfHours = Math.floor(lateMinutes / 30);
          const fee = endRate.total * .05 * halfHours;
          timeAdjust += fee;
          steps.push(`一般日延後 ${halfHours/2} 小時：${currency(endRate.total)} × 5% × ${halfHours} 個半小時 = ${currency(fee)}。`);
        }
      }
    }
    timeFee = timeAdjust;
    total += timeFee;
    if (timeAdjust > 0) steps.push(`時間安排加費小計：${currency(timeAdjust)}。`);
    else steps.push('時段費：入住與退房都在正常時段，本次為 0 元。');
    const discountRate = calcOldRoommate.checked ? .20 : nights >= 30 ? .30 : nights >= 20 ? .25 : nights >= 10 ? .20 : 0;
    const discountLabel = calcOldRoommate.checked ? '老室友 8 折' : nights >= 30 ? '長住 7 折' : nights >= 20 ? '長住 75 折' : nights >= 10 ? '長住 8 折' : '';
    if (!hasSpecial && discountRate) {
      discountFee = priceRows.reduce((sum,row) => sum + row.rate.total, 0) * discountRate;
      total -= discountFee;
      steps.push(`步驟 5｜優惠：符合${discountLabel}；住宿小計 ${currency(baseFee)} × ${discountRate*100}% = 折 ${currency(discountFee)}。時間費與其他加價不折。`);
    } else if (hasSpecial) {
      steps.push('步驟 5｜優惠：住宿含連假／春節夜；依保守規則不自動套用折扣。連假老室友折扣的官網說法互有衝突，請問夥伴。');
    } else if (nights >= 10) {
      steps.push('步驟 5｜優惠：已勾選老室友資格；長住折扣不合併，請確認本次老室友折扣是否核准。');
    } else {
      steps.push(`步驟 5｜優惠：${nights} 晚未達長住 10 晚門檻，且未勾選老室友資格，折扣 0 元。`);
    }
    if (nights >= 10) notes.push('長住優惠：10 晚 8 折、20 晚 75 折、30 晚 7 折；不能與老室友優惠合併。連假／春節折扣規則依官網公告，請夥伴覆核。');
    if (dates.some(isSpring) && nights < 5) notes.push('春節公告最低入住 5 晚；目前未達門檻，請先問夥伴。');
    calcNotice.textContent = notes.length ? notes.join(' ') : '日期已逐晚分類；本結果為單房估算，特殊時段仍須先經夥伴確認。';
  }
  const addOns = [];
  if (document.querySelector('#calcAddPurchase')?.checked) addOns.push(['代購服務費', 100]);
  if (document.querySelector('#calcAddVetTrip')?.checked) addOns.push(['就醫車馬費', 200]);
  const approvedOutOfHours = Math.min(24, Math.max(0, Number(document.querySelector('#calcOutOfHours')?.value) || 0));
  if (approvedOutOfHours > 0) addOns.push([`已核准營業外安排 ${approvedOutOfHours} 小時`, 300 * approvedOutOfHours]);
  if (stayMode && document.querySelector('#calcAddCleaning')?.checked) addOns.push(['特殊清潔（每間）', 2000]);
  const addOnTotal = addOns.reduce((sum, [, amount]) => sum + amount, 0);
  total += addOnTotal;
  if (addOns.length) steps.push(`步驟 6｜已確認加價：${addOns.map(([label, amount]) => `${label} + ${currency(amount)}`).join('；')}；合計 + ${currency(addOnTotal)}。商品、診療與實際交通費另計。`);
  else steps.push('步驟 6｜其他加價：未勾選已確認項目，本次 0 元。');
  if (stayMode) steps.push(`步驟 7｜應收總額＝住宿小計 ${currency(baseFee)} + 時段費 ${currency(timeFee)} − 折扣 ${currency(discountFee)} + 已確認加價 ${currency(addOnTotal)} = ${currency(total)}。`);
  else steps.push(`步驟 7｜安親應收＝安親費 ${currency(baseFee)} + 已確認加價 ${currency(addOnTotal)} = ${currency(total)}。`);
  calcBreakdown.innerHTML = steps.map(step => `<li>${step}</li>`).join('');
  calcTotal.textContent = currency(Math.max(0, total));
}

document.querySelectorAll('#prices input, #prices select').forEach(input => input.addEventListener('input', updatePriceEstimate));
document.querySelectorAll('#prices input, #prices select').forEach(input => input.addEventListener('change', updatePriceEstimate));
calcRoom.addEventListener('change', () => { fillCatOptions(); updatePriceEstimate(); });
fillCatOptions();
updatePriceEstimate();

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
document.querySelector('#faqList').innerHTML = data.faqGroups.map((group) => `
  <section class="faq-group">
    <header><h3>${group.title}</h3><p>${group.note}</p></header>
    <div class="faq-group-list">${group.items.map((item) => `
      <details class="faq-item">
        <summary>${item.situation}</summary>
        <div class="faq-answer"><p><strong>可以這樣說</strong>${item.say}</p><p><strong>同時確認</strong>${item.check}</p></div>
      </details>`).join('')}</div>
  </section>`).join('');

const faqList = document.querySelector('#faqList');
const collapseFaqButton = document.querySelector('#collapseFaq');
function collapseFaqItems() {
  faqList.querySelectorAll('.faq-item[open]').forEach(item => { item.open = false; });
}
faqList.querySelectorAll('.faq-group-list').forEach(groupList => {
  groupList.addEventListener('toggle', event => {
    const opened = event.target;
    if (!opened.matches('.faq-item') || !opened.open) return;
    groupList.querySelectorAll('.faq-item[open]').forEach(item => {
      if (item !== opened) item.open = false;
    });
  }, true);
});
collapseFaqButton.addEventListener('click', collapseFaqItems);
window.addEventListener('pageshow', collapseFaqItems);

const icon = (name) => `<svg class="ui-icon" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
document.querySelector('#sopTimeline').innerHTML = data.sopTimeline.map((item, index) => `
  <li class="timeline-item">
    <div class="timeline-mark">${icon(item.icon)}<span>${String(index + 1).padStart(2, '0')}</span></div>
    <div class="timeline-copy"><time>${item.time}</time><span class="timeline-label">這段要做</span><h3>${item.title}</h3><ul>${item.points.map(point => `<li>${point}</li>`).join('')}</ul></div>
  </li>`).join('');
document.querySelector('#sopModuleGrid').innerHTML = data.sopModules.map(module => `
  <details class="sop-module ${module.tone || ''}">
    <summary><span class="sop-module-icon">${icon(module.icon)}</span><span><small>${module.code}｜${module.title}</small><strong><i>口訣</i>${module.cue}</strong><em>展開看動作與例外</em></span></summary>
    <ul>${module.items.map(item => `<li>${item}</li>`).join('')}</ul>
  </details>`).join('');
function coreFlowGuides(flow) {
  if (flow.title.includes('入住')) return '<a href="#rules" data-guide-target="guide-door-marking">房門標名</a><a href="#rules" data-guide-target="video-guides">物品收納</a>';
  if (flow.title.includes('退房')) return '<a href="#rules" data-guide-target="guide-checkout-litter">退房清砂</a><a href="#rules" data-guide-target="guide-dish-dryer">洗碗烘乾</a>';
  return '<a href="#rules" data-guide-target="guide-room-cleaning">清房現場</a><a href="#rules" data-guide-target="guide-litter-cleaning">清砂方式</a><a href="#rules" data-guide-target="guide-dish-dryer">洗碗烘乾</a>';
}
function renderCoreFlows(flows, { daily = false } = {}) {
  return flows.map((flow, flowIndex) => `
  <details class="core-flow" ${flowIndex === 0 ? 'open' : ''}>
    <summary><span>${icon(flow.icon)}</span><span><small>${daily ? '每日清房' : `流程 ${flowIndex + 1}`}</small><strong>${flow.title}</strong><em>${flow.cue}</em></span></summary>
    <div class="core-flow-body">
      <div class="flow-reading-order" aria-label="流程卡閱讀順序"><span>先做</span><span>實際步驟</span><span>完成確認</span><span>禁止</span></div>
      ${flow.alert ? `<p class="core-flow-alert"><strong>禁止／特別注意</strong>${flow.alert}</p>` : ''}
      <ol>${flow.phases.map((phase, phaseIndex) => `<li><b>${phaseIndex + 1}</b><div><strong>${phase.title}</strong><ul>${phase.steps.map(step => `<li>${step}</li>`).join('')}</ul></div></li>`).join('')}</ol>
      ${flow.closing ? `<p class="core-flow-closing"><strong>完成確認</strong>${flow.closing}</p>` : ''}
      <p class="core-flow-guides"><strong>看現場示範</strong>${coreFlowGuides(flow)}</p>
    </div>
  </details>`).join('');
}
document.querySelector('#coreFlowList').innerHTML = renderCoreFlows(data.coreFlows);
document.querySelector('#dailyCleaningFlowList').innerHTML = renderCoreFlows(data.dailyCleaningFlows, { daily: true });
document.querySelector('#serviceFlowList').innerHTML = data.serviceFlows.map(flow => `
  <details class="service-flow">
    <summary><span>${icon(flow.icon)}</span><span><strong>${flow.title}</strong><small>${flow.note}。點開後照 1、2、3 往下做。</small></span></summary>
    <ol>${flow.steps.map((step, index) => `<li><i>${index + 1}</i><span>${step}</span></li>`).join('')}</ol>
  </details>`).join('');

function bindExclusiveDetails(containerSelector, itemSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.addEventListener('toggle', event => {
    const opened = event.target;
    if (!opened.matches(itemSelector) || !opened.open) return;
    container.querySelectorAll(`${itemSelector}[open]`).forEach(item => {
      if (item !== opened) item.open = false;
    });
  }, true);
}
bindExclusiveDetails('#sopModuleGrid', '.sop-module');
bindExclusiveDetails('#coreFlowList', '.core-flow');
bindExclusiveDetails('#dailyCleaningFlowList', '.core-flow');
bindExclusiveDetails('#serviceFlowList', '.service-flow');
document.querySelectorAll('.core-flow-guides a').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  const library = document.querySelector('.guide-library');
  if (library) library.open = true;
  const target = document.querySelector(`#${link.dataset.guideTarget}`);
  if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}));

const rulesPanel = document.querySelector('#rules');
const sopModeButtons = [...document.querySelectorAll('[data-sop-mode]')];
const dutyQuickPanel = document.querySelector('#dutyQuickPanel');
const dutyStepTabs = document.querySelector('#dutyStepTabs');
const dutyStepCard = document.querySelector('#dutyStepCard');
const dutyQuickStatus = document.querySelector('#dutyQuickStatus');
let activeDutyStep = 0;

function dutyStartMinutes(item) {
  const match = item.time.match(/(\d{1,2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}
function currentDutyStep() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const shiftStart = dutyStartMinutes(data.sopTimeline[0]);
  const shiftEnd = 20 * 60 + 30;
  if (minutes < shiftStart || minutes >= shiftEnd) return { index: 0, onShift: false, now };
  let index = 0;
  data.sopTimeline.forEach((item, itemIndex) => {
    if (dutyStartMinutes(item) <= minutes) index = itemIndex;
  });
  return { index, onShift: true, now };
}
function renderDutyStep(index, status) {
  activeDutyStep = index;
  const item = data.sopTimeline[index];
  dutyStepTabs.querySelectorAll('button').forEach((button, buttonIndex) => {
    const active = buttonIndex === index;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  dutyStepCard.innerHTML = `<div class="duty-step-heading"><span>第 ${index + 1} 步</span><time>${item.time}</time></div><h3>${item.title}</h3><p class="duty-step-cue">先做：${item.points[0]}</p><ul>${item.points.map(point => `<li>${point}</li>`).join('')}</ul>`;
  if (status) dutyQuickStatus.textContent = status;
}
function refreshDutyStep() {
  const current = currentDutyStep();
  const clock = current.now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
  renderDutyStep(current.index, current.onShift ? `${clock}・目前建議看第 ${current.index + 1} 步` : `${clock}・非值班時間，先顯示開班步驟`);
}
dutyStepTabs.innerHTML = data.sopTimeline.map((item, index) => `<button type="button" role="tab" aria-selected="false" data-duty-step="${index}"><span>${index + 1}</span><time>${item.time.split('–')[0].split('／')[0]}</time><b>${item.title}</b></button>`).join('');
dutyStepTabs.addEventListener('click', event => {
  const button = event.target.closest('[data-duty-step]');
  if (!button) return;
  renderDutyStep(Number(button.dataset.dutyStep), `手動查看第 ${Number(button.dataset.dutyStep) + 1} 步`);
});
document.querySelector('#dutyRefresh').addEventListener('click', refreshDutyStep);

function setSopMode(mode) {
  const quick = mode === 'quick';
  rulesPanel.classList.toggle('quick-mode', quick);
  dutyQuickPanel.hidden = !quick;
  sopModeButtons.forEach(button => {
    const active = button.dataset.sopMode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  if (quick) refreshDutyStep();
}
sopModeButtons.forEach(button => button.addEventListener('click', () => setSopMode(button.dataset.sopMode)));
dutyQuickPanel.querySelectorAll('[data-service-jump]').forEach(button => button.addEventListener('click', () => {
  setSopMode('learn');
  const flow = [...document.querySelectorAll('.core-flow, .service-flow')].find(item => item.textContent.includes(button.dataset.serviceJump));
  document.querySelectorAll('.core-flow[open], .service-flow[open]').forEach(item => { item.open = false; });
  if (flow) {
    flow.open = true;
    requestAnimationFrame(() => flow.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
}));
refreshDutyStep();

const roomQuestions = data.rooms.map(room => ({
  category: '房型', question: '看照片回答：這是哪一種房型？', image: room.image,
  answer: `${room.name}｜${formatPrice(room.price)} 元／晚｜最多 ${room.capacity} 隻｜${room.extra}｜${room.size}`
}));
const quizQuestions = [...roomQuestions, ...data.quizQuestions];
const quizCategoryNames = ['全部', '住客提醒', '房型', '值班SOP', '接待流程', '時間費用', '健康入住', '照顧應變', '取消優惠', '春節'];
const quizCategories = document.querySelector('#quizCategories');
const quizCard = document.querySelector('#quizCard');
const quizImage = document.querySelector('#quizImage');
const quizQuestion = document.querySelector('#quizQuestion');
const quizAnswer = document.querySelector('#quizAnswer');
const quizCategory = document.querySelector('#quizCategory');
const quizProgress = document.querySelector('#quizProgress');
const quizAnsweredCount = document.querySelector('#quizAnsweredCount');
const quizWrongCount = document.querySelector('#quizWrongCount');
const quizWrongOnlyButton = document.querySelector('#quizWrongOnly');
const quizResetProgressButton = document.querySelector('#quizResetProgress');
const quizStorageKey = 'catroommate-quiz-progress-v1';
let quizLearningState = { answered: 0, wrong: {}, streak: {} };
try { quizLearningState = { ...quizLearningState, ...JSON.parse(localStorage.getItem(quizStorageKey) || '{}') }; } catch (error) { /* 無法儲存時仍可正常抽考 */ }
let activeQuizCategory = '全部';
let quizDeck = [];
let quizPosition = 0;
let quizWrongOnly = false;

function saveQuizLearningState() {
  try { localStorage.setItem(quizStorageKey, JSON.stringify(quizLearningState)); } catch (error) { /* 無法儲存時仍可正常抽考 */ }
  quizAnsweredCount.textContent = quizLearningState.answered;
  quizWrongCount.textContent = Object.keys(quizLearningState.wrong).length;
  quizWrongOnlyButton.classList.toggle('active', quizWrongOnly);
  quizWrongOnlyButton.textContent = quizWrongOnly ? '回到全部題目' : '只考不熟題';
}
function markQuizResult(remembered) {
  const item = quizDeck[quizPosition]; if (!item) return;
  const key = item.question;
  quizLearningState.answered += 1;
  if (!remembered) {
    quizLearningState.wrong[key] = true;
    quizLearningState.streak[key] = 0;
  } else if (quizLearningState.wrong[key]) {
    quizLearningState.streak[key] = (quizLearningState.streak[key] || 0) + 1;
    if (quizLearningState.streak[key] >= 3) {
      delete quizLearningState.wrong[key];
      delete quizLearningState.streak[key];
    }
  }
  saveQuizLearningState();
}

function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function resetQuizDeck() {
  let pool = activeQuizCategory === '全部' ? quizQuestions : quizQuestions.filter(item => item.category === activeQuizCategory);
  if (quizWrongOnly) pool = pool.filter(item => quizLearningState.wrong[item.question]);
  if (!pool.length && quizWrongOnly) {
    quizWrongOnly = false;
    pool = activeQuizCategory === '全部' ? quizQuestions : quizQuestions.filter(item => item.category === activeQuizCategory);
  }
  quizDeck = shuffled(pool); quizPosition = 0; renderQuiz();
  saveQuizLearningState();
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
document.querySelector('#nextQuiz').addEventListener('click', () => { markQuizResult(true); advanceQuiz(); });
document.querySelector('#retryQuiz').addEventListener('click', () => {
  markQuizResult(false);
  const insertAt = Math.min(quizPosition + 4, quizDeck.length);
  quizDeck.splice(insertAt, 0, quizDeck[quizPosition]);
  advanceQuiz();
});
quizWrongOnlyButton.addEventListener('click', () => { quizWrongOnly = !quizWrongOnly; resetQuizDeck(); });
quizResetProgressButton.addEventListener('click', () => { quizLearningState = { answered: 0, wrong: {}, streak: {} }; quizWrongOnly = false; resetQuizDeck(); });
resetQuizDeck();

const roomMapDetail = document.querySelector('#roomMapDetail');
const roomMapTiles = [...document.querySelectorAll('.map-room')];
function showRoomMapDetail(tile) {
  roomMapTiles.forEach(item => item.classList.toggle('selected', item === tile));
  const number = tile.querySelector('strong')?.textContent || '';
  const cats = tile.querySelector('small')?.textContent || '目前未標示貓咪';
  roomMapDetail.innerHTML = `<small>房號資料</small><strong>${number} 房</strong><span>${cats}</span>`;
}
roomMapTiles.forEach(tile => {
  tile.setAttribute('role', 'button');
  tile.setAttribute('tabindex', '0');
  tile.setAttribute('aria-label', `${tile.querySelector('strong')?.textContent || ''} 房，${tile.querySelector('small')?.textContent || '目前未標示貓咪'}`);
  tile.addEventListener('click', () => showRoomMapDetail(tile));
  tile.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showRoomMapDetail(tile); } });
});

const mobileQuery=window.matchMedia('(max-width: 699px)');
const viewButtons=[...document.querySelectorAll('.jump-nav [data-view], .mobile-nav [data-view]')];
const viewPanels=[...document.querySelectorAll('[data-view-panel]')];
const availableViews=viewPanels.map(panel=>panel.dataset.viewPanel);
let activeView=availableViews.includes(location.hash.slice(1))?location.hash.slice(1):'numbers';
function applyView(){
  viewPanels.forEach(panel=>panel.classList.toggle('view-hidden',panel.dataset.viewPanel!==activeView));
  viewButtons.forEach(button=>{const active=button.dataset.view===activeView;button.classList.toggle('active',active);button.setAttribute('aria-current',active?'page':'false');});
  document.querySelector('#learningLauncher').classList.toggle('view-hidden',activeView!=='numbers');
}
function switchView(nextView,{updateHistory=true,scroll=true}={}){
  if(!availableViews.includes(nextView))return;
  activeView=nextView;
  if(nextView==='faq')collapseFaqItems();
  applyView();
  if(updateHistory)history.pushState(null,'',`#${activeView}`);
  if(scroll)window.scrollTo({top:document.querySelector('main').offsetTop,behavior:'smooth'});
}
viewButtons.forEach(button=>button.addEventListener('click',event=>{event.preventDefault();switchView(button.dataset.view);}));
document.querySelectorAll('[data-start-view]').forEach(button => button.addEventListener('click', () => {
  const targetId = button.dataset.startTarget;
  switchView(button.dataset.startView, { scroll: !targetId });
  if (targetId) requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  if (button.dataset.startMode) setSopMode(button.dataset.startMode);
}));

window.addEventListener('popstate',()=>switchView(location.hash.slice(1),{updateHistory:false,scroll:false}));
mobileQuery.addEventListener('change',applyView); applyView();
