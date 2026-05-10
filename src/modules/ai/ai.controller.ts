import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as aiService from './ai.service.js';
import { apiResponse } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../middleware/auth.middleware.js';

export const resumeAnalysis = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await aiService.processAIRequest(req.user!.userId, 'RESUME', req.body.prompt);
  res.status(200).json(apiResponse(true, 'Resume analysis complete', result));
});

export const careerRoadmap = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await aiService.processAIRequest(req.user!.userId, 'ROADMAP', req.body.prompt);
  res.status(200).json(apiResponse(true, 'Career roadmap generated', result));
});

export const interviewChat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await aiService.processAIRequest(req.user!.userId, 'INTERVIEW', req.body.prompt);
  res.status(200).json(apiResponse(true, 'Interview chat response generated', result));
});

export const skillGapAnalysis = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await aiService.processAIRequest(req.user!.userId, 'SKILL_GAP', req.body.prompt);
  res.status(200).json(apiResponse(true, 'Skill gap analysis complete', result));
});

export const coverLetter = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await aiService.processAIRequest(req.user!.userId, 'COVER_LETTER', req.body.prompt);
  res.status(200).json(apiResponse(true, 'Cover letter generated', result));
});

export const getResults = asyncHandler(async (req: AuthRequest, res: Response) => {
  const results = await aiService.getUserAIResults(req.user!.userId);
  res.status(200).json(apiResponse(true, 'AI results retrieved', results));
});

export const deleteResult = asyncHandler(async (req: AuthRequest, res: Response) => {
  await aiService.deleteAIResult(req.params.id as string, req.user!.userId);
  res.status(200).json(apiResponse(true, 'AI result deleted successfully'));
});
