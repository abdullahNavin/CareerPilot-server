import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as careerService from './career.service.js';
import { apiResponse } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../middleware/auth.middleware.js';

export const getAllCareers = asyncHandler(async (req: Request, res: Response) => {
  const result = await careerService.getAllCareers(req.query);
  res.status(200).json(apiResponse(true, 'Careers retrieved successfully', result.data, result.pagination));
});

export const getCareerById = asyncHandler(async (req: Request, res: Response) => {
  const career = await careerService.getCareerById(req.params.id as string);
  res.status(200).json(apiResponse(true, 'Career retrieved successfully', career));
});

export const createCareer = asyncHandler(async (req: Request, res: Response) => {
  const career = await careerService.createCareer(req.body);
  res.status(201).json(apiResponse(true, 'Career created successfully', career));
});

export const updateCareer = asyncHandler(async (req: Request, res: Response) => {
  const career = await careerService.updateCareer(req.params.id as string, req.body);
  res.status(200).json(apiResponse(true, 'Career updated successfully', career));
});

export const deleteCareer = asyncHandler(async (req: Request, res: Response) => {
  await careerService.deleteCareer(req.params.id as string);
  res.status(200).json(apiResponse(true, 'Career deleted successfully'));
});

export const getCareerReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await careerService.getCareerReviews(req.params.id as string);
  res.status(200).json(apiResponse(true, 'Reviews retrieved successfully', reviews));
});

export const addCareerReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const review = await careerService.addCareerReview(req.params.id as string, req.user!.userId, req.body);
  res.status(201).json(apiResponse(true, 'Review added successfully', review));
});
