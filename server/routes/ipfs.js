import express from 'express';
import { Web3Storage } from 'web3.storage';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, and JSON files
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf', 'application/json'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and JSON files are allowed'), false);
    }
  }
});

// Initialize Web3.Storage client
const getWeb3StorageClient = () => {
  const token = process.env.WEB3_STORAGE_TOKEN;
  if (!token) {
    throw new Error('Web3.Storage token not configured');
  }
  return new Web3Storage({ token });
};

// Upload file to IPFS
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('📁 IPFS upload request:', {
      hasFile: !!req.file,
      filename: req.file?.originalname,
      size: req.file?.size,
      mimetype: req.file?.mimetype,
      user: req.user?.walletAddress
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const client = getWeb3StorageClient();
    
    // Create a File object from the buffer
    const file = new File([req.file.buffer], req.file.originalname, {
      type: req.file.mimetype
    });
    
    // Upload to IPFS
    const cid = await client.put([file], {
      name: req.file.originalname,
      maxRetries: 3
    });
    
    const ipfsUrl = `https://${cid}.ipfs.w3s.link/${req.file.originalname}`;
    
    console.log('✅ IPFS upload successful:', { cid, url: ipfsUrl });
    
    res.json({
      success: true,
      cid: cid,
      url: ipfsUrl,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('❌ IPFS upload error:', error);
    res.status(500).json({ error: 'Failed to upload to IPFS' });
  }
});

// Upload JSON metadata to IPFS
router.post('/upload-json', async (req, res) => {
  try {
    const { metadata, filename } = req.body;
    
    console.log('📄 IPFS JSON upload:', { filename, hasMetadata: !!metadata });
    
    if (!metadata) {
      return res.status(400).json({ error: 'No metadata provided' });
    }
    
    const client = getWeb3StorageClient();
    
    // Create a File object from JSON
    const jsonString = JSON.stringify(metadata, null, 2);
    const file = new File([jsonString], filename || 'metadata.json', {
      type: 'application/json'
    });
    
    // Upload to IPFS
    const cid = await client.put([file], {
      name: filename || 'metadata.json',
      maxRetries: 3
    });
    
    const ipfsUrl = `https://${cid}.ipfs.w3s.link/${filename || 'metadata.json'}`;
    
    console.log('✅ IPFS JSON upload successful:', { cid, url: ipfsUrl });
    
    res.json({
      success: true,
      cid: cid,
      url: ipfsUrl,
      filename: filename || 'metadata.json'
    });
  } catch (error) {
    console.error('❌ IPFS JSON upload error:', error);
    res.status(500).json({ error: 'Failed to upload JSON to IPFS' });
  }
});

// Upload certificate PDF to IPFS
router.post('/upload-certificate', async (req, res) => {
  try {
    const { pdfData, certificateId, recipientName } = req.body;
    
    console.log('📜 IPFS certificate upload:', { certificateId, recipientName });
    
    if (!pdfData) {
      return res.status(400).json({ error: 'No PDF data provided' });
    }
    
    const client = getWeb3StorageClient();
    
    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfData.split(',')[1], 'base64');
    const filename = `certificate-${certificateId}.pdf`;
    
    // Create a File object
    const file = new File([pdfBuffer], filename, {
      type: 'application/pdf'
    });
    
    // Upload PDF
    const pdfCid = await client.put([file], {
      name: filename,
      maxRetries: 3
    });
    
    const pdfUrl = `https://${pdfCid}.ipfs.w3s.link/${filename}`;
    
    // Create metadata
    const metadata = {
      name: `Certificate for ${recipientName}`,
      description: `Digital certificate issued to ${recipientName}`,
      image: pdfUrl,
      external_url: pdfUrl,
      attributes: [
        {
          trait_type: "Certificate ID",
          value: certificateId
        },
        {
          trait_type: "Recipient",
          value: recipientName
        },
        {
          trait_type: "Issue Date",
          value: new Date().toISOString()
        }
      ]
    };
    
    // Upload metadata
    const metadataFile = new File([JSON.stringify(metadata, null, 2)], 'metadata.json', {
      type: 'application/json'
    });
    
    const metadataCid = await client.put([metadataFile], {
      name: 'metadata.json',
      maxRetries: 3
    });
    
    const metadataUrl = `https://${metadataCid}.ipfs.w3s.link/metadata.json`;
    
    console.log('✅ Certificate upload successful:', { pdfCid, metadataCid });
    
    res.json({
      success: true,
      pdfCid: pdfCid,
      metadataCid: metadataCid,
      pdfUrl: pdfUrl,
      metadataUrl: metadataUrl,
      filename
    });
  } catch (error) {
    console.error('❌ Certificate upload error:', error);
    res.status(500).json({ error: 'Failed to upload certificate to IPFS' });
  }
});

// Get file from IPFS
router.get('/file/:cid/:filename?', async (req, res) => {
  try {
    const { cid, filename } = req.params;
    const url = filename 
      ? `https://${cid}.ipfs.w3s.link/${filename}`
      : `https://${cid}.ipfs.w3s.link`;
    
    res.redirect(url);
  } catch (error) {
    console.error('❌ IPFS file access error:', error);
    res.status(500).json({ error: 'Failed to access IPFS file' });
  }
});

export default router;