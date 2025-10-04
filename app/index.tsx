import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function IndexScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkProfile = async () => {
      if (loading) return;

      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      const { data } = await supabase
        .from('sellers')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/profile-setup');
      }
    };

    checkProfile();
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
});
