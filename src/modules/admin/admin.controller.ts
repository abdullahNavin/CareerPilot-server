import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as adminService from './admin.service.js';
import { apiResponse } from '../../utils/apiResponse.js';

export const getPlatformStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminService.getPlatformStats();
  res.status(200).json(apiResponse(true, 'Platform stats retrieved', stats));
});

export const getOverview = asyncHandler(async (_req: Request, res: Response) => {
  const overview = await adminService.getAdminOverview();
  res.status(200).json(apiResponse(true, 'Admin overview retrieved', overview));
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.getAllUsersAdmin(req.query);
  res.status(200).json(apiResponse(true, 'Users retrieved', result.data, result.pagination));
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminService.getUserAdminById(req.params.id as string);
  res.status(200).json(apiResponse(true, 'User retrieved', user));
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminService.updateUserAdmin(req.params.id as string, req.body);
  res.status(200).json(apiResponse(true, 'User updated', user));
});

export const changeUserRole = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminService.changeUserRole(req.params.id as string, req.body.role);
  res.status(200).json(apiResponse(true, 'User role updated', user));
});

export const suspendUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminService.suspendUserAdmin(req.params.id as string, req.body.suspended);
  res.status(200).json(apiResponse(true, req.body.suspended ? 'User suspended' : 'User restored', user));
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteUserAdmin(req.params.id as string);
  res.status(200).json(apiResponse(true, 'User deleted'));
});

export const getMentors = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.getMentorOverview(req.query);
  res.status(200).json(apiResponse(true, 'Mentors retrieved', result.data, { ...result.pagination, metrics: result.metrics }));
});

export const updateMentor = asyncHandler(async (req: Request, res: Response) => {
  const mentor = await adminService.updateMentorAdmin(req.params.id as string, req.body);
  res.status(200).json(apiResponse(true, 'Mentor updated', mentor));
});

export const getCareers = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.getCareersAdmin(req.query);
  res.status(200).json(apiResponse(true, 'Careers retrieved', result.data, result.pagination));
});

export const getAIUsage = asyncHandler(async (req: Request, res: Response) => {
  const stats = await adminService.getAIUsageStats(req.query);
  res.status(200).json(apiResponse(true, 'AI usage stats retrieved', stats, stats.pagination));
});

export const getAllBlogs = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.getAllBlogsAdmin(req.query);
  res.status(200).json(apiResponse(true, 'All blogs retrieved', result.data, result.pagination));
});

export const getReports = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.getReports(req.query);
  res.status(200).json(apiResponse(true, 'Reports retrieved', result.data, { ...result.pagination, summary: result.summary }));
});

export const resolveReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await adminService.resolveReport(req.params.id as string, req.body.status);
  res.status(200).json(apiResponse(true, 'Report updated', report));
});

export const getNotifications = asyncHandler(async (_req: Request, res: Response) => {
  const notifications = await adminService.getNotificationsAdmin();
  res.status(200).json(apiResponse(true, 'Notifications retrieved', notifications));
});

export const sendAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.createAnnouncement(req.body);
  res.status(200).json(apiResponse(true, 'Announcement sent', result));
});

export const getPlatformMetrics = asyncHandler(async (_req: Request, res: Response) => {
  const metrics = await adminService.getPlatformMetrics();
  res.status(200).json(apiResponse(true, 'Platform metrics retrieved', metrics));
});

export const getSupportTickets = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.getSupportTickets(req.query);
  res.status(200).json(apiResponse(true, 'Support tickets retrieved', result.data, result.pagination));
});

export const updateSupportTicket = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await adminService.updateSupportTicket(req.params.id as string, req.body);
  res.status(200).json(apiResponse(true, 'Support ticket updated', ticket));
});

export const getSecurityEvents = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.getSecurityEvents(req.query);
  res.status(200).json(apiResponse(true, 'Security events retrieved', result.data, result.pagination));
});

export const getRolePermissionManagement = asyncHandler(async (_req: Request, res: Response) => {
  const result = await adminService.getRolePermissionManagement();
  res.status(200).json(apiResponse(true, 'Role permissions retrieved', result));
});
