import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Clock, 
  Trophy, 
  Heart, 
  Send,
  CheckCircle,
  XCircle,
  Bot,
  User,
  Star
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import GameService from '../services/GameService';
import LivesService from '../services/LivesService';

const { width } = Dimensions.get('window');

export default function GameScreen() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { type, mode } = params;

  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [letters, setLetters] = useState<string[][]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [selectedPath, setSelectedPath] = useState<{row: number, col: number}[]>([]);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [wordsFound, setWordsFound] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes for timed mode
  const [targetScore] = useState(100); // for points mode
  const [gameStarted, setGameStarted] = useState(false);
  const [opponentName] = useState(type === 'vs-computer' ? 'BotAli' : 'Rakip');
  
  const gameService = GameService.getInstance();
  const livesService = LivesService.getInstance();

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (gameStarted && mode === 'timed' && timeLeft > 0 && gameState === 'playing') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [gameStarted, timeLeft, gameState, mode]);

  const initializeGame = async () => {
    if (!user) return;

    try {
      // Can kontrolü
      if (user.lives === 0) {
        Alert.alert('Uyarı', 'Oyun oynamak için canın olması gerekiyor!', [
          { text: 'Tamam', onPress: () => router.back() }
        ]);
        return;
      }

      // Harfleri oluştur
      const gameLetters = gameService.generateRandomLetters();
      setLetters(gameLetters);
      
      // Can harca
      const updatedUser = await livesService.consumeLife(user);
      await updateUser({ lives: updatedUser.lives });
      
      // Oyunu başlat
      setGameState('playing');
      setGameStarted(true);

      // Bot opponent için simulated gameplay
      if (type === 'vs-computer') {
        simulateOpponentPlay();
      }
    } catch (error) {
      console.error('Game initialization error:', error);
      Alert.alert('Hata', 'Oyun başlatılırken bir hata oluştu.');
      router.back();
    }
  };

  const simulateOpponentPlay = () => {
    const interval = setInterval(() => {
      if (gameState === 'finished') {
        clearInterval(interval);
        return;
      }

      // Random score increase for bot
      setOpponentScore(prev => {
        const newScore = prev + Math.floor(Math.random() * 5) + 1;
        
        // Check win condition for points mode
        if (mode === 'points' && newScore >= targetScore) {
          setTimeout(() => endGame(), 100);
          return targetScore;
        }
        
        return newScore;
      });
    }, 3000 + Math.random() * 2000); // Random interval between 3-5 seconds
  };

  const handleLetterPress = (row: number, col: number) => {
    const lastSelected = selectedPath[selectedPath.length - 1];
    
    // Check if adjacent to last selected or first selection
    if (selectedPath.length === 0 || isAdjacent(lastSelected, { row, col })) {
      // Check if already selected
      if (!selectedPath.some(pos => pos.row === row && pos.col === col)) {
        const newPath = [...selectedPath, { row, col }];
        setSelectedPath(newPath);
        setCurrentWord(prev => prev + letters[row][col]);
      }
    }
  };

  const isAdjacent = (pos1: {row: number, col: number}, pos2: {row: number, col: number}) => {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0);
  };

  const isLetterSelected = (row: number, col: number) => {
    return selectedPath.some(pos => pos.row === row && pos.col === col);
  };

  const clearSelection = () => {
    setSelectedPath([]);
    setCurrentWord('');
  };

  const submitWord = async () => {
    const wordToSubmit = currentWord.toUpperCase().trim();
    
    if (wordToSubmit.length < 3) {
      Alert.alert('Uyarı', 'Kelime en az 3 harf olmalıdır.');
      return;
    }

    if (wordsFound.includes(wordToSubmit)) {
      Alert.alert('Uyarı', 'Bu kelimeyi zaten buldun!');
      setCurrentWord('');
      setSelectedPath([]);
      return;
    }

    const validation = gameService.validateWord(wordToSubmit);
    
    if (validation.isValid) {
      const newScore = myScore + validation.points;
      setMyScore(newScore);
      setWordsFound(prev => [...prev, validation.word]);
      
      // Check win condition for points mode
      if (mode === 'points' && newScore >= targetScore) {
        endGame();
        return;
      }
      
      Alert.alert('Harika! 🎉', `"${validation.word}" kelimesi ${validation.points} puan!`);
    } else {
      Alert.alert('Üzgünüm', `"${wordToSubmit}" geçerli bir kelime değil.`);
    }
    
    setCurrentWord('');
    setSelectedPath([]);
  };

  const endGame = () => {
    setGameState('finished');
    const won = myScore > opponentScore;
    
    if (won && user) {
      // Update user stats
      const newTotalScore = user.totalScore + myScore;
      const newGamesWon = user.gamesWon + 1;
      updateUser({ 
        totalScore: newTotalScore,
        gamesWon: newGamesWon 
      });
    }

    setTimeout(() => {
      Alert.alert(
        won ? 'Tebrikler! 🏆' : 'Oyun Bitti',
        `${won ? 'Kazandın!' : 'Kaybettin'}\n\nSenin Puanın: ${myScore}\n${opponentName}: ${opponentScore}`,
        [
          { text: 'Ana Sayfaya Dön', onPress: () => router.replace('/(tabs)') },
          { text: 'Tekrar Oyna', onPress: () => restartGame() }
        ]
      );
    }, 500);
  };

  const restartGame = () => {
    if (!user || user.lives === 0) {
      Alert.alert('Uyarı', 'Tekrar oynamak için canın olması gerekiyor!');
      return;
    }

    // Reset game state
    setGameState('waiting');
    setMyScore(0);
    setOpponentScore(0);
    setWordsFound([]);
    setCurrentWord('');
    setSelectedPath([]);
    setTimeLeft(120);
    setGameStarted(false);
    
    // Restart
    initializeGame();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      {/* Header */}
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.gameMode}>
            {mode === 'timed' ? '⏱️ Süreli Mod' : '🎯 Puanlı Mod'}
          </Text>
          
          {mode === 'timed' ? (
            <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
          ) : (
            <Text style={styles.targetText}>Hedef: {targetScore} Puan</Text>
          )}
        </View>

        <View style={styles.livesContainer}>
          <Heart size={16} color="#EF4444" />
          <Text style={styles.livesText}>{user.lives}</Text>
        </View>
      </LinearGradient>

      {/* Progress Bars */}
      <View style={styles.progressSection}>
        <View style={styles.playerProgress}>
          <View style={styles.playerInfo}>
            <User size={16} color="#3B82F6" />
            <Text style={styles.playerProgressName}>Sen</Text>
            <Text style={styles.playerProgressScore}>{myScore}/{mode === 'points' ? targetScore : '∞'}</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                styles.myProgressFill,
                { 
                  width: mode === 'points' 
                    ? `${Math.min((myScore / targetScore) * 100, 100)}%` 
                    : '50%' 
                }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.playerProgress}>
          <View style={styles.playerInfo}>
            <Bot size={16} color="#EF4444" />
            <Text style={styles.playerProgressName}>{opponentName}</Text>
            <Text style={styles.playerProgressScore}>{opponentScore}/{mode === 'points' ? targetScore : '∞'}</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                styles.opponentProgressFill,
                { 
                  width: mode === 'points' 
                    ? `${Math.min((opponentScore / targetScore) * 100, 100)}%` 
                    : '50%' 
                }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Word Input */}
      <View style={styles.wordInputContainer}>
        <TextInput
          style={styles.wordInput}
          value={currentWord}
          onChangeText={setCurrentWord}
          placeholder="Kelimeni yaz veya harfleri seç..."
          placeholderTextColor="#9CA3AF"
          autoCapitalize="characters"
          editable={gameState === 'playing'}
        />
        <TouchableOpacity
          style={[styles.clearInputButton, currentWord.length === 0 && styles.disabledButton]}
          onPress={() => setCurrentWord('')}
          disabled={currentWord.length === 0}
        >
          <XCircle size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Game Board */}
      <View style={styles.gameBoard}>
        {letters.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.letterRow}>
            {row.map((letter, colIndex) => (
              <TouchableOpacity
                key={`${rowIndex}-${colIndex}`}
                style={[
                  styles.letterCell,
                  isLetterSelected(rowIndex, colIndex) && styles.selectedCell
                ]}
                onPress={() => handleLetterPress(rowIndex, colIndex)}
                disabled={gameState !== 'playing'}
              >
                <Text style={[
                  styles.letter,
                  isLetterSelected(rowIndex, colIndex) && styles.selectedLetter
                ]}>
                  {letter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.clearButton]}
          onPress={() => {
            setCurrentWord('');
            setSelectedPath([]);
          }}
          disabled={currentWord.length === 0 && selectedPath.length === 0}
        >
          <XCircle size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Temizle</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.submitButton]}
          onPress={submitWord}
          disabled={currentWord.length < 3 || gameState !== 'playing'}
        >
          <Send size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Gönder</Text>
        </TouchableOpacity>
      </View>

      {/* Found Words */}
      <View style={styles.foundWordsContainer}>
        <Text style={styles.foundWordsTitle}>Bulunan Kelimeler ({wordsFound.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.foundWordsList}>
          {wordsFound.map((word, index) => (
            <View key={index} style={styles.foundWordChip}>
              <Text style={styles.foundWordText}>{word}</Text>
            </View>
          ))}
          {wordsFound.length === 0 && (
            <Text style={styles.noWordsText}>Henüz kelime bulamadın</Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  gameMode: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timer: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  targetText: {
    color: '#E0E7FF',
    fontSize: 12,
    marginTop: 4,
  },
  livesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  livesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  playerProgress: {
    marginBottom: 16,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  playerProgressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  playerProgressScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  myProgressFill: {
    backgroundColor: '#3B82F6',
  },
  opponentProgressFill: {
    backgroundColor: '#EF4444',
  },
  wordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  wordInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  clearInputButton: {
    backgroundColor: '#6B7280',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.3,
  },
  gameBoard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  letterRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  letterCell: {
    width: (width - 80) / 4,
    height: (width - 80) / 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedCell: {
    backgroundColor: '#3B82F6',
    borderColor: '#1D4ED8',
    transform: [{ scale: 0.95 }],
  },
  letter: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  selectedLetter: {
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clearButton: {
    backgroundColor: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  foundWordsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  foundWordsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  foundWordsList: {
    flexDirection: 'row',
  },
  foundWordChip: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  foundWordText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noWordsText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontStyle: 'italic',
  },
});