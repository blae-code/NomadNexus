import express from 'express';
import models from '../models/index.js';

const router = express.Router();

// Generic CRUD routes for a model
const addCrudRoutes = (modelName, model) => {
  // Get all
  router.get(`/${modelName}`, async (req, res) => {
    const items = await model.findAll();
    res.json(items);
  });

  // Get one
  router.get(`/${modelName}/:id`, async (req, res) => {
    const item = await model.findByPk(req.params.id);
    res.json(item);
  });

  // Create
  router.post(`/${modelName}`, async (req, res) => {
    const item = await model.create(req.body);
    res.json(item);
  });

  // Update
  router.put(`/${modelName}/:id`, async (req, res) => {
    await model.update(req.body, { where: { id: req.params.id } });
    const item = await model.findByPk(req.params.id);
    res.json(item);
  });

  // Delete
  router.delete(`/${modelName}/:id`, async (req, res) => {
    await model.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  });
};

// Add CRUD routes for all models
for (const modelName in models) {
  addCrudRoutes(modelName.toLowerCase(), models[modelName]);
}

export default router;
