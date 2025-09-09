import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Wrench, Plus } from 'lucide-react';

const TransactionsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Manage purchases and repairs</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Record Transaction
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            Track purchases and repairs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Wrench className="h-12 w-12 mx-auto mb-4" />
              <p>Transactions management coming soon...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsPage; 