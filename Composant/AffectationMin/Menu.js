import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function MenuCards({ navigation }) {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMenu = async () => {
    try {
      const res = await fetch("http://192.168.43.58:8000/menu"); // IP locale du PC
      const data = await res.json();
      setMenu(data.menu);
    } catch (error) {
      console.log("Erreur API:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMenu();
  }, []);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="long-arrow-left" size={26} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Liste & menu</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Contenu */}
      {loading ? (
        <ActivityIndicator size="large" color="teal" style={{ marginTop: 30 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {menu.map((e) => (
            <View key={e.id} style={styles.card}>
              <Text style={styles.title}>{e.name}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Description:</Text>
                <Text style={styles.value}>{e.description}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Prix:</Text>
                <Text style={styles.value}>{e.price} Ar</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Image:</Text>
                <Text style={styles.value}>{e.image}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.goBack()}>
          <Icon name="home" size={24} color="teal" />
          <Text style={styles.bottomText}>Accueil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('menuList')}>
          <Icon name="list" size={24} color="teal" />
          <Text style={styles.bottomText}>Tables</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('Publications')}>
          <Icon name="bullhorn" size={24} color="teal" />
          <Text style={styles.bottomText}>Publication</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('affectMin1')}>
          <Icon name="cog" size={24} color="teal" />
          <Text style={styles.bottomText}>Admin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f0f2f5", paddingBottom: 70 },

  header: {
    width: "100%",
    height: 90,
    backgroundColor: "teal",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 35,
  },
  headerText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },

  scrollContainer: { paddingVertical: 20, alignItems: "center" },

  card: {
    width: "90%",
    marginBottom: 15,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    alignItems: "flex-start",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  title: { fontSize: 20, fontWeight: "bold", color: "teal", marginBottom: 10 },

  infoRow: { flexDirection: "row", marginBottom: 5 },
  label: { fontWeight: "600", color: "#555", width: 120 },
  value: { color: "#333", flexShrink: 1 },

  bottomBar: {
    width: "100%",
    height: 70,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderColor: "#ccc",
    position: "absolute",
    bottom: 0,
  },
  bottomBtn: { 
    alignItems: "center" 
 },
  bottomText: { 
    fontSize: 12,
    color: "teal", 
    marginTop: 3 },
});
