'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/utils/supabase/client';
import { format } from 'date-fns';
import { 
  Search, 
  Calendar, 
  Edit, 
  Trash2, 
  Image as ImageIcon, 
  AlertCircle,
  Check,
  X,
  Clock,
  ChefHat,
  Filter
} from 'lucide-react';

interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
}

interface FoodLog {
  id: string;
  food_items: FoodItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  confidence_score: number;
  image_url: string;
  notes: string;
  created_at: string;
  processing_status: string;
}

interface FoodLogManagerProps {
  userId: string;
  className?: string;
  onLogUpdated?: () => void;
}

/**
 * Manages food log entries with search, filter, edit, and delete functionality.
 *
 * Displays a list of meal entries with the ability to search by food items,
 * filter by date, edit nutrition values, and delete entries. Shows processing
 * status, confidence scores, and provides inline editing capabilities.
 *
 * @param userId - ID of the authenticated user
 * @param className - Optional CSS class for styling
 * @param onLogUpdated - Callback fired when a log is updated or deleted
 */
export function FoodLogManager({ userId, className, onLogUpdated }: FoodLogManagerProps) {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  const [editingLog, setEditingLog] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<FoodLog>>({});

  const supabase = createClient();

  useEffect(() => {
    fetchLogs();
  }, [userId]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, dateFilter, statusFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.processing_status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.food_items?.some(item => 
          item.name.toLowerCase().includes(searchLower)
        ) || 
        log.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(log => 
        format(new Date(log.created_at), 'yyyy-MM-dd') === dateFilter
      );
    }

    setFilteredLogs(filtered);
  };

  const handleEdit = (log: FoodLog) => {
    setEditingLog(log.id);
    setEditValues({
      food_items: log.food_items,
      notes: log.notes,
    });
  };

  const handleSaveEdit = async (logId: string) => {
    try {
      if (!editValues.food_items) return;

      // Recalculate totals
      const totalCalories = editValues.food_items.reduce((sum, item) => sum + item.calories, 0);
      const totalProtein = editValues.food_items.reduce((sum, item) => sum + item.protein_g, 0);
      const totalCarbs = editValues.food_items.reduce((sum, item) => sum + item.carbs_g, 0);
      const totalFat = editValues.food_items.reduce((sum, item) => sum + item.fat_g, 0);
      const totalFiber = editValues.food_items.reduce((sum, item) => sum + (item.fiber_g || 0), 0);

      const { error } = await supabase
        .from('nutrition_logs')
        .update({
          food_items: editValues.food_items,
          notes: editValues.notes,
          total_calories: totalCalories,
          total_protein_g: totalProtein,
          total_carbs_g: totalCarbs,
          total_fat_g: totalFat,
          total_fiber_g: totalFiber,
        })
        .eq('id', logId);

      if (error) throw error;

      setEditingLog(null);
      setEditValues({});
      await fetchLogs();
      onLogUpdated?.();
    } catch (err) {
      console.error('Error updating log:', err);
      alert('Failed to update meal log');
    }
  };

  const handleDelete = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this meal log? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('nutrition_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;
      
      await fetchLogs();
      onLogUpdated?.();
    } catch (err) {
      console.error('Error deleting log:', err);
      alert('Failed to delete meal log');
    }
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-green-100 text-green-800 border-green-200">High Confidence</Badge>;
    if (score >= 0.6) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium Confidence</Badge>;
    return <Badge className="bg-red-100 text-red-800 border-red-200">Low Confidence</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const updateFoodItem = (logId: string, index: number, field: keyof FoodItem, value: string | number) => {
    if (editingLog === logId && editValues.food_items) {
      const newItems = [...editValues.food_items];
      newItems[index] = { ...newItems[index], [field]: value };
      setEditValues({ ...editValues, food_items: newItems });
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Food Log Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <div className="mt-2 text-sm text-gray-600">Loading your meal logs...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <div className="text-red-600 mb-4">{error}</div>
            <Button onClick={fetchLogs} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Food Log Management
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search food items or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10 w-full sm:w-auto"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'processing', label: 'Processing' },
                  { value: 'failed', label: 'Failed' }
                ].map(option => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={statusFilter === option.value ? "default" : "outline"}
                    onClick={() => setStatusFilter(option.value as any)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Food Logs */}
          <div className="space-y-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ChefHat className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div>No meal logs found</div>
                <div className="text-sm mt-1">
                  {searchTerm || dateFilter || statusFilter !== 'all' 
                    ? 'Try adjusting your filters'
                    : 'Start logging meals to see them here'
                  }
                </div>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <Card key={log.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {format(new Date(log.created_at), 'MMM d, yyyy • h:mm a')}
                        </div>
                        {log.processing_status === 'completed' && getConfidenceBadge(log.confidence_score)}
                        {getStatusBadge(log.processing_status)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(log)}
                          disabled={editingLog === log.id || log.processing_status === 'processing'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(log.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Food Items */}
                    <div className="space-y-2 mb-3">
                      {editingLog === log.id ? (
                        <div className="space-y-2">
                          {editValues.food_items?.map((item, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-2 bg-gray-50 rounded">
                              <Input
                                value={item.name}
                                onChange={(e) => updateFoodItem(log.id, index, 'name', e.target.value)}
                                placeholder="Food name"
                                className="text-sm"
                              />
                              <Input
                                value={item.quantity}
                                onChange={(e) => updateFoodItem(log.id, index, 'quantity', e.target.value)}
                                placeholder="Quantity"
                                className="text-sm"
                              />
                              <Input
                                type="number"
                                value={item.calories}
                                onChange={(e) => updateFoodItem(log.id, index, 'calories', parseInt(e.target.value) || 0)}
                                placeholder="Calories"
                                className="text-sm"
                              />
                              <Input
                                type="number"
                                step="0.1"
                                value={item.protein_g}
                                onChange={(e) => updateFoodItem(log.id, index, 'protein_g', parseFloat(e.target.value) || 0)}
                                placeholder="Protein (g)"
                                className="text-sm"
                              />
                              <div className="text-xs text-gray-600 flex items-center">
                                C: {item.carbs_g}g | F: {item.fat_g}g
                              </div>
                            </div>
                          ))}
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(log.id)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingLog(null)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        log.food_items?.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-500 ml-2">({item.quantity})</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {item.calories} cal | P: {item.protein_g}g | C: {item.carbs_g}g | F: {item.fat_g}g
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Total Calories */}
                    <div className="flex justify-between items-center font-semibold text-lg border-t pt-2">
                      <span>Total Calories:</span>
                      <span className="text-orange-600">{Math.round(log.total_calories)}</span>
                    </div>

                    {/* Notes */}
                    {(log.notes || editingLog === log.id) && (
                      <div className="mt-3 p-2 bg-blue-50 rounded">
                        <div className="text-sm text-gray-600 mb-1">Notes:</div>
                        {editingLog === log.id ? (
                          <Textarea
                            value={editValues.notes || ''}
                            onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })}
                            placeholder="Add notes about this meal..."
                            className="text-sm min-h-[60px]"
                          />
                        ) : (
                          <div className="text-sm">{log.notes}</div>
                        )}
                      </div>
                    )}

                    {/* Image */}
                    {log.image_url && (
                      <div className="mt-3 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-gray-500" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(log.image_url, '_blank')}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Image
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}