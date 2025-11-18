// screens/HistoriqueScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

export default function HistoriqueScreen({ route, navigation }) {
  // Ici, on pourrait récupérer les données via route.params ou depuis un store/global
  const [history, setHistory] = useState([]);

  // Exemple : récupérer depuis localStorage / AsyncStorage ou backend
  useEffect(() => {
    // Simulons des transactions passées
    const savedHistory = [
      { id: '1', date: '2025-11-17 10:30', montant: 12000, method: 'Mobile Money' },
      { id: '2', date: '2025-11-17 11:00', montant: 8000, method: 'Carte bancaire' },
    ];
    setHistory(savedHistory);
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.id}>ID: {item.id}</Text>
      <Text>Date: {item.date}</Text>
      <Text>Montant: {item.montant} Ar</Text>
      <Text>Méthode: {item.method}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📜 Historique des paiements</Text>
      {history.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>Aucune transaction</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#edf0f3', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: 'teal' },
  item: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 5,
  },
  id: { fontWeight: 'bold', marginBottom: 5 },
});
