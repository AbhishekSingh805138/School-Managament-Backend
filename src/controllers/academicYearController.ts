import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AcademicYearService } from '../services/academicYearService';

const academicYearService = new AcademicYearService();

// Create academic year
export const createAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  const academicYearData = req.body;
  const academicYear = await academicYearService.createAcademicYear(academicYearData);

  res.status(201).json({
    success: true,
    message: 'Academic year created successfully',
    data: academicYear,
  });
});

// Get all academic years
export const getAcademicYears = asyncHandler(async (req: Request, res: Response) => {
  const result = await academicYearService.getAcademicYears(req);

  res.json({
    success: true,
    data: result.academicYears,
    pagination: result.pagination,
  });
});

// Get academic year by ID
export const getAcademicYearById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const academicYear = await academicYearService.getAcademicYearById(id);

  res.json({
    success: true,
    data: academicYear,
  });
});

// Update academic year
export const updateAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  const academicYear = await academicYearService.updateAcademicYear(id, updateData);

  res.json({
    success: true,
    message: 'Academic year updated successfully',
    data: academicYear,
  });
});

// Delete academic year (soft delete)
export const deleteAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await academicYearService.deleteAcademicYear(id);

  res.json({
    success: true,
    message: 'Academic year deleted successfully',
  });
});

// Get active academic year
export const getActiveAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  const academicYear = await academicYearService.getActiveAcademicYear();

  res.json({
    success: true,
    data: academicYear,
  });
});