import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { inventoryAPI } from '../services/api';
import { toast } from 'sonner';
import useApi from '../hooks/useApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const InventoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = '';
  const [selectedCondition, setSelectedCondition] = '';
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
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
  
  // Fetch products and categories using the useApi hook
  const { 
    data: productsData = [], 
    loading: productsLoading, 
    error: productsError, 
    refetch: refetchProducts 
  } = useApi(() => inventoryAPI.getProducts({}));
  
  const { 
    data: categoriesData = [], 
    loading: categoriesLoading, 
    error: categoriesError 
  } = useApi(() => inventoryAPI.getCategories());

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    if (!productsData || !Array.isArray(productsData)) return [];
    
    return productsData.filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.type?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || product.category?._id === selectedCategory;
      const matchesCondition = !selectedCondition || product.condition === selectedCondition;
      
      return matchesSearch && matchesCategory && matchesCondition;
    });
  }, [productsData, searchTerm, selectedCategory, selectedCondition]);

  // Handle API errors
  useEffect(() => {
    if (productsError) {
      toast.error(`Failed to load products: ${productsError.message}`);
    }
    if (categoriesError) {
      toast.error(`Failed to load categories: ${categoriesError.message}`);
    }
  }, [productsError, categoriesError]);

  // Reset form when dialog is closed
  useEffect(() => {
    if (!isAddDialogOpen) {
      setEditingProduct(null);
      setFormData({
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
  }, [isAddDialogOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        rentalPrice: parseFloat(formData.rentalPrice) || 0,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        quantityInStock: parseInt(formData.quantityInStock) || 0
      };

      if (editingProduct) {
        await inventoryAPI.updateProduct(editingProduct._id, productData);
        toast.success('Product updated successfully');
      } else {
        await inventoryAPI.addProduct(productData);
        toast.success('Product added successfully');
      }

      setIsAddDialogOpen(false);
      refetchProducts(); // Refresh the products list
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
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
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await inventoryAPI.deleteProduct(productId);
        toast.success('Product deleted successfully');
        refetchProducts(); // Refresh the products list
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error(error.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'Good': return 'bg-green-100 text-green-800';
      case 'Fair': return 'bg-yellow-100 text-yellow-800';
      case 'Needs Repair': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (productsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Manage your rental products and categories</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingProduct(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update product information' : 'Add a new product to your inventory'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
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
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select value={formData.condition} onValueChange={(value) => setFormData({...formData, condition: value})}>
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
                    onChange={(e) => setFormData({...formData, rentalPrice: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantityInStock">Quantity in Stock</Label>
                  <Input
                    id="quantityInStock"
                    type="number"
                    value={formData.quantityInStock}
                    onChange={(e) => setFormData({...formData, quantityInStock: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Update Product' : 'Add Product'}
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
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition-filter">Condition</Label>
              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
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
          <CardDescription>
            Manage your rental inventory
          </CardDescription>
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
              {filteredProducts.map((product) => (
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