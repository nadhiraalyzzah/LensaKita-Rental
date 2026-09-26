const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const supabaseUrl = process.env.SUPABASE_URL || 'https://example-project.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'example-key';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const staticDir = path.join(__dirname, '..', 'front-end');
app.use(express.static(staticDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

const sendResponse = (res, statusCode, payload) => {
  return res.status(statusCode).json(payload);
};

const handleSupabaseResult = (res, result, successStatus = 200) => {
  if (result.error) {
    console.error(result.error);
    return sendResponse(res, 400, {
      message: result.error.message || 'Terjadi kesalahan pada database.',
    });
  }

  return sendResponse(res, successStatus, result.data);
};

const calculateLamaSewa = (tanggalSewa, tanggalKembali) => {
  if (!tanggalSewa || !tanggalKembali) {
    return 1;
  }

  const start = new Date(tanggalSewa);
  const end = new Date(tanggalKembali);
  const diffInMilliseconds = end.getTime() - start.getTime();
  const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);

  return Math.max(1, Math.ceil(diffInDays));
};

const updateCameraStatus = async (idKamera, statusKamera) => {
  const { data, error } = await supabase
    .from('KAMERA')
    .update({ status_kamera: statusKamera })
    .eq('id_kamera', idKamera)
    .select();

  return { data, error };
};

// CRUD KAMERA
app.get('/api/kamera', async (req, res) => {
  const { data, error } = await supabase
    .from('KAMERA')
    .select('*')
    .order('id_kamera', { ascending: true });

  if (error) {
    return sendResponse(res, 400, { message: error.message });
  }

  return sendResponse(res, 200, data);
});

app.post('/api/kamera', async (req, res) => {
  const { nama_kamera, merk, jenis, harga_sewa_per_hari, status_kamera } = req.body;

  if (!nama_kamera || !merk || !jenis || !harga_sewa_per_hari) {
    return sendResponse(res, 400, {
      message: 'Semua field kamera wajib diisi.',
    });
  }

  const payload = {
    nama_kamera,
    merk,
    jenis,
    harga_sewa_per_hari: Number(harga_sewa_per_hari),
    status_kamera: status_kamera || 'Tersedia',
  };

  const { data, error } = await supabase.from('KAMERA').insert([payload]).select();
  return handleSupabaseResult(res, { data, error }, 201);
});

app.put('/api/kamera/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { nama_kamera, merk, jenis, harga_sewa_per_hari, status_kamera } = req.body;

  const payload = {
    ...(nama_kamera && { nama_kamera }),
    ...(merk && { merk }),
    ...(jenis && { jenis }),
    ...(harga_sewa_per_hari !== undefined && { harga_sewa_per_hari: Number(harga_sewa_per_hari) }),
    ...(status_kamera && { status_kamera }),
  };

  const { data, error } = await supabase
    .from('KAMERA')
    .update(payload)
    .eq('id_kamera', id)
    .select();

  return handleSupabaseResult(res, { data, error }, 200);
});

app.delete('/api/kamera/:id', async (req, res) => {
  const id = Number(req.params.id);

  const { data, error } = await supabase
    .from('KAMERA')
    .delete()
    .eq('id_kamera', id)
    .select();

  if (error) {
    return sendResponse(res, 400, {
      message: error.message || 'Gagal menghapus kamera.',
    });
  }

  return sendResponse(res, 200, {
    message: 'Kamera berhasil dihapus.',
    data,
  });
});

// CRUD PELANGGAN
app.get('/api/pelanggan', async (req, res) => {
  const { data, error } = await supabase
    .from('PELANGGAN')
    .select('*')
    .order('id_pelanggan', { ascending: true });

  if (error) {
    return sendResponse(res, 400, { message: error.message });
  }

  return sendResponse(res, 200, data);
});

app.post('/api/pelanggan', async (req, res) => {
  const { nama_pelanggan, no_telepon, alamat } = req.body;

  if (!nama_pelanggan || !no_telepon || !alamat) {
    return sendResponse(res, 400, {
      message: 'Semua field pelanggan wajib diisi.',
    });
  }

  const payload = {
    nama_pelanggan,
    no_telepon,
    alamat,
  };

  const { data, error } = await supabase.from('PELANGGAN').insert([payload]).select();
  return handleSupabaseResult(res, { data, error }, 201);
});

app.put('/api/pelanggan/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { nama_pelanggan, no_telepon, alamat } = req.body;

  const payload = {
    ...(nama_pelanggan && { nama_pelanggan }),
    ...(no_telepon && { no_telepon }),
    ...(alamat && { alamat }),
  };

  const { data, error } = await supabase
    .from('PELANGGAN')
    .update(payload)
    .eq('id_pelanggan', id)
    .select();

  return handleSupabaseResult(res, { data, error }, 200);
});

app.delete('/api/pelanggan/:id', async (req, res) => {
  const id = Number(req.params.id);

  const { data, error } = await supabase
    .from('PELANGGAN')
    .delete()
    .eq('id_pelanggan', id)
    .select();

  if (error) {
    return sendResponse(res, 400, {
      message: error.message || 'Gagal menghapus pelanggan.',
    });
  }

  return sendResponse(res, 200, {
    message: 'Pelanggan berhasil dihapus.',
    data,
  });
});

