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
const springRoomPrices = { CLS: 1500, SUN: 1800, SPC: 2400, LUX: 4200 };
const springRoomExtras = { CLS: '第 2 隻起每隻 +300 元', SUN: '第 2 隻起每隻 +300 元', SPC: '第 3 隻起每隻 +300 元', LUX: '第 3 隻起每隻 +300 元' };
priceRoomGrid.innerHTML = data.rooms.map((room) => `
  <tr>
    <th scope="row">${room.name}<small>上限 ${room.capacity} 隻</small></th>
    <td><strong>${formatPrice(room.price)} 元／晚</strong><small>加貓：${room.extra}</small></td>
    <td class="spring-rate"><strong>${formatPrice(springRoomPrices[room.id])} 元／晚</strong><small>加貓：${springRoomExtras[room.id]}</small></td>
  </tr>`).join('');

const calcMethod = document.querySelector('#calcMethod');
const calcRoom = document.querySelector('#calcRoom');
const calcRoomCount = document.querySelector('#calcRoomCount');
const calcCats = document.querySelector('#calcCats');
const calcChoiceHint = document.querySelector('#calcChoiceHint');
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
const calcDailySummary = document.querySelector('#calcDailySummary');
const calcTotal = document.querySelector('#calcTotal');
const calcTotalEquation = document.querySelector('#calcTotalEquation');
const calcConfirm = document.querySelector('#calcConfirm');
const calcConfirmHint = document.querySelector('#calcConfirmHint');
const calcResults = document.querySelector('#calcResults');
const calcPendingMessage = document.querySelector('#calcPendingMessage');
const calcStaySummary = document.querySelector('#calcStaySummary');
const currency = value => `${formatPrice(Math.round(value))} 元`;
calcRoom.innerHTML = data.rooms.map(room => `<option value="${room.id}">${room.name}</option>`).join('');
const holidayRanges = [['2026-10-07','2026-10-11'],['2026-10-23','2026-10-26'],['2026-12-24','2026-12-27'],['2026-12-31','2027-01-03'],['2027-02-02','2027-02-10'],['2027-02-26','2027-03-01']];
const springStart = '2027-02-03';
const springPriceStart = '2027-02-02';
const springEnd = '2027-02-10';
const springCheckoutEnd = '2027-02-11';
const dateMs = date => new Date(`${date}T00:00:00Z`).getTime();
const dateOffset = (date, days) => new Date(dateMs(date) + days * 86400000).toISOString().slice(0,10);
const dateLabel = date => date.replaceAll('-', '/');
const isSpring = date => date >= springPriceStart && date <= springEnd;
const isHoliday = date => holidayRanges.some(([start,end]) => date >= start && date <= end);
const isHolidayFirstDay = date => holidayRanges.some(([start]) => date === start);
const isHolidayLastDay = date => holidayRanges.some(([,end]) => date === end);
const category = date => isSpring(date) ? '春節' : isHoliday(date) ? '連假' : '一般日';
const categoryName = type => type === '一般日' ? '非連續假期（一般日）' : type === '連假' ? '連續假期' : '春節特別價';
function setDateStatus(title, badge, rows, tone = 'regular') {
  calcDateStatus.className = `calc-date-status is-${tone}`;
  calcDateStatus.innerHTML = `<div class="calc-date-status-head"><b>系統判定</b><strong>${title}</strong><span>${badge}</span></div><ul>${rows.map(row => `<li>${row}</li>`).join('')}</ul>`;
}
function setLongStayCheck(content) {
  const row = calcDateStatus.querySelector('ul li:nth-child(3)');
  if (row) row.innerHTML = `<b>長住優惠：</b>${content}`;
}
function setDaycareCheck(content) {
  const list = calcDateStatus.querySelector('ul');
  if (!list) return;
  let row = list.querySelector('.calc-daycare-status');
  if (!row) {
    row = document.createElement('li');
    row.className = 'calc-daycare-status';
    list.children[2]?.after(row);
  }
  row.innerHTML = `<b>安親費：</b>${content}`;
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
  const springNights = dates.filter(isSpring).length;
  const rows = groupDateSegments(dates).map(group => {
    const count = dates.filter(date => date >= group.start && date <= group.end).length;
    return `<b>${categoryName(group.type)}</b>：${dateLabel(group.start)}${group.end !== group.start ? `–${dateLabel(group.end)}` : ''}（${count} 個住宿夜）`;
  });
  const holidayNights = dates.filter(date => isHoliday(date) && !isSpring(date)).length;
  rows.unshift(
    `${holidayNights ? '☑ 連假價格：有' : '□ 連假價格：沒有'}${holidayNights ? `（${holidayNights} 晚；春節另列）` : ''}`,
    `${springNights ? '☑ 春節價格：有' : '□ 春節價格：沒有'}${springNights ? `（${springNights} 晚）` : ''}`,
    '<b>長住優惠：</b>計算中'
  );
  rows.push(`<b>退房日</b>：${dateLabel(checkout)}（${categoryName(category(checkout))}；不計住宿晚數）`);
  setDateStatus(title, `${dates.length} 個住宿夜`, rows, tone);
}
const normalNightPrice = room => room.price;
function perNight(room, cats, date, roomCount = 1) {
  const spring = isSpring(date);
  const roomPrice = spring ? springRoomPrices[room.id] : normalNightPrice(room);
  const firstExtraCat = spring && ['CLS','SUN'].includes(room.id) ? 2 : Number(room.extra.match(/第\s*(\d+)/)?.[1] || 2);
  const includedCats = roomCount * (firstExtraCat - 1);
  const extraCatCount = Math.max(0, cats - includedCats);
  const catRate = spring ? 300 : 150;
  return { roomPrice: roomPrice * roomCount, roomCount, extraCatCount, catRate, total: roomPrice * roomCount + extraCatCount * catRate };
}

