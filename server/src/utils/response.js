export function ok(res, data) {
  return res.json({ ok: true, ...data });
}

export function created(res, data) {
  return res.status(201).json({ ok: true, ...data });
}

export function error(res, status = 400, message='error') {
  return res.status(status).json({ ok: false, error: message });
}
