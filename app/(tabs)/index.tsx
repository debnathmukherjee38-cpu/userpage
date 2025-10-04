import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Package, ShoppingCart, DollarSign, TrendingUp, Plus, List } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface DashboardStats {
  totalProducts: number;
  inStock: number;
  outOfStock: number;
  totalOrders: number;
  revenue: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    inStock: 0,
    outOfStock: 0,
    totalOrders: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    if (!user) return;

    try {
      const [productsRes, ordersRes] = await Promise.all([
        supabase
          .from('seller_products')
          .select('stock_status')
          .eq('seller_id', user.id),
        supabase
          .from('orders')
          .select('total_amount, status')
          .eq('seller_id', user.id),
      ]);

      const products = productsRes.data || [];
      const orders = ordersRes.data || [];

      const inStock = products.filter(p => p.stock_status === 'available').length;
      const outOfStock = products.filter(p => p.stock_status === 'out_of_stock').length;
      const revenue = orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

      setStats({
        totalProducts: products.length,
        inStock,
        outOfStock,
        totalOrders: orders.length,
        revenue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage your shop</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#dbeafe' }]}>
            <View style={styles.statIconContainer}>
              <Package size={24} color="#2563eb" />
            </View>
            <Text style={styles.statValue}>{stats.totalProducts}</Text>
            <Text style={styles.statLabel}>Total Products</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={24} color="#16a34a" />
            </View>
            <Text style={styles.statValue}>{stats.inStock}</Text>
            <Text style={styles.statLabel}>In Stock</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#fee2e2' }]}>
            <View style={styles.statIconContainer}>
              <Package size={24} color="#dc2626" />
            </View>
            <Text style={styles.statValue}>{stats.outOfStock}</Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
            <View style={styles.statIconContainer}>
              <ShoppingCart size={24} color="#d97706" />
            </View>
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
        </View>

        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <DollarSign size={32} color="#10b981" />
            <Text style={styles.revenueLabel}>Total Revenue</Text>
          </View>
          <Text style={styles.revenueValue}>₹{stats.revenue.toFixed(2)}</Text>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/catalog')}
          >
            <View style={styles.actionIconContainer}>
              <Plus size={24} color="#fff" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Add Products</Text>
              <Text style={styles.actionSubtitle}>Browse catalog and add to your shop</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/orders')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#f59e0b' }]}>
              <List size={24} color="#fff" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Orders</Text>
              <Text style={styles.actionSubtitle}>Manage and update order status</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  revenueCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  revenueLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
    marginLeft: 8,
  },
  revenueValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#10b981',
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
});
