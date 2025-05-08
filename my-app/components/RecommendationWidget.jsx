'use client';

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, AlertCircle, Tag, Clock, TrendingUp, 
  TrendingDown, Users, ExternalLink, Filter, Check,
  FileText, Download, Printer, Sliders, BarChart2
} from 'lucide-react';
import { 
  generateRecommendations, 
  generateAIRecommendations,
  generateInventoryReport 
} from '../utils/recommendationLogic';
import ReportVisualizations from './ReportVisualizations';

export default function RecommendationWidget({ inventoryData, useAI = false }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dismissedRecs, setDismissedRecs] = useState([]);
  const [report, setReport] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [showVisualizations, setShowVisualizations] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(useAI);
  
  useEffect(() => {
    async function fetchRecommendations() {
      setLoading(true);
      try {
        if (aiEnabled) {
          const aiRecs = await generateAIRecommendations(inventoryData);
          setRecommendations(aiRecs);
        } else {
          const ruleRecs = generateRecommendations(inventoryData);
          setRecommendations(ruleRecs);
        }
      } catch (error) {
        console.error('Error generating recommendations:', error);
        // Fallback to rule-based recommendations
        const fallbackRecs = generateRecommendations(inventoryData);
        setRecommendations(fallbackRecs);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRecommendations();
  }, [inventoryData, aiEnabled]);
  
  // Generate report when needed
  const generateReport = () => {
    const reportData = generateInventoryReport(inventoryData, recommendations);
    setReport(reportData);
    setShowReport(true);
  };
  
  // Export report as JSON
  const exportReportAsJSON = () => {
    if (!report) {
      generateReport();
    }
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'inventory-report.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  // Print report
  const printReport = () => {
    if (!report) {
      generateReport();
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Inventory Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 1000px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              color: #2563eb;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 10px;
            }
            h2 {
              color: #4b5563;
              margin-top: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 8px 12px;
              text-align: left;
            }
            th {
              background-color: #f9fafb;
            }
            .metrics {
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
              margin-bottom: 20px;
            }
            .metric {
              flex: 1;
              min-width: 200px;
              background-color: #f9fafb;
              border-radius: 8px;
              padding: 15px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .metric-value {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
            }
            .metric-label {
              font-size: 14px;
              color: #6b7280;
            }
            .recommendation {
              margin-bottom: 10px;
              padding: 10px;
              border-left: 4px solid #ddd;
            }
            .recommendation.high {
              border-left-color: #ef4444;
              background-color: #fee2e2;
            }
            .recommendation.medium {
              border-left-color: #f59e0b;
              background-color: #fef3c7;
            }
            .recommendation.low {
              border-left-color: #10b981;
              background-color: #d1fae5;
            }
            @media print {
              body {
                font-size: 12pt;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>Inventory Report</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
          
          <h2>Summary</h2>
          <div class="metrics">
            <div class="metric">
              <div class="metric-value">${report.summary.totalItems}</div>
              <div class="metric-label">Total Items</div>
            </div>
            <div class="metric">
              <div class="metric-value">$${parseFloat(report.summary.totalValue).toLocaleString()}</div>
              <div class="metric-label">Total Value</div>
            </div>
            <div class="metric">
              <div class="metric-value">${report.summary.itemsBelowReorderLevel}</div>
              <div class="metric-label">Items Below Reorder Level</div>
            </div>
            <div class="metric">
              <div class="metric-value">${report.summary.healthScore}%</div>
              <div class="metric-label">Inventory Health Score</div>
            </div>
          </div>
          
          <h2>Category Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Items</th>
                <th>Value</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${report.categoryBreakdown.map(cat => `
                <tr>
                  <td>${cat.category}</td>
                  <td>${cat.itemCount}</td>
                  <td>$${parseFloat(cat.value).toLocaleString()}</td>
                  <td>${cat.percentage}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h2>Supplier Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Items</th>
                <th>Value</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${report.supplierBreakdown.map(sup => `
                <tr>
                  <td>${sup.supplier}</td>
                  <td>${sup.itemCount}</td>
                  <td>$${parseFloat(sup.value).toLocaleString()}</td>
                  <td>${sup.percentage}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h2>Stock Health</h2>
          <p>Overall Health: ${report.stockHealth.overall}%</p>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Health Score</th>
                <th>Items Below Reorder</th>
                <th>Total Items</th>
              </tr>
            </thead>
            <tbody>
              ${report.stockHealth.byCategory.map(cat => `
                <tr>
                  <td>${cat.category}</td>
                  <td>${cat.healthPercentage.toFixed(1)}%</td>
                  <td>${cat.belowReorderCount}</td>
                  <td>${cat.itemCount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h2>Action Items</h2>
          <h3>Top Items to Restock</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Current Stock</th>
                <th>Reorder Level</th>
                <th>Days Until Empty</th>
              </tr>
            </thead>
            <tbody>
              ${report.actionItems.itemsToRestock.map(item => `
                <tr>
                  <td>${item.item_name}</td>
                  <td>${item.current_stock}</td>
                  <td>${item.reorder_level}</td>
                  <td>${item.daysUntilEmpty}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h3>Slow-Moving Items</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Current Stock</th>
                <th>Value</th>
                <th>Avg. Daily Sales</th>
              </tr>
            </thead>
            <tbody>
              ${report.actionItems.slowMovingItems.map(item => `
                <tr>
                  <td>${item.item_name}</td>
                  <td>${item.current_stock}</td>
                  <td>$${(item.current_stock * item.price).toFixed(2)}</td>
                  <td>${item.avg_daily_sales}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h2>Recommendations</h2>
          ${report.recommendations.map(rec => `
            <div class="recommendation ${rec.priority}">
              <strong>${rec.message}</strong>
              <p>${rec.detail}</p>
            </div>
          `).join('')}
          
          <div class="no-print">
            <p style="margin-top: 30px; text-align: center;">
              <button onclick="window.print()">Print Report</button>
            </p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };
  
  const dismissRecommendation = (id) => {
    setDismissedRecs([...dismissedRecs, id]);
  };
  
  const filteredRecommendations = recommendations.filter(rec => {
    if (dismissedRecs.includes(rec.id)) return false;
    if (filter === 'all') return true;
    return rec.type === filter;
  });
  
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'alert-triangle':
        return <AlertTriangle className="h-5 w-5" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5" />;
      case 'chart-up':
        return <TrendingUp className="h-5 w-5" />;
      case 'chart-down':
        return <TrendingDown className="h-5 w-5" />;
      case 'clock':
        return <Clock className="h-5 w-5" />;
      case 'tag':
        return <Tag className="h-5 w-5" />;
      case 'users':
        return <Users className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };
  
  const getTypeStyles = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'danger':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };
  
  const getIconStyles = (type) => {
    switch (type) {
      case 'warning':
        return 'text-amber-500';
      case 'danger':
        return 'text-red-500';
      case 'success':
        return 'text-green-500';
      case 'info':
      default:
        return 'text-blue-500';
    }
  };
  
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
            Medium Priority
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Low Priority
          </span>
        );
      default:
        return null;
    }
  };
  
  // Show visualizations
  if (showVisualizations) {
    return (
      <div className="bg-white shadow rounded-lg p-4 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Inventory Analytics
          </h2>
          <button 
            onClick={() => setShowVisualizations(false)}
            className="px-3 py-1 text-sm border text-black border-gray-400 rounded-md hover:bg-gray-50"
          >
            Back to Recommendations
          </button>
        </div>
        
        <ReportVisualizations inventoryData={inventoryData} recommendations={recommendations} />
      </div>
    );
  }

  // If showing the report, render the report view
  if (showReport && report) {
    return (
      <div className="bg-white shadow rounded-lg p-4 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Inventory Report
          </h2>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowReport(false)}
              className="px-3 py-1 text-sm border border-gray-400 text-gray-800 rounded-md hover:bg-gray-50"
            >
              Back to Recommendations
            </button>
            <button 
              onClick={exportReportAsJSON}
              className="px-3 py-1 text-sm border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 flex items-center"
            >
              <Download className="h-4 w-4 mr-1" /> Export
            </button>
            <button 
              onClick={printReport}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
            >
              <Printer className="h-4 w-4 mr-1" /> Print
            </button>
          </div>
        </div>
        
        <div className="border-b pb-4 mb-4">
          <p className="text-sm text-gray-500">
            Generated on {new Date().toLocaleString()}
          </p>
        </div>

        <div className="space-y-6">
          {/* Summary section */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{report.summary.totalItems}</div>
                <div className="text-sm text-gray-500">Total Items</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">${parseFloat(report.summary.totalValue).toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Value</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{report.summary.itemsBelowReorderLevel}</div>
                <div className="text-sm text-gray-500">Items Below Reorder Level</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{report.summary.healthScore}%</div>
                <div className="text-sm text-gray-500">Inventory Health Score</div>
              </div>
            </div>
          </div>
          
          {/* Category Breakdown */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">Category Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.categoryBreakdown.map((category, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.itemCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${parseFloat(category.value).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Stock Health */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">Stock Health</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Overall Health: <span className="font-medium text-blue-600">{report.stockHealth.overall}%</span></p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health Score</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Below Reorder</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Items</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.stockHealth.byCategory.map((category, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.healthPercentage.toFixed(1)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.belowReorderCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.itemCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Action Items */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">Action Items</h3>
            
            {/* Items to Restock */}
            <h4 className="text-sm font-medium text-gray-600 mb-2">Top Items to Restock</h4>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Level</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Until Empty</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.actionItems.itemsToRestock.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.item_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.current_stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reorder_level}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.daysUntilEmpty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Slow-Moving Items */}
            <h4 className="text-sm font-medium text-gray-600 mb-2">Slow-Moving Items</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Daily Sales</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.actionItems.slowMovingItems.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.item_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.current_stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(item.current_stock * item.price).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.avg_daily_sales}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Top Recommendations */}
          <div>
            <h3 className="text-md font-medium text-black mb-3">Top Recommendations</h3>
            <div className="space-y-3">
              {report.recommendations.map((rec, index) => (
                <div key={index} className={`border-l-4 rounded-r-lg p-3 ${
                  rec.priority === 'high' ? 'border-red-500 text-gray-700 bg-red-50' : 
                  rec.priority === 'medium' ? 'border-amber-500 text-gray-700 bg-amber-50' : 
                  'border-blue-500 bg-blue-50'
                }`}>
                  <h4 className="font-medium">{rec.message}</h4>
                  <p className="text-sm mt-1">{rec.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Regular recommendation widget view
  return (
    <div className="bg-white shadow rounded-lg p-4 w-full max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          AI-Powered Inventory Recommendations
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={generateReport}
            className="flex items-center text-sm px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600"
          >
            <FileText className="h-4 w-4 mr-1" /> Generate Report
          </button>
          <button
            onClick={() => setShowVisualizations(!showVisualizations)}
            className="flex items-center text-sm px-3 py-1 rounded-md border border-blue-500 text-blue-500 hover:bg-blue-50"
          >
            <BarChart2 className="h-4 w-4 mr-1" /> Analytics
          </button>
          <div className="flex items-center space-x-2 ml-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Use AI</span>
            </label>
          </div>
          <div className="flex items-center space-x-2 border-l border-gray-200 pl-4 ml-2">
            <Filter className="text-gray-400 h-4 w-4" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border rounded-md px-2 py-1 text-gray-600"
            >
              <option value="all">All</option>
              <option value="warning">Warnings</option>
              <option value="danger">Critical</option>
              <option value="success">Opportunities</option>
              <option value="info">Information</option>
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        </div>
      ) : filteredRecommendations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Check className="mx-auto h-12 w-12 text-green-500 mb-3" />
          <p>No recommendations to display.</p>
          <p className="text-sm mt-1">All inventory items are within optimal parameters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecommendations.map((recommendation) => (
            <div 
              key={recommendation.id} 
              className={`relative border rounded-lg p-3 ${getTypeStyles(recommendation.type)}`}
            >
              <div className="flex items-start">
                <div className={`mr-3 mt-1 ${getIconStyles(recommendation.type)}`}>
                  {getIcon(recommendation.icon)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{recommendation.message}</h3>
                      <p className="text-sm mt-1 opacity-90">{recommendation.detail}</p>
                    </div>
                    <button 
                      onClick={() => dismissRecommendation(recommendation.id)}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label="Dismiss recommendation"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {getPriorityBadge(recommendation.priority)}
                      {recommendation.actionRequired && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          Action Required
                        </span>
                      )}
                    </div>
                    <button className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800">
                      View Item <ExternalLink className="ml-1 h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 text-right">
        {aiEnabled ? 'AI-powered recommendations' : 'Rule-based recommendations'} • {recommendations.length} items analyzed • Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}