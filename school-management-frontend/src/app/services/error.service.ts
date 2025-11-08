import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface ErrorMessage {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private errorMessages: { [key: string]: string } = {
    // Network errors
    'ERR_NETWORK': 'Network connection failed. Please check your internet connection.',
    'ERR_TIMEOUT': 'Request timed out. Please try again.',
    'ERR_CONNECTION_REFUSED': 'Unable to connect to the server. Please try again later.',
    
    // Authentication errors
    'INVALID_CREDENTIALS': 'Invalid email or password. Please try again.',
    'TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
    'UNAUTHORIZED': 'You are not authorized to perform this action.',
    
    // Validation errors
    'VALIDATION_ERROR': 'Please check your input and try again.',
    'DUPLICATE_EMAIL': 'This email address is already registered.',
    'DUPLICATE_ENTRY': 'This record already exists.',
    
    // Server errors
    'INTERNAL_SERVER_ERROR': 'An unexpected error occurred. Please try again later.',
    'SERVICE_UNAVAILABLE': 'The service is temporarily unavailable. Please try again later.',
    
    // Default
    'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.'
  };

  constructor() {}

  /**
   * Process HTTP error and return user-friendly error message
   */
  processError(error: any): ErrorMessage {
    if (error instanceof HttpErrorResponse) {
      return this.handleHttpError(error);
    } else if (error.error instanceof ErrorEvent) {
      // Client-side error
      return {
        title: 'Client Error',
        message: error.error.message || this.errorMessages['UNKNOWN_ERROR'],
        type: 'error'
      };
    } else {
      // Unknown error
      return {
        title: 'Error',
        message: this.errorMessages['UNKNOWN_ERROR'],
        type: 'error'
      };
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleHttpError(error: HttpErrorResponse): ErrorMessage {
    let message: string;
    let title: string;

    switch (error.status) {
      case 0:
        // Network error
        title = 'Connection Error';
        message = this.errorMessages['ERR_NETWORK'];
        break;

      case 400:
        // Bad request
        title = 'Invalid Request';
        message = error.error?.message || this.errorMessages['VALIDATION_ERROR'];
        break;

      case 401:
        // Unauthorized
        title = 'Authentication Required';
        message = error.error?.message || this.errorMessages['INVALID_CREDENTIALS'];
        break;

      case 403:
        // Forbidden
        title = 'Access Denied';
        message = error.error?.message || this.errorMessages['UNAUTHORIZED'];
        break;

      case 404:
        // Not found
        title = 'Not Found';
        message = error.error?.message || 'The requested resource was not found.';
        break;

      case 409:
        // Conflict
        title = 'Conflict';
        message = error.error?.message || this.errorMessages['DUPLICATE_ENTRY'];
        break;

      case 422:
        // Unprocessable entity
        title = 'Validation Error';
        message = this.formatValidationErrors(error.error?.errors) || error.error?.message || this.errorMessages['VALIDATION_ERROR'];
        break;

      case 500:
        // Internal server error
        title = 'Server Error';
        message = this.errorMessages['INTERNAL_SERVER_ERROR'];
        break;

      case 503:
        // Service unavailable
        title = 'Service Unavailable';
        message = this.errorMessages['SERVICE_UNAVAILABLE'];
        break;

      default:
        title = 'Error';
        message = error.error?.message || this.errorMessages['UNKNOWN_ERROR'];
    }

    return {
      title,
      message,
      type: 'error'
    };
  }

  /**
   * Format validation errors from backend
   */
  private formatValidationErrors(errors: any): string | null {
    if (!errors) return null;

    if (Array.isArray(errors)) {
      return errors.map(err => err.message || err).join(', ');
    }

    if (typeof errors === 'object') {
      return Object.values(errors).flat().join(', ');
    }

    return null;
  }

  /**
   * Log error for debugging (can be extended to send to logging service)
   */
  logError(error: any, context?: string): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      context,
      error: error instanceof HttpErrorResponse ? {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        message: error.message
      } : error
    };

    console.error('[Error Service]', errorInfo);
    
    // TODO: Send to remote logging service in production
  }

  /**
   * Get user-friendly error message by error code
   */
  getErrorMessage(code: string): string {
    return this.errorMessages[code] || this.errorMessages['UNKNOWN_ERROR'];
  }
}
