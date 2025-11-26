import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Image, Alert, Modal, ScrollView, ActivityIndicator,
  Platform, StatusBar, Animated, Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import io from 'socket.io-client';

// ------------------- COULEURS ET CONSTANTES AMÉLIORÉES -------------------
const PRIMARY_COLOR = '#008080'; // Bleu Teal Principal
const SECONDARY_COLOR = '#4CAF50'; // Vert pour succès/validation (utilisé pour les boutons généraux si besoin)
const CARD_BG = '#FFFFFF';
const BACKGROUND_LIGHT = '#F4F7F9'; // Un gris plus subtil
const ACCENT_COLOR = '#D32F2F'; // Rouge pour danger/suppression
const TERTIARY_COLOR = '#FF9800'; // Orange pour l'alerte/nouveauté (badge)

const { width } = Dimensions.get('window');
const BACKEND_URL = 'http://192.168.1.133:3000';
// --------------------------------------------------------------------------

export default function MenuList({ navigation }) {
  const [menuList, setMenuList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [menuItem, setMenuItem] = useState({ id: null, name: '', description: '', price: '', image: null, category: '' });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [successfulCommandCount, setSuccessfulCommandCount] = useState(0);
  const [newCommandAlert, setNewCommandAlert] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const socketRef = useRef(null);

  // ... (Fonctions inchangées : fetchMenu, fetchSuccessfulCommandCount, useEffect, updateField) ...
  // --- Fetch menu ---
  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/menus`);
      const menuData = Array.isArray(response.data) ? response.data : response.data.menus || [];
      const formattedMenu = menuData.map(item => ({
        ...item,
        id: item.id || item._id,
        price: String(item.price || 0),
        name: item.name || item.nom || 'Sans nom',
        description: item.description || '',
        category: item.category || item.categorie || 'Autres',
        image: item.image ? item.image : null
      }));
      setMenuList(formattedMenu);
    } catch (error) {
      console.error('Erreur fetch menu:', error);
      Alert.alert('Erreur', 'Impossible de récupérer les plats');
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch commandes count ---
  const fetchSuccessfulCommandCount = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/commande/stats/recent-count`);
      setSuccessfulCommandCount(response.data.successful || 0);
    } catch {
      setSuccessfulCommandCount(0);
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchSuccessfulCommandCount();

    socketRef.current = io(BACKEND_URL);
    socketRef.current.on('connect', () => console.log('Socket connecté'));

    socketRef.current.on('commande:new', () => {
      // Mise à jour badge
      setSuccessfulCommandCount(prev => prev + 1);

      // Animation
      setNewCommandAlert(true);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true })
      ]).start();
      setTimeout(() => setNewCommandAlert(false), 3000);
    });

    return () => socketRef.current.disconnect();
  }, []);

  const updateField = (field, value) => setMenuItem({ ...menuItem, [field]: value });

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        let uri = result.assets[0].uri;
        if (Platform.OS === 'android' && !uri.startsWith('file://') && !uri.startsWith('http')) {
          uri = 'file://' + uri;
        }
        updateField('image', uri);
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const saveMenu = async () => {
    if (!menuItem.name.trim()) return Alert.alert("Erreur", "Le nom du plat est obligatoire");
    const priceValue = parseFloat(menuItem.price);
    if (isNaN(priceValue) || priceValue <= 0) return Alert.alert("Erreur", "Veuillez entrer un prix valide");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', menuItem.name.trim());
      formData.append('description', menuItem.description.trim());
      formData.append('price', priceValue.toString());
      formData.append('category', menuItem.category || 'Autres');

      if (menuItem.image && !menuItem.image.startsWith('http')) {
        const uriParts = menuItem.image.split('/');
        const fileName = uriParts[uriParts.length - 1];
        const fileType = fileName.split('.').pop();
        formData.append('image', {
          uri: menuItem.image,
          name: fileName,
          type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
        });
      }

      const headers = { 'Content-Type': 'multipart/form-data' };

      if (isEditing) {
        await axios.patch(`${BACKEND_URL}/menus/${menuItem.id}`, formData, { headers });
      } else {
        await axios.post(`${BACKEND_URL}/menus`, formData, { headers });
      }

      Alert.alert('Succès', isEditing ? 'Plat modifié' : 'Plat ajouté');
      setModalVisible(false);
      setMenuItem({ id: null, name: '', description: '', price: '', image: null, category: '' });
      setIsEditing(false);
      fetchMenu();

    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  const deleteMenu = (id) => {
    Alert.alert('Confirmation', 'Voulez-vous supprimer ce plat ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { setLoading(true); await axios.delete(`${BACKEND_URL}/menus/${id}`); fetchMenu(); } 
        catch { Alert.alert('Erreur', 'Impossible de supprimer le plat'); } 
        finally { setLoading(false); }
      }}
    ]);
  };

  const editMenu = (item) => {
    setMenuItem({
      id: item.id,
      name: item.name,
      description: item.description,
      price: String(item.price),
      image: item.image,
      category: item.category || 'Autres'
    });
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ?", [
      { text: "Annuler", style: 'cancel' },
      { text: "Déconnecter", style: "destructive", onPress: () => navigation.replace("admin") }
    ]);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setMenuItem({ id: null, name: '', description: '', price: '', image: null, category: '' });
    setModalVisible(true);
  };
  // ... (Fin des fonctions inchangées) ...

  const renderItem = ({ item }) => (
    <View style={styles.menuCard}>
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.menuImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.menuImage, styles.placeholderImage]}>
              <MaterialCommunityIcons name="food-variant" size={45} color="#B0BEC5" />
            </View>
          )}
          <View style={styles.menuInfo}>
            <Text style={styles.menuName}>{item.name}</Text>
            {item.category && item.category !== 'Autres' && (
              <View style={styles.categoryBadge}>
                <MaterialIcons name="local-offer" size={14} color={PRIMARY_COLOR} />
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}
            <Text style={styles.menuDesc} numberOfLines={2} ellipsizeMode="tail">
              {item.description || 'Aucune description fournie.'}
            </Text>
            <Text style={styles.menuPrice}>{parseFloat(item.price).toFixed(2)} Ar</Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => editMenu(item)}>
            <Ionicons name="create-outline" size={18} color={CARD_BG} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => deleteMenu(item.id)}>
            <Ionicons name="trash-outline" size={18} color={CARD_BG} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} />

      {/* HEADER AMÉLIORÉ */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          
          <TouchableOpacity 
            style={styles.headerIconBtn} 
            onPress={() => {
              setSuccessfulCommandCount(0); // reset badge après consultation
              navigation.navigate("listecommande");
            }}
          >
            <Ionicons name="receipt-outline" size={24} color={CARD_BG} />
            {successfulCommandCount > 0 && (
              <Animated.View
                style={[
                  styles.badge,
                  { backgroundColor: TERTIARY_COLOR }, // Utiliser la couleur tertiaire pour le badge
                  newCommandAlert && { transform: [{ scale: scaleAnim }] }
                ]}
              >
                <Text style={styles.badgeText}>{successfulCommandCount}</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <MaterialCommunityIcons name="food-fork-drink" size={28} color={CARD_BG} />
            <Text style={styles.headerTitle}>Gestion Menu</Text>
          </View>

          <TouchableOpacity style={styles.headerIconBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={CARD_BG} />
          </TouchableOpacity>
        </View>
      </View>

      {loading && menuList.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Chargement des plats...</Text>
        </View>
      ) : menuList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="food-off" size={80} color="#B0BEC5" />
          <Text style={styles.emptyText}>Aucun plat disponible. Ajoutez-en un !</Text>
        </View>
      ) : (
        <FlatList
          data={menuList}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={32} color={CARD_BG} />
      </TouchableOpacity>

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)} transparent={true}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{isEditing ? 'Modifier le plat' : 'Nouveau plat'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalBtn}>
                  <Ionicons name="close" size={28} color={PRIMARY_COLOR} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                <Text style={styles.label}>Nom <Text style={styles.required}>*</Text></Text>
                <TextInput value={menuItem.name} onChangeText={text => updateField('name', text)} style={styles.input} placeholder="Nom du plat/boisson" />

                <Text style={styles.label}>Catégorie</Text>
                <TextInput value={menuItem.category} onChangeText={text => updateField('category', text)} style={styles.input} placeholder="Ex: Entrée, Plat, Dessert..." />

                <Text style={styles.label}>Prix <Text style={styles.required}>*</Text></Text>
                <TextInput keyboardType="decimal-pad" value={menuItem.price} onChangeText={text => updateField('price', text.replace(/[^0-9.]/g, ''))} style={styles.input} placeholder="0.00" />

                <Text style={styles.label}>Description</Text>
                <TextInput 
                  value={menuItem.description} 
                  onChangeText={text => updateField('description', text)} 
                  style={[styles.input, styles.multilineInput]} 
                  multiline 
                  placeholder="Décrivez brièvement le plat..."
                />

                <TouchableOpacity onPress={pickImage} style={styles.imagePickerBtn}>
                  <Ionicons name="image-outline" size={20} color={CARD_BG} />
                  <Text style={styles.imagePickerText}>{menuItem.image ? "Modifier l'image" : "Ajouter une image"}</Text>
                </TouchableOpacity>
                {menuItem.image && (
                  <View style={styles.imagePreviewContainer}>
                      <Image source={{ uri: menuItem.image }} style={styles.imagePreview} resizeMode="cover" />
                  </View>
                )}

                <TouchableOpacity onPress={saveMenu} style={styles.submitBtn} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color={CARD_BG} />
                  ) : (
                    <Text style={styles.submitBtnText}>{isEditing ? 'Enregistrer les modifications' : 'Ajouter le plat'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ------------------- STYLES AMÉLIORÉS -------------------
const styles = StyleSheet.create({
  // Base
  container: { flex: 1, backgroundColor: BACKGROUND_LIGHT },
  baseText: { fontSize: 14, color: '#333' },
  required: { color: ACCENT_COLOR, fontWeight: 'bold' },

  // Header
  header: { 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50, 
    paddingBottom: 15, 
    backgroundColor: PRIMARY_COLOR,
    elevation: 4, // Ombre Android
    shadowColor: '#000', // Ombre iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: CARD_BG, fontSize: 22, fontWeight: 'bold' },
  
  // Badge
  badge: { 
    position: 'absolute', 
    top: -5, 
    right: -5, 
    backgroundColor: TERTIARY_COLOR, 
    borderRadius: 10, 
    minWidth: 20, 
    height: 20, 
    paddingHorizontal: 3, 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 10,
    borderWidth: 1,
    borderColor: CARD_BG,
  },
  badgeText: { color: CARD_BG, fontSize: 11, fontWeight: 'bold', textAlign: 'center' },

  // List & Cards
  flatListContent: { padding: 15, paddingBottom: 100 },
  menuCard: { 
    backgroundColor: CARD_BG, 
    borderRadius: 12, 
    padding: 15, 
    marginBottom: 15, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    // Ombre Améliorée
    elevation: 3, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2.22,
  },
  cardContent: { flexDirection: 'row', flex: 1, alignItems: 'center' },
  cardLeft: { flexDirection: 'row', flex: 1, alignItems: 'center' },
  menuImage: { width: 80, height: 80, borderRadius: 10, marginRight: 15, backgroundColor: BACKGROUND_LIGHT },
  placeholderImage: { justifyContent: 'center', alignItems: 'center', },
  menuInfo: { flex: 1, paddingRight: 10 },
  menuName: { fontWeight: 'bold', fontSize: 18, color: '#333', marginBottom: 2 },
  menuDesc: { color: '#666', fontSize: 13, marginTop: 4 },
  menuPrice: { color: PRIMARY_COLOR, marginTop: 6, fontWeight: 'bold', fontSize: 16 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, backgroundColor: BACKGROUND_LIGHT, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  categoryText: { color: PRIMARY_COLOR, fontSize: 12, fontWeight: '600' },
  
  // Action Buttons (Card)
  actionButtons: { flexDirection: 'column', alignItems: 'center', justifyContent: 'space-around', height: 80, marginLeft: 10 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginVertical: 4, elevation: 2 },
  editBtn: { backgroundColor: PRIMARY_COLOR },
  deleteBtn: { backgroundColor: ACCENT_COLOR },

  // FAB
  fab: { 
    position: 'absolute', 
    bottom: 30, 
    right: 20, 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: PRIMARY_COLOR, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 6,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  
  // Empty/Loading State
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#555' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 10, color: '#777', fontSize: 16 },

  // Modal
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalView: { 
    width: width * 0.9, 
    backgroundColor: CARD_BG, 
    borderRadius: 20, 
    padding: 25, 
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  closeModalBtn: { padding: 5 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: PRIMARY_COLOR },
  modalContent: { flex: 1 },
  
  // Form elements
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 5, marginTop: 10 },
  input: { 
    backgroundColor: BACKGROUND_LIGHT, 
    padding: Platform.OS === 'ios' ? 14 : 10, 
    borderRadius: 10, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#E0E0E0',
    fontSize: 16,
    color: '#333'
  },
  multilineInput: { height: 100, textAlignVertical: 'top' },
  
  // Image Picker
  imagePickerBtn: { 
    backgroundColor: SECONDARY_COLOR, 
    flexDirection: 'row',
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 15,
    marginBottom: 15
  },
  imagePickerText: { color: CARD_BG, fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  imagePreviewContainer: { borderWidth: 2, borderColor: '#E0E0E0', borderRadius: 12, overflow: 'hidden', marginBottom: 15 },
  imagePreview: { width: '100%', height: 180 },
  
  // Submit Button
  submitBtn: { 
    backgroundColor: PRIMARY_COLOR, 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 15,
    elevation: 3,
  },
  submitBtnText: { color: CARD_BG, fontSize: 16, fontWeight: 'bold' }
});