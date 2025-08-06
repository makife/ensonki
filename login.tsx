import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  
  const { signInWithFacebook, signInWithGoogle, signInWithEmail } = useAuth();
  const router = useRouter();

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    setLoading('email');
    try {
      await signInWithEmail(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Giriş Hatası', error.message || 'Giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(null);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading('facebook');
    try {
      await signInWithFacebook();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Facebook Giriş Hatası', error.message || 'Facebook ile giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading('google');
    try {
      await signInWithGoogle();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Google Giriş Hatası', error.message || 'Google ile giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            style={styles.header}
          >
            <Text style={styles.logo}>📝</Text>
            <Text style={styles.title}>Kelime Oyunu</Text>
            <Text style={styles.subtitle}>Türkçe kelimelerle eğlenceli yarışlar!</Text>
          </LinearGradient>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Giriş Yap</Text>
            
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Mail size={20} color="#6B7280" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="E-posta adresiniz"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Lock size={20} color="#6B7280" />
              </View>
              <TextInput
                style={[styles.textInput, styles.passwordInput]}
                placeholder="Şifreniz"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 
                  <EyeOff size={20} color="#6B7280" /> : 
                  <Eye size={20} color="#6B7280" />
                }
              </TouchableOpacity>
            </View>

            {/* Email Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading === 'email' && styles.disabledButton]}
              onPress={handleEmailLogin}
              disabled={loading === 'email'}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.buttonGradient}
              >
                <Text style={styles.loginButtonText}>
                  {loading === 'email' ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <TouchableOpacity
              style={[styles.socialButton, loading === 'facebook' && styles.disabledButton]}
              onPress={handleFacebookLogin}
              disabled={loading === 'facebook'}
            >
              <LinearGradient
                colors={['#1877F2', '#0C63D4']}
                style={styles.buttonGradient}
              >
                <Text style={styles.socialButtonText}>
                  {loading === 'facebook' ? 'Bağlanıyor...' : '📘 Facebook ile Giriş'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, loading === 'google' && styles.disabledButton]}
              onPress={handleGoogleLogin}
              disabled={loading === 'google'}
            >
              <LinearGradient
                colors={['#DB4437', '#C5221F']}
                style={styles.buttonGradient}
              >
                <Text style={styles.socialButtonText}>
                  {loading === 'google' ? 'Bağlanıyor...' : '🔍 Google ile Giriş'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Hesabın yok mu? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/register')}>
                <Text style={styles.registerLink}>Kayıt Ol</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#DBEAFE',
    fontSize: 16,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
    marginTop: -30,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  passwordInput: {
    paddingRight: 40,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    color: '#6B7280',
    fontSize: 14,
    marginHorizontal: 16,
  },
  socialButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 32,
  },
  registerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  registerLink: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
});