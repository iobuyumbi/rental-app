// Minimal validation helper: accepts a schema with sync parse method (e.g., zod)

const validateBody = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse
      ? schema.parse(req.body)
      : schema.validate(req.body);
    req.body = parsed;
    next();
  } catch (err) {
    const message = err?.errors
      ? err.errors.map((e) => e.message).join(", ")
      : err.message || "Invalid request payload";
    return res.status(400).json({ message });
  }
};

module.exports = { validateBody };
