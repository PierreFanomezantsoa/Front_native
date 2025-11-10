import AsyncStorage from '@react-native-async-storage/async-storage';

useEffect(() => {
  async function loadTable() {
    const table = await AsyncStorage.getItem('TABLE_ID');
    console.log("Table actuelle :", table);
  }
  loadTable();
}, []);
