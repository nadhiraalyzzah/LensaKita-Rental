
const state = {
  kamera: [],
  pelanggan: [],
  transaksi: [],
  pembayaran: []
};

const demoStorageKey = "lensakita-demo-v1";
const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const monthLabels = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

const dialog = document.getElementById("appDialog");
let dialogContext = null;

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function shiftDate(date, days) {
  const result = new Date(`${date}T00:00:00`);
  result.setDate(result.getDate() + days);
  return `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, "0")}-${String(result.getDate()).padStart(2, "0")}`;
}

function dateDiff(start, end) {
  if (!start || !end) return 0;
  return Math.round(
    (Date.parse(`${end}T00:00:00Z`) -
      Date.parse(`${start}T00:00:00Z`)) / 86400000
  );
}

function money(value) {
  return currency.format(Number(value) || 0);
}

function displayDate(value) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function makeDemoData() {
  const now = todayISO();

  return {
    kamera: [
      { id_kamera: 1, nama_kamera: "Canon EOS R6", merk: "Canon", jenis: "Mirrorless", harga_sewa_per_hari: 450000, status: "Tersedia" },
      { id_kamera: 2, nama_kamera: "Sony A7 III", merk: "Sony", jenis: "Mirrorless", harga_sewa_per_hari: 500000, status: "Tersedia" },
      { id_kamera: 3, nama_kamera: "Canon 70D", merk: "Canon", jenis: "DSLR", harga_sewa_per_hari: 300000, status: "Disewa" },
      { id_kamera: 4, nama_kamera: "Fujifilm X-T4", merk: "Fujifilm", jenis: "Mirrorless", harga_sewa_per_hari: 420000, status: "Tersedia" },
      { id_kamera: 5, nama_kamera: "Nikon Z6 II", merk: "Nikon", jenis: "Mirrorless", harga_sewa_per_hari: 475000, status: "Tersedia" }
    ],

    pelanggan: [
      { id_pelanggan: 1, nama_pelanggan: "Ayu Lestari", no_telepon: "081234567890", alamat: "Jl. Merdeka No. 12, Bandung" },
      { id_pelanggan: 2, nama_pelanggan: "Budi Santoso", no_telepon: "082345678901", alamat: "Jl. Cendana No. 45, Jakarta" },
      { id_pelanggan: 3, nama_pelanggan: "Citra Dewi", no_telepon: "083456789012", alamat: "Jl. Melati No. 8, Surabaya" },
      { id_pelanggan: 4, nama_pelanggan: "Dimas Pratama", no_telepon: "081298765432", alamat: "Jl. Pahlawan No. 7, Yogyakarta" }
    ],

    transaksi: [
      { id_transaksi: 1, id_kamera: 1, id_pelanggan: 1, tanggal_sewa: shiftDate(now, -20), tanggal_kembali: shiftDate(now, -18), lama_sewa: 2, harga_per_hari: 450000, total_pendapatan: 900000, status_sewa: "Selesai" },
      { id_transaksi: 2, id_kamera: 2, id_pelanggan: 2, tanggal_sewa: shiftDate(now, -14), tanggal_kembali: shiftDate(now, -11), lama_sewa: 3, harga_per_hari: 500000, total_pendapatan: 1500000, status_sewa: "Selesai" },
      { id_transaksi: 3, id_kamera: 3, id_pelanggan: 3, tanggal_sewa: shiftDate(now, -1), tanggal_kembali: shiftDate(now, 2), lama_sewa: 3, harga_per_hari: 300000, total_pendapatan: 900000, status_sewa: "Aktif" }
    ],

    pembayaran: []
  };
}

function setConnection(mode, message) {
  const pill = document.getElementById("connectionState");
  const text = document.getElementById("connectionText");

  if (pill) pill.className = `connection-pill ${mode}`;
  if (text) text.textContent = message;
}

function loadDemoData() {
  try {
    const saved = localStorage.getItem(demoStorageKey);
    const parsed = saved ? JSON.parse(saved) : null;

    const initial =
      parsed &&
      Array.isArray(parsed.kamera) &&
      Array.isArray(parsed.pelanggan) &&
      Array.isArray(parsed.transaksi)
        ? parsed
        : makeDemoData();

    Object.assign(state, initial);

    if (!Array.isArray(state.pembayaran)) {
      state.pembayaran = [];
    }
  } catch (error) {
    console.warn("Data demo tidak dapat dibaca:", error);
    Object.assign(state, makeDemoData());
  }

  setConnection("demo", "Mode demo lokal");
}

function persistDemoData() {
  if (window.SUPABASE_CONFIGURED) return;
  localStorage.setItem(demoStorageKey, JSON.stringify(state));
}

async function fetchData() {
  if (!window.SUPABASE_CONFIGURED) {
    loadDemoData();
    renderAll();
    return;
  }

  setConnection("", "Menghubungkan ke Supabase");

  try {
    const [cameras, customers, transactions, payments] =
      await Promise.all([
        window.supabaseClient
          .from("KAMERA")
          .select("*")
          .order("id_kamera"),

        window.supabaseClient
          .from("PELANGGAN")
          .select("*")
          .order("id_pelanggan"),

        window.supabaseClient
          .from("TRANSAKSI_SEWA")
          .select("*")
          .order("id_transaksi", { ascending: false }),

        window.supabaseClient
          .from("PEMBAYARAN")
          .select("*")
          .order("id_pembayaran", { ascending: false })
      ]);

    const failed = [
      cameras, customers, transactions, payments
    ].find(result => result.error);

    if (failed) throw failed.error;

    state.kamera = cameras.data || [];
    state.pelanggan = customers.data || [];
    state.transaksi = transactions.data || [];
    state.pembayaran = payments.data || [];

    setConnection("online", "Supabase terhubung");
    renderAll();
  } catch (error) {
    console.error("Gagal memuat data Supabase:", error);
    setConnection("error", "Koneksi bermasalah");
    toast(`Gagal memuat data: ${error.message}`, true);
  }
}

async function saveRecord(table, key, id, values) {
  if (window.SUPABASE_CONFIGURED) {
    const query = window.supabaseClient.from(table);
    const result = id
      ? await query.update(values).eq(key, id)
      : await query.insert(values);

    if (result.error) throw result.error;
  } else {
    const collection = table === "KAMERA"
      ? state.kamera
      : state.pelanggan;

    if (id) {
      const index = collection.findIndex(
        item => Number(item[key]) === Number(id)
      );

      if (index !== -1) {
        collection[index] = { ...collection[index], ...values };
      }
    } else {
      const nextId = Math.max(
        0,
        ...collection.map(item => Number(item[key]) || 0)
      ) + 1;

      collection.push({ [key]: nextId, ...values });
    }

    persistDemoData();
  }

  await fetchData();
}

async function deleteRecord(table, key, id) {
  if (window.SUPABASE_CONFIGURED) {
    const result = await window.supabaseClient
      .from(table)
      .delete()
      .eq(key, id);

    if (result.error) throw result.error;
  } else {
    const isCamera = table === "KAMERA";
    const foreignKey = isCamera ? "id_kamera" : "id_pelanggan";

    const references = state.transaksi.some(
      item => Number(item[foreignKey]) === Number(id)
    );

    if (references) {
      throw new Error(
        "Data sudah digunakan transaksi dan tidak dapat dihapus."
      );
    }

    const collection = isCamera ? state.kamera : state.pelanggan;
    const index = collection.findIndex(
      item => Number(item[key]) === Number(id)
    );

    if (index !== -1) collection.splice(index, 1);

    persistDemoData();
  }

  await fetchData();
}

