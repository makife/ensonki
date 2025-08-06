import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, CreditCard as Edit3, Trophy, Star, Award, Camera, Save, X } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Badge } from '../../types/game';

export default function ProfileScreen() {
  const { user, updateUser } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedName, setEditedName] = useState(user?.displayName || '');
  const [showBadgesModal, setShowBadgesModal] = useState(false);

  const availableBadges: Badge[] = [
    {
      id: 'fast_typer',
      name: 'Hızlı Yazıcı',
      description: '1 dakikada 10 kelime yaz',
      icon: '⚡',
      unlockedAt: 0
    },
    {
      id: 'word_master',
      name: 'Kelime Ustası',
      description: '100 geçerli kelime yaz',
      icon: '📚',
      unlockedAt: 0
    },
    {
      id: 'tournament_winner',
      name: 'Turnuva Şampiyonu',
      description: 'İlk turnuva şampiyonluğun',
      icon: '🏆',
      unlockedAt: 0
    },
    {
      id: 'streak_master',
      name: 'Seri Ustası',
      description: '5 maç üst üste kazan',
      icon: '🔥',
      unlockedAt: 0
    },
    {
      id: 'social_player',
      name: 'Sosyal Oyuncu',
      description: '10 farklı kişiyle oyna',
      icon: '👥',
      unlockedAt: 0
    },
    {
      id: 'high_scorer',
      name: 'Yüksek Puanlı',
      description: 'Tek maçta 150 puan al',
      icon: '🎯',
      unlockedAt: 0
    }
  ];

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri izni gerekiyor.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Gerçek uygulamada burada Firebase Storage'a yükleme yapılacak
        await updateUser({ photoURL: result.assets[0].uri });
        Alert.alert('Başarılı', 'Profil fotoğrafınız güncellendi!');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
    }
  };

  const saveProfile = async () => {
    try {
      await updateUser({ displayName: editedName });
      setShowEditModal(false);
      Alert.alert('Başarılı', 'Profiliniz güncellendi!');
    } catch (error) {
      console.error('Save profile error:', error);
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu.');
    }
  };

  const getBadgeProgress = (badgeId: string): number => {
    // Simulated badge progress - gerçek uygulamada Firebase'den gelecek
    const progressMap: { [key: string]: number } = {
      'fast_typer': 7,
      'word_master': 45,
      'tournament_winner': 0,
      'streak_master': 2,
      'social_player': 6,
      'high_scorer': 0
    };
    
    return progressMap[badgeId] || 0;
  };

  const getBadgeTarget = (badgeId: string): number => {
    const targetMap: { [key: string]: number } = {
      'fast_typer': 10,
      'word_master': 100,
      'tournament_winner': 1,
      'streak_master': 5,
      'social_player': 10,
      'high_scorer': 1
    };
    
    return targetMap[badgeId] || 1;
  };

  const isBadgeUnlocked = (badgeId: string): boolean => {
    return user?.badges.some(badge => badge.id === badgeId) || false;
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
        {/* Profile Header */}
        <LinearGradient
          colors={['#6366F1', '#4F46E5']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ 
                  uri: user.photoURL || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg' 
                }}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                <Camera size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.userInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.userName}>{user.displayName}</Text>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => {
                    setEditedName(user.displayName);
                    setShowEditModal(true);
                  }}
                >
                  <Edit3 size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>İstatistikler</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Star size={24} color="#F59E0B" />
              <Text style={styles.statValue}>{user.totalScore}</Text>
              <Text style={styles.statLabel}>Toplam Puan</Text>
            </View>
            
            <View style={styles.statCard}>
              <Trophy size={24} color="#10B981" />
              <Text style={styles.statValue}>{user.gamesWon}</Text>
              <Text style={styles.statLabel}>Kazanılan Oyun</Text>
            </View>
            
            <View style={styles.statCard}>
              <Award size={24} color="#8B5CF6" />
              <Text style={styles.statValue}>{user.tournamentsWon}</Text>
              <Text style={styles.statLabel}>Turnuva Şampiyonluğu</Text>
            </View>
          </View>
        </View>

        {/* Badges Section */}
        <View style={styles.badgesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rozetler</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => setShowBadgesModal(true)}
            >
              <Text style={styles.viewAllText}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
            {availableBadges.slice(0, 5).map((badge) => {
              const isUnlocked = isBadgeUnlocked(badge.id);
              const progress = getBadgeProgress(badge.id);
              const target = getBadgeTarget(badge.id);
              
              return (
                <View key={badge.id} style={[styles.badgeCard, isUnlocked && styles.unlockedBadge]}>
                  <Text style={[styles.badgeIcon, !isUnlocked && styles.lockedBadgeIcon]}>
                    {badge.icon}
                  </Text>
                  <Text style={[styles.badgeName, !isUnlocked && styles.lockedBadgeText]}>
                    {badge.name}
                  </Text>
                  {!isUnlocked && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${Math.min((progress / target) * 100, 100)}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>{progress}/{target}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Son Aktiviteler</Text>
          <View style={styles.activityContainer}>
            <Text style={styles.noActivityText}>Henüz aktivite geçmişin yok</Text>
            <Text style={styles.noActivitySubtext}>
              Oyun oynamaya başla ve burada aktivitelerini gör!
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profili Düzenle</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowEditModal(false)}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.editForm}>
              <Text style={styles.inputLabel}>Kullanıcı Adı</Text>
              <TextInput
                style={styles.textInput}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Kullanıcı adınızı girin"
                maxLength={20}
              />
              
              <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* All Badges Modal */}
      <Modal
        visible={showBadgesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBadgesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.badgesModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tüm Rozetler</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowBadgesModal(false)}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.allBadgesContainer} showsVerticalScrollIndicator={false}>
              {availableBadges.map((badge) => {
                const isUnlocked = isBadgeUnlocked(badge.id);
                const progress = getBadgeProgress(badge.id);
                const target = getBadgeTarget(badge.id);
                
                return (
                  <View key={badge.id} style={styles.badgeDetailCard}>
                    <View style={styles.badgeDetailIcon}>
                      <Text style={[styles.badgeDetailEmoji, !isUnlocked && styles.lockedBadgeIcon]}>
                        {badge.icon}
                      </Text>
                    </View>
                    <View style={styles.badgeDetailInfo}>
                      <Text style={[styles.badgeDetailName, !isUnlocked && styles.lockedBadgeText]}>
                        {badge.name}
                      </Text>
                      <Text style={styles.badgeDetailDescription}>{badge.description}</Text>
                      {!isUnlocked && (
                        <View style={styles.detailProgressContainer}>
                          <View style={styles.progressBar}>
                            <View 
                              style={[
                                styles.progressFill, 
                                { width: `${Math.min((progress / target) * 100, 100)}%` }
                              ]} 
                            />
                          </View>
                          <Text style={styles.progressText}>{progress}/{target}</Text>
                        </View>
                      )}
                    </View>
                    {isUnlocked && (
                      <View style={styles.unlockedIndicator}>
                        <Award size={20} color="#10B981" />
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    alignItems: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userEmail: {
    color: '#C7D2FE',
    fontSize: 14,
    marginTop: 4,
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
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
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  badgesSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewAllText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  badgesScroll: {
    flexDirection: 'row',
  },
  badgeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    width: 120,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  unlockedBadge: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  lockedBadgeIcon: {
    opacity: 0.3,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  lockedBadgeText: {
    color: '#9CA3AF',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#6B7280',
  },
  activitySection: {
    padding: 20,
    paddingTop: 0,
  },
  activityContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  noActivityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  noActivitySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  badgesModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  editForm: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  allBadgesContainer: {
    maxHeight: 400,
  },
  badgeDetailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  badgeDetailIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  badgeDetailEmoji: {
    fontSize: 24,
  },
  badgeDetailInfo: {
    flex: 1,
  },
  badgeDetailName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  badgeDetailDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  detailProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unlockedIndicator: {
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    padding: 8,
  },
});