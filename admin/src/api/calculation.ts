import apiClient from './axios'; // Changed from { apiClient }

// Interface for calculation items
export interface CalculationItem {
  id: string;
  name: string;
  amount: number;
}

// Interface for calculation
export interface Calculation {
  _id?: string;
  date: string;
  title: string;
  items: CalculationItem[];
  total: number;
  createdAt?: string;
  updatedAt?: string;
}

// Interface for calculation form data (without MongoDB fields)
export interface CalculationFormData {
  date: string;
  title: string;
  items: CalculationItem[];
}

// Interface for calculation response
interface CalculationResponse {
  success: boolean;
  message: string;
  data: Calculation;
}

// Interface for calculations list response
interface CalculationsResponse {
  success: boolean;
  message: string;
  data: Calculation[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCalculations: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Interface for calculation stats
interface CalculationStats {
  totalCalculations: number;
  totalAmount: number;
  todayCalculations: number;
  monthlyCalculations: number;
}

interface CalculationStatsResponse {
  success: boolean;
  message: string;
  data: CalculationStats;
}

// Calculation API service
export const calculationAPI = {
  // Create a new calculation
  async createCalculation(calculationData: CalculationFormData): Promise<Calculation> {
    try {
      const response = await apiClient.post<CalculationResponse>('/calculations', calculationData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create calculation');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating calculation:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map((err: any) => err.msg).join(', ');
        throw new Error(`Validation error: ${errorMessages}`);
      } else {
        throw new Error(error.message || 'Failed to create calculation');
      }
    }
  },

  // Get all calculations with optional pagination and filters
  async getCalculations(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  }): Promise<{ calculations: Calculation[]; pagination?: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params?.search) queryParams.append('search', params.search);

      const response = await apiClient.get<CalculationsResponse>(`/calculations?${queryParams.toString()}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch calculations');
      }
      
      return {
        calculations: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error: any) {
      console.error('Error fetching calculations:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(error.message || 'Failed to fetch calculations');
      }
    }
  },

  // Get recent calculations for dashboard
  async getRecentCalculations(limit: number = 8): Promise<Calculation[]> {
    try {
      const response = await apiClient.get<CalculationsResponse>(`/calculations/recent?limit=${limit}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch recent calculations');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching recent calculations:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(error.message || 'Failed to fetch recent calculations');
      }
    }
  },

  // Get calculation by ID
  async getCalculationById(id: string): Promise<Calculation> {
    try {
      const response = await apiClient.get<CalculationResponse>(`/calculations/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch calculation');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching calculation:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(error.message || 'Failed to fetch calculation');
      }
    }
  },

  // Update calculation
  async updateCalculation(id: string, calculationData: CalculationFormData): Promise<Calculation> {
    try {
      const response = await apiClient.put<CalculationResponse>(`/calculations/${id}`, calculationData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update calculation');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating calculation:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map((err: any) => err.msg).join(', ');
        throw new Error(`Validation error: ${errorMessages}`);
      } else {
        throw new Error(error.message || 'Failed to update calculation');
      }
    }
  },

  // Delete calculation
  async deleteCalculation(id: string): Promise<void> {
    try {
      const response = await apiClient.delete<CalculationResponse>(`/calculations/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete calculation');
      }
    } catch (error: any) {
      console.error('Error deleting calculation:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(error.message || 'Failed to delete calculation');
      }
    }
  },

  // Get calculation statistics
  async getCalculationStats(): Promise<CalculationStats> {
    try {
      const response = await apiClient.get<CalculationStatsResponse>('/calculations/stats');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch calculation statistics');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching calculation stats:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(error.message || 'Failed to fetch calculation statistics');
      }
    }
  }
};