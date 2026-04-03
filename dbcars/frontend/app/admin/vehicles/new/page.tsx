'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createVehicle, uploadImage, getExtras, getLocations } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Car, 
  X, 
  Upload, 
  Image as ImageIcon,
  Tag,
  Euro,
  MapPin,
  Settings,
  FileText,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Trash2,
  Save,
  ArrowLeft
} from 'lucide-react';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import DragDropUpload from '@/components/admin/DragDropUpload';

export default function NewVehiclePage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [extras, setExtras] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    category: 'luxury_sedans',
    description: '',
    seats: 4,
    transmission: 'automatic',
    fuel_type: 'gasoline',
    color: '',
    features: [] as string[],
    images: [] as string[],
    available_extras: [] as string[],
    base_price_daily: 0,
    base_price_weekly: 0,
    base_price_monthly: 0,
    base_price_hourly: 0,
    minimum_rental_days: 1,
    minimum_age: 25,
    is_active: true,
    license_plate: '',
    vin: '',
    location_id: '',
    mileage: 0,
  });

  useEffect(() => {
    loadExtras();
    loadLocations();
  }, []);

  const loadExtras = async () => {
    try {
      const data = await getExtras();
      setExtras(data);
    } catch (error) {
      console.error('Error loading extras:', error);
    }
  };

  const loadLocations = async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.license_plate || formData.license_plate.trim() === '') {
      toast.error('License plate is required to create a vehicle. Please add vehicle unit information.');
      return;
    }
    
    try {
      await createVehicle(formData);
      toast.success('Vehicle created successfully!');
      router.push('/admin/vehicles');
    } catch (error) {
      console.error('Error saving vehicle:', error);
      let message = 'Error saving vehicle.';

      const anyError = error as any;
      const data = anyError?.response?.data;

      if (data) {
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          const details = data.errors
            .map((e: any) => {
              const field = e.path || e.param || 'field';
              const msg = e.msg || 'is invalid';
              return `${field}: ${msg}`;
            })
            .join(', ');
          message = `Please fix the following: ${details}`;
        } else if (typeof data.error === 'string') {
          message = data.error;
        }
      }

      toast.error(message);
    }
  };

  const handleExtraToggle = (extraId: string) => {
    setFormData((prev) => {
      const currentExtras = prev.available_extras || [];
      if (currentExtras.includes(extraId)) {
        return {
          ...prev,
          available_extras: currentExtras.filter((id) => id !== extraId),
        };
      } else {
        return {
          ...prev,
          available_extras: [...currentExtras, extraId],
        };
      }
    });
  };

  const handleImageUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map((file) => uploadImage(file));
      const uploadedUrls = await Promise.all(uploadPromises);

      const newImages = uploadedUrls.filter((url) => !formData.images.includes(url));
      setFormData({
        ...formData,
        images: [...formData.images, ...newImages],
      });
      toast.success(`${newImages.length} image(s) uploaded successfully`);
    } catch (error: any) {
      console.error('Image upload error:', error);
      const errorMessage = error?.message || error?.response?.data?.error || 'Error uploading image(s)';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
    toast.success('Image removed');
  };

  const setCoverPhoto = (index: number) => {
    if (index === 0) return;
    const newImages = [...formData.images];
    const [coverImage] = newImages.splice(index, 1);
    newImages.unshift(coverImage);
    setFormData({
      ...formData,
      images: newImages,
    });
    toast.success('Cover photo updated');
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formData.images.length - 1) return;
    
    const newImages = [...formData.images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setFormData({
      ...formData,
      images: newImages,
    });
  };

  return (
    <>
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Add New Vehicle</h1>
            <p className="text-gray-400 text-sm sm:text-base md:text-lg">Create a new vehicle for your fleet</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 transition-all font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-gray-300 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-white">Basic Information</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Make *</label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                required
                placeholder="e.g., Mercedes-Benz"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Model *</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                required
                placeholder="e.g., C-Class"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Year *</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                required
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Category *</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 text-white border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all appearance-none"
                  required
                >
                  <option value="luxury_sedans">Luxury Sedans</option>
                  <option value="economic">Economic</option>
                  <option value="sportscars">Sportscars</option>
                  <option value="supercars">Supercars</option>
                  <option value="suvs">SUVs</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Daily Price (€) *
              </label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={formData.base_price_daily}
                  onChange={(e) =>
                    setFormData({ ...formData, base_price_daily: parseFloat(e.target.value) })
                  }
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  required
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Seats</label>
              <input
                type="number"
                value={formData.seats}
                onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                min="1"
                max="20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Transmission *</label>
              <div className="relative">
                <Settings className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.transmission}
                  onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 text-white border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all appearance-none"
                  required
                >
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Fuel Type *</label>
              <div className="relative">
                <Settings className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.fuel_type}
                  onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 text-white border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all appearance-none"
                  required
                >
                  <option value="gasoline">Gasoline</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="e.g., Black, White, Red"
                className="w-full px-4 py-2.5 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
              rows={3}
              placeholder="Enter vehicle description..."
            />
          </div>
        </div>

        {/* Available Extras */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-white">Available Extras</h3>
          </div>
          <div className="border-2 border-gray-800 rounded-xl p-3 sm:p-4 max-h-64 overflow-y-auto">
            {extras.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No extras available. Add extras first.</p>
            ) : (
              <div className="space-y-2">
                {extras.map((extra) => (
                  <label
                    key={extra.id}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-gray-800 p-3 rounded-xl border border-gray-800 hover:border-orange-300 transition-all group"
                  >
                    <input
                      type="checkbox"
                      checked={formData.available_extras?.includes(extra.id) || false}
                      onChange={() => handleExtraToggle(extra.id)}
                      className="w-5 h-5 text-orange-600 border-gray-700 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-300 flex-1">
                      {extra.name}
                    </span>
                    <span className="text-sm font-bold text-white">
                      €{Number(extra.price).toFixed(2)} ({extra.price_type})
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {formData.available_extras && formData.available_extras.length > 0 && (
            <p className="text-xs text-gray-500 mt-3 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
              {formData.available_extras.length} extra{formData.available_extras.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Vehicle Unit Information */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Vehicle Unit Information
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                A vehicle unit is required to make this vehicle available for booking
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                License Plate <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.license_plate}
                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                required
                placeholder="e.g., ABC-123"
              />
              <p className="text-xs text-gray-500 mt-1">
                Required to create the first vehicle unit
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">VIN</label>
              <input
                type="text"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                placeholder="Vehicle Identification Number"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.location_id}
                  onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 text-white border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all appearance-none"
                >
                  <option value="">Select Location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} - {location.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Mileage (km)</label>
              <input
                type="number"
                value={formData.mileage}
                onChange={(e) =>
                  setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2.5 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                min="0"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Images Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-white">Images</h3>
          </div>
          <div className="space-y-4">
            <DragDropUpload
              onFilesSelected={handleImageUpload}
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              multiple={true}
              disabled={uploading}
              maxSize={5}
              helperText="Select one or more images (JPEG, PNG, GIF, WebP). Max 5MB per image."
            />
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Uploading images...
              </div>
            )}
            
            {formData.images.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-300">
                    {formData.images.length} image{formData.images.length !== 1 ? 's' : ''} added
                  </p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    First image is the cover photo
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formData.images.map((imageUrl, index) => {
                    const isCover = index === 0;
                    return (
                      <div
                        key={index}
                        className={`relative border-2 rounded-xl overflow-hidden shadow-sm transition-all ${
                          isCover ? 'border-blue-500 shadow-md ring-2 ring-blue-200' : 'border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        {isCover && (
                          <div className="absolute top-2 left-2 z-20">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold shadow-lg">
                              Cover Photo
                            </span>
                          </div>
                        )}

                        <img
                          src={imageUrl}
                          alt={`Vehicle image ${index + 1}`}
                          className="w-full h-40 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EInvalid Image%3C/text%3E%3C/svg%3E';
                          }}
                        />

                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center group pointer-events-none">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 pointer-events-auto">
                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => setCoverPhoto(index)}
                                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg text-xs font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-md"
                                title="Set as cover photo"
                              >
                                Set Cover
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg text-xs font-semibold hover:from-red-700 hover:to-red-600 transition-all shadow-md"
                              title="Remove image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-900 border-t border-gray-800">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-gray-500 truncate flex-1" title={imageUrl}>
                              {imageUrl.length > 25 ? `${imageUrl.substring(0, 25)}...` : imageUrl}
                            </p>
                            <span className="text-xs font-bold text-gray-400 ml-2">
                              #{index + 1}
                            </span>
                          </div>
                          
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => moveImage(index, 'up')}
                              disabled={index === 0}
                              className={`flex-1 px-2 py-1 text-xs rounded-lg font-semibold transition-all ${
                                index === 0
                                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                              title="Move up"
                            >
                              <ArrowUp className="w-3 h-3 mx-auto" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImage(index, 'down')}
                              disabled={index === formData.images.length - 1}
                              className={`flex-1 px-2 py-1 text-xs rounded-lg font-semibold transition-all ${
                                index === formData.images.length - 1
                                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                              title="Move down"
                            >
                              <ArrowDown className="w-3 h-3 mx-auto" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              <Save className="w-5 h-5" />
              Create Vehicle
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-900 border border-gray-800 text-gray-300 rounded-xl hover:bg-gray-800 transition-all font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md w-full sm:w-auto"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