function getCamera(id) {
  return state.kamera.find(
    item => Number(item.id_kamera) === Number(id)
  );
}

function getCustomer(id) {
  return state.pelanggan.find(
    item => Number(item.id_pelanggan) === Number(id)
  );
}

function badge(status) {
  const className = String(status || "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "-");

  return `<span class="badge badge-${escapeHTML(className)}">${escapeHTML(status)}</span>`;
}

function emptyRow(columns, message) {
  return `<tr><td class="empty-state" colspan="${columns}"><i data-lucide="inbox"></i>${escapeHTML(message)}</td></tr>`;
}

function renderDashboard() {
  const completed = state.transaksi.filter(
    item => item.status_sewa === "Selesai"
  );

  const totalRevenue = completed.reduce(
    (sum, item) => sum + Number(item.total_pendapatan || 0),
    0
  );

  const stats = [
    ["camera", "Total kamera", state.kamera.length],
    ["circle-check", "Kamera tersedia", state.kamera.filter(item => item.status === "Tersedia").length],
    ["camera-off", "Kamera disewa", state.kamera.filter(item => item.status === "Disewa").length],
    ["users-round", "Total pelanggan", state.pelanggan.length],
    ["receipt-text", "Total transaksi", state.transaksi.length],
    ["wallet", "Total pendapatan", money(totalRevenue)]
  ];

  document.getElementById("dashboardStats").innerHTML =
    stats.map(([icon, label, value]) => `
      <article class="stat-card">
        <span class="stat-icon"><i data-lucide="${icon}"></i></span>
        <div class="stat-info">
          <span>${label}</span>
          <strong class="${String(value).length > 10 ? "compact-value" : ""}">${value}</strong>
        </div>
      </article>
    `).join("");

  const year = new Date().getFullYear();
  document.getElementById("chartYear").textContent = String(year);

  const totals = Array(12).fill(0);

  completed.forEach(item => {
    const date = new Date(`${item.tanggal_kembali}T00:00:00`);

    if (date.getFullYear() === year) {
      totals[date.getMonth()] += Number(item.total_pendapatan || 0);
    }
  });

  const max = Math.max(1, ...totals);
  const currentMonth = new Date().getMonth();

  document.getElementById("revenueChart").innerHTML =
    totals.map((amount, index) => {
      const height = amount
        ? Math.max(8, Math.round(amount / max * 100))
        : 4;

      return `
        <div class="chart-column ${index === currentMonth ? "current" : ""}"
             title="${monthLabels[index]}: ${money(amount)}">
          <div class="chart-bar-wrap">
            <div class="chart-bar" style="height:${height}%"></div>
          </div>
          <span class="chart-label">${monthLabels[index]}</span>
        </div>
      `;
    }).join("");

  const rented = state.transaksi
    .filter(item => item.status_sewa === "Aktif")
    .slice(0, 4);

  document.getElementById("rentedCameras").innerHTML =
    rented.length
      ? rented.map(item => {
          const camera = getCamera(item.id_kamera);
          const customer = getCustomer(item.id_pelanggan);

          return `
            <div class="compact-row">
              <span class="camera-thumb"><i data-lucide="camera"></i></span>
              <div class="compact-main">
                <strong>${escapeHTML(camera?.nama_kamera || "Kamera dihapus")}</strong>
                <small>${escapeHTML(customer?.nama_pelanggan || "Pelanggan")}</small>
              </div>
              <span class="compact-date">${displayDate(item.tanggal_kembali)}</span>
            </div>
          `;
        }).join("")
      : `<div class="empty-state">Tidak ada kamera yang sedang disewa.</div>`;

  const recent = [...state.transaksi]
    .sort((a, b) => Number(b.id_transaksi) - Number(a.id_transaksi))
    .slice(0, 5);

  document.getElementById("recentTransactions").innerHTML =
    recent.length
      ? recent.map(item => {
          const camera = getCamera(item.id_kamera);
          const customer = getCustomer(item.id_pelanggan);

          return `
            <tr>
              <td><span class="transaction-id">#TR-${String(item.id_transaksi).padStart(4, "0")}</span></td>
              <td class="cell-primary">${escapeHTML(customer?.nama_pelanggan || "Pelanggan")}</td>
              <td>${escapeHTML(camera?.nama_kamera || "Kamera")}</td>
              <td>${displayDate(item.tanggal_sewa)}</td>
              <td class="cell-primary">${money(item.total_pendapatan)}</td>
              <td>${badge(item.status_sewa)}</td>
            </tr>
          `;
        }).join("")
      : emptyRow(6, "Belum ada transaksi.");
}

function renderCustomers() {
  const query = document.getElementById("customerSearch")
    .value.trim().toLowerCase();

  const customers = state.pelanggan.filter(item =>
    `${item.nama_pelanggan} ${item.no_telepon} ${item.alamat}`
      .toLowerCase().includes(query)
  );

  document.getElementById("customerCount").textContent =
    `${customers.length} pelanggan`;

  document.getElementById("customersTable").innerHTML =
    customers.length
      ? customers.map(item => {
          const transactionCount = state.transaksi.filter(
            transaction =>
              Number(transaction.id_pelanggan) === Number(item.id_pelanggan)
          ).length;

          return `
            <tr>
              <td class="cell-primary">${escapeHTML(item.nama_pelanggan)}</td>
              <td>${escapeHTML(item.no_telepon)}</td>
              <td>${escapeHTML(item.alamat)}</td>
              <td>${transactionCount} transaksi</td>
              <td>
                <div class="action-group">
                  <button class="table-action" data-action="edit-customer" data-id="${item.id_pelanggan}" title="Edit">
                    <i data-lucide="pencil"></i>
                  </button>
                  <button class="table-action danger" data-action="delete-customer" data-id="${item.id_pelanggan}" title="Hapus">
                    <i data-lucide="trash-2"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join("")
      : emptyRow(5, query ? "Pelanggan tidak ditemukan." : "Belum ada data pelanggan.");
}

function renderCameras() {
  const query = document.getElementById("cameraSearch")
    .value.trim().toLowerCase();

  const status = document.getElementById("cameraStatusFilter").value;

  const cameras = state.kamera.filter(item =>
    `${item.nama_kamera} ${item.merk} ${item.jenis}`
      .toLowerCase().includes(query) &&
    (!status || item.status === status)
  );

  document.getElementById("cameraCount").textContent =
    `${cameras.length} kamera`;

  document.getElementById("camerasTable").innerHTML =
    cameras.length
      ? cameras.map(item => `
          <tr>
            <td class="cell-primary">${escapeHTML(item.nama_kamera)}</td>
            <td>${escapeHTML(item.merk)}</td>
            <td>${escapeHTML(item.jenis)}</td>
            <td class="cell-primary">${money(item.harga_sewa_per_hari)}</td>
            <td>${badge(item.status)}</td>
            <td>
              <div class="action-group">
                <button class="table-action" data-action="edit-camera" data-id="${item.id_kamera}" title="Edit">
                  <i data-lucide="pencil"></i>
                </button>
                <button class="table-action danger" data-action="delete-camera" data-id="${item.id_kamera}" title="Hapus">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </td>
          </tr>
        `).join("")
      : emptyRow(6, query || status ? "Kamera tidak ditemukan." : "Belum ada data kamera.");
}

function populateRentalOptions() {
  const customerSelect = document.getElementById("rentalCustomer");
  const cameraSelect = document.getElementById("rentalCamera");

  const previousCustomer = customerSelect.value;
  const previousCamera = cameraSelect.value;

  customerSelect.innerHTML =
    `<option value="">Pilih pelanggan</option>` +
    state.pelanggan.map(item => `
      <option value="${item.id_pelanggan}">
        ${escapeHTML(item.nama_pelanggan)} · ${escapeHTML(item.no_telepon)}
      </option>
    `).join("");

  cameraSelect.innerHTML =
    `<option value="">Pilih kamera tersedia</option>` +
    state.kamera
      .filter(item => item.status === "Tersedia")
      .map(item => `
        <option value="${item.id_kamera}">
          ${escapeHTML(item.nama_kamera)} · ${money(item.harga_sewa_per_hari)}/hari
        </option>
      `).join("");

  if (state.pelanggan.some(
    item => String(item.id_pelanggan) === previousCustomer
  )) {
    customerSelect.value = previousCustomer;
  }

  if (state.kamera.some(
    item => String(item.id_kamera) === previousCamera &&
      item.status === "Tersedia"
  )) {
    cameraSelect.value = previousCamera;
  }

  updateRentalSummary();
}

function renderReturns() {
  const active = state.transaksi
    .filter(item => item.status_sewa === "Aktif")
    .sort((a, b) => a.tanggal_kembali.localeCompare(b.tanggal_kembali));

  document.getElementById("activeRentalCount").textContent =
    `${active.length} aktif`;

  document.getElementById("returnsTable").innerHTML =
    active.length
      ? active.map(item => {
          const camera = getCamera(item.id_kamera);
          const customer = getCustomer(item.id_pelanggan);
          const overdue = item.tanggal_kembali < todayISO();

          return `
            <tr>
              <td class="cell-primary">${escapeHTML(customer?.nama_pelanggan || "Pelanggan")}</td>
              <td>${escapeHTML(camera?.nama_kamera || "Kamera")}</td>
              <td>${displayDate(item.tanggal_sewa)}</td>
              <td>
                ${displayDate(item.tanggal_kembali)}
                ${overdue ? `<span class="cell-subtle" style="color:var(--red)">Terlambat</span>` : ""}
              </td>
              <td>${item.lama_sewa} hari</td>
              <td class="cell-primary">${money(item.total_pendapatan)}</td>
              <td>
                <button class="button button-primary" data-action="return-camera" data-id="${item.id_transaksi}" style="min-height:32px;padding:0 10px;font-size:10px">
                  <i data-lucide="package-check"></i>Kembalikan
                </button>
              </td>
            </tr>
          `;
        }).join("")
      : emptyRow(7, "Tidak ada kamera yang menunggu pengembalian.");
}

function renderIncome() {
  const completed = state.transaksi.filter(
    item => item.status_sewa === "Selesai"
  );

  const total = completed.reduce(
    (sum, item) => sum + Number(item.total_pendapatan || 0),
    0
  );

  document.getElementById("incomeTotal").textContent = money(total);
  document.getElementById("incomeSubtext").textContent =
    `${completed.length} transaksi selesai`;

  const active = state.transaksi.filter(
    item => item.status_sewa === "Aktif"
  );

  document.getElementById("incomeMiniStats").innerHTML = `
    <div class="mini-metric"><span>Transaksi selesai</span><strong>${completed.length}</strong></div>
    <div class="mini-metric"><span>Sedang berjalan</span><strong>${active.length}</strong></div>
  `;

  const filter = document.getElementById("incomeStatusFilter").value;

  const transactions = [...state.transaksi]
    .filter(item => !filter || item.status_sewa === filter)
    .sort((a, b) => Number(b.id_transaksi) - Number(a.id_transaksi));

  document.getElementById("incomeTable").innerHTML =
    transactions.length
      ? transactions.map(item => {
          const camera = getCamera(item.id_kamera);
          const customer = getCustomer(item.id_pelanggan);

          return `
            <tr>
              <td><span class="transaction-id">#TR-${String(item.id_transaksi).padStart(4, "0")}</span></td>
              <td class="cell-primary">${escapeHTML(customer?.nama_pelanggan || "Pelanggan")}</td>
              <td>${escapeHTML(camera?.nama_kamera || "Kamera")}</td>
              <td>
                ${displayDate(item.tanggal_sewa)}
                <span class="cell-subtle">hingga ${displayDate(item.tanggal_kembali)}</span>
              </td>
              <td>${item.lama_sewa} hari</td>
              <td class="cell-primary">${money(item.total_pendapatan)}</td>
              <td>${badge(item.status_sewa)}</td>
            </tr>
          `;
        }).join("")
      : emptyRow(7, "Tidak ada transaksi untuk filter ini.");
}

/* =========================
   FITUR PEMBAYARAN
========================= */

function getPaidAmount(transactionId) {
  return state.pembayaran
    .filter(item =>
      Number(item.id_transaksi) === Number(transactionId)
    )
    .reduce(
      (sum, item) => sum + Number(item.jumlah_pembayaran || 0),
      0
    );
}

function getRemainingAmount(transaction) {
  if (!transaction) return 0;

  return Math.max(
    0,
    Number(transaction.total_pendapatan || 0) -
      getPaidAmount(transaction.id_transaksi)
  );
}

function populatePaymentOptions() {
  const select = document.getElementById("paymentTransaction");
  if (!select) return;

  const previousValue = select.value;

  const transactions = state.transaksi.filter(item =>
    item.status_sewa !== "Batal" &&
    getRemainingAmount(item) > 0
  );

  select.innerHTML =
    `<option value="">Pilih transaksi</option>` +
    transactions.map(item => {
      const customer = getCustomer(item.id_pelanggan);
      const camera = getCamera(item.id_kamera);

      return `
        <option value="${item.id_transaksi}">
          #TR-${String(item.id_transaksi).padStart(4, "0")}
          · ${escapeHTML(customer?.nama_pelanggan || "Pelanggan")}
          · ${escapeHTML(camera?.nama_kamera || "Kamera")}
          · Sisa ${money(getRemainingAmount(item))}
        </option>
      `;
    }).join("");

  if (transactions.some(
    item => String(item.id_transaksi) === previousValue
  )) {
    select.value = previousValue;
  }

  updatePaymentSummary();
}

function updatePaymentSummary() {
  const select = document.getElementById("paymentTransaction");
  const amountInput = document.getElementById("paymentAmount");

  if (!select || !amountInput) return;

  const transactionId = select.value;

  const transaction = state.transaksi.find(
    item => Number(item.id_transaksi) === Number(transactionId)
  );

  const total = Number(transaction?.total_pendapatan || 0);
  const paid = transaction
    ? getPaidAmount(transaction.id_transaksi)
    : 0;
  const remaining = transaction
    ? getRemainingAmount(transaction)
    : 0;

  document.getElementById("paymentRentalTotal").textContent = money(total);
  document.getElementById("paymentAlreadyPaid").textContent = money(paid);
  document.getElementById("paymentRemaining").textContent = money(remaining);

  amountInput.max = String(remaining);

  if (Number(amountInput.value) > remaining) {
    amountInput.value = remaining > 0 ? String(remaining) : "";
  }
}

function renderPayments() {
  const rows = [...state.pembayaran].sort(
    (a, b) => Number(b.id_pembayaran) - Number(a.id_pembayaran)
  );

  document.getElementById("paymentsTable").innerHTML =
    rows.length
      ? rows.map(item => {
          const transaction = state.transaksi.find(
            row => Number(row.id_transaksi) === Number(item.id_transaksi)
          );

          const customer = transaction
            ? getCustomer(transaction.id_pelanggan)
            : null;

          const camera = transaction
            ? getCamera(transaction.id_kamera)
            : null;

          return `
            <tr>
              <td class="cell-primary">#PAY-${String(item.id_pembayaran).padStart(4, "0")}</td>
              <td>#TR-${String(item.id_transaksi).padStart(4, "0")}</td>
              <td>${escapeHTML(customer?.nama_pelanggan || "Pelanggan")}</td>
              <td>${escapeHTML(camera?.nama_kamera || "Kamera")}</td>
              <td>${displayDate(item.tanggal_pembayaran)}</td>
              <td class="cell-primary">${money(item.jumlah_pembayaran)}</td>
              <td>${escapeHTML(item.metode_pembayaran)}</td>
            </tr>
          `;
        }).join("")
      : emptyRow(7, "Belum ada pembayaran yang dicatat.");
}

async function createPayment(event) {
  event.preventDefault();

  const transactionId = Number(
    document.getElementById("paymentTransaction").value
  );

  const amount = Number(
    document.getElementById("paymentAmount").value
  );

  const method = document.getElementById("paymentMethod").value;
  const date = document.getElementById("paymentDate").value;
  const notes = document.getElementById("paymentNotes").value.trim();

  const transaction = state.transaksi.find(
    item => Number(item.id_transaksi) === transactionId
  );

  if (!transaction || transaction.status_sewa === "Batal") {
    toast("Pilih transaksi sewa yang valid.", true);
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    toast("Jumlah pembayaran harus lebih dari nol.", true);
    return;
  }

  if (!date || !method) {
    toast("Lengkapi tanggal dan metode pembayaran.", true);
    return;
  }

  const remaining = getRemainingAmount(transaction);

  if (amount > remaining) {
    toast(`Jumlah melebihi sisa tagihan ${money(remaining)}.`, true);
    return;
  }

  const payment = {
    id_transaksi: transactionId,
    tanggal_pembayaran: date,
    jumlah_pembayaran: amount,
    metode_pembayaran: method,
    keterangan: notes || null
  };

  try {
    if (window.SUPABASE_CONFIGURED) {
      const result = await window.supabaseClient
        .from("PEMBAYARAN")
        .insert(payment);

      if (result.error) throw result.error;
    } else {
      payment.id_pembayaran = Math.max(
        0,
        ...state.pembayaran.map(
          item => Number(item.id_pembayaran) || 0
        )
      ) + 1;

      state.pembayaran.push(payment);
      persistDemoData();
    }

    document.getElementById("paymentForm").reset();
    document.getElementById("paymentDate").value = todayISO();

    await fetchData();

    toast("Pembayaran berhasil dicatat.");
  } catch (error) {
    console.error("Gagal menyimpan pembayaran:", error);
    toast(`Pembayaran gagal disimpan: ${error.message}`, true);
  }
}

/* =========================
   RENDER SELURUH HALAMAN
========================= */

function renderAll() {
  renderDashboard();
  renderCustomers();
  renderCameras();
  populateRentalOptions();
  renderReturns();
  renderIncome();
  populatePaymentOptions();
  renderPayments();

  if (window.lucide) window.lucide.createIcons();
}

function updateRentalSummary() {
  const start = document.getElementById("rentalStart").value;
  const end = document.getElementById("rentalEnd").value;
  const camera = getCamera(
    document.getElementById("rentalCamera").value
  );

  const days = dateDiff(start, end);
  const rate = Number(camera?.harga_sewa_per_hari) || 0;

  document.getElementById("rentalDays").textContent =
    `${Math.max(0, days)} hari`;

  document.getElementById("rentalRate").textContent = money(rate);

  document.getElementById("rentalTotal").textContent =
    money(Math.max(0, days) * rate);
}

function navigate(page) {
  const target = document.getElementById(`page-${page}`);
  if (!target) return;

  document.querySelectorAll(".page-view").forEach(view =>
    view.classList.toggle("active", view === target)
  );

  document.querySelectorAll(".nav-link").forEach(link =>
    link.classList.toggle("active", link.dataset.page === page)
  );

  document.getElementById("pageBreadcrumb").textContent =
    target.dataset.title;

  history.replaceState(null, "", `#${page}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toast(message, isError = false) {
  const node = document.createElement("div");
  node.className = `toast ${isError ? "error" : ""}`;

  node.innerHTML = `
    <i data-lucide="${isError ? "circle-alert" : "circle-check"}"></i>
    <span>${escapeHTML(message)}</span>
  `;

  document.getElementById("toastRegion").append(node);

  if (window.lucide) {
    window.lucide.createIcons({ nodes: [node] });
  }

  window.setTimeout(() => node.remove(), 4200);
}

/* =========================
   FORM KAMERA & PELANGGAN
========================= */

function openRecordDialog(type, record = null) {
  dialogContext = {
    type,
    id: record
      ? record[type === "camera" ? "id_kamera" : "id_pelanggan"]
      : null
  };

  const isCamera = type === "camera";

  document.getElementById("dialogEyebrow").textContent =
    isCamera ? "INVENTARIS" : "DATA PELANGGAN";

  document.getElementById("dialogTitle").textContent =
    `${record ? "Edit" : "Tambah"} ${isCamera ? "kamera" : "pelanggan"}`;

  const fields = isCamera
    ? `
      <label class="dialog-field">Nama kamera
        <input name="nama_kamera" required maxlength="100"
          value="${escapeHTML(record?.nama_kamera || "")}"
          placeholder="Contoh: Sony A7 III">
      </label>
      <label class="dialog-field">Merk
        <input name="merk" required maxlength="100"
          value="${escapeHTML(record?.merk || "")}"
          placeholder="Contoh: Sony">
      </label>
      <label class="dialog-field">Jenis
        <input name="jenis" required maxlength="50"
          value="${escapeHTML(record?.jenis || "")}"
          placeholder="Mirrorless">
      </label>
      <label class="dialog-field">Harga sewa per hari
        <input name="harga_sewa_per_hari" type="number" min="1"
          step="1000" required
          value="${escapeHTML(record?.harga_sewa_per_hari || "")}"
          placeholder="500000">
      </label>
      <label class="dialog-field">Status
        <select name="status">
          <option ${record?.status !== "Disewa" ? "selected" : ""}>Tersedia</option>
          <option ${record?.status === "Disewa" ? "selected" : ""}>Disewa</option>
        </select>
      </label>
    `
    : `
      <label class="dialog-field">Nama pelanggan
        <input name="nama_pelanggan" required maxlength="100"
          value="${escapeHTML(record?.nama_pelanggan || "")}"
          placeholder="Nama lengkap">
      </label>
      <label class="dialog-field">Nomor telepon
        <input name="no_telepon" type="tel" required maxlength="20"
          value="${escapeHTML(record?.no_telepon || "")}"
          placeholder="08xxxxxxxxxx">
      </label>
      <label class="dialog-field">Alamat
        <textarea name="alamat" required rows="3" maxlength="500"
          placeholder="Alamat lengkap">${escapeHTML(record?.alamat || "")}</textarea>
      </label>
    `;

  document.getElementById("dialogForm").innerHTML = `
    <div class="dialog-form">
      ${fields}
      <div class="dialog-actions">
        <button type="button" class="button button-secondary" id="cancelDialog">Batal</button>
        <button type="submit" class="button button-primary">
          <i data-lucide="save"></i>Simpan
        </button>
      </div>
    </div>
  `;

  document.getElementById("cancelDialog")
    .addEventListener("click", () => dialog.close());

  if (window.lucide) window.lucide.createIcons();

  dialog.showModal();
}

async function submitRecord(event) {
  event.preventDefault();
  if (!dialogContext) return;

  const { type, id } = dialogContext;
  const values = Object.fromEntries(
    new FormData(event.currentTarget).entries()
  );

  if (type === "camera") {
    values.harga_sewa_per_hari = Number(
      values.harga_sewa_per_hari
    );

    const hasActiveRental = state.transaksi.some(
      item =>
        Number(item.id_kamera) === Number(id) &&
        item.status_sewa === "Aktif"
    );

    if (id && hasActiveRental && values.status !== "Disewa") {
      toast(
        "Kamera memiliki transaksi aktif, selesaikan pengembalian terlebih dahulu.",
        true
      );
      return;
    }
  }

  try {
    await saveRecord(
      type === "camera" ? "KAMERA" : "PELANGGAN",
      type === "camera" ? "id_kamera" : "id_pelanggan",
      id,
      values
    );

    dialog.close();

    toast(
      `${type === "camera" ? "Kamera" : "Pelanggan"} berhasil ${id ? "diperbarui" : "ditambahkan"}.`
    );
  } catch (error) {
    toast(`Data gagal disimpan: ${error.message}`, true);
  }
}

/* =========================
   TRANSAKSI SEWA
========================= */

async function createRental(event) {
  event.preventDefault();

  const customerId = Number(
    document.getElementById("rentalCustomer").value
  );

  const cameraId = Number(
    document.getElementById("rentalCamera").value
  );

  const start = document.getElementById("rentalStart").value;
  const end = document.getElementById("rentalEnd").value;

  const camera = getCamera(cameraId);
  const days = dateDiff(start, end);

  if (!camera || camera.status !== "Tersedia") {
    return toast("Pilih kamera yang masih tersedia.", true);
  }

  if (!getCustomer(customerId)) {
    return toast("Pilih pelanggan terlebih dahulu.", true);
  }

  if (days < 1) {
    return toast("Tanggal kembali harus setelah tanggal sewa.", true);
  }

  const transaction = {
    id_kamera: cameraId,
    id_pelanggan: customerId,
    tanggal_sewa: start,
    tanggal_kembali: end,
    lama_sewa: days,
    harga_per_hari: Number(camera.harga_sewa_per_hari),
    total_pendapatan: days * Number(camera.harga_sewa_per_hari),
    status_sewa: "Aktif"
  };

  try {
    if (window.SUPABASE_CONFIGURED) {
      const inserted = await window.supabaseClient
        .from("TRANSAKSI_SEWA")
        .insert(transaction);

      if (inserted.error) throw inserted.error;

      const updated = await window.supabaseClient
        .from("KAMERA")
        .update({ status: "Disewa" })
        .eq("id_kamera", cameraId)
        .eq("status", "Tersedia");

      if (updated.error) throw updated.error;
    } else {
      transaction.id_transaksi = Math.max(
        0,
        ...state.transaksi.map(
          item => Number(item.id_transaksi) || 0
        )
      ) + 1;

      state.transaksi.push(transaction);
      camera.status = "Disewa";

      persistDemoData();
    }

    event.currentTarget.reset();

    document.getElementById("rentalStart").value = todayISO();
    document.getElementById("rentalEnd").value =
      shiftDate(todayISO(), 1);

    updateRentalSummary();

    await fetchData();

    toast("Transaksi sewa berhasil dibuat.");
  } catch (error) {
    toast(`Transaksi gagal dibuat: ${error.message}`, true);
  }
}

async function returnCamera(id) {
  const transaction = state.transaksi.find(
    item => Number(item.id_transaksi) === Number(id)
  );

  if (!transaction || transaction.status_sewa !== "Aktif") return;

  if (!window.confirm("Konfirmasi kamera sudah diterima kembali?")) {
    return;
  }

  try {
    if (window.SUPABASE_CONFIGURED) {
      const returned = await window.supabaseClient
        .from("TRANSAKSI_SEWA")
        .update({ status_sewa: "Selesai" })
        .eq("id_transaksi", id)
        .eq("status_sewa", "Aktif");

      if (returned.error) throw returned.error;

      const cameraUpdated = await window.supabaseClient
        .from("KAMERA")
        .update({ status: "Tersedia" })
        .eq("id_kamera", transaction.id_kamera);

      if (cameraUpdated.error) throw cameraUpdated.error;
    } else {
      transaction.status_sewa = "Selesai";

      const camera = getCamera(transaction.id_kamera);
      if (camera) camera.status = "Tersedia";

      persistDemoData();
    }

    await fetchData();

    toast("Kamera berhasil dikembalikan.");
  } catch (error) {
    toast(`Pengembalian gagal diproses: ${error.message}`, true);
  }
}

/* =========================
   AKSI TABEL
========================= */

async function handleTableAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;

  if (action === "edit-camera") {
    return openRecordDialog("camera", getCamera(id));
  }

  if (action === "edit-customer") {
    return openRecordDialog("customer", getCustomer(id));
  }

  if (action === "return-camera") {
    return returnCamera(id);
  }

  if (
    action === "delete-camera" ||
    action === "delete-customer"
  ) {
    const kind = action === "delete-camera"
      ? "kamera"
      : "pelanggan";

    if (!window.confirm(
      `Hapus ${kind} ini? Data yang sudah terkait transaksi tidak dapat dihapus.`
    )) {
      return;
    }

    try {
      await deleteRecord(
        kind === "kamera" ? "KAMERA" : "PELANGGAN",
        kind === "kamera" ? "id_kamera" : "id_pelanggan",
        id
      );

      toast(
        `${kind[0].toUpperCase()}${kind.slice(1)} berhasil dihapus.`
      );
    } catch (error) {
      toast(`Tidak dapat menghapus ${kind}: ${error.message}`, true);
    }
  }
}

/* =========================
   INISIALISASI APLIKASI
========================= */

function initialize() {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => navigate(link.dataset.page));
  });

  document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.go));
  });

  document.getElementById("addCustomer")
    .addEventListener("click", () => openRecordDialog("customer"));

  document.getElementById("addCamera")
    .addEventListener("click", () => openRecordDialog("camera"));

  document.getElementById("customerSearch")
    .addEventListener("input", renderCustomers);

  document.getElementById("cameraSearch")
    .addEventListener("input", renderCameras);

  document.getElementById("cameraStatusFilter")
    .addEventListener("change", renderCameras);

  document.getElementById("incomeStatusFilter")
    .addEventListener("change", renderIncome);

  document.getElementById("rentalCamera")
    .addEventListener("change", updateRentalSummary);

  document.getElementById("rentalStart")
    .addEventListener("change", () => {
      const start = document.getElementById("rentalStart").value;
      const endInput = document.getElementById("rentalEnd");

      endInput.min = start ? shiftDate(start, 1) : "";

      if (start && endInput.value && endInput.value <= start) {
        endInput.value = shiftDate(start, 1);
      }

      updateRentalSummary();
    });

  document.getElementById("rentalEnd")
    .addEventListener("change", updateRentalSummary);

  document.getElementById("rentalForm")
    .addEventListener("submit", createRental);

  document.getElementById("paymentForm")
    .addEventListener("submit", createPayment);

  document.getElementById("paymentTransaction")
    .addEventListener("change", updatePaymentSummary);

  document.getElementById("paymentDate").value = todayISO();

  document.getElementById("dialogForm")
    .addEventListener("submit", submitRecord);

  document.getElementById("closeDialog")
    .addEventListener("click", () => dialog.close());

  document.getElementById("refreshButton")
    .addEventListener("click", fetchData);

  document.getElementById("customersTable")
    .addEventListener("click", handleTableAction);

  document.getElementById("camerasTable")
    .addEventListener("click", handleTableAction);

  document.getElementById("returnsTable")
    .addEventListener("click", handleTableAction);

  document.getElementById("rentalStart").min = todayISO();
  document.getElementById("rentalStart").value = todayISO();

  document.getElementById("rentalEnd").min =
    shiftDate(todayISO(), 1);

  document.getElementById("rentalEnd").value =
    shiftDate(todayISO(), 1);

  const initialPage = location.hash.slice(1);

  if (document.getElementById(`page-${initialPage}`)) {
    navigate(initialPage);
  }

  if (window.lucide) window.lucide.createIcons();

  fetchData();
}

