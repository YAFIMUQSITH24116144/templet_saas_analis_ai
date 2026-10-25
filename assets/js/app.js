window.reviews = [];
window.savedRevenue = 0;
window.currentFilter = "semua";
window.issueChart = null;

// --- LOGIK MODAL & MULTI-PROVIDER ---
window.openApiKeyModal = function() {
    const modal = document.getElementById("api-key-modal");
    const providerSelect = document.getElementById("modal-provider-select");
    const input = document.getElementById("modal-api-key-input");
    
    const config = window.getAiConfig ? window.getAiConfig() : { provider: "gemini", apiKey: "" };

    if (providerSelect) providerSelect.value = config.provider;
    if (input) input.value = config.apiKey;

    window.handleProviderChange();

    if (modal) {
        modal.classList.remove("hidden");
        setTimeout(() => modal.classList.remove("opacity-0"), 10);
    }
};

window.closeApiKeyModal = function() {
    const modal = document.getElementById("api-key-modal");
    if (modal) {
        modal.classList.add("opacity-0");
        setTimeout(() => modal.classList.add("hidden"), 200);
    }
};

window.handleProviderChange = function() {
    const providerSelect = document.getElementById("modal-provider-select");
    const label = document.getElementById("modal-key-label");
    const link = document.getElementById("modal-key-link");
    if (!providerSelect || !label || !link) return;

    const val = providerSelect.value;
    if (val === "gemini") {
        label.innerText = "Masukkan API Key Google Gemini Anda";
        link.innerHTML = 'Dapatkan API Key gratis di <a href="https://aistudio.google.com/api-keys" target="_blank" class="text-indigo-400 hover:underline inline-flex items-center gap-1">Google AI Studio <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i></a>';
    } else if (val === "openai") {
        label.innerText = "Masukkan API Key OpenAI (GPT-4o) Anda";
        link.innerHTML = 'Dapatkan API Key di <a href="https://platform.openai.com/api-keys" target="_blank" class="text-indigo-400 hover:underline inline-flex items-center gap-1">OpenAI Platform <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i></a>';
    } else if (val === "groq") {
        label.innerText = "Masukkan API Key Groq Llama Anda";
        link.innerHTML = 'Dapatkan API Key gratis di <a href="https://console.groq.com/keys" target="_blank" class="text-indigo-400 hover:underline inline-flex items-center gap-1">Groq Console <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i></a>';
    }
};

window.saveApiKeyFromModal = function() {
    const providerSelect = document.getElementById("modal-provider-select");
    const input = document.getElementById("modal-api-key-input");
    
    const provider = providerSelect ? providerSelect.value : "gemini";
    const key = input ? input.value : "";

    if (window.setAiConfig) {
        window.setAiConfig(provider, key);
    }
    window.updateAiStatusBadge();
    window.closeApiKeyModal();
    alert("Pengaturan AI Provider berhasil disimpan!");
};

window.toggleApiKeyVisibility = function() {
    const input = document.getElementById("modal-api-key-input");
    const icon = document.getElementById("eye-icon");
    if (!input || !icon) return;

    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
};

window.updateAiStatusBadge = function() {
    const badge = document.getElementById("ai-status-badge");
    const dot = document.getElementById("ai-status-dot");
    const text = document.getElementById("ai-status-text");
    const config = window.getAiConfig ? window.getAiConfig() : { provider: "gemini", apiKey: "" };

    if (!badge || !dot || !text) return;

    if (config.apiKey && config.apiKey.length > 5) {
        const providerNames = { gemini: "Gemini AI", openai: "OpenAI GPT-4o", groq: "Groq Llama 3" };
        text.innerText = `${providerNames[config.provider] || "AI"} Connected`;
        badge.className = "flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-medium transition-all";
        dot.className = "w-2 h-2 rounded-full bg-emerald-400 animate-pulse";
    } else {
        text.innerText = "Mode Simulasi Lokal";
        badge.className = "flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-full text-xs font-medium transition-all";
        dot.className = "w-2 h-2 rounded-full bg-amber-400 animate-pulse";
    }
};

