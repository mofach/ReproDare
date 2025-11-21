// src/controllers/auth.controller.js
import * as authService from '../services/auth.service.js';
import { ok, created, error } from '../utils/response.js';

export async function signup(req, res, next) {
  try {
    const out = await authService.registerStudent(req.body);
    return created(res, { user: out });
  } catch (err) { return error(res, 400, err.message); }
}

export async function createTeacher(req, res, next) {
  try {
    const out = await authService.createTeacher(req.body);
    return created(res, { user: out });
  } catch (err) { return error(res, 400, err.message); }
}

export async function login(req, res, next) {
  try {
    const out = await authService.loginUser(req.body);
    // send refresh token in httpOnly cookie (optional) and access token in body
    // We'll set a cookie named 'refreshToken' httpOnly, secure=false for dev
    const { refreshToken, accessToken, user } = out;
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      // secure: true in production w/ HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days approx
    });
    return ok(res, { accessToken, user }); //Delete refresh token in prod
  } catch (err) { return error(res, 400, err.message); }
}

export async function refresh(req, res, next) {
  try {
    // try cookie first, else body
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return error(res, 401, 'Missing refresh token');
    const out = await authService.refreshAuth(token);
    // set new cookie
    res.cookie('refreshToken', out.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7
    });
    return ok(res, { accessToken: out.accessToken, user: out.user });
  } catch (err) { return error(res, 401, err.message); }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) await authService.logout(token);
    // clear cookie
    res.clearCookie('refreshToken');
    return ok(res, { message: 'logged out' });
  } catch (err) { return error(res, 400, err.message); }
}
