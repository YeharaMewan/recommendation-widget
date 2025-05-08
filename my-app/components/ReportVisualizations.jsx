'use client';

import { useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export default function ReportVisualizations({ inventoryData, recommendations }) {
  const [activeTab, setActiveTab] = useState('categories');
  
  // Prepare data for category chart
  const categoryData = Object.entries(inventoryData.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || { count: 0, value: 0 };
    acc[item.category].count += 1;
    acc[item.category].value += item.current_stock * item.price;
    return acc;
  }, {})).map(([category, data]) => ({
    name: category,
    count: data.count,
    value: parseFloat(data.value.toFixed(2))
  }));
  
  // Prepare data for supplier chart
  const supplierData = Object.entries(inventoryData.reduce((acc, item) => {
    acc[item.supplier] = acc[item.supplier] || { count: 0, value: 0 };
    acc[item.supplier].count += 1;
    acc[item.supplier].value += item.current_stock * item.price;
    return acc;
  }, {})).map(([supplier, data]) => ({
    name: supplier,
    count: data.count,
    value: parseFloat(data.value.toFixed(2))
  }));
  
  // Prepare data for stock health chart
  const stockHealthData = inventoryData.map(item => {
    const daysUntilEmpty = item.avg_daily_sales > 0 
      ? Math.floor(item.current_stock / item.avg_daily_sales) 
      : 365;
    
    const stockPercentage = (item.current_stock / item.reorder_level) * 100;
    
    return {
      name: item.item_name.length > 15 ? item.item_name.substring(0, 15) + '...' : item.item_name,
      daysUntilEmpty: daysUntilEmpty > 100 ? 100 : daysUntilEmpty, // Cap at 100 days for visualization
      stockPercentage: stockPercentage > 200 ? 200 : stockPercentage, // Cap at 200% for visualization
      belowReorder: item.current_stock < item.reorder_level
    };
  });
  
  // Prepare data for recommendations by priority
  const recommendationsByPriority = recommendations.reduce((acc, rec) => {
    acc[rec.priority] = (acc[rec.priority] || 0) + 1;
    return acc;
  }, {});
  
  const priorityData = Object.entries(recommendationsByPriority).map(([priority, count]) => ({
    name: priority,
    value: count
  }));
  
  // Prepare data for recommendations by type
  const recommendationsByType = recommendations.reduce((acc, rec) => {
    acc[rec.type] = (acc[rec.type] || 0) + 1;
    return acc;
  }, {});
  
  const typeData = Object.entries(recommendationsByType).map(([type, count]) => ({
    name: type,
    value: count
  }));
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  const renderTabs = () => {
    return (
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'categories' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('categories')}
        >
          CategoriesTooltip 
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'suppliers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('suppliers')}
        >
          Suppliers
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'stock' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('stock')}
        >
          Stock Health
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'recommendations' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations
        </button>
      </div>
    );
  };
  
  const renderCategoryChart = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Item Count by Category</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                            <Tooltip
                            contentStyle={{ color: 'black' }} />
                <Legend />
                <Bar dataKey="count" fill="#0088FE" name="Number of Items" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Stock Value by Category</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };
  
  const renderSupplierChart = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Item Count by Supplier</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={supplierData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                            <Tooltip
                            contentStyle={{ color: 'black' }} />
                <Legend />
                <Bar dataKey="count" fill="#00C49F" name="Number of Items" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Stock Value by Supplier</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={supplierData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {supplierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };
  
  const renderStockHealthChart = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Stock Health by Item</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stockHealthData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 80,
                }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 200]} />
                <YAxis dataKey="name" type="category" width={150} />
                            <Tooltip
                            contentStyle={{ color: 'black' }} />
                <Legend />
                <Bar 
                  dataKey="stockPercentage" 
                  name="Stock Level (%)" 
                  fill="#8884d8"
                  background={{ fill: '#eee' }}
                >
                  {stockHealthData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.belowReorder ? '#FF8042' : '#00C49F'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Days Until Empty</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stockHealthData.filter(item => item.daysUntilEmpty < 100)} // Only show items that will empty within 100 days
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 80,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" />
                <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                <Tooltip contentStyle={{ color: 'black' }} />
                <Legend />
                <Bar 
                  dataKey="daysUntilEmpty" 
                  name="Days Until Empty" 
                  fill="#0088FE"
                >
                  {stockHealthData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.daysUntilEmpty < 5 ? '#FF8042' : 
                            entry.daysUntilEmpty < 15 ? '#FFBB28' : '#00C49F'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };
  
  const renderRecommendationsChart = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recommendations by Priority</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  <Cell key="cell-high" fill="#FF8042" />
                  <Cell key="cell-medium" fill="#FFBB28" />
                  <Cell key="cell-low" fill="#00C49F" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recommendations by Type</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={typeData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip contentStyle={{ color: 'black' }} />
                <Legend />
                <Bar 
                  dataKey="value" 
                  name="Number of Recommendations" 
                  fill="#8884d8"
                >
                  <Cell key="cell-warning" fill="#FFBB28" />
                  <Cell key="cell-danger" fill="#FF8042" />
                  <Cell key="cell-success" fill="#00C49F" />
                  <Cell key="cell-info" fill="#0088FE" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Inventory Analytics
      </h2>
      
      {renderTabs()}
      
      {activeTab === 'categories' && renderCategoryChart()}
      {activeTab === 'suppliers' && renderSupplierChart()}
      {activeTab === 'stock' && renderStockHealthChart()}
      {activeTab === 'recommendations' && renderRecommendationsChart()}
    </div>
  );
}