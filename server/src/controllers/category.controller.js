// src/controllers/category.controller.js
import * as categoryService from '../services/category.service.js';
import { ok, created, error } from '../utils/response.js';

export async function createCategory(req, res) {
  try {
    // createdBy optional: if req.user exists later, pass req.user.id
    const created = await categoryService.createCategory({
      name: req.body.name,
      description: req.body.description,
      createdBy: req.body.createdBy ?? req.body.created_by ?? null
    });
    return created(res, { category: created });
  } catch (err) {
    return error(res, 400, err.message);
  }
}

export async function updateCategory(req, res) {
  try {
    const id = req.params.id;
    const updated = await categoryService.updateCategory(id, {
      name: req.body.name,
      description: req.body.description
    });
    return ok(res, { category: updated });
  } catch (err) {
    return error(res, 400, err.message);
  }
}

export async function deleteCategory(req, res) {
  try {
    const id = req.params.id;
    await categoryService.deleteCategory(id);
    return ok(res, { message: 'deleted' });
  } catch (err) {
    return error(res, 400, err.message);
  }
}

export async function getCategory(req, res) {
  try {
    const id = req.params.id;
    const cat = await categoryService.getCategoryById(id);
    if (!cat) return error(res, 404, 'Not found');
    return ok(res, { category: cat });
  } catch (err) {
    return error(res, 400, err.message);
  }
}

export async function listCategories(req, res) {
  try {
    const q = req.query.q;
    const limit = req.query.limit ?? 50;
    const offset = req.query.offset ?? 0;
    const items = await categoryService.listCategories({ q, limit, offset });
    return ok(res, { items });
  } catch (err) {
    return error(res, 400, err.message);
  }
}
