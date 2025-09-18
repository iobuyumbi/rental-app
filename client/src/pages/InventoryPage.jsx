import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Package, 
  Plus, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { inventoryAPI } from '../services/api';
import DataTable from '../components/common/DataTable';
import FormModal, { FormInput, FormSelect, FormTextarea } from '../components/common/FormModal';
import useDataManager from '../hooks/useDataManager';
import useFormManager from '../hooks/useFormManager';

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

  const getConditionBadgeVariant = (condition) => {
    switch (condition) {
      case 'Good': return 'default';
      case 'Fair': return 'secondary';
      case 'Needs Repair': return 'destructive';
      default: return 'outline';
    }
  };

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

  // Define product table columns
  const productColumns = [
    {
      header: 'Product',
      accessor: 'name',
      className: 'min-w-[200px]'
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (value, product) => product.category?.name || 'No Category'
    },
    {
      header: 'Stock',
      accessor: 'quantityInStock',
      render: (value, product) => {
        const stock = product.quantityInStock || 0;
        const rented = product.quantityRented || 0;
        const available = stock - rented;
        return (
          <div className="text-sm">
            <div>{available} available</div>
            <div className="text-gray-500">{stock} total</div>
          </div>
        );
      }
    },
    {
      header: 'Rental Price',
      accessor: 'rentalPrice',
      type: 'currency'
    },
    {
      header: 'Condition',
      accessor: 'condition',
      type: 'badge',
      getBadgeVariant: getConditionBadgeVariant
    }
  ];

  // Define category table columns
  const categoryColumns = [
    {
      header: 'Category Name',
      accessor: 'name'
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (value, category) => category?.description || 'No description'
    },
    {
      header: 'Products',
      accessor: 'productCount',
      render: (value, category) => {
        if (!category || !category._id) return '0 products';
        const count = products.filter(p => p.category?._id === category._id).length;
        return `${count} products`;
      }
    },
    {
      header: 'Status',
      accessor: 'isActive',
      type: 'badge',
      getBadgeVariant: (isActive) => isActive ? 'default' : 'secondary',
      render: (value, category) => category?.isActive ? 'Active' : 'Inactive'
    }
  ];

  // Category type options
  const categoryTypeOptions = [
    { value: 'TENT', label: 'Tent' },
    { value: 'CHAIR', label: 'Chair' },
    { value: 'TABLE', label: 'Table' },
    { value: 'UTENSIL', label: 'Utensil' },
    { value: 'EQUIPMENT', label: 'Equipment' },
    { value: 'FURNITURE', label: 'Furniture' },
    { value: 'LIGHTING', label: 'Lighting' },
    { value: 'SOUND', label: 'Sound' },
    { value: 'OTHER', label: 'Other' }
  ];

  const conditionOptions = [
    { value: 'Good', label: 'Good' },
    { value: 'Fair', label: 'Fair' },
    { value: 'Needs Repair', label: 'Needs Repair' }
  ];

  const categoryOptions = categories.length > 0 
    ? categories
        .filter(cat => cat && cat.isActive !== false)
        .map(cat => ({ value: cat._id, label: `${cat.name} (${cat.type})` }))
    : [{ value: '', label: 'No categories available - Create one first' }];


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
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Products ({filteredProducts.length})</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Categories ({categories.length})</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="All conditions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  {conditionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            title="Product Inventory"
            description="Manage your rental products and stock levels"
            columns={productColumns}
            data={filteredProducts}
            onAdd={handleAddProduct}
            addLabel="Add Product"
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            searchable={true}
            searchPlaceholder="Search products by name, description..."
            loading={loading}
            emptyMessage="No products found. Add your first product to get started."
            emptyIcon={Package}
          />
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <DataTable
            title="Product Categories"
            description="Organize your products into categories"
            columns={categoryColumns}
            data={categories}
            onAdd={handleAddCategory}
            addLabel="Add Category"
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
            searchable={true}
            searchPlaceholder="Search categories..."
            loading={loading}
            emptyMessage="No categories found. Create your first category to organize products."
            emptyIcon={BarChart3}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-xs text-muted-foreground">
                  Across {categories.length} categories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products.reduce((sum, p) => sum + (p.quantityInStock || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Items in inventory
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Items Rented</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products.reduce((sum, p) => sum + (p.quantityRented || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently out on rental
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products.filter(p => p.condition === 'Needs Repair' || p.quantityInStock === 0).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Items needing repair or restocking
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Product Form Modal */}
      <FormModal
        isOpen={showAddProduct}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddProduct(false);
            setEditingProduct(null);
            productForm.reset();
          }
        }}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        onSubmit={productForm.handleSubmit}
        loading={productForm.isSubmitting}
      >
        <FormInput
          label="Product Name"
          name="name"
          value={productForm.values.name || ''}
          onChange={(e) => productForm.handleChange('name', e.target.value)}
          error={productForm.errors.name}
          required
          placeholder="Enter product name"
        />
        
        <FormSelect
          label="Category"
          name="category"
          value={productForm.values.category || ''}
          onChange={(e) => productForm.handleChange('category', e.target.value)}
          error={productForm.errors.category}
          required
          options={categoryOptions}
          placeholder="Select category"
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Rental Price (KES)"
            name="rentalPrice"
            type="number"
            value={productForm.values.rentalPrice || ''}
            onChange={(e) => productForm.handleChange('rentalPrice', e.target.value)}
            error={productForm.errors.rentalPrice}
            required
            placeholder="0.00"
          />
          
          <FormInput
            label="Purchase Price (KES)"
            name="purchasePrice"
            type="number"
            value={productForm.values.purchasePrice || ''}
            onChange={(e) => productForm.handleChange('purchasePrice', e.target.value)}
            error={productForm.errors.purchasePrice}
            placeholder="0.00"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Quantity in Stock"
            name="quantityInStock"
            type="number"
            value={productForm.values.quantityInStock || ''}
            onChange={(e) => productForm.handleChange('quantityInStock', e.target.value)}
            error={productForm.errors.quantityInStock}
            required
            placeholder="0"
          />
          
          <FormSelect
            label="Condition"
            name="condition"
            value={productForm.values.condition || ''}
            onChange={(e) => productForm.handleChange('condition', e.target.value)}
            error={productForm.errors.condition}
            required
            options={conditionOptions}
            placeholder="Select condition"
          />
        </div>
        
        <FormTextarea
          label="Description"
          name="description"
          value={productForm.values.description || ''}
          onChange={(e) => productForm.handleChange('description', e.target.value)}
          error={productForm.errors.description}
          placeholder="Product description..."
        />
        
        <FormInput
          label="Image URL"
          name="imageUrl"
          type="url"
          value={productForm.values.imageUrl || ''}
          onChange={(e) => productForm.handleChange('imageUrl', e.target.value)}
          error={productForm.errors.imageUrl}
          placeholder="https://..."
        />
      </FormModal>

      {/* Category Form Modal */}
      <FormModal
        isOpen={showAddCategory}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddCategory(false);
            setEditingCategory(null);
            categoryForm.reset();
          }
        }}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        onSubmit={categoryForm.handleSubmit}
        loading={categoryForm.isSubmitting}
      >
        <FormInput
          label="Category Name"
          name="name"
          value={categoryForm.values.name || ''}
          onChange={(e) => categoryForm.handleChange('name', e.target.value)}
          error={categoryForm.errors.name}
          required
          placeholder="Enter category name"
        />
        
        <FormSelect
          label="Category Type"
          name="type"
          value={categoryForm.values.type || ''}
          onChange={(e) => categoryForm.handleChange('type', e.target.value)}
          error={categoryForm.errors.type}
          required
          options={categoryTypeOptions}
          placeholder="Select category type"
        />
        
        <FormTextarea
          label="Description"
          name="description"
          value={categoryForm.values.description || ''}
          onChange={(e) => categoryForm.handleChange('description', e.target.value)}
          error={categoryForm.errors.description}
          placeholder="Category description..."
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Rental Price Multiplier"
            name="rentalPriceMultiplier"
            type="number"
            step="0.1"
            min="0.1"
            value={categoryForm.values.rentalPriceMultiplier || ''}
            onChange={(e) => categoryForm.handleChange('rentalPriceMultiplier', e.target.value)}
            error={categoryForm.errors.rentalPriceMultiplier}
            placeholder="1.0"
          />
          
          <FormInput
            label="Maintenance Interval (Days)"
            name="maintenanceIntervalDays"
            type="number"
            min="0"
            value={categoryForm.values.maintenanceIntervalDays || ''}
            onChange={(e) => categoryForm.handleChange('maintenanceIntervalDays', e.target.value)}
            error={categoryForm.errors.maintenanceIntervalDays}
            placeholder="0"
          />
        </div>
        
        <FormInput
          label="Image URL"
          name="imageUrl"
          type="url"
          value={categoryForm.values.imageUrl || ''}
          onChange={(e) => categoryForm.handleChange('imageUrl', e.target.value)}
          error={categoryForm.errors.imageUrl}
          placeholder="https://..."
        />
      </FormModal>
    </div>
  );
};

export default InventoryPage;
