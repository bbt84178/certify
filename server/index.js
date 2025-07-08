// server.js - Enhanced version with security & performance improvements
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { Web3Storage } from 'web3.storage';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import winston from 'winston';
import csurf from 'csurf';

// Import middleware Web3
import { 
  authenticateWeb3Token, 
  requireCompany, 
  requireVerifiedCompany,
  requireCompanyOwnership,
  optionalWeb3Auth 
} from './middleware/Auth.js';

// Import routes
import web3AuthRoutes from './routes/auth.js';
import companyRoutes from './routes/company.js';
import certificateRoutes from './routes/certificate.js';
import ipfsRoutes from './routes/ipfs.js';
import contractRoutes from './routes/contract.js';
import templateRoutes from './routes/template.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Enhanced logging configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});
// app.use(csurf({ cookie: true })); // Désactivé temporairement pour les tests

// Validation des variables d'environnement
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error(`Variables d'environnement manquantes: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

if (!process.env.WEB3_STORAGE_TOKEN) {
  logger.warn('WEB3_STORAGE_TOKEN manquant - fonctionnalités IPFS limitées');
}

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.web3.storage"]
    }
  }
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // More restrictive for sensitive operations
  message: {
    error: 'Trop de tentatives, veuillez réessayer plus tard.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

app.use('/api/', limiter);
app.use('/api/auth/', strictLimiter);
app.use('/api/upload/', strictLimiter);

// Replace your existing corsOptions in server.js
const corsOptions = {
  origin: function (origin, callback) {
    // Log the origin for debugging
    console.log('🌐 CORS Check - Origin:', origin);
    
    if (process.env.NODE_ENV === 'development') {
      // In development, allow all localhost origins
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        console.log('✅ CORS Allowed - Development mode');
        return callback(null, true);
      }
    }
    
    // Production origins
    const allowedOrigins = process.env.FRONTEND_URL?.split(',').map(url => url.trim()) || [];
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS Allowed - Production whitelist');
      return callback(null, true);
    }
    
    console.log('❌ CORS Blocked - Origin not allowed:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Wallet-Address',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS
app.use(cors(corsOptions));

// Add explicit preflight handler for upload endpoint
app.options('/api/ipfs/upload', (req, res) => {
  console.log('🔄 Preflight request for /api/ipfs/upload');
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Wallet-Address');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).send();
});

// Handle CORS errors
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    logger.error('CORS Error:', {
      origin: req.headers.origin,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(403).json({
      error: 'CORS policy violation',
      message: 'Origin not allowed',
      origin: req.headers.origin,
      code: 'CORS_ERROR'
    });
  }
  next(err);
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Reduced from 50mb
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const walletAddress = req.headers['x-wallet-address'] || 'anonymous';
  
  // Log request
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    walletAddress: walletAddress.substring(0, 10) + '...',
    ip: req.ip
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      walletAddress: walletAddress.substring(0, 10) + '...'
    });
  });

  next();
});

// Enhanced file upload middleware
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Only one file at a time
    fieldSize: 1024 * 1024 // 1MB field size limit
  },
  fileFilter: (req, file, cb) => {
    // Enhanced file type validation
    const allowedTypes = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
      'application/json': ['.json']
    };
    
    const isValidType = Object.keys(allowedTypes).includes(file.mimetype);
    const hasValidExtension = allowedTypes[file.mimetype]?.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    if (isValidType && hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`), false);
    }
  }
});

