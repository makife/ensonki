import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Users, Clock, Crown, Play } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import GameService from '../../services/GameService';
import { Tournament, TournamentPlayer } from '../../types/game';

export default function TournamentScreen() {
  const { user } = useAuth();
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [waitingForPlayers, setWaitingForPlayers] = useState(false);

  const gameService = GameService.getInstance();

  useEffect(() => {
    loadActiveTournaments();
  }, []);

  const loadActiveTournaments = async () => {
    // Firebase'den aktif turnuvaları yükle
    // Şimdilik mock data
    setActiveTournaments([]);
  };

  const createTournament = async () => {
    if (!user || user.lives === 0) {
      Alert.alert('Uyarı', 'Turnuvaya katılmak için canın olması gerekiyor!');
      return;
    }

    try {
      setLoading(true);
      setWaitingForPlayers(true);
      
      const tournament = await gameService.createTournament(user.id);
      setCurrentTournament(tournament);
      
      // 30 saniye sonra turnuvayı başlat
      setTimeout(() => {
        setWaitingForPlayers(false);
        Alert.alert('Turnuva Başladı!', 'Turnuvan botlarla dolduruldu ve başladı.');
      }, 30000);
      
    } catch (error) {
      console.error('Create tournament error:', error);
      Alert.alert('Hata', 'Turnuva oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const renderTournamentBracket = (tournament: Tournament) => {
    const rounds = Math.ceil(Math.log2(tournament.participants.length));
    
    return (
      <View style={styles.bracketContainer}>
        <Text style={styles.bracketTitle}>Turnuva Ağacı</Text>
        
        {/* Round 1 - Quarter Finals */}
        <View style={styles.roundContainer}>
          <Text style={styles.roundTitle}>Çeyrek Final</Text>
          <View style={styles.matchesContainer}>
            {tournament.participants.slice(0, 8).map((player, index) => {
              if (index % 2 === 0) {
                const opponent = tournament.participants[index + 1];
                return (
                  <View key={`match-${index}`} style={styles.matchCard}>
                    <View style={styles.playerRow}>
                      <Image
                        source={{ 
                          uri: player.isBot ? 
                            'https://images.pexels.com/photos/4792728/pexels-photo-4792728.jpeg' : 
                            'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg' 
                        }}
                        style={styles.playerAvatar}
                      />
                      <Text style={styles.playerName}>{player.displayName}</Text>
                      {player.isBot && <Text style={styles.botLabel}>BOT</Text>}
                    </View>
                    
                    <Text style={styles.vsText}>VS</Text>
                    
                    <View style={styles.playerRow}>
                      <Image
                        source={{ 
                          uri: opponent?.isBot ? 
                            'https://images.pexels.com/photos/4792728/pexels-photo-4792728.jpeg' : 
                            'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg' 
                        }}
                        style={styles.playerAvatar}
                      />
                      <Text style={styles.playerName}>{opponent?.displayName}</Text>
                      {opponent?.isBot && <Text style={styles.botLabel}>BOT</Text>}
                    </View>
                    
                    {player.userId === user?.id || opponent?.userId === user?.id ? (
                      <TouchableOpacity style={styles.playButton}>
                        <Play size={16} color="#FFFFFF" />
                        <Text style={styles.playButtonText}>Oyna</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.waitingIndicator}>
                        <Text style={styles.waitingText}>Bekleniyor...</Text>
                      </View>
                    )}
                  </View>
                );
              }
              return null;
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderWaitingRoom = () => (
    <View style={styles.waitingContainer}>
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.waitingGradient}
      >
        <Trophy size={48} color="#FFFFFF" />
        <Text style={styles.waitingTitle}>Turnuva Oluşturuldu!</Text>
        <Text style={styles.waitingSubtitle}>
          Diğer oyuncuların katılması bekleniyor...
        </Text>
        
        <View style={styles.participantsContainer}>
          <Text style={styles.participantsTitle}>Katılımcılar ({currentTournament?.participants.length}/8)</Text>
          <View style={styles.participantsList}>
            {currentTournament?.participants.map((participant, index) => (
              <View key={participant.userId} style={styles.participantItem}>
                <Image
                  source={{ 
                    uri: participant.isBot ? 
                      'https://images.pexels.com/photos/4792728/pexels-photo-4792728.jpeg' : 
                      'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg' 
                  }}
                  style={styles.participantAvatar}
                />
                <Text style={styles.participantName}>{participant.displayName}</Text>
                {participant.isBot && <Text style={styles.botLabel}>BOT</Text>}
              </View>
            ))}
            
            {/* Empty slots */}
            {Array.from({ length: 8 - (currentTournament?.participants.length || 0) }).map((_, index) => (
              <View key={`empty-${index}`} style={[styles.participantItem, styles.emptySlot]}>
                <View style={styles.emptyAvatar} />
                <Text style={styles.emptySlotText}>Boş slot</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.timerContainer}>
          <Clock size={20} color="#FFFFFF" />
          <Text style={styles.timerText}>30 saniye içinde botlarla başlayacak</Text>
        </View>
      </LinearGradient>
    </View>
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
          colors={['#EF4444', '#DC2626']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Trophy size={32} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Turnuvalar</Text>
            <Text style={styles.headerSubtitle}>8 kişilik turnuvada yarış ve şampiyon ol!</Text>
          </View>
        </LinearGradient>

        {waitingForPlayers ? (
          renderWaitingRoom()
        ) : currentTournament && currentTournament.status !== 'waiting' ? (
          renderTournamentBracket(currentTournament)
        ) : (
          <View style={styles.content}>
            {/* Create Tournament Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Yeni Turnuva</Text>
              <View style={styles.tournamentCard}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.tournamentGradient}
                >
                  <Crown size={40} color="#FFFFFF" />
                  <Text style={styles.tournamentTitle}>Turnuva Oluştur</Text>
                  <Text style={styles.tournamentDescription}>
                    8 kişilik turnuva oluştur ve şampiyonluğa oyna!
                  </Text>
                  
                  <View style={styles.tournamentFeatures}>
                    <View style={styles.feature}>
                      <Users size={16} color="#FFFFFF" />
                      <Text style={styles.featureText}>8 Oyuncu</Text>
                    </View>
                    <View style={styles.feature}>
                      <Clock size={16} color="#FFFFFF" />
                      <Text style={styles.featureText}>30sn Bekleme</Text>
                    </View>
                    <View style={styles.feature}>
                      <Trophy size={16} color="#FFFFFF" />
                      <Text style={styles.featureText}>Büyük Ödül</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.createButton,
                      (user.lives === 0 || loading) && styles.disabledButton
                    ]}
                    onPress={createTournament}
                    disabled={user.lives === 0 || loading}
                  >
                    <Text style={styles.createButtonText}>
                      {loading ? 'Oluşturuluyor...' : 'Turnuva Oluştur'}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>

            {/* Active Tournaments */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Aktif Turnuvalar</Text>
              
              {activeTournaments.length > 0 ? (
                activeTournaments.map((tournament) => (
                  <View key={tournament.id} style={styles.activeTournamentCard}>
                    <View style={styles.tournamentInfo}>
                      <Text style={styles.tournamentId}>#{tournament.id}</Text>
                      <Text style={styles.tournamentStatus}>
                        {tournament.status === 'waiting' ? 'Bekleniyor' : 'Devam Ediyor'}
                      </Text>
                    </View>
                    <Text style={styles.participantCount}>
                      {tournament.participants.length}/8 Oyuncu
                    </Text>
                    <TouchableOpacity style={styles.joinButton}>
                      <Text style={styles.joinButtonText}>Katıl</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.noTournaments}>
                  <Trophy size={48} color="#D1D5DB" />
                  <Text style={styles.noTournamentsText}>Şu anda aktif turnuva yok</Text>
                  <Text style={styles.noTournamentsSubtext}>
                    İlk turnuvayı sen oluştur ve diğer oyuncuları bekle!
                  </Text>
                </View>
              )}
            </View>

            {/* Tournament Rules */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Turnuva Kuralları</Text>
              <View style={styles.rulesContainer}>
                <Text style={styles.ruleItem}>• 8 oyuncu ile başlar</Text>
                <Text style={styles.ruleItem}>• 30 saniye içinde dolmazsa botlar eklenir</Text>
                <Text style={styles.ruleItem}>• Eleme sistemi ile oynanır</Text>
                <Text style={styles.ruleItem}>• Her maç 100 puana kadar</Text>
                <Text style={styles.ruleItem}>• Şampiyon büyük ödül kazanır</Text>
              </View>
            </View>
          </View>
        )}
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
    color: '#FEE2E2',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  tournamentCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tournamentGradient: {
    padding: 24,
    alignItems: 'center',
  },
  tournamentTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
  },
  tournamentDescription: {
    color: '#FEF3C7',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  tournamentFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  feature: {
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  disabledButton: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  activeTournamentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tournamentInfo: {
    flex: 1,
  },
  tournamentId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  tournamentStatus: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  participantCount: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 12,
  },
  joinButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noTournaments: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  noTournamentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
  },
  noTournamentsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  rulesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  ruleItem: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  // Waiting Room Styles
  waitingContainer: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  waitingGradient: {
    padding: 24,
    alignItems: 'center',
  },
  waitingTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  waitingSubtitle: {
    color: '#E0E7FF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  participantsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  participantsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  participantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  participantItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    minWidth: 80,
  },
  emptySlot: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  emptyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  participantName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySlotText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    textAlign: 'center',
  },
  botLabel: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontSize: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Bracket Styles
  bracketContainer: {
    padding: 20,
  },
  bracketTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  roundContainer: {
    marginBottom: 32,
  },
  roundTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
  },
  matchesContainer: {
    gap: 16,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  vsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 4,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 4,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  waitingIndicator: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  waitingText: {
    color: '#6B7280',
    fontSize: 12,
    fontStyle: 'italic',
  },
});