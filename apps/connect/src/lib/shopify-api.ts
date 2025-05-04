import { prisma } from './prisma';
import { refreshToolConnection } from './oauth';

interface ShopifyResponse {
  data: any;
  errors?: Array<{
    message: string;
    locations: Array<{
      line: number;
      column: number;
    }>;
    path: string[];
    extensions: Record<string, any>;
  }>;
}

export async function getShopifyData(userId: string, query: string, variables: Record<string, any> = {}) {
  const connection = await prisma.toolConnection.findUnique({
    where: {
      userId_toolName: {
        userId,
        toolName: 'Shopify',
      },
    },
  });

  if (!connection) {
    throw new Error('Shopify connection not found');
  }

  if (!connection.accessToken) {
    throw new Error('No access token available');
  }

  // Check if token needs refresh
  if (connection.expiresAt && connection.expiresAt <= new Date()) {
    await refreshToolConnection(userId, 'Shopify');
  }

  const response = await fetch(`https://${process.env.SHOPIFY_SHOP_DOMAIN}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': connection.accessToken,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.statusText}`);
  }

  return response.json() as Promise<ShopifyResponse>;
}

export async function getOrders(userId: string, first: number = 10) {
  const query = `
    query GetOrders($first: Int!) {
      orders(first: $first) {
        edges {
          node {
            id
            name
            totalPriceSet {
              shopMoney {
                amount
              }
            }
            createdAt
            status
            customer {
              firstName
              lastName
              email
            }
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                  variant {
                    price
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  return getShopifyData(userId, query, { first });
}

export async function getProducts(userId: string, first: number = 10) {
  const query = `
    query GetProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            description
            handle
            status
            totalInventory
            priceRange {
              minVariantPrice {
                amount
              }
              maxVariantPrice {
                amount
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
          }
        }
      }
    }
  `;

  return getShopifyData(userId, query, { first });
}

export async function getCustomers(userId: string, first: number = 10) {
  const query = `
    query GetCustomers($first: Int!) {
      customers(first: $first) {
        edges {
          node {
            id
            firstName
            lastName
            email
            phone
            ordersCount
            totalSpent
            createdAt
            lastOrder {
              name
              totalPriceSet {
                shopMoney {
                  amount
                }
              }
            }
          }
        }
      }
    }
  `;

  return getShopifyData(userId, query, { first });
}

export async function getAnalytics(userId: string, startDate: string, endDate: string) {
  const query = `
    query GetAnalytics($startDate: DateTime!, $endDate: DateTime!) {
      analyticsData {
        orders {
          totalOrders
          totalRevenue
          averageOrderValue
          totalDiscounts
          totalTaxes
          totalShipping
        }
        customers {
          totalCustomers
          newCustomers
          returningCustomers
        }
        products {
          totalProducts
          lowStockProducts
          outOfStockProducts
        }
        salesByDate(startDate: $startDate, endDate: $endDate) {
          date
          orders
          revenue
        }
      }
    }
  `;

  return getShopifyData(userId, query, {
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString(),
  });
} 