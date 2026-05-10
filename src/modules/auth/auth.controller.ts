import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as authService from './auth.service.js';
import { apiResponse } from '../../utils/apiResponse.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(apiResponse(true, 'User registered successfully', result));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);
  res.status(200).json(apiResponse(true, 'Login successful', result));
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  res.status(200).json(apiResponse(true, 'Token refreshed successfully', result));
});

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.mockGoogleLogin(req.body);
  res.status(200).json(apiResponse(true, 'Google login successful', result));
});
