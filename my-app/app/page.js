'use client';

import { useState } from 'react';
import RecommendationWidget from '../components/RecommendationWidget';
import { Box, BarChart3, User, Bell, Search } from 'lucide-react';
import inventoryData from '../data/inventory-data.json';

export default function Home() {
  // Calculate inventory stats
  const itemsBelowReorderLevel = inventoryData.filter(
    item => item.current_stock < item.reorder_level
  ).length;
  
  const itemsBelowReorderPercentage = 
    (itemsBelowReorderLevel / inventoryData.length) * 100;
    
  const fastMovingItems = inventoryData.filter(
    item => item.avg_daily_sales > 2
  ).length;
  
  const fastMovingPercentage = 
    (fastMovingItems / inventoryData.length) * 100;
    
  const totalStockValue = inventoryData.reduce(
    (sum, item) => sum + (item.current_stock * item.price), 0
  ).toFixed(2);
  
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Box className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">ERP Dashboard</h1>
            </div>
            <div className="flex-1 max-w-lg mx-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search inventory..."
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Inventory Management</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecommendationWidget 
              inventoryData={inventoryData} 
              useAI={true} // Enable AI by default
            />
          </div>
          
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Inventory Summary</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-500">Total Items</span>
                  <span className="text-gray-900">{inventoryData.length}</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-500">Items Below Reorder Level</span>
                  <span className="text-amber-600">
                    {itemsBelowReorderLevel}
                  </span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-amber-600 h-2 rounded-full" 
                    style={{ width: `${itemsBelowReorderPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-500">Fast-Moving Items</span>
                  <span className="text-green-600">{fastMovingItems}</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${fastMovingPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-500">Total Stock Value</span>
                  <span className="text-blue-600">${totalStockValue}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Categories Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(inventoryData.reduce((acc, item) => {
                  acc[item.category] = (acc[item.category] || 0) + 1;
                  return acc;
                }, {})).map(([category, count]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span className="text-gray-500">{category}</span>
                    <span className="text-gray-900">{count} items</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Suppliers</h4>
              <div className="space-y-2">
                {Object.entries(inventoryData.reduce((acc, item) => {
                  acc[item.supplier] = (acc[item.supplier] || 0) + 1;
                  return acc;
                }, {})).map(([supplier, count]) => (
                  <div key={supplier} className="flex justify-between text-sm">
                    <span className="text-gray-500">{supplier}</span>
                    <span className="text-gray-900">{count} items</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}