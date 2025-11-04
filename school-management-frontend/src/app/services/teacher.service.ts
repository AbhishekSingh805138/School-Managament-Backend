import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginationParams, PaginatedResponse } from './api.service';
import { Teacher, CreateTeacher, TeacherStats, Subject, Class } from '../models/teacher.model';
import { ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  constructor(private apiService: ApiService) {}

  getTeachers(params?: PaginationParams): Observable<PaginatedResponse<Teacher>> {
    return this.apiService.getPaginated<Teacher>('teachers', params);
  }

  getTeacher(id: string): Observable<ApiResponse<Teacher>> {
    return this.apiService.get<Teacher>(`teachers/${id}`);
  }

  createTeacher(teacher: CreateTeacher): Observable<ApiResponse<Teacher>> {
    return this.apiService.post<Teacher>('teachers', teacher);
  }

  updateTeacher(id: string, teacher: Partial<Teacher>): Observable<ApiResponse<Teacher>> {
    return this.apiService.put<Teacher>(`teachers/${id}`, teacher);
  }

  deleteTeacher(id: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`teachers/${id}`);
  }

  getTeacherClasses(teacherId: string): Observable<ApiResponse<Class[]>> {
    return this.apiService.get<Class[]>(`teachers/${teacherId}/classes`);
  }

  getTeacherSubjects(teacherId: string): Observable<ApiResponse<Subject[]>> {
    return this.apiService.get<Subject[]>(`teachers/${teacherId}/subjects`);
  }

  assignTeacherToClass(teacherId: string, classId: string): Observable<ApiResponse<any>> {
    return this.apiService.post(`teachers/${teacherId}/assign-class`, { classId });
  }

  assignTeacherToSubject(teacherId: string, subjectId: string): Observable<ApiResponse<any>> {
    return this.apiService.post(`teachers/${teacherId}/assign-subject`, { subjectId });
  }

  removeTeacherFromClass(teacherId: string, classId: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`teachers/${teacherId}/classes/${classId}`);
  }

  removeTeacherFromSubject(teacherId: string, subjectId: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`teachers/${teacherId}/subjects/${subjectId}`);
  }

  getTeacherStats(): Observable<ApiResponse<TeacherStats>> {
    return this.apiService.get<TeacherStats>('teachers/stats');
  }

  getTeacherWorkload(teacherId: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`teachers/${teacherId}/workload`);
  }

  getTeacherSchedule(teacherId: string): Observable<ApiResponse<any>> {
    return this.apiService.get(`teachers/${teacherId}/schedule`);
  }

  bulkImportTeachers(file: File): Observable<ApiResponse<any>> {
    return this.apiService.uploadFile('teachers/bulk-import', file);
  }

  exportTeachers(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.apiService.downloadFile(`teachers/export?format=${format}`);
  }
}