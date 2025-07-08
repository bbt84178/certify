import express from 'express';
import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { authenticateWeb3Token } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Contract ABIs
const FACTORY_ABI = [
  "function registerCompany(string memory _name, string memory _description, string memory _symbol) external",
  "function getCompany(address _owner) external view returns (tuple(address owner, address contractAddress, string name, string description, uint256 createdAt, bool isActive))",
  "function getCompanyContract(address _owner) external view returns (address)",
  "event CompanyRegistered(address indexed owner, address indexed contractAddress, string name)"
];

const CERTIFICATE_ABI = [
  "function issueCertificate(address _recipient, string memory _recipientName, string memory _courseName, string memory _ipfsHash, bool _isPublic, bool _isSoulbound) external returns (uint256)",
  "function getCertificate(uint256 _tokenId) external view returns (tuple(uint256 tokenId, address recipient, string recipientName, string courseName, string ipfsHash, uint256 issueDate, bool isPublic, bool isSoulbound))",
  "function totalSupply() external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "event CertificateIssued(uint256 indexed tokenId, address indexed recipient, string recipientName, string courseName, string ipfsHash, bool isPublic, bool isSoulbound)"
];

// Get blockchain provider
const getProvider = (blockchain) => {
  switch (blockchain) {
    case 'ethereum':
      return new ethers.providers.InfuraProvider('mainnet', process.env.INFURA_PROJECT_ID);
    case 'sepolia':
      return new ethers.providers.InfuraProvider('sepolia', process.env.INFURA_PROJECT_ID);
    case 'bsc':
      return new ethers.providers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
    case 'bscTestnet':
      return new ethers.providers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/');
    case 'polygon':
      return new ethers.providers.JsonRpcProvider(`https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);
    case 'polygonMumbai':
      return new ethers.providers.JsonRpcProvider(`https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);
    default:
      throw new Error('Unsupported blockchain');
  }
};

// Deploy company contract
router.post('/deploy', authenticateWeb3Token, async (req, res) => {
  try {
    const { companyName, description, symbol, blockchain } = req.body;
    
    if (!companyName || !symbol || !blockchain) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if company already has a contract
    const existingCompany = await prisma.company.findUnique({
      where: { owner: req.user.walletAddress }
    });
    
    if (existingCompany && existingCompany.contractAddress) {
      return res.status(400).json({ error: 'Company already has a deployed contract' });
    }
    
    const provider = getProvider(blockchain);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    // Get factory contract address based on blockchain
    const factoryAddress = process.env.FACTORY_CONTRACT_ADDRESS;
    if (!factoryAddress) {
      return res.status(500).json({ error: 'Factory contract not deployed' });
    }
    
    const factoryContract = new ethers.Contract(factoryAddress, FACTORY_ABI, wallet);
    
    // Estimate gas
    const gasEstimate = await factoryContract.estimateGas.registerCompany(
      companyName,
      description || '',
      symbol
    );
    
    // Add 20% buffer to gas estimate
    const gasLimit = gasEstimate.mul(120).div(100);
    
    // Execute transaction
    const tx = await factoryContract.registerCompany(
      companyName,
      description || '',
      symbol,
      { gasLimit }
    );
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    // Find the CompanyRegistered event
    const event = receipt.events?.find(e => e.event === 'CompanyRegistered');
    const contractAddress = event?.args?.contractAddress;
    
    if (!contractAddress) {
      throw new Error('Failed to get contract address from event');
    }
    
    // Update company record
    if (existingCompany) {
      await prisma.company.update({
        where: { owner: req.user.walletAddress },
        data: {
          contractAddress: contractAddress.toLowerCase(),
          blockchain: blockchain
        }
      });
    } else {
      await prisma.company.create({
        data: {
          owner: req.user.walletAddress,
          name: companyName,
          description: description || '',
          contractAddress: contractAddress.toLowerCase(),
          blockchain,
          totalCertificates: 0,
          activeCertificates: 0,
          totalDownloads: 0,
          monthlyIssued: 0
        }
      });
    }
    
    res.json({
      success: true,
      contractAddress: contractAddress.toLowerCase(),
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    });
  } catch (error) {
    console.error('Contract deployment error:', error);
    res.status(500).json({ 
      error: 'Failed to deploy contract',
      details: error.message 
    });
  }
});

