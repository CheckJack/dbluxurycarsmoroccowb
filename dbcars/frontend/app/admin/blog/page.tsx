'use client';

import { useEffect, useState, useRef } from 'react';
import {
  getBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  uploadImage,
} from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  FileText,
  Plus,
  Image as ImageIcon,
  Calendar,
  Save,
  X,
  Type,
  AlignLeft,
  ImageIcon as ImageIconAlt
} from 'lucide-react';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import EmptyState from '@/components/admin/EmptyState';
import RichTextEditor from '@/components/admin/RichTextEditor';
import DragDropUpload from '@/components/admin/DragDropUpload';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  cover_image?: string;
  hero_image?: string;
  is_published: boolean;
  created_at: string;
  updated_at?: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    featured_image: '',
    cover_image: '',
    hero_image: '',
    is_published: false,
  });
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [coverImageKey, setCoverImageKey] = useState(0);
  const [heroImageKey, setHeroImageKey] = useState(0);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (openMenuId) {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [openMenuId]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await getBlogPosts(false);
      setPosts(data);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      toast.error('Error loading blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        featured_image: post.featured_image || '',
        cover_image: post.cover_image || post.featured_image || '',
        hero_image: post.hero_image || '',
        is_published: post.is_published || false,
      });
    } else {
      setEditingPost(null);
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        featured_image: '',
        cover_image: '',
        hero_image: '',
        is_published: false,
      });
    }
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPost(null);
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      featured_image: '',
      cover_image: '',
      hero_image: '',
      is_published: false,
    });
    setCoverImageKey((prev) => prev + 1);
    setHeroImageKey((prev) => prev + 1);
  };

  const handleCoverImageUpload = async (files: File[]) => {
    const file = files?.[0];
    if (!file) return;

    setUploadingCoverImage(true);
    try {
      const imageUrl = await uploadImage(file);
      setFormData((prev) => ({ ...prev, cover_image: imageUrl, featured_image: imageUrl }));
      toast.success('Cover image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading cover image:', error);
      const errorMessage = error?.message || error?.response?.data?.error || 'Error uploading cover image';
      toast.error(errorMessage);
    } finally {
      setUploadingCoverImage(false);
    }
  };

  const handleHeroImageUpload = async (files: File[]) => {
    const file = files?.[0];
    if (!file) return;

    setUploadingHeroImage(true);
    try {
      const imageUrl = await uploadImage(file);
      setFormData((prev) => ({ ...prev, hero_image: imageUrl }));
      toast.success('Hero image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading hero image:', error);
      const errorMessage = error?.message || error?.response?.data?.error || 'Error uploading hero image';
      toast.error(errorMessage);
    } finally {
      setUploadingHeroImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPost) {
        // Convert empty strings to null for image fields when updating
        const updateData = {
          ...formData,
          cover_image: formData.cover_image === '' ? null : formData.cover_image,
          hero_image: formData.hero_image === '' ? null : formData.hero_image,
          featured_image: formData.featured_image === '' ? null : formData.featured_image,
        };
        await updateBlogPost(editingPost.id, updateData);
        toast.success('Blog post updated successfully');
      } else {
        await createBlogPost(formData);
        toast.success('Blog post created successfully');
      }
      handleCloseModal();
      loadPosts();
    } catch (error: unknown) {
      console.error('Error saving blog post:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      toast.error(errorMessage || 'Error saving blog post');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
      await deleteBlogPost(id);
      toast.success('Blog post deleted successfully');
      loadPosts();
    } catch (error: unknown) {
      console.error('Error deleting blog post:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      toast.error(errorMessage || 'Error deleting blog post');
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      await updateBlogPost(post.id, {
        is_published: !post.is_published,
      });
      toast.success(post.is_published ? 'Blog post unpublished' : 'Blog post published');
      loadPosts();
    } catch (error: unknown) {
      console.error('Error updating post status:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      toast.error(errorMessage || 'Error updating post status');
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Blog Posts</h1>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg">Manage and publish blog posts</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-semibold shadow-sm hover:shadow-md flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm p-8">
          <LoadingSpinner size="md" text="Loading blog posts..." />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <EmptyState
            icon={FileText}
            title="No blog posts found"
            description="No blog posts have been created yet."
          />
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800 hidden lg:table">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Cover Photo
                  </th>
                  <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {posts.map((post) => (
                  <tr key={post.id} className="relative">
                    <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                      {(post.cover_image || post.featured_image) ? (
                        <div className="relative w-16 h-16 xl:w-20 xl:h-20 rounded-xl overflow-hidden border border-gray-800">
                          <img
                            src={post.cover_image || post.featured_image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 xl:w-20 xl:h-20 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-800">
                          <ImageIcon className="w-4 xl:w-6 h-4 xl:h-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 xl:px-6 py-3 xl:py-4">
                      <div className="flex items-start gap-2 xl:gap-3">
                        <div className="p-1 xl:p-1.5 bg-gray-800 rounded-lg">
                          <FileText className="w-3 xl:w-3.5 h-3 xl:h-3.5 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs xl:text-sm font-medium text-white">{post.title}</div>
                          {post.excerpt && (
                            <div className="text-xs xl:text-sm text-gray-500 truncate max-w-md mt-1">
                              {post.excerpt}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                      {post.is_published ? (
                        <span className="px-2 xl:px-3 py-1 text-xs font-semibold rounded-full border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-700 shadow-sm inline-flex items-center gap-1.5">
                          <Eye className="w-3 xl:w-3.5 h-3 xl:h-3.5" />
                          Published
                        </span>
                      ) : (
                        <span className="px-2 xl:px-3 py-1 text-xs font-semibold rounded-full border border-gray-800 bg-gradient-to-br from-gray-800 to-slate-800 text-gray-300 shadow-sm inline-flex items-center gap-1.5">
                          <EyeOff className="w-3 xl:w-3.5 h-3 xl:h-3.5" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 xl:w-4 h-3.5 xl:h-4 text-gray-400" />
                        <span className="text-xs xl:text-sm text-gray-400">{formatDate(post.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap relative">
                      <div className="relative" ref={(el) => { menuRefs.current[post.id] = el; }}>
                        <button
                          ref={(el) => { buttonRefs.current[post.id] = el; }}
                          onClick={(e) => {
                            const button = e.currentTarget;
                            const rect = button.getBoundingClientRect();
                            setMenuPosition({
                              top: rect.bottom + 4,
                              left: rect.right - 176, // 176px = w-44 (11rem)
                            });
                            setOpenMenuId(openMenuId === post.id ? null : post.id);
                          }}
                          className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === post.id && menuPosition && (
                          <div 
                            data-menu-id={post.id}
                            className="fixed w-44 bg-gray-900 border border-gray-800 rounded-xl shadow-lg z-[9999] py-1"
                            style={{
                              top: `${menuPosition.top}px`,
                              left: `${menuPosition.left}px`,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                handleTogglePublish(post);
                                setOpenMenuId(null);
                                setMenuPosition(null);
                              }}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-800 flex items-center gap-2 ${
                                post.is_published ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {post.is_published ? (
                                <>
                                  <EyeOff className="w-4 h-4" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4" />
                                  Publish
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenModal(post);
                                setOpenMenuId(null);
                                setMenuPosition(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleDelete(post.id);
                                setOpenMenuId(null);
                                setMenuPosition(null);
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
            {posts.map((post) => (
              <div key={post.id} className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {(post.cover_image || post.featured_image) ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-800 flex-shrink-0">
                      <img
                        src={post.cover_image || post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-800 flex-shrink-0">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{post.title}</h3>
                        {post.excerpt && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{post.excerpt}</p>
                        )}
                      </div>
                      <div className="relative" ref={(el) => { menuRefs.current[post.id] = el; }}>
                        <button
                          ref={(el) => { buttonRefs.current[`mobile-${post.id}`] = el; }}
                          onClick={(e) => {
                            const button = e.currentTarget;
                            const rect = button.getBoundingClientRect();
                            setMenuPosition({
                              top: rect.bottom + 4,
                              left: rect.right - 176, // 176px = w-44 (11rem)
                            });
                            setOpenMenuId(openMenuId === post.id ? null : post.id);
                          }}
                          className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === post.id && menuPosition && (
                          <div 
                            data-menu-id={post.id}
                            className="fixed w-44 bg-gray-900 border border-gray-800 rounded-xl shadow-lg z-[9999] py-1"
                            style={{
                              top: `${menuPosition.top}px`,
                              left: `${menuPosition.left}px`,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                handleTogglePublish(post);
                                setOpenMenuId(null);
                                setMenuPosition(null);
                              }}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-800 flex items-center gap-2 ${
                                post.is_published ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {post.is_published ? (
                                <>
                                  <EyeOff className="w-4 h-4" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4" />
                                  Publish
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenModal(post);
                                setOpenMenuId(null);
                                setMenuPosition(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleDelete(post.id);
                                setOpenMenuId(null);
                                setMenuPosition(null);
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
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                  <div className="flex items-center gap-2">
                    {post.is_published ? (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-700 shadow-sm inline-flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        Published
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full border border-gray-800 bg-gradient-to-br from-gray-800 to-slate-800 text-gray-300 shadow-sm inline-flex items-center gap-1.5">
                        <EyeOff className="w-3.5 h-3.5" />
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">{formatDate(post.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 z-50 overflow-y-auto">
          <div className="min-h-screen">
            {/* Header - Sticky */}
            <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-800 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 shadow-sm z-50">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                {editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h2>
              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 sm:py-3 bg-gray-900 border border-gray-800 text-gray-300 rounded-xl hover:bg-gray-800 transition-all text-sm sm:text-base font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  <X className="w-4 sm:w-5 h-4 sm:h-5" />
                  Cancel
                </button>
                <button
                  type="submit"
                  form="blog-post-form"
                  className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all text-sm sm:text-base font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Save className="w-4 sm:w-5 h-4 sm:h-5" />
                  {editingPost ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-5xl">
              <form id="blog-post-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="bg-gray-900 p-3 sm:p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-800">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
                    Title *
                  </label>
                  <div className="relative">
                    <Type className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="bg-gray-900 p-3 sm:p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-800">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
                    Excerpt
                  </label>
                  <div className="relative">
                    <AlignLeft className="absolute left-2 sm:left-3 top-2.5 sm:top-3 w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      rows={3}
                      className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                      placeholder="Short description of the post..."
                    />
                  </div>
                </div>

                <div className="bg-gray-900 p-3 sm:p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-800">
                  <DragDropUpload
                    onFilesSelected={handleCoverImageUpload}
                    accept="image/*"
                    multiple={false}
                    disabled={uploadingCoverImage}
                    maxSize={20}
                    label="Cover Image"
                    helperText="Displayed on blog listing page. Max 20MB."
                  />
                  {uploadingCoverImage && (
                    <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Uploading...
                    </div>
                  )}
                  {formData.cover_image && (
                    <div className="mt-4 relative">
                      <img
                        src={formData.cover_image}
                        alt="Cover"
                        className="w-full sm:max-w-md h-32 sm:h-48 object-cover rounded-xl border border-gray-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, cover_image: '', featured_image: '' }));
                          toast.success('Cover image removed');
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                        title="Remove cover image"
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-gray-900 p-3 sm:p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-800">
                  <DragDropUpload
                    onFilesSelected={handleHeroImageUpload}
                    accept="image/*"
                    multiple={false}
                    disabled={uploadingHeroImage}
                    maxSize={20}
                    label="Hero Image"
                    helperText="Displayed on individual blog post hero section. Max 20MB."
                  />
                  {uploadingHeroImage && (
                    <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Uploading...
                    </div>
                  )}
                  {formData.hero_image && (
                    <div className="mt-4 relative">
                      <img
                        src={formData.hero_image}
                        alt="Hero"
                        className="w-full sm:max-w-md h-32 sm:h-48 object-cover rounded-xl border border-gray-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, hero_image: '' }));
                          toast.success('Hero image removed');
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                        title="Remove hero image"
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-gray-900 p-3 sm:p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-800">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
                    Content *
                  </label>
                  <RichTextEditor
                    content={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    placeholder="Write your blog post content here..."
                  />
                </div>

                <div className="bg-gray-900 p-3 sm:p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-800">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_published"
                      checked={formData.is_published}
                      onChange={(e) =>
                        setFormData({ ...formData, is_published: e.target.checked })
                      }
                      className="h-4 sm:h-5 w-4 sm:w-5 text-orange-600 focus:ring-orange-500 border-gray-700 rounded"
                    />
                    <label htmlFor="is_published" className="ml-2 sm:ml-3 block text-xs sm:text-sm font-semibold text-white">
                      Publish immediately
                    </label>
                  </div>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
