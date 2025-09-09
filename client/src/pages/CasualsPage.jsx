import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Users, Plus } from 'lucide-react';

const CasualsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Casual Workers</h1>
          <p className="text-gray-600">Manage casual workers and attendance</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Worker
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Casual Workers</CardTitle>
          <CardDescription>
            Manage workers and track attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <p>Casual workers management coming soon...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CasualsPage; 