import { View, Text, TextInput, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';


export default function NameInput({ rowNames, setRowNames, colNames, setColNames }) {
  return (
    <View>
      <View style={styles.viewAgent}>
        <Text style={styles.title}>Noms des agents (lignes)</Text>
        {rowNames.map((name, i) => (
          <View key={i} style={styles.inputAgent}>
            <Icon name="user" size={20} color="black" style={{marginLeft:'2%',padding:5}} />
            <TextInput
              key={i}
              style={styles.input}
              value={name}
              placeholder={`Agent ${i + 1}`}
              onChangeText={(text) => {
                const copy = [...rowNames];
                copy[i] = text;
                setRowNames(copy);
              }}
            />
          </View>
        ))}
      </View>
      <View style={styles.viewAgent}>
      <Text style={styles.title}>Noms des tâches (colonnes)</Text>
      {colNames.map((name, i) => (
        <View key={i} style={styles.inputTache}>
          <Icon name="tasks" size={20} color="black" style={{marginLeft:'2%',padding:5}} />
          <TextInput
            key={i}
            style={styles.input}
            value={name}
            placeholder={`Tâche ${i + 1}`}
            onChangeText={(text) => {
              const copy = [...colNames];
              copy[i] = text;
              setColNames(copy);
            }}
          />
        </View>
      ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // view pour
  viewAgent:{
    backgroundColor:'#f0f0f0',
    padding:25,
    marginRight:5,
    marginVertical:5,
    borderRadius:10,
  },
  title: {
    fontWeight: 'bold',
    marginTop: 10,
    fontFamily:'georgia',
  },
  input: {
    padding: 8,
    marginVertical: 5,
    height: 30,
    marginLeft:4,
    width:230,
  },
inputTache: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  width: 280,
  padding: 2,
  marginVertical: 5,
  borderColor: 'black',
  borderWidth: 1,
  borderRadius: 5,
  marginTop: 5,
  alignItems: 'center',
},
inputAgent: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  width: 280,
  padding: 2,
  marginVertical: 5,
  borderColor: 'black',
  borderWidth: 1,
  borderRadius: 5,
  marginTop: 5,
  alignItems: 'center',
},
});
