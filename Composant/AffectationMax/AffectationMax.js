import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import React, { useState } from 'react';

export default function AffectationMax({ valeurMax }) {
  const [afficher, setAfficher] = useState(false);

  const handleClick = () => {
    setAfficher(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleClick} style={styles.boutonMax}>
        <Text style={styles.PremierText}>Affectation maximale</Text>
      </TouchableOpacity>

      {afficher && (
        <Text style={styles.resultText}>
          Valeur maximale : {valeurMax=25}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  boutonMax: {
    backgroundColor: 'teal',
    fontSize: 20,
    color: 'white',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  container: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  resultText: {
    marginTop: 20,
    fontSize: 18,
    color: 'green',
    fontWeight: 'bold',
  },
  PremierText: {
    fontSize: 20,
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
});
