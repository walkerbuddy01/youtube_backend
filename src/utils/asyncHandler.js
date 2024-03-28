const asyncHandler = (RequestHandler) => {
  return (req, res, next) => {
    Promise.resolve(RequestHandler(req, res, next)).catch((err) => {
      throw err;
    });
  };
};

export { asyncHandler };
