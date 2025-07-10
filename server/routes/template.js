// server/routes/template.js
import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/templates - Récupérer tous les templates de l'entreprise
router.get('/', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    const templates = await prisma.template.findMany({
      where: {
        companyId: companyId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      templates,
      count: templates.length
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des templates' 
    });
  }
});

// POST /api/templates - Créer un nouveau template
router.post('/', async (req, res) => {
  try {
    const { name, description, fields, design } = req.body;
    const companyId = req.user.companyId;

    if (!name || !fields) {
      return res.status(400).json({ 
        error: 'Le nom et les champs sont requis' 
      });
    }

    const template = await prisma.template.create({
      data: {
        name,
        description,
        fields: typeof fields === 'string' ? fields : JSON.stringify(fields),
        design: typeof design === 'string' ? design : JSON.stringify(design),
        companyId,
        createdBy: req.user.walletAddress
      }
    });

    res.status(201).json({
      message: 'Template créé avec succès',
      template
    });

  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création du template' 
    });
  }
});

// GET /api/templates/:id - Récupérer un template spécifique
router.get('/:id', async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const companyId = req.user.companyId;

    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
        companyId: companyId
      }
    });

    if (!template) {
      return res.status(404).json({ 
        error: 'Template non trouvé' 
      });
    }

    res.json(template);

  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération du template' 
    });
  }
});

// PUT /api/templates/:id - Mettre à jour un template
router.put('/:id', async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const { name, description, fields, design } = req.body;
    const companyId = req.user.companyId;

    // Vérifier que le template appartient à l'entreprise
    const existingTemplate = await prisma.template.findFirst({
      where: {
        id: templateId,
        companyId: companyId
      }
    });

    if (!existingTemplate) {
      return res.status(404).json({ 
        error: 'Template non trouvé' 
      });
    }

    const updatedTemplate = await prisma.template.update({
      where: {
        id: templateId
      },
      data: {
        name: name || existingTemplate.name,
        description: description || existingTemplate.description,
        fields: fields ? (typeof fields === 'string' ? fields : JSON.stringify(fields)) : existingTemplate.fields,
        design: design ? (typeof design === 'string' ? design : JSON.stringify(design)) : existingTemplate.design,
        updatedAt: new Date()
      }
    });

    res.json({
      message: 'Template mis à jour avec succès',
      template: updatedTemplate
    });

  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour du template' 
    });
  }
});

// DELETE /api/templates/:id - Supprimer un template
router.delete('/:id', async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const companyId = req.user.companyId;

    // Vérifier que le template appartient à l'entreprise
    const existingTemplate = await prisma.template.findFirst({
      where: {
        id: templateId,
        companyId: companyId
      }
    });

    if (!existingTemplate) {
      return res.status(404).json({ 
        error: 'Template non trouvé' 
      });
    }

    // Vérifier si le template est utilisé par des certificats
    const certificateCount = await prisma.certificate.count({
      where: {
        templateId: templateId
      }
    });

    if (certificateCount > 0) {
      return res.status(400).json({ 
        error: `Impossible de supprimer ce template car il est utilisé par ${certificateCount} certificat(s)` 
      });
    }

    await prisma.template.delete({
      where: {
        id: templateId
      }
    });

    res.json({
      message: 'Template supprimé avec succès'
    });

  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du template' 
    });
  }
});

// POST /api/templates/:id/duplicate - Dupliquer un template
router.post('/:id/duplicate', async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const companyId = req.user.companyId;

    const originalTemplate = await prisma.template.findFirst({
      where: {
        id: templateId,
        companyId: companyId
      }
    });

    if (!originalTemplate) {
      return res.status(404).json({ 
        error: 'Template non trouvé' 
      });
    }

    const duplicatedTemplate = await prisma.template.create({
      data: {
        name: `${originalTemplate.name} (Copie)`,
        description: originalTemplate.description,
        fields: originalTemplate.fields,
        design: originalTemplate.design,
        companyId,
        createdBy: req.user.walletAddress
      }
    });

    res.status(201).json({
      message: 'Template dupliqué avec succès',
      template: duplicatedTemplate
    });

  } catch (error) {
    console.error('Error duplicating template:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la duplication du template' 
    });
  }
});

export default router;