function fillRoomAndCatOptions() {
  const room = data.rooms.find(item => item.id === calcRoom.value) || data.rooms[0];
  const rows = data.multiRoom[room.name] || [];
  const maxRooms = Math.max(1, rows.length);
  const oldRooms = Number(calcRoomCount.value) || 1;
  const currentCats = Math.min(Math.max(Number(calcCats.value) || 1, 1), 6);
  calcCats.innerHTML = Array.from({ length: 6 }, (_, index) => `<option value="${index + 1}">${index + 1} 隻</option>`).join('');
  calcCats.value = String(currentCats);
  const minRooms = Math.min(maxRooms, Math.max(1, Math.ceil(currentCats / room.capacity)));
  calcRoomCount.innerHTML = Array.from({ length: maxRooms - minRooms + 1 }, (_, index) => `<option value="${minRooms + index}">${minRooms + index} 間</option>`).join('');
  calcRoomCount.value = String(Math.max(minRooms, Math.min(oldRooms, maxRooms)));
  const roomCount = Number(calcRoomCount.value) || 1;
  const cats = Number(calcCats.value) || 1;
  const generalPrice = perNight(room, cats, '2026-10-12', roomCount).total;
  const springPrice = perNight(room, cats, springStart, roomCount).total;
  calcChoiceHint.textContent = `每晚估價：一般日 ${currency(generalPrice)}｜春節 ${currency(springPrice)}；每間最多 ${room.capacity} 隻，目前 ${cats} 隻／${roomCount} 間（可住 ${room.capacity * roomCount} 隻）。`;
}

