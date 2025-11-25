const express = require("express");
const danz = require("d-scrape");
const axios = require("axios");
const router = express.Router();
const config = require("../schema/config");
const skrep = require("../scrapers/ai");
const { developer: dev } = config.options;
const fileType = require('file-type');

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

// Konfigurasi GitHub
const githubToken = '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';
const githubOwner = 'tralalawabi-art';
const repo = 'storagefmc';
const branch = 'storage';

// Fungsi untuk memastikan repo dan branch ada
async function ensureRepoAndBranch() {
  const headers = { 
    Authorization: `Bearer ${githubToken}`,
    'User-Agent': 'Express-API'
  };

  try {
    // Cek apakah repo ada
    await axios.get(`https://api.github.com/repos/${githubOwner}/${repo}`, { headers });
    console.log('✅ Repository sudah ada');
  } catch (e) {
    if (e.response?.status === 404) {
      console.log('📦 Membuat repository baru...');
      try {
        // Buat repository baru
        await axios.post(
          `https://api.github.com/user/repos`,
          {
            name: repo,
            private: false,
            auto_init: true,
            description: 'Storage for API uploads'
          },
          { headers }
        );
        console.log('✅ Repository berhasil dibuat');
        
        // Tunggu sebentar untuk memastikan repo siap
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (createError) {
        // Jika error 422, repo mungkin sudah ada dengan nama yang sama
        if (createError.response?.status === 422) {
          console.log('ℹ️ Repository mungkin sudah ada');
        } else {
          throw createError;
        }
      }
    } else {
      throw e;
    }
  }

  try {
    // Cek apakah branch ada
    await axios.get(`https://api.github.com/repos/${githubOwner}/${repo}/branches/${branch}`, { headers });
    console.log('✅ Branch sudah ada');
  } catch (e) {
    if (e.response?.status === 404) {
      console.log('🌿 Membuat branch baru...');
      try {
        // Dapatkan SHA dari branch main/default
        const { data: refData } = await axios.get(
          `https://api.github.com/repos/${githubOwner}/${repo}/git/refs/heads/main`,
          { headers }
        );
        const sha = refData.object.sha;
        
        // Buat branch baru
        await axios.post(
          `https://api.github.com/repos/${githubOwner}/${repo}/git/refs`,
          {
            ref: `refs/heads/${branch}`,
            sha: sha
          },
          { headers }
        );
        console.log('✅ Branch berhasil dibuat');
      } catch (branchError) {
        // Jika gagal, coba branch master
        try {
          const { data: refData } = await axios.get(
            `https://api.github.com/repos/${githubOwner}/${repo}/git/refs/heads/master`,
            { headers }
          );
          const sha = refData.object.sha;
          
          await axios.post(
            `https://api.github.com/repos/${githubOwner}/${repo}/git/refs`,
            {
              ref: `refs/heads/${branch}`,
              sha: sha
            },
            { headers }
          );
          console.log('✅ Branch berhasil dibuat dari master');
        } catch (masterError) {
          console.log('❌ Gagal membuat branch:', masterError.response?.data || masterError.message);
          throw masterError;
        }
      }
    } else {
      throw e;
    }
  }
}

// Fungsi upload file ke GitHub
async function uploadFile(buffer, originalName = null) {
  try {
    await ensureRepoAndBranch();
  } catch (error) {
    console.error('Gagal memastikan repo dan branch:', error);
    throw new Error(`Gagal menyiapkan repository: ${error.message}`);
  }

  const detected = await fileType.fromBuffer(buffer);
  const ext = detected?.ext || 'bin';
  const baseName = originalName 
    ? originalName.replace(/\.[^/.]+$/, "") + '-' + Date.now()
    : Date.now() + '-' + Math.random().toString(36).substring(2, 10);
  const fileName = `${baseName}.${ext}`;
  const filePath = `uploads/${fileName}`;
  const base64 = buffer.toString('base64');
  
  const headers = { 
    Authorization: `Bearer ${githubToken}`,
    'User-Agent': 'Express-API',
    'Content-Type': 'application/json'
  };

  try {
    console.log(`📤 Mengupload file: ${fileName}`);
    
    const response = await axios.put(
      `https://api.github.com/repos/${githubOwner}/${repo}/contents/${filePath}`,
      {
        message: `Upload ${fileName}`,
        content: base64,
        branch: branch
      },
      { headers }
    );

    console.log('✅ File berhasil diupload');
    return {
      filename: fileName,
      url: `https://raw.githubusercontent.com/${githubOwner}/${repo}/${branch}/${filePath}`,
      download_url: response.data.content.download_url,
      size: buffer.length,
      type: detected?.mime || 'application/octet-stream'
    };
  } catch (uploadError) {
    console.error('❌ Error upload:', uploadError.response?.data || uploadError.message);
    
    if (uploadError.response?.status === 409) {
      throw new Error('Konflik: File mungkin sudah ada. Coba lagi.');
    } else if (uploadError.response?.status === 403) {
      throw new Error('Akses ditolak. Periksa token GitHub dan permissions.');
    } else if (uploadError.response?.status === 404) {
      throw new Error('Repository atau branch tidak ditemukan.');
    } else {
      throw new Error(`Gagal upload: ${uploadError.response?.data?.message || uploadError.message}`);
    }
  }
}

// Middleware untuk handle raw body (tanpa multer)
router.use(express.json({ limit: '50mb' }));
router.use(express.urlencoded({ extended: true, limit: '50mb' }));

// AI Routes (tetap sama seperti sebelumnya)
router.get("/ai/chatgpt", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json(messages.query);

  try {
    const response = await axios.get(
      `https://api.fasturl.link/aillm/gpt-4o?ask=${encodeURIComponent(query)}`
    );
    
    if (!response.data || !response.data.result) {
      return res.status(404).json(messages.notRes);
    }

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
    const externalApiUrl = `https://api.fasturl.link/aillm/gpt-4o`;
    const response = await axios.get(externalApiUrl, {
      params: { ask: query, style: prompt },
      timeout: 10000,
    });

    if (!response.data || !response.data.result) {
      return res.status(404).json(messages.notRes);
    }

    const data = {
      status: true,
      developer: dev,
      result: response.data.result,
    };

    res.json(data);
  } catch (e) {
    console.error("Error calling external API:", e.message);
    
    if (e.response) {
      res.status(500).json(messages.error);
    } else if (e.request) {
      res.status(503).json({ 
        status: 503, 
        developer: dev, 
        result: "External API request failed (timeout/unreachable)" 
      });
    } else {
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

// Downloader Routes (tetap sama)
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

// Tools Routes (tetap sama)
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

// UPLOADER ROUTES (VERSION FOR VERCEL - NO MULTER)
router.post("/upload/github", async (req, res) => {
  try {
    const { file, filename } = req.body;
    
    if (!file) {
      return res.status(400).json({
        status: false,
        developer: dev,
        result: "Please provide file data in base64 format!"
      });
    }

    // Handle base64 file data
    const base64Data = file.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const result = await uploadFile(buffer, filename);
    
    res.json({
      status: true,
      developer: dev,
      result: result
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      status: false,
      developer: dev,
      result: error.message
    });
  }
});

// Endpoint untuk upload via URL (tetap sama)
router.get("/upload/github", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json(messages.url);

  try {
    // Validasi URL
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json(messages.notUrl);
    }

    // Download file dari URL
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const buffer = Buffer.from(response.data);
    const result = await uploadFile(buffer);
    
    res.json({
      status: true,
      developer: dev,
      result: result
    });
  } catch (error) {
    console.error('Upload from URL error:', error);
    res.status(500).json({
      status: false,
      developer: dev,
      result: error.message
    });
  }
});

module.exports = router;
