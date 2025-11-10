export function hungarianAlgorithm(costMatrix, maximize = false) {
  const steps = [];
  const n = costMatrix.length;
  const m = costMatrix[0].length;
  const size = Math.max(n, m);

  let matrix = costMatrix.map(row => [...row]);
  if (maximize) {
    const maxVal = Math.max(...matrix.flat());
    matrix = matrix.map(row => row.map(value => maxVal - value));
    steps.push({
      step: "Transformation pour maximisation",
      matrixSnapshot: matrix.map(r => [...r])
    });
  }

  matrix = Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) => (i < n && j < m ? matrix[i][j] : 0))
  );

  // ✅ Soustraction ligne
  const minLigne = matrix.map(row => Math.min(...row));
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      matrix[i][j] -= minLigne[i];
    }
  }

  // ➕ minColonne pour affichage après soustraction ligne
  const minColonne = matrix[0].map((_, j) =>
    Math.min(...matrix.map(row => row[j]))
  );

  steps.push({
    step: "Soustraction ligne",
    matrixSnapshot: matrix.map(r => [...r]),
    minLigne,
    minColonne // 🔵 Ceci est utilisé uniquement dans StepTable si step === "Soustraction ligne"
  });

  // ✅ Soustraction colonne (pas besoin d'afficher minColonne ici)
  const minColonneCol = matrix[0].map((_, j) =>
    Math.min(...matrix.map(row => row[j]))
  );
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      matrix[i][j] -= minColonneCol[j];
    }
  }

  steps.push({
    step: "Soustraction colonne",
    matrixSnapshot: matrix.map(r => [...r])
    // AUCUN champ minColonne ici
  });

  // === Marquage initial ===
  const starred = Array.from({ length: size }, () => Array(size).fill(false));
  const primed = Array.from({ length: size }, () => Array(size).fill(false));
  const rowCover = Array(size).fill(false);
  const colCover = Array(size).fill(false);

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (matrix[i][j] === 0 && !rowCover[i] && !colCover[j]) {
        starred[i][j] = true;
        rowCover[i] = true;
        colCover[j] = true;
      }
    }
  }

  steps.push({
    step: "Marquage initial (étoiles)",
    matrixSnapshot: matrix.map(r => [...r]),
    markedZeros: getMarkedZeros(starred),
    crossedCells: getCovered([...rowCover], [...colCover])
  });

  rowCover.fill(false);
  colCover.fill(false);

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (starred[i][j]) colCover[j] = true;
    }
  }

  const findZero = () => {
    for (let i = 0; i < size; i++) {
      if (!rowCover[i]) {
        for (let j = 0; j < size; j++) {
          if (matrix[i][j] === 0 && !colCover[j]) return [i, j];
        }
      }
    }
    return [-1, -1];
  };

  const findStarInRow = row => starred[row].findIndex(val => val);
  const findStarInCol = col => starred.findIndex(row => row[col]);
  const findPrimeInRow = row => primed[row].findIndex(val => val);
  const augmentPath = path => path.forEach(([i, j]) => starred[i][j] = !starred[i][j]);
  const clearPrimes = () => primed.forEach(row => row.fill(false));

  while (colCover.filter(Boolean).length < size) {
    let [zRow, zCol] = findZero();
    while (zRow !== -1) {
      primed[zRow][zCol] = true;
      const starCol = findStarInRow(zRow);
      if (starCol !== -1) {
        rowCover[zRow] = true;
        colCover[starCol] = false;
      } else {
        const path = [[zRow, zCol]];
        let row = zRow, col = zCol;
        while (true) {
          const starRow = findStarInCol(col);
          if (starRow === -1) break;
          path.push([starRow, col]);
          col = findPrimeInRow(starRow);
          path.push([starRow, col]);
        }
        augmentPath(path);
        rowCover.fill(false);
        colCover.fill(false);
        clearPrimes();

        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            if (starred[i][j]) colCover[j] = true;
          }
        }

        steps.push({
          step: "Affectation améliorée",
          matrixSnapshot: matrix.map(r => [...r]),
          markedZeros: getMarkedZeros(starred),
          circledZeros: getCircledZeros(primed),
          crossedCells: getCovered([...rowCover], [...colCover])
        });

        break;
      }
      [zRow, zCol] = findZero();
    }

    if (zRow === -1) {
      let minUncovered = Infinity;
      for (let i = 0; i < size; i++) {
        if (!rowCover[i]) {
          for (let j = 0; j < size; j++) {
            if (!colCover[j]) minUncovered = Math.min(minUncovered, matrix[i][j]);
          }
        }
      }

      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (rowCover[i] && colCover[j]) matrix[i][j] += minUncovered;
          else if (!rowCover[i] && !colCover[j]) matrix[i][j] -= minUncovered;
        }
      }

      steps.push({
        step: "Ajustement de la matrice",
        matrixSnapshot: matrix.map(r => [...r]),
        crossedCells: getCovered(rowCover, colCover)
      });
    }
  }

  const assignment = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (starred[i][j]) assignment.push([i, j]);
    }
  }

  const totalCost = assignment.reduce((sum, [i, j]) => sum + costMatrix[i][j], 0);

  steps.push({
    step: "Résultat final",
    matrixSnapshot: matrix.map(r => [...r]),
    markedZeros: getMarkedZeros(starred)
  });

  return { assignment, totalCost, steps };
}

// === Helpers ===
function getMarkedZeros(starred) {
  const list = [];
  starred.forEach((row, i) =>
    row.forEach((val, j) => {
      if (val) list.push({ row: i, col: j });
    })
  );
  return list;
}

function getCircledZeros(primed) {
  const list = [];
  primed.forEach((row, i) =>
    row.forEach((val, j) => {
      if (val) list.push({ row: i, col: j });
    })
  );
  return list;
}

function getCovered(rowCover, colCover) {
  const crossed = [];
  rowCover.forEach((v, i) => {
    if (v) for (let j = 0; j < colCover.length; j++) crossed.push({ row: i, col: j });
  });
  colCover.forEach((v, j) => {
    if (v) for (let i = 0; i < rowCover.length; i++) crossed.push({ row: i, col: j });
  });
  return crossed;
}
