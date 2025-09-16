'use client';

import { useState, useEffect } from 'react';
import TableSkeleton from '@/components/main/TableSkeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { auth, firestore } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface CategoryOption {
  optionId?: number;
  optionName: string;
}

interface Category {
  categoryId?: number;
  categoryName: string;
  options: CategoryOption[];
}

export default function ManageCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState<number | null>(null);
  const [deleteErrorType, setDeleteErrorType] = useState<"none" | "foreignKeyBlocked" | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loadingAccess, setLoadingAccess] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        const docRef = doc(firestore, "adminemail", user.email);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserRole(docSnap.data().role);
        } else {
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      setLoadingAccess(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const CACHE_KEY = 'cachedCategories';
    const CACHE_EXPIRATION_TIME = 60 * 60 * 1000; // 1 hour in milliseconds

    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_EXPIRATION_TIME) {
        setCategories(data);
        setLoading(false);
        console.log('Categories loaded from cache in manage-categories.');
        return; // Use cached data and exit
      }
    }

    try {
      const res = await fetch('/api/categories');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data: Category[] = await res.json();
      setCategories(data);
      console.log('Categories fetched and set:', data);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unexpected error occurred.");
      }
      console.error("Failed to fetch categories:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setCurrentCategory({ categoryName: '', options: [] });
    setError(null);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setCurrentCategory({ ...category });
    setError(null);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = (categoryId: number) => {
    setCategoryToDeleteId(categoryId);
    setShowDeleteConfirmModal(true);
    setDeleteErrorType("none");
  };

  const confirmDeleteCategory = async (forceDelete: boolean = false) => {
    if (categoryToDeleteId === null) return;

    let operationSuccessful = false; // Flag to track if the main operation was successful
    try {
      const res = await fetch('/api/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: categoryToDeleteId, forceDelete }), // Add forceDelete flag
      });

      if (!res.ok) {
        // Attempt to parse error response if available
        const errorData = await res.json().catch(() => ({ message: res.statusText, code: null })); // Ensure code is initialized
        const errorMessage = errorData.message || res.statusText;
        const errorCode = errorData.code; // Extract code if available

        // Check for specific foreign key constraint error (based on your console output)
        if (errorMessage.includes('violates foreign key constraint') || (errorCode === '23503')) {
          setDeleteErrorType("foreignKeyBlocked");
          setError("This deletion affects the database, because this category is used in some hostels. If you want to delete the category, remove the category from the hostels and then delete the category."); // Set the specific error message
          return; // Prevent further execution, keep modal open
        } else {
          throw new Error(`HTTP error! status: ${res.status} - ${errorMessage}`);
        }
      }
      localStorage.removeItem('cachedCategories'); // Invalidate cache
      setCategories(categories.filter((c) => c.categoryId !== categoryToDeleteId));
      fetchCategories(); // Re-fetch categories to ensure UI is updated
      operationSuccessful = true; // Set flag to true on successful operation

    } catch (e: any) {
      // This catch block will now primarily handle network errors or other unexpected errors
      // not explicitly handled by the !res.ok branch.
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unexpected error occurred.");
      }
      console.error("Failed to delete category:", e);
      setShowDeleteConfirmModal(false); // Close modal for generic errors
      setCategoryToDeleteId(null);      // Clear id for generic errors
      setDeleteErrorType("none");      // Reset type for generic errors
    } finally {
      // This finally block now handles modal closing only if it wasn't a foreignKeyBlocked scenario
      // and the operation was successful.
      if (operationSuccessful) {
        setShowDeleteConfirmModal(false);
        setCategoryToDeleteId(null);
        setDeleteErrorType("none"); // Reset after successful delete
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setCategoryToDeleteId(null);
    setDeleteErrorType("none"); // Reset on cancel
    setError(null); // Clear any displayed error message
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory) return;

    const method = currentCategory.categoryId ? 'PUT' : 'POST';
    const url = '/api/categories';

    console.log('Sending category data:', JSON.stringify(currentCategory, null, 2));

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentCategory),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      localStorage.removeItem('cachedCategories');
      fetchCategories();
      setIsModalOpen(false);
      setCurrentCategory(null);
    } catch (e: any) {
      setError(e.message);
      console.error("Failed to save category:", e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentCategory((prev) => {
      if (!prev) return null;
      return { ...prev, [name]: value };
    });
  };

  const handleOptionChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentCategory((prev) => {
      if (!prev) return null;
      const updatedOptions = [...prev.options];
      updatedOptions[index] = { ...updatedOptions[index], [name]: value };
      return { ...prev, options: updatedOptions };
    });
  };

  const handleAddOption = () => {
    setCurrentCategory((prev) => {
      if (!prev) return null;
      return { ...prev, options: [...prev.options, { optionName: '' }] };
    });
  };

  const handleRemoveOption = (index: number) => {
    setCurrentCategory((prev) => {
      if (!prev) return null;
      const updatedOptions = prev.options.filter((_, i) => i !== index);
      return { ...prev, options: updatedOptions };
    });
  };

  if (loadingAccess) return <div className="text-center py-8">Checking admin access...</div>;
  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return <div className="text-red-600 text-center py-8">Access denied. Admins or Super Admins only.</div>;
  }

  if (loading) return <TableSkeleton />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 p-4 md:p-6">
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <h1 className="text-3xl font-bold mb-6">Manage Categories</h1>

        <button
          onClick={handleAddCategory}
          className="bg-blue-600 text-white px-4 py-2 rounded-md mb-4 hover:bg-blue-700 w-full md:w-auto"
        >
          Add New Category
        </button>

        <div className="bg-white shadow-md rounded-lg p-4 md:p-6 overflow-x-auto">
          <Table className="min-w-full divide-y divide-gray-200">
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category Name</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Options</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <TableRow key={category.categoryId}>
                  <TableCell className="px-6 py-4 text-sm font-medium text-gray-900">{category.categoryName}</TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500 overflow-hidden text-ellipsis">
                    {category.options.map(o => o.optionName).join(', ')}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => category.categoryId && handleDeleteCategory(category.categoryId)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold mb-4">{currentCategory?.categoryId ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveCategory}>
              {/* Error message display */}
              {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
              <div className="mb-4">
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">Category Name</label>
                <input
                  type="text"
                  id="categoryName"
                  name="categoryName"
                  value={currentCategory?.categoryName || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>

              <h3 className="text-lg font-bold mb-2">Options</h3>
              {currentCategory?.options.map((option, index) => (
                <div key={index} className="flex flex-col sm:flex-row mb-2 items-center w-full">
                  <input
                    type="text"
                    name="optionName"
                    value={option.optionName || ''}
                    onChange={(e) => handleOptionChange(index, e)}
                    className="flex-1 border border-gray-300 rounded-md shadow-sm p-2 mr-2 w-full mb-2 sm:mb-0"
                    placeholder="Option Name"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 w-full sm:w-auto"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddOption}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 mb-4 w-full sm:w-auto"
              >
                Add Option
              </button>

              <DialogFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full sm:w-auto"
                >
                  Save Category
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold mb-4">
                {deleteErrorType === "foreignKeyBlocked" ? "Deletion Blocked" : "Confirm Delete"}
              </DialogTitle>
            </DialogHeader>
            <p className="mb-4">
              {deleteErrorType === "foreignKeyBlocked"
                ? error // Display the specific error message from state
                : "Are you sure you want to delete this category? This action cannot be undone."}
            </p>
            <DialogFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={cancelDelete}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 w-full sm:w-auto"
              >
                Cancel
              </button>
              {deleteErrorType !== "foreignKeyBlocked" && ( // Only show Delete button if not blocked
                <button
                  type="button"
                  onClick={() => confirmDeleteCategory(false)} // Regular delete
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 w-full sm:w-auto"
                >
                  Delete
                </button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 