// Issue certificate on blockchain
router.post('/issue-certificate', authenticateWeb3Token, async (req, res) => {
  try {
    const {
      recipientAddress,
      recipientName,
      courseName,
      ipfsHash,
      isPublic,
      isSoulbound
    } = req.body;
    
    if (!recipientAddress || !recipientName || !courseName || !ipfsHash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get company contract
    const company = await prisma.company.findUnique({
      where: { owner: req.user.walletAddress }
    });
    
    if (!company || !company.contractAddress) {
      return res.status(404).json({ error: 'Company contract not found' });
    }
    
    const provider = getProvider(company.blockchain);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const certificateContract = new ethers.Contract(
      company.contractAddress,
      CERTIFICATE_ABI,
      wallet
    );
    
    // Estimate gas
    const gasEstimate = await certificateContract.estimateGas.issueCertificate(
      recipientAddress,
      recipientName,
      courseName,
      ipfsHash,
      isPublic || false,
      isSoulbound !== false
    );
    
    // Add 20% buffer to gas estimate
    const gasLimit = gasEstimate.mul(120).div(100);
    
    // Execute transaction
    const tx = await certificateContract.issueCertificate(
      recipientAddress,
      recipientName,
      courseName,
      ipfsHash,
      isPublic || false,
      isSoulbound !== false,
      { gasLimit }
    );
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    // Find the CertificateIssued event
    const event = receipt.events?.find(e => e.event === 'CertificateIssued');
    const tokenId = event?.args?.tokenId;
    
    if (tokenId === undefined) {
      throw new Error('Failed to get token ID from event');
    }
    
    res.json({
      success: true,
      tokenId: tokenId.toString(),
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      contractAddress: company.contractAddress
    });
  } catch (error) {
    console.error('Certificate issuance error:', error);
    res.status(500).json({ 
      error: 'Failed to issue certificate',
      details: error.message 
    });
  }
});

// Get certificate from blockchain
router.get('/certificate/:contractAddress/:tokenId', async (req, res) => {
  try {
    const { contractAddress, tokenId } = req.params;
    
    // Find company to get blockchain info
    const company = await prisma.company.findUnique({
      where: { contractAddress: contractAddress.toLowerCase() }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    const provider = getProvider(company.blockchain);
    const certificateContract = new ethers.Contract(
      contractAddress,
      CERTIFICATE_ABI,
      provider
    );
    
    // Get certificate data
    const certificate = await certificateContract.getCertificate(tokenId);
    const tokenURI = await certificateContract.tokenURI(tokenId);
    
    res.json({
      tokenId: certificate.tokenId.toString(),
      recipient: certificate.recipient,
      recipientName: certificate.recipientName,
      courseName: certificate.courseName,
      ipfsHash: certificate.ipfsHash,
      issueDate: new Date(certificate.issueDate.toNumber() * 1000).toISOString(),
      isPublic: certificate.isPublic,
      isSoulbound: certificate.isSoulbound,
      tokenURI,
      contractAddress,
      blockchain: company.blockchain
    });
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ 
      error: 'Failed to get certificate from blockchain',
      details: error.message 
    });
  }
});

// Get contract info
router.get('/info/:contractAddress', async (req, res) => {
  try {
    const { contractAddress } = req.params;
    
    const company = await prisma.company.findUnique({
      where: { contractAddress: contractAddress.toLowerCase() }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    const provider = getProvider(company.blockchain);
    const certificateContract = new ethers.Contract(
      contractAddress,
      CERTIFICATE_ABI,
      provider
    );
    
    const totalSupply = await certificateContract.totalSupply();
    
    res.json({
      contractAddress,
      blockchain: company.blockchain,
      totalSupply: totalSupply.toString(),
      company: {
        name: company.name,
        description: company.description,
        owner: company.owner
      }
    });
  } catch (error) {
    console.error('Get contract info error:', error);
    res.status(500).json({ 
      error: 'Failed to get contract info',
      details: error.message 
    });
  }
});

export default router;