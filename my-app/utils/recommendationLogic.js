// This file contains the logic to generate inventory recommendations

// Hardcoded Gemini API key (in a real application, use environment variables)
const GEMINI_API_KEY = "AIzaSyAWD87UDqb_f2luGB5x__lcVXxBjLQ7lVQ"; // Replace with your actual API key

/**
 * Generate recommendations based on inventory data
 * @param {Array} inventoryData - Array of inventory items
 * @returns {Array} - Array of recommendation objects
 */
export function generateRecommendations(inventoryData) {
  const recommendations = [];
  const currentDate = new Date();

  inventoryData.forEach(item => {
    // Calculate days since last restock
    const lastRestockedDate = new Date(item.last_restocked_date);
    const daysSinceRestock = Math.floor((currentDate - lastRestockedDate) / (1000 * 60 * 60 * 24));

    // Calculate days until stock runs out
    const daysUntilStockout = item.current_stock / item.avg_daily_sales;

    // Recommendation 1: Restock warning when stock is below reorder level
    if (item.current_stock < item.reorder_level) {
      const daysUntilEmpty = Math.floor(item.current_stock / item.avg_daily_sales);
      recommendations.push({
        id: `restock-${item.id}`,
        itemId: item.id,
        itemName: item.item_name,
        type: 'warning',
        priority: daysUntilEmpty <= 3 ? 'high' : 'medium',
        message: `Restock ${item.item_name} - Current stock (${item.current_stock}) below reorder level (${item.reorder_level}).`,
        detail: `Will run out in approximately ${daysUntilEmpty} days based on average sales.`,
        actionRequired: true,
        icon: 'alert'
      });
    }

    // Recommendation 2: Slow-moving items
    if (item.avg_daily_sales < 0.5 && item.current_stock > item.reorder_level * 2) {
      recommendations.push({
        id: `slow-${item.id}`,
        itemId: item.id,
        itemName: item.item_name,
        type: 'info',
        priority: 'low',
        message: `${item.item_name} is slow-moving - Consider discounting.`,
        detail: `Current stock of ${item.current_stock} units will last ${Math.floor(item.current_stock / item.avg_daily_sales)} days at current sales rate.`,
        actionRequired: false,
        icon: 'chart-down'
      });
    }

    // Recommendation 3: Fast-moving items
    if (item.avg_daily_sales > 3 && item.current_stock < item.reorder_level * 1.5) {
      recommendations.push({
        id: `fast-${item.id}`,
        itemId: item.id,
        itemName: item.item_name,
        type: 'success',
        priority: 'medium',
        message: `${item.item_name} is selling rapidly - Adjust restock frequency.`,
        detail: `Consider increasing reorder level due to high daily sales (${item.avg_daily_sales} units/day).`,
        actionRequired: false,
        icon: 'chart-up'
      });
    }

    // Recommendation 4: Long time since last restock
    if (daysSinceRestock > 45) {
      recommendations.push({
        id: `old-${item.id}`,
        itemId: item.id,
        itemName: item.item_name,
        type: 'info',
        priority: 'low',
        message: `${item.item_name} hasn't been restocked in ${daysSinceRestock} days.`,
        detail: `Last restock was on ${item.last_restocked_date}. Consider checking supplier relationship.`,
        actionRequired: false,
        icon: 'clock'
      });
    }

    // Recommendation 5: Price optimization opportunity
    if (item.price > 50 && item.avg_daily_sales < 1 && item.current_stock > item.reorder_level) {
      recommendations.push({
        id: `price-${item.id}`,
        itemId: item.id,
        itemName: item.item_name,
        type: 'info',
        priority: 'medium',
        message: `Consider price adjustment for ${item.item_name}.`,
        detail: `High-priced item (${item.price}) with low daily sales (${item.avg_daily_sales}).`,
        actionRequired: false,
        icon: 'tag'
      });
    }

    // Recommendation 6: Imminent stockout
    if (daysUntilStockout < 3 && daysUntilStockout > 0) {
      recommendations.push({
        id: `urgent-${item.id}`,
        itemId: item.id,
        itemName: item.item_name,
        type: 'danger',
        priority: 'high',
        message: `URGENT: ${item.item_name} will stock out in ${Math.ceil(daysUntilStockout)} days.`,
        detail: `Expedite delivery from ${item.supplier}.`,
        actionRequired: true,
        icon: 'alert-triangle'
      });
    }
    
    // Recommendation 7: Supplier diversity
    const suppliersInCategory = new Set();
    inventoryData.forEach(i => {
      if (i.category === item.category) {
        suppliersInCategory.add(i.supplier);
      }
    });
    
    if (suppliersInCategory.size === 1 && Math.random() > 0.8) { // Only show this randomly for some items
      recommendations.push({
        id: `supplier-${item.id}`,
        itemId: item.id,
        itemName: item.item_name,
        type: 'info',
        priority: 'low',
        message: `Consider diversifying suppliers for ${item.category}.`,
        detail: `All ${item.category} items are sourced from a single supplier (${item.supplier}).`,
        actionRequired: false,
        icon: 'users'
      });
    }
  });

  // Sort recommendations by priority
  const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
  recommendations.sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return recommendations;
}

