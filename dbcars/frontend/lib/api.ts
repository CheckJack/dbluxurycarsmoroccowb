import axios, { AxiosResponse } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Increase timeout to better accommodate booking flow (DB operations, pricing, etc.)
  // Axios timeouts trigger a client-side error with no `error.response`, which is what
  // we are currently seeing in the booking form logs.
  timeout: 15000, // 15 seconds
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors (connection refused, network unavailable, etc.)
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      // Only log in browser environment
      if (typeof window !== 'undefined') {
        // Only log once to reduce console noise
        if (!(window as any).__backendErrorLogged) {
          console.warn(
            `⚠️ Backend server not accessible at ${API_URL}. Please ensure the backend is running:`,
            '\n  1. Check if backend is running: cd dbcars/backend && npm run dev',
            '\n  2. Verify backend is accessible: curl http://localhost:3001/api/health',
            '\n  3. Check firewall/network settings'
          );
          (window as any).__backendErrorLogged = true;
        }
      }
      
      // Create a more helpful error message
      const networkError = new Error(
        `Cannot connect to backend server at ${API_URL}. Please ensure the backend is running.`
      );
      networkError.name = 'NetworkError';
      (networkError as any).code = error.code || 'ERR_NETWORK';
      return Promise.reject(networkError);
    }
    
    if (error.response) {
      // Handle 401 Unauthorized - token expired or invalid
      if (error.response.status === 401) {
        // Only handle redirect if we're in the browser and on an admin page
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          // Only redirect if we're on an admin page (not already on login)
          if (currentPath.startsWith('/admin') && !currentPath.startsWith('/admin/login')) {
            // Clear auth data
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            // Redirect to login
            window.location.href = '/admin/login';
            // Return a rejected promise to stop further processing
            return Promise.reject(new Error('Unauthorized - redirecting to login'));
          }
        }
      }
      
      // Server responded with error status
      // Only log non-401 errors to reduce console noise
      if (error.response.status !== 401) {
        console.error('API Error:', error.response.status, error.response.data);
        // Log more details for debugging
        if (error.response.status === 400) {
          console.error('Validation error details:', {
            status: error.response.status,
            data: error.response.data,
            url: error.config?.url,
            method: error.config?.method,
            requestData: error.config?.data
          });
        }
      }
      return Promise.reject(error);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response from server:', error.request);
      const timeoutError = new Error(
        `Cannot connect to backend server at ${API_URL}. Please ensure the backend is running:\n\n1. Navigate to: cd dbcars/backend\n2. Start server: npm run dev\n3. Verify: curl http://localhost:3001/api/health`
      );
      timeoutError.name = 'TimeoutError';
      (timeoutError as any).isNetworkError = true;
      return Promise.reject(timeoutError);
    } else {
      // Something else happened
      console.error('Request setup error:', error.message);
      return Promise.reject(error);
    }
  }
);

// Vehicles
export const getVehicles = async (filters?: {
  category?: string;
  location?: string;
  available_from?: string;
  available_to?: string;
  min_price?: number;
  max_price?: number;
}) => {
  const response = await api.get('/vehicles', { params: filters });
  return response.data;
};

export const getVehicle = async (id: string) => {
  const response = await api.get(`/vehicles/${id}`);
  return response.data;
};

export const checkAvailability = async (
  vehicleId: string,
  from: string,
  to: string
) => {
  const response = await api.get(`/vehicles/${vehicleId}/availability`, {
    params: { from, to },
  });
  return response.data;
};

export const getVehicleBlockedDates = async (
  vehicleId: string,
  month?: number,
  year?: number
) => {
  const response = await api.get(`/vehicles/${vehicleId}/blocked-dates`, {
    params: { month, year },
  });
  return response.data;
};

// Locations
export const getLocations = async () => {
  const response = await api.get('/locations');
  return response.data;
};

// Extras
export const getExtras = async () => {
  const response = await api.get('/extras');
  return response.data;
};

// Coupons
export const validateCoupon = async (
  code: string,
  totalAmount?: number,
  rentalDays?: number
) => {
  const response = await api.get(`/coupons/${code}`, {
    params: { total_amount: totalAmount, rental_days: rentalDays },
  });
  return response.data;
};

// Bookings
export const createBooking = async (bookingData: any) => {
  console.log('Sending booking data:', {
    vehicle_id: bookingData.vehicle_id,
    pickup_location_id: bookingData.pickup_location_id,
    dropoff_location_id: bookingData.dropoff_location_id,
    pickup_date: bookingData.pickup_date,
    dropoff_date: bookingData.dropoff_date,
    has_customer: !!bookingData.customer,
    customer_keys: bookingData.customer ? Object.keys(bookingData.customer) : [],
    extras_count: bookingData.extras?.length || 0,
    has_coupon: !!bookingData.coupon_code,
  });
  
  try {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  } catch (error: any) {
    console.error('API Error in createBooking:', error);
    console.error('Error response data:', error.response?.data);
    console.error('Error response status:', error.response?.status);
    console.error('Error response headers:', error.response?.headers);
    console.error('Full error object:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      } : null,
      request: error.request ? 'Request made but no response' : null
    });
    throw error;
  }
};

