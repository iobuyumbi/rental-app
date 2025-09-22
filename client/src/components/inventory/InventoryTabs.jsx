import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Package, 
  BarChart3,
  TrendingUp
} from 'lucide-react';
import DataTable from '../common/DataTable';
import InventoryFilters from './InventoryFilters';
import InventoryAnalytics from './InventoryAnalytics';

const getConditionBadgeVariant = (condition) => {
  switch (condition) {
    case 'Good': return 'default';
    case 'Fair': return 'secondary';
    case 'Needs Repair': return 'destructive';
    default: return 'outline';
  }
};

const InventoryTabs = ({
  filteredProducts,
  categories,
  products,
  selectedCategory,
  setSelectedCategory,
  selectedCondition,
  setSelectedCondition,
  handleAddProduct,
  handleEditProduct,
  handleDeleteProduct,
  handleAddCategory,
  handleEditCategory,
  handleDeleteCategory,
  loading
}) => {
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

  return (
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
        <InventoryFilters
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedCondition={selectedCondition}
          setSelectedCondition={setSelectedCondition}
          categories={categories}
        />

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
        <InventoryAnalytics products={products} categories={categories} />
      </TabsContent>
    </Tabs>
  );
};

export default InventoryTabs;
