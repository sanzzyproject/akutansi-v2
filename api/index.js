const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// In-memory database (bisa diganti ke MongoDB/MySQL nanti)
let dbTransaksi = [
  { id: 1, tanggal: '2026-01-01', keterangan: 'Investasi awal pemilik', kas: 50000000, perlengkapan: 0, peralatan: 0, utangUsaha: 0, modal: 50000000 },
  { id: 2, tanggal: '2026-01-03', keterangan: 'Pembelian perlengkapan tunai', kas: -2000000, perlengkapan: 2000000, peralatan: 0, utangUsaha: 0, modal: 0 },
  { id: 3, tanggal: '2026-01-05', keterangan: 'Pembelian peralatan kredit', kas: 0, perlengkapan: 0, peralatan: 15000000, utangUsaha: 15000000, modal: 0 },
  { id: 4, tanggal: '2026-01-10', keterangan: 'Pendapatan jasa tunai', kas: 8000000, perlengkapan: 0, peralatan: 0, utangUsaha: 0, modal: 8000000 },
  { id: 5, tanggal: '2026-01-15', keterangan: 'Pembayaran utang usaha', kas: -5000000, perlengkapan: 0, peralatan: 0, utangUsaha: -5000000, modal: 0 },
  { id: 6, tanggal: '2026-01-20', keterangan: 'Beban gaji karyawan', kas: -3000000, perlengkapan: 0, peralatan: 0, utangUsaha: 0, modal: -3000000 },
];

let nextId = 7;

// Hitung Saldo Berjalan
const hitungSaldo = () => {
  let runKas = 0, runPerlengkapan = 0, runPeralatan = 0, runUtang = 0, runModal = 0;
  return dbTransaksi.map(t => {
    runKas += t.kas; runPerlengkapan += t.perlengkapan; runPeralatan += t.peralatan;
    runUtang += t.utangUsaha; runModal += t.modal;
    return {
      transaksi: t,
      spiegel: { kas: runKas, perlengkapan: runPerlengkapan, peralatan: runPeralatan, utangUsaha: runUtang, modal: runModal }
    };
  });
};

// API Routes
app.get('/api/transaksi', (req, res) => res.json(dbTransaksi));

app.post('/api/transaksi', (req, res) => {
  const t = { id: nextId++, ...req.body };
  dbTransaksi.push(t);
  res.json(t);
});

app.delete('/api/transaksi/reset', (req, res) => {
  dbTransaksi = [];
  res.json({ message: 'Reset berhasil' });
});

app.get('/api/hitung', (req, res) => {
  const saldoList = hitungSaldo();
  res.json(saldoList);
});

app.get('/api/ringkasan', (req, res) => {
  const saldoList = hitungSaldo();
  const jumlah = saldoList.length;
  
  if (jumlah === 0) {
    return res.json({ totalHarta: 0, totalUtang: 0, totalModal: 0, seimbang: true, jumlahTransaksi: 0, detail: { kas: 0, perlengkapan: 0, peralatan: 0 } });
  }

  const last = saldoList[jumlah - 1].spiegel;
  const totalHarta = last.kas + last.perlengkapan + last.peralatan;
  const totalUtang = last.utangUsaha;
  const totalModal = last.modal;

  res.json({
    totalHarta, totalUtang, totalModal,
    seimbang: totalHarta === totalUtang + totalModal,
    jumlahTransaksi: jumlah,
    detail: { kas: last.kas, perlengkapan: last.perlengkapan, peralatan: last.peralatan }
  });
});

module.exports = app;
// Jika dijalankan lokal tanpa Vercel
if (require.main === module) {
    app.listen(3000, () => console.log('Server running on port 3000'));
}
