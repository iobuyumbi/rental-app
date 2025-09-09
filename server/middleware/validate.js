// Validation middleware for common input validation

const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  if (!id || !isValidObjectId) {
    return res.status(422).json({
      success: false,
      message: "Invalid ID format. Must be a 24-character hexadecimal string.",
    });
  }

  next();
};

const validatePagination = (req, res, next) => {
  const { page = "1", limit = "10" } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  const isValid =
    Number.isInteger(pageNum) &&
    Number.isInteger(limitNum) &&
    pageNum > 0 &&
    limitNum > 0 &&
    limitNum <= 100;

  if (!isValid) {
    return res.status(422).json({
      success: false,
      message:
        "Pagination parameters invalid: 'page' must be >= 1 and 'limit' must be between 1 and 100.",
    });
  }

  req.pagination = {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum,
  };

  next();
};

const validateRequiredFields = (requiredFields) => {
  return (req, res, next) => {
    const missing = requiredFields.filter(
      (field) =>
        req.body[field] === undefined ||
        req.body[field] === null ||
        req.body[field] === ""
    );

    if (missing.length > 0) {
      return res.status(422).json({
        success: false,
        message: `Missing required field(s): ${missing.join(", ")}`,
      });
    }

    next();
  };
};

module.exports = {
  validateObjectId,
  validatePagination,
  validateRequiredFields,
};