function updatePriceEstimate() {
  calcDateStatus.innerHTML = '';
  calcNotice.textContent = '';
  calcBreakdown.innerHTML = '';
  calcStaySummary.textContent = '';
  calcTotal.textContent = '—';
  calcDailySummary.innerHTML = '';
  calcTotalEquation.textContent = '';
  const room = data.rooms.find(item => item.id === calcRoom.value) || data.rooms[0];
  const roomCount = Number(calcRoomCount.value) || 1;
  const cats = Number(calcCats.value) || 1;
  const stayMode = calcMethod.value === 'stay';
  document.querySelectorAll('.calc-stay-only').forEach(el => { el.hidden = !stayMode; });
  document.querySelectorAll('.calc-daycare-only').forEach(el => { el.hidden = stayMode; });
  let total = 0;
  let baseFee = 0;
  let timeFee = 0;
  let discountFee = 0;
  let dailyBreakdownMarkup = '';
  let springDepositSummary = '';
  let discountRuleSummary = '';
  let discountFormulaSummary = '';
  const steps = [];
  const notes = [];
  steps.push(`步驟 1｜房型與貓數：${room.name} × ${roomCount} 間，共 ${cats} 隻（本計算表最多列 6 隻）；依房間數與總貓數計算加貓費。`);
  if (!stayMode) {
    const date = calcDaycareDate.value;
    const start = calcDaycareStart.value;
    const end = calcDaycareEnd.value;
    if (!date || !start || !end || date > '2027-03-31' || end <= start) {
      setDateStatus('請確認日期與時段', '尚未完成', ['安親日期不得晚於 2027/3/31，結束時間須晚於開始時間。'], 'invalid');
      calcNotice.textContent = '請確認安親日期不晚於 2027/3/31，並確認結束時間晚於開始時間。';
      calcBreakdown.innerHTML = '<li>資料未完整，暫不計價。</li>';
      calcTotal.textContent = '—'; return;
    }
    const daycareCategory = category(date);
    steps.push(`步驟 2｜服務方式：安親（不過夜）。`);
    steps.push(`步驟 3｜日期：${dateLabel(date)}，${categoryName(daycareCategory)}；安親不計住宿晚數。`);
    setDateStatus(categoryName(daycareCategory), `${dateLabel(date)} 安親`, [
      `${isHoliday(date) && !isSpring(date) ? '☑ 連假價格：有（1 天）' : '□ 連假價格：沒有'}`,
      `${isSpring(date) ? '☑ 春節價格：有（1 天）' : '□ 春節價格：沒有'}`,
      '<b>長住優惠：</b>不適用（安親不過夜）'
    ], daycareCategory === '春節' ? 'spring' : daycareCategory === '連假' ? 'holiday' : 'regular');
    if (isHoliday(date) || isSpring(date)) {
      setDaycareCheck('無法按一般日試算｜連假／春節不提供安親，請先問夥伴。');
      calcStaySummary.textContent = `${dateLabel(date)} 安親｜系統判定：${daycareCategory}`;
      calcNotice.textContent = `${dateLabel(date)} 判定為${category(date)}；官網規定連假／春節不提供安親，不能直接估價，請問夥伴。`;
      calcBreakdown.innerHTML = '<li>日期規則不允許一般安親試算，請先向夥伴確認。</li>';
      calcTotal.textContent = '請確認'; return;
    }
    const duration = (Number(end.slice(0,2)) * 60 + Number(end.slice(3)) - Number(start.slice(0,2)) * 60 - Number(start.slice(3))) / 60;
    calcStaySummary.textContent = `${dateLabel(date)} 安親｜${start}–${end}，共 ${duration} 小時`;
    const billableHours = Math.max(6, duration);
    const rate = perNight(room, cats, date, roomCount);
    const hourRate = rate.total * .10;
    baseFee = hourRate * billableHours;
    total = baseFee;
    setDaycareCheck(`☑ 適用｜${duration < 6 ? `實際 ${duration} 小時，按最低 6 小時計` : `共 ${duration} 小時`}；${currency(hourRate)}／小時 × ${billableHours} 小時 = ${currency(baseFee)}。`);
    dailyBreakdownMarkup = `<li><span>安親基準房價</span><b>${currency(rate.total)}／晚 × 10% = ${currency(hourRate)}／小時</b></li><li><span>計費時數</span><b>${duration} 小時（最低以 6 小時計）→ ${billableHours} 小時</b></li><li class="calc-summary-total"><span>安親費</span><b>${currency(hourRate)} × ${billableHours} 小時 = ${currency(baseFee)}</b></li>`;
    steps.push(`步驟 4｜安親時段：${start}–${end}，實際 ${duration} 小時；計費時數 max(${duration}, 6) = ${billableHours} 小時。`);
    steps.push(`安親基準：${roomCount} 間房合計 ${currency(rate.roomPrice)} + ${rate.extraCatCount} 隻 × ${currency(rate.catRate)} 加貓費 = ${currency(rate.total)}／晚。`);
    steps.push(`安親費＝${currency(rate.total)} × 10% × ${billableHours} 小時 = ${currency(baseFee)}。安親沒有住宿折扣；日期不合規時不估價。`);
    calcNotice.textContent = duration < 6 ? `未滿 6 小時，依最低 6 小時計；依官網規則，安親限一般日營業時段，仍須預約確認。` : '安親以實際時數計，最低 6 小時；須預約確認。';
  } else {
    const start = calcCheckinDate.value;
    const checkout = calcCheckoutDate.value;
    const checkinTime = calcCheckinTime.value;
    const checkoutTime = calcCheckoutTime.value;
    if (!start || !checkout || !checkinTime || !checkoutTime || start > '2027-03-30' || checkout > '2027-03-31' || checkout <= start) {
      setDateStatus('請先選擇有效日期', '尚未判定', ['退房日須晚於入住日；入住日不晚於 2027/3/30，退房日不晚於 2027/3/31。'], 'invalid');
      calcNotice.textContent = '退房日須晚於入住日；入住日不晚於 2027/3/30，退房日不晚於 2027/3/31。';
      calcBreakdown.innerHTML = '<li>日期或時間尚未填完整，暫不計價。</li>';
      calcTotal.textContent = '—'; return;
    }
    const dates = [];
    for (let date = start; date < checkout; date = dateOffset(date, 1)) dates.push(date);
    if (dates.length > 170) { calcNotice.textContent = '所選住宿區間超出目前試算範圍。'; calcTotal.textContent = '—'; return; }
    showStayDateStatus(dates, checkout);
    const nights = dates.length;
    const springNights = dates.filter(isSpring).length;
    calcStaySummary.textContent = `${dateLabel(start)} 入住 → ${dateLabel(checkout)} 退房｜共 ${nights + 1} 天、${nights} 晚`;
    const springHolidayNights = dates.filter(date => date >= springStart && date <= springEnd).length;
    if (springNights > 0 && springHolidayNights < 5) {
      setLongStayCheck('□ 暫不計算｜春節住宿未達至少 5 晚門檻');
      calcNotice.textContent = `春節連續假期只住 ${springHolidayNights} 晚；公告要求至少住滿 5 晚（春節價含前一日），這筆不符合預約門檻。`;
      calcBreakdown.innerHTML = '<li>未達春節最低入住晚數，暫不提供費用報價。</li>';
      calcTotal.textContent = '不符合門檻'; return;
    }
    const springCheckin = isSpring(start);
    const springCheckout = checkout >= springPriceStart && checkout <= springCheckoutEnd;
    const allowedEarlySpringCheckin = start === springStart && checkinTime >= '10:00' && checkinTime < '14:00';
    if (springCheckin && (checkinTime > '18:00' || (checkinTime < '14:00' && !allowedEarlySpringCheckin))) {
      setLongStayCheck('□ 暫不計價｜入住時間不符合春節規定');
      calcNotice.textContent = '春節入住時間為 14:00–18:00；只有 2/3 可預約提早入住，最早 10:00。此時間不符合公告，請先聯絡店家，暫不報價。';
      calcBreakdown.innerHTML = '<li>入住時間超出春節公告範圍，暫不報價。</li>';
      calcTotal.textContent = '請先確認'; return;
    }
    if (springCheckout && (checkoutTime < '10:00' || checkoutTime > '12:00')) {
      setLongStayCheck('□ 暫不計價｜退房時間不符合春節規定');
      calcNotice.textContent = '春節退房時間為 10:00–12:00，春節期間不提供延後安親。此時間請先聯絡店家，暫不報價。';
      calcBreakdown.innerHTML = '<li>退房時間超出春節公告範圍，暫不報價。</li>';
      calcTotal.textContent = '請先確認'; return;
    }
    steps.push(`步驟 2｜服務方式：住宿（過夜）。`);
    steps.push(`步驟 3｜入住 ${dateLabel(start)}，退房 ${dateLabel(checkout)}；入住日計入、退房日不計，共 ${nights} 晚。春節價格${springNights ? `已帶入 ${springNights} 晚` : '未帶入'}。`);
    const priceRows = dates.map(date => { const rate = perNight(room, cats, date, roomCount); baseFee += rate.total; return { date, rate }; });
    total = baseFee;
    const dailyGroups = priceRows.reduce((groups, row) => {
      const label = categoryName(category(row.date));
      const key = `${label}|${row.rate.total}`;
      const current = groups.find(group => group.key === key);
      if (current) current.nights += 1;
      else groups.push({ key, label, price: row.rate.total, nights: 1 });
      return groups;
    }, []);
    dailyBreakdownMarkup = `${dailyGroups.map(group => `<li><span>${group.label}</span><b>${currency(group.price)}／晚 × ${group.nights} 晚 = ${currency(group.price * group.nights)}</b></li>`).join('')}<li class="calc-summary-total"><span>住宿共 ${nights} 晚</span><b>住宿小計 ${currency(baseFee)}</b></li>`;
    dailyGroups.forEach(group => steps.push(`${group.label}：${currency(group.price)}／晚 × ${group.nights} 晚 = ${currency(group.price * group.nights)}。`));
    steps.push(`住宿小計＝各晚房費與加貓費相加 = ${currency(baseFee)}。`);
    let timeAdjust = 0;
    let daycareFee = 0;
    let specialTimeFee = 0;
    const startRate = perNight(room, cats, start, roomCount);
    const endRate = perNight(room, cats, dateOffset(checkout, -1), roomCount);
    const extraNightRate = perNight(room, cats, checkout, roomCount);
    const holidayCheckin = isHolidayFirstDay(start);
    steps.push(`步驟 4｜時段：入住 ${checkinTime}；退房 ${checkoutTime}。正常時段入住 15:00–19:00、退房 12:00–14:00。`);
    if (checkinTime > '19:00') notes.push('入住晚於 19:00，超出一般入住時段；請先問夥伴，不以本工具自動報價。');
    if (checkinTime < '12:00') notes.push('入住早於 12:00，屬營業時間外安排；請先問夥伴，本工具未估營業外費用。');
    if (checkoutTime < '12:00' && !springCheckout) notes.push('退房早於 12:00，屬營業時間外安排；請先問夥伴，本工具未估營業外費用。');
    const normalCheckinTime = springCheckin ? '14:00' : '15:00';
    if (checkinTime < normalCheckinTime) {
      if (springCheckin) {
        if (start === springStart && checkinTime >= '10:00') {
          const hours = (14 * 60 - (Number(checkinTime.slice(0,2))*60 + Number(checkinTime.slice(3)))) / 60;
          const fee = startRate.total * .10 * hours;
          timeAdjust += fee;
          specialTimeFee += fee;
          steps.push(`春節 2/3 提前入住 ${hours} 小時（提前至 14:00 開始入住）：${currency(startRate.total)} × 10% × ${hours} = ${currency(fee)}。`);
        } else notes.push('春節非 2/3 提前入住，或早於 10:00：不符合公告可試算條件，請問夥伴。');
      } else if (holidayCheckin) {
        timeAdjust += startRate.total;
        specialTimeFee += startRate.total;
        steps.push(`連假時段提前入住（須夥伴核准）：加 1 晚 ${currency(startRate.total)}。`);
      } else {
        const halfHours = Math.floor((15*60 - (Number(checkinTime.slice(0,2))*60 + Number(checkinTime.slice(3)))) / 30);
        const fee = startRate.total * .05 * halfHours;
        timeAdjust += fee;
        daycareFee += fee;
        steps.push(`一般日提早 ${halfHours/2} 小時：${currency(startRate.total)} × 5% × ${halfHours} 個半小時 = ${currency(fee)}。`);
      }
    }
    if (checkoutTime > '14:00') {
      if (springCheckout) notes.push('春節公告退房時段為 10:00–12:00，延後不自動計價。');
      else if (isHolidayLastDay(checkout)) {
        timeAdjust += extraNightRate.total;
        specialTimeFee += extraNightRate.total;
        steps.push(`連假時段延後退房（須夥伴核准）：以退房日期 ${dateLabel(checkout)} 的房價加 1 晚 ${currency(extraNightRate.total)}。`);
      } else {
        const lateMinutes = Number(checkoutTime.slice(0,2))*60 + Number(checkoutTime.slice(3)) - 14*60;
        if (checkoutTime > '19:00') {
          timeAdjust += perNight(room, cats, checkout, roomCount).total;
          specialTimeFee += perNight(room, cats, checkout, roomCount).total;
          steps.push(`超過 19:00 退房：以多住 1 晚計 ${currency(perNight(room,cats,checkout,roomCount).total)}。`);
        } else {
          const halfHours = Math.floor(lateMinutes / 30);
          const fee = endRate.total * .05 * halfHours;
          timeAdjust += fee;
          daycareFee += fee;
          steps.push(`一般日延後 ${halfHours/2} 小時：${currency(endRate.total)} × 5% × ${halfHours} 個半小時 = ${currency(fee)}。`);
        }
      }
    }
    timeFee = timeAdjust;
    total += timeFee;
    if (daycareFee > 0) setDaycareCheck(`☑ 有｜${currency(daycareFee)}（提早入住／延後退房按一般日安親費規則計）。`);
    else if (specialTimeFee > 0) setDaycareCheck(`□ 無｜本次 ${currency(specialTimeFee)} 為連假／春節特殊時段加價，不另加一般安親費。`);
    else setDaycareCheck('□ 不用加｜入住與退房都在正常時段。');
    if (timeAdjust > 0) steps.push(`時間安排加費小計：${currency(timeAdjust)}。`);
    else steps.push('時段費：入住與退房都在正常時段，本次為 0 元。');
    const longStayRate = nights >= 30 ? .30 : nights >= 20 ? .25 : nights >= 10 ? .20 : 0;
    const longStayLabel = nights >= 30 ? '長住 7 折' : nights >= 20 ? '長住 75 折' : nights >= 10 ? '長住 8 折' : '';
    const discountByClass = new Map();
    for (const row of priceRows) {
      if (isSpring(row.date)) continue;
      const holidayNight = isHoliday(row.date);
      const rate = calcOldRoommate.checked ? (holidayNight ? .10 : .20) : (holidayNight ? 0 : longStayRate);
      if (!rate) continue;
      const key = `${categoryName(category(row.date))}|${rate}`;
      const group = discountByClass.get(key) || { label: categoryName(category(row.date)), rate, nights: 0, subtotal: 0 };
      group.nights += 1;
      group.subtotal += row.rate.total;
      discountByClass.set(key, group);
    }
    const discountGroups = [...discountByClass.values()];
    discountFee = discountGroups.reduce((sum, group) => sum + group.subtotal * group.rate, 0);
    const longStayEligibleRows = priceRows.filter(row => !isSpring(row.date) && !isHoliday(row.date));
    const longStayEligibleSubtotal = longStayEligibleRows.reduce((sum, row) => sum + row.rate.total, 0);
    const longStayEligibleDiscount = longStayEligibleSubtotal * longStayRate;
    let longStayCheckText = '';
    if (calcOldRoommate.checked) {
      longStayCheckText = `□ 未套用｜${nights >= 10 ? '改用老室友優惠，不能併用' : `共 ${nights} 晚，未達 10 晚`}；老室友實折 ${currency(discountFee)}`;
    } else if (nights >= 10) {
      longStayCheckText = longStayEligibleDiscount > 0
        ? `☑ 已套用｜連住 ${nights} 晚，${longStayLabel}，折抵 ${currency(longStayEligibleDiscount)}`
        : `□ 未折抵｜雖住滿 ${nights} 晚，但沒有可折的一般日住宿晚`;
    } else {
      longStayCheckText = `□ 未符合｜共 ${nights} 晚，至少連住 10 晚`;
    }
    setLongStayCheck(longStayCheckText);
    discountRuleSummary = calcOldRoommate.checked
      ? '老室友：一般日 8 折、連假 9 折；春節不適用，不與長住合併（連假規定仍請夥伴覆核）'
      : `長住：依連續住宿總晚數套級距；一般日可折，連假（含前一日）與春節夜不折。${longStayRate ? `本次 ${longStayLabel}` : `本次 ${nights} 晚未達 10 晚門檻`}`;
    discountFormulaSummary = discountGroups.map(group => `${group.label} ${currency(group.subtotal)}（${group.nights} 晚）× ${group.rate * 100}% = 折 ${currency(group.subtotal * group.rate)}`).join('；');
    if (discountFee > 0) {
      total -= discountFee;
      steps.push(`步驟 5｜優惠：${discountRuleSummary}。${discountFormulaSummary}。折扣合計 ${currency(discountFee)}；時段費與其他加價不折。`);
    } else {
      steps.push(`步驟 5｜優惠：${discountRuleSummary}。本次沒有可折住宿晚，折扣 0 元。`);
    }
    if (springNights > 0) notes.push('春節檔期不適用折扣；春節檔期前後的一般住宿日可依資格計長住／老室友優惠。2/2 是春節連續假日前一日，依春節價計算。');
    if (calcOldRoommate.checked && priceRows.some(row => isHoliday(row.date) && !isSpring(row.date))) notes.push('官網房型價格頁標示連假老室友 9 折，住宿須知則標示連假期間不適用優惠；計算器暫按房價頁試算，正式報價請夥伴覆核。');
    if (springNights > 0) {
      const springLodgingDue = Math.max(0, baseFee - discountFee);
      const deposit = springLodgingDue * .5;
      springDepositSummary = `春節訂金（預付款、不是額外費用）：住宿費 ${currency(springLodgingDue)} × 50% = ${currency(deposit)}`;
      steps.push(`春節訂金：折扣後住宿費 ${currency(springLodgingDue)} × 50% = ${currency(deposit)}（預付訂金，入住當天結清尾款；確認後 3 日內完成付款）。`);
      notes.push('春節住宿需付 50% 訂金；取消方式與日期限制請看春節規則。');
      notes.push('春節仍須店家確認空房與入住安排。');
      if (roomCount > 1) notes.push('春節官網未公布多房合併計價表；目前按單房公告加總推算，正式報價需店家覆核。');
    } else if (stayMode) {
      steps.push(`一般訂金：住宿費 ${currency(baseFee)} × 30% = ${currency(baseFee * .3)}（預收款，非額外費用）。`);
    }
    calcNotice.textContent = notes.length ? notes.join(' ') : roomCount > 1 ? '多房先依價格表加總估算；請核對各房貓咪分配與空房。' : '';
  }
  const addOns = [];
  if (document.querySelector('#calcAddPurchase')?.checked) addOns.push(['代購服務費', 100]);
  if (document.querySelector('#calcAddVetTrip')?.checked) addOns.push(['就醫車馬費', 200]);
  const approvedOutOfHours = Math.min(24, Math.max(0, Number(document.querySelector('#calcOutOfHours')?.value) || 0));
  if (approvedOutOfHours > 0) addOns.push([`已核准營業外安排 ${approvedOutOfHours} 小時`, 300 * approvedOutOfHours]);
  const cleaningInput = document.querySelector('#calcAddCleaning');
  const cleaningRoomsInput = document.querySelector('#calcCleaningRooms');
  if (cleaningRoomsInput) { cleaningRoomsInput.max = String(roomCount); cleaningRoomsInput.hidden = !cleaningInput?.checked; }
  const cleaningRooms = Math.min(roomCount, Math.max(1, Number(cleaningRoomsInput?.value) || 1));
  if (stayMode && cleaningInput?.checked) addOns.push([`特殊清潔（${cleaningRooms} 間）`, 2000 * cleaningRooms]);
  const addOnTotal = addOns.reduce((sum, [, amount]) => sum + amount, 0);
  total += addOnTotal;
  if (addOns.length) steps.push(`步驟 6｜已確認加價：${addOns.map(([label, amount]) => `${label} + ${currency(amount)}`).join('；')}；合計 + ${currency(addOnTotal)}。商品、診療與實際交通費另計。`);
  else steps.push('步驟 6｜其他加價：未勾選已確認項目，本次 0 元。');
  if (stayMode) steps.push(`步驟 7｜應收總額＝住宿小計 ${currency(baseFee)} + 時段費 ${currency(timeFee)} − 折扣 ${currency(discountFee)} + 已確認加價 ${currency(addOnTotal)} = ${currency(total)}。`);
  else steps.push(`步驟 7｜安親應收＝安親費 ${currency(baseFee)} + 已確認加價 ${currency(addOnTotal)} = ${currency(total)}。`);
  const totalFormula = stayMode
    ? `住宿 ${currency(baseFee)} + 時段費 ${currency(timeFee)} − 折扣 ${currency(discountFee)} + 加價 ${currency(addOnTotal)} = ${currency(Math.max(0, total))}`
    : `安親 ${currency(baseFee)} + 加價 ${currency(addOnTotal)} = ${currency(Math.max(0, total))}`;
  calcTotalEquation.textContent = totalFormula;
  calcDailySummary.innerHTML = `<h4>${stayMode ? '房價怎麼加總' : '安親費怎麼算'}</h4><ul>${dailyBreakdownMarkup}${stayMode ? `<li><span>安親／特殊時段費</span><b>${currency(timeFee)}</b></li><li><span>優惠折抵</span><b class="calc-deduction">−${currency(discountFee)}</b></li>` : ''}<li><span>已確認額外費用</span><b>${currency(addOnTotal)}</b></li>${springDepositSummary ? `<li class="calc-info-row"><span>春節訂金（預付，非額外費）</span><b>${currency(Math.max(0, baseFee - discountFee) * .5)}</b></li>` : ''}</ul>`;
  calcBreakdown.innerHTML = steps.map(step => `<li>${step}</li>`).join('');
  calcTotal.textContent = currency(Math.max(0, total));
}

