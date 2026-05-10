import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as notificationService from './notification.service.js';
import { apiResponse } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../middleware/auth.middleware.js';

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notifications = await notificationService.getUserNotifications(req.user!.userId);
  res.status(200).json(apiResponse(true, 'Notifications retrieved successfully', notifications));
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notification = await notificationService.markAsRead(req.params.id as string, req.user!.userId);
  res.status(200).json(apiResponse(true, 'Notification marked as read', notification));
});

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await notificationService.markAllAsRead(req.user!.userId);
  res.status(200).json(apiResponse(true, 'All notifications marked as read'));
});

export const deleteNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  await notificationService.deleteNotification(req.params.id as string, req.user!.userId);
  res.status(200).json(apiResponse(true, 'Notification deleted successfully'));
});
