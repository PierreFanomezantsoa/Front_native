import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdminLogin({ navigation }) {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

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
    }, 1000); // délai pour simuler le traitement
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion Admin</Text>

      {/* Email */}
      <View style={styles.inputContainer}>
        <Ionicons name="mail" size={22} color="teal" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          value={credentials.email}
          onChangeText={text => updateField('email', text)}
          autoCapitalize="none"
        />
      </View>

      {/* Mot de passe */}
      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed" size={22} color="teal" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          secureTextEntry
          value={credentials.password}
          onChangeText={text => updateField('password', text)}
        />
      </View>

      {/* Bouton connexion */}
      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loginText}>Se connecter</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnretour} onPress={() => navigation.navigate('menuList')} >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loginText}>Retour </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FAFAFA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'teal',
    marginBottom: 40
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9'
  },
  icon: { marginRight: 10 },
  input: { flex:1, paddingVertical: 10, fontSize:16, color:'#333' },
  loginBtn: {
    width: '100%',
    backgroundColor: 'teal',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  },
  btnretour: {
    width: '100%',
    backgroundColor: 'rgba(152, 152, 141, 1)',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  },
  loginText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});
