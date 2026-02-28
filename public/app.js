// --- STATE & UTILS ---
const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';
let chartInstance = null;

// --- NAVIGATION ---
const routes = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { id: 'laporan', label: 'Laporan', icon: 'file-text' }
];

function renderNav() {
  const dNav = document.getElementById('desktop-nav');
  const mNav = document.getElementById('mobile-nav');
  const current = location.hash.replace('#', '') || 'dashboard';
  
  dNav.innerHTML = ''; mNav.innerHTML = '';
  
  routes.forEach(r => {
    const isActive = current === r.id;
    // Desktop Nav
    dNav.innerHTML += `
      <a href="#${r.id}" class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors touch-target ${isActive ? 'bg-sidebar-accent text-sidebar-primary font-semibold' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'}">
        <i data-lucide="${r.icon}" class="h-5 w-5"></i> ${r.label}
      </a>`;
    // Mobile Nav
    mNav.innerHTML += `
      <a href="#${r.id}" class="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors touch-target ${isActive ? 'text-primary' : 'text-muted-foreground'}">
        <i data-lucide="${r.icon}" class="h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}"></i>
        <span class="text-[10px] font-medium">${r.label}</span>
      </a>`;
  });
  lucide.createIcons();
}

window.addEventListener('hashchange', () => {
  const page = location.hash.replace('#', '') || 'dashboard';
  document.querySelectorAll('.page-content').forEach(el => el.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  document.getElementById('page-title').innerText = routes.find(r => r.id === page)?.label || 'Dashboard';
  renderNav();
  if(page === 'dashboard') loadDashboard();
  if(page === 'laporan') loadLaporan();
});

// --- THEME (Dark/Light Mode) ---
function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  lucide.createIcons();
  if(location.hash === '' || location.hash === '#dashboard') loadDashboard(); // refresh chart colors
}

if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
}

// --- DATA FETCHING & RENDERING ---
async function loadDashboard() {
  const res = await fetch(`${baseUrl}/ringkasan`);
  const data = await res.json();
  
  // Update Cards
  document.getElementById('dash-harta').innerText = formatRp(data.totalHarta);
  document.getElementById('dash-utang').innerText = formatRp(data.totalUtang);
  document.getElementById('dash-modal').innerText = formatRp(data.totalModal);
  document.getElementById('dash-count').innerText = data.jumlahTransaksi;
  document.getElementById('dash-kas').innerText = formatRp(data.detail.kas);
  document.getElementById('dash-perlengkapan').innerText = formatRp(data.detail.perlengkapan);
  document.getElementById('dash-peralatan').innerText = formatRp(data.detail.peralatan);
  
  // Persamaan Banner
  const eqEl = document.getElementById('dash-equation');
  eqEl.className = `rounded-xl border-2 p-4 flex items-center gap-3 ${data.seimbang ? 'border-success/50 bg-success/10' : 'border-destructive/50 bg-destructive/10'}`;
  eqEl.innerHTML = `
    <i data-lucide="${data.seimbang ? 'check-circle' : 'x-circle'}" class="h-8 w-8 ${data.seimbang ? 'text-success' : 'text-destructive'} shrink-0"></i>
    <div>
      <p class="font-semibold text-sm">Persamaan Akuntansi</p>
      <p class="text-xs text-muted-foreground">Harta (${formatRp(data.totalHarta)}) = Utang (${formatRp(data.totalUtang)}) + Modal (${formatRp(data.totalModal)})</p>
      <p class="text-xs font-bold mt-1 ${data.seimbang ? 'text-success' : 'text-destructive'}">${data.seimbang ? '✅ Seimbang' : '❌ Tidak Seimbang'}</p>
    </div>
  `;
  lucide.createIcons();

  // Chart Setup
  renderChart(data.detail);
}

