import { useState } from 'react';
import { Package } from 'lucide-react';
import { inventoryAPI } from '../services/api';
import useDataManager from '../hooks/useDataManager';
import useFormManager from '../hooks/useFormManager';

// Import our new components
import InventoryTabs from '../components/inventory/InventoryTabs';
import ProductForm from '../components/inventory/ProductForm';
import CategoryForm from '../components/inventory/CategoryForm';

const InventoryPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // Use data manager hooks for products and categories
  const {
    data: products,
    loading: productsLoading,
    createItem: createProduct,
    updateItem: updateProduct,
    deleteItem: deleteProduct,
    refresh: refreshProducts
  } = useDataManager({
    fetchFn: inventoryAPI.products.get,
    createFn: inventoryAPI.products.create,
    updateFn: inventoryAPI.products.update,
    deleteFn: inventoryAPI.products.delete,
    entityName: 'product'
  });

  const {
    data: categories,
    loading: categoriesLoading,
    createItem: createCategory,
    updateItem: updateCategory,
    deleteItem: deleteCategory
  } = useDataManager({
    fetchFn: inventoryAPI.categories.get,
    createFn: inventoryAPI.categories.create,
    updateFn: inventoryAPI.categories.update,
    deleteFn: inventoryAPI.categories.delete,
    entityName: 'category'
  });

  const loading = productsLoading || categoriesLoading;

  // Filter products based on search criteria
  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || product.category?._id === selectedCategory;
    const matchesCondition = !selectedCondition || selectedCondition === 'all' || product.condition === selectedCondition;
    
    return matchesCategory && matchesCondition;
  });

  // Form validation rules
  const productValidationRules = {
    name: { required: true, label: 'Product Name', minLength: 2 },
    category: { required: true, label: 'Category' },
    rentalPrice: { required: true, number: true, min: 0, label: 'Rental Price' },
    purchasePrice: { number: true, min: 0, label: 'Purchase Price' },
    quantityInStock: { required: true, number: true, min: 0, label: 'Quantity' },
    condition: { required: true, label: 'Condition' }
  };

  const categoryValidationRules = {
    name: { required: true, label: 'Category Name', minLength: 2 },
    type: { required: true, label: 'Type' },
    rentalPriceMultiplier: { number: true, min: 0, label: 'Price Multiplier' },
    maintenanceIntervalDays: { number: true, min: 0, label: 'Maintenance Interval' }
  };

  // Form managers
  const productForm = useFormManager(
    {
      name: '',
      category: '',
      rentalPrice: '',
      purchasePrice: '',
      quantityInStock: '',
      condition: 'Good',
      description: '',
      imageUrl: ''
    },
    productValidationRules,
    async (values) => {
      const productData = {
        ...values,
        rentalPrice: parseFloat(values.rentalPrice) || 0,
        purchasePrice: parseFloat(values.purchasePrice) || 0,
        quantityInStock: parseInt(values.quantityInStock) || 0,
      };

      if (editingProduct) {
        await updateProduct(editingProduct._id, productData);
      } else {
        await createProduct(productData);
      }
      
      setShowAddProduct(false);
      setEditingProduct(null);
      productForm.reset();
    }
  );

  const categoryForm = useFormManager(
    {
      name: '',
      type: 'OTHER',
      description: '',
      isActive: true,
      rentalPriceMultiplier: 1.0,
      requiresMaintenance: false,
      maintenanceIntervalDays: 0,
      imageUrl: ''
    },
    categoryValidationRules,
    async (values) => {
      if (editingCategory) {
        await updateCategory(editingCategory._id, values);
      } else {
        await createCategory(values);
      }
      
      setShowAddCategory(false);
      setEditingCategory(null);
      categoryForm.reset();
    }
  );

  // Event handlers
  const handleAddProduct = () => {
    setEditingProduct(null);
    productForm.reset();
    setShowAddProduct(true);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    categoryForm.reset();
    setShowAddCategory(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    productForm.reset({
      name: product.name || '',
      category: product.category?._id || '',
      rentalPrice: product.rentalPrice?.toString() || '',
      purchasePrice: product.purchasePrice?.toString() || '',
      quantityInStock: product.quantityInStock?.toString() || '',
      condition: product.condition || 'Good',
      description: product.description || '',
      imageUrl: product.imageUrl || ''
    });
    setShowAddProduct(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name || '',
      type: category.type || 'OTHER',
      description: category.description || '',
      isActive: category.isActive !== undefined ? category.isActive : true,
      rentalPriceMultiplier: category.rentalPriceMultiplier || 1.0,
      requiresMaintenance: category.requiresMaintenance || false,
      maintenanceIntervalDays: category.maintenanceIntervalDays || 0,
      imageUrl: category.imageUrl || ''
    });
    setShowAddCategory(true);
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      await deleteProduct(product._id);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      await deleteCategory(category._id);
    }
  };

  const handleCloseProductModal = () => {
    setShowAddProduct(false);
    setEditingProduct(null);
    productForm.reset();
  };

  const handleCloseCategoryModal = () => {
    setShowAddCategory(false);
    setEditingCategory(null);
    categoryForm.reset();
  };

  const categoryOptions = categories.length > 0 
    ? categories
        .filter(cat => cat && cat.isActive !== false)
        .map(cat => ({ value: cat._id, label: `${cat.name} (${cat.type})` }))
    : [{ value: '', label: 'No categories available - Create one first' }];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your rental products, categories, and inventory levels
          </p>
        </div>
      </div>

      {/* Tabs Interface */}
      <InventoryTabs
        filteredProducts={filteredProducts}
        categories={categories}
        products={products}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedCondition={selectedCondition}
        setSelectedCondition={setSelectedCondition}
        handleAddProduct={handleAddProduct}
        handleEditProduct={handleEditProduct}
        handleDeleteProduct={handleDeleteProduct}
        handleAddCategory={handleAddCategory}
        handleEditCategory={handleEditCategory}
        handleDeleteCategory={handleDeleteCategory}
        loading={loading}
      />

      {/* Product Form Modal */}
      <ProductForm
        isOpen={showAddProduct}
        onClose={handleCloseProductModal}
        onSubmit={productForm.handleSubmit}
        formData={productForm.values}
        onFormChange={productForm.handleChange}
        errors={productForm.errors}
        isSubmitting={productForm.isSubmitting}
        editingProduct={editingProduct}
        categoryOptions={categoryOptions}
      />

      {/* Category Form Modal */}
      <CategoryForm
        isOpen={showAddCategory}
        onClose={handleCloseCategoryModal}
        onSubmit={categoryForm.handleSubmit}
        formData={categoryForm.values}
        onFormChange={categoryForm.handleChange}
        errors={categoryForm.errors}
        isSubmitting={categoryForm.isSubmitting}
        editingCategory={editingCategory}
      />
    </div>
  );
};

export default InventoryPage;
