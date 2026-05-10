import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as blogService from './blog.service.js';
import { apiResponse } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../middleware/auth.middleware.js';

export const getBlogs = asyncHandler(async (req: Request, res: Response) => {
  const result = await blogService.getAllBlogs(req.query);
  res.status(200).json(apiResponse(true, 'Blogs retrieved successfully', result.data, result.pagination));
});

export const getBlogBySlug = asyncHandler(async (req: Request, res: Response) => {
  const blog = await blogService.getBlogBySlug(req.params.slug as string);
  res.status(200).json(apiResponse(true, 'Blog retrieved successfully', blog));
});

export const createBlog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const blog = await blogService.createBlog(req.user!.userId, req.body);
  res.status(201).json(apiResponse(true, 'Blog created successfully', blog));
});

export const updateBlog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const blog = await blogService.updateBlog(req.params.id as string, req.user!.userId, req.user!.role, req.body);
  res.status(200).json(apiResponse(true, 'Blog updated successfully', blog));
});

export const deleteBlog = asyncHandler(async (req: AuthRequest, res: Response) => {
  await blogService.deleteBlog(req.params.id as string);
  res.status(200).json(apiResponse(true, 'Blog deleted successfully'));
});

export const getFeaturedBlogs = asyncHandler(async (req: Request, res: Response) => {
  const blogs = await blogService.getFeaturedBlogs();
  res.status(200).json(apiResponse(true, 'Featured blogs retrieved successfully', blogs));
});

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await blogService.getCategories();
  res.status(200).json(apiResponse(true, 'Blog categories retrieved successfully', categories));
});
