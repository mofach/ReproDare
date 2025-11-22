// src/middlewares/validate.js
export function validateRest(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const payload = req[source] ?? {};
      const parsed = schema.parse(payload);
      // attach parsed value for handlers
      req.validated = req.validated || {};
      req.validated[source] = parsed;
      return next();
    } catch (err) {
      // ZodError -> format message
      const message = err.errors ? err.errors.map(e => `${e.path.join('.')} ${e.message}`).join('; ') : (err.message || 'Invalid payload');
      return res.status(400).json({ ok: false, error: message });
    }
  };
}
