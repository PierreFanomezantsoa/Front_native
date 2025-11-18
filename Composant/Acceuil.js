import React, { useState } from 'react';
import {
  TouchableOpacity, StyleSheet, Text, View,
  Modal
} from 'react-native';
import LottieView from 'lottie-react-native';
import { FontAwesome } from '@expo/vector-icons';      // ✅ CORRECT
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Accueil({ navigation }) {

  const [showTables, setShowTables] = useState(false);

  // ✅ Enregistrer le numéro de table
  const selectTable = async (tableNumber) => {
    try {
      await AsyncStorage.setItem('TABLE_ID', tableNumber.toString());
      console.log("Table enregistrée :", tableNumber);

      setShowTables(false);
      navigation.navigate('affectMin');
    } catch (error) {
      console.log("Erreur stockage table :", error);
    }
  };

  return (
    <View style={styles.container}>

      {/* Arrière-plan décoratif */}
      <View style={styles.backgroundCircle} />

      {/* Contenu principal */}
      <View style={styles.mainContent}>
        <View style={styles.illustrationContainer}>
          <LottieView
            source={require('../assets/hello.json')}
            autoPlay
            loop
            style={styles.animation}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.mainText}>
            Bienvenue au Kiosque{'\n'}
            <Text style={styles.highlightText}>de Menu Numérique</Text>{'\n'}
            <Text style={styles.underlineText}>Restaurant & Commandes</Text>
          </Text>
        </View>
      </View>

      {/* BAS DE PAGE */}
      <View style={styles.bottomBar}>

        {/* Bouton commencer */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => setShowTables(true)}
        >
          <Text style={styles.startButtonText}>Commencer</Text>

          <View style={styles.arrowContainer}>
            <FontAwesome name="long-arrow-right" size={18} color="white" />
          </View>
        </TouchableOpacity>

        <Text style={styles.projectTitle}>Kiosque d’Affichage Numérique</Text>
        <Text style={styles.digitalText}>Restaurant 2025</Text>
      </View>

      {/* MODAL : Choix de la table */}
      <Modal visible={showTables} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>

            <Text style={styles.modalTitle}>Choisir un numéro de table</Text>

            <View style={styles.tablesGrid}>
              {[...Array(20).keys()].map((i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.tableBtn}
                  onPress={() => selectTable(i + 1)}
                >
                  <Text style={styles.tableText}>{i + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bouton Fermer */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowTables(false)}
            >
              <Text style={{ color: 'white', fontSize: 16 }}>Fermer</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
}



/* ------------------------------------------
                STYLES
------------------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', position: 'relative' },

  backgroundCircle: {
    position: 'absolute',
    width: 150, height: 150,
    borderRadius: 175,
    backgroundColor: '#FFF4E6',
    top: 170,
    left: '75%',
    transform: [{ translateX: -175 }]
  },

  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },

  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 40
  },

  animation: {
    width: 280,
    height: 280
  },

  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20
  },

  mainText: {
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    fontWeight: '800'
  },

  highlightText: {
    fontWeight: '300',
    color: '#333'
  },

  underlineText: {
    color: 'teal',
    fontWeight: 'bold'
  },

  bottomBar: {
    backgroundColor: '#FFF',
    paddingHorizontal: 30,
    paddingVertical: 25,
    alignItems: 'center',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 5
  },

  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'teal',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
    minWidth: 250
  },

  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center'
  },

  arrowContainer: {
    backgroundColor: '#FFA500',
    width: 35,
    height: 35,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center'
  },

  projectTitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '800',
    marginBottom: 5
  },

  digitalText: {
    fontSize: 14,
    color: '#999'
  },

  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },

  modalBox: {
    width: '85%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center'
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'teal',
    marginBottom: 15
  },

  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },

  tableBtn: {
    width: 45,
    height: 45,
    backgroundColor: 'teal',
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8
  },

  tableText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },

  closeBtn: {
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 15
  }
});
