import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Image,
  TouchableOpacity, Modal, Dimensions, Alert, Share, Platform, StatusBar, TextInput,
  FlatList 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome, Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get("window");

// Constantes de style
const PRIMARY_COLOR = '#008080'; // Teal
const ACCENT_COLOR = '#4CAF50'; // Vert pour les prix
const BACKGROUND_COLOR = '#F4F7F9'; // Gris clair
const CARD_COLOR = '#FFFFFF';

// Utilitaires
const getItemPrice = (item) => item.price || item.prix || 0;
const getItemName = (item) => item.name || item.nom || 'Article inconnu';
const getItemCategory = (item) => item.category || item.categorie || 'Autres';

export default function KiosqueMenu({ route, navigation }) {
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState(['Tout']);
  const [selectedCategory, setSelectedCategory] = useState('Tout');
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [storedTable, setStoredTable] = useState(null);

  // Charger tableNumber depuis AsyncStorage
  useEffect(() => {
    const loadTable = async () => {
      try {
        const saved = await AsyncStorage.getItem("TABLE_ID");
        if (saved) setStoredTable(saved);
      } catch (e) { console.log("Erreur load table:", e); }
    };
    loadTable();
  }, []);

  // Sauvegarder tableNumber
  useEffect(() => {
    const saveTable = async () => {
      try {
        if (route.params?.tableNumber) {
          const t = route.params.tableNumber.toString();
          await AsyncStorage.setItem("TABLE_ID", t);
          setStoredTable(t);
        }
      } catch (e) { console.log("Erreur save table:", e); }
    };
    saveTable();
  }, [route.params?.tableNumber]);

  // Charger menu
  const loadMenu = async () => {
    try {
      const res = await fetch("http://192.168.137.118:3000/menus");
      if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data) ? data : Array.isArray(data.menus) ? data.menus : [];
      setMenu(items);
      const uniqueCategories = ['Tout', ...new Set(items.map(item => getItemCategory(item)))];
      setCategories(uniqueCategories);
      setLoading(false);
    } catch (err) {
      console.error('Erreur fetch:', err);
      Alert.alert("Erreur", "Impossible de charger le menu");
      setLoading(false);
    }
  };

  useEffect(() => { loadMenu(); }, []);

  // Ajouter au panier
  const addToCart = (item) => {
    setCart(prevCart => {
      const existing = prevCart.find(c => c.item.id === item.id);
      if (existing) return prevCart.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      else return [...prevCart, { item, qty: 1 }];
    });
    if (notifications.length < 5) {
      setNotifications(prev => [
        { id: Date.now(), message: `Ajouté : ${getItemName(item)}`, date: new Date().toLocaleString() },
        ...prev,
      ]);
    }
  };

  const updateCartItemQuantity = (itemId, change) => {
    setCart(prevCart => prevCart.map(c => c.item.id === itemId ? { ...c, qty: Math.max(1, c.qty + change) } : c).filter(c => c.qty > 0));
  };

  const totalPrice = cart.reduce((sum, c) => sum + getItemPrice(c.item) * c.qty, 0);

  const buildItemsPayload = (cartItems) => {
    const itemsArray = cartItems.map(c => ({
      name: getItemName(c.item),
      price: getItemPrice(c.item),
      qty: c.qty,
      id: c.item.id ?? null,
    }));
    const json = JSON.stringify(itemsArray);
    return { itemsArray, itemsJson: json };
  };

  const handlePayment = async (method) => {
    if (cart.length === 0) return Alert.alert("Panier vide !", "Veuillez ajouter des articles avant de payer.");
    if (!storedTable) return Alert.alert("Erreur", "Le numéro de table n'est pas défini.");
    setProcessingPayment(true);
    const localTxnId = "TXN" + Math.floor(Math.random() * 1000000);
    const totalAmount = totalPrice;
    const optimisticReceipt = { id: localTxnId, date: new Date().toLocaleString(), method, amount: totalAmount, items: cart };
    setReceipt(optimisticReceipt);
    const { itemsJson } = buildItemsPayload(cart);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const body = {
        table_number: storedTable,
        order_name: `CMD-${localTxnId}`,
        total_amount: totalAmount.toFixed(2),
        payment_method: method,
        status: 'Payée',
        items: itemsJson,
      };
      const response = await fetch('http://192.168.137.118:3000/commande', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(body),
      });

      clearTimeout(timeout);
      const text = await response.text();
      let result;
      try { result = text ? JSON.parse(text) : {}; } catch (e) { result = { message: text }; }

      if (!response.ok) {
        const serverMsg = result?.error || result?.message || `Erreur serveur (${response.status})`;
        Alert.alert("Erreur commande", serverMsg);
        setNotifications(prev => [{ id: Date.now(), message: `Erreur commande: ${serverMsg}`, date: new Date().toLocaleString() }, ...prev]);
      } else {
        const backendId = (result && (result.commande_id || result.id || result.commande?.id)) || null;
        setReceipt({ ...optimisticReceipt, id: backendId || optimisticReceipt.id });
        setNotifications(prev => [{ id: Date.now(), message: `Commande enregistrée (ID: ${backendId || 'local'})`, date: new Date().toLocaleString() }, ...prev]);
        Alert.alert("Succès", `Commande envoyée pour ${totalAmount.toFixed(2)} Ar !`);
        setCart([]);
      }
    } catch (err) {
      if (err.name === 'AbortError') Alert.alert("Erreur réseau", "La requête a expiré.");
      else Alert.alert("Erreur", "Une erreur est survenue lors de l'envoi de la commande.");
      setNotifications(prev => [{ id: Date.now(), message: "Échec envoi commande", date: new Date().toLocaleString() }, ...prev]);
    } finally { setProcessingPayment(false); }
  };

  const shareReceipt = async () => {
    if (!receipt) return;
    const text = `🧾 Reçu: ${receipt.id}\nDate: ${receipt.date}\nMéthode: ${receipt.method}\nMontant: ${receipt.amount.toFixed(2)} Ar\n\nArticles:\n` +
      receipt.items.map(c => `- ${getItemName(c.item)} x${c.qty} (${(getItemPrice(c.item) * c.qty).toFixed(2)} Ar)`).join("\n");
    try { await Share.share({ message: text }); } catch (err) { console.error("Erreur de partage :", err); }
  };

  // Filtrage combiné catégorie + nom
  const filteredMenu = menu.filter(item => {
    const matchCategory = selectedCategory === 'Tout' || getItemCategory(item) === selectedCategory;
    const matchName = getItemName(item).toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchName;
  });

  // Composant d'une carte de menu (pour FlatList) - ADAPTÉ À LA GRILLE
  const renderMenuItem = ({ item: e }) => (
    <View key={e.id} style={styles.cardGrid}>
      {e.image ? (
        <Image source={{ uri: e.image }} style={styles.imageGrid} />
      ) : (
        <View style={styles.imageFallbackGrid}>
          <Text style={{ color: CARD_COLOR, fontWeight: 'bold', textAlign: 'center' }}>[Image manquante]</Text>
        </View>
      )}
      <View style={styles.textBoxGrid}>
        <Text style={styles.nameGrid} numberOfLines={1}>{getItemName(e)}</Text>
        <Text style={styles.descGrid} numberOfLines={2}>{e.description}</Text>
        {storedTable && <Text style={styles.tableNumberGrid}>Table: {storedTable}</Text>}
        <View style={styles.priceOrderContainerGrid1}>
          <Text style={styles.priceGrid}>{getItemPrice(e).toFixed(2)} Ar</Text>
        </View>
        <View style={styles.priceOrderContainerGrid}>
          <TouchableOpacity style={styles.orderBtnGrid} onPress={() => addToCart(e)}>
            <FontAwesome name="cart-plus" size={16} color={CARD_COLOR} />
            <Text style={styles.orderBtnText}>Ajouter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Modals
  const RenderNotificationModal = () => (
    <Modal visible={showNotif} transparent animationType="slide" onRequestClose={() => setShowNotif(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>
            <Ionicons name="notifications" size={24} color={PRIMARY_COLOR} /> Notifications
          </Text>
          <ScrollView style={styles.modalScrollView}>
            {notifications.length === 0 ? (
              <Text style={{ textAlign: 'center', color: 'gray', padding: 10 }}>Aucune notification</Text>
            ) : (
              notifications.slice().reverse().map((n) => (
                <View key={n.id} style={styles.notifItem}>
                  <Text style={{ fontWeight: '600', color: '#333' }}>{n.message}</Text>
                  <Text style={{ fontSize: 12, color: 'gray' }}>{n.date}</Text>
                </View>
              ))
            )}
          </ScrollView>
          <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: PRIMARY_COLOR }]} onPress={() => setNotifications([])}>
            <Text style={styles.modalActionText}>
              <Ionicons name="trash-bin" size={16} color="white" /> Vider les notifications
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowNotif(false)}>
            <Text style={styles.modalCloseText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  const RenderCartModal = () => (
    <Modal visible={showCart} transparent animationType="slide" onRequestClose={() => setShowCart(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>
            <Ionicons name="cart" size={24} color={PRIMARY_COLOR} /> Liste des commandes
          </Text>
          <ScrollView style={styles.modalScrollView}>
            {cart.length === 0 ? (
              <Text style={{ textAlign: 'center', color: 'gray', padding: 10 }}>Panier vide</Text>
            ) : (
              cart.map((c) => (
                <View key={c.item.id} style={styles.cartItem}>
                  <Text style={{ flex: 1, fontWeight: '600' }}>{getItemName(c.item)}</Text>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity onPress={() => updateCartItemQuantity(c.item.id, -1)}>
                      <Ionicons name="remove-circle-outline" size={24} color="red" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{c.qty}</Text>
                    <TouchableOpacity onPress={() => updateCartItemQuantity(c.item.id, 1)}>
                      <Ionicons name="add-circle-outline" size={24} color={PRIMARY_COLOR} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cartPrice}>{(getItemPrice(c.item) * c.qty).toFixed(2)} Ar</Text>
                </View>
              ))
            )}
          </ScrollView>

          <Text style={styles.totalText}>Total : {totalPrice.toFixed(2)} Ar</Text>

          <TouchableOpacity
            style={[styles.payBtn, processingPayment || cart.length === 0 ? styles.payBtnDisabled : null]}
            disabled={cart.length === 0 || processingPayment}
            onPress={() => Alert.alert(
              "Choisir le paiement", 
              "Sélectionnez une méthode de paiement pour finaliser la commande.",
              [
                { text: "Mobile Money", onPress: () => handlePayment("Mobile Money") },
                { text: "Carte bancaire", onPress: () => handlePayment("Carte bancaire") },
                { text: "Annuler", style: "cancel" }
              ]
            )}
          >
            <Text style={styles.payText}>
              {processingPayment ? "⏳ Traitement en cours..." : "✅ Commander"}
            </Text>
          </TouchableOpacity>

          {receipt && (
            <View style={styles.receiptBox}>
              <Text style={styles.receiptTitle}>🧾 Dernier Reçu (ID: {receipt.id})</Text>
              <Text>Montant: {receipt.amount.toFixed(2)} Ar</Text>
              <Text>Méthode: {receipt.method}</Text>
              <TouchableOpacity style={styles.shareButton} onPress={shareReceipt}>
                <Text style={styles.shareButtonText}>
                  <Ionicons name="share" size={16} color="white" /> Partager le reçu
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowCart(false)}>
            <Text style={styles.modalCloseText}>Fermer le panier</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerText} numberOfLines={1}>Menu du jour</Text>
        <View style={styles.topRight}>
          <TouchableOpacity style={styles.topIcon} onPress={() => setShowNotif(true)}>
            <FontAwesome name="bell" size={22} color={CARD_COLOR} />
            {notifications.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{Math.min(notifications.length, 9)}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.topIcon} onPress={() => navigation.navigate('Historique')}>
            <FontAwesome name="history" size={22} color={CARD_COLOR} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topIcon} onPress={() => setShowCart(true)}>
            <FontAwesome name="shopping-cart" size={22} color={CARD_COLOR} />
            {cart.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cart.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {/* CATEGORIES */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10 }}>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat}
                style={[styles.categoryButton, selectedCategory === cat && styles.categorySelected]}
                onPress={() => setSelectedCategory(cat)} 
              >
                <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextSelected]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* FILTRE PAR NOM */}
        <View style={{ paddingHorizontal: 15, marginVertical: 10 }}>
          <TextInput
            placeholder="Rechercher par nom..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput} 
          />
        </View>

        {/* LISTE VERTICALE OPTIMISÉE (FlatList) */}
        {loading ? (
          <ActivityIndicator size="large" color={PRIMARY_COLOR} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={filteredMenu}
            renderItem={renderMenuItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            // MODIFICATION CLÉ : Affiche deux colonnes
            numColumns={2} 
            ListEmptyComponent={() => (
              <View style={styles.emptyListMessage}>
                <Ionicons name="sad-outline" size={40} color="gray" />
                <Text style={{ fontSize: 18, color: 'gray', marginTop: 10 }}>Aucun plat trouvé.</Text>
              </View>
            )}
          />
        )}
      </View>

      <RenderNotificationModal />
      <RenderCartModal />

      {/* FOOTER (Barre inférieure) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate("accueil")}>
          <FontAwesome name="home" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.bottomText}>Accueil</Text>
        </TouchableOpacity>
      
        <TouchableOpacity style={[styles.bottomBtn, styles.activeBtn]} onPress={() => navigation.navigate("menuList")}>
          <View style={styles.activeIndicator}>
            <FontAwesome name="list" size={24} color="#fff" />
          </View>
          <Text style={[styles.bottomText, styles.activeText]}>Menus</Text>
        </TouchableOpacity>
      
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate("Publications")}>
          <FontAwesome name="bullhorn" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.bottomText}>Publi.</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ====== STYLES MIS À JOUR ======
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: PRIMARY_COLOR, padding: 15, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50 },
  headerText: { fontSize: 22, fontWeight: 'bold', color: CARD_COLOR, flex: 1 },
  topRight: { flexDirection: 'row', alignItems: 'center' },
  topIcon: { marginLeft: 15 },
  badge: { position: 'absolute', top: -5, right: -10, backgroundColor: 'red', borderRadius: 8, paddingHorizontal: 5 },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  categoryContainer: { height: 50, marginTop: 5 },
  categoryButton: { marginRight: 10, borderRadius: 20, borderWidth: 1, borderColor: PRIMARY_COLOR, paddingHorizontal: 15, paddingVertical: 8 },
  categorySelected: { backgroundColor: PRIMARY_COLOR },
  categoryText: { color: PRIMARY_COLOR, fontWeight: '500' },
  categoryTextSelected: { color: CARD_COLOR },
  
  searchInput: {
    backgroundColor: CARD_COLOR,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16
  },

  // Styles pour la FlatList en GRILLE (2 colonnes)
  listContainer: { paddingHorizontal: 10, paddingBottom: 80, paddingTop: 5 }, 
  
  cardGrid: {
    // MODIFICATION CLÉ : Définit la largeur à ~50% (screenWidth/2 - 10 pour le padding horizontal global)
    width: screenWidth / 2 - 15, 
    marginHorizontal: 5, // Marge entre les colonnes
    marginBottom: 15, // Marge entre les lignes
    
    backgroundColor: CARD_COLOR,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageGrid: { 
    width: '100%', 
    height: 120, 
    borderTopLeftRadius: 15, 
    borderTopRightRadius: 15 
  }, 
  imageFallbackGrid: { 
    width: '100%', 
    height: 120, 
    backgroundColor: ACCENT_COLOR, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderTopLeftRadius: 15, 
    borderTopRightRadius: 15 
  },
  textBoxGrid: { flex: 1, padding: 8, justifyContent: 'space-between' },
  nameGrid: { fontSize: 14, fontWeight: 'bold', color: '#333' ,marginLeft:25},
  descGrid: { fontSize: 10, color: '#666', marginVertical: 2, height: 30 ,marginLeft:45},
  tableNumberGrid: { fontSize: 9, color: 'gray',marginLeft:45 },
  priceOrderContainerGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  priceOrderContainerGrid1: {  justifyContent: 'center', textAlign: 'center', marginTop: 5 ,marginLeft: 25},
  priceGrid: { fontSize: 14, fontWeight: '700', color: PRIMARY_COLOR , alignItems: 'center'},
  orderBtnGrid: { 
    backgroundColor: ACCENT_COLOR, 
    paddingHorizontal: 10,
    paddingVertical: 5, 
    borderRadius: 8,
    width: '100%', 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: "center",
  },
  orderBtnText: {
    color: CARD_COLOR,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5
  },
  emptyListMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 },

  // Styles Modal (inchangés)
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBox: { backgroundColor: CARD_COLOR, margin: 20, borderRadius: 15, padding: 15, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalScrollView: { marginBottom: 10 },
  notifItem: { borderBottomWidth: 0.5, borderBottomColor: '#ccc', paddingVertical: 8 },
  modalActionBtn: { padding: 10, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  modalActionText: { color: 'white', fontWeight: 'bold' },
  modalCloseBtn: { padding: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#ccc' },
  modalCloseText: { fontWeight: 'bold' },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderColor: '#ccc' },
  quantityControl: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 },
  quantityText: { marginHorizontal: 5, fontWeight: '600' },
  cartPrice: { fontWeight: '600' },
  totalText: { fontSize: 16, fontWeight: 'bold', textAlign: 'right', marginVertical: 10 },
  payBtn: { backgroundColor: PRIMARY_COLOR, padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  payBtnDisabled: { backgroundColor: '#999' },
  payText: { color: CARD_COLOR, fontWeight: 'bold' },
  receiptBox: { padding: 10, backgroundColor: '#f9f9f9', borderRadius: 10, marginVertical: 10 },
  receiptTitle: { fontWeight: 'bold', marginBottom: 5 },
  shareButton: { marginTop: 5, backgroundColor: ACCENT_COLOR, padding: 8, borderRadius: 8, alignItems: 'center' },
  shareButtonText: { color: CARD_COLOR, fontWeight: '600' },
  
  // Styles de la barre inférieure (inchangés)
  bottomBar: { height: 70, flexDirection: "row", backgroundColor: CARD_COLOR, justifyContent: "space-around", alignItems: "center", paddingBottom: Platform.OS === "ios" ? 20 : 0, position: "absolute", bottom: 0, left: 0, right: 0, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  bottomBtn: { justifyContent: "center", alignItems: "center", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  activeIndicator: { width: 50, height: 50, borderRadius: 25, backgroundColor: PRIMARY_COLOR, justifyContent: 'center', alignItems: 'center', shadowColor: PRIMARY_COLOR, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
  bottomText: { fontSize: 11, color: PRIMARY_COLOR, marginTop: 4, fontWeight: "600" },
  activeText: { color: PRIMARY_COLOR, fontWeight: "700" },
});