// Database connection with retry logic
async function connectDatabase(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`; // Test query
      logger.info('✅ Connected to database via Prisma');
      return;
    } catch (error) {
      logger.error(`❌ Database connection attempt ${i + 1} failed:`, error);
      if (i === retries - 1) {
        logger.error('❌ All database connection attempts failed');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
}

await connectDatabase();

// Routes publiques
app.use('/api/auth', web3AuthRoutes);

// Routes protégées - Utilisateur connecté requis
app.get('/api/user', authenticateWeb3Token, (req, res) => {
  res.json({
    message: 'Accès utilisateur autorisé',
    user: {
      walletAddress: req.user.walletAddress,
      isVerified: req.user.isVerified,
      company: req.user.company ? {
        id: req.user.company.id,
        name: req.user.company.name,
        isVerified: req.user.company.isVerified
      } : null
    },
    timestamp: new Date().toISOString()
  });
});

// Routes protégées - Entreprise requise
app.use('/api/company', authenticateWeb3Token, requireCompany, companyRoutes);
app.use('/api/templates', authenticateWeb3Token, requireCompany, templateRoutes);

// Routes protégées - Certificats
app.use('/api/certificates', authenticateWeb3Token, certificateRoutes);

// Routes avec authentification optionnelle (pour affichage public)
app.use('/api/public/certificates', optionalWeb3Auth, certificateRoutes);
app.use('/api/ipfs', optionalWeb3Auth, ipfsRoutes);

// Routes protégées - Contrats intelligents
app.use('/api/contracts', authenticateWeb3Token, requireCompany, contractRoutes);

// Routes admin - Entreprise vérifiée requise
app.use('/api/admin/certificates', 
  authenticateWeb3Token, 
  requireCompany, 
  requireVerifiedCompany, 
  certificateRoutes
);

// Enhanced file upload with virus scanning preparation
app.post('/api/upload', 
  authenticateWeb3Token, 
  upload.single('file'), 
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      // File validation
      if (req.file.size === 0) {
        return res.status(400).json({ error: 'Fichier vide' });
      }

      // Optional: Basic file header validation
      const fileHeader = req.file.buffer.subarray(0, 4);
      const isValidFile = validateFileHeader(fileHeader, req.file.mimetype);
      
      if (!isValidFile) {
        return res.status(400).json({ error: 'Fichier corrompu ou type invalide' });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}_${req.file.originalname}`;

      // Upload to IPFS
      let ipfsHash = null;
      if (process.env.WEB3_STORAGE_TOKEN) {
        try {
          const client = new Web3Storage({ token: process.env.WEB3_STORAGE_TOKEN });
          const file = new File([req.file.buffer], uniqueFilename, {
            type: req.file.mimetype
          });
          ipfsHash = await client.put([file]);
          logger.info('File uploaded to IPFS', { 
            filename: uniqueFilename, 
            ipfsHash,
            size: req.file.size 
          });
        } catch (ipfsError) {
          logger.error('IPFS upload error:', ipfsError);
          return res.status(500).json({ error: 'Erreur lors de l\'upload IPFS' });
        }
      }

      // Save file metadata to database
      const fileRecord = await prisma.fileUpload.create({
        data: {
          originalName: req.file.originalname,
          filename: uniqueFilename,
          size: req.file.size,
          mimetype: req.file.mimetype,
          ipfsHash,
          uploadedBy: req.user.walletAddress,
          userId: req.user.id
        }
      });

      res.json({
        message: 'Fichier uploadé avec succès',
        file: {
          id: fileRecord.id,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          ipfsHash,
          uploadedAt: fileRecord.createdAt
        },
        uploadedBy: req.user.walletAddress
      });

    } catch (error) {
      logger.error('Upload error:', error);
      res.status(500).json({ 
        error: 'Erreur lors de l\'upload',
        code: 'UPLOAD_ERROR'
      });
    }
  }
);

// Helper function for file header validation
function validateFileHeader(header, mimetype) {
  const signatures = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46, 0x38],
    'application/pdf': [0x25, 0x50, 0x44, 0x46]
  };

  const signature = signatures[mimetype];
  if (!signature) return true; // Allow unknown types for now

  return signature.every((byte, index) => header[index] === byte);
}

