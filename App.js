import { StyleSheet } from 'react-native';
import Acceuil from './Composant/Acceuil';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AffectationMin from './Composant/AffectationMin/AffectationMin';
import AffectationMin1 from './Composant/AffectationMin/MatrixInput';
import Publications from './Composant/AffectationMin/Publication';
import MenuCards from './Composant/AffectationMin/Menu';
import Hisorique from './Composant/AffectationMin/Historique';
// variable constante pour la navigation
const Stack = createNativeStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='accueil'
        screenOptions={{
          headerShown: false}}>
        <Stack.Screen name="accueil" component={Acceuil} />
        <Stack.Screen name="affectMin" component={AffectationMin} />
        <Stack.Screen name="affectMin1" component={AffectationMin1} />
        <Stack.Screen name="Publications" component={Publications} />
        <Stack.Screen name="menuList" component={MenuCards} />
        <Stack.Screen name="Historique" component={Hisorique} />
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
