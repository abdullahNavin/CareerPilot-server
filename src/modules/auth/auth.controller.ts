import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as authService from './auth.service.js';
import { apiResponse } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../middleware/auth.middleware.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(apiResponse(true, 'User registered successfully', result));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);
  res.status(200).json(apiResponse(true, 'Login successful', result));
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.logoutUser(req.user!.userId);
  // Clear the refresh token cookie if using HTTP-only cookies
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
  res.status(200).json(apiResponse(true, 'Logged out successfully'));
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.getMe(req.user!.userId);
  res.status(200).json(apiResponse(true, 'User retrieved successfully', user));
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  res.status(200).json(apiResponse(true, 'Token refreshed successfully', result));
});

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.mockGoogleLogin(req.body);
  res.status(200).json(apiResponse(true, 'Google login successful', result));
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  // Always return 200 to prevent user enumeration
  res.status(200).json(apiResponse(true, 'If that email is registered, a reset link has been sent.'));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.status(200).json(apiResponse(true, 'Password reset successfully'));
});