initialize();
function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function statusClass(status) {
    return status
        .toLowerCase()
        .replace(/\s+/g, "-");
}

function renderBadge(status) {
    return `<span class="badge ${statusClass(status)}">${status}</span>`;
}


// ===============================
// LOAD DATA
// ===============================

async function fetchData() {
    try {
        const [
            kameraResult,
            pelangganResult,
            transaksiResult
        ] = await Promise.all([
            supabaseClient
                .from("KAMERA")
                .select("*")
                .order("id_kamera", { ascending: true }),

            supabaseClient
                .from("PELANGGAN")
                .select("*")
                .order("id_pelanggan", { ascending: true }),

            supabaseClient
                .from("TRANSAKSI_SEWA")
                .select("*")
                .order("id_transaksi", { ascending: true })
        ]);

        if (kameraResult.error) throw kameraResult.error;
        if (pelangganResult.error) throw pelangganResult.error;
        if (transaksiResult.error) throw transaksiResult.error;

        state.kamera = kameraResult.data || [];
        state.pelanggan = pelangganResult.data || [];
        state.transaksi = transaksiResult.data || [];

        renderDashboard();
        renderKamera();
        renderPelanggan();
        renderTransaksi();
        populateTransactionOptions();

    } catch (error) {
        console.error("Gagal mengambil data:", error);
        alert("Gagal mengambil data dari Supabase: " + error.message);
    }
}


