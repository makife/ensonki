import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/game';

class LivesService {
  private static instance: LivesService;
  private static readonly LIFE_REGENERATION_INTERVAL = 30 * 60 * 1000; // 30 minutes
  private static readonly MAX_LIVES = 5;

  public static getInstance(): LivesService {
    if (!LivesService.instance) {
      LivesService.instance = new LivesService();
    }
    return LivesService.instance;
  }

  async updateLives(user: User): Promise<User> {
    const now = Date.now();
    const timeSinceLastRegeneration = now - user.lastLifeRegeneration;
    const livesToRegenerate = Math.floor(timeSinceLastRegeneration / LivesService.LIFE_REGENERATION_INTERVAL);
    
    if (livesToRegenerate > 0 && user.lives < LivesService.MAX_LIVES) {
      const newLives = Math.min(user.lives + livesToRegenerate, LivesService.MAX_LIVES);
      const newLastRegeneration = user.lastLifeRegeneration + (livesToRegenerate * LivesService.LIFE_REGENERATION_INTERVAL);
      
      return {
        ...user,
        lives: newLives,
        lastLifeRegeneration: newLastRegeneration
      };
    }
    
    return user;
  }

  async consumeLife(user: User): Promise<User> {
    if (user.lives > 0) {
      return {
        ...user,
        lives: user.lives - 1
      };
    }
    return user;
  }

  async addLife(user: User): Promise<User> {
    return {
      ...user,
      lives: user.lives + 1
    };
  }

  getTimeUntilNextLife(user: User): number {
    if (user.lives >= LivesService.MAX_LIVES) {
      return 0;
    }
    
    const now = Date.now();
    const timeSinceLastRegeneration = now - user.lastLifeRegeneration;
    const timeUntilNext = LivesService.LIFE_REGENERATION_INTERVAL - (timeSinceLastRegeneration % LivesService.LIFE_REGENERATION_INTERVAL);
    
    return timeUntilNext;
  }

  async storeAdReward(userId: string): Promise<void> {
    try {
      const key = `ad_reward_${userId}`;
      const existingRewards = await AsyncStorage.getItem(key);
      const rewards = existingRewards ? parseInt(existingRewards) : 0;
      await AsyncStorage.setItem(key, (rewards + 1).toString());
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
}

export default LivesService;