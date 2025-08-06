import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/game';
import NotificationService from './NotificationService';

class LivesService {
  private static instance: LivesService;
  private static readonly LIFE_REGENERATION_INTERVAL = 30 * 60 * 1000; // 30 dakika
  private static readonly MAX_LIVES = 5;
  private notificationService: NotificationService;

  public static getInstance(): LivesService {
    if (!LivesService.instance) {
      LivesService.instance = new LivesService();
    }
    return LivesService.instance;
  }

  constructor() {
    this.notificationService = NotificationService.getInstance();
  }

  async updateLives(user: User): Promise<User> {
    const now = Date.now();
    const timeSinceLastRegeneration = now - user.lastLifeRegeneration;
    const livesToRegenerate = Math.floor(timeSinceLastRegeneration / LivesService.LIFE_REGENERATION_INTERVAL);
    
    if (livesToRegenerate > 0 && user.lives < LivesService.MAX_LIVES) {
      const newLives = Math.min(user.lives + livesToRegenerate, LivesService.MAX_LIVES);
      const newLastRegeneration = user.lastLifeRegeneration + (livesToRegenerate * LivesService.LIFE_REGENERATION_INTERVAL);
      
      const updatedUser = {
        ...user,
        lives: newLives,
        lastLifeRegeneration: newLastRegeneration
      };

      // Canlar dolu değilse yenileme bildirimi planla
      if (newLives < LivesService.MAX_LIVES) {
        const timeUntilNext = this.getTimeUntilNextLife(updatedUser);
        await this.scheduleNextLifeNotification(timeUntilNext);
      }
      
      return updatedUser;
    }
    
    return user;
  }

  async consumeLife(user: User): Promise<User> {
    if (user.lives > 0) {
      const updatedUser = {
        ...user,
        lives: user.lives - 1
      };

      // İlk can tüketimiyse yenileme sürecini başlat
      if (user.lives === LivesService.MAX_LIVES) {
        updatedUser.lastLifeRegeneration = Date.now();
      }

      // Can yenileme bildirimi planla
      if (updatedUser.lives < LivesService.MAX_LIVES) {
        const timeUntilNext = this.getTimeUntilNextLife(updatedUser);
        await this.scheduleNextLifeNotification(timeUntilNext);
      }

      // İstatistikleri kaydet
      await this.saveLifeStats(user.id, 'consumed');
      
      return updatedUser;
    }
    return user;
  }

  async addLife(user: User, source: 'ad' | 'purchase' | 'reward' = 'ad'): Promise<User> {
    const newLives = Math.min(user.lives + 1, LivesService.MAX_LIVES);
    const updatedUser = {
      ...user,
      lives: newLives
    };

    // İstatistikleri kaydet
    await this.saveLifeStats(user.id, 'added', source);
    
    // Canlar maksimum seviyeye ulaştıysa bildirimi iptal et
    if (newLives >= LivesService.MAX_LIVES) {
      await this.notificationService.cancelAllNotifications();
    }
    
    return updatedUser;
  }

  getTimeUntilNextLife(user: User): number {
    if (user.lives >= LivesService.MAX_LIVES) {
      return 0;
    }
    
    const now = Date.now();
    const timeSinceLastRegeneration = now - user.lastLifeRegeneration;
    const timeUntilNext = LivesService.LIFE_REGENERATION_INTERVAL - (timeSinceLastRegeneration % LivesService.LIFE_REGENERATION_INTERVAL);
    
    return Math.max(0, timeUntilNext);
  }

  getTimeUntilFullLives(user: User): number {
    if (user.lives >= LivesService.MAX_LIVES) {
      return 0;
    }

    const livesNeeded = LivesService.MAX_LIVES - user.lives;
    const timeUntilNext = this.getTimeUntilNextLife(user);
    
    return timeUntilNext + ((livesNeeded - 1) * LivesService.LIFE_REGENERATION_INTERVAL);
  }

  private async scheduleNextLifeNotification(timeUntilNext: number) {
    try {
      const notificationsEnabled = await AsyncStorage.getItem('notifications_enabled');
      if (notificationsEnabled === 'true') {
        await this.notificationService.scheduleLivesNotification(timeUntilNext);
      }
    } catch (error) {
      console.error('Schedule life notification error:', error);
    }
  }

  // Reklam ödül sistemi
  async storeAdReward(userId: string): Promise<void> {
    try {
      const key = `ad_reward_${userId}`;
      const existingRewards = await AsyncStorage.getItem(key);
      const rewards = existingRewards ? parseInt(existingRewards) : 0;
      await AsyncStorage.setItem(key, (rewards + 1).toString());
      
      // Reklam izleme istatistiği
      await this.saveLifeStats(userId, 'ad_watched');
    } catch (error) {
      console.error('Store ad reward error:', error);
    }
  }

