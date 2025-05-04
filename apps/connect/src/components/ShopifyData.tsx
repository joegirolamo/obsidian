'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ShopifyData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export default function ShopifyData() {
  const { data: session } = useSession();
  const [data, setData] = useState<ShopifyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch('/api/shopify');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch Shopify data');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">No Shopify data available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Orders</h3>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{data.totalOrders.toLocaleString()}</p>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
        <p className="mt-2 text-2xl font-semibold text-gray-900">${data.totalRevenue.toLocaleString()}</p>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Avg. Order Value</h3>
        <p className="mt-2 text-2xl font-semibold text-gray-900">${data.averageOrderValue.toLocaleString()}</p>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{data.totalCustomers.toLocaleString()}</p>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">New Customers</h3>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{data.newCustomers.toLocaleString()}</p>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Returning Customers</h3>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{data.returningCustomers.toLocaleString()}</p>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{data.totalProducts.toLocaleString()}</p>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Low Stock Products</h3>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{data.lowStockProducts.toLocaleString()}</p>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Out of Stock Products</h3>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{data.outOfStockProducts.toLocaleString()}</p>
      </div>
    </div>
  );
} 