// Enhanced health check
app.get('/api/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbTime = Date.now() - startTime;
    
    // Get system statistics
    const [userCount, companyCount, certificateCount, verifiedCompanies] = await Promise.all([
      prisma.user.count(),
      prisma.company.count(),
      prisma.certificate.count(),
      prisma.company.count({ where: { isVerified: true } })
    ]);

    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    res.json({ 
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'connected',
        responseTime: `${dbTime}ms`,
        statistics: {
          users: userCount,
          companies: companyCount,
          certificates: certificateCount,
          verifiedCompanies
        }
      },
      system: {
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
        },
        cpu: {
          user: Math.round(cpuUsage.user / 1000) + ' μs',
          system: Math.round(cpuUsage.system / 1000) + ' μs'
        }
      },
      blockchain: {
        networks: ['ethereum', 'sepolia', 'polygon'],
        web3Storage: !!process.env.WEB3_STORAGE_TOKEN,
        ipfsGateway: process.env.IPFS_GATEWAY || 'https://ipfs.io'
      }
    });

  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({ 
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enhanced public statistics
app.get('/api/stats', async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalCompanies,
      totalCertificates,
      verifiedCompanies,
      publicCertificates,
      monthlyStats,
      weeklyStats,
      recentActivity
    ] = await Promise.all([
      prisma.user.count(),
      prisma.company.count(),
      prisma.certificate.count(),
      prisma.company.count({ where: { isVerified: true } }),
      prisma.certificate.count({ where: { isPublic: true } }),
      prisma.certificate.count({
        where: { createdAt: { gte: lastMonth } }
      }),
      prisma.certificate.count({
        where: { createdAt: { gte: lastWeek } }
      }),
      prisma.certificate.findMany({
        where: { isPublic: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          company: {
            select: { name: true, isVerified: true }
          }
        }
      })
    ]);

    res.json({
      overview: {
        totalUsers,
        totalCompanies,
        totalCertificates,
        verifiedCompanies,
        publicCertificates
      },
      activity: {
        monthlyIssued: monthlyStats,
        weeklyIssued: weeklyStats,
        recent: recentActivity
      },
      growth: {
        verificationRate: totalCompanies > 0 ? (verifiedCompanies / totalCompanies * 100).toFixed(1) : 0,
        publicRate: totalCertificates > 0 ? (publicCertificates / totalCertificates * 100).toFixed(1) : 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Stats error:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques',
      code: 'STATS_ERROR'
    });
  }
});

// Enhanced error handling middleware
app.use((error, req, res, next) => {
  const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  logger.error('Server error', {
    errorId,
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    walletAddress: req.user?.walletAddress
  });
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      error: 'Token invalide',
      code: 'INVALID_TOKEN',
      errorId
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      error: 'Token expiré',
      code: 'TOKEN_EXPIRED',
      errorId
    });
  }

  // Multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      error: 'Fichier trop volumineux (max 10MB)',
      code: 'FILE_TOO_LARGE',
      errorId
    });
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ 
      error: 'Trop de fichiers (max 1)',
      code: 'TOO_MANY_FILES',
      errorId
    });
  }

  // Prisma errors
  if (error.code === 'P2002') {
    return res.status(409).json({ 
      error: 'Conflit de données - enregistrement déjà existant',
      field: error.meta?.target,
      code: 'DUPLICATE_ENTRY',
      errorId
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({ 
      error: 'Ressource non trouvée',
      code: 'NOT_FOUND',
      errorId
    });
  }

  // Generic server error
  res.status(500).json({ 
    error: 'Erreur serveur interne',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue',
    code: error.code || 'INTERNAL_ERROR',
    errorId
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Enhanced cleanup with more comprehensive data management
const cleanupOldData = async () => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Clean up unverified users older than 24 hours
    const cleanedUsers = await prisma.user.updateMany({
      where: {
        isVerified: false,
        createdAt: { lt: oneDayAgo }
      },
      data: {
        nonce: Math.floor(Math.random() * 1000000).toString()
      }
    });

    // Clean up temporary files older than 1 week
    const cleanedFiles = await prisma.fileUpload.deleteMany({
      where: {
        isTemporary: true,
        createdAt: { lt: oneWeekAgo }
      }
    });

    logger.info('Periodic cleanup completed', {
      usersUpdated: cleanedUsers.count,
      filesDeleted: cleanedFiles.count
    });

  } catch (error) {
    logger.error('Cleanup error:', error);
  }
};

// Run cleanup every 6 hours
setInterval(cleanupOldData, 6 * 60 * 60 * 1000);

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`🔄 Received ${signal}. Shutting down gracefully...`);
  
  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close database connection
  await prisma.$disconnect();
  logger.info('Database connection closed');

  // Close logging
  logger.end();
  
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    cors: corsOptions.origin,
    features: {
      web3Storage: !!process.env.WEB3_STORAGE_TOKEN,
      rateLimit: true,
      compression: true,
      security: true
    }
  });
});

export default app;