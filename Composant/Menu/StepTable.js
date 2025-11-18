import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function StepTable({ steps, rowNames = [], colNames = [] }) {
  const [visibleStepCount, setVisibleStepCount] = useState(1);

  const handleNextStep = () => {
    if (visibleStepCount < steps.length) {
      setVisibleStepCount(visibleStepCount + 1);
    }
  };

  const handleShowAll = () => {
    setVisibleStepCount(steps.length);
  };

  const handleReset = () => {
    setVisibleStepCount(1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Étapes de marquage :</Text>

      {steps.slice(0, visibleStepCount).map((step, index) => {
        const isRowSubtraction = step.step === "Soustraction ligne";
        const isColSubtraction = step.step === "Soustraction colonne";
        const isInitialMarking = step.step === "Marquage initial (étoiles)";
        const isImprovedAssignment = step.step === "Affectation améliorée";
        const isAdjustment = step.step === "Ajustement de la matrice";
        const isFinalResult = step.step === "Résultat final";

        const markedRows = step.crossedCells
          ? Array.from(new Set(step.crossedCells.map(z => z.row)))
          : [];
        const markedCols = step.crossedCells
          ? Array.from(new Set(step.crossedCells.map(z => z.col)))
          : [];

        return (
          <View key={index} style={styles.stepBox}>
            <Text style={styles.stepTitle}>{step.step}</Text>
            <View style={styles.matrixContainer}>
              {/* En-tête colonnes */}
              <View style={styles.row}>
                <View style={styles.headerCell} />
                {colNames.map((name, j) => (
                  <View key={j} style={styles.headerCell}>
                    <Text style={styles.headerText}>{name?.trim() || `Tâche ${j + 1}`}</Text>
                  </View>
                ))}
              </View>

              {/* Corps du tableau */}
              {step.matrixSnapshot.map((row, i) => (
                <View key={i} style={styles.row}>
                  <View style={styles.headerCell}>
                    <Text style={styles.headerText}>{rowNames[i]?.trim() || `Agent ${i + 1}`}</Text>
                  </View>

                  {row.map((cell, j) => {
                    const isMarked = step.markedZeros?.some(z => z.row === i && z.col === j);
                    const isCircled = step.circledZeros?.some(z => z.row === i && z.col === j);
                    const isCrossed = step.crossedCells?.some(z => z.row === i && z.col === j);

                    const isZeroOnMarkedLineOrColumn =
                      (isInitialMarking || isImprovedAssignment) &&
                      cell === 0 &&
                      !isMarked &&
                      (markedRows.includes(i) || markedCols.includes(j));

                    const showBackground =
                      isMarked && (isInitialMarking || isImprovedAssignment || isFinalResult);

                    let display = cell.toString();
                    if (isMarked) display = `✓ ${cell}`;
                    else if (isCircled) display = `o ${cell}`;
                    else if (isZeroOnMarkedLineOrColumn || isCrossed) display = ` ${cell}`;

                    return (
                      <View
                        key={j}
                        style={[
                          styles.cellContainer,
                          showBackground && styles.markedCell,
                          (isCrossed || isZeroOnMarkedLineOrColumn) && styles.crossedCell,
                          isAdjustment && isCrossed && styles.adjustedCell
                        ]}
                      >
                        <Text
                          style={[
                            styles.cellText,
                            isCircled && styles.circledZero,
                            (isCrossed || isZeroOnMarkedLineOrColumn) && styles.crossedText
                          ]}
                        >
                          {display}
                        </Text>
                        {!isAdjustment &&
                          cell === 0 &&
                          !isMarked &&
                          (isCrossed || isZeroOnMarkedLineOrColumn) && (
                            <View style={styles.diagonalLine} />
                          )}
                      </View>
                    );
                  })}
                </View>
              ))}

              {/* Min colonne en bas (SEULEMENT dans Soustraction ligne) */}
              {isRowSubtraction && step.minColonne && (
                <View style={styles.row}>
                  <View style={styles.headerCell}>
                    <Text style={[styles.headerText, { fontWeight: 'bold' }]}>Min col.</Text>
                  </View>
                  {step.minColonne.map((val, j) => (
                    <View key={j} style={styles.minCell}>
                      <Text style={[styles.cellText, { fontWeight: 'bold', color: 'blue' }]}>{val}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        );
      })}

      <View style={styles.buttonGroup}>
        {visibleStepCount < steps.length ? (
          <>
            <TouchableOpacity style={[styles.button, styles.nextButton]} onPress={handleNextStep}>
              <Text style={styles.buttonText}>Étape suivante</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.allButton]} onPress={handleShowAll}>
              <Text style={styles.buttonText}>Afficher toutes</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={handleReset}>
            <Text style={styles.buttonText}>Réinitialiser</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    backgroundColor: '#f0f0f0',
    padding: 12,
    marginRight: 10,
    borderRadius: 10
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10
  },
  stepBox: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 0,
    borderColor: 'gray',
    borderRadius: 10,
    backgroundColor: '#fff'
  },
  stepTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#006666'
  },
  matrixContainer: {
    borderTopWidth: 0,
    borderLeftWidth: 1,
    borderColor: '#ccc'
  },
  row: {
    flexDirection: 'row'
  },
  headerCell: {
    width: 34,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#e0e0e0'
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center'
  },
  cellContainer: {
    width: 34,
    height: 30,
    borderWidth: 1,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  cellText: {
    textAlign: 'center',
    fontSize: 14
  },
  markedCell: {
    backgroundColor: '#d0f5d5'
  },
  circledZero: {
    color: '#cc0000',
    fontWeight: 'bold'
  },
  crossedCell: {
    borderWidth: 1
  },
  crossedText: {
    color: '#cc0000',
    fontWeight: 'bold'
  },
  diagonalLine: {
    position: 'absolute',
    width: 40,
    height: 1.5,
    backgroundColor: 'black',
    transform: [{ rotate: '45deg' }]
  },
  adjustedCell: {
    backgroundColor: '#fff9c4'
  },
  minCell: {
    backgroundColor: '#d0f5d5',
    borderWidth: 1,
    borderColor: '#ccc',
    width: 34,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 10,
    flexWrap: 'wrap'
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginHorizontal: 5
  },
  nextButton: {
    backgroundColor: '#007bff'
  },
  allButton: {
    backgroundColor: '#28a745'
  },
  resetButton: {
    backgroundColor: 'teal'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});
