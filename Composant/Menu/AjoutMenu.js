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

// Constantes de design cohérentes
const PRIMARY_COLOR = '#008080';
const SECONDARY_COLOR = '#004D40';
const ACCENT_COLOR = '#D32F2F';
const BACKGROUND_LIGHT = '#F0F5F5';
const CARD_BG = '#FFFFFF';
const SUCCESS_COLOR = '#2E8B57';
const BORDER_COLOR = '#E0E0E0';

const { width } = Dimensions.get('window');
const BACKEND_URL = 'http://192.168.1.133:3000';

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

  // --- Fetch menu ---
  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/menus`);
      let menuData = [];
      if (Array.isArray(response.data)) menuData = response.data;
      else if (response.data.menu) menuData = response.data.menu;
      else if (response.data.menus) menuData = response.data.menus;

      const formattedMenu = menuData.map(item => ({
        ...item,
        id: item.id || item._id,
        price: String(item.price || 0),
        name: item.name || item.nom || 'Sans nom',
        description: item.description || '',
        category: item.category || item.categorie || 'Autres',
        image: item.image || null
      }));

      setMenuList(formattedMenu);
    } catch (error) {
      console.error('Erreur fetch menu:', error);
      Alert.alert('Erreur', 'Impossible de récupérer les plats');
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch initial count commandes ---
  const fetchSuccessfulCommandCount = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/commande/stats/recent-count`);
      setSuccessfulCommandCount(response.data.successful || 0);
    } catch (error) {
      console.error('Erreur fetch commandes réussies:', error);
      setSuccessfulCommandCount(0);
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchSuccessfulCommandCount();

    // --- Socket.io ---
    socketRef.current = io(BACKEND_URL);
    socketRef.current.on('connect', () => console.log('Socket connecté'));

    socketRef.current.on('commande:new', (commande) => {
      console.log('Nouvelle commande reçue:', commande);
      setSuccessfulCommandCount(prev => prev + 1);
      setNewCommandAlert(true);

      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true })
      ]).start();

      setTimeout(() => setNewCommandAlert(false), 3000);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  // --- Helper ---
  const updateField = (field, value) => setMenuItem({ ...menuItem, [field]: value });

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8
      });
      if (!result.canceled) updateField('image', result.assets[0].uri);
    } catch (error) {
      console.error('Erreur image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const saveMenu = async () => {
    if (!menuItem.name.trim()) return Alert.alert("Erreur", "Le nom du plat est obligatoire");
    const priceValue = parseFloat(menuItem.price);
    if (isNaN(priceValue) || priceValue <= 0) return Alert.alert("Erreur", "Veuillez entrer un prix valide");

    try {
      setLoading(true);
      const dataToSend = {
        name: menuItem.name.trim(),
        description: menuItem.description.trim(),
        price: priceValue,
        category: menuItem.category || 'Autres',
        image: menuItem.image
      };
      if (isEditing) await axios.put(`${BACKEND_URL}/menus/${menuItem.id}`, dataToSend);
      else await axios.post(`${BACKEND_URL}/menus`, dataToSend);

      Alert.alert('Succès', isEditing ? 'Plat modifié avec succès' : 'Plat ajouté avec succès');
      setModalVisible(false);
      setMenuItem({ id: null, name: '', description: '', price: '', image: null, category: '' });
      setIsEditing(false);
      fetchMenu();
    } catch (error) {
      console.error('Erreur save:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  const deleteMenu = (id) => {
    Alert.alert('Confirmation', 'Voulez-vous vraiment supprimer ce plat ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { 
          setLoading(true); 
          await axios.delete(`${BACKEND_URL}/menus/${id}`); 
          Alert.alert('Succès', 'Plat supprimé');
          fetchMenu(); 
        } catch { 
          Alert.alert('Erreur', 'Impossible de supprimer le plat'); 
        } finally { 
          setLoading(false); 
        }
      }}
    ]);
  };

  const editMenu = (item) => {
    setMenuItem({
      id: item.id,
      name: item.name || '',
      description: item.description || '',
      price: String(item.price || 0),
      image: item.image || null,
      category: item.category || 'Autres'
    });
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: 'cancel' },
      { text: "Déconnecter", style: "destructive", onPress: () => navigation.replace("admin") }
    ]);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setMenuItem({ id: null, name: '', description: '', price: '', image: null, category: '' });
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.menuCard}>
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.menuImage} />
          ) : (
            <View style={[styles.menuImage, styles.placeholderImage]}>
              <MaterialCommunityIcons name="food-variant" size={45} color="#ccc" />
            </View>
          )}
          
          <View style={styles.menuInfo}>
            <Text style={styles.menuName} numberOfLines={2}>{item.name}</Text>
            {item.category && item.category !== 'Autres' && (
              <View style={styles.categoryBadge}>
                <MaterialIcons name="category" size={14} color={PRIMARY_COLOR} />
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}
            {item.description ? (
              <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text>
            ) : (
              <Text style={styles.noDesc}>Aucune description</Text>
            )}
            <Text style={styles.menuPrice}>{parseFloat(item.price).toFixed(2)} Ar</Text>
          </View>
        </View>

        {/* Boutons à droite */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.editBtn]} 
            onPress={() => editMenu(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={15} color={CARD_BG} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, styles.deleteBtn]} 
            onPress={() => deleteMenu(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={15} color={CARD_BG} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} />
      
      {/* HEADER MODERNE */}
      <View style={styles.header}>
        <View style={styles.headerDecoration1} />
        <View style={styles.headerDecoration2} />
        
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.headerIconBtn} 
            onPress={() => navigation.navigate("listecommande")}
            activeOpacity={0.8}
          >
            <Ionicons name="receipt-outline" size={24} color={CARD_BG} />
            {successfulCommandCount > 0 && (
              <Animated.View style={[
                styles.badge, 
                newCommandAlert && { 
                  backgroundColor: '#FF3D00', 
                  transform: [{ scale: scaleAnim }] 
                }
              ]}>
                <Text style={styles.badgeText}>{successfulCommandCount}</Text>
              </Animated.View>
            )}
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <MaterialCommunityIcons name="food-fork-drink" size={28} color={CARD_BG} />
            <Text style={styles.headerTitle}>Gestion Menu</Text>
          </View>

          <TouchableOpacity 
            style={styles.headerIconBtn} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={24} color={CARD_BG} />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENU */}
      {loading && menuList.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Chargement des plats...</Text>
        </View>
      ) : menuList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="food-off" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Aucun plat disponible</Text>
          <Text style={styles.emptySubtext}>Ajoutez votre premier plat au menu</Text>
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

      {/* BOUTON FLOTTANT AJOUTER */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={openAddModal}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={32} color={CARD_BG} />
      </TouchableOpacity>

      {/* MODAL AJOUTER/MODIFIER */}
      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          
          {/* Header Modal */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              style={styles.modalCloseBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={32} color={PRIMARY_COLOR} />
            </TouchableOpacity>
            
            <View style={styles.modalTitleContainer}>
              <MaterialCommunityIcons 
                name={isEditing ? "pencil" : "plus-circle"} 
                size={28} 
                color={PRIMARY_COLOR} 
              />
              <Text style={styles.modalTitle}>
                {isEditing ? 'Modifier le plat' : 'Nouveau plat'}
              </Text>
            </View>
            
            <View style={{ width: 32 }} />
          </View>

          <ScrollView 
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Nom */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nom du plat *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="restaurant" size={20} color={PRIMARY_COLOR} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Ex: Pizza Margherita" 
                  placeholderTextColor="#999" 
                  value={menuItem.name} 
                  onChangeText={text => updateField('name', text)} 
                  editable={!loading} 
                />
              </View>
            </View>

            {/* Catégorie */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Catégorie</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="category" size={20} color={PRIMARY_COLOR} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Ex: Entrées, Plats, Desserts" 
                  placeholderTextColor="#999" 
                  value={menuItem.category} 
                  onChangeText={text => updateField('category', text)} 
                  editable={!loading} 
                />
              </View>
            </View>

            {/* Prix */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Prix (Ar) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="cash-outline" size={20} color={PRIMARY_COLOR} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Ex: 15000" 
                  placeholderTextColor="#999" 
                  keyboardType="decimal-pad" 
                  value={menuItem.price} 
                  onChangeText={text => updateField('price', text.replace(/[^0-9.]/g, ''))} 
                  editable={!loading} 
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <MaterialIcons name="description" size={20} color={PRIMARY_COLOR} style={[styles.inputIcon, { alignSelf: 'flex-start', marginTop: 12 }]} />
                <TextInput 
                  style={[styles.input, styles.textArea]} 
                  placeholder="Décrivez le plat..." 
                  placeholderTextColor="#999" 
                  value={menuItem.description} 
                  onChangeText={text => updateField('description', text)} 
                  multiline 
                  numberOfLines={4} 
                  editable={!loading} 
                />
              </View>
            </View>

            {/* Image */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Image du plat</Text>
              <TouchableOpacity 
                style={styles.imagePickerBtn} 
                onPress={pickImage} 
                disabled={loading}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={22} color={CARD_BG} />
                <Text style={styles.imagePickerText}>
                  {menuItem.image ? "Modifier l'image" : "Ajouter une image"}
                </Text>
              </TouchableOpacity>
              
              {menuItem.image && (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: menuItem.image }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeImageBtn}
                    onPress={() => updateField('image', null)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle" size={28} color={ACCENT_COLOR} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Boutons d'action */}
            <TouchableOpacity 
              style={[styles.submitBtn, loading && styles.disabledBtn]} 
              onPress={saveMenu} 
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={CARD_BG} size="small" />
              ) : (
                <>
                  <Ionicons 
                    name={isEditing ? "checkmark-circle" : "add-circle"} 
                    size={22} 
                    color={CARD_BG} 
                  />
                  <Text style={styles.submitText}>
                    {isEditing ? 'Enregistrer les modifications' : 'Ajouter au menu'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => setModalVisible(false)} 
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: BACKGROUND_LIGHT 
  },

  // --- HEADER ---
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 50,
    paddingBottom: 20,
    backgroundColor: PRIMARY_COLOR,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  headerDecoration1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 150,
    height: 150,
  },
  headerDecoration2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 100,
    height: 100
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
  },
  badgeText: {
    color: CARD_BG,
    fontSize: 11,
    fontWeight: '800',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: CARD_BG,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // --- LISTE ---
  flatListContent: {
    padding: 15,
    paddingBottom: 100,
  },
  menuCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    marginRight: 12,
  },
  menuImage: {
    width: 90,
    height: 90,
    borderRadius: 15,
    marginRight: 15,
  },
  placeholderImage: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BORDER_COLOR,
    borderStyle: 'dashed',
  },
  menuInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  menuName: {
    fontSize: 18,
    fontWeight: '800',
    color: SECONDARY_COLOR,
    marginBottom: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: `${PRIMARY_COLOR}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 11,
    color: PRIMARY_COLOR,
    fontWeight: '700',
  },
  menuDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 6,
  },
  noDesc: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  menuPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: SUCCESS_COLOR,
    marginTop: 4,
  },
  actionButtons: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    width: 35,
    height: 35,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  editBtn: {
    backgroundColor: PRIMARY_COLOR,
  },
  deleteBtn: {
    backgroundColor: ACCENT_COLOR,
  },

  // --- EMPTY STATE ---
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },

  // --- FAB ---
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  // --- MODAL ---
  modalContainer: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    elevation: 3,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: SECONDARY_COLOR,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // --- FORMULAIRE ---
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: SECONDARY_COLOR,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderWidth: 2,
    borderColor: BORDER_COLOR,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 4,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  // --- IMAGE ---
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 15,
    gap: 10,
  },
  imagePickerText: {
    color: CARD_BG,
    fontSize: 15,
    fontWeight: '700',
  },
  imagePreviewContainer: {
    marginTop: 15,
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 15,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: CARD_BG,
    borderRadius: 14,
  },

  // --- BOUTONS ---
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 16,
    borderRadius: 15,
    marginTop: 10,
    gap: 10,
    elevation: 5,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitText: {
    color: CARD_BG,
    fontSize: 16,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  cancelBtn: {
    paddingVertical: 16,
    borderRadius: 15,
    backgroundColor: CARD_BG,
    borderWidth: 2,
    borderColor: BORDER_COLOR,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '700',
  },
});