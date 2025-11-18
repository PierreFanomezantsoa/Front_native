import React, { useState } from 'react';
import {
  TouchableOpacity, StyleSheet, Text, View,
  Modal, Image, ScrollView
} from 'react-native';
import LottieView from 'lottie-react-native'; // Bien que non utilisé, on le laisse si vous en aviez besoin
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Accueil({ navigation }) {

  const [showTables, setShowTables] = useState(false);

  // ✅ Enregistrer le numéro de table
  const selectTable = async (tableNumber) => {
    try {
      await AsyncStorage.setItem('TABLE_ID', tableNumber.toString());
      console.log("Table enregistrée :", tableNumber);

      setShowTables(false);
      navigation.navigate('menuList'); 
    } catch (error) {
      console.log("Erreur stockage table :", error);
    }
  };

  const TABLE_COUNT = 15; // Réduit le nombre pour une grille plus compacte
  const tables = [...Array(TABLE_COUNT).keys()].map(i => i + 1);

  return (
    <View style={styles.container}>

      {/* Arrière-plan décoratif et vagues */}
      <View style={styles.headerWave} />

      {/* Contenu principal */}
      <View style={styles.mainContent}>
        
        {/* Illustration/Logo */}
        <View style={styles.illustrationContainer}>
         <View style={styles.logoPlaceholder}>
            <FontAwesome name="cutlery" size={80} color="#E0F2F1" />
            <Text style={styles.logoText}>Kiosque</Text>
          </View>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.mainText}>
            Bienvenue dans l'expérience de{'\n'}
            <Text style={styles.highlightText}>Menu Numérique</Text>
          </Text>
          <Text style={styles.subtitleText}>
            Passez votre commande rapidement et facilement.
          </Text>
        </View>
      </View>

      {/* BAS DE PAGE - Barre d'action */}
      <View style={styles.bottomBar}>

        {/* Bouton commencer */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => setShowTables(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Commencer la Commande</Text>
          <View style={styles.arrowContainer}>
            <FontAwesome name="arrow-right" size={20} color="white" />
          </View>
        </TouchableOpacity>

        <Text style={styles.projectTitle}>Restaurant 2025</Text>
      </View>

      {/* MODAL : Choix de la table */}
      <Modal visible={showTables} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>

            <Text style={styles.modalTitle}>Sélectionnez votre table</Text>
            <Text style={styles.modalSubtitle}>Ceci est nécessaire pour l'affectation de la commande.</Text>

            <ScrollView contentContainerStyle={styles.tablesGrid}>
              {tables.map((number) => (
                <TouchableOpacity
                  key={number}
                  style={styles.tableBtn}
                  onPress={() => selectTable(number)}
                >
                  <FontAwesome name="spoon" size={20} color="white" />
                  <Text style={styles.tableText}>Table {number}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Bouton Fermer */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowTables(false)}
            >
              <FontAwesome name="close" size={16} color="white" style={{ marginRight: 5 }} />
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Annuler</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
}



/* ------------------------------------------
            STYLES RAFFINÉS
------------------------------------------- */

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F5F5', // Fond clair et doux
    position: 'relative' 
  },

  // Vague en haut pour un look dynamique
  headerWave: {
    position: 'absolute',
    top: 0,
    width: '150%', // S'étend au-delà de l'écran
    height: 350,
    backgroundColor: 'teal', // Couleur principale
    borderBottomLeftRadius: 500, // Grand rayon pour effet de vague
    borderBottomRightRadius: 500,
    transform: [{ translateX: -70 }, { translateY: -50 }], // Décalage
    elevation: 3,
  },

  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start', // Commence plus haut
    paddingTop: 80, // Espace pour la vague
    paddingHorizontal: 20
  },

  // Conteneur Illustration (avec un logo simple)
  illustrationContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#004D40', // Vert foncé pour contraste avec la vague
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#E0F2F1',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },

  // Texte
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  mainText: {
    fontSize: 28,
    color: '#222',
    textAlign: 'center',
    fontWeight: '300', // Poids plus léger pour le corps de la phrase
    lineHeight: 38,
  },
  highlightText: {
    fontWeight: '900', // Très gras pour le point clé
    color: 'teal',
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },

  // Barre d'action et bas de page
  bottomBar: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  // Bouton Commencer
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'teal',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 15,
    width: '90%',
    elevation: 8,
    shadowColor: 'teal',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginRight: 10,
  },
  arrowContainer: {
    // Le conteneur de la flèche est intégré dans le bouton
    // On retire l'ancienne couleur jaune pour simplifier
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  projectTitle: {
    fontSize: 14,
    color: '#AAA',
    fontWeight: '500',
    marginTop: 5
  },

  // MODAL - Choix de la table
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalBox: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 30,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004D40', // Couleur foncée assortie
    marginBottom: 5
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#777',
    marginBottom: 20,
    textAlign: 'center',
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 10,
  },

  tableBtn: {
    width: 100,
    height: 55,
    backgroundColor: 'teal',
    margin: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  tableText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 3,
  },

  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F', // Rouge pour annuler/danger
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 20,
    elevation: 5,
  }
});