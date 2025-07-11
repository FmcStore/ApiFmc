const express = require("express");
const danz = require("d-scrape");
const axios = require("axios");
const router = express.Router();
const config = require("../schema/config");
const skrep = require("../scrapers/ai");
const { developer: dev } = config.options;

// Log Info
const messages = {
  error: {
    status: 404,
    developer: dev,
    result: "Error, Service Unavailable",
  },
  notRes: {
    status: 404,
    developer: dev,
    result: "Error, Invalid JSON Result",
  },
  query: {
    status: 400,
    developer: dev,
    result: "Please input parameter query!",
  },
  url: {
    status: 400,
    developer: dev,
    result: "Please input parameter URL!",
  },
  notUrl: {
    status: 404,
    developer: dev,
    result: "Error, Invalid URL",
  },
};

// AI Routes
router.get("/ai/chatgpt", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json(messages.query);

  try {
    // Panggil API baru
    const response = await axios.get(
      `https://api.fasturl.link/aillm/gpt-4o?ask=${encodeURIComponent(query)}`
    );
    
    // Validasi respon
    if (!response.data || !response.data.result) {
      return res.status(404).json(messages.notRes);
    }

    // Sesuaikan format respon
    res.json({
      status: true,
      developer: dev,
      result: {
        message: response.data.result
      }
    });
  } catch (e) {
    console.error("Error fetching from FastURL API:", e);
    res.status(500).json(messages.error);
  }
});
// Pastikan Axios sudah di-install (npm install axios)
router.get("/ai/blackbox", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json(messages.query);

  try {
    const response = await axios.get(
      `https://api.siputzx.my.id/api/ai/blackboxai?content=${encodeURIComponent(query)}`
    );
    
    if (!response.data || response.data.status !== true || !response.data.data) {
      return res.status(404).json(messages.notRes);
    }

    res.json({
      status: true,
      developer: dev,
      result: {
        message: response.data.data
      }
    });
  } catch (e) {
    console.error("Error fetching from Blackbox API:", e);
    res.status(500).json(messages.error);
  }
});

router.get("/ai/gptlogic", async (req, res) => {
  const { query, prompt } = req.query;
  if (!query) return res.status(400).json(messages.query);
  if (!prompt)
    return res
      .status(400)
      .json({ status: 400, developer: dev, result: "Please input prompt!" });

  try {
    // Panggil API eksternal menggunakan Axios
    const externalApiUrl = `https://api.fasturl.link/aillm/gpt-4o`;
    const response = await axios.get(externalApiUrl, {
      params: { ask: query, style: prompt }, // Axios otomatis encode URL
      timeout: 10000, // Timeout 10 detik (opsional)
    });

    // Jika API eksternal merespons tapi tidak valid
    if (!response.data || !response.data.result) {
      return res.status(404).json(messages.notRes);
    }

    // Format respons sesuai struktur API Anda
    const data = {
      status: true,
      developer: dev,
      result: response.data.result,
    };

    res.json(data);
  } catch (e) {
    console.error("Error calling external API:", e.message);
    
    // Handle error spesifik dari Axios
    if (e.response) {
      // Jika API eksternal mengembalikan error (misal: 404, 500)
      res.status(500).json(messages.error);
    } else if (e.request) {
      // Jika request tidak terkirim (misal: timeout)
      res.status(503).json({ 
        status: 503, 
        developer: dev, 
        result: "External API request failed (timeout/unreachable)" 
      });
    } else {
      // Error lainnya (misal: config Axios salah)
      res.status(500).json(messages.error);
    }
  }
});

router.get("/ai/virtualgirl", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json(messages.query);

  try {
    const data = await danz.ai.VirtualGirlfriends(query);
    if (!data) return res.status(404).json(messages.notRes);
    res.json({ status: true, developer: dev, result: data });
  } catch (e) {
    res.status(500).json(messages.error);
  }
});

router.get("/ai/dystopia", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json(messages.query);

  try {
    const data = await danz.ai.dystopia(query);
    if (!data) return res.status(404).json(messages.notRes);
    res.json({ status: true, developer: dev, result: data });
  } catch (e) {
    res.status(500).json(messages.error);
  }
});

router.get("/ai/ersgan", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json(messages.url);

  try {
    const data = await danz.ai.ersgan(url);
    if (!data) return res.status(404).json(messages.notRes);
    res.json({ status: true, developer: dev, result: data });
  } catch (e) {
    res.status(500).json(messages.error);
  }
});

router.post("/ai/luminai", async (req, res) => {
  const { query, username } = req.query;
  if (!query) return res.status(400).json(messages.query);
  if (!username)
    return res.status(400).json({
      status: 400,
      developer: dev,
      result: "Please input Username session!",
    });

  try {
    const data = await skrep.luminai(query, username);
    if (!data) return res.status(404).json(messages.notRes);
    res.json({ status: true, developer: dev, result: data });
  } catch (e) {
    res.status(500).json(messages.error);
  }
});

// Downloader Routes
router.get("/downloader/tiktok", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json(messages.url);

  try {
    const data = await danz.downloader.tiktok(url);
    if (!data) return res.status(404).json(messages.notRes);
    res.json({ status: true, developer: dev, result: data });
  } catch (e) {
    res.status(500).json(messages.error);
  }
});

router.get("/downloader/igdl", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json(messages.url);

  try {
    const data = await danz.downloader.igdl(url);
    if (!data) return res.status(404).json(messages.notRes);
    res.json({ status: true, developer: dev, result: data });
  } catch (e) {
    res.status(500).json(messages.error);
  }
});

router.get("/downloader/spotify", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json(messages.url);

  try {
    const data = await danz.downloader.spotifyDownload(url);
    if (!data) return res.status(404).json(messages.notRes);
    res.json({ status: true, developer: dev, result: data });
  } catch (e) {
    res.status(500).json(messages.error);
  }
});

// Tools Routes
router.get("/tools/remini", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json(messages.url);

  try {
    const data = await danz.tools.remini(url);
    if (!data) return res.status(404).json(messages.notRes);
    res.json({ status: true, developer: dev, result: data });
  } catch (e) {
    res.status(500).json(messages.error);
  }
});

module.exports = router;
