import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateWeb3Token } from '../middleware/Auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Create certificate record
router.post('/', authenticateWeb3Token, async (req, res) => {
  try {
    const {
      tokenId,
      certificateId,
      contractAddress,
      recipientAddress,
      recipientName,
      courseName,
      description,
      issueDate,
      ipfsHash,
      pdfHash,
      transactionHash,
      blockNumber,
      blockchain,
      isPublic,
      isSoulbound,
      metadata
    } = req.body;
    
    // Verify company ownership
    const company = await prisma.company.findFirst({
      where: { 
        owner: req.user.walletAddress,
        contractAddress: contractAddress.toLowerCase()
      }
    });
    
    if (!company) {
      return res.status(403).json({ error: 'Unauthorized contract access' });
    }
    
    const certificate = await prisma.certificate.create({
      data: {
        tokenId: parseInt(tokenId),
        certificateId,
        companyAddress: req.user.walletAddress,
        contractAddress: contractAddress.toLowerCase(),
        recipientAddress: recipientAddress.toLowerCase(),
        recipientName,
        courseName,
        description: description || '',
        issueDate: new Date(issueDate),
        ipfsHash,
        pdfHash: pdfHash || '',
        transactionHash: transactionHash.toLowerCase(),
        blockNumber: parseInt(blockNumber),
        blockchain,
        isPublic: isPublic || false,
        isSoulbound: isSoulbound !== false,
        metadata: JSON.stringify(metadata || {}),
        viewCount: 0,
        downloadCount: 0,
        isRevoked: false
      }
    });
    
    // Update company stats
    await prisma.company.update({
      where: { owner: req.user.walletAddress },
      data: {
        totalCertificates: { increment: 1 },
        monthlyIssued: { increment: 1 }
      }
    });
    
    res.json(certificate);
  } catch (error) {
    console.error('Create certificate error:', error);
    res.status(500).json({ error: 'Failed to create certificate' });
  }
});

// Get certificates for company
router.get('/company', authenticateWeb3Token, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = { companyAddress: req.user.walletAddress };
    
    if (search) {
      where.OR = [
        { recipientName: { contains: search, mode: 'insensitive' } },
        { courseName: { contains: search, mode: 'insensitive' } },
        { certificateId: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip
      }),
      prisma.certificate.count({ where })
    ]);
    
    res.json({
      certificates,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ error: 'Failed to get certificates' });
  }
});

// Get certificate by ID
router.get('/:certificateId', async (req, res) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { certificateId: req.params.certificateId },
      include: {
        company: {
          select: {
            name: true,
            logo: true,
            website: true
          }
        }
      }
    });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    // Increment view count
    await prisma.certificate.update({
      where: { certificateId: req.params.certificateId },
      data: { viewCount: { increment: 1 } }
    });
    
    res.json(certificate);
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ error: 'Failed to get certificate' });
  }
});

// Get certificates by recipient address
router.get('/recipient/:address', async (req, res) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { recipientAddress: req.params.address.toLowerCase() },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(certificates);
  } catch (error) {
    console.error('Get recipient certificates error:', error);
    res.status(500).json({ error: 'Failed to get certificates' });
  }
});

// Get public certificates
router.get('/public/gallery', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = { 
      isPublic: true, 
      isRevoked: false 
    };
    
    if (category && category !== 'all') {
      where.metadata = {
        contains: `"category":"${category}"`
      };
    }
    
    if (search) {
      where.OR = [
        { recipientName: { contains: search, mode: 'insensitive' } },
        { courseName: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip,
        include: {
          company: {
            select: {
              name: true,
              logo: true
            }
          }
        }
      }),
      prisma.certificate.count({ where })
    ]);
    
    res.json({
      certificates,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get public certificates error:', error);
    res.status(500).json({ error: 'Failed to get public certificates' });
  }
});

// Toggle certificate visibility
router.put('/:certificateId/visibility', authenticateWeb3Token, async (req, res) => {
  try {
    const certificate = await prisma.certificate.findFirst({
      where: { 
        certificateId: req.params.certificateId,
        companyAddress: req.user.walletAddress
      }
    });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    const updatedCertificate = await prisma.certificate.update({
      where: { certificateId: req.params.certificateId },
      data: { isPublic: !certificate.isPublic }
    });
    
    res.json({ success: true, isPublic: updatedCertificate.isPublic });
  } catch (error) {
    console.error('Toggle visibility error:', error);
    res.status(500).json({ error: 'Failed to toggle visibility' });
  }
});

// Increment download count
router.post('/:certificateId/download', async (req, res) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { certificateId: req.params.certificateId }
    });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    await prisma.certificate.update({
      where: { certificateId: req.params.certificateId },
      data: { downloadCount: { increment: 1 } }
    });
    
    // Update company stats
    await prisma.company.update({
      where: { owner: certificate.companyAddress },
      data: { totalDownloads: { increment: 1 } }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Download count error:', error);
    res.status(500).json({ error: 'Failed to update download count' });
  }
});

export default router;