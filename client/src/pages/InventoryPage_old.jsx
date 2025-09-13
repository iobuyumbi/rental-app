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
      case "Good":
        return "bg-green-100 text-green-800";
      case "Fair":
        return "bg-yellow-100 text-yellow-800";
      case "Needs Repair":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? "Update product information"
                  : "Add a new product to your inventory"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(categoriesData) && categoriesData.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) =>
                      setFormData({ ...formData, condition: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Needs Repair">Needs Repair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rentalPrice">Rental Price</Label>
                  <Input
                    id="rentalPrice"
                    type="number"
                    step="0.01"
                    value={formData.rentalPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, rentalPrice: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchasePrice: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantityInStock">Quantity in Stock</Label>
                  <Input
                    id="quantityInStock"
                    type="number"
                    value={formData.quantityInStock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantityInStock: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProduct ? "Update Product" : "Add Product"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-filter">Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categoriesData.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition-filter">Condition</Label>
              <Select
                value={selectedCondition}
                onValueChange={setSelectedCondition}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All conditions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All conditions</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Needs Repair">Needs Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
          <CardDescription>Manage your rental inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Rented</TableHead>
                <TableHead>Rental Price</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(filteredProducts) && filteredProducts.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{product.category.name}</TableCell>
                  <TableCell>{product.type}</TableCell>
                  <TableCell>{product.quantityInStock}</TableCell>
                  <TableCell>{product.quantityRented}</TableCell>
                  <TableCell>${product.rentalPrice}</TableCell>
                  <TableCell>
                    <Badge className={getConditionColor(product.condition)}>
                      {product.condition}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryPage;
