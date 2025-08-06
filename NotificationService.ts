// services/NotificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Bildirim davranışını yapılandır
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize() {
    try {
      // Push token'ı al
      await this.registerForPushNotificationsAsync();
      
      // Bildirim kanallarını oluştur
      await this.createNotificationChannels();
      
      // Notification listeners'ı ayarla
      this.setupNotificationListeners();
    } catch (error) {
      console.error('Notification service initialization error:', error);
    }
  }

  async registerForPushNotificationsAsync(): Promise<string | null> {
    let token: string | null = null;

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Expo projenizin ID'si
      })).data;
      
      this.pushToken = token;
      
      // Token'ı AsyncStorage'a kaydet
      await AsyncStorage.setItem('push_token', token);
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      // Turnuva bildirimleri kanalı
      await Notifications.setNotificationChannelAsync('tournament_notifications', {
        name: 'Turnuva Bildirimleri',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
      // Can yenilenme bildirimleri kanalı
      await Notifications.setNotificationChannelAsync('lives_notifications', {
        name: 'Can Bildirimleri',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#F59E0B',
        sound: 'default',
      });
    }
  }

  setupNotificationListeners() {
    // Bildirime tıklandığında
    Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      this.handleNotificationPress(data);
    });

    // Uygulama açıkken bildirim geldiğinde
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });
  }

  private handleNotificationPress(data: any) {
    // Bildirim tipine göre yönlendirme yap
    switch (data.type) {
      case 'game_invite':
        // Oyun davetine yönlendir
        console.log('Navigate to game invite:', data.gameId);
        break;
      case 'tournament_start':
        // Turnuva sayfasına yönlendir
        console.log('Navigate to tournament:', data.tournamentId);
        break;
      case 'lives_full':
        // Ana sayfaya yönlendir
        console.log('Navigate to home - lives full');
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  }

  // Can yenileme bildirimi gönder
  async scheduleLivesNotification(timeUntilFull: number) {
    try {
      const notificationsEnabled = await AsyncStorage.getItem('notifications_enabled');
      if (notificationsEnabled !== 'true') return;

      // Mevcut can bildirimlerini iptal et
      await Notifications.cancelScheduledNotificationAsync('lives_notification');

      // Yeni bildirim planla
      await Notifications.scheduleNotificationAsync({
        identifier: 'lives_notification',
        content: {
          title: '💖 Canların Yenilendi!',
          body: 'Tüm canların doldu! Oyuna devam edebilirsin.',
          data: { type: 'lives_full' },
          sound: 'default',
        },
        trigger: {
          seconds: Math.floor(timeUntilFull / 1000),
          channelId: 'lives_notifications',
        },
      });
    } catch (error) {
      console.error('Schedule lives notification error:', error);
    }
  }

  // Oyun daveti bildirimi gönder
  async sendGameInviteNotification(playerName: string, gameId: string) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎮 Oyun Daveti!',
          body: `${playerName} seni oyuna davet etti!`,
          data: { type: 'game_invite', gameId },
          sound: 'default',
        },
        trigger: null, // Hemen gönder
      });
    } catch (error) {
      console.error('Send game invite notification error:', error);
    }
  }

  // Turnuva başlama bildirimi gönder
  async sendTournamentStartNotification(tournamentId: string) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏆 Turnuva Başlıyor!',
          body: 'Turnuvan başladı! Hemen katıl ve şampiyonluğa oyna.',
          data: { type: 'tournament_start', tournamentId },
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Send tournament start notification error:', error);
    }
  }

  // Günlük hatırlatma bildirimi gönder
  async scheduleDailyReminder() {
    try {
      const notificationsEnabled = await AsyncStorage.getItem('notifications_enabled');
      if (notificationsEnabled !== 'true') return;

      // Mevcut günlük hatırlatmaları iptal et
      await Notifications.cancelScheduledNotificationAsync('daily_reminder');

      // Her gün saat 19:00'da hatırlatma gönder
      await Notifications.scheduleNotificationAsync({
        identifier: 'daily_reminder',
        content: {
          title: '📝 Kelime Oyunu Seni Bekliyor!',
          body: 'Bugün henüz oyun oynamadın. Kelime becerilerini test et!',
          data: { type: 'daily_reminder' },
          sound: 'default',
        },
        trigger: {
          hour: 19,
          minute: 0,
          repeats: true,
          channelId: 'game_notifications',
        },
      });
    } catch (error) {
      console.error('Schedule daily reminder error:', error);
    }
  }

  // Tüm bildirimleri iptal et
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Cancel all notifications error:', error);
    }
  }

  // Bildirim izinlerini kontrol et
  async getPermissionStatus(): Promise<string> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      console.error('Get permission status error:', error);
      return 'undetermined';
    }
  }

  // Push token'ı al
  getPushToken(): string | null {
    return this.pushToken;
  }

  // Bildirim ayarlarını güncelle
  async updateNotificationSettings(enabled: boolean) {
    try {
      await AsyncStorage.setItem('notifications_enabled', enabled.toString());
      
      if (enabled) {
        // Bildirimleri yeniden planla
        await this.scheduleDailyReminder();
      } else {
        // Tüm bildirimleri iptal et
        await this.cancelAllNotifications();
      }
    } catch (error) {
      console.error('Update notification settings error:', error);
    }
  }

  // Test bildirimi gönder
  async sendTestNotification() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Bildirimi',
          body: 'Bildirimler düzgün çalışıyor!',
          data: { type: 'test' },
          sound: 'default',
        },
        trigger: {
          seconds: 1,
        },
      });
    } catch (error) {
      console.error('Send test notification error:', error);
    }
  }
}

export default NotificationService;3B82F6',
      });
    }

    return token;
  }

  async createNotificationChannels() {
    if (Platform.OS === 'android') {
      // Oyun bildirimleri kanalı
      await Notifications.setNotificationChannelAsync('game_notifications', {
        name: 'Oyun Bildirimleri',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
        sound: 'default',
      });

      // Turnuva bildirimleri kanalı
      await Notifications.setNotificationChannelAsync('tournament_notifications', {
        name: 'Turnuva Bildirimleri',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#EF4444',
        sound: 'default',
      });

      // Can yenilenme bildirimleri kanalı
      await Notifications.setNotificationChannelAsync('lives_notifications', {
        name: 'Can Bildirimleri',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#F59E0B',
        sound: 'default',
      });
    }
  }