  async getAdRewards(userId: string): Promise<number> {
    try {
      const key = `ad_reward_${userId}`;
      const rewards = await AsyncStorage.getItem(key);
      return rewards ? parseInt(rewards) : 0;
    } catch (error) {
      console.error('Get ad rewards error:', error);
      return 0;
    }
  }

  async clearAdRewards(userId: string): Promise<void> {
    try {
      const key = `ad_reward_${userId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Clear ad rewards error:', error);
    }
  }

  async claimAdReward(userId: string): Promise<number> {
    try {
      const rewards = await this.getAdRewards(userId);
      if (rewards > 0) {
        await this.clearAdRewards(userId);
        return rewards;
      }
      return 0;
    } catch (error) {
      console.error('Claim ad reward error:', error);
      return 0;
    }
  }

  // Can istatistikleri
  private async saveLifeStats(userId: string, action: 'consumed' | 'added' | 'ad_watched', source?: string) {
    try {
      const key = `life_stats_${userId}`;
      const existingStats = await AsyncStorage.getItem(key);
      const stats = existingStats ? JSON.parse(existingStats) : {
        consumed: 0,
        added: 0,
        adsWatched: 0,
        purchaseAdded: 0,
        rewardAdded: 0
      };

      switch (action) {
        case 'consumed':
          stats.consumed += 1;
          break;
        case 'added':
          stats.added += 1;
          if (source === 'purchase') stats.purchaseAdded += 1;
          if (source === 'reward') stats.rewardAdded += 1;
          break;
        case 'ad_watched':
          stats.adsWatched += 1;
          break;
      }

      stats.lastUpdate = Date.now();
      await AsyncStorage.setItem(key, JSON.stringify(stats));
    } catch (error) {
      console.error('Save life stats error:', error);
    }
  }

  async getLifeStats(userId: string) {
    try {
      const key = `life_stats_${userId}`;
      const stats = await AsyncStorage.getItem(key);
      return stats ? JSON.parse(stats) : null;
    } catch (error) {
      console.error('Get life stats error:', error);
      return null;
    }
  }

  // Can durumu formatları
  formatTimeUntilNext(user: User): string {
    const milliseconds = this.getTimeUntilNextLife(user);
    if (milliseconds <= 0) return 'Hazır!';
    
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  formatTimeUntilFull(user: User): string {
    const milliseconds = this.getTimeUntilFullLives(user);
    if (milliseconds <= 0) return 'Dolu!';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}s ${minutes}d`;
    } else {
      return `${minutes}d`;
    }
  }

  // Can durumu kontrolü
  canPlayGame(user: User): { canPlay: boolean; reason?: string } {
    if (user.lives > 0) {
      return { canPlay: true };
    }

    // Premium kullanıcı kontrolü
    if (user.premiumUntil && user.premiumUntil > Date.now()) {
      return { canPlay: true };
    }

    return { 
      canPlay: false, 
      reason: 'Canın kalmadı. Reklam izle, can satın al veya beklemeyi dene.' 
    };
  }

  // Günlük can sınırı kontrolü (premium olmayan kullanıcılar için)
  async checkDailyLimit(userId: string): Promise<{ withinLimit: boolean; gamesPlayed: number; maxGames: number }> {
    try {
      const today = new Date().toDateString();
      const key = `daily_games_${userId}_${today}`;
      const gamesPlayedStr = await AsyncStorage.getItem(key);
      const gamesPlayed = gamesPlayedStr ? parseInt(gamesPlayedStr) : 0;
      const maxGames = 50; // Günlük maksimum oyun sayısı
      
      return {
        withinLimit: gamesPlayed < maxGames,
        gamesPlayed,
        maxGames
      };
    } catch (error) {
      console.error('Check daily limit error:', error);
      return { withinLimit: true, gamesPlayed: 0, maxGames: 50 };
    }
  }

  async incrementDailyGames(userId: string): Promise<void> {
    try {
      const today = new Date().toDateString();
      const key = `daily_games_${userId}_${today}`;
      const gamesPlayedStr = await AsyncStorage.getItem(key);
      const gamesPlayed = gamesPlayedStr ? parseInt(gamesPlayedStr) : 0;
      await AsyncStorage.setItem(key, (gamesPlayed + 1).toString());
    } catch (error) {
      console.error('Increment daily games error:', error);
    }
  }
}

export default LivesService;