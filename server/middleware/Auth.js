// middleware/Auth.js
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Middleware pour vérifier le token JWT Web3
export const authenticateWeb3Token = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Token d\'accès requis',
        code: 'NO_TOKEN' 
      });
    }

    // Vérifier le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier si l'utilisateur existe encore
    const user = await prisma.user.findUnique({
      where: { walletAddress: decoded.walletAddress },
      include: {
        company: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND' 
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({ 
        error: 'Wallet non vérifié',
        code: 'WALLET_NOT_VERIFIED' 
      });
    }

    // Ajouter les infos utilisateur à la requête
    req.user = user;
    req.walletAddress = user.walletAddress;
    req.company = user.company;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expiré',
        code: 'TOKEN_EXPIRED' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token invalide',
        code: 'INVALID_TOKEN' 
      });
    }

    console.error('Erreur d\'authentification:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur lors de l\'authentification' 
    });
  }
};

// Middleware pour vérifier si l'utilisateur possède une entreprise
export const requireCompany = (req, res, next) => {
  if (!req.user?.company) {
    return res.status(403).json({ 
      error: 'Entreprise requise. Veuillez créer une entreprise d\'abord.',
      code: 'COMPANY_REQUIRED' 
    });
  }

  if (!req.user.company.isActive) {
    return res.status(403).json({ 
      error: 'Entreprise désactivée',
      code: 'COMPANY_INACTIVE' 
    });
  }

  next();
};

// Middleware pour vérifier si l'entreprise est vérifiée
export const requireVerifiedCompany = (req, res, next) => {
  if (!req.user?.company?.isVerified) {
    return res.status(403).json({ 
      error: 'Entreprise non vérifiée',
      code: 'COMPANY_NOT_VERIFIED' 
    });
  }

  next();
};

// Middleware pour vérifier la propriété d'une entreprise
export const requireCompanyOwnership = (req, res, next) => {
  const companyAddress = req.params.companyAddress || req.body.companyAddress;
  
  if (!companyAddress) {
    return res.status(400).json({ 
      error: 'Adresse de l\'entreprise requise',
      code: 'COMPANY_ADDRESS_REQUIRED' 
    });
  }

  if (req.user.walletAddress !== companyAddress) {
    return res.status(403).json({ 
      error: 'Vous n\'êtes pas propriétaire de cette entreprise',
      code: 'NOT_COMPANY_OWNER' 
    });
  }

  next();
};

// Middleware pour vérifier la signature d'un message (optionnel)
export const verifySignature = async (req, res, next) => {
  try {
    const { message, signature, walletAddress } = req.body;

    if (!message || !signature || !walletAddress) {
      return res.status(400).json({ 
        error: 'Message, signature et adresse wallet requis' 
      });
    }

    // Vérifier la signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({ 
        error: 'Signature invalide',
        code: 'INVALID_SIGNATURE' 
      });
    }

    req.verifiedWallet = walletAddress;
    next();

  } catch (error) {
    console.error('Erreur de vérification de signature:', error);
    return res.status(401).json({ 
      error: 'Erreur lors de la vérification de la signature' 
    });
  }
};

// Middleware pour authentication optionnelle (pour les routes publiques)
export const optionalWeb3Auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { walletAddress: decoded.walletAddress },
        include: {
          company: true
        }
      });

      if (user && user.isVerified) {
        req.user = user;
        req.walletAddress = user.walletAddress;
        req.company = user.company;
      }
    }

    next();
  } catch (error) {
    // En cas d'erreur, on continue sans utilisateur
    next();
  }
};