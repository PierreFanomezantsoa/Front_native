import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image, Alert, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const BACKEND_URL = 'http://192.168.137.118:8000';

export default function MenuList({ navigation }) {
  const [menuList, setMenuList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [menuItem, setMenuItem] = useState({ id: null, name: '', description: '', price: '', image: null });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/menu`);
      setMenuList(response.data.menu || []);
    } catch {
      Alert.alert('Erreur', 'Impossible de récupérer les plats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMenu(); }, []);

  const updateField = (field, value) => setMenuItem({ ...menuItem, [field]: value });

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1
      });
      if (!result.canceled) updateField('image', result.assets[0].uri);
    } catch {
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
    }
  };

  const saveMenu = async () => {
    if (!menuItem.name || !menuItem.price)
      return Alert.alert("Erreur", "Veuillez remplir le nom et le prix du plat.");

    try {
      if (isEditing)
        await axios.put(`${BACKEND_URL}/menu/${menuItem.id}`, menuItem);
      else
        await axios.post(`${BACKEND_URL}/menu`, menuItem);

      setModalVisible(false);
      setMenuItem({ id: null, name: '', description: '', price: '', image: null });
      setIsEditing(false);
      fetchMenu();
    } catch {
      Alert.alert('Erreur', 'Impossible de contacter le serveur');
    }
  };

  const deleteMenu = (id) => {
    Alert.alert('Confirmation', 'Voulez-vous vraiment supprimer ce plat ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          try {
            await axios.delete(`${BACKEND_URL}/menu/${id}`);
            fetchMenu();
          } catch {
            Alert.alert('Erreur', 'Impossible de supprimer le plat');
          }
        }
      }
    ]);
  };

  const editMenu = (item) => {
    setMenuItem(item);
    setIsEditing(true);
    setModalVisible(true);
  };

  // -------------------- TopBar Logout ------------------------
  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler" },
      { text: "Déconnecter", style: "destructive", onPress: () => navigation.replace("admin") }
    ]);
  };
  // ---------------------------------------------------------

  const renderItem = ({ item }) => (
    <View style={styles.menuCard}>
      {item.image && <Image source={{ uri: item.image }} style={styles.menuImage} />}
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.menuName}>{item.name}</Text>
        {item.description && <Text style={styles.menuDesc}>{item.description}</Text>}
        <Text style={styles.menuPrice}>${item.price}</Text>
      </View>

      <View style={styles.iconRow}>
        <TouchableOpacity onPress={() => editMenu(item)}>
          <Ionicons name="create-outline" size={20} color="orange" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteMenu(item.id)}>
          <Ionicons name="trash-outline" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* ---------- Top Bar ---------- */}
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>Admin Page</Text>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>
      {/* ---------------------------- */}

      {loading ? (
        <ActivityIndicator size="large" color="teal" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={menuList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>Aucun plat trouvé</Text>}
        />
      )}

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => {
          setIsEditing(false);
          setMenuItem({ id: null, name: '', description: '', price: '', image: null });
          setModalVisible(true);
        }}
      >
        <Text style={styles.addText}>Ajouter un plat</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <Text style={styles.title}>{isEditing ? 'Modifier le plat' : 'Ajouter un nouveau plat'}</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="fast-food" size={22} color="teal" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Nom du plat"
              value={menuItem.name}
              onChangeText={(text) => updateField('name', text)}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="description" size={22} color="teal" style={styles.icon} />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Description"
              value={menuItem.description}
              onChangeText={(text) => updateField('description', text)}
              multiline
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="pricetag" size={22} color="teal" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Prix"
              keyboardType="numeric"
              value={menuItem.price}
              onChangeText={(text) => updateField('price', text)}
            />
          </View>

          <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
            <Text style={styles.imageText}>{menuItem.image ? "Modifier l'image" : "Ajouter une image"}</Text>
          </TouchableOpacity>

          {menuItem.image && <Image source={{ uri: menuItem.image }} style={styles.imagePreview} />}

          <TouchableOpacity style={styles.saveBtn} onPress={saveMenu}>
            <Text style={styles.saveText}>{isEditing ? 'Modifier le plat' : 'Enregistrer le plat'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },

  topBar: {
    width: "100%",
    height: 90,
    backgroundColor: "teal",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 20,
  },

  topBarText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },

  logoutBtn: {
    position: "absolute",
    right: 15,
    padding: 5,
  },

  menuCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    marginHorizontal: 10,
    elevation: 5,
    alignItems: "center",
  },

  menuImage: { width: 80, height: 80, borderRadius: 10 },
  menuName: { fontSize: 18, fontWeight: "bold", color: "teal" },
  menuDesc: { color: "#555" },
  menuPrice: { marginTop: 5, color: "green", fontWeight: "bold" },

  iconRow: { flexDirection: "row", justifyContent: "space-between", width: 70, marginLeft: "auto" },

  addBtn: {
    backgroundColor: "teal",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    margin: 15,
  },
  addText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  modalContainer: { padding: 20, backgroundColor: "#FAFAFA", flexGrow: 1 },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "teal",
    marginBottom: 20,
    textAlign: "center",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: "#f9f9f9",
  },

  icon: { marginRight: 10 },

  input: { flex: 1, paddingVertical: 8, fontSize: 16, color: "#333" },

  imageBtn: {
    backgroundColor: "teal",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },

  imageText: { color: "white", fontWeight: "bold", fontSize: 16 },

  imagePreview: { width: "100%", height: 200, borderRadius: 15, marginBottom: 15 },

  saveBtn: {
    backgroundColor: "teal",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  saveText: { color: "white", fontWeight: "bold", fontSize: 18 },

  cancelBtn: {
    backgroundColor: "#ccc",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  cancelText: { color: "black", fontWeight: "bold", fontSize: 16 },
});
