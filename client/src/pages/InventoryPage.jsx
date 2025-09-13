import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Package, 
  Plus, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { inventoryAPI } from '../services/api';
import { toast } from 'sonner';
import DataTable from '../components/common/DataTable';
import SearchFilters from '../components/common/SearchFilters';
import FormDialog from '../components/common/FormDialog';

const InventoryPage = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Form states
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    type: '',
    rentalPrice: '',
    purchasePrice: '',
    quantityInStock: '',
    condition: 'Good',
    description: '',
    imageUrl: ''
  });
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsResponse, categoriesResponse] = await Promise.all([
        inventoryAPI.products.get(),
        inventoryAPI.categories.get()
      ]);
      
      setProducts(Array.isArray(productsResponse) ? productsResponse : []);
      setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : []);
    } catch (error) {
      console.error('Error loading inventory data:', error);
      toast.error('Failed to load inventory data');
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on search criteria
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.category?._id === selectedCategory;
    const matchesCondition = !selectedCondition || product.condition === selectedCondition;
    
    return matchesSearch && matchesCategory && matchesCondition;
  });

  // Reset forms when dialogs close
  useEffect(() => {
    if (!showAddProduct) {
      setEditingProduct(null);
      setNewProduct({
        name: '',
        category: '',
        type: '',
        rentalPrice: '',
        purchasePrice: '',
        quantityInStock: '',
        condition: 'Good',
        description: '',
        imageUrl: ''
      });
    }
  }, [showAddProduct]);

  useEffect(() => {
    if (!showAddCategory) {
      setEditingCategory(null);
      setNewCategory({
        name: '',
        description: ''
      });
    }
  }, [showAddCategory]);

  // Product form handlers
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...newProduct,
        rentalPrice: parseFloat(newProduct.rentalPrice) || 0,
        purchasePrice: parseFloat(newProduct.purchasePrice) || 0,
        quantityInStock: parseInt(newProduct.quantityInStock) || 0,
      };

      if (editingProduct) {
        await inventoryAPI.products.update(editingProduct._id, productData);
        toast.success('Product updated successfully');
      } else {
        await inventoryAPI.products.create(productData);
        toast.success('Product added successfully');
      }

      setShowAddProduct(false);
      loadData();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };

  // Category form handlers
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await inventoryAPI.categories.update(editingCategory._id, newCategory);
        toast.success('Category updated successfully');
      } else {
        await inventoryAPI.categories.create(newCategory);
        toast.success('Category added successfully');
      }

      setShowAddCategory(false);
      loadData();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name || '',
      category: product.category?._id || '',
      type: product.type || '',
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
    setNewCategory({
      name: category.name || '',
      description: category.description || ''
    });
    setShowAddCategory(true);
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await inventoryAPI.products.delete(id);
        toast.success('Product deleted successfully');
        loadData();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await inventoryAPI.categories.delete(id);
        toast.success('Category deleted successfully');
        loadData();
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Failed to delete category');
      }
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'Good':
        return 'bg-green-100 text-green-800';
      case 'Fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'Needs Repair':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    { key: 'name', label: 'Product' },
    { key: 'category', label: 'Category' },
    { key: 'type', label: 'Type' },
    { key: 'quantityInStock', label: 'Stock' },
    { key: 'quantityRented', label: 'Rented' },
    { key: 'rentalPrice', label: 'Rental Price' },
    { key: 'condition', label: 'Condition' }
  ];

  // Define category table columns
  const categoryColumns = [
    { key: 'name', label: 'Category Name' },
    { key: 'description', label: 'Description' },
    { key: 'productCount', label: 'Products' }
  ];

  // Product form fields
  const productFields = [
    { key: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter product name' },
    { 
      key: 'category', 
      label: 'Category', 
      type: 'select', 
      required: true,
      options: categories.map(cat => ({ value: cat._id, label: cat.name })),
      placeholder: 'Select category'
    },
    { key: 'type', label: 'Type', type: 'text', required: true, placeholder: 'e.g., Chair, Table, Equipment' },
    { key: 'rentalPrice', label: 'Rental Price (Ksh)', type: 'number', required: true, placeholder: '0.00' },
    { key: 'purchasePrice', label: 'Purchase Price (Ksh)', type: 'number', placeholder: '0.00' },
    { key: 'quantityInStock', label: 'Quantity in Stock', type: 'number', required: true, placeholder: '0' },
    { 
      key: 'condition', 
      label: 'Condition', 
      type: 'select', 
      required: true,
      options: [
        { value: 'Good', label: 'Good' },
        { value: 'Fair', label: 'Fair' },
        { value: 'Needs Repair', label: 'Needs Repair' }
      ]
    },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Product description...' },
    { key: 'imageUrl', label: 'Image URL', type: 'url', placeholder: 'https://...' }
  ];

  // Category form fields
  const categoryFields = [
    { key: 'name', label: 'Category Name', type: 'text', required: true, placeholder: 'Enter category name' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Category description...' }
  ];

  // Search filters configuration
  const searchFilters = [
    {
      key: 'category',
      label: 'Category',
      value: selectedCategory,
      onChange: setSelectedCategory,
      placeholder: 'All categories',
      allLabel: 'All categories',
      options: categories.map(cat => ({ value: cat._id, label: cat.name }))
    },
    {
      key: 'condition',
      label: 'Condition',
      value: selectedCondition,
      onChange: setSelectedCondition,
      placeholder: 'All conditions',
      allLabel: 'All conditions',
      options: [
        { value: 'Good', label: 'Good' },
        { value: 'Fair', label: 'Fair' },
        { value: 'Needs Repair', label: 'Needs Repair' }
      ]
    }
  ];

  // Custom cell renderer for products
  const renderProductCell = (product, column) => {
    switch (column.key) {
      case 'name':
        return (
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{product.name}</span>
          </div>
        );
      case 'category':
        return product.category?.name || 'N/A';
      case 'rentalPrice':
        return `Ksh ${product.rentalPrice?.toLocaleString() || '0'}`;
      case 'condition':
        return (
          <Badge className={getConditionColor(product.condition)}>
            {product.condition}
          </Badge>
        );
      default:
        return product[column.key] || 'N/A';
    }
  };

  // Custom cell renderer for categories
  const renderCategoryCell = (category, column) => {
    switch (column.key) {
      case 'productCount':
        return products.filter(p => p.category?._id === category._id).length;
      default:
        return category[column.key] || 'N/A';
    }
  };

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
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Product Inventory</CardTitle>
                  <CardDescription>Manage your rental products and stock levels</CardDescription>
                </div>
                <Button onClick={() => setShowAddProduct(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SearchFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={searchFilters}
              />
              
              <DataTable
                columns={productColumns}
                data={filteredProducts}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                renderCell={renderProductCell}
                emptyMessage="No products found"
                emptyIcon={Package}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Product Categories</CardTitle>
                  <CardDescription>Organize your products into categories</CardDescription>
                </div>
                <Button onClick={() => setShowAddCategory(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={categoryColumns}
                data={categories}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                renderCell={renderCategoryCell}
                emptyMessage="No categories found"
                emptyIcon={BarChart3}
              />
            </CardContent>
          </Card>
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

      {/* Product Form Dialog */}
      <FormDialog
        isOpen={showAddProduct}
        onOpenChange={setShowAddProduct}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        description={editingProduct ? 'Update product information' : 'Add a new product to your inventory'}
        formData={newProduct}
        onFormChange={setNewProduct}
        onSubmit={handleProductSubmit}
        fields={productFields}
        submitLabel="Product"
        isEditing={!!editingProduct}
      />

      {/* Category Form Dialog */}
      <FormDialog
        isOpen={showAddCategory}
        onOpenChange={setShowAddCategory}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        description={editingCategory ? 'Update category information' : 'Add a new category to organize your products'}
        formData={newCategory}
        onFormChange={setNewCategory}
        onSubmit={handleCategorySubmit}
        fields={categoryFields}
        submitLabel="Category"
        isEditing={!!editingCategory}
      />
    </div>
  );
};

export default InventoryPage;
