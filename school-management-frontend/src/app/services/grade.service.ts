import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginationParams, PaginatedResponse } from './api.service';
import { Grade, CreateGrade, AssessmentType, ReportCard, GradeStats } from '../models/grade.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class GradeService {
  constructor(private apiService: ApiService) {}

  // Grades
  getGrades(params?: PaginationParams & { 
    studentId?: string; 
    subjectId?: string; 
    classId?: string; 
    semesterId?: string;
    assessmentTypeId?: string;
  }): Observable<PaginatedResponse<Grade>> {
    return this.apiService.getPaginated<Grade>('grades', params);
  }

  getGrade(id: string): Observable<ApiResponse<Grade>> {
    return this.apiService.get<Grade>(`grades/${id}`);
  }

  createGrade(grade: CreateGrade): Observable<ApiResponse<Grade>> {
    return this.apiService.post<Grade>('grades', grade);
  }

  updateGrade(id: string, grade: Partial<Grade>): Observable<ApiResponse<Grade>> {
    return this.apiService.put<Grade>(`grades/${id}`, grade);
  }

  deleteGrade(id: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`grades/${id}`);
  }

  getStudentGrades(studentId: string, params?: { semesterId?: string; subjectId?: string }): Observable<ApiResponse<Grade[]>> {
    return this.apiService.get<Grade[]>(`grades/student/${studentId}`, params);
  }

  getClassGrades(classId: string, params?: { 
    subjectId?: string; 
    semesterId?: string; 
    assessmentTypeId?: string;
  }): Observable<ApiResponse<Grade[]>> {
    return this.apiService.get<Grade[]>(`grades/class/${classId}`, params);
  }

  bulkCreateGrades(grades: CreateGrade[]): Observable<ApiResponse<Grade[]>> {
    return this.apiService.post<Grade[]>('grades/bulk', { grades });
  }

  // Assessment Types
  getAssessmentTypes(params?: PaginationParams): Observable<PaginatedResponse<AssessmentType>> {
    return this.apiService.getPaginated<AssessmentType>('assessment-types', params);
  }

  getAssessmentType(id: string): Observable<ApiResponse<AssessmentType>> {
    return this.apiService.get<AssessmentType>(`assessment-types/${id}`);
  }

  createAssessmentType(assessmentType: Partial<AssessmentType>): Observable<ApiResponse<AssessmentType>> {
    return this.apiService.post<AssessmentType>('assessment-types', assessmentType);
  }

  updateAssessmentType(id: string, assessmentType: Partial<AssessmentType>): Observable<ApiResponse<AssessmentType>> {
    return this.apiService.put<AssessmentType>(`assessment-types/${id}`, assessmentType);
  }

  deleteAssessmentType(id: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`assessment-types/${id}`);
  }

  // Report Cards
  getReportCards(params?: PaginationParams & { studentId?: string; semesterId?: string; classId?: string }): Observable<PaginatedResponse<ReportCard>> {
    return this.apiService.getPaginated<ReportCard>('report-cards', params);
  }

  getReportCard(id: string): Observable<ApiResponse<ReportCard>> {
    return this.apiService.get<ReportCard>(`report-cards/${id}`);
  }

  getStudentReportCard(studentId: string, semesterId: string): Observable<ApiResponse<ReportCard>> {
    return this.apiService.get<ReportCard>(`report-cards/student/${studentId}`, { semesterId });
  }

  generateReportCard(studentId: string, semesterId: string): Observable<ApiResponse<ReportCard>> {
    return this.apiService.post<ReportCard>('report-cards/generate', { studentId, semesterId });
  }

  generateClassReportCards(classId: string, semesterId: string): Observable<ApiResponse<any>> {
    return this.apiService.post('report-cards/generate-class', { classId, semesterId });
  }

  downloadReportCard(reportCardId: string, format: 'pdf' | 'excel' = 'pdf'): Observable<Blob> {
    return this.apiService.downloadFile(`report-cards/${reportCardId}/download?format=${format}`);
  }

  // Statistics and Analytics
  getGradeStats(params?: { classId?: string; subjectId?: string; semesterId?: string }): Observable<ApiResponse<GradeStats>> {
    return this.apiService.get<GradeStats>('grades/stats', params);
  }

  getClassPerformanceAnalytics(classId: string, params?: { semesterId?: string }): Observable<ApiResponse<any>> {
    return this.apiService.get(`grades/class/${classId}/analytics`, params);
  }

  getSubjectPerformanceAnalytics(subjectId: string, params?: { classId?: string; semesterId?: string }): Observable<ApiResponse<any>> {
    return this.apiService.get(`grades/subject/${subjectId}/analytics`, params);
  }

  getStudentPerformanceTrend(studentId: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`grades/student/${studentId}/trend`);
  }

  // Grade Import/Export
  bulkImportGrades(file: File, options?: { semesterId: string; assessmentTypeId: string }): Observable<ApiResponse<any>> {
    return this.apiService.uploadFile('grades/bulk-import', file, options);
  }

  exportGrades(params: {
    classId?: string;
    subjectId?: string;
    semesterId?: string;
    format?: 'csv' | 'excel';
  }): Observable<Blob> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.apiService.downloadFile(`grades/export?${queryParams}`);
  }

  exportReportCards(params: {
    classId?: string;
    semesterId: string;
    format?: 'pdf' | 'excel';
  }): Observable<Blob> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.apiService.downloadFile(`report-cards/export?${queryParams}`);
  }
}