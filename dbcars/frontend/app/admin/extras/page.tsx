'use client';

import { useEffect, useState, useRef } from 'react';
import {
  getAdminExtras,
  createExtra,
  updateExtra,
  deleteExtra,
  uploadImage,
} from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Gift, 
  Plus, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  Euro,
  Tag,
  Calendar,
  CheckCircle2,
  XCircle,
  X,
  Save,
  Upload,
  MoreVertical
} from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import EmptyState from '@/components/admin/EmptyState';
import DragDropUpload from '@/components/admin/DragDropUpload';

export default function AdminExtrasPage() {
  const [extras, setExtras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExtra, setEditingExtra] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    price_type: 'per_rental' as 'per_rental' | 'per_day' | 'per_week',
    is_active: true,
    cover_image: '',
  });
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const [coverImageKey, setCoverImageKey] = useState(0);

  useEffect(() => {
    loadExtras();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        if (!menuRefs.current[openMenuId]?.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const loadExtras = async () => {
    setLoading(true);
    try {
      const data = await getAdminExtras();
      setExtras(data);
    } catch (error) {
      console.error('Error loading extras:', error);
      toast.error('Failed to load extras');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExtra) {
        await updateExtra(editingExtra.id, formData);
        toast.success('Extra updated successfully!');
      } else {
        await createExtra(formData);
        toast.success('Extra created successfully!');
      }
      setShowForm(false);
      setEditingExtra(null);
      resetForm();
      loadExtras();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error saving extra');
    }
  };

  const handleEdit = (extra: any) => {
    setEditingExtra(extra);
    setFormData({
      name: extra.name,
      description: extra.description || '',
      price: extra.price,
      price_type: extra.price_type,
      is_active: extra.is_active,
      cover_image: extra.cover_image || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this extra?')) return;
    try {
      await deleteExtra(id);
      toast.success('Extra deleted successfully');
      loadExtras();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error deleting extra');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      price_type: 'per_rental',
      is_active: true,
      cover_image: '',
    });
    setCoverImageKey((prev) => prev + 1);
  };

  const handleCoverImageUpload = async (files: File[]) => {
    const file = files?.[0];
    if (!file) return;

    setUploadingCoverImage(true);
    try {
      const imageUrl = await uploadImage(file);
      setFormData((prev) => ({ ...prev, cover_image: imageUrl }));
      toast.success('Cover image uploaded successfully');
    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast.error('Error uploading cover image');
    } finally {
      setUploadingCoverImage(false);
    }
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '');
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingExtra(null);
    resetForm();
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Extras Management</h1>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg">Manage additional services and extras for bookings</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingExtra(null);
            resetForm();
          }}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Extra
        </button>
      </div>

      {/* Extras List */}
      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm p-8">
          <LoadingSpinner size="md" text="Loading extras..." />
        </div>
      ) : extras.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <EmptyState
            icon={Gift}
            title="No extras found"
            description="Get started by adding your first extra service for bookings."
          />
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-800 hidden lg:table">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-24">
                    Cover Photo
                  </th>
                  <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-40">
                    Name
                  </th>
                  <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[300px]">
                    Description
                  </th>
                  <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-32">
                    Price
                  </th>
                  <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-36">
                    Price Type
                  </th>
                  <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-28">
                    Status
                  </th>
                  <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {extras.map((extra) => (
                  <tr key={extra.id} className="hover:bg-gray-800 transition-colors">
                    <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                      {extra.cover_image ? (
                        <div className="w-16 xl:w-20 h-12 xl:h-15 rounded-xl overflow-hidden border-2 border-gray-800 shadow-sm">
                          <img
                            src={getImageUrl(extra.cover_image) || ''}
                            alt={extra.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="60"%3E%3Crect fill="%23e5e7eb" width="80" height="60"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="10" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-16 xl:w-20 h-12 xl:h-15 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-2 border-gray-800 flex items-center justify-center">
                          <ImageIcon className="w-5 xl:w-6 h-5 xl:h-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 xl:px-6 py-3 xl:py-4">
                      <div className="text-sm xl:text-base font-bold text-white">{extra.name}</div>
                    </td>
                    <td className="px-4 xl:px-6 py-3 xl:py-4">
                      <div className="text-sm xl:text-base text-gray-400 max-w-lg break-words">
                        {extra.description || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Euro className="w-4 xl:w-5 h-4 xl:h-5 text-gray-400" />
                        <span className="text-sm xl:text-base font-bold text-white">
                          {formatCurrency(Number(extra.price))}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 xl:w-5 h-4 xl:h-5 text-gray-400" />
                        <span className="text-sm xl:text-base font-medium text-gray-300 capitalize">
                          {extra.price_type.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                      {extra.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2 xl:px-3 py-1 bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                          <CheckCircle2 className="w-3 xl:w-3.5 h-3 xl:h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 xl:px-3 py-1 bg-gradient-to-br from-red-900 to-rose-900 text-red-300 border border-red-800 rounded-full text-xs font-semibold">
                          <XCircle className="w-3 xl:w-3.5 h-3 xl:h-3.5" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className={`px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap ${openMenuId === extra.id ? 'relative z-50' : ''}`}>
                      <div className="relative" ref={(el) => { menuRefs.current[extra.id] = el; }}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === extra.id ? null : extra.id)}
                          className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === extra.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50 py-1">
                            <button
                              onClick={() => {
                                handleEdit(extra);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                handleDelete(extra.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="lg:hidden divide-y divide-gray-800">
            {extras.map((extra) => (
              <div key={extra.id} className="p-4">
                <div className="flex gap-4 mb-3">
                  <div className="flex-shrink-0">
                    {extra.cover_image ? (
                      <div className="w-24 h-18 rounded-xl overflow-hidden border-2 border-gray-800 shadow-sm">
                        <img
                          src={getImageUrl(extra.cover_image) || ''}
                          alt={extra.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="72"%3E%3Crect fill="%23e5e7eb" width="96" height="72"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="10" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-18 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-2 border-gray-800 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-gray-400" />
                        <h3 className="font-bold text-white text-lg">{extra.name}</h3>
                      </div>
                      {extra.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{extra.description || 'N/A'}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Euro className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-bold text-white">{formatCurrency(Number(extra.price))}</span>
                        <Tag className="w-3.5 h-3.5 text-gray-400 ml-2" />
                        <span className="text-gray-400 capitalize">{extra.price_type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`flex justify-end mt-3 ${openMenuId === `mobile-${extra.id}` ? 'relative z-50' : ''}`}>
                  <div className="relative" ref={(el) => { menuRefs.current[`mobile-${extra.id}`] = el; }}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === `mobile-${extra.id}` ? null : `mobile-${extra.id}`)}
                      className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {openMenuId === `mobile-${extra.id}` && (
                      <div className="absolute right-0 mt-1 w-40 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50 py-1">
                        <button
                          onClick={() => {
                            handleEdit(extra);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(extra.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extra Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          ></div>
          <div className="flex min-h-full items-center justify-center">
            <div
              className="relative bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-800 overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {editingExtra ? 'Edit Extra' : 'Add New Extra'}
                  </h2>
                </div>
                <button 
                  onClick={closeModal} 
                  className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    required
                    placeholder="e.g., GPS Navigation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                    rows={3}
                    placeholder="Enter extra description..."
                  />
                </div>

                <div>
                  <DragDropUpload
                    onFilesSelected={handleCoverImageUpload}
                    accept="image/*"
                    multiple={false}
                    disabled={uploadingCoverImage}
                    maxSize={5}
                    label="Cover Photo"
                    helperText="Displayed on booking page. Max 5MB."
                  />
                  {uploadingCoverImage && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Uploading...
                    </div>
                  )}
                  {formData.cover_image && (
                    <div className="mt-3">
                      <div className="relative w-full sm:w-48 h-48 sm:h-36 rounded-xl overflow-hidden border-2 border-gray-800 shadow-sm">
                        <img
                          src={getImageUrl(formData.cover_image) || ''}
                          alt="Cover"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23e5e7eb" width="200" height="150"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EInvalid Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Price (€) *</label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: parseFloat(e.target.value) })
                        }
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Price Type *
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={formData.price_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price_type: e.target.value as 'per_rental' | 'per_day' | 'per_week',
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800 text-white border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all appearance-none"
                        required
                      >
                        <option value="per_rental">Per Rental</option>
                        <option value="per_day">Per Day</option>
                        <option value="per_week">Per Week</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-orange-600 border-gray-700 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-300">Active</span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-gray-800">
                  <button
                    type="submit"
                    className="w-full sm:flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Save className="w-5 h-5" />
                    {editingExtra ? 'Update' : 'Create'} Extra
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full sm:flex-1 px-6 py-3 bg-gray-900 border border-gray-800 text-gray-300 rounded-xl hover:bg-gray-800 transition-all font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
