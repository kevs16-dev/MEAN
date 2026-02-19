const categoryService = require('../service/category.service');

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await categoryService.getAllCategories();
        res.status(200).json({ categories });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Erreur lors de la récupération des catégories' });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const categoryData = req.body;
        categoryData.createdBy = req.user.id;

        if (!req.body.name || !req.body.slug) {
            return res.status(400).json({ message: 'Nom et slug sont obligatoires' });
        }

        const category = await categoryService.createCategory(categoryData);
        res.status(201).json({ message: 'Catégorie créée avec succès', category });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Le nom ou le slug de la catégorie existe déjà' });
        }
        
        res.status(500).json({ message: error.message || 'Erreur lors de la création de la catégorie' });
    }
};