// ===============================
// DASHBOARD
// ===============================

function renderDashboard() {
    const dashboardStats = document.getElementById("dashboardStats");

    const jumlahKamera = state.kamera.length;

    const kameraTersedia = state.kamera.filter(
        kamera => kamera.status_kamera === "Tersedia"
    ).length;

    const kameraDisewa = state.kamera.filter(
        kamera => kamera.status_kamera === "Disewa"
    ).length;

    const jumlahPelanggan = state.pelanggan.length;

    const totalPendapatan = state.transaksi
        .filter(transaksi => transaksi.status_transaksi === "Selesai")
        .reduce(
            (total, transaksi) =>
                total + Number(transaksi.total_pendapatan),
            0
        );

    dashboardStats.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">📷</div>
            <div>
                <span>Total Kamera</span>
                <h3>${jumlahKamera}</h3>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div>
                <span>Kamera Tersedia</span>
                <h3>${kameraTersedia}</h3>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div>
                <span>Kamera Disewa</span>
                <h3>${kameraDisewa}</h3>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div>
                <span>Total Pelanggan</span>
                <h3>${jumlahPelanggan}</h3>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div>
                <span>Total Pendapatan</span>
                <h3>${formatRupiah(totalPendapatan)}</h3>
            </div>
        </div>
    `;
}


// ===============================
// RENDER KAMERA
// ===============================

function renderKamera() {
    const tableBody = document.getElementById("kameraTableBody");

    tableBody.innerHTML = "";

    if (state.kamera.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7">Belum ada data kamera.</td>
            </tr>
        `;
        return;
    }

    state.kamera.forEach(kamera => {
        tableBody.innerHTML += `
            <tr>
                <td>${kamera.id_kamera}</td>
                <td>${kamera.nama_kamera}</td>
                <td>${kamera.merk}</td>
                <td>${kamera.jenis}</td>
                <td>${formatRupiah(kamera.harga_sewa_per_hari)}</td>
                <td>${renderBadge(kamera.status_kamera)}</td>
                <td>
                    <button class="btn-edit"
                        onclick="editKamera(${kamera.id_kamera})">
                        Edit
                    </button>

                    <button class="btn-delete"
                        onclick="deleteKamera(${kamera.id_kamera})">
                        Hapus
                    </button>
                </td>
            </tr>
        `;
    });
}


