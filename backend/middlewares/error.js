// backend/middlewares/error.js
class ErrorHandler extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorMiddleware = (err, req, res, next) => {
  // If error is plain string
  if (typeof err === "string") {
    return res.status(500).json({ success: false, message: err });
  }

  let error = { ...err };
  error.message = err.message || "Internal Server Error";
  error.statusCode = err.statusCode || 500;

  // Mongoose: CastError
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid ${err.path}`;
    error = new ErrorHandler(message, 400);
  }

  // Duplicate key
  if (err.code === 11000) {
    const keys = Object.keys(err.keyValue || {}).join(", ");
    const message = `Duplicate field value: ${keys}`;
    error = new ErrorHandler(message, 400);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = new ErrorHandler("Json Web Token is invalid, Try again please!", 401);
  }
  if (err.name === "TokenExpiredError") {
    error = new ErrorHandler("Json Web Token is expired, Try again please!", 401);
  }

  console.error("ErrorMiddleware:", err);
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default ErrorHandler;
