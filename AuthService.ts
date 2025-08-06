import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithCredential,
  FacebookAuthProvider,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, firestore } from '../config/firebase';
import { User } from '../types/game';
import * as Facebook from 'expo-facebook';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

class AuthService {
  private static instance: AuthService;

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signInWithFacebook(): Promise<User | null> {
    try {
      await Facebook.initializeAsync({
        appId: '715139128090903',
      });

      const result = await Facebook.logInWithReadPermissionsAsync({
        permissions: ['public_profile', 'email'],
      });

      if (result.type === 'success') {
        const credential = FacebookAuthProvider.credential(result.token);
        const userCredential = await signInWithCredential(auth, credential);
        return await this.createOrUpdateUser(userCredential.user, 'facebook');
      }
      return null;
    } catch (error) {
      console.error('Facebook sign in error:', error);
      throw error;
    }
  }

  async signInWithGoogle(): Promise<User | null> {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        useProxy: true,
      });

      const request = new AuthSession.AuthRequest({
        clientId: '583469597201-bepkssfpbt0s8ifsfg1ms70cm93vchdl.apps.googleusercontent.com',
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.IdToken,
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/oauth/authorize',
      });

      if (result.type === 'success' && result.params.id_token) {
        const credential = GoogleAuthProvider.credential(result.params.id_token);
        const userCredential = await signInWithCredential(auth, credential);
        return await this.createOrUpdateUser(userCredential.user, 'google');
      }
      return null;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }

  async signInWithEmail(email: string, password: string): Promise<User | null> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return await this.createOrUpdateUser(userCredential.user, 'email');
    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    }
  }

  async signUpWithEmail(email: string, password: string, displayName: string): Promise<User | null> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      return await this.createOrUpdateUser(userCredential.user, 'email');
    } catch (error) {
      console.error('Email sign up error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  private async createOrUpdateUser(firebaseUser: FirebaseUser, provider: 'google' | 'facebook' | 'email'): Promise<User> {
    const userRef = doc(firestore, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);
    
    const now = Date.now();
    
    if (userDoc.exists()) {
      // Update existing user
      const userData = userDoc.data() as User;
      await updateDoc(userRef, {
        displayName: firebaseUser.displayName || userData.displayName,
        photoURL: firebaseUser.photoURL || userData.photoURL,
        email: firebaseUser.email || userData.email,
      });
      
      return {
        ...userData,
        displayName: firebaseUser.displayName || userData.displayName,
        photoURL: firebaseUser.photoURL || userData.photoURL,
        email: firebaseUser.email || userData.email,
      };
    } else {
      // Create new user
      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Oyuncu',
        photoURL: firebaseUser.photoURL || undefined,
        provider,
        lives: 5,
        lastLifeRegeneration: now,
        totalScore: 0,
        gamesWon: 0,
        tournamentsWon: 0,
        badges: [],
      };
      
      await setDoc(userRef, newUser);
      return newUser;
    }
  }

  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, updates);
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }
}

export default AuthService;