// ===============================
// RENDER PELANGGAN
// ===============================

function renderPelanggan() {
    const tableBody = document.getElementById("pelangganTableBody");

    tableBody.innerHTML = "";

    if (state.pelanggan.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5">Belum ada data pelanggan.</td>
            </tr>
        `;
        return;
    }

    state.pelanggan.forEach(pelanggan => {
        tableBody.innerHTML += `
            <tr>
                <td>${pelanggan.id_pelanggan}</td>
                <td>${pelanggan.nama_pelanggan}</td>
                <td>${pelanggan.no_telepon}</td>
                <td>${pelanggan.alamat}</td>
                <td>
                    <button class="btn-edit"
                        onclick="editPelanggan(${pelanggan.id_pelanggan})">
                        Edit
                    </button>

                    <button class="btn-delete"
                        onclick="deletePelanggan(${pelanggan.id_pelanggan})">
                        Hapus
                    </button>
                </td>
            </tr>
        `;
    });
}


// ===============================
// RENDER TRANSAKSI
// ===============================

function renderTransaksi() {
    const tableBody = document.getElementById("transaksiTableBody");

    tableBody.innerHTML = "";

    if (state.transaksi.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10">Belum ada transaksi.</td>
            </tr>
        `;
        return;
    }

    state.transaksi.forEach(transaksi => {

        const kamera = state.kamera.find(
            kamera => kamera.id_kamera === transaksi.id_kamera
        );

        const pelanggan = state.pelanggan.find(
            pelanggan => pelanggan.id_pelanggan === transaksi.id_pelanggan
        );

        tableBody.innerHTML += `
            <tr>
                <td>${transaksi.id_transaksi}</td>

                <td>
                    ${kamera ? kamera.nama_kamera : "-"}
                </td>

                <td>
                    ${pelanggan ? pelanggan.nama_pelanggan : "-"}
                </td>

                <td>${formatDate(transaksi.tanggal_sewa)}</td>

                <td>${formatDate(transaksi.tanggal_kembali)}</td>

                <td>${transaksi.lama_sewa} hari</td>

                <td>${formatRupiah(transaksi.harga_per_hari)}</td>

                <td>${formatRupiah(transaksi.total_pendapatan)}</td>

                <td>${renderBadge(transaksi.status_transaksi)}</td>

                <td>
                    <button class="btn-edit"
                        onclick="editTransaksi(${transaksi.id_transaksi})">
                        Edit
                    </button>

                    <button class="btn-delete"
                        onclick="deleteTransaksi(${transaksi.id_transaksi})">
                        Hapus
                    </button>
                </td>
            </tr>
        `;
    });
}


