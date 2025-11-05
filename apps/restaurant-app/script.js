// Verzija 1: lokalno, učenici mogu preuzeti JSON
// Dodano: lokalno pamćenje stanja narudžbe (localStorage) kako bi se forma i količine sačuvale između reload-a/ispisa
const menuListEl = document.getElementById('menu-list');
const locationSelect = document.getElementById('location_select');
const tableSelect = document.getElementById('table_select');
const orderItemsEl = document.getElementById('order-items');
const orderForm = document.getElementById('order-form');
const msgEl = document.getElementById('message');
const draftSummaryEl = document.getElementById('draft-summary');

// Ključ za localStorage draft narudžbe
const DRAFT_KEY = 'restoran_v1_order_draft';

const menu = [
  { id:1, name:"Hobotnica na žaru", price:25.00 },
  { id:2, name:"Lignje", price:20.00 },
  { id:3, name:"Losos", price:22.00 },
  { id:4, name:"Pastrmka (riba)", price:17.50 },
  { id:5, name:"Kozice", price:23.00 },
  { id:6, name:"Skuša", price:14.00 },
  { id:7, name:"Škampi", price:28.00 },
  { id:8, name:"Ceviche od kozica i ananasa", price:30.00 },
  { id:9, name:"Rižoto", price:18.00 },
  { id:10, name:"Orada", price:30.00 }
];

function renderMenu() { menuListEl.innerHTML = ''; menu.forEach(d => { const div = document.createElement('div'); div.className = 'dish'; div.innerHTML = `<div><strong>${d.name}</strong></div><div>${d.price.toFixed(2)} KM</div>`; menuListEl.appendChild(div); }); }
function renderOrderItems() { orderItemsEl.innerHTML = ''; menu.forEach(d => { const row = document.createElement('div'); row.className = 'item'; row.innerHTML = `
      <div style="flex:1">${d.name} <small>${d.price.toFixed(2)} KM</small></div>
      <div>
        <input class="qty" type="number" min="0" value="0" data-dish-id="${d.id}" />
      </div>
    `; orderItemsEl.appendChild(row); }); }

const tablesByLocation = { terasa: Array.from({length:10}, (_,i)=>i+1), restoran: Array.from({length:10}, (_,i)=>i+1) };
function populateTables(selectEl, location) { selectEl.innerHTML = '<option value="">Odaberite stol</option>'; if (!location) { selectEl.innerHTML = '<option value="">Prvo odaberite lokaciju</option>'; return; } (tablesByLocation[location] || []).forEach(n => { const opt = document.createElement('option'); opt.value = n; opt.textContent = `Stol ${n}`; selectEl.appendChild(opt); }); }

renderMenu(); renderOrderItems();
// Nakon inicijalnog rendera pokušaj vratiti draft iz localStorage
restoreDraft();
renderDraftSummary();
// Bilježi promjene količina centralno (event delegation)
orderItemsEl.addEventListener('input', (e) => { if (e.target && e.target.classList.contains('qty')) { saveDraft(); renderDraftSummary(); } });
locationSelect.addEventListener('change', (e) => populateTables(tableSelect, e.target.value));

// Card block visibility
const paymentMethodSelect = document.getElementById('payment_method');
const cardBlock = document.getElementById('card-block');
paymentMethodSelect.addEventListener('change', (e) => {
  if (e.target.value === 'kartica') {
    cardBlock.style.display = 'block';
  } else {
    cardBlock.style.display = 'none';
  }
  saveDraft();
  renderDraftSummary();
});

function maskCardNumber(number) {
  const clean = number.replace(/\D/g, '');
  if (clean.length < 4) return 'xxxx';
  return 'xxxx xxxx xxxx ' + clean.slice(-4);
}

const cardNumberRegex = /^\d{13,19}$/;

