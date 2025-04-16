import { ErrorRequestHandler, Response } from "express";
import { z, ZodError } from "zod";
import { HTTPSTATUS } from "../config/http.config";
import { ErrorCodeEnum } from "../enums/error-code.enum";
import { AppError } from "../utils/app-error";

const formatZodError = (res: Response, err: z.ZodError) => {
  const errors = err?.issues.map((error) => ({
    field: error.path.join(","),
    message: error.message,
  }));
  return res.status(HTTPSTATUS.BAD_REQUEST).json({
    message: "Validation failed",
    errors,
    errorCode: ErrorCodeEnum.VALIDATION_ERROR,
  });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next): any => {
  console.error(`Error Occurred on PATH: ${req.path}`, err);
  if (err instanceof SyntaxError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Invalid JSON format. Please check your request.",
    });
  }

  if (err instanceof ZodError) {
    return formatZodError(res, err);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      errorCode: err.errorCode,
    });
  }
  return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    message: "Internal Server Error",
    error: err?.message || "Unknown error occurred",
  });
};
