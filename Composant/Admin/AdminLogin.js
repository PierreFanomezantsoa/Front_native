import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Couleurs (Variables)
const PRIMARY_COLOR = '#005662'; // Vert forêt/Bleu-vert foncé
const SECONDARY_COLOR = '#4CAF50'; // Vert pour succès
const BACKGROUND_COLOR = '#E8E8E8'; // Gris clair
const TEXT_COLOR = '#333333';
const BORDER_COLOR = '#CCCCCC';

export default function AdminLogin({ navigation }) {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // Pour le bouton d'affichage du mot de passe

  const updateField = (field, value) => setCredentials({ ...credentials, [field]: value });

  const handleLogin = () => {
    if (!credentials.email || !credentials.password) {
      return Alert.alert("Erreur", "Veuillez remplir tous les champs");
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      // Vérification statique
      if (credentials.email === "admin@mety.com" && credentials.password === "admin123") {
        Alert.alert("Succès", "Connexion réussie !");
        navigation.navigate('ajoutMenu'); // Redirection vers l’écran admin
      } else {
        Alert.alert("Erreur", "Email ou mot de passe incorrect");
      }
    }, 1500); // délai légèrement allongé pour une meilleure simulation
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={64} color={PRIMARY_COLOR} />
          <Text style={styles.title}>Espace Administration</Text>
          <Text style={styles.subtitle}>Connectez-vous pour gérer les menus.</Text>
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Ionicons name="mail" size={24} color={PRIMARY_COLOR} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Adresse Email"
            keyboardType="email-address"
            value={credentials.email}
            onChangeText={text => updateField('email', text)}
            autoCapitalize="none"
            placeholderTextColor="#888"
            editable={!loading}
          />
        </View>

        {/* Mot de passe */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed" size={24} color={PRIMARY_COLOR} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            secureTextEntry={!isPasswordVisible}
            value={credentials.password}
            onChangeText={text => updateField('password', text)}
            placeholderTextColor="#888"
            editable={!loading}
          />
          <TouchableOpacity 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.passwordToggle}
            disabled={loading}
          >
            <Ionicons 
              name={isPasswordVisible ? "eye-off" : "eye"} 
              size={24} 
              color={PRIMARY_COLOR} 
            />
          </TouchableOpacity>
        </View>

        {/* Bouton connexion */}
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.loginText}>Se connecter</Text>
          )}
        </TouchableOpacity>
        
        {/* Bouton retour (Secondaire) */}
        <TouchableOpacity 
            style={styles.returnBtn} 
            onPress={() => navigation.navigate('menuList')} 
            disabled={loading}
        >
          <Text style={styles.returnText}>Retour à l'application</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- Styles Améliorés ---
const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Utilisé avec ScrollView
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    backgroundColor: BACKGROUND_COLOR,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 30,
    fontWeight: '700', // Plus audacieux
    color: PRIMARY_COLOR,
    marginTop: 15,
  },
  subtitle: {
    fontSize: 16,
    color: TEXT_COLOR,
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 15, // Plus arrondi
    marginBottom: 15, // Moins d'espace
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF', // Fond blanc pour l'input
    // Ombre (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    // Élévation (Android)
    elevation: 5, 
  },
  icon: { marginRight: 12 },
  input: { 
    flex: 1, 
    paddingVertical: 14, // Plus d'espace vertical
    fontSize: 17, // Plus grand
    color: TEXT_COLOR 
  },
  passwordToggle: {
    paddingLeft: 10,
  },
  loginBtn: {
    width: '100%',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 25, // Plus d'espace
    // Ombre du bouton de connexion
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5.46,
    elevation: 9, 
  },
  loginText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  // Style pour le bouton Retour (Secondaire)
  returnBtn: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 15, 
  },
  returnText: { 
    color: PRIMARY_COLOR, 
    fontWeight: '600', 
    fontSize: 16 
  },
});