// --- FUNGSI SALIN BALASAN TERSALIN ---
window.copyToClipboard = function(text, btnElement) {
    navigator.clipboard.writeText(text).then(() => {
        const originalHtml = btnElement.innerHTML;
        btnElement.innerHTML = `<i class="fa-solid fa-check text-emerald-400"></i> Tersalin!`;
        btnElement.classList.add("text-emerald-400", "border-emerald-500/40");
        
        setTimeout(() => {
            btnElement.innerHTML = originalHtml;
            btnElement.classList.remove("text-emerald-400", "border-emerald-500/40");
        }, 2000);
    }).catch(err => {
        alert("Gagal menyalin balasan: " + err);
    });
};

// --- LOGIK SIMULATOR ULASAN ---
window.handleNewReview = async function() {
    const nameInput = document.getElementById("input-name");
    const platformInput = document.getElementById("input-platform");
    const ratingInput = document.getElementById("input-rating");
    const textInput = document.getElementById("input-review");

    const text = textInput ? textInput.value.trim() : "";
    if (!text) {
        alert("Tuliskan atau pilih teks ulasan terlebih dahulu!");
        return;
    }

    const btn = document.getElementById("btn-submit");
    if (btn) {
        btn.innerText = "Menganalisis dengan AI...";
        btn.disabled = true;
    }

    let aiResult;
    try {
        aiResult = await window.analyzeReviewWithAI(text);
    } catch (e) {
        aiResult = {
            sentiment: "Negatif",
            category: "Pengiriman",
            urgency: "Tinggi",
            suggested_response: "Terima kasih atas masukannya, akan kami tindak lanjuti."
        };
    }

    const newReview = {
        id: Date.now(),
        name: nameInput && nameInput.value.trim() ? nameInput.value.trim() : "Pembeli",
        platform: platformInput ? platformInput.value : "Shopee",
        rating: ratingInput ? parseInt(ratingInput.value) : 1,
        text: text,
        sentiment: aiResult.sentiment || "Negatif",
        category: aiResult.category || "Pengiriman",
        urgency: aiResult.urgency || "Tinggi",
        response: aiResult.suggested_response || "Terima kasih atas ulasannya.",
        resolved: false
    };

    window.reviews.unshift(newReview);
    if (textInput) textInput.value = "";

    if (btn) {
        btn.innerText = "Analisis Ulasan dengan AI";
        btn.disabled = false;
    }

    renderDashboard();
};

window.fillQuickTemplate = function(type) {
    const input = document.getElementById("input-review");
    if (!input) return;
    if (type === 'rusak') input.value = "Barang sampai dengan kondisi sobek di bagian depan!";
    if (type === 'lama') input.value = "Pengiriman sangat lambat, paket tertahan 4 hari di kurir.";
    if (type === 'pujian') input.value = "Kualitas produk sangat bagus, jahitan rapi dan seller ramah.";
};

window.resolveReview = function(id) {
    const r = window.reviews.find(item => item.id === id);
    if (r) {
        r.resolved = true;
        window.savedRevenue += 50000;
        renderDashboard();
    }
};

window.setFilterTab = function(tab) {
    window.currentFilter = tab;
    
    // Update kelas aktif pada tombol tab
    ['semua', 'tinggi', 'selesai'].forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if (btn) {
            if (t === tab) {
                btn.className = "tab-btn active text-[11px] px-3 py-1 rounded-lg font-medium transition bg-slate-800 text-white shadow-sm";
            } else {
                btn.className = "tab-btn text-[11px] px-3 py-1 rounded-lg font-medium text-slate-400 hover:text-white transition";
            }
        }
    });

    renderDashboard();
};

