import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, PaginatedResponse } from '../models/common.model';

export interface Class {
  id: string;
  name: string;
  section: string;
  academicYearId: string;
  academicYear?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  teacherId?: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  capacity: number;
  currentStrength: number;
  subjects?: string[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClassFormData {
  name: string;
  section: string;
  academicYearId: string;
  teacherId?: string;
  capacity: number;
  subjects?: string[];
  description?: string;
  isActive: boolean;
}

export interface ClassFilters {
  search?: string;
  academicYearId?: string;
  teacherId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClassService {
  private readonly endpoint = 'classes';

  constructor(private apiService: ApiService) {}

  getClasses(filters?: ClassFilters): Observable<PaginatedResponse<Class>> {
    const params = this.buildQueryParams(filters);
    return this.apiService.get<PaginatedResponse<Class>>(`${this.endpoint}?${params}`);
  }

  getClass(id: string): Observable<ApiResponse<Class>> {
    return this.apiService.get<ApiResponse<Class>>(`${this.endpoint}/${id}`);
  }

  createClass(classData: ClassFormData): Observable<ApiResponse<Class>> {
    return this.apiService.post<ApiResponse<Class>>(this.endpoint, classData);
  }

  updateClass(id: string, classData: Partial<ClassFormData>): Observable<ApiResponse<Class>> {
    return this.apiService.put<ApiResponse<Class>>(`${this.endpoint}/${id}`, classData);
  }

  deleteClass(id: string): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(`${this.endpoint}/${id}`);
  }

  getClassStats(): Observable<ApiResponse<any>> {
    return this.apiService.get<ApiResponse<any>>(`${this.endpoint}/stats`);
  }

  getClassStudents(classId: string, filters?: { page?: number; limit?: number }): Observable<PaginatedResponse<any>> {
    const params = this.buildQueryParams(filters);
    return this.apiService.get<PaginatedResponse<any>>(`${this.endpoint}/${classId}/students?${params}`);
  }

  assignStudentToClass(classId: string, studentId: string): Observable<ApiResponse<void>> {
    return this.apiService.post<ApiResponse<void>>(`${this.endpoint}/${classId}/students`, { studentId });
  }

  removeStudentFromClass(classId: string, studentId: string): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(`${this.endpoint}/${classId}/students/${studentId}`);
  }

  private buildQueryParams(filters?: any): string {
    if (!filters) return '';
    
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key].toString());
      }
    });
    
    return params.toString();
  }
}