const nameRegex = /^[A-Za-zČćŽžŠšĐđ\s\-]{2,100}$/; const phoneRegex = /^\+?\d{6,15}$/; const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
function showMessage(el, text, type) { el.innerHTML = ''; const p = document.createElement('p'); p.textContent = text; p.className = type === 'error' ? 'error' : (type === 'success' ? 'success' : ''); el.appendChild(p); }
function downloadJSON(filename, data) { const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

// Sačuvaj trenutno stanje forme i količina u localStorage (bez osjetljivih podataka kartice)
function saveDraft() {
  try {
    const draft = {
      customer_name: (document.getElementById('customer_name')?.value || '').trim(),
      customer_phone: (document.getElementById('customer_phone')?.value || '').trim(),
      customer_email: (document.getElementById('customer_email')?.value || '').trim(),
      location: document.getElementById('location_select')?.value || '',
      table_number: document.getElementById('table_select')?.value || '',
      payment_method: document.getElementById('payment_method')?.value || '',
      // Ne spremamo broj/CSV kartice. Opcionalno: ime vlasnika kartice.
      card_holder: document.getElementById('card_name') ? (document.getElementById('card_name').value || '') : '',
      items: Array.from(orderItemsEl.querySelectorAll('input.qty')).map(inp => ({
        dish_id: Number(inp.getAttribute('data-dish-id')),
        quantity: Number(inp.value || 0)
      }))
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (e) { /* swallow */ }
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    if (!draft || typeof draft !== 'object') return;

    if (draft.customer_name) document.getElementById('customer_name').value = draft.customer_name;
    if (draft.customer_phone) document.getElementById('customer_phone').value = draft.customer_phone;
    if (draft.customer_email && document.getElementById('customer_email')) document.getElementById('customer_email').value = draft.customer_email;
    if (draft.location) {
      locationSelect.value = draft.location;
      populateTables(tableSelect, draft.location);
    }
    if (draft.table_number) tableSelect.value = String(draft.table_number);
    if (draft.payment_method) {
      paymentMethodSelect.value = draft.payment_method;
      cardBlock.style.display = draft.payment_method === 'kartica' ? 'block' : 'none';
    }
    if (draft.card_holder && document.getElementById('card_name')) document.getElementById('card_name').value = draft.card_holder;
    if (Array.isArray(draft.items)) {
      draft.items.forEach(it => {
        const inp = orderItemsEl.querySelector(`input.qty[data-dish-id="${it.dish_id}"]`);
        if (inp) inp.value = Number(it.quantity || 0);
      });
    }
  } catch (e) { /* swallow */ }
}

// Slušaj inpute forme da bi se draft automatski čuvao
['customer_name','customer_phone','customer_email','location_select','table_select','payment_method','card_name'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', saveDraft);
  el.addEventListener('change', () => { saveDraft(); renderDraftSummary(); });
});

orderForm.addEventListener('submit', (e) => {
  e.preventDefault(); msgEl.innerHTML = '';
  const customer_name = document.getElementById('customer_name').value.trim();
  const customer_phone = document.getElementById('customer_phone').value.trim();
  const customer_email = document.getElementById('customer_email') ? document.getElementById('customer_email').value.trim() : '';
  const location = document.getElementById('location_select').value;
  const table_number = document.getElementById('table_select').value;
  const payment_method = document.getElementById('payment_method').value;

  if (!nameRegex.test(customer_name)) { showMessage(msgEl, 'Neispravno ime.', 'error'); return; }
  if (!phoneRegex.test(customer_phone)) { showMessage(msgEl, 'Neispravan telefon.', 'error'); return; }
  if (customer_email && !emailRegex.test(customer_email)) { showMessage(msgEl, 'Neispravan email.', 'error'); return; }
  if (!location || !table_number) { showMessage(msgEl, 'Odaberite lokaciju i stol.', 'error'); return; }
  if (!payment_method) { showMessage(msgEl, 'Odaberite način plaćanja.', 'error'); return; }

  // Validate card if payment method is kartica
  let cardData = null;
  if (payment_method === 'kartica') {
    const card_name = document.getElementById('card_name').value.trim();
    const card_number = document.getElementById('card_number').value.trim();
    const card_expiry = document.getElementById('card_expiry').value.trim();
    const card_cvc = document.getElementById('card_cvc').value.trim();
    
    if (!card_name || !nameRegex.test(card_name)) { showMessage(msgEl, 'Neispravno ime vlasnika kartice.', 'error'); return; }
    const cardClean = card_number.replace(/\s/g, '');
    if (!cardNumberRegex.test(cardClean)) { showMessage(msgEl, 'Neispravan broj kartice (13-19 cifara).', 'error'); return; }
    if (!/^\d{2}\/\d{2}$/.test(card_expiry)) { showMessage(msgEl, 'Neispravan format datuma isteka (MM/YY).', 'error'); return; }
    if (!/^\d{3,4}$/.test(card_cvc)) { showMessage(msgEl, 'Neispravan CVC (3-4 cifre).', 'error'); return; }
    
    cardData = {
      card_holder: card_name,
      card_number_masked: maskCardNumber(cardClean)
    };
  }

  const items = Array.from(orderItemsEl.querySelectorAll('input[type="number"]')).map(inp => ({ dish_id: Number(inp.getAttribute('data-dish-id')), quantity: Number(inp.value) })).filter(i => i.quantity && i.quantity > 0);
  if (items.length === 0) { showMessage(msgEl, 'Odaberite barem jedno jelo.', 'error'); return; }

  const payload = { customer_name, customer_phone, customer_email, location, table_number: Number(table_number), payment_method, items, created_at: new Date().toISOString() };
  if (cardData) payload.card = cardData;
  
  downloadJSON(`narudzba_${Date.now()}.json`, payload);
  showMessage(msgEl, 'Narudžba spremljena kao JSON (download).', 'success');
  // Nakon preuzimanja JSON-a resetiramo i brišemo draft
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
  orderForm.reset(); renderOrderItems(); cardBlock.style.display = 'none';
  renderDraftSummary();
});

// Render informativni pregled sačuvanog drafta s akcijama
function renderDraftSummary() {
  if (!draftSummaryEl) return;
  let draft = null;
  try { const raw = localStorage.getItem(DRAFT_KEY); if (raw) draft = JSON.parse(raw); } catch (e) { draft = null; }
  if (!draft || typeof draft !== 'object') { draftSummaryEl.style.display = 'none'; draftSummaryEl.innerHTML = ''; return; }

  // Izračunaj kratki sažetak: broj stavki i međuzbroj
  let itemsCount = 0; let subtotal = 0;
  if (Array.isArray(draft.items)) {
    draft.items.forEach(it => {
      if (it.quantity > 0) {
        itemsCount += it.quantity;
        const dish = menu.find(d => d.id === it.dish_id);
        if (dish) subtotal += dish.price * it.quantity;
      }
    });
  }
  const hasItems = itemsCount > 0;
  const name = draft.customer_name || '(bez imena)';
  const loc = draft.location || '-';
  const table = draft.table_number || '-';

  draftSummaryEl.innerHTML = `
    <strong>Sačuvana narudžba (draft)</strong><br/>
    Kupac: ${escapeHtml(name)} · Lokacija/Stol: ${escapeHtml(String(loc))}/${escapeHtml(String(table))}<br/>
    Stavki: ${itemsCount} ${hasItems ? `· Međuzbroj: ${subtotal.toFixed(2)} KM` : ''}
    <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
      <button type="button" id="btn-load-draft">Nastavi uređivanje</button>
      <button type="button" id="btn-clear-draft">Obriši sačuvano</button>
    </div>
  `;
  draftSummaryEl.style.display = 'block';

  const btnLoad = document.getElementById('btn-load-draft');
  const btnClear = document.getElementById('btn-clear-draft');
  if (btnLoad) btnLoad.onclick = () => { restoreDraft(); };
  if (btnClear) btnClear.onclick = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    draftSummaryEl.style.display = 'none';
    draftSummaryEl.innerHTML = '';
  };
}