export const getBooking = async (bookingNumber: string) => {
  // URL encode the booking number to handle special characters like hyphens
  console.log('[API] getBooking called with:', bookingNumber);
  const encodedBookingNumber = encodeURIComponent(bookingNumber);
  console.log('[API] Encoded booking number:', encodedBookingNumber);
  console.log('[API] Full URL:', `/bookings/${encodedBookingNumber}`);
  const response = await api.get(`/bookings/${encodedBookingNumber}`);
  console.log('[API] Response received:', response.data.booking_number);
  return response.data;
};

// Drafts
export const getDrafts = async () => {
  const response = await api.get('/admin/drafts');
  return response.data;
};

export const getDraft = async (id: string) => {
  const response = await api.get(`/admin/drafts/${id}`);
  return response.data;
};

export const saveDraft = async (draftData: {
  id?: string;
  draft_data: any;
  customer_name?: string | null;
  vehicle_name?: string | null;
  total_price?: number | null;
}) => {
  const response = await api.post('/admin/drafts', draftData);
  return response.data;
};

export const deleteDraft = async (id: string) => {
  const response = await api.delete(`/admin/drafts/${id}`);
  return response.data;
};

// Auth
export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Admin
export const getAdminStatistics = async () => {
  const response = await api.get('/admin/statistics');
  return response.data;
};

export const getAdminBookings = async (filters?: {
  status?: string;
  vehicle_id?: string;
  date_from?: string;
  date_to?: string;
  booking_number?: string;
  customer_name?: string;
  vehicle_search?: string;
  page?: number;
  per_page?: number;
}) => {
  const response = await api.get('/admin/bookings', { params: filters });
  return response.data;
};

export const updateBookingStatus = async (id: string, status: string, notes?: string, payment_link?: string) => {
  const response = await api.put(`/admin/bookings/${id}`, { status, notes, payment_link });
  return response.data;
};

export const editBooking = async (id: string, data: { pickup_date?: string; dropoff_date?: string; extras?: any[] }) => {
  const response = await api.put(`/admin/bookings/${id}/edit`, data);
  return response.data;
};

export const getAdminVehicles = async () => {
  const response = await api.get('/admin/vehicles');
  return response.data;
};

export const createVehicle = async (vehicleData: any) => {
  const response = await api.post('/admin/vehicles', vehicleData);
  return response.data;
};

export const updateVehicle = async (id: string, vehicleData: any) => {
  const response = await api.put(`/admin/vehicles/${id}`, vehicleData);
  return response.data;
};

export const deleteVehicle = async (id: string) => {
  const response = await api.delete(`/admin/vehicles/${id}`);
  return response.data;
};

export const getAvailability = async (filters?: {
  vehicle_id?: string;
  month?: number;
  year?: number;
}) => {
  const response = await api.get('/admin/availability', { params: filters });
  return response.data;
};

export const getAvailabilityConflicts = async (filters?: {
  vehicle_id?: string;
  start_date?: string;
  end_date?: string;
}) => {
  const response = await api.get('/admin/availability/conflicts', { params: filters });
  return response.data;
};

export const getAvailabilityAnalytics = async (filters?: {
  vehicle_id?: string;
  start_date?: string;
  end_date?: string;
}) => {
  const response = await api.get('/admin/availability/analytics', { params: filters });
  return response.data;
};

