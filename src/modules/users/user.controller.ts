import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as userService from './user.service.js';
import { apiResponse } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../middleware/auth.middleware.js';

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await userService.getAllUsers();
  res.status(200).json(apiResponse(true, 'Users retrieved successfully', users));
});

export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id as string);
  res.status(200).json(apiResponse(true, 'User profile retrieved successfully', user));
});

export const updateUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.userId !== req.params.id && req.user?.role !== 'ADMIN') {
    throw { statusCode: 403, message: 'Forbidden' };
  }
  
  const user = await userService.updateUser(req.params.id as string, req.body);
  res.status(200).json(apiResponse(true, 'User updated successfully', user));
});

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.userId !== req.params.id && req.user?.role !== 'ADMIN') {
    throw { statusCode: 403, message: 'Forbidden' };
  }

  await userService.deleteUser(req.params.id as string);
  res.status(200).json(apiResponse(true, 'User deleted successfully'));
});

export const uploadAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.userId !== req.params.id) {
    throw { statusCode: 403, message: 'Forbidden' };
  }

  // Assuming file is handled by multer in the middleware and available in req.file
  const result = await userService.uploadAvatar(req.params.id as string, (req as any).file);
  res.status(200).json(apiResponse(true, 'Avatar uploaded successfully', result));
});

export const getAiResults = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.userId !== req.params.id && req.user?.role !== 'ADMIN') {
    throw { statusCode: 403, message: 'Forbidden' };
  }

  const results = await userService.getUserAiResults(req.params.id as string);
  res.status(200).json(apiResponse(true, 'AI results retrieved successfully', results));
});