function markPriceEstimatePending() {
  calcResults.hidden = true;
  calcPendingMessage.hidden = false;
  calcPendingMessage.textContent = '條件已變更，按「確定計算」才會以目前日期重新判定假期與優惠。';
  calcConfirm.textContent = '確定計算';
  calcConfirmHint.textContent = '按下後才會開始試算';
  const stayMode = calcMethod.value === 'stay';
  document.querySelectorAll('.calc-stay-only').forEach(el => { el.hidden = !stayMode; });
  document.querySelectorAll('.calc-daycare-only').forEach(el => { el.hidden = stayMode; });
}
document.querySelectorAll('.price-calculator-fields input, .price-calculator-fields select').forEach(input => {
  input.addEventListener('input', markPriceEstimatePending);
  input.addEventListener('change', () => {
    if ([calcRoom, calcRoomCount, calcCats].includes(input)) fillRoomAndCatOptions();
    markPriceEstimatePending();
  });
});
calcConfirm.addEventListener('click', () => {
  calcResults.hidden = false;
  calcPendingMessage.hidden = true;
  calcConfirm.textContent = '重新計算';
  calcConfirmHint.textContent = '已完成；調整條件後再按一次更新';
  updatePriceEstimate();
});
fillRoomAndCatOptions();
calcResults.hidden = true;
calcPendingMessage.hidden = false;
document.querySelectorAll('[data-spring-preset]').forEach(button => button.addEventListener('click', () => {
  calcMethod.value = 'stay';
  calcCheckinDate.value = springStart;
  calcCheckinTime.value = '14:00';
  calcCheckoutTime.value = '12:00';
  calcCheckoutDate.value = button.dataset.springPreset === 'full' ? springCheckoutEnd : '2027-02-08';
  markPriceEstimatePending();
}));

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
    <details class="timeline-copy">
      <summary><time>${item.time}</time><h3>${item.title}</h3><span class="timeline-toggle"><span>看細項</span><span>收起</span></span></summary>
      <ul>${item.points.map(point => `<li>${point}</li>`).join('')}</ul>
      ${item.image ? `<figure class="timeline-photo"><img src="${item.image}" alt="${item.imageAlt || item.title}" loading="lazy"></figure>` : ''}
    </details>
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
function renderCoreFlows(flows, { daily = false, openFirst = true } = {}) {
  return flows.map((flow, flowIndex) => `
  <details class="core-flow" ${openFirst && flowIndex === 0 ? 'open' : ''}>
    <summary><span>${icon(flow.icon)}</span><span><small>${daily ? '住宿中' : flow.title.includes('退房') ? '退房後' : '入住時'}</small><strong>${flow.title}</strong><em>${flow.cue}</em></span></summary>
    <div class="core-flow-body">
      ${flow.when ? `<p class="core-flow-when"><strong>何時做</strong><span>${flow.when}</span></p>` : ''}
      ${flow.alert ? `<p class="core-flow-alert"><strong>特別注意</strong>${flow.alert}</p>` : ''}
      <h4 class="core-flow-steps-label">照順序做</h4>
      <ol>${flow.phases.map((phase, phaseIndex) => `<li><b>${phaseIndex + 1}</b><div><strong>${phase.title}</strong><ul>${phase.steps.map(step => `<li>${step}</li>`).join('')}</ul></div></li>`).join('')}</ol>
      ${flow.closing ? `<p class="core-flow-closing"><strong>完成確認</strong>${flow.closing}</p>` : ''}
      <p class="core-flow-guides"><strong>看現場示範</strong>${coreFlowGuides(flow)}</p>
    </div>
  </details>`).join('');
}
document.querySelector('#coreFlowList').innerHTML = renderCoreFlows(data.coreFlows.slice(0, 1));
document.querySelector('#dailyCleaningFlowList').innerHTML = renderCoreFlows(data.dailyCleaningFlows, { daily: true, openFirst: false });
document.querySelector('#checkoutFlowList').innerHTML = renderCoreFlows(data.coreFlows.slice(1), { openFirst: false });
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
bindExclusiveDetails('#checkoutFlowList', '.core-flow');
bindExclusiveDetails('#serviceFlowList', '.service-flow');
document.querySelectorAll('.core-flow-guides a').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  const library = document.querySelector('.guide-library');
  if (library) library.open = true;
  const target = document.querySelector(`#${link.dataset.guideTarget}`);
  if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}));

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

