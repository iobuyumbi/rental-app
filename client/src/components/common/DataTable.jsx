import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Search, Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

// Enhanced DataTable component that combines the functionality of both old DataTable and DataTableV2
const DataTable = ({
  data = [],
  columns = [],
  title,
  description,
  searchable = false,
  searchPlaceholder = "Search...",
  onAdd,
  addLabel = "Add New",
  onEdit,
  onDelete,
  onView,
  loading = false,
  emptyMessage = "No data available",
  emptyIcon: EmptyIcon,
  actions = [],
  className = "",
  // Legacy props for backward compatibility
  renderCell
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm || !searchable) return data;
    
    return data.filter(item => {
      return columns.some(column => {
        const accessor = column.accessor || column.key;
        const value = accessor ? item[accessor] : '';
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns, searchable]);

  const renderCellContent = (item, column) => {
    // Use legacy renderCell if provided
    if (renderCell) {
      return renderCell(item, column);
    }

    const accessor = column.accessor || column.key;
    const value = accessor ? item[accessor] : '';

    // Use new render function if provided
    if (column.render) {
      return column.render(value, item);
    }

    // Handle different cell types
    switch (column.type) {
      case 'badge':
        return (
          <Badge variant={column.getBadgeVariant ? column.getBadgeVariant(value) : 'default'}>
            {value}
          </Badge>
        );
      case 'currency':
        return `KES ${Number(value).toLocaleString()}`;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        // Handle objects safely - don't render them directly
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }
        return value || '';
    }
  };

  const renderActions = (item) => {
    const hasBuiltInActions = onEdit || onDelete || onView;
    const hasCustomActions = actions.length > 0;
    
    if (!hasBuiltInActions && !hasCustomActions) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onView && (
            <DropdownMenuItem onClick={() => onView(item)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
          )}
          {onEdit && (
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          {actions.map((action, index) => (
            <DropdownMenuItem key={index} onClick={() => action.onClick(item)}>
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </DropdownMenuItem>
          ))}
          {onDelete && (
            <DropdownMenuItem 
              onClick={() => onDelete(item._id || item.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no title, description, search, or add button, render just the table (legacy mode)
  const isLegacyMode = !title && !description && !searchable && !onAdd;

  const tableContent = (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={column.key || column.accessor || index} className={column.className}>
                {typeof (column.header || column.label) === 'function' 
                  ? (column.header || column.label)({ 
                      table: { 
                        getFilteredRowModel: () => ({ rows: filteredData }),
                        getRowModel: () => ({ rows: data }),
                        getAllColumns: () => columns,
                        getState: () => ({ columnFilters: [], sorting: [] })
                      },
                      column: {
                        id: column.key || column.accessor,
                        getFilterValue: () => '',
                        setFilterValue: () => {}
                      }
                    }) 
                  : (column.header || column.label)
                }
              </TableHead>
            ))}
            {(onEdit || onDelete || onView || actions.length > 0) && (
              <TableHead className="w-[70px]">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.length === 0 ? (
            <TableRow>
              <TableCell 
                colSpan={columns.length + (onEdit || onDelete || onView || actions.length > 0 ? 1 : 0)} 
                className="text-center py-12"
              >
                <div className="flex flex-col items-center justify-center">
                  {EmptyIcon && <EmptyIcon className="h-12 w-12 text-gray-400 mb-4" />}
                  <p className="text-gray-500 text-center">{emptyMessage}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredData.map((item, index) => (
              <TableRow key={item._id || item.id || index}>
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex} className={column.cellClassName}>
                    {renderCellContent(item, column)}
                  </TableCell>
                ))}
                {(onEdit || onDelete || onView || actions.length > 0) && (
                  <TableCell>
                    {renderActions(item)}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (isLegacyMode) {
    return tableContent;
  }

  return (
    <Card className={className}>
      {(title || description || searchable || onAdd) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {onAdd && (
              <Button onClick={onAdd}>
                {addLabel}
              </Button>
            )}
          </div>
          
          {searchable && (
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          )}
        </CardHeader>
      )}
      
      <CardContent>
        {tableContent}
      </CardContent>
    </Card>
  );
};

export default DataTable;
