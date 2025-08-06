import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, set, onValue, off, push } from 'firebase/database';
import { firestore, database } from '../config/firebase';
import { GameRoom, Player, WordValidation, Tournament, TournamentPlayer } from '../types/game';

class GameService {
  private static instance: GameService;
  private turkishWords: Set<string> = new Set();

  public static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  constructor() {
    this.loadTurkishWords();
  }

  private async loadTurkishWords() {
    // Türkçe kelime listesi - gerçek uygulamada API'den veya büyük dosyadan yüklenebilir
    const words = [
      'AILE', 'ANNE', 'BABA', 'ÇOCUK', 'KEDI', 'KÖPEK', 'OKUL', 'KITAP', 'KALEM', 'MASA',
      'ŞAIR', 'ŞİİR', 'GÜZEL', 'MAVI', 'YEŞİL', 'KIRMIZI', 'SARI', 'MOR', 'BEYAZ', 'SİYAH',
      'OYUN', 'SPOR', 'FUTBOL', 'BASKETBOL', 'VOLEYBOL', 'YÜZMEKe', 'KOŞMAK', 'YÜRÜMEK',
      'YEMEK', 'EKMEK', 'SU', 'ÇAY', 'KAHVE', 'SÜT', 'MEYVE', 'SEBZE', 'ET', 'BALIK',
      'EV', 'PARK', 'BAHÇE', 'SOKAK', 'ŞEHIR', 'KÖPRÜ', 'DENIZ', 'GÖKYÜZÜ', 'YILDIZ', 'AY'
    ];
    
    words.forEach(word => this.turkishWords.add(word));
  }

