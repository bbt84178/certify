import express from 'express';
import { PrismaClient } from '@prisma/client';
//import { authenticateWeb3Token } from '../middleware/Auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get company profile
router.get('/profile', authenticateWeb3Token, async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { owner: req.user.walletAddress }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(company);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Failed to get company' });
  }
});

// Create or update company profile
router.post('/profile', authenticateWeb3Token, async (req, res) => {
  try {
    const {
      name,
      description,
      website,
      email,
      industry,
      country,
      logo,
      blockchain
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Company name is required' });
    }
    
    const existingCompany = await prisma.company.findUnique({
      where: { owner: req.user.walletAddress }
    });
    
    let company;
    
    if (existingCompany) {
      // Update existing company
      company = await prisma.company.update({
        where: { owner: req.user.walletAddress },
        data: {
          name,
          description: description || existingCompany.description,
          website: website || existingCompany.website,
          email: email || existingCompany.email,
          industry: industry || existingCompany.industry,
          country: country || existingCompany.country,
          logo: logo || existingCompany.logo,
          blockchain: blockchain || existingCompany.blockchain
        }
      });
    } else {
      // Create new company
      company = await prisma.company.create({
        data: {
          owner: req.user.walletAddress,
          name,
          description: description || '',
          website: website || '',
          email: email || '',
          industry: industry || '',
          country: country || '',
          logo: logo || '',
          blockchain: blockchain || 'ethereum',
          totalCertificates: 0,
          activeCertificates: 0,
          totalDownloads: 0,
          monthlyIssued: 0
        }
      });
    }
    
    res.json(company);
  } catch (error) {
    console.error('Save company error:', error);
    res.status(500).json({ error: 'Failed to save company' });
  }
});

// Update company settings
router.put('/settings', authenticateWeb3Token, async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { owner: req.user.walletAddress }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const { settings } = req.body;
    
    const updatedCompany = await prisma.company.update({
      where: { owner: req.user.walletAddress },
      data: {
        settings: JSON.stringify({ ...JSON.parse(company.settings || '{}'), ...settings })
      }
    });
    
    res.json(updatedCompany);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get company stats
router.get('/stats', authenticateWeb3Token, async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { owner: req.user.walletAddress }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const stats = {
      totalCertificates: company.totalCertificates,
      activeCertificates: company.activeCertificates,
      totalDownloads: company.totalDownloads,
      monthlyIssued: company.monthlyIssued
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Set contract address after deployment
router.post('/contract', authenticateWeb3Token, async (req, res) => {
  try {
    const { contractAddress, transactionHash } = req.body;
    
    if (!contractAddress) {
      return res.status(400).json({ error: 'Contract address is required' });
    }
    
    const company = await prisma.company.findUnique({
      where: { owner: req.user.walletAddress }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const updatedCompany = await prisma.company.update({
      where: { owner: req.user.walletAddress },
      data: {
        contractAddress: contractAddress.toLowerCase()
      }
    });
    
    res.json({ 
      success: true, 
      contractAddress: updatedCompany.contractAddress,
      transactionHash 
    });
  } catch (error) {
    console.error('Set contract error:', error);
    res.status(500).json({ error: 'Failed to set contract address' });
  }
});

export default router;