// ===============================
// DROPDOWN TRANSAKSI
// ===============================

function populateTransactionOptions() {

    const cameraSelect =
        document.getElementById("transactionCamera");

    const customerSelect =
        document.getElementById("transactionCustomer");

    cameraSelect.innerHTML = `
        <option value="">Pilih Kamera</option>
    `;

    customerSelect.innerHTML = `
        <option value="">Pilih Pelanggan</option>
    `;

    state.kamera.forEach(kamera => {

        // Hanya kamera tersedia yang bisa dipilih
        if (kamera.status_kamera === "Tersedia") {
            cameraSelect.innerHTML += `
                <option value="${kamera.id_kamera}">
                    ${kamera.nama_kamera} - ${formatRupiah(kamera.harga_sewa_per_hari)}
                </option>
            `;
        }
    });

    state.pelanggan.forEach(pelanggan => {

        customerSelect.innerHTML += `
            <option value="${pelanggan.id_pelanggan}">
                ${pelanggan.nama_pelanggan}
            </option>
        `;
    });
}


// ===============================
// HITUNG TRANSAKSI
// ===============================

function calculateTransaction() {

    const cameraId =
        Number(document.getElementById("transactionCamera").value);

    const tanggalSewa =
        document.getElementById("tanggalSewa").value;

    const tanggalKembali =
        document.getElementById("tanggalKembali").value;

    const hargaDisplay =
        document.getElementById("hargaPerHariDisplay");

    const lamaDisplay =
        document.getElementById("lamaSewaDisplay");

    const totalDisplay =
        document.getElementById("totalPendapatanDisplay");

    const kamera = state.kamera.find(
        kamera => kamera.id_kamera === cameraId
    );

    if (!kamera) {
        hargaDisplay.value = "";
        lamaDisplay.value = "";
        totalDisplay.value = "";
        return;
    }

    hargaDisplay.value =
        formatRupiah(kamera.harga_sewa_per_hari);

    if (!tanggalSewa || !tanggalKembali) {
        lamaDisplay.value = "";
        totalDisplay.value = "";
        return;
    }

    const start = new Date(tanggalSewa);
    const end = new Date(tanggalKembali);

    const difference =
        Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (difference <= 0) {
        lamaDisplay.value = "";
        totalDisplay.value = "";
        return;
    }

    const lamaSewa = difference + 1;

    const total =
        lamaSewa * Number(kamera.harga_sewa_per_hari);

    lamaDisplay.value = `${lamaSewa} hari`;

    totalDisplay.value = formatRupiah(total);
}


