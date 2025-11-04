import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { User, LoginRequest, LoginResponse, CreateUser, ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api/v1';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Load user and token from localStorage on service initialization
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      this.tokenSubject.next(token);
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            const { user, token } = response.data;
            
            // Store in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Update subjects
            this.tokenSubject.next(token);
            this.currentUserSubject.next(user);
          }
        })
      );
  }

  register(userData: CreateUser): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/auth/register`, userData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            const { user, token } = response.data;
            
            // Store in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Update subjects
            this.tokenSubject.next(token);
            this.currentUserSubject.next(user);
          }
        })
      );
  }

  logout(): void {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear subjects
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    
    // Navigate to login
    this.router.navigate(['/auth/login']);
  }

  getCurrentUser(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/auth/profile`);
  }

  refreshToken(): Observable<ApiResponse<any>> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/auth/refresh`, { refreshToken });
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(roles: string[]): boolean {
    const user = this.getCurrentUserValue();
    return user ? roles.includes(user.role) : false;
  }

  isAdmin(): boolean {
    return this.hasRole(['admin']);
  }

  isTeacher(): boolean {
    return this.hasRole(['teacher']);
  }

  isStudent(): boolean {
    return this.hasRole(['student']);
  }

  isParent(): boolean {
    return this.hasRole(['parent']);
  }

  isStaff(): boolean {
    return this.hasRole(['staff']);
  }
}