/**
 * Generate AI-enhanced recommendations using Gemini API
 * @param {Array} inventoryData - Array of inventory items
 * @returns {Promise<Array>} - Array of recommendation objects
 */
export async function generateAIRecommendations(inventoryData) {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this inventory data and provide inventory management recommendations:
            ${JSON.stringify(inventoryData, null, 2)}
            
            Provide at least 5 specific, actionable recommendations in JSON format with these fields:
            - id: a unique identifier for the recommendation
            - itemId: the id of the item
            - itemName: the name of the item
            - type: one of [warning, info, success, danger]
            - priority: one of [high, medium, low]
            - message: a short recommendation message
            - detail: more detailed explanation
            - actionRequired: boolean indicating if action is needed
            - icon: suggested icon name (one of: alert, alert-triangle, chart-up, chart-down, clock, tag, users)`
          }]
        }]
      })
    });
    
    const data = await response.json();
    
    // Extract the JSON string from the response and parse it
    try {
      // Look for JSON in the response text
      const responseText = data.candidates[0].content.parts[0].text;
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        // Parse the matched JSON string
        const aiRecommendations = JSON.parse(jsonMatch[0]);
        return aiRecommendations;
      } else {
        console.error('Could not find JSON in Gemini response');
        return generateRecommendations(inventoryData);
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      return generateRecommendations(inventoryData);
    }
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    // Fallback to rule-based recommendations if AI fails
    return generateRecommendations(inventoryData);
  }
}

/**
 * Generate an inventory report based on inventory data and recommendations
 * @param {Array} inventoryData - Array of inventory items
 * @param {Array} recommendations - Array of recommendation objects
 * @returns {Object} - Report object with various sections and metrics
 */
export function generateInventoryReport(inventoryData, recommendations) {
  // Calculate key metrics
  const totalItems = inventoryData.length;
  const totalValue = inventoryData.reduce((sum, item) => sum + (item.current_stock * item.price), 0);
  const itemsBelowReorderLevel = inventoryData.filter(item => item.current_stock < item.reorder_level).length;
  const criticalItems = recommendations.filter(rec => rec.priority === 'high').length;
  
  // Category breakdown
  const categoryBreakdown = inventoryData.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || { count: 0, value: 0 };
    acc[item.category].count += 1;
    acc[item.category].value += item.current_stock * item.price;
    return acc;
  }, {});
  
  // Supplier breakdown
  const supplierBreakdown = inventoryData.reduce((acc, item) => {
    acc[item.supplier] = acc[item.supplier] || { count: 0, value: 0 };
    acc[item.supplier].count += 1;
    acc[item.supplier].value += item.current_stock * item.price;
    return acc;
  }, {});
  
  // Stock health metrics
  const stockHealthByCategory = Object.entries(categoryBreakdown).map(([category, data]) => {
    const categoryItems = inventoryData.filter(item => item.category === category);
    const belowReorderCount = categoryItems.filter(item => item.current_stock < item.reorder_level).length;
    const healthPercentage = 100 - (belowReorderCount / categoryItems.length * 100);
    
    return {
      category,
      healthPercentage,
      itemCount: categoryItems.length,
      belowReorderCount
    };
  });
  
  // Top items to restock (most urgent)
  const itemsToRestock = inventoryData
    .filter(item => item.current_stock < item.reorder_level)
    .map(item => {
      const daysUntilEmpty = item.avg_daily_sales > 0 ? Math.floor(item.current_stock / item.avg_daily_sales) : 999;
      return {
        ...item,
        daysUntilEmpty
      };
    })
    .sort((a, b) => a.daysUntilEmpty - b.daysUntilEmpty)
    .slice(0, 5);
  
  // Slow-moving inventory
  const slowMovingItems = inventoryData
    .filter(item => item.avg_daily_sales < 0.5 && item.current_stock > item.reorder_level)
    .sort((a, b) => (a.current_stock * a.price) - (b.current_stock * b.price))
    .reverse()
    .slice(0, 5);
  
  // Fast-moving items
  const fastMovingItems = inventoryData
    .filter(item => item.avg_daily_sales > 2)
    .sort((a, b) => b.avg_daily_sales - a.avg_daily_sales)
    .slice(0, 5);
  
  // Generate the report object
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalItems,
      totalValue: totalValue.toFixed(2),
      itemsBelowReorderLevel,
      criticalItems,
      healthScore: (100 - (itemsBelowReorderLevel / totalItems * 100)).toFixed(1)
    },
    categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
      category,
      itemCount: data.count,
      value: data.value.toFixed(2),
      percentage: ((data.count / totalItems) * 100).toFixed(1)
    })),
    supplierBreakdown: Object.entries(supplierBreakdown).map(([supplier, data]) => ({
      supplier,
      itemCount: data.count,
      value: data.value.toFixed(2),
      percentage: ((data.count / totalItems) * 100).toFixed(1)
    })),
    stockHealth: {
      overall: (100 - (itemsBelowReorderLevel / totalItems * 100)).toFixed(1),
      byCategory: stockHealthByCategory
    },
    actionItems: {
      itemsToRestock,
      slowMovingItems,
      fastMovingItems
    },
    recommendations: recommendations.slice(0, 10) // Top 10 recommendations
  };
}