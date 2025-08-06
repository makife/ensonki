import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings as SettingsIcon, Bell, Volume2, VolumeX, Palette, Info, LogOut, Shield, CircleHelp as HelpCircle, Mail, Star, Moon, Sun } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkTheme, setDarkTheme] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleNotificationToggle = async (value: boolean) => {
    setNotifications(value);
    try {
      await AsyncStorage.setItem('notifications_enabled', value.toString());
    } catch (error) {
      console.error('Save notification setting error:', error);
    }
  };

  const handleSoundToggle = async (value: boolean) => {
    setSoundEnabled(value);
    try {
      await AsyncStorage.setItem('sound_enabled', value.toString());
    } catch (error) {
      console.error('Save sound setting error:', error);
    }
  };

  const handleThemeToggle = async (value: boolean) => {
    setDarkTheme(value);
    try {
      await AsyncStorage.setItem('dark_theme', value.toString());
      // Burada tema değişikliği uygulanacak
    } catch (error) {
      console.error('Save theme setting error:', error);
    }
  };

  const handleRateApp = () => {
    Alert.alert(
      'Uygulamayı Değerlendir',
      'Uygulamayı beğendiniz mi? App Store\'da değerlendirmenizi bırakın!',
      [
        { text: 'Daha Sonra', style: 'cancel' },
        { text: 'Değerlendir', onPress: () => {
          // App Store/Play Store linking burada olacak
          console.log('Opening app store for rating');
        }}
      ]
    );
  };

  const handleContactUs = () => {
    Alert.alert(
      'İletişim',
      'Bizimle iletişime geçin:\n\nE-posta: destek@kelimeoyunu.com\nTelefon: +90 (212) 123-45-67',
      [{ text: 'Tamam' }]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Gizlilik Politikası',
      'Gizlilik politikamızı web sitemizden okuyabilirsiniz.',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Web Sitesini Aç', onPress: () => {
          // Web browser açma burada olacak
          console.log('Opening privacy policy');
        }}
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Çıkış Yap', 
          style: 'destructive',
          onPress: async () => {
            setLoading('signout');
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
            } finally {
              setLoading(null);
            }
          }
        }
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent,
    disabled = false
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, disabled && styles.disabledItem]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, disabled && styles.disabledText]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, disabled && styles.disabledText]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightComponent && (
        <View style={styles.settingRight}>
          {rightComponent}
        </View>
      )}
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#6B7280', '#4B5563']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <SettingsIcon size={32} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Ayarlar</Text>
            <Text style={styles.headerSubtitle}>
              Uygulamayı tercihlerinize göre özelleştirin
            </Text>
          </View>
        </LinearGradient>

        {/* Game Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oyun Ayarları</Text>
          
          <View style={styles.settingsContainer}>
            <SettingItem
              icon={notifications ? <Bell size={24} color="#3B82F6" /> : <Bell size={24} color="#9CA3AF" />}
              title="Bildirimler"
              subtitle="Oyun davetleri ve güncellemeler"
              rightComponent={
                <Switch
                  value={notifications}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                  thumbColor="#FFFFFF"
                />
              }
            />

            <SettingItem
              icon={soundEnabled ? <Volume2 size={24} color="#10B981" /> : <VolumeX size={24} color="#9CA3AF" />}
              title="Ses Efektleri"
              subtitle="Oyun seslerini aç/kapat"
              rightComponent={
                <Switch
                  value={soundEnabled}
                  onValueChange={handleSoundToggle}
                  trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              }
            />

            <SettingItem
              icon={darkTheme ? <Moon size={24} color="#8B5CF6" /> : <Sun size={24} color="#F59E0B" />}
              title="Tema"
              subtitle={darkTheme ? 'Koyu tema aktif' : 'Açık tema aktif'}
              rightComponent={
                <Switch
                  value={darkTheme}
                  onValueChange={handleThemeToggle}
                  trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap</Text>
          
          <View style={styles.settingsContainer}>
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>Kullanıcı Adı</Text>
              <Text style={styles.accountValue}>{user.displayName}</Text>
            </View>
            
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>E-posta</Text>
              <Text style={styles.accountValue}>{user.email}</Text>
            </View>
            
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>Giriş Yöntemi</Text>
              <Text style={styles.accountValue}>
                {user.provider === 'google' ? 'Google' : 
                 user.provider === 'facebook' ? 'Facebook' : 'E-posta'}
              </Text>
            </View>
          </View>
        </View>

        {/* Support & Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destek ve Bilgi</Text>
          
          <View style={styles.settingsContainer}>
            <SettingItem
              icon={<Star size={24} color="#F59E0B" />}
              title="Uygulamayı Değerlendir"
              subtitle="App Store'da bizi destekleyin"
              onPress={handleRateApp}
            />

            <SettingItem
              icon={<Mail size={24} color="#3B82F6" />}
              title="İletişim"
              subtitle="Sorularınız için bizimle iletişime geçin"
              onPress={handleContactUs}
            />

            <SettingItem
              icon={<HelpCircle size={24} color="#8B5CF6" />}
              title="Yardım ve SSS"
              subtitle="Sık sorulan sorular"
              onPress={() => Alert.alert('Yardım', 'Yardım sayfası yakında açılacak!')}
            />

            <SettingItem
              icon={<Shield size={24} color="#10B981" />}
              title="Gizlilik Politikası"
              subtitle="Verilerinizi nasıl koruduğumuz"
              onPress={handlePrivacyPolicy}
            />

            <SettingItem
              icon={<Info size={24} color="#6B7280" />}
              title="Hakkımızda"
              subtitle="Uygulama bilgileri ve sürüm"
              onPress={() => Alert.alert(
                'Hakkımızda',
                'Kelime Oyunu v1.0.0\n\nTürkçe kelime oyunu severleri için geliştirildi.\n\n© 2024 Kelime Oyunu Ekibi'
              )}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <View style={styles.settingsContainer}>
            <SettingItem
              icon={<LogOut size={24} color="#EF4444" />}
              title="Çıkış Yap"
              subtitle="Hesabınızdan güvenli şekilde çıkın"
              onPress={handleSignOut}
              disabled={loading === 'signout'}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Kelime Oyunu v1.0.0</Text>
          <Text style={styles.appInfoSubtext}>Made with ❤️ in Turkey</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#6B7280',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  headerSubtitle: {
    color: '#D1D5DB',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  settingsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  disabledItem: {
    opacity: 0.5,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  settingRight: {
    marginLeft: 16,
  },
  accountInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  accountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  accountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 0,
  },
  appInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  appInfoSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});