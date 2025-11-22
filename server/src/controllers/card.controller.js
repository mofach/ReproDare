// src/controllers/card.controller.js
import * as cardService from '../services/card.service.js';
import { ok, created, error } from '../utils/response.js';

export async function createCard(req, res) {
  try {
    const payload = {
      categoryId: req.body.categoryId,
      type: req.body.type,
      content: req.body.content,
      createdBy: req.user.id
    };
    const card = await cardService.createCard(payload);
    return created(res, { card });
  } catch (err) {
    return error(res, 400, err.message);
  }
}

export async function updateCard(req, res) {
  try {
    const id = req.params.id;
    const updated = await cardService.updateCard(id, {
      type: req.body.type,
      content: req.body.content,
      categoryId: req.body.categoryId
    });
    return ok(res, { card: updated });
  } catch (err) {
    return error(res, 400, err.message);
  }
}

export async function deleteCard(req, res) {
  try {
    const id = req.params.id;
    await cardService.deleteCard(id);
    return ok(res, { message: 'deleted' });
  } catch (err) {
    return error(res, 400, err.message);
  }
}

export async function getCard(req, res) {
  try {
    const id = req.params.id;
    const card = await cardService.getCardById(id);
    if (!card) return error(res, 404, 'Not found');
    return ok(res, { card });
  } catch (err) {
    return error(res, 400, err.message);
  }
}

export async function listCards(req, res) {
  try {
    const { categoryId, type, q, limit, offset } = req.query;
    const items = await cardService.listCards({ categoryId, type, q, limit, offset });
    return ok(res, { items });
  } catch (err) {
    return error(res, 400, err.message);
  }
}