export const exportAvailability = async (filters?: {
  vehicle_id?: string;
  start_date?: string;
  end_date?: string;
  format?: 'json' | 'csv';
}) => {
  if (filters?.format === 'csv') {
    const response = await axios.get(`${API_URL}/admin/availability/export`, {
      params: filters,
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    return response.data;
  } else {
    const response = await api.get('/admin/availability/export', {
      params: filters,
    });
    return response.data;
  }
};

export const getVehicleSubunits = async (vehicleId: string) => {
  const response = await api.get(`/admin/vehicles/${vehicleId}/subunits`);
  return response.data;
};

export const updateSubunitStatus = async (subunitId: string, status: string) => {
  const response = await api.put(`/admin/vehicle-subunits/${subunitId}/status`, { status });
  return response.data;
};

export const bulkUpdateSubunitStatus = async (subunitIds: string[], status: string) => {
  const response = await api.post('/admin/vehicle-subunits/bulk-status', {
    subunit_ids: subunitIds,
    status,
  });
  return response.data;
};

export const createAvailabilityNote = async (noteData: {
  vehicle_id?: string;
  vehicle_subunit_id?: string;
  note_date: string;
  note: string;
  note_type: 'maintenance' | 'blocked' | 'special';
}) => {
  const response = await api.post('/admin/availability-notes', noteData);
  return response.data;
};

export const updateAvailabilityNote = async (
  noteId: string,
  noteData: {
    note_date?: string;
    note?: string;
    note_type?: 'maintenance' | 'blocked' | 'special';
  }
) => {
  const response = await api.put(`/admin/availability-notes/${noteId}`, noteData);
  return response.data;
};

export const deleteAvailabilityNote = async (noteId: string) => {
  const response = await api.delete(`/admin/availability-notes/${noteId}`);
  return response.data;
};

export const logDamage = async (damageData: any) => {
  const response = await api.post('/admin/damage-logs', damageData);
  return response.data;
};

// Upload
export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  try {
  const response = await axios.post(`${API_URL}/upload/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
      timeout: 120000, // 120 seconds (2 minutes) timeout for large file uploads
  });

    if (!response.data || !response.data.url) {
      throw new Error('Invalid response from server');
    }

  // Return full URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
  return `${baseUrl}${response.data.url}`;
  } catch (error: any) {
    console.error('Upload error:', error);
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      // Timeout error
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(`Upload timeout. The file (${fileSizeMB}MB) may be too large or your connection is slow. Please try a smaller image or check your internet connection.`);
    }
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.error || error.response.data?.message || 'Failed to upload image';
      // Provide more helpful message for file size errors
      if (errorMessage.includes('too large') || errorMessage.includes('LIMIT_FILE_SIZE')) {
        throw new Error('File is too large. Maximum size is 20MB. Please compress the image and try again.');
      }
      throw new Error(errorMessage);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error: Could not connect to server. Please check your internet connection and try again.');
    } else {
      // Something else happened
      throw new Error(error.message || 'Failed to upload image');
    }
  }
};

export const uploadImages = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  try {
  const response = await axios.post(`${API_URL}/upload/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
      timeout: 120000, // 120 seconds (2 minutes) timeout for multiple file uploads
  });

    if (!response.data || !response.data.urls || !Array.isArray(response.data.urls)) {
      throw new Error('Invalid response from server');
    }

  // Return full URLs
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
  return response.data.urls.map((url: string) => `${baseUrl}${url}`);
  } catch (error: any) {
    console.error('Upload error:', error);
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      // Timeout error
      const totalSizeMB = files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);
      throw new Error(`Upload timeout. The files (${totalSizeMB.toFixed(2)}MB total) may be too large or your connection is slow. Please try smaller images or check your internet connection.`);
    }
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.error || error.response.data?.message || 'Failed to upload images';
      // Provide more helpful message for file size errors
      if (errorMessage.includes('too large') || errorMessage.includes('LIMIT_FILE_SIZE')) {
        throw new Error('One or more files are too large. Maximum size per file is 20MB. Please compress the images and try again.');
      }
      throw new Error(errorMessage);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error: Could not connect to server. Please check your internet connection and try again.');
    } else {
      // Something else happened
      throw new Error(error.message || 'Failed to upload images');
    }
  }
};

// Customers
export const searchCustomers = async (query: string) => {
  const response = await api.get('/admin/customers/search', { params: { q: query } });
  return response.data;
};

export const getAdminCustomers = async (filters?: {
  search?: string;
  blacklisted?: boolean;
}) => {
  const response = await api.get('/admin/customers', { params: filters });
  return response.data;
};

export const getAdminCustomer = async (id: string) => {
  const response = await api.get(`/admin/customers/${id}`);
  return response.data;
};

export const updateCustomerBlacklist = async (
  id: string,
  isBlacklisted: boolean,
  reason?: string
) => {
  const response = await api.put(`/admin/customers/${id}/blacklist`, {
    is_blacklisted: isBlacklisted,
    blacklist_reason: reason,
  });
  return response.data;
};

export const createCustomer = async (customerData: any) => {
  const response = await api.post('/admin/customers', customerData);
  return response.data;
};

export const updateCustomer = async (id: string, customerData: any) => {
  const response = await api.put(`/admin/customers/${id}`, customerData);
  return response.data;
};

// Users
export const getAdminUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const getAdminUser = async (id: string) => {
  const response = await api.get(`/admin/users/${id}`);
  return response.data;
};

export const createUser = async (userData: { email: string; password: string; name: string; role?: string }) => {
  const response = await api.post('/admin/users', userData);
  return response.data;
};

export const updateUser = async (id: string, userData: { email?: string; name?: string }) => {
  const response = await api.put(`/admin/users/${id}`, userData);
  return response.data;
};

