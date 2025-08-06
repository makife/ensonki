import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Volume2, 
  VolumeX, 
  Info, 
  LogOut, 
  Shield, 
  CircleHelp as HelpCircle, 
  Mail, 
  Star, 
  Moon, 
  Sun,
  ExternalLink,
  Trash2
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkTheme, setDarkTheme] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<string>('undetermined');

  // Ayarları yükle
  useEffect(() => {
    loadSettings();
    checkNotificationPermission();
  }, []);

  const loadSettings = async () => {
    try {
      const [notifSetting, soundSetting, themeSetting] = await Promise.all([
        AsyncStorage.getItem('notifications_enabled'),
        AsyncStorage.getItem('sound_enabled'),
        AsyncStorage.getItem('dark_theme')
      ]);

      if (notifSetting !== null) setNotifications(notifSetting === 'true');
      if (soundSetting !== null) setSoundEnabled(soundSetting === 'true');
      if (themeSetting !== null) setDarkTheme(themeSetting === 'true');
    } catch (error) {
      console.error('Load settings error:', error);
    }
  };

  const checkNotificationPermission = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationPermission(status);
    } catch (error) {
      console.error('Check notification permission error:', error);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    try {
      if (value && notificationPermission !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'İzin Gerekli',
            'Bildirim almak için ayarlardan bildirim iznini açmanız gerekiyor.',
            [
              { text: 'İptal', style: 'cancel' },
              { text: 'Ayarlara Git', onPress: () => Linking.openSettings() }
            ]
          );
          return;
        }
        setNotificationPermission(status);
      }

      setNotifications(value);
      await AsyncStorage.setItem('notifications_enabled', value.toString());
      
      // Bildirim kanalını yapılandır
      if (value) {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Kelime Oyunu',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
        });
      }
      
      Alert.alert(
        'Başarılı',
        value ? 'Bildirimler açıldı.' : 'Bildirimler kapatıldı.'
      );
    } catch (error) {
      console.error('Notification toggle error:', error);
      Alert.alert('Hata', 'Bildirim ayarı değiştirilirken bir hata oluştu.');
    }
  };

  const handleSoundToggle = async (value: boolean) => {
    try {
      setSoundEnabled(value);
      await AsyncStorage.setItem('sound_enabled', value.toString());
      
      // Ses ayarı değiştiğinde hafif bir vibrasyon ver
      if (value) {
        // Burada ses çalma işlemi yapılabilir
        console.log('Sound enabled');
      }
      
      Alert.alert(
        'Başarılı',
        value ? 'Ses efektleri açıldı.' : 'Ses efektleri kapatıldı.'
      );
    } catch (error) {
      console.error('Sound toggle error:', error);
      Alert.alert('Hata', 'Ses ayarı değiştirilirken bir hata oluştu.');
    }
  };

  const handleThemeToggle = async (value: boolean) => {
    try {
      setDarkTheme(value);
      await AsyncStorage.setItem('dark_theme', value.toString());
      
      Alert.alert(
        'Tema Değiştirildi',
        value ? 'Koyu tema aktif edildi.' : 'Açık tema aktif edildi.',
        [
          { text: 'Tamam' }
        ]
      );
      
      // Tema değişikliği için global state güncellemesi
      // Bu kısım tema context'i ile yapılabilir
      
    } catch (error) {
      console.error('Theme toggle error:', error);
      Alert.alert('Hata', 'Tema değiştirilirken bir hata oluştu.');
    }
  };

  const handleRateApp = async () => {
    try {
      // iOS ve Android için farklı store linkleri
      const storeUrl = Platform.OS === 'ios' 
        ? 'https://apps.apple.com/app/id123456789'
        : 'https://play.google.com/store/apps/details?id=com.kelimeoyunu';
        
      const canOpen = await Linking.canOpenURL(storeUrl);
      
      if (canOpen) {
        await Linking.openURL(storeUrl);
      } else {
        Alert.alert(
          'Uygulamayı Değerlendir',
          'Uygulamayı beğendiniz mi? Lütfen app store\'da değerlendirin!',
          [{ text: 'Tamam' }]
        );
      }
    } catch (error) {
      console.error('Rate app error:', error);
      Alert.alert('Hata', 'Store açılırken bir hata oluştu.');
    }
  };

  const handleContactUs = () => {
    Alert.alert(
      'İletişim Seçenekleri',
      'Bizimle nasıl iletişime geçmek istersiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'E-posta Gönder', 
          onPress: () => {
            const emailUrl = 'mailto:destek@kelimeoyunu.com?subject=Kelime Oyunu Destek&body=Merhaba,';
            Linking.openURL(emailUrl).catch(() => {
              Alert.alert('Hata', 'E-posta uygulaması açılamadı.');
            });
          }
        },
        { 
          text: 'WhatsApp', 
          onPress: () => {
            const whatsappUrl = 'whatsapp://send?phone=905551234567&text=Merhaba, Kelime Oyunu hakkında bilgi almak istiyorum.';
            Linking.openURL(whatsappUrl).catch(() => {
              Alert.alert('Hata', 'WhatsApp uygulaması bulunamadı.');
            });
          }
        }
      ]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Yardım Konuları',
      'Hangi konuda yardıma ihtiyacınız var?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Nasıl Oynanır?', 
          onPress: () => Alert.alert(
            'Nasıl Oynanır?',
            '1. Verilen harflerden kelimeler oluşturun\n2. Kelimeler en az 3 harfli olmalı\n3. Geçerli Türkçe kelimeler puan getirir\n4. Uzun kelimeler daha fazla puan verir\n5. Hedefe ulaşan kazanır!'
          )
        },
        { 
          text: 'Can Sistemi', 
          onPress: () => Alert.alert(
            'Can Sistemi',
            'Her oyuna 1 can harcanır. Canlar 30 dakikada bir yenilenir. Maksimum 5 can bulundurabilirsiniz. Reklam izleyerek can kazanabilirsiniz.'
          )
        },
        { 
          text: 'Turnuvalar', 
          onPress: () => Alert.alert(
            'Turnuvalar',
            '8 kişilik turnuvalar eleme usulü oynanır. Turnuva kazananı büyük ödüller alır. Turnuvaya katılmak için can gerekir.'
          )
        }
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Gizlilik Politikası',
      'Gizlilik politikamızı okumak ister misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Web Sitesinde Aç', 
          onPress: () => {
            const url = 'https://kelimeoyunu.com/gizlilik-politikasi';
            Linking.openURL(url).catch(() => {
              Alert.alert('Hata', 'Web sitesi açılamadı.');
            });
          }
        },
        {
          text: 'Özetle Göster',
          onPress: () => Alert.alert(
            'Gizlilik Politikası Özeti',
            '• Kişisel verilerinizi koruyoruz\n• Oyun verileriniz güvenli sunucularda saklanır\n• Reklam ortakları anonim veriler alır\n• İstediğiniz zaman hesabınızı silebilirsiniz\n• Verilerinizi üçüncü taraflarla satmayız'
          )
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı Sil',
      'Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz silinir.',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Hesabı Sil', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Son Onay',
              'Hesabınızı silmeyi onaylıyor musunuz?',
              [
                { text: 'İptal', style: 'cancel' },
                { 
                  text: 'Evet, Sil', 
                  style: 'destructive',
                  onPress: async () => {
                    setLoading('delete');
                    try {
                      // Hesap silme işlemi burada yapılacak
                      // Firebase'den kullanıcı verisini sil
                      // Auth hesabını sil
                      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated
                      Alert.alert('Başarılı', 'Hesabınız başarıyla silindi.');
                      await signOut();
                    } catch (error) {
                      console.error('Delete account error:', error);
                      Alert.alert('Hata', 'Hesap silinirken bir hata oluştu.');
                    } finally {
                      setLoading(null);
                    }
                  }
                }
              ]
            );
          }
        }
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
    disabled = false,
    showArrow = false
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    disabled?: boolean;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, disabled && styles.disabledItem]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
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
      {showArrow && (
        <ExternalLink size={16} color="#9CA3AF" style={styles.settingArrow} />
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
              subtitle={notifications ? 'Oyun bildirimleri aktif' : 'Bildirimler kapalı'}
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
              subtitle={soundEnabled ? 'Ses efektleri açık' : 'Ses efektleri kapalı'}
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
            
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>Üyelik Tarihi</Text>
              <Text style={styles.accountValue}>
                {new Date(user.lastLifeRegeneration).toLocaleDateString('tr-TR')}
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
              showArrow
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
              subtitle="Oyun hakkında bilgi alın"
              onPress={handleHelp}
            />

            <SettingItem
              icon={<Shield size={24} color="#10B981" />}
              title="Gizlilik Politikası"
              subtitle="Verilerinizi nasıl koruduğumuz"
              onPress={handlePrivacyPolicy}
              showArrow
            />

            <SettingItem
              icon={<Info size={24} color="#6B7280" />}
              title="Hakkımızda"
              subtitle="Uygulama bilgileri ve sürüm"
              onPress={() => Alert.alert(
                'Kelime Oyunu Hakkında',
                'Sürüm: 1.0.0\nGeliştirici: Kelime Oyunu Ekibi\nPlatform: React Native + Expo\nSon Güncelleme: Ocak 2025\n\nTürkçe kelime oyunu severler için sevgi ile geliştirildi.\n\n© 2025 Kelime Oyunu Ekibi\nTüm hakları saklıdır.'
              )}
            />
          </View>
        </View>

        {/* Dangerous Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerousTitle]}>Tehlikeli Bölge</Text>
          
          <View style={styles.settingsContainer}>
            <SettingItem
              icon={<Trash2 size={24} color="#EF4444" />}
              title="Hesabı Sil"
              subtitle="Hesabınızı kalıcı olarak silin"
              onPress={handleDeleteAccount}
              disabled={loading === 'delete'}
            />
            
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
          <Text style={styles.appInfoSubtext}>Build: {new Date().getTime()}</Text>
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
  dangerousTitle: {
    color: '#EF4444',
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
  settingArrow: {
    marginLeft: 8,
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
    marginBottom: 2,
  },
});