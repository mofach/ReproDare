// src/controllers/user.controller.js
import * as userService from '../services/user.service.js';
import { ok, error } from '../utils/response.js';

// GET /users?role=student
export async function listUsers(req, res) {
  try {
    const { role } = req.query; // Ambil filter role dari query param
    const users = await userService.getUsers(role);
    // Kita bungkus dengan { items: ... } agar sesuai dengan frontend yang sudah dibuat
    return ok(res, { items: users });
  } catch (err) {
    return error(res, 500, err.message);
  }
}

// DELETE /users/:id
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    await userService.deleteUserById(id);
    return ok(res, { message: 'User deleted successfully' });
  } catch (err) {
    return error(res, 400, err.message);
  }
}