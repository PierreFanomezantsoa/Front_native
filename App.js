import { StyleSheet } from 'react-native';
import Acceuil from './Composant/Acceuil';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AjoutDonne from './Composant/Command/AjoutMenu';
import Publications from './Composant/publication/Publication';
import MenuCards from './Composant/Menu/Menu';
import Hisorique from './Composant/Menu/Historique';
import AdminLogin from './Composant/Admin/AdminLogin';
import CommandList from './Composant/Command/ListeCommande';
import AdminPublication from './Composant/publication/AdminPublication'
// variable constante pour la navigation
const Stack = createNativeStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='accueil'
        screenOptions={{
          headerShown: false}}>
        <Stack.Screen name="accueil" component={Acceuil} />
        <Stack.Screen name="ajoutMenu" component={AjoutDonne} />
        <Stack.Screen name="Publications" component={Publications} />
        <Stack.Screen name="menuList" component={MenuCards} />
        <Stack.Screen name="Historique" component={Hisorique} />
        <Stack.Screen name="admin" component={AdminLogin} />
        <Stack.Screen name="listecommande" component={CommandList} />
        <Stack.Screen name="adminPublication" component={AdminPublication} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
