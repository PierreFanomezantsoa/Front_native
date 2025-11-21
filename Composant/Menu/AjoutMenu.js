import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Image, Alert, Modal, ScrollView, ActivityIndicator,
  Platform, StatusBar
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

// Constantes de style
const PRIMARY_COLOR = '#008080';
const ACCENT_COLOR = '#008080';
const BACKGROUND_COLOR = '#F4F7F9';
const CARD_BACKGROUND = '#FFFFFF';

const BACKEND_URL = 'http://192.168.137.118:8000'; // À adapter

export default function MenuList({ navigation }) {
  const [menuList, setMenuList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [menuItem, setMenuItem] = useState({
    id: null, name: '', description: '', price: '', image: null
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/menu`);
      const formattedMenu = response.data.menu.map(item => ({
        ...item,
        price: String(item.price)
      }));
      setMenuList(formattedMenu || []);
    } catch {
      Alert.alert('Erreur', 'Impossible de récupérer les plats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMenu(); }, []);

  const updateField = (field, value) => {
    setMenuItem({ ...menuItem, [field]: value });
  };

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
    if (!menuItem.name || !menuItem.price || isNaN(parseFloat(menuItem.price)))
      return Alert.alert("Erreur", "Veuillez remplir le nom et le prix valide du plat.");

    try {
      setLoading(true);
      const dataToSend = { ...menuItem, price: parseFloat(menuItem.price) };
      if (isEditing)
        await axios.put(`${BACKEND_URL}/menu/${menuItem.id}`, dataToSend);
      else
        await axios.post(`${BACKEND_URL}/menu`, dataToSend);

      setModalVisible(false);
      setMenuItem({ id: null, name: '', description: '', price: '', image: null });
      setIsEditing(false);
      fetchMenu();
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', 'Impossible de contacter le serveur ou erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
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
    setMenuItem({ ...item, price: String(item.price) }); 
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler" },
      {
        text: "Déconnecter",
        style: "destructive",
        onPress: () => navigation.replace("admin")
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.menuCard}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.menuImage} />
      ) : (
        <View style={[styles.menuImage, styles.placeholderImage]}>
          <Ionicons name="image-outline" size={30} color="#ccc" />
        </View>
      )}

      <View style={styles.menuInfo}>
        <Text style={styles.menuName} numberOfLines={1}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text>
        ) : (
          <Text style={styles.noDesc}>Pas de description</Text>
        )}
        <Text style={styles.menuPrice}>{parseFloat(item.price).toFixed(2)} Ar</Text>
      </View>

      <View style={styles.iconRow}>
        <TouchableOpacity style={styles.iconButton} onPress={() => editMenu(item)}>
          <Ionicons name="create-outline" size={24} color={ACCENT_COLOR} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, { marginLeft: 15 }]} onPress={() => deleteMenu(item.id)}>
          <Ionicons name="trash-outline" size={24} color="#D32F2F" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} />
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.orderBtn} onPress={() => navigation.navigate("listecommande")}>
          <Ionicons name="receipt-outline" size={26} color={CARD_BACKGROUND} />
        </TouchableOpacity>
        <Text style={styles.topBarText}>Gestion des Plats</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color={CARD_BACKGROUND} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY_COLOR} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={menuList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.flatListContent}
          refreshing={loading}
          onRefresh={fetchMenu}
          ListEmptyComponent={
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30 }}>
              <Ionicons name="sad-outline" size={20} color="#555" style={{ marginRight: 5 }} />
              <Text style={styles.emptyListText}>
                Aucun plat trouvé. Tirez pour rafraîchir.
              </Text>
            </View>
          }
        />
      )}

      {/* Bouton Ajouter */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => {
          setIsEditing(false);
          setMenuItem({ id: null, name: '', description: '', price: '', image: null });
          setModalVisible(true);
        }}
      >
        <Ionicons name="add-outline" size={30} color={CARD_BACKGROUND} />
      </TouchableOpacity>

      {/* Modal */}
      <Modal 
        visible={modalVisible} 
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <Text style={styles.title}>
            {isEditing ? '🍽️ Modifier le plat' : '✨ Ajouter un nouveau plat'}
          </Text>

          {/* Nom */}
          <View style={styles.inputContainer}>
            <Ionicons name="fast-food" size={22} color={PRIMARY_COLOR} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Nom du plat *"
              placeholderTextColor="#888"
              value={menuItem.name}
              onChangeText={(text) => updateField('name', text)}
            />
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="description" size={22} color={PRIMARY_COLOR} style={styles.icon} />
            <TextInput
              style={[styles.input, styles.multiLineInput]}
              placeholder="Description"
              placeholderTextColor="#888"
              value={menuItem.description}
              onChangeText={(text) => updateField('description', text)}
              multiline
            />
          </View>

          {/* Prix */}
          <View style={styles.inputContainer}>
            <Ionicons name="pricetag" size={22} color={PRIMARY_COLOR} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Prix ($) *"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={menuItem.price}
              onChangeText={(text) => updateField('price', text.replace(/[^0-9.]/g, ''))}
            />
          </View>

          {/* Image */}
          <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
            <Ionicons name="camera-outline" size={20} color="white" style={{ marginRight: 5 }} />
            <Text style={styles.imageText}>
              {menuItem.image ? "Modifier l'image" : "Ajouter une image"}
            </Text>
          </TouchableOpacity>

          {menuItem.image && (
            <Image source={{ uri: menuItem.image }} style={styles.imagePreview} />
          )}

          {/* Enregistrer */}
          <TouchableOpacity style={styles.saveBtn} onPress={saveMenu} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveText}>
                {isEditing ? 'Enregistrer les modifications' : 'Ajouter le plat'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Annuler */}
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={loading}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>

        </ScrollView>
      </Modal>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },

  topBar: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 40,
    height: Platform.OS === 'android' ? 90 + StatusBar.currentHeight : 100,
    backgroundColor: PRIMARY_COLOR,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    elevation: 5,
  },

  topBarText: {
    color: CARD_BACKGROUND,
    fontSize: 22,
    fontWeight: "bold",
  },

  orderBtn: { position: "absolute", left: 15, bottom: 10, padding: 8 },
  logoutBtn: { position: "absolute", right: 15, bottom: 10, padding: 8 },

  flatListContent: { paddingVertical: 10, paddingBottom: 100 },

  menuCard: {
    flexDirection: "row",
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 15,
    padding: 15,
    marginVertical: 7,
    marginHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: "center",
  },

  menuImage: { width: 80, height: 80, borderRadius: 10, marginRight: 15 },
  placeholderImage: { backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },

  menuInfo: { flex: 1, marginRight: 10 },
  menuName: { fontSize: 18, fontWeight: "800", color: PRIMARY_COLOR, marginBottom: 2 },
  menuDesc: { color: "#666", fontSize: 14 },
  noDesc: { color: "#999", fontSize: 12, fontStyle: 'italic' },
  menuPrice: { marginTop: 5, color: "#2E8B57", fontWeight: "bold", fontSize: 16 },

  iconRow: { flexDirection: "row", alignItems: 'center', justifyContent: 'flex-end' },
  iconButton: { padding: 5 },

  emptyListText: { color: '#555', fontSize: 16 },

  addBtn: {
    position: 'absolute', bottom: 25, right: 25,
    backgroundColor: PRIMARY_COLOR, width: 60, height: 60,
    borderRadius: 30, justifyContent: 'center', alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8,
  },

  modalContainer: { padding: 20, backgroundColor: BACKGROUND_COLOR, paddingTop: 40, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: "bold", color: PRIMARY_COLOR, marginBottom: 30, textAlign: "center" },

  inputContainer: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10,
    marginBottom: 15, paddingHorizontal: 10, backgroundColor: CARD_BACKGROUND,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 1, elevation: 2,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: "#333" },
  multiLineInput: { height: 100, textAlignVertical: 'top', paddingVertical: 12 },

  imageBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: PRIMARY_COLOR, padding: 15, borderRadius: 10,
    marginBottom: 15, shadowColor: PRIMARY_COLOR, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  imageText: { color: CARD_BACKGROUND, fontWeight: "bold", fontSize: 16 },
  imagePreview: { width: "100%", height: 200, borderRadius: 15, marginBottom: 20, borderWidth: 2, borderColor: PRIMARY_COLOR },

  saveBtn: { backgroundColor: PRIMARY_COLOR, padding: 18, borderRadius: 10, alignItems: "center", marginTop: 15, shadowColor: PRIMARY_COLOR, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 5, elevation: 6 },
  saveText: { color: CARD_BACKGROUND, fontWeight: "bold", fontSize: 18 },

  cancelBtn: { backgroundColor: '#A9A9A9', padding: 15, borderRadius: 10, alignItems: "center", marginTop: 10, borderWidth: 1, borderColor: '#999' },
  cancelText: { color: 'white', fontWeight: "bold", fontSize: 16 },
});
