import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as jobService from './job-tracker.service.js';
import { apiResponse } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../middleware/auth.middleware.js';

export const getJobs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const jobs = await jobService.getUserJobs(req.user!.userId);
  res.status(200).json(apiResponse(true, 'Jobs retrieved successfully', jobs));
});

export const createJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  const job = await jobService.createJob(req.user!.userId, req.body);
  res.status(201).json(apiResponse(true, 'Job application added successfully', job));
});

export const updateJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  const job = await jobService.updateJob(req.params.id as string, req.user!.userId, req.body);
  res.status(200).json(apiResponse(true, 'Job application updated successfully', job));
});

export const deleteJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  await jobService.deleteJob(req.params.id as string, req.user!.userId);
  res.status(200).json(apiResponse(true, 'Job application deleted successfully'));
});

export const getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await jobService.getJobStats(req.user!.userId);
  res.status(200).json(apiResponse(true, 'Job stats retrieved successfully', stats));
});