// CRUD TRANSAKSI_SEWA
app.get('/api/transaksi', async (req, res) => {
  const { data, error } = await supabase
    .from('TRANSAKSI_SEWA')
    .select('*')
    .order('id_transaksi', { ascending: true });

  if (error) {
    return sendResponse(res, 400, { message: error.message });
  }

  return sendResponse(res, 200, data);
});

app.post('/api/transaksi', async (req, res) => {
  const {
    id_kamera,
    id_pelanggan,
    tanggal_sewa,
    tanggal_kembali,
    status_transaksi,
  } = req.body;

  if (!id_kamera || !id_pelanggan || !tanggal_sewa || !tanggal_kembali) {
    return sendResponse(res, 400, {
      message: 'Semua field transaksi wajib diisi.',
    });
  }

  const { data: cameraData, error: cameraError } = await supabase
    .from('KAMERA')
    .select('*')
    .eq('id_kamera', Number(id_kamera))
    .single();

  if (cameraError || !cameraData) {
    return sendResponse(res, 404, {
      message: 'Kamera tidak ditemukan.',
    });
  }

  if (cameraData.status_kamera !== 'Tersedia') {
    return sendResponse(res, 400, {
      message: 'Hanya kamera berstatus Tersedia yang dapat disewa.',
    });
  }

  const lamaSewa = calculateLamaSewa(tanggal_sewa, tanggal_kembali);
  const hargaPerHari = Number(cameraData.harga_sewa_per_hari);
  const totalPendapatan = lamaSewa * hargaPerHari;

  const payload = {
    id_kamera: Number(id_kamera),
    id_pelanggan: Number(id_pelanggan),
    tanggal_sewa,
    tanggal_kembali,
    lama_sewa: lamaSewa,
    harga_per_hari: hargaPerHari,
    total_pendapatan: totalPendapatan,
    status_transaksi: status_transaksi || 'Aktif',
  };

  const transactionResult = await supabase.from('TRANSAKSI_SEWA').insert([payload]).select();

  if (transactionResult.error) {
    return sendResponse(res, 400, {
      message: transactionResult.error.message,
    });
  }

  const cameraStatusUpdate = await updateCameraStatus(Number(id_kamera), 'Disewa');

  if (cameraStatusUpdate.error) {
    return sendResponse(res, 400, {
      message: 'Transaksi dibuat, tetapi gagal mengubah status kamera menjadi Disewa.',
      transaction: transactionResult.data,
    });
  }

  return sendResponse(res, 201, transactionResult.data);
});

app.put('/api/transaksi/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { id_kamera, tanggal_sewa, tanggal_kembali, status_transaksi } = req.body;

  const { data: currentTransaction, error: transactionError } = await supabase
    .from('TRANSAKSI_SEWA')
    .select('*')
    .eq('id_transaksi', id)
    .single();

  if (transactionError || !currentTransaction) {
    return sendResponse(res, 404, { message: 'Transaksi tidak ditemukan.' });
  }

  let payload = { ...req.body };
  const effectiveIdKamera = id_kamera ?? currentTransaction.id_kamera;

  if (tanggal_sewa && tanggal_kembali) {
    const { data: cameraData, error: cameraError } = await supabase
      .from('KAMERA')
      .select('*')
      .eq('id_kamera', Number(effectiveIdKamera))
      .single();

    if (cameraError || !cameraData) {
      return sendResponse(res, 404, { message: 'Kamera terkait transaksi tidak ditemukan.' });
    }

    const lamaSewa = calculateLamaSewa(tanggal_sewa, tanggal_kembali);
    const hargaPerHari = Number(cameraData.harga_sewa_per_hari);
    payload.lama_sewa = lamaSewa;
    payload.harga_per_hari = hargaPerHari;
    payload.total_pendapatan = lamaSewa * hargaPerHari;
  }

  if (status_transaksi === 'Selesai' || status_transaksi === 'Batal') {
    await updateCameraStatus(Number(currentTransaction.id_kamera), 'Tersedia');
  }

  if (status_transaksi === 'Aktif' && effectiveIdKamera) {
    await updateCameraStatus(Number(effectiveIdKamera), 'Disewa');
  }

  const { data, error } = await supabase
    .from('TRANSAKSI_SEWA')
    .update(payload)
    .eq('id_transaksi', id)
    .select();

  return handleSupabaseResult(res, { data, error }, 200);
});

app.delete('/api/transaksi/:id', async (req, res) => {
  const id = Number(req.params.id);

  const { data: currentTransaction, error: transactionError } = await supabase
    .from('TRANSAKSI_SEWA')
    .select('*')
    .eq('id_transaksi', id)
    .single();

  if (transactionError || !currentTransaction) {
    return sendResponse(res, 404, {
      message: 'Transaksi tidak ditemukan.',
    });
  }

  const { data, error } = await supabase
    .from('TRANSAKSI_SEWA')
    .delete()
    .eq('id_transaksi', id)
    .select();

  if (error) {
    return sendResponse(res, 400, {
      message: error.message || 'Gagal menghapus transaksi.',
    });
  }

  if (['Aktif', 'Disewa', 'Batal'].includes(currentTransaction.status_transaksi)) {
    await updateCameraStatus(Number(currentTransaction.id_kamera), 'Tersedia');
  }

  return sendResponse(res, 200, {
    message: 'Transaksi berhasil dihapus.',
    data,
  });
});

app.listen(PORT, () => {
  console.log(`LensaKita server berjalan di http://localhost:${PORT}`);
});
