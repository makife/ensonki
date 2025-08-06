import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Heart, 
  Clock, 
  Trophy, 
  Users, 
  Bot, 
  Share, 
  Play,
  Gift,
  Star
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import LivesService from '../../services/LivesService';

export default function HomeScreen() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [timeUntilNextLife, setTimeUntilNextLife] = useState(0);
  const [adRewards, setAdRewards] = useState(0);
  const [showGameModeModal, setShowGameModeModal] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<'vs-computer' | 'private-room' | 'random-match' | null>(null);

  const livesService = LivesService.getInstance();

  useEffect(() => {
    if (user) {
      updateLivesDisplay();
      loadAdRewards();
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (user && user.lives < 5) {
        setTimeUntilNextLife(livesService.getTimeUntilNextLife(user));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const updateLivesDisplay = async () => {
    if (user) {
      const updatedUser = await livesService.updateLives(user);
      if (updatedUser.lives !== user.lives) {
        await updateUser({ 
          lives: updatedUser.lives, 
          lastLifeRegeneration: updatedUser.lastLifeRegeneration 
        });
      }
    }
  };

  const loadAdRewards = async () => {
    if (user) {
      const rewards = await livesService.getAdRewards(user.id);
      setAdRewards(rewards);
    }
  };

  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleWatchAd = async () => {
    // AdMob reklam izleme implementasyonu burada olacak
    Alert.alert(
      'Reklam İzle',
      'Reklam izleyerek 1 can kazanabilirsiniz.',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'İzle', 
          onPress: async () => {
            // Simulated ad watching
            if (user) {
              await livesService.storeAdReward(user.id);
              await updateUser({ lives: user.lives + 1 });
              loadAdRewards();
            }
          }
        }
      ]
    );
  };

  const handleGameTypeSelect = (type: 'vs-computer' | 'private-room' | 'random-match') => {
    setSelectedGameType(type);
    setShowGameModeModal(true);
  };

  const handleGameModeSelect = (mode: 'points' | 'timed') => {
    setShowGameModeModal(false);
    // Doğrudan parametrelerle navigasyon
    try {
      router.push(`/game?type=${selectedGameType}&mode=${mode}`);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback olarak basit navigasyon deneyin
      router.push('/game');
    }
  };

  const navigateToTournament = () => {
    router.push('/tournament');
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
            <View style={styles.userInfo}>
              <Image
                source={{ 
                  uri: user.photoURL || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg' 
                }}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.welcomeText}>Hoş geldin,</Text>
                <Text style={styles.userName}>{user.displayName}</Text>
              </View>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Heart size={16} color="#EF4444" />
                <Text style={styles.statText}>
                  {user.lives}{adRewards > 0 && <Text style={styles.bonusLives}>+{adRewards}</Text>}
                </Text>
                {user.lives < 5 && (
                  <Text style={styles.timeText}>{formatTime(timeUntilNextLife)}</Text>
                )}
              </View>
              <View style={styles.statItem}>
                <Star size={16} color="#F59E0B" />
                <Text style={styles.statText}>{user.totalScore}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Lives and Ad Section */}
        {user.lives === 0 && (
          <View style={styles.noLivesContainer}>
            <Text style={styles.noLivesText}>Canın kalmadı!</Text>
            <TouchableOpacity style={styles.watchAdButton} onPress={handleWatchAd}>
              <Gift size={20} color="#FFFFFF" />
              <Text style={styles.watchAdText}>Reklam İzle +1 Can</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Game Modes */}
        <View style={styles.gameModesContainer}>
          <Text style={styles.sectionTitle}>Oyun Modları</Text>
          
          <TouchableOpacity
            style={[styles.gameModeCard, user.lives === 0 && styles.disabledCard]}
            onPress={() => handleGameTypeSelect('vs-computer')}
            disabled={user.lives === 0}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.gameModeGradient}
            >
              <Bot size={32} color="#FFFFFF" />
              <Text style={styles.gameModeTitle}>Bilgisayara Karşı</Text>
              <Text style={styles.gameModeSubtitle}>Botlara karşı pratik yap</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameModeCard, user.lives === 0 && styles.disabledCard]}
            onPress={() => handleGameTypeSelect('private-room')}
            disabled={user.lives === 0}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.gameModeGradient}
            >
              <Share size={32} color="#FFFFFF" />
              <Text style={styles.gameModeTitle}>Özel Oda</Text>
              <Text style={styles.gameModeSubtitle}>Arkadaşlarınla oyna</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameModeCard, user.lives === 0 && styles.disabledCard]}
            onPress={() => handleGameTypeSelect('random-match')}
            disabled={user.lives === 0}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.gameModeGradient}
            >
              <Users size={32} color="#FFFFFF" />
              <Text style={styles.gameModeTitle}>Rastgele Eşleşme</Text>
              <Text style={styles.gameModeSubtitle}>Dünya çapında oyuncular</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameModeCard, user.lives === 0 && styles.disabledCard]}
            onPress={navigateToTournament}
            disabled={user.lives === 0}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.gameModeGradient}
            >
              <Trophy size={32} color="#FFFFFF" />
              <Text style={styles.gameModeTitle}>Turnuva</Text>
              <Text style={styles.gameModeSubtitle}>8 kişilik turnuvada yarış</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Recent Achievements */}
        <View style={styles.achievementsContainer}>
          <Text style={styles.sectionTitle}>Son Başarılar</Text>
          <View style={styles.achievementsList}>
            {user.badges.length > 0 ? (
              user.badges.slice(0, 3).map((badge, index) => (
                <View key={badge.id} style={styles.achievementItem}>
                  <Text style={styles.achievementIcon}>{badge.icon}</Text>
                  <Text style={styles.achievementName}>{badge.name}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noAchievements}>Henüz başarı kazanmadın</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Game Mode Selection Modal */}
      <Modal
        visible={showGameModeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGameModeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Oyun Modu Seç</Text>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleGameModeSelect('points')}
            >
              <Trophy size={24} color="#3B82F6" />
              <View style={styles.modalOptionText}>
                <Text style={styles.modalOptionTitle}>Puanlı Mod</Text>
                <Text style={styles.modalOptionSubtitle}>100 puana kadar oyna</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleGameModeSelect('timed')}
            >
              <Clock size={24} color="#3B82F6" />
              <View style={styles.modalOptionText}>
                <Text style={styles.modalOptionTitle}>Süreli Mod</Text>
                <Text style={styles.modalOptionSubtitle}>2 dakikada en çok puan</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowGameModeModal(false)}
            >
              <Text style={styles.modalCloseText}>İptal</Text>
            </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  welcomeText: {
    color: '#E0E7FF',
    fontSize: 14,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  bonusLives: {
    color: '#10B981',
  },
  timeText: {
    color: '#E0E7FF',
    fontSize: 10,
    marginTop: 2,
  },
  noLivesContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    alignItems: 'center',
  },
  noLivesText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  watchAdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  watchAdText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  gameModesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  gameModeCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledCard: {
    opacity: 0.5,
  },
  gameModeGradient: {
    padding: 20,
    alignItems: 'center',
  },
  gameModeTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  gameModeSubtitle: {
    color: '#E0E7FF',
    fontSize: 14,
    marginTop: 4,
  },
  achievementsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  achievementsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementName: {
    fontSize: 16,
    color: '#1F2937',
  },
  noAchievements: {
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
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
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
  },
  modalOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalOptionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCloseText: {
    color: '#6B7280',
    fontSize: 16,
  },
});