function renderDashboard() {
    const total = window.reviews.length;
    const highRisk = window.reviews.filter(r => r.urgency === "Tinggi" && !r.resolved).length;
    const riskPct = total > 0 ? Math.round((highRisk / total) * 100) : 0;

    const elTotal = document.getElementById("stat-total");
    const elRisk = document.getElementById("stat-risk");
    const elRiskPct = document.getElementById("stat-risk-pct");
    const elRev = document.getElementById("stat-revenue");

    if (elTotal) elTotal.innerText = total;
    if (elRisk) elRisk.innerText = highRisk;
    if (elRiskPct) elRiskPct.innerText = `(${riskPct}%)`;
    if (elRev) elRev.innerText = `Rp ${window.savedRevenue.toLocaleString("id-ID")}`;

    const searchInput = document.getElementById("search-input");
    const search = searchInput ? searchInput.value.toLowerCase() : "";

    let filtered = window.reviews.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(search) || r.text.toLowerCase().includes(search);
        if (window.currentFilter === "tinggi") return matchesSearch && r.urgency === "Tinggi" && !r.resolved;
        if (window.currentFilter === "selesai") return matchesSearch && r.resolved;
        return matchesSearch;
    });

    const listContainer = document.getElementById("review-list");
    if (listContainer) {
        if (filtered.length === 0) {
            listContainer.innerHTML = `<p class="text-xs text-slate-500 text-center py-6">Belum ada ulasan yang ditampilkan.</p>`;
        } else {
            listContainer.innerHTML = filtered.map(r => {
                const escapedResponse = r.response.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                return `
                <div class="bg-dark-900 border border-slate-800 p-4 rounded-xl space-y-3 shadow-sm">
                    <div class="flex justify-between items-center text-xs">
                        <span class="font-bold text-white">${r.name} <span class="font-normal text-slate-400">(${r.platform})</span></span>
                        <span class="px-2 py-0.5 rounded-full font-semibold ${r.resolved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">
                            ${r.resolved ? '✅ Selesai' : r.urgency + ' Urgensi'}
                        </span>
                    </div>
                    <p class="text-xs text-slate-300">"${r.text}"</p>
                    
                    <!-- Kotak Balasan AI dengan Tombol Copy -->
                    <div class="bg-dark-950 p-3 rounded-lg text-xs space-y-2 border border-slate-800/60">
                        <div class="flex items-center justify-between">
                            <p class="text-indigo-400 font-semibold flex items-center gap-1.5">
                                <i class="fa-solid fa-sparkles text-[10px]"></i> Rekomendasi Balasan AI (${r.category}):
                            </p>
                            <button onclick="window.copyToClipboard('${escapedResponse}', this)" class="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] font-medium transition flex items-center gap-1.5">
                                <i class="fa-regular fa-copy"></i> Salin
                            </button>
                        </div>
                        <p class="text-slate-300 leading-relaxed">${r.response}</p>
                    </div>

                    ${!r.resolved ? `
                        <button onclick="window.resolveReview(${r.id})" class="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-medium transition shadow-sm">
                            Selesaikan & Selamatkan Rp50.000
                        </button>
                    ` : ''}
                </div>
            `;
            }).join("");
        }
    }

    updateChart();
}

// --- INITIALIZERS & VISUALISASI TRAFFIC LIGHT CHART ---
function initChart() {
    const canvas = document.getElementById('issueChart');
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');
    window.issueChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [],
                borderWidth: 0
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            cutout: '70%'
        }
    });
}

function updateChart() {
    if (!window.issueChart) return;
    const catCounts = {};
    window.reviews.forEach(r => {
        catCounts[r.category] = (catCounts[r.category] || 0) + 1;
    });

    const labels = Object.keys(catCounts);
    const data = Object.values(catCounts);

    // Pemetaan Warna Traffic Light
    const colorMap = {
        "Kepuasan Pelanggan": "#10b981", // Hijau (Emerald)
        "Pengiriman": "#f59e0b",         // Kuning (Amber)
        "Kualitas Produk": "#ef4444",    // Merah (Rose)
        "Layanan": "#3b82f6"             // Biru
    };

    const bgColors = labels.map(label => colorMap[label] || "#3b82f6");

    window.issueChart.data.labels = labels;
    window.issueChart.data.datasets[0].data = data;
    window.issueChart.data.datasets[0].backgroundColor = bgColors;
    window.issueChart.update();

    // Render Progress Bar Dinamis di Bawah Chart
    const total = window.reviews.length || 1;
    const progressContainer = document.getElementById("issue-progress-list");
    if (progressContainer) {
        progressContainer.innerHTML = labels.map(cat => {
            const count = catCounts[cat];
            const pct = Math.round((count / total) * 100);
            const barColor = colorMap[cat] || "#6366f1";
            return `
                <div>
                    <div class="flex justify-between text-slate-400 mb-1 text-[11px]">
                        <span>${cat}</span>
                        <span class="font-semibold text-white">${pct}%</span>
                    </div>
                    <div class="w-full bg-dark-900 rounded-full h-1.5 overflow-hidden">
                        <div class="h-1.5 rounded-full transition-all duration-300" style="width: ${pct}%; background-color: ${barColor}"></div>
                    </div>
                </div>
            `;
        }).join("");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    try { initChart(); } catch (e) {}

    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("input", renderDashboard);
    }

    window.updateAiStatusBadge();
    renderDashboard();
});