  generateRandomLetters(): string[][] {
    const turkishLetters = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ';
    const vowels = 'AEIİOÖUÜ';
    const consonants = 'BCÇDFGĞHJKLMNPRSŞTVYZ';
    
    const grid: string[][] = [];
    
    for (let i = 0; i < 4; i++) {
      grid[i] = [];
      for (let j = 0; j < 4; j++) {
        // %70 sessiz harf, %30 sesli harf dengesi
        const useVowel = Math.random() < 0.3;
        const letters = useVowel ? vowels : consonants;
        grid[i][j] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
    
    return grid;
  }

  validateWord(word: string): WordValidation {
    const cleanWord = word.toUpperCase().trim();
    
    if (cleanWord.length < 3) {
      return { word: cleanWord, isValid: false, points: 0 };
    }
    
    const isValid = this.turkishWords.has(cleanWord);
    let points = 0;
    
    if (isValid) {
      // Puan hesaplama: kelime uzunluğuna göre
      if (cleanWord.length === 3) points = 1;
      else if (cleanWord.length === 4) points = 2;
      else if (cleanWord.length === 5) points = 4;
      else if (cleanWord.length === 6) points = 6;
      else if (cleanWord.length >= 7) points = 10;
    }
    
    return { 
      word: cleanWord, 
      isValid, 
      points,
      definition: isValid ? `${cleanWord} geçerli bir Türkçe kelimedir.` : undefined
    };
  }

  async createGameRoom(hostUserId: string, mode: 'points' | 'timed', maxPoints?: number, timeLimit?: number): Promise<GameRoom> {
    const roomId = Date.now().toString();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const gameRoom: GameRoom = {
      id: roomId,
      code,
      mode,
      maxPoints: maxPoints || 100,
      timeLimit: timeLimit || 120,
      players: [{
        userId: hostUserId,
        displayName: '',
        score: 0,
        isReady: false,
        currentWord: '',
        wordsSubmitted: []
      }],
      currentRound: 1,
      status: 'waiting',
      letters: this.generateRandomLetters(),
      createdAt: Date.now()
    };
    
    const roomRef = doc(firestore, 'gameRooms', roomId);
    await setDoc(roomRef, gameRoom);
    
    return gameRoom;
  }

  async joinGameRoom(roomCode: string, userId: string): Promise<GameRoom | null> {
    try {
      const roomsQuery = query(
        collection(firestore, 'gameRooms'),
        where('code', '==', roomCode),
        where('status', '==', 'waiting')
      );
      
      const querySnapshot = await getDocs(roomsQuery);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const roomDoc = querySnapshot.docs[0];
      const gameRoom = roomDoc.data() as GameRoom;
      
      // Kullanıcı zaten odada mı kontrol et
      const existingPlayer = gameRoom.players.find(p => p.userId === userId);
      if (existingPlayer) {
        return gameRoom;
      }
      
      // Oda dolu mu kontrol et
      if (gameRoom.players.length >= 2) {
        return null;
      }
      
      // Oyuncuyu odaya ekle
      const newPlayer: Player = {
        userId,
        displayName: '',
        score: 0,
        isReady: false,
        currentWord: '',
        wordsSubmitted: []
      };
      
      gameRoom.players.push(newPlayer);
      
      await updateDoc(roomDoc.ref, {
        players: gameRoom.players
      });
      
      return gameRoom;
    } catch (error) {
      console.error('Join game room error:', error);
      return null;
    }
  }

  async findRandomMatch(userId: string): Promise<GameRoom | null> {
    try {
      // Bekleyen odaları bul
      const roomsQuery = query(
        collection(firestore, 'gameRooms'),
        where('status', '==', 'waiting')
      );
      
      const querySnapshot = await getDocs(roomsQuery);
      
      // Tek oyunculu oda bul
      for (const doc of querySnapshot.docs) {
        const room = doc.data() as GameRoom;
        if (room.players.length === 1 && room.players[0].userId !== userId) {
          return await this.joinGameRoom(room.code!, userId);
        }
      }
      
      // Uygun oda bulunamazsa yeni oda oluştur
      return await this.createGameRoom(userId, 'points', 100);
    } catch (error) {
      console.error('Find random match error:', error);
      return null;
    }
  }

  subscribeToGameRoom(roomId: string, callback: (room: GameRoom | null) => void) {
    const roomRef = doc(firestore, 'gameRooms', roomId);
    
    return onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as GameRoom);
      } else {
        callback(null);
      }
    });
  }

  async updatePlayerWord(roomId: string, userId: string, word: string): Promise<void> {
    const roomRef = doc(firestore, 'gameRooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (roomDoc.exists()) {
      const gameRoom = roomDoc.data() as GameRoom;
      const playerIndex = gameRoom.players.findIndex(p => p.userId === userId);
      
      if (playerIndex !== -1) {
        gameRoom.players[playerIndex].currentWord = word;
        await updateDoc(roomRef, { players: gameRoom.players });
      }
    }
  }

  async submitWord(roomId: string, userId: string, word: string): Promise<WordValidation> {
    const validation = this.validateWord(word);
    
    if (validation.isValid) {
      const roomRef = doc(firestore, 'gameRooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (roomDoc.exists()) {
        const gameRoom = roomDoc.data() as GameRoom;
        const playerIndex = gameRoom.players.findIndex(p => p.userId === userId);
        
        if (playerIndex !== -1) {
          const player = gameRoom.players[playerIndex];
          
          // Aynı kelimeyi daha önce gönderdiyse puan verme
          if (player.wordsSubmitted.includes(validation.word)) {
            return { ...validation, points: 0 };
          }
          
          player.score += validation.points;
          player.wordsSubmitted.push(validation.word);
          player.currentWord = '';
          
          // Oyun bitiş kontrolü
          if (gameRoom.mode === 'points' && player.score >= (gameRoom.maxPoints || 100)) {
            gameRoom.status = 'finished';
            gameRoom.winner = userId;
          }
          
          await updateDoc(roomRef, {
            players: gameRoom.players,
            status: gameRoom.status,
            winner: gameRoom.winner
          });
        }
      }
    }
    
    return validation;
  }

  // Tournament Methods
  async createTournament(hostUserId: string): Promise<Tournament> {
    const tournamentId = Date.now().toString();
    
    const tournament: Tournament = {
      id: tournamentId,
      participants: [{
        userId: hostUserId,
        displayName: '',
        isBot: false,
        currentRound: 1,
        eliminated: false
      }],
      rounds: [],
      status: 'waiting',
      createdAt: Date.now()
    };
    
    const tournamentRef = doc(firestore, 'tournaments', tournamentId);
    await setDoc(tournamentRef, tournament);
    
    // 30 saniye sonra bots ile doldur
    setTimeout(() => {
      this.fillTournamentWithBots(tournamentId);
    }, 30000);
    
    return tournament;
  }

  private async fillTournamentWithBots(tournamentId: string): Promise<void> {
    const tournamentRef = doc(firestore, 'tournaments', tournamentId);
    const tournamentDoc = await getDoc(tournamentRef);
    
    if (tournamentDoc.exists()) {
      const tournament = tournamentDoc.data() as Tournament;
      
      if (tournament.status === 'waiting' && tournament.participants.length < 8) {
        const botsNeeded = 8 - tournament.participants.length;
        const botNames = ['BotAli', 'BotVeli', 'BotAyşe', 'BotFatma', 'BotMehmet', 'BotZeynep', 'BotAhmet'];
        
        for (let i = 0; i < botsNeeded; i++) {
          tournament.participants.push({
            userId: `bot_${Date.now()}_${i}`,
            displayName: botNames[i % botNames.length],
            isBot: true,
            currentRound: 1,
            eliminated: false
          });
        }
        
        tournament.status = 'in-progress';
        await updateDoc(tournamentRef, tournament);
        
        // İlk round oluştur
        this.createTournamentRounds(tournament);
      }
    }
  }

  private createTournamentRounds(tournament: Tournament): void {
    // Tournament bracket algoritması burada implement edilecek
    // Şimdilik basit bir yapı oluşturuyoruz
  }
}

export default GameService;