// ===============================
// CAMERA FORM
// ===============================

document
    .getElementById("cameraForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const id =
            document.getElementById("cameraId").value;

        const data = {
            nama_kamera:
                document.getElementById("namaKamera").value,

            merk:
                document.getElementById("merkKamera").value,

            jenis:
                document.getElementById("jenisKamera").value,

            harga_sewa_per_hari:
                Number(document.getElementById("hargaSewa").value),

            status_kamera:
                document.getElementById("statusKamera").value
        };

        try {

            let result;

            if (id) {

                result = await supabaseClient
                    .from("KAMERA")
                    .update(data)
                    .eq("id_kamera", id);

            } else {

                result = await supabaseClient
                    .from("KAMERA")
                    .insert([data]);
            }

            if (result.error) throw result.error;

            alert(
                id
                    ? "Data kamera berhasil diperbarui!"
                    : "Data kamera berhasil ditambahkan!"
            );

            resetCameraForm();
            await fetchData();

        } catch (error) {

            console.error(error);

            alert(
                "Gagal menyimpan kamera: " +
                error.message
            );
        }
    });


// ===============================
// EDIT KAMERA
// ===============================

function editKamera(id) {

    const kamera = state.kamera.find(
        kamera => kamera.id_kamera === id
    );

    if (!kamera) return;

    document.getElementById("cameraId").value =
        kamera.id_kamera;

    document.getElementById("namaKamera").value =
        kamera.nama_kamera;

    document.getElementById("merkKamera").value =
        kamera.merk;

    document.getElementById("jenisKamera").value =
        kamera.jenis;

    document.getElementById("hargaSewa").value =
        kamera.harga_sewa_per_hari;

    document.getElementById("statusKamera").value =
        kamera.status_kamera;

    document.getElementById("cameraForm")
        .scrollIntoView({ behavior: "smooth" });
}


// ===============================
// DELETE KAMERA
// ===============================

async function deleteKamera(id) {

    const digunakan = state.transaksi.some(
        transaksi => transaksi.id_kamera === id
    );

    if (digunakan) {
        alert(
            "Kamera tidak dapat dihapus karena sudah memiliki transaksi."
        );
        return;
    }

    if (!confirm("Yakin ingin menghapus kamera ini?")) {
        return;
    }

    try {

        const { error } = await supabaseClient
            .from("KAMERA")
            .delete()
            .eq("id_kamera", id);

        if (error) throw error;

        alert("Kamera berhasil dihapus!");

        await fetchData();

    } catch (error) {

        alert(
            "Gagal menghapus kamera: " +
            error.message
        );
    }
}


// ===============================
// RESET CAMERA FORM
// ===============================

function resetCameraForm() {

    document.getElementById("cameraForm").reset();

    document.getElementById("cameraId").value = "";

    document.getElementById("statusKamera").value =
        "Tersedia";
}

document
    .getElementById("resetCameraForm")
    .addEventListener("click", resetCameraForm);


// ===============================
// CUSTOMER FORM
// ===============================

document
    .getElementById("customerForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const id =
            document.getElementById("customerId").value;

        const data = {

            nama_pelanggan:
                document.getElementById("namaPelanggan").value,

            no_telepon:
                document.getElementById("noTelepon").value,

            alamat:
                document.getElementById("alamatPelanggan").value
        };

        try {

            let result;

            if (id) {

                result = await supabaseClient
                    .from("PELANGGAN")
                    .update(data)
                    .eq("id_pelanggan", id);

            } else {

                result = await supabaseClient
                    .from("PELANGGAN")
                    .insert([data]);
            }

            if (result.error) throw result.error;

            alert(
                id
                    ? "Data pelanggan berhasil diperbarui!"
                    : "Data pelanggan berhasil ditambahkan!"
            );

            resetCustomerForm();

            await fetchData();

        } catch (error) {

            alert(
                "Gagal menyimpan pelanggan: " +
                error.message
            );
        }
    });


