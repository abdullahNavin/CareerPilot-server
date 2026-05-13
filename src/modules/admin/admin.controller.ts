import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as adminService from './admin.service.js';
import { apiResponse } from '../../utils/apiResponse.js';

export const getPlatformStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await adminService.getPlatformStats();
  res.status(200).json(apiResponse(true, 'Platform stats retrieved', stats));
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.getAllUsersAdmin(req.query);
  res.status(200).json(apiResponse(true, 'Users retrieved', result.data, result.pagination));
});

export const changeUserRole = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminService.changeUserRole(req.params.id as string, req.body.role);
  res.status(200).json(apiResponse(true, 'User role updated', user));
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteUserAdmin(req.params.id as string);
  res.status(200).json(apiResponse(true, 'User deleted'));
});

export const getAIUsage = asyncHandler(async (req: Request, res: Response) => {
  const stats = await adminService.getAIUsageStats(req.query);
  res.status(200).json(apiResponse(true, 'AI usage stats retrieved', stats));
});

export const getAllBlogs = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.getAllBlogsAdmin(req.query);
  res.status(200).json(apiResponse(true, 'All blogs retrieved', result.data, result.pagination));
});