const catInfoSearch = document.querySelector('#catInfoSearch');
const catInfoCards = [...document.querySelectorAll('[data-cat-card]')];
const catInfoCount = document.querySelector('#catInfoCount');
const catInfoEmpty = document.querySelector('#catInfoEmpty');
const catInfoDirectory = document.querySelector('#catInfoDirectory');
function filterCatInfo() {
  const query = catInfoSearch.value.trim().toLocaleLowerCase().replace(/\s+/g, '');
  if (query) catInfoDirectory.open = true;
  let visibleCount = 0;
  catInfoCards.forEach(card => {
    const searchableText = card.textContent.toLocaleLowerCase().replace(/\s+/g, '');
    const matches = !query || searchableText.includes(query);
    card.hidden = !matches;
    if (matches) visibleCount += 1;
  });
  catInfoCount.textContent = query ? `找到 ${visibleCount} 隻` : `共 ${visibleCount} 隻貓咪`;
  catInfoEmpty.hidden = visibleCount !== 0;
}
catInfoSearch.addEventListener('input', filterCatInfo);
document.querySelectorAll('[data-cat-jump]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  const card = document.querySelector(link.getAttribute('href'));
  if (!card) return;
  catInfoDirectory.open = true;
  catInfoSearch.value = '';
  filterCatInfo();
  requestAnimationFrame(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}));

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
}));

window.addEventListener('popstate',()=>switchView(location.hash.slice(1),{updateHistory:false,scroll:false}));
mobileQuery.addEventListener('change',applyView); applyView();
