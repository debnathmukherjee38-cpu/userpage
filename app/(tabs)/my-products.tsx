import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, Switch } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2 } from 'lucide-react-native';

interface SellerProduct {
  id: string;
  product_id: string;
  stock_status: string;
  product: {
    name: string;
    brand: string;
    category: string;
    base_price: number;
    image_url: string | null;
  };
}

export default function MyProductsScreen() {
  const { user } = useAuth();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('seller_products')
        .select(`
          id,
          product_id,
          stock_status,
          product:master_products(name, brand, category, base_price, image_url)
        `)
        .eq('seller_id', user.id);

      setProducts((data || []) as any);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const toggleStock = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'available' ? 'out_of_stock' : 'available';

    const { error } = await supabase
      .from('seller_products')
      .update({ stock_status: newStatus })
      .eq('id', productId);

    if (!error) {
      setProducts(products.map(p =>
        p.id === productId ? { ...p, stock_status: newStatus } : p
      ));
    }
  };

  const removeProduct = async (productId: string) => {
    const { error } = await supabase
      .from('seller_products')
      .delete()
      .eq('id', productId);

    if (!error) {
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  const renderProduct = ({ item }: { item: SellerProduct }) => {
    const isAvailable = item.stock_status === 'available';

    return (
      <View style={styles.productCard}>
        <View style={styles.cardContent}>
          {item.product.image_url ? (
            <Image source={{ uri: item.product.image_url }} style={styles.productImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}

          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.product.name}
            </Text>
            <Text style={styles.productBrand}>{item.product.brand}</Text>
            <Text style={styles.productPrice}>₹{item.product.base_price}</Text>

            <View style={styles.stockContainer}>
              <View style={styles.stockToggle}>
                <Text style={styles.stockLabel}>
                  {isAvailable ? '🟢 Available' : '🔴 Out of Stock'}
                </Text>
                <Switch
                  value={isAvailable}
                  onValueChange={() => toggleStock(item.id, item.stock_status)}
                  trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                  thumbColor={isAvailable ? '#10b981' : '#9ca3af'}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => removeProduct(item.id)}
          >
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Products</Text>
        <Text style={styles.headerSubtitle}>{products.length} products listed</Text>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products added yet</Text>
            <Text style={styles.emptySubtext}>Browse the catalog to add products</Text>
          </View>
        }
      />
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
  listContent: {
    padding: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    color: '#6b7280',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 4,
  },
  stockContainer: {
    marginTop: 8,
  },
  stockToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  deleteButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
