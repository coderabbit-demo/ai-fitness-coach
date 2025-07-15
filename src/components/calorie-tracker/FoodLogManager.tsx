'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/utils/supabase/client';
import { format } from 'date-fns';
import { 
  Search, 
  Calendar, 
  Edit, 
  Trash2, 
  Check,
  X
} from 'lucide-react';

interface FoodLog {
  id: string;
  food_items: Array<{
    name: string;
    quantity: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }>;
  total_calories: number;
  confidence_score: number;
  image_url: string;
  notes: string;
  created_at: string;
  processing_status: string;
}

export function FoodLogManager() {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [editingLog, setEditingLog] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<FoodLog>>({});

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    const filterLogs = () => {
      let filtered = logs;

      if (searchTerm) {
        filtered = filtered.filter(log => 
          log.food_items?.some(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          ) || 
          log.notes?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (dateFilter) {
        filtered = filtered.filter(log => 
          format(new Date(log.created_at), 'yyyy-MM-dd') === dateFilter
        );
      }

      setFilteredLogs(filtered);
    };
    
    filterLogs();
  }, [logs, searchTerm, dateFilter]);

  const fetchLogs = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
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
      const supabase = createClient();
      
      // Recalculate totals
      const totalCalories = editValues.food_items?.reduce((sum, item) => sum + item.calories, 0) || 0;
      const totalProtein = editValues.food_items?.reduce((sum, item) => sum + item.protein_g, 0) || 0;
      const totalCarbs = editValues.food_items?.reduce((sum, item) => sum + item.carbs_g, 0) || 0;
      const totalFat = editValues.food_items?.reduce((sum, item) => sum + item.fat_g, 0) || 0;

      const { error } = await supabase
        .from('nutrition_logs')
        .update({
          food_items: editValues.food_items,
          notes: editValues.notes,
          total_calories: totalCalories,
          total_protein_g: totalProtein,
          total_carbs_g: totalCarbs,
          total_fat_g: totalFat,
        })
        .eq('id', logId);

      if (error) throw error;

      setEditingLog(null);
      setEditValues({});
      fetchLogs();
    } catch (error) {
      console.error('Error updating log:', error);
    }
  };

  const handleDelete = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this meal log?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('nutrition_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;
      fetchLogs();
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-green-100 text-green-800">High</Badge>;
    if (score >= 0.6) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Food Log Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search food items..."
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
                className="pl-10"
              />
            </div>
          </div>

          {/* Food Logs */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <Card key={log.id} className="border-l-4 border-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-500">
                          {format(new Date(log.created_at), 'MMM d, yyyy • h:mm a')}
                        </div>
                        {getConfidenceBadge(log.confidence_score)}
                        {log.processing_status === 'pending' && (
                          <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(log)}
                          disabled={editingLog === log.id}
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
                            <div key={index} className="grid grid-cols-5 gap-2 text-sm">
                              <Input
                                value={item.name}
                                onChange={(e) => {
                                  const newItems = [...(editValues.food_items || [])];
                                  newItems[index].name = e.target.value;
                                  setEditValues({ ...editValues, food_items: newItems });
                                }}
                                placeholder="Food name"
                              />
                              <Input
                                value={item.quantity}
                                onChange={(e) => {
                                  const newItems = [...(editValues.food_items || [])];
                                  newItems[index].quantity = e.target.value;
                                  setEditValues({ ...editValues, food_items: newItems });
                                }}
                                placeholder="Quantity"
                              />
                              <Input
                                type="number"
                                value={item.calories}
                                onChange={(e) => {
                                  const newItems = [...(editValues.food_items || [])];
                                  newItems[index].calories = parseInt(e.target.value) || 0;
                                  setEditValues({ ...editValues, food_items: newItems });
                                }}
                                placeholder="Calories"
                              />
                              <Input
                                type="number"
                                value={item.protein_g}
                                onChange={(e) => {
                                  const newItems = [...(editValues.food_items || [])];
                                  newItems[index].protein_g = parseFloat(e.target.value) || 0;
                                  setEditValues({ ...editValues, food_items: newItems });
                                }}
                                placeholder="Protein"
                              />
                              <div className="text-gray-600">
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
                    <div className="flex justify-between items-center font-semibold text-lg">
                      <span>Total Calories:</span>
                      <span className="text-orange-600">{log.total_calories}</span>
                    </div>

                    {/* Notes */}
                    {log.notes && (
                      <div className="mt-3 p-2 bg-blue-50 rounded">
                        <div className="text-sm text-gray-600">Notes:</div>
                        <div className="text-sm">{log.notes}</div>
                      </div>
                    )}

                    {/* Image */}
                    {log.image_url && (
                      <div className="mt-3">
                        <img 
                          src={log.image_url} 
                          alt="Meal" 
                          className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
                          onClick={() => window.open(log.image_url, '_blank')}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 