import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ShoppingBag, 
  Heart, 
  Clock, 
  Zap, 
  Crown, 
  Gift,
  Star,
  Infinity
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';

interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: string;
  discountPrice?: string;
  icon: React.ReactNode;
  gradient: string[];
  type: 'lives' | 'time' | 'premium' | 'coins';
  value: number;
  popular?: boolean;
}

export default function MarketScreen() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const marketItems: MarketItem[] = [
    {
      id: 'lives_10',
      title: '10 Can',
      description: 'Oyuna devam etmek için',
      price: '₺9.99',
      icon: <Heart size={32} color="#FFFFFF" />,
      gradient: ['#EF4444', '#DC2626'],
      type: 'lives',
      value: 10,
    },
    {
      id: 'lives_25',
      title: '25 Can',
      description: 'En popüler seçenek',
      price: '₺19.99',
      discountPrice: '₺24.99',
      icon: <Heart size={32} color="#FFFFFF" />,
      gradient: ['#F59E0B', '#D97706'],
      type: 'lives',
      value: 25,
      popular: true,
    },
    {
      id: 'lives_50',
      title: '50 Can',
      description: 'En avantajlı paket',
      price: '₺34.99',
      discountPrice: '₺49.99',
      icon: <Heart size={32} color="#FFFFFF" />,
      gradient: ['#10B981', '#059669'],
      type: 'lives',
      value: 50,
    },
    {
      id: 'unlimited_1h',
      title: '1 Saat Sınırsız',
      description: 'Can harcamadan oyna',
      price: '₺14.99',
      icon: <Clock size={32} color="#FFFFFF" />,
      gradient: ['#8B5CF6', '#7C3AED'],
      type: 'time',
      value: 60,
    },
    {
      id: 'unlimited_24h',
      title: '24 Saat Sınırsız',
      description: 'Tam bir gün özgürlük',
      price: '₺39.99',
      icon: <Infinity size={32} color="#FFFFFF" />,
      gradient: ['#6366F1', '#4F46E5'],
      type: 'time',
      value: 1440,
    },
    {
      id: 'premium_monthly',
      title: 'Premium Üyelik',
      description: 'Aylık sınırsız oyun + özel rozetler',
      price: '₺49.99/ay',
      icon: <Crown size={32} color="#FFFFFF" />,
      gradient: ['#F97316', '#EA580C'],
      type: 'premium',
      value: 30,
      popular: true,
    },
  ];

  const handlePurchase = async (item: MarketItem) => {
    if (!user) return;

    setLoading(item.id);
    
    try {
      // Simulated purchase process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      switch (item.type) {
        case 'lives':
          await updateUser({ lives: user.lives + item.value });
          break;
        case 'time':
          const unlimitedUntil = Date.now() + (item.value * 60 * 1000);
          await updateUser({ premiumUntil: unlimitedUntil });
          break;
        case 'premium':
          const premiumUntil = Date.now() + (item.value * 24 * 60 * 60 * 1000);
          await updateUser({ premiumUntil });
          break;
      }
      
      Alert.alert(
        'Satın Alma Başarılı! 🎉',
        `${item.title} başarıyla satın alındı.`,
        [{ text: 'Tamam' }]
      );
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Hata', 'Satın alma işlemi başarısız oldu.');
    } finally {
      setLoading(null);
    }
  };

  const renderMarketItem = (item: MarketItem) => (
    <View key={item.id} style={styles.itemContainer}>
      {item.popular && (
        <View style={styles.popularBadge}>
          <Star size={12} color="#FFFFFF" />
          <Text style={styles.popularText}>Popüler</Text>
        </View>
      )}
      
      <LinearGradient
        colors={item.gradient}
        style={styles.itemGradient}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemIcon}>
            {item.icon}
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemDescription}>{item.description}</Text>
          </View>
        </View>
        
        <View style={styles.itemFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.itemPrice}>{item.price}</Text>
            {item.discountPrice && (
              <Text style={styles.originalPrice}>{item.discountPrice}</Text>
            )}
          </View>
          
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              loading === item.id && styles.purchaseButtonDisabled
            ]}
            onPress={() => handlePurchase(item)}
            disabled={loading === item.id}
          >
            <Text style={styles.purchaseButtonText}>
              {loading === item.id ? 'Satın Alınıyor...' : 'Satın Al'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const isPremiumActive = (): boolean => {
    return user?.premiumUntil ? user.premiumUntil > Date.now() : false;
  };

  const getPremiumTimeLeft = (): string => {
    if (!user?.premiumUntil) return '';
    
    const timeLeft = user.premiumUntil - Date.now();
    if (timeLeft <= 0) return '';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} gün kaldı`;
    } else if (hours > 0) {
      return `${hours} saat ${minutes} dakika kaldı`;
    } else {
      return `${minutes} dakika kaldı`;
    }
  };

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
          colors={['#3B82F6', '#1D4ED8']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <ShoppingBag size={32} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Market</Text>
            <Text style={styles.headerSubtitle}>
              Canlar, sınırsız oyun zamanı ve daha fazlası!
            </Text>
          </View>
        </LinearGradient>

        {/* Current Status */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Mevcut Durumun</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Heart size={20} color="#EF4444" />
              <Text style={styles.statusLabel}>Canların</Text>
              <Text style={styles.statusValue}>{user.lives}</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Crown size={20} color="#F59E0B" />
              <Text style={styles.statusLabel}>Premium</Text>
              <Text style={styles.statusValue}>
                {isPremiumActive() ? 'Aktif' : 'Yok'}
              </Text>
              {isPremiumActive() && (
                <Text style={styles.statusSubtext}>{getPremiumTimeLeft()}</Text>
              )}
            </View>
            
            <View style={styles.statusItem}>
              <Zap size={20} color="#10B981" />
              <Text style={styles.statusLabel}>Sınırsız</Text>
              <Text style={styles.statusValue}>
                {isPremiumActive() ? 'Aktif' : 'Yok'}
              </Text>
            </View>
          </View>
        </View>

        {/* Market Items */}
        <View style={styles.marketSection}>
          <Text style={styles.sectionTitle}>Satın Alınabilir Ürünler</Text>
          
          {/* Lives Section */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>Canlar</Text>
            <Text style={styles.categoryDescription}>
              Oyuna devam etmek için can satın al
            </Text>
            
            {marketItems
              .filter(item => item.type === 'lives')
              .map(renderMarketItem)}
          </View>

          {/* Time Section */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>Sınırsız Oyun</Text>
            <Text style={styles.categoryDescription}>
              Belirli süre boyunca can harcamadan oyna
            </Text>
            
            {marketItems
              .filter(item => item.type === 'time')
              .map(renderMarketItem)}
          </View>

          {/* Premium Section */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>Premium Üyelik</Text>
            <Text style={styles.categoryDescription}>
              Sınırsız oyun + özel rozetler + reklamsız deneyim
            </Text>
            
            {marketItems
              .filter(item => item.type === 'premium')
              .map(renderMarketItem)}
          </View>
        </View>

        {/* Special Offer */}
        <View style={styles.specialOfferSection}>
          <LinearGradient
            colors={['#EC4899', '#BE185D']}
            style={styles.specialOfferGradient}
          >
            <Gift size={32} color="#FFFFFF" />
            <Text style={styles.specialOfferTitle}>Özel Teklif!</Text>
            <Text style={styles.specialOfferDescription}>
              İlk satın alma işleminizde %20 indirim
            </Text>
            <Text style={styles.specialOfferCode}>Kod: ILKALIS20</Text>
          </LinearGradient>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Bilgi</Text>
          <Text style={styles.infoText}>
            • Satın aldığınız canlar hesabınıza anında eklenir{'\n'}
            • Sınırsız oyun süresi aktif olduğunda can harcanmaz{'\n'}
            • Premium üyelik otomatik yenilenmez{'\n'}
            • Tüm satın alma işlemleri güvenlidir
          </Text>
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
    color: '#DBEAFE',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  statusSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  statusSubtext: {
    fontSize: 10,
    color: '#10B981',
    marginTop: 4,
    textAlign: 'center',
  },
  marketSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  itemContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemGradient: {
    padding: 20,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  itemIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    alignItems: 'flex-start',
  },
  itemPrice: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  originalPrice: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  purchaseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  specialOfferSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  specialOfferGradient: {
    padding: 24,
    alignItems: 'center',
  },
  specialOfferTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  specialOfferDescription: {
    color: '#FECACA',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  specialOfferCode: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  infoSection: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});