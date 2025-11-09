import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginationParams, PaginatedResponse } from './api.service';
import { AcademicYear, Semester, CreateAcademicYear, CreateSemester } from '../models/academic.model';
import { Subject, Class } from '../models/teacher.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AcademicService {
  constructor(private apiService: ApiService) {}

  // Academic Years
  getAcademicYears(params?: PaginationParams): Observable<any> {
    return this.apiService.get<any>('academic-years', params);
  }

  getAcademicYear(id: string): Observable<ApiResponse<AcademicYear>> {
    return this.apiService.get<AcademicYear>(`academic-years/${id}`);
  }

  createAcademicYear(academicYear: CreateAcademicYear): Observable<ApiResponse<AcademicYear>> {
    return this.apiService.post<AcademicYear>('academic-years', academicYear);
  }

  updateAcademicYear(id: string, academicYear: Partial<AcademicYear>): Observable<ApiResponse<AcademicYear>> {
    return this.apiService.put<AcademicYear>(`academic-years/${id}`, academicYear);
  }

  deleteAcademicYear(id: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`academic-years/${id}`);
  }

  setActiveAcademicYear(id: string): Observable<ApiResponse<AcademicYear>> {
    return this.apiService.post<AcademicYear>(`academic-years/${id}/activate`, {});
  }

  getCurrentAcademicYear(): Observable<ApiResponse<AcademicYear>> {
    return this.apiService.get<AcademicYear>('academic-years/current');
  }

  // Semesters
  getSemesters(params?: PaginationParams & { academicYearId?: string }): Observable<PaginatedResponse<Semester>> {
    return this.apiService.getPaginated<Semester>('semesters', params);
  }

  getSemester(id: string): Observable<ApiResponse<Semester>> {
    return this.apiService.get<Semester>(`semesters/${id}`);
  }

  createSemester(semester: CreateSemester): Observable<ApiResponse<Semester>> {
    return this.apiService.post<Semester>('semesters', semester);
  }

  updateSemester(id: string, semester: Partial<Semester>): Observable<ApiResponse<Semester>> {
    return this.apiService.put<Semester>(`semesters/${id}`, semester);
  }

  deleteSemester(id: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`semesters/${id}`);
  }

  setActiveSemester(id: string): Observable<ApiResponse<Semester>> {
    return this.apiService.post<Semester>(`semesters/${id}/activate`, {});
  }

  getCurrentSemester(): Observable<ApiResponse<Semester>> {
    return this.apiService.get<Semester>('semesters/current');
  }

  // Subjects
  getSubjects(params?: PaginationParams): Observable<PaginatedResponse<Subject>> {
    return this.apiService.getPaginated<Subject>('subjects', params);
  }

  getSubject(id: string): Observable<ApiResponse<Subject>> {
    return this.apiService.get<Subject>(`subjects/${id}`);
  }

  createSubject(subject: Partial<Subject>): Observable<ApiResponse<Subject>> {
    return this.apiService.post<Subject>('subjects', subject);
  }

  updateSubject(id: string, subject: Partial<Subject>): Observable<ApiResponse<Subject>> {
    return this.apiService.put<Subject>(`subjects/${id}`, subject);
  }

  deleteSubject(id: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`subjects/${id}`);
  }

  // Classes
  getClasses(params?: PaginationParams & { grade?: string; academicYearId?: string }): Observable<PaginatedResponse<Class>> {
    return this.apiService.getPaginated<Class>('classes', params);
  }

  getClass(id: string): Observable<ApiResponse<Class>> {
    return this.apiService.get<Class>(`classes/${id}`);
  }

  createClass(classData: Partial<Class>): Observable<ApiResponse<Class>> {
    return this.apiService.post<Class>('classes', classData);
  }

  updateClass(id: string, classData: Partial<Class>): Observable<ApiResponse<Class>> {
    return this.apiService.put<Class>(`classes/${id}`, classData);
  }

  deleteClass(id: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`classes/${id}`);
  }

  getClassStudents(classId: string): Observable<ApiResponse<any[]>> {
    return this.apiService.get<any[]>(`classes/${classId}/students`);
  }

  getClassSubjects(classId: string): Observable<ApiResponse<Subject[]>> {
    return this.apiService.get<Subject[]>(`classes/${classId}/subjects`);
  }

  assignSubjectToClass(classId: string, subjectId: string, teacherId?: string): Observable<ApiResponse<any>> {
    return this.apiService.post(`classes/${classId}/subjects`, { subjectId, teacherId });
  }

  removeSubjectFromClass(classId: string, subjectId: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`classes/${classId}/subjects/${subjectId}`);
  }

  assignTeacherToClass(classId: string, teacherId: string): Observable<ApiResponse<any>> {
    return this.apiService.post(`classes/${classId}/assign-teacher`, { teacherId });
  }

  // Bulk Operations
  bulkImportSubjects(file: File): Observable<ApiResponse<any>> {
    return this.apiService.uploadFile('subjects/bulk-import', file);
  }

  bulkImportClasses(file: File): Observable<ApiResponse<any>> {
    return this.apiService.uploadFile('classes/bulk-import', file);
  }

  // Export
  exportSubjects(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.apiService.downloadFile(`subjects/export?format=${format}`);
  }

  exportClasses(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.apiService.downloadFile(`classes/export?format=${format}`);
  }
}