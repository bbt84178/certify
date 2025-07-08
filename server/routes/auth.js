// routes/web3Auth.js
import express from 'express';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { authenticateWeb3Token, verifySignature } from '../middleware/Auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Configuration des tokens
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Fonction pour générer un nonce aléatoire
const generateNonce = () => {
  return Math.floor(Math.random() * 1000000).toString();
};

// Fonction pour générer le token JWT
const generateAccessToken = (walletAddress) => {
  return jwt.sign(
    { 
      walletAddress,
      type: 'access',
      timestamp: Date.now()
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// GET /api/auth/nonce/:walletAddress
// Récupérer le nonce pour une adresse wallet
router.get('/nonce/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    // Valider le format de l'adresse
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({ 
        error: 'Format d\'adresse wallet invalide' 
      });
    }

    // Générer un nouveau nonce
    const nonce = generateNonce();

    // Créer ou mettre à jour l'utilisateur
    const user = await prisma.user.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: { 
        nonce,
        updatedAt: new Date()
      },
      create: {
        walletAddress: walletAddress.toLowerCase(),
        nonce,
        isVerified: false
      }
    });

    res.json({
      nonce,
      message: `Connectez-vous à CertifiChain avec votre wallet.\n\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`
    });

  } catch (error) {
    console.error('Erreur lors de la génération du nonce:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la génération du nonce' 
    });
  }
});

// POST /api/auth/verify
// Vérifier la signature et connecter l'utilisateur
router.post('/verify', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ 
        error: 'Adresse wallet, signature et message requis' 
      });
    }

    // Valider le format de l'adresse
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({ 
        error: 'Format d\'adresse wallet invalide' 
      });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      include: {
        company: true
      }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé. Récupérez d\'abord un nonce.' 
      });
    }

    // Vérifier que le message contient le bon nonce
    if (!message.includes(user.nonce)) {
      return res.status(400).json({ 
        error: 'Nonce invalide dans le message' 
      });
    }

    // Vérifier la signature
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(401).json({ 
          error: 'Signature invalide',
          code: 'INVALID_SIGNATURE' 
        });
      }
    } catch (signatureError) {
      return res.status(401).json({ 
        error: 'Erreur lors de la vérification de la signature' 
      });
    }

    // Mettre à jour l'utilisateur comme vérifié
    const updatedUser = await prisma.user.update({
      where: { walletAddress: walletAddress.toLowerCase() },
      data: {
        isVerified: true,
        lastLogin: new Date(),
        nonce: generateNonce() // Générer un nouveau nonce pour la prochaine connexion
      },
      include: {
        company: true
      }
    });

    // Générer le token JWT
    const accessToken = generateAccessToken(walletAddress.toLowerCase());

    res.json({
      message: 'Connexion réussie',
      user: {
        id: updatedUser.id,
        walletAddress: updatedUser.walletAddress,
        email: updatedUser.email,
        isVerified: updatedUser.isVerified,
        lastLogin: updatedUser.lastLogin,
        company: updatedUser.company
      },
      accessToken
    });

  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la vérification' 
    });
  }
});

// POST /api/auth/refresh
// Rafraîchir le token (simple renouvellement)
router.post('/refresh', authenticateWeb3Token, async (req, res) => {
  try {
    // Générer un nouveau token
    const accessToken = generateAccessToken(req.user.walletAddress);

    // Mettre à jour le lastLogin
    await prisma.user.update({
      where: { walletAddress: req.user.walletAddress },
      data: { lastLogin: new Date() }
    });

    res.json({
      message: 'Token rafraîchi avec succès',
      accessToken
    });

  } catch (error) {
    console.error('Erreur lors du rafraîchissement:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors du rafraîchissement' 
    });
  }
});

// GET /api/auth/profile
// Récupérer le profil utilisateur
router.get('/profile', authenticateWeb3Token, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: req.user.walletAddress },
      include: {
        company: {
          include: {
            certificates: {
              take: 5,
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    res.json({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        email: user.email,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        company: user.company
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération du profil' 
    });
  }
});

// PUT /api/auth/profile
// Mettre à jour le profil utilisateur
router.put('/profile', authenticateWeb3Token, async (req, res) => {
  try {
    const { email } = req.body;

    // Validation de l'email si fourni
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        error: 'Format d\'email invalide' 
      });
    }

    // Vérifier si l'email n'est pas déjà utilisé
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser && existingUser.walletAddress !== req.user.walletAddress) {
        return res.status(409).json({ 
          error: 'Cet email est déjà utilisé' 
        });
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { walletAddress: req.user.walletAddress },
      data: {
        email: email || undefined,
        updatedAt: new Date()
      },
      include: {
        company: true
      }
    });

    res.json({
      message: 'Profil mis à jour avec succès',
      user: {
        id: updatedUser.id,
        walletAddress: updatedUser.walletAddress,
        email: updatedUser.email,
        isVerified: updatedUser.isVerified,
        lastLogin: updatedUser.lastLogin,
        company: updatedUser.company
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour du profil' 
    });
  }
});

// POST /api/auth/logout
// Déconnexion (principalement côté client)
router.post('/logout', authenticateWeb3Token, async (req, res) => {
  try {
    // Optionnel: mettre à jour des statistiques de déconnexion
    await prisma.user.update({
      where: { walletAddress: req.user.walletAddress },
      data: { updatedAt: new Date() }
    });

    res.json({ 
      message: 'Déconnexion réussie' 
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la déconnexion' 
    });
  }
});

export default router;