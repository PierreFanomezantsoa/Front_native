import React, { useState } from 'react';
import {
  TouchableOpacity, StyleSheet, Text, View,
  Modal, ScrollView, Dimensions
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constantes de design pour une IHM cohérente
const PRIMARY_COLOR = '#008080'; // Teal (Bleu-vert)
const SECONDARY_COLOR = '#004D40'; // Teal foncé pour le logo
const ACCENT_COLOR = '#D32F2F'; // Rouge pour l'annulation
const BACKGROUND_LIGHT = '#F0F5F5'; // Arrière-plan très clair (utilisé pour les cartes et les fonds clairs)

const { height } = Dimensions.get('window');

export default function Accueil({ navigation }) {

  const [showTables, setShowTables] = useState(false);

  // ✅ Enregistrer le numéro de table et passer à la page menuList
  const selectTable = async (tableNumber) => {
    try {
      await AsyncStorage.setItem('TABLE_ID', tableNumber.toString());
      console.log("Table enregistrée :", tableNumber);

      setShowTables(false);
      // Assurez-vous que 'menuList' est le bon nom de route pour le menu
      navigation.navigate('menuList', { tableNumber }); 
    } catch (error) {
      console.log("Erreur stockage table :", error);
    }
  };

  const TABLE_COUNT = 15; // Nombre de tables
  const tables = [...Array(TABLE_COUNT).keys()].map(i => i + 1);

  return (
    <View style={styles.container}>

      {/* Zone de tête stylisée et semi-circulaire */}
      <View style={styles.headerBlock} />

      {/* Contenu principal */}
      <View style={styles.mainContent}>

        {/* Logo/Illustration Centrée */}
        <View style={styles.illustrationContainer}>
          <FontAwesome name="cutlery" size={80} color={BACKGROUND_LIGHT} />
          <Text style={styles.logoText}>Kiosque</Text>
        </View>

        {/* Texte de Bienvenue */}
        <View style={styles.textContainer}>
          <Text style={styles.mainText}>
            Bienvenue dans votre expérience de
            <Text style={styles.highlightText}> Menu Numérique</Text>
          </Text>
          <Text style={styles.subtitleText}>
            Passez votre commande simplement et recevez un service rapide.
          </Text>
        </View>

      </View>

      {/* Bas de page : Barre d'action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => setShowTables(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Commencer la Commande</Text>
          <Ionicons name="arrow-forward-circle" size={28} color="white" />
        </TouchableOpacity>

        <Text style={styles.projectTitle}>Application Restaurant </Text>
      </View>

      {/* MODAL - Choix de la table (Amélioré) */}
      <Modal visible={showTables} transparent animationType="slide" onRequestClose={() => setShowTables(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Où êtes-vous assis ?</Text>
            <Text style={styles.modalSubtitle}>
              Veuillez sélectionner votre numéro de table pour continuer.
            </Text>

            <ScrollView contentContainerStyle={styles.tablesGrid}>
              {tables.map((number) => (
                <TouchableOpacity
                  key={number}
                  style={styles.tableBtn}
                  onPress={() => selectTable(number)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="restaurant-outline" size={20} color="white" />
                  <Text style={styles.tableText}>{number}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Bouton Annuler (Clair) */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowTables(false)}
            >
              <Text style={styles.closeBtnText}>Annuler et revenir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

/* ------------------------------------------
            STYLES ERGONOMIQUES
------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
  },
  
  // --- Haut de page décoratif ---
  headerBlock: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: height * 0.45, // Prend 45% de la hauteur de l'écran
    backgroundColor: PRIMARY_COLOR,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    elevation: 3,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  
  // --- Contenu Principal ---
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: height * 0.1, // Marge dynamique
    paddingHorizontal: 20
  },
  
  // --- Logo/Illustration ---
  illustrationContainer: {
    marginBottom: 60,
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: SECONDARY_COLOR,
    // Ombre forte pour l'effet flottant
    elevation: 15, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  logoText: {
    color: BACKGROUND_LIGHT,
    fontSize: 18,
    fontWeight: 'bold',
    position: 'absolute',
    bottom: 10,
  },

  // --- Texte ---
  textContainer: {
    alignItems: 'center',
    marginTop: 90,
    paddingHorizontal: 10,
    // La marge est gérée par le top de mainContent et le bottomBar
  },
  mainText: {
    fontSize: 20,
    fontWeight: 'bold', 
    color: '#333',
    textAlign: 'center',
    lineHeight: 40,
  },
  highlightText: {
    fontWeight: '900',
    color: PRIMARY_COLOR,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
  },

  // --- Barre d'Action (Bottom Bar) ---
  bottomBar: {
    backgroundColor: BACKGROUND_LIGHT, // Fix: Utilisation de BACKGROUND_LIGHT
    paddingHorizontal: 20,
    paddingVertical: 25,
    alignItems: 'center',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 35,
    marginBottom: 10,
    width: '95%',
    elevation: 10,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7, // Ombre très prononcée
    shadowRadius: 8,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800', // Très gras
    marginRight: 10,
  },
  projectTitle: {
    fontSize: 13,
    color: '#AAA',
    fontWeight: '500',
    marginTop: 10
  },

  // --- MODAL Styles ---
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalBox: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: BACKGROUND_LIGHT, // Fix: Utilisation de BACKGROUND_LIGHT
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 30,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: SECONDARY_COLOR,
    marginBottom: 8
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#777',
    marginBottom: 25,
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
    height: 70,
    backgroundColor: PRIMARY_COLOR,
    margin: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    // Ombre pour rendre le bouton tactile
    elevation: 7, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  tableText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 5,
  },
  closeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 25,
  },
  closeBtnText: {
    color: ACCENT_COLOR, // Rouge pour l'annulation
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  }
});