import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons'; // ✅ Expo vector icons
import { LinearGradient } from 'expo-linear-gradient';

export default function Publication({ navigation }) {

  const [publications] = useState([
    {
      id: 1,
      nom: "Pizza 4 Fromages",
      description: "Mozzarella, cheddar, gruyère, parmesan",
      prix: 12000,
      prixPromo: 10000,
      image: "https://i.imgur.com/2nCt3Sb.jpg"
    },
    {
      id: 2,
      nom: "Burger Double Steak",
      description: "Sauce maison + fromage fondu",
      prix: 15000,
      prixPromo: 13000,
      image: "https://i.imgur.com/4fDvT1U.png"
    },
    {
      id: 3,
      nom: "Frites XXL",
      description: "Frites croustillantes + sauce",
      prix: 5000,
      prixPromo: 4000,
      image: "https://i.imgur.com/j6y9l9b.png"
    },
    {
      id: 4,
      nom: "Tacos Poulet",
      description: "Poulet grillé + fromage",
      prix: 10000,
      prixPromo: 9000,
      image: "https://i.imgur.com/HpXG3V3.png"
    }
  ]);

  return (
    <View style={styles.screen}>

      {/* HEADER */}
      <LinearGradient colors={['#008080', '#006666']} style={styles.header}>
        <Text style={styles.headerText}>Actualités & Promotions</Text>

        <View style={styles.topRight}>
          <TouchableOpacity style={styles.topIcon}>
            <FontAwesome name="bell" size={22} color="white" />
            <View style={styles.badge}><Text style={{ color: 'white', fontSize: 10 }}>3</Text></View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.topIcon} onPress={() => navigation.navigate("Historique")}>
            <FontAwesome name="history" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.topIcon}>
            <FontAwesome name="shopping-cart" size={22} color="white" />
            <View style={styles.badge}><Text style={{ color: 'white', fontSize: 10 }}>1</Text></View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* CONTENU */}
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>🔥 Nouveautés</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {publications.map((p) => (
            <View key={p.id} style={styles.card}>
              
              <Image source={{ uri: p.image }} style={styles.image} />

              <View style={styles.cardContent}>
                <Text style={styles.title}>{p.nom}</Text>
                <Text style={styles.desc}>{p.description}</Text>

                <View style={styles.prixBox}>
                  <Text style={styles.newPrice}>{p.prixPromo} Ar</Text>
                  <Text style={styles.oldPrice}>{p.prix} Ar</Text>
                </View>

                <TouchableOpacity style={styles.btnPanier}>
                  <FontAwesome name="shopping-cart" size={20} color="white" />
                  <Text style={styles.btnText}>Commander</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

      </ScrollView>

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate("accueil")}>
          <FontAwesome name="home" size={22} color="teal" />
          <Text style={styles.bottomText}>Accueil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('menuList')}>
          <FontAwesome name="list" size={22} color="teal" />
          <Text style={styles.bottomText}>Tables</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('Publications')}>
          <FontAwesome name="bullhorn" size={22} color="teal" />
          <Text style={styles.bottomText}>Publication</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('admin')}>
          <FontAwesome name="cog" size={22} color="teal" />
          <Text style={styles.bottomText}>Admin</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// STYLES
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef3f7',
    paddingBottom: 70
  },

  header: {
    height: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 35,
    elevation: 5
  },
  headerText: {
    color: 'white',
    fontSize: 21,
    fontWeight: 'bold'
  },
  topRight: {
    flexDirection: 'row'
  },
  topIcon: {
    marginHorizontal: 10,
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -6,
    backgroundColor: 'red',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center'
  },

  container: {
    paddingVertical: 20,
    paddingLeft: 10
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop:10,
    marginLeft :12,
    color: '#006666'
  },

  card: {
    width: 320,
    marginLeft : 15,
    marginTop:84,
    marginRight: 25,
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 135
  },
  cardContent: {
    padding: 10
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#006666'
  },
  desc: {
    fontSize: 13,
    color: '#555',
    marginTop: 4
  },
  prixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  newPrice: {
    fontWeight: 'bold',
    fontSize: 17,
    color: 'teal'
  },
  oldPrice: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 6
  },

  btnPanier: {
    backgroundColor: 'teal',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding:5,
    paddingVertical: 6,
    height:42,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 10
  },
  btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  bottomBar: {
    width: '100%',
    height: 70,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#d0d0d0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    elevation: 10
  },
  bottomBtn: { alignItems: 'center' },
  bottomText: { fontSize: 12, color: 'teal', marginTop: 2 }
});
