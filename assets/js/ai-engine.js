// --- MANAJEMEN KONFIGURASI LOCALSTORAGE ---
window.getAiConfig = function() {
    return {
        provider: localStorage.getItem("SELLER_AI_PROVIDER") || "gemini",
        apiKey: localStorage.getItem("SELLER_AI_KEY") || ""
    };
};

window.setAiConfig = function(provider, key) {
    localStorage.setItem("SELLER_AI_PROVIDER", provider || "gemini");
    if (key && key.trim().length > 0) {
        localStorage.setItem("SELLER_AI_KEY", key.trim());
    } else {
        localStorage.removeItem("SELLER_AI_KEY");
    }
};

// --- FUNGSI UTAMA ANALISIS REVIEWS ---
window.analyzeReviewWithAI = async function(reviewText) {
    const { provider, apiKey } = window.getAiConfig();

    if (!apiKey || apiKey.length < 5) {
        return simulateAIAnalysis(reviewText);
    }

    try {
        if (provider === "gemini") {
            return await callGeminiApi(reviewText, apiKey);
        } else if (provider === "openai") {
            return await callOpenAiApi(reviewText, apiKey);
        } else if (provider === "groq") {
            return await callGroqApi(reviewText, apiKey);
        }
    } catch (err) {
        console.warn(`Gagal terhubung ke provider ${provider}, beralih ke mode simulasi:`, err);
    }

    return simulateAIAnalysis(reviewText);
};

// --- API FETCHERS ---

// 1. Google Gemini API
async function callGeminiApi(reviewText, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const prompt = `Analisis ulasan pembeli ini: "${reviewText}".
    Balas HANYA menggunakan format JSON valid tanpa tanda backtick atau markdown:
    {
      "sentiment": "Negatif",
      "category": "Pengiriman",
      "urgency": "Tinggi",
      "suggested_response": "Draf balasan ramah dan solutif"
    }`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const rawText = data.candidates[0].content.parts[0].text;
        const cleanJson = rawText.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);
    }
    throw new Error("Respon Gemini tidak valid");
}

// 2. OpenAI API (GPT-4o-mini)
async function callOpenAiApi(reviewText, apiKey) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: 'Analisis ulasan pembeli e-commerce. Balas HANYA dalam format JSON valid: {"sentiment":"Negatif","category":"Pengiriman","urgency":"Tinggi","suggested_response":"Draf balasan ramah dan solutif"}'
                },
                { role: "user", content: reviewText }
            ]
        })
    });

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
        return JSON.parse(data.choices[0].message.content);
    }
    throw new Error("Respon OpenAI tidak valid");
}

// 3. Groq API (Llama 3.3 70B)
async function callGroqApi(reviewText, apiKey) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
            
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: 'Analisis ulasan pembeli e-commerce. Balas HANYA dalam format JSON valid: {"sentiment":"Negatif","category":"Pengiriman","urgency":"Tinggi","suggested_response":"Draf balasan ramah dan solutif"}'
                },
                { role: "user", content: reviewText }
            ]
        })
    });

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
        return JSON.parse(data.choices[0].message.content);
    }
    throw new Error("Respon Groq tidak valid");
}

// --- FALLBACK LOCAL SIMULATION ---
function simulateAIAnalysis(text) {
    const lower = text.toLowerCase();
    if (lower.includes("sobek") || lower.includes("rusak") || lower.includes("cacat")) {
        return {
            sentiment: "Negatif",
            category: "Kualitas Produk",
            urgency: "Tinggi",
            suggested_response: "Halo Kak, mohon maaf atas kendala barang yang diterima. Kami siap ganti baru atau refund 100%. Silakan chat admin ya."
        };
    } else if (lower.includes("lama") || lower.includes("lambat") || lower.includes("kurir")) {
        return {
            sentiment: "Negatif",
            category: "Pengiriman",
            urgency: "Sedang",
            suggested_response: "Halo Kak, mohon maaf atas keterlambatan pihak kurir. Paket Kakak sedang kami bantu follow up ke ekspedisi."
        };
    }
    return {
        sentiment: "Positif",
        category: "Kepuasan Pelanggan",
        urgency: "Rendah",
        suggested_response: "Terima kasih banyak sudah berbelanja di toko kami! Semoga suka dengan produknya."
    };
}