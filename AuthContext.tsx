import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { User } from '../types/game';
import AuthService from '../services/AuthService';
import LivesService from '../services/LivesService';
import NotificationService from '../services/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithFacebook: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const authService = AuthService.getInstance();
  const livesService = LivesService.getInstance();
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let userData = await authService.getUserProfile(firebaseUser.uid);
        if (userData) {
          // Can sistemi güncelle
          userData = await livesService.updateLives(userData);
          if (userData.lives !== user?.lives) {
            await authService.updateUserProfile(userData.id, { 
              lives: userData.lives, 
              lastLifeRegeneration: userData.lastLifeRegeneration 
            });
          }

          // Bildirim ayarlarını yükle ve uygula
          await loadAndApplyNotificationSettings(userData);
          
          setUser(userData);
        }
      } else {
        setUser(null);
        // Çıkış yapıldığında tüm bildirimleri iptal et
        await notificationService.cancelAllNotifications();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadAndApplyNotificationSettings = async (userData: User) => {
    try {
      const notificationsEnabled = await AsyncStorage.getItem('notifications_enabled');
      
      if (notificationsEnabled === 'true') {
        // Günlük hatırlatma planla
        await notificationService.scheduleDailyReminder();
        
        // Can dolu değilse yenileme bildirimi planla
        if (userData.lives < 5) {
          const timeUntilNext = livesService.getTimeUntilNextLife(userData);
          await notificationService.scheduleLivesNotification(timeUntilNext);
        }
      }
    } catch (error) {
      console.error('Load notification settings error:', error);
    }
  };

  const signInWithFacebook = async () => {
    try {
      setLoading(true);
      const userData = await authService.signInWithFacebook();
      if (userData) {
        await loadAndApplyNotificationSettings(userData);
        setUser(userData);
      }
    } catch (error) {
      console.error('Facebook sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const userData = await authService.signInWithGoogle();
      if (userData) {
        await loadAndApplyNotificationSettings(userData);
        setUser(userData);
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userData = await authService.signInWithEmail(email, password);
      if (userData) {
        await loadAndApplyNotificationSettings(userData);
        setUser(userData);
      }
    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      const userData = await authService.signUpWithEmail(email, password, displayName);
      if (userData) {
        // Yeni kullanıcı için bildirim izni iste
        const permissionStatus = await notificationService.getPermissionStatus();
        if (permissionStatus === 'undetermined') {
          // İlk kez kullanıcı kaydı için bildirim izni iste
          await AsyncStorage.setItem('notifications_enabled', 'true');
        }
        
        await loadAndApplyNotificationSettings(userData);
        setUser(userData);
      }
    } catch (error) {
      console.error('Email sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Bildirim ayarlarını temizle
      await notificationService.cancelAllNotifications();
      
      // Local storage'dan hassas verileri temizle
      if (user) {
        const keysToRemove = [
          `ad_reward_${user.id}`,
          `life_stats_${user.id}`,
          `push_token`
        ];
        
        await Promise.all(
          keysToRemove.map(key => AsyncStorage.removeItem(key))
        );
      }
      
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      try {
        const updatedUser = { ...user, ...updates };
        
        // Firestore'u güncelle
        await authService.updateUserProfile(user.id, updates);
        
        // Local state'i güncelle
        setUser(updatedUser);
        
        // Can güncellendiyse bildirim ayarlarını güncelle
        if ('lives' in updates || 'lastLifeRegeneration' in updates) {
          const notificationsEnabled = await AsyncStorage.getItem('notifications_enabled');
          if (notificationsEnabled === 'true') {
            // Can durumuna göre bildirim planla
            if (updatedUser.lives < 5) {
              const timeUntilNext = livesService.getTimeUntilNextLife(updatedUser);
              await notificationService.scheduleLivesNotification(timeUntilNext);
            } else {
              // Canlar dolu, can bildirimi iptal et
              await notificationService.cancelAllNotifications();
              await notificationService.scheduleDailyReminder();
            }
          }
        }
      } catch (error) {
        console.error('Update user error:', error);
        throw error;
      }
    }
  };

  const refreshUser = async () => {
    if (user) {
      try {
        setLoading(true);
        let userData = await authService.getUserProfile(user.id);
        if (userData) {
          // Can sistemi güncelle
          userData = await livesService.updateLives(userData);
          
          // Canlar değiştiyse Firestore'u güncelle
          if (userData.lives !== user.lives || userData.lastLifeRegeneration !== user.lastLifeRegeneration) {
            await authService.updateUserProfile(userData.id, { 
              lives: userData.lives, 
              lastLifeRegeneration: userData.lastLifeRegeneration 
            });
          }
          
          setUser(userData);
        }
      } catch (error) {
        console.error('Refresh user error:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    }
  };

  // Periyodik can güncelleme
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const updatedUser = await livesService.updateLives(user);
        
        // Can durumu değiştiyse güncelle
        if (updatedUser.lives !== user.lives || updatedUser.lastLifeRegeneration !== user.lastLifeRegeneration) {
          await updateUser({
            lives: updatedUser.lives,
            lastLifeRegeneration: updatedUser.lastLifeRegeneration
          });
        }
      } catch (error) {
        console.error('Periodic lives update error:', error);
      }
    }, 60000); // Her dakika kontrol et

    return () => clearInterval(interval);
  }, [user?.id, user?.lives, user?.lastLifeRegeneration]);

  // Background/Foreground geçişlerini dinle
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active' && user) {
        // Uygulama ön plana geldiğinde kullanıcı verilerini yenile
        await refreshUser();
      }
    };

    // App State listener'ı ekle (React Native'de AppState kullanılır)
    // Bu kısım web ortamında çalışmayabilir, sadörnek amaçlı
    
    return () => {
      // Listener'ı temizle
    };
  }, [user?.id]);

  const value: AuthContextType = {
    user,
    loading,
    signInWithFacebook,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};