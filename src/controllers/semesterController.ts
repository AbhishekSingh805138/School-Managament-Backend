import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { SemesterService } from '../services/semesterService';

const semesterService = new SemesterService();

// Create semester
export const createSemester = asyncHandler(async (req: Request, res: Response) => {
  const semesterData = req.body;
  const semester = await semesterService.createSemester(semesterData);

  res.status(201).json({
    success: true,
    message: 'Semester created successfully',
    data: semester,
  });
});

// Get all semesters
export const getSemesters = asyncHandler(async (req: Request, res: Response) => {
  const result = await semesterService.getSemesters(req);

  res.json({
    success: true,
    data: result.semesters,
    pagination: result.pagination,
  });
});

// Get semester by ID
export const getSemesterById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const semester = await semesterService.getSemesterById(id);

  res.json({
    success: true,
    data: semester,
  });
});

// Update semester
export const updateSemester = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  const semester = await semesterService.updateSemester(id, updateData);

  res.json({
    success: true,
    message: 'Semester updated successfully',
    data: semester,
  });
});

// Delete semester
export const deleteSemester = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await semesterService.deleteSemester(id);

  res.json({
    success: true,
    message: 'Semester deleted successfully',
  });
});

// Get active semester
export const getActiveSemester = asyncHandler(async (req: Request, res: Response) => {
  const { academicYearId } = req.query;
  const semester = await semesterService.getActiveSemester(academicYearId as string);

  res.json({
    success: true,
    data: semester,
  });
});