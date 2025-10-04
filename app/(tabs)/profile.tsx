import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { User, Store, Phone, Mail, MapPin, FileText, LogOut, CreditCard as Edit2, Save } from 'lucide-react-native';

interface SellerProfile {
  shop_name: string;
  owner_name: string;
  phone: string;
  email: string;
  address: string;
  gst_number: string | null;
  is_verified: boolean;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<SellerProfile | null>(null);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setEditedProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !editedProfile) return;

    const { error } = await supabase
      .from('sellers')
      .update({
        shop_name: editedProfile.shop_name,
        owner_name: editedProfile.owner_name,
        phone: editedProfile.phone,
        address: editedProfile.address,
        gst_number: editedProfile.gst_number,
      })
      .eq('id', user.id);

    if (!error) {
      setProfile(editedProfile);
      setEditing(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  if (loading || !profile) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your shop details</Text>
          </View>
          {!editing ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditing(true)}
            >
              <Edit2 size={20} color="#2563eb" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Save size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Store size={40} color="#2563eb" />
            </View>
            {profile.is_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Store size={20} color="#6b7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Shop Name</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={editedProfile?.shop_name}
                    onChangeText={(text) =>
                      setEditedProfile({ ...editedProfile!, shop_name: text })
                    }
                  />
                ) : (
                  <Text style={styles.infoValue}>{profile.shop_name}</Text>
                )}
              </View>
            </View>

            <View style={styles.infoItem}>
              <User size={20} color="#6b7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Owner Name</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={editedProfile?.owner_name}
                    onChangeText={(text) =>
                      setEditedProfile({ ...editedProfile!, owner_name: text })
                    }
                  />
                ) : (
                  <Text style={styles.infoValue}>{profile.owner_name}</Text>
                )}
              </View>
            </View>

            <View style={styles.infoItem}>
              <Phone size={20} color="#6b7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={editedProfile?.phone}
                    onChangeText={(text) =>
                      setEditedProfile({ ...editedProfile!, phone: text })
                    }
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.infoValue}>{profile.phone}</Text>
                )}
              </View>
            </View>

            <View style={styles.infoItem}>
              <Mail size={20} color="#6b7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile.email}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <MapPin size={20} color="#6b7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Address</Text>
                {editing ? (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editedProfile?.address}
                    onChangeText={(text) =>
                      setEditedProfile({ ...editedProfile!, address: text })
                    }
                    multiline
                    numberOfLines={3}
                  />
                ) : (
                  <Text style={styles.infoValue}>{profile.address}</Text>
                )}
              </View>
            </View>

            <View style={styles.infoItem}>
              <FileText size={20} color="#6b7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>GST Number</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={editedProfile?.gst_number || ''}
                    onChangeText={(text) =>
                      setEditedProfile({ ...editedProfile!, gst_number: text })
                    }
                    placeholder="Optional"
                  />
                ) : (
                  <Text style={styles.infoValue}>
                    {profile.gst_number || 'Not provided'}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  verifiedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verifiedText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  infoSection: {
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
