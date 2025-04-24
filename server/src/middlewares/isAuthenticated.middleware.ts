import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../utils/app-error";

export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user || !req.user._id)
    throw new UnauthorizedException("Unauthorized, Please log in");
  next();
}
export default isAuthenticated;
