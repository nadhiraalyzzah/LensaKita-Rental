// ===============================
// SUPABASE CONFIG
// ===============================

const SUPABASE_URL = "https://xjhcxvjstsvgmsquhtcc.supabase.co";
const SUPABASE_KEY = "sb_publishable_iSkBcWpc6-GfzZGYkV9YEw_7MLbj84B";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ===============================
// STATE
// ===============================

const state = {
    kamera: [],
    pelanggan: [],
    transaksi: []
};


// ===============================
// HELPER
// ===============================

function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(value || 0);
}

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