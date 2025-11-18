// resultat display component for the assignment problem

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ResultDisplay({ assignment, rowNames, colNames, matrix, mode }) {
  const totalCost = assignment.reduce(
    (sum, [i, j]) => sum + matrix[i][j],
    0
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Affectation {mode === 'max' ? 'maximale' : 'minimale'} :
      </Text>

      {assignment.map(([i, j], index) => (
        <View key={index} style={styles.row}>
          <View style={styles.circle}>
            <Text style={styles.circleText}>{rowNames[i] || `A${i + 1}`}</Text>
          </View>

          <View style={styles.line}>
            <Text style={styles.costText}>{matrix[i][j]}</Text>
          </View>

          <View style={styles.circle}>
            <Text style={styles.circleText}>{colNames[j] || `a${j + 1}`}</Text>
          </View>
        </View>
      ))}

      <Text style={styles.total}>Coût total = {totalCost}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 15,
    marginRight: 10,
    borderRadius: 10,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'gray',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  circleText: {
    fontWeight: 'bold',
  },
  line: {
    borderBottomWidth: 1,
    paddingBottom: 5,
    borderBottomColor: 'black',
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  costText: {
    position: 'absolute',
    top: -10,
    fontSize: 12,
  },
  total: {
    marginTop: 20,
    fontSize: 20,
    color: 'red',
    fontWeight: 'bold',
  },
});