export const updateUserPassword = async (id: string, password: string) => {
  const response = await api.put(`/admin/users/${id}/password`, { password });
  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

// Extras (Admin)
export const getAdminExtras = async () => {
  const response = await api.get('/admin/extras');
  return response.data;
};

export const getAdminExtra = async (id: string) => {
  const response = await api.get(`/admin/extras/${id}`);
  return response.data;
};

export const createExtra = async (extraData: {
  name: string;
  description?: string;
  price: number;
  price_type: 'per_rental' | 'per_day' | 'per_week';
  is_active?: boolean;
  cover_image?: string;
}) => {
  const response = await api.post('/admin/extras', extraData);
  return response.data;
};

export const updateExtra = async (
  id: string,
  extraData: {
    name?: string;
    description?: string;
    price?: number;
    price_type?: 'per_rental' | 'per_day' | 'per_week';
    is_active?: boolean;
    cover_image?: string;
  }
) => {
  const response = await api.put(`/admin/extras/${id}`, extraData);
  return response.data;
};

export const deleteExtra = async (id: string) => {
  const response = await api.delete(`/admin/extras/${id}`);
  return response.data;
};

// Blog Posts
export const getBlogPosts = async (publishedOnly: boolean = false) => {
  const response = await api.get('/blog', {
    params: { published_only: publishedOnly ? 'true' : 'false' },
  });
  return response.data;
};

export const getBlogPost = async (id: string) => {
  const response = await api.get(`/blog/${id}`);
  return response.data;
};

export const createBlogPost = async (postData: {
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  is_published?: boolean;
}) => {
  const response = await api.post('/blog', postData);
  return response.data;
};

export const updateBlogPost = async (
  id: string,
  postData: {
    title?: string;
    content?: string;
    excerpt?: string;
    featured_image?: string | null;
    cover_image?: string | null;
    hero_image?: string | null;
    is_published?: boolean;
  }
) => {
  const response = await api.put(`/blog/${id}`, postData);
  return response.data;
};

export const deleteBlogPost = async (id: string) => {
  const response = await api.delete(`/blog/${id}`);
  return response.data;
};

// Coupons (Admin)
export const getAdminCoupons = async () => {
  const response = await api.get('/admin/coupons');
  return response.data;
};

export const getAdminCoupon = async (id: string) => {
  const response = await api.get(`/admin/coupons/${id}`);
  return response.data;
};

export const createCoupon = async (couponData: {
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  minimum_rental_days?: number | null;
  minimum_amount?: number | null;
  valid_from: string;
  valid_until: string;
  usage_limit?: number | null;
  is_active?: boolean;
}) => {
  const response = await api.post('/admin/coupons', couponData);
  return response.data;
};

export const updateCoupon = async (
  id: string,
  couponData: {
    code?: string;
    description?: string;
    discount_type?: 'percentage' | 'fixed_amount';
    discount_value?: number;
    minimum_rental_days?: number | null;
    minimum_amount?: number | null;
    valid_from?: string;
    valid_until?: string;
    usage_limit?: number | null;
    is_active?: boolean;
  }
) => {
  const response = await api.put(`/admin/coupons/${id}`, couponData);
  return response.data;
};

export const toggleCouponStatus = async (id: string) => {
  const response = await api.put(`/admin/coupons/${id}/toggle`);
  return response.data;
};

export const deleteCoupon = async (id: string) => {
  const response = await api.delete(`/admin/coupons/${id}`);
  return response.data;
};

// Locations (Admin)
export const getAdminLocations = async () => {
  const response = await api.get('/admin/locations');
  return response.data;
};

export const getAdminLocation = async (id: string) => {
  const response = await api.get(`/admin/locations/${id}`);
  return response.data;
};

export const createLocation = async (locationData: {
  name: string;
  address: string;
  city: string;
  country?: string;
  phone?: string;
  email?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_active?: boolean;
}) => {
  const response = await api.post('/admin/locations', locationData);
  return response.data;
};

export const updateLocation = async (
  id: string,
  locationData: {
    name?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    latitude?: number | null;
    longitude?: number | null;
    is_active?: boolean;
  }
) => {
  const response = await api.put(`/admin/locations/${id}`, locationData);
  return response.data;
};

export const toggleLocationStatus = async (id: string) => {
  const response = await api.put(`/admin/locations/${id}/toggle`);
  return response.data;
};

export const deleteLocation = async (id: string) => {
  const response = await api.delete(`/admin/locations/${id}`);
  return response.data;
};

// Contact
export const submitContactForm = async (contactData: {
  name: string;
  email: string;
  message: string;
}) => {
  const response = await api.post('/contact', contactData);
  return response.data;
};

export default api;

