import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginationParams, PaginatedResponse } from './api.service';
import { Student, CreateStudent, StudentStats } from '../models/student.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  constructor(private apiService: ApiService) {}

  getStudents(params?: PaginationParams): Observable<PaginatedResponse<Student>> {
    return this.apiService.getPaginated<Student>('students', params);
  }

  getStudent(id: string): Observable<ApiResponse<Student>> {
    return this.apiService.get<Student>(`students/${id}`);
  }

  createStudent(student: CreateStudent): Observable<ApiResponse<Student>> {
    return this.apiService.post<Student>('students', student);
  }

  updateStudent(id: string, student: Partial<Student>): Observable<ApiResponse<Student>> {
    return this.apiService.put<Student>(`students/${id}`, student);
  }

  deleteStudent(id: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`students/${id}`);
  }

  getStudentsByClass(classId: string): Observable<ApiResponse<Student[]>> {
    return this.apiService.get<Student[]>(`classes/${classId}/students`);
  }

  getStudentAttendance(studentId: string, params?: any): Observable<ApiResponse<any>> {
    return this.apiService.get(`attendance/student/${studentId}`, params);
  }

  getStudentGrades(studentId: string, params?: any): Observable<ApiResponse<any>> {
    return this.apiService.get(`grades/student/${studentId}`, params);
  }

  getStudentFees(studentId: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`fees/student/${studentId}`);
  }

  getStudentStats(): Observable<ApiResponse<StudentStats>> {
    return this.apiService.get<StudentStats>('students/stats');
  }

  enrollStudent(studentId: string, classId: string): Observable<ApiResponse<any>> {
    return this.apiService.post(`students/${studentId}/enroll`, { classId });
  }

  transferStudent(studentId: string, newClassId: string): Observable<ApiResponse<any>> {
    return this.apiService.post(`students/${studentId}/transfer`, { classId: newClassId });
  }

  bulkImportStudents(file: File): Observable<ApiResponse<any>> {
    return this.apiService.uploadFile('students/bulk-import', file);
  }

  exportStudents(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.apiService.downloadFile(`students/export?format=${format}`);
  }
}