function renderChart(detail) {
  const ctx = document.getElementById('hartaChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#f1f5f9' : '#0f172a';

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Kas', 'Perlengkapan', 'Peralatan'],
      datasets: [{
        label: 'Nilai Harta',
        data: [detail.kas, detail.perlengkapan, detail.peralatan],
        backgroundColor: ['hsl(217, 91%, 50%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)'],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { color: textColor, callback: (v) => `${(v/1000000).toFixed(0)}jt` }, grid: { color: isDark ? '#334155' : '#e2e8f0' } },
        x: { ticks: { color: textColor }, grid: { display: false } }
      }
    }
  });
}

async function loadLaporan() {
  const res = await fetch(`${baseUrl}/hitung`);
  const data = await res.json();
  const tbody = document.getElementById('laporan-body');
  const tfoot = document.getElementById('laporan-footer');
  
  tbody.innerHTML = '';
  
  const cellVal = (v) => v === 0 ? '<span class="text-muted-foreground">—</span>' : `<span class="font-medium ${v > 0 ? 'text-success' : 'text-destructive'}">${v > 0 ? '+' : ''}${formatRp(v)}</span>`;
  const cellBal = (v) => `<span class="font-semibold text-xs">${formatRp(v)}</span>`;

  data.forEach((row, idx) => {
    // Transaksi Row
    tbody.innerHTML += `
      <tr>
        <td class="p-3 font-medium">${idx + 1}</td>
        <td class="p-3"><p class="font-medium text-xs">${row.transaksi.keterangan}</p><p class="text-[10px] text-muted-foreground">${row.transaksi.tanggal}</p></td>
        <td class="p-3 text-right">${cellVal(row.transaksi.kas)}</td>
        <td class="p-3 text-right">${cellVal(row.transaksi.perlengkapan)}</td>
        <td class="p-3 text-right">${cellVal(row.transaksi.peralatan)}</td>
        <td class="p-3 text-right">${cellVal(row.transaksi.utangUsaha)}</td>
        <td class="p-3 text-right">${cellVal(row.transaksi.modal)}</td>
      </tr>
      <tr class="bg-muted/30">
        <td></td><td class="p-3 text-[10px] text-muted-foreground italic">Saldo</td>
        <td class="p-3 text-right">${cellBal(row.spiegel.kas)}</td><td class="p-3 text-right">${cellBal(row.spiegel.perlengkapan)}</td>
        <td class="p-3 text-right">${cellBal(row.spiegel.peralatan)}</td><td class="p-3 text-right">${cellBal(row.spiegel.utangUsaha)}</td>
        <td class="p-3 text-right">${cellBal(row.spiegel.modal)}</td>
      </tr>`;
  });

  if (data.length > 0) {
    const last = data[data.length - 1].spiegel;
    const tHarta = last.kas + last.perlengkapan + last.peralatan;
    tfoot.innerHTML = `
      <tr>
        <td colspan="2" class="p-3 font-bold">TOTAL</td>
        <td class="p-3 text-right font-bold">${formatRp(last.kas)}</td>
        <td class="p-3 text-right font-bold">${formatRp(last.perlengkapan)}</td>
        <td class="p-3 text-right font-bold">${formatRp(last.peralatan)}</td>
        <td class="p-3 text-right font-bold">${formatRp(last.utangUsaha)}</td>
        <td class="p-3 text-right font-bold">${formatRp(last.modal)}</td>
      </tr>
      <tr>
        <td colspan="2" class="p-3 font-bold text-primary">HARTA = UTANG + MODAL</td>
        <td colspan="3" class="p-3 text-right font-bold text-primary">${formatRp(tHarta)}</td>
        <td colspan="2" class="p-3 text-right font-bold text-primary">${formatRp(last.utangUsaha + last.modal)}</td>
      </tr>`;
  }
}

async function exportJSON() {
  const t = await (await fetch(`${baseUrl}/transaksi`)).json();
  const r = await (await fetch(`${baseUrl}/ringkasan`)).json();
  const blob = new Blob([JSON.stringify({ transaksi: t, ringkasan: r }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `akuntansi-lks-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
}

async function resetData() {
  if(confirm("Yakin ingin mereset semua data transaksi?")) {
    await fetch(`${baseUrl}/transaksi/reset`, { method: 'DELETE' });
    loadLaporan();
  }
}

// PWA Setup
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Init
renderNav();
loadDashboard();