// ===============================
// EDIT CUSTOMER
// ===============================

function editPelanggan(id) {

    const pelanggan = state.pelanggan.find(
        pelanggan => pelanggan.id_pelanggan === id
    );

    if (!pelanggan) return;

    document.getElementById("customerId").value =
        pelanggan.id_pelanggan;

    document.getElementById("namaPelanggan").value =
        pelanggan.nama_pelanggan;

    document.getElementById("noTelepon").value =
        pelanggan.no_telepon;

    document.getElementById("alamatPelanggan").value =
        pelanggan.alamat;

    document.getElementById("customerForm")
        .scrollIntoView({ behavior: "smooth" });
}


// ===============================
// DELETE CUSTOMER
// ===============================

async function deletePelanggan(id) {

    const digunakan = state.transaksi.some(
        transaksi => transaksi.id_pelanggan === id
    );

    if (digunakan) {
        alert(
            "Pelanggan tidak dapat dihapus karena sudah memiliki transaksi."
        );
        return;
    }

    if (!confirm("Yakin ingin menghapus pelanggan ini?")) {
        return;
    }

    try {

        const { error } = await supabaseClient
            .from("PELANGGAN")
            .delete()
            .eq("id_pelanggan", id);

        if (error) throw error;

        alert("Pelanggan berhasil dihapus!");

        await fetchData();

    } catch (error) {

        alert(
            "Gagal menghapus pelanggan: " +
            error.message
        );
    }
}


// ===============================
// RESET CUSTOMER FORM
// ===============================

function resetCustomerForm() {

    document.getElementById("customerForm").reset();

    document.getElementById("customerId").value = "";
}

document
    .getElementById("resetCustomerForm")
    .addEventListener("click", resetCustomerForm);


// ===============================
// TRANSACTION FORM
// ===============================

document
    .getElementById("transactionForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const id =
            document.getElementById("transactionId").value;

        const cameraId =
            Number(document.getElementById("transactionCamera").value);

        const customerId =
            Number(document.getElementById("transactionCustomer").value);

        const tanggalSewa =
            document.getElementById("tanggalSewa").value;

        const tanggalKembali =
            document.getElementById("tanggalKembali").value;

        const status =
            document.getElementById("transactionStatus").value;

        const kamera = state.kamera.find(
            kamera => kamera.id_kamera === cameraId
        );

        if (!kamera) {
            alert("Silakan pilih kamera.");
            return;
        }

        const start = new Date(tanggalSewa);
        const end = new Date(tanggalKembali);

        const difference =
            Math.ceil(
                (end - start) /
                (1000 * 60 * 60 * 24)
            );

        if (difference < 0) {
            alert(
                "Tanggal kembali tidak boleh sebelum tanggal sewa."
            );
            return;
        }

        const lamaSewa = difference + 1;

        const totalPendapatan =
            lamaSewa *
            Number(kamera.harga_sewa_per_hari);

        const data = {

            id_kamera: cameraId,

            id_pelanggan: customerId,

            tanggal_sewa: tanggalSewa,

            tanggal_kembali: tanggalKembali,

            lama_sewa: lamaSewa,

            harga_per_hari:
                Number(kamera.harga_sewa_per_hari),

            total_pendapatan:
                totalPendapatan,

            status_transaksi: status
        };

        try {

            let result;

            if (id) {

                result = await supabaseClient
                    .from("TRANSAKSI_SEWA")
                    .update(data)
                    .eq("id_transaksi", id);

            } else {

                result = await supabaseClient
                    .from("TRANSAKSI_SEWA")
                    .insert([data]);
            }

            if (result.error) throw result.error;


            // Update status kamera
            let statusKamera = "Tersedia";

            if (status === "Aktif") {
                statusKamera = "Disewa";
            }

            const cameraUpdate =
                await supabaseClient
                    .from("KAMERA")
                    .update({
                        status_kamera: statusKamera
                    })
                    .eq("id_kamera", cameraId);

            if (cameraUpdate.error) {
                throw cameraUpdate.error;
            }

            alert(
                id
                    ? "Transaksi berhasil diperbarui!"
                    : "Transaksi berhasil ditambahkan!"
            );

            resetTransactionForm();

            await fetchData();

        } catch (error) {

            console.error(error);

            alert(
                "Gagal menyimpan transaksi: " +
                error.message
            );
        }
    });


// ===============================
// EDIT TRANSACTION
// ===============================

function editTransaksi(id) {

    const transaksi = state.transaksi.find(
        transaksi => transaksi.id_transaksi === id
    );

    if (!transaksi) return;

    document.getElementById("transactionId").value =
        transaksi.id_transaksi;

    document.getElementById("transactionCamera").value =
        transaksi.id_kamera;

    document.getElementById("transactionCustomer").value =
        transaksi.id_pelanggan;

    document.getElementById("tanggalSewa").value =
        transaksi.tanggal_sewa;

    document.getElementById("tanggalKembali").value =
        transaksi.tanggal_kembali;

    document.getElementById("transactionStatus").value =
        transaksi.status_transaksi;

    calculateTransaction();

    document.getElementById("transactionForm")
        .scrollIntoView({ behavior: "smooth" });
}


// ===============================
// DELETE TRANSACTION
// ===============================

async function deleteTransaksi(id) {

    const transaksi = state.transaksi.find(
        transaksi => transaksi.id_transaksi === id
    );

    if (!transaksi) return;

    if (!confirm("Yakin ingin menghapus transaksi ini?")) {
        return;
    }

    try {

        const { error } = await supabaseClient
            .from("TRANSAKSI_SEWA")
            .delete()
            .eq("id_transaksi", id);

        if (error) throw error;


        // Kembalikan status kamera menjadi tersedia
        await supabaseClient
            .from("KAMERA")
            .update({
                status_kamera: "Tersedia"
            })
            .eq("id_kamera", transaksi.id_kamera);

        alert("Transaksi berhasil dihapus!");

        await fetchData();

    } catch (error) {

        alert(
            "Gagal menghapus transaksi: " +
            error.message
        );
    }
}


// ===============================
// RESET TRANSACTION FORM
// ===============================

function resetTransactionForm() {

    document.getElementById("transactionForm").reset();

    document.getElementById("transactionId").value = "";

    document.getElementById("hargaPerHariDisplay").value = "";

    document.getElementById("lamaSewaDisplay").value = "";

    document.getElementById("totalPendapatanDisplay").value = "";

    document.getElementById("transactionStatus").value =
        "Aktif";
}

document
    .getElementById("resetTransactionForm")
    .addEventListener("click", resetTransactionForm);


// ===============================
// AUTO CALCULATE
// ===============================

document
    .getElementById("transactionCamera")
    .addEventListener("change", calculateTransaction);

document
    .getElementById("tanggalSewa")
    .addEventListener("change", calculateTransaction);

document
    .getElementById("tanggalKembali")
    .addEventListener("change", calculateTransaction);


// ===============================
// START APP
// ===============================

resetCameraForm();
resetCustomerForm();
resetTransactionForm();

fetchData();