// Receipt generation button handler
document.getElementById('generate-receipt').addEventListener('click', () => {
  const customer_name = document.getElementById('customer_name').value.trim();
  const customer_phone = document.getElementById('customer_phone').value.trim();
  const location = document.getElementById('location_select').value;
  const table_number = document.getElementById('table_select').value;
  const payment_method = document.getElementById('payment_method').value;
  
  const items = Array.from(orderItemsEl.querySelectorAll('input[type="number"]')).map(inp => ({ 
    dish_id: Number(inp.getAttribute('data-dish-id')), 
    quantity: Number(inp.value) 
  })).filter(i => i.quantity && i.quantity > 0);
  
  if (items.length === 0) {
    alert('Odaberite barem jedno jelo za račun.');
    return;
  }
  
  const companyName = document.getElementById('company_name').value || 'Restoran Sirena';
  const companyAddress = document.getElementById('company_address').value || '';
  const companyJib = document.getElementById('company_jib').value || '';
  const companyPib = document.getElementById('company_pib').value || '';
  const companyIbfm = document.getElementById('company_ibfm').value || '';
  const operator = document.getElementById('operator').value || '';
  
  const now = new Date();
  const dateTimeStr = now.toLocaleString('hr-HR');
  
  let itemsHtml = '';
  let subtotal = 0;
  items.forEach(it => {
    const dish = menu.find(d => d.id === it.dish_id);
    if (dish) {
      const itemTotal = dish.price * it.quantity;
      subtotal += itemTotal;
      itemsHtml += `<tr><td>${escapeHtml(dish.name)}</td><td>${it.quantity}</td><td>${dish.price.toFixed(2)} KM</td><td>${itemTotal.toFixed(2)} KM</td></tr>`;
    }
  });
  
  const pdvRate = 0.17;
  const pdvAmount = subtotal * pdvRate;
  const total = subtotal + pdvAmount;
  
  // QR code data
  const qrData = encodeURIComponent(JSON.stringify({
    company: companyName,
    total: total.toFixed(2),
    date: dateTimeStr
  }));
  const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${qrData}`;
  
  const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Račun - ${escapeHtml(companyName)}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; }
        h1 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f4f4f4; }
        .totals { text-align: right; margin: 20px 0; }
        .totals div { margin: 5px 0; }
        .company-info { margin-bottom: 20px; }
        .qr-code { text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="company-info">
        <h1>${escapeHtml(companyName)}</h1>
        ${companyAddress ? `<p>${escapeHtml(companyAddress)}</p>` : ''}
        ${companyJib ? `<p>JIB: ${escapeHtml(companyJib)}</p>` : ''}
        ${companyPib ? `<p>PIB: ${escapeHtml(companyPib)}</p>` : ''}
        ${companyIbfm ? `<p>IBFM: ${escapeHtml(companyIbfm)}</p>` : ''}
        ${operator ? `<p>Operator: ${escapeHtml(operator)}</p>` : ''}
        <p>Datum i vrijeme: ${dateTimeStr}</p>
        ${customer_name ? `<p>Kupac: ${escapeHtml(customer_name)}</p>` : ''}
        ${location && table_number ? `<p>Stol: ${table_number} (${location})</p>` : ''}
      </div>
      
      <table>
        <thead>
          <tr><th>Artikl</th><th>Kol.</th><th>Cijena</th><th>Ukupno</th></tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div class="totals">
        <div><strong>Međuzbroj:</strong> ${subtotal.toFixed(2)} KM</div>
        <div><strong>PDV (17%):</strong> ${pdvAmount.toFixed(2)} KM</div>
        <div style="font-size:1.2em"><strong>UKUPNO:</strong> ${total.toFixed(2)} KM</div>
      </div>
      
      <div class="qr-code">
        <img src="${qrUrl}" alt="QR Code" />
        <p>Skenirajte QR kod za provjeru</p>
      </div>
      
      <script>window.print();</script>
    </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(receiptHtml);
  printWindow.document.close();
});
