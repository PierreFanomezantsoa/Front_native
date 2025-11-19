import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Image,
  TouchableOpacity, Modal, Dimensions, Alert, Share, Platform, StatusBar
} from 'react-native';
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
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  const scrollRef = useRef();
  const currentIndex = useRef(0);
  const { tableNumber } = route.params || {};

  // --- Charger le menu depuis backend ---
  const loadMenu = async () => {
    try {
      const res = await fetch("http://192.168.137.1:8000/menu");
      const data = await res.json();
      const loadedMenu = data.menu || [];
      setMenu(loadedMenu);
      const uniqueCategories = ['Tout', ...new Set(loadedMenu.map(getItemCategory))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error("Erreur lors du chargement du menu :", err);
      Alert.alert("Erreur réseau", "Impossible de charger le menu.");
      setNotifications(prev => [{ id: Date.now(), message: "Erreur chargement menu", date: new Date().toLocaleString() }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMenu(); }, []);

  // --- Ajouter au panier ---
  const addToCart = (item) => {
    setCart(prevCart => {
      const existing = prevCart.find(c => c.item.id === item.id);
      if (existing) {
        return prevCart.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      } else {
        return [...prevCart, { item, qty: 1 }];
      }
    });
    // Limiter les notifications pour ne pas surcharger l'UI
    if (notifications.length < 5) {
      setNotifications(prev => [
        { id: Date.now(), message: `Ajouté : ${getItemName(item)}`, date: new Date().toLocaleString() },
        ...prev,
      ]);
    }
  };

  const updateCartItemQuantity = (itemId, change) => {
    setCart(prevCart => {
      const newCart = prevCart.map(c => 
        c.item.id === itemId ? { ...c, qty: c.qty + change } : c
      ).filter(c => c.qty > 0);
      return newCart;
    });
  };

  const totalPrice = cart.reduce((sum, c) => sum + getItemPrice(c.item) * c.qty, 0);

  // --- Fonction utilitaire pour formater items ---
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

  // --- Paiement et POST commande ---
  const handlePayment = async (method) => {
    if (cart.length === 0) {
      return Alert.alert("Panier vide !", "Veuillez ajouter des articles avant de payer.");
    }

    setProcessingPayment(true);

    const localTxnId = "TXN" + Math.floor(Math.random() * 1000000);
    const totalAmount = totalPrice;
    
    // Construire reçu local (optimiste)
    const optimisticReceipt = { id: localTxnId, date: new Date().toLocaleString(), method, amount: totalAmount, items: cart };
    setReceipt(optimisticReceipt);

    // Préparer payload
    const { itemsJson } = buildItemsPayload(cart);

    // Timeout avec AbortController
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s

    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler traitement local

      const body = {
        table_number: tableNumber || 0,
        order_name: `CMD-${localTxnId}`, // Nom de la commande
        total_amount: totalAmount.toFixed(2), // Assurer le format monétaire
        payment_method: method,
        status: 'Payée',
        items: itemsJson, // items stockés en JSON string
      };

      const response = await fetch('http://192.168.137.1:8000/commande', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(body),
      });

      clearTimeout(timeout);

      const text = await response.text();
      let result;
      try {
        result = text ? JSON.parse(text) : {};
      } catch (e) { result = { message: text }; }

      if (!response.ok) {
        console.error('Erreur backend:', response.status, result);
        const serverMsg = result?.error || result?.message || `Erreur serveur (${response.status})`;
        Alert.alert("Erreur commande", serverMsg);
        setNotifications(prev => [{ id: Date.now(), message: `Erreur commande: ${serverMsg}`, date: new Date().toLocaleString() }, ...prev]);
      } else {
        const backendId = (result && (result.commande_id || result.id || result.commande?.id)) || null;
        setReceipt({ ...optimisticReceipt, id: backendId || optimisticReceipt.id });

        setNotifications(prev => [{ id: Date.now(), message: `Commande enregistrée (ID: ${backendId || 'local'})`, date: new Date().toLocaleString() }, ...prev]);

        Alert.alert("Succès", `Commande envoyée pour ${totalAmount.toFixed(2)} Ar !`);
        setCart([]); // Vider le panier
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        Alert.alert("Erreur réseau", "La requête a expiré.");
      } else {
        Alert.alert("Erreur", "Une erreur est survenue lors de l'envoi de la commande.");
      }
      setNotifications(prev => [{ id: Date.now(), message: "Échec envoi commande", date: new Date().toLocaleString() }, ...prev]);
    } finally {
      setProcessingPayment(false);
    }
  };

  // --- Partager reçu ---
  const shareReceipt = async () => {
    if (!receipt) return;
    const text =
      `🧾 Reçu: ${receipt.id}\nDate: ${receipt.date}\nMéthode: ${receipt.method}\nMontant: ${receipt.amount.toFixed(2)} Ar\n\nArticles:\n` +
      receipt.items.map(c => `- ${getItemName(c.item)} x${c.qty} (${(getItemPrice(c.item) * c.qty).toFixed(2)} Ar)`).join("\n");

    try {
      await Share.share({ message: text });
    } catch (err) { console.error("Erreur de partage :", err); }
  };

  const filteredMenu = menu.filter(item => selectedCategory === 'Tout' || getItemCategory(item) === selectedCategory);

  // Carrousel auto-scroll
  useEffect(() => {
    if (filteredMenu.length <= 1) return;
    const interval = setInterval(() => {
      currentIndex.current = (currentIndex.current + 1) % filteredMenu.length;
      scrollRef.current?.scrollTo({ x: currentIndex.current * (screenWidth - 40), animated: true });
    }, 10000);
    return () => clearInterval(interval);
  }, [filteredMenu, selectedCategory]);

  // --- Modals ---
  const RenderNotificationModal = () => (
    <Modal visible={showNotif} transparent animationType="slide" onRequestClose={() => setShowNotif(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}><Ionicons name="notifications" size={24} color={PRIMARY_COLOR} /> Notifications</Text>
          <ScrollView style={styles.modalScrollView}>
            {notifications.length === 0 ? (
              <Text style={{ textAlign: 'center', color: 'gray', padding: 10 }}>Aucune notification</Text>
            ) : (
              notifications.map((n) => (
                <View key={n.id} style={styles.notifItem}>
                  <Text style={{ fontWeight: '600', color: '#333' }}>{n.message}</Text>
                  <Text style={{ fontSize: 12, color: 'gray' }}>{n.date}</Text>
                </View>
              )).reverse()
            )}
          </ScrollView>
          <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: PRIMARY_COLOR }]} onPress={() => setNotifications([])}>
            <Text style={styles.modalActionText}><Ionicons name="trash-bin" size={16} color="white" /> Vider les notifications</Text>
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
          <Text style={styles.modalTitle}><Ionicons name="cart" size={24} color={PRIMARY_COLOR} /> Votre Panier</Text>
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
                  <Text style={styles.cartPrice}>{ (getItemPrice(c.item) * c.qty).toFixed(2) } Ar</Text>
                </View>
              ))
            )}
          </ScrollView>

          <Text style={styles.totalText}>Total à payer :  {totalPrice.toFixed(2)} Ar </Text>

          <TouchableOpacity
            style={[styles.payBtn, processingPayment || cart.length === 0 ? styles.payBtnDisabled : null]}
            disabled={cart.length === 0 || processingPayment}
            onPress={() => Alert.alert(
              "Choisir le paiement", "Sélectionnez une méthode de paiement pour finaliser la commande.",
              [
                { text: "Mobile Money", onPress: () => handlePayment("Mobile Money") },
                { text: "Carte bancaire", onPress: () => handlePayment("Carte bancaire") },
                { text: "Annuler", style: "cancel" }
              ]
            )}
          >
            <Text style={styles.payText}>
              {processingPayment ? "⏳ Traitement en cours..." : "✅ Payer et commander"}
            </Text>
          </TouchableOpacity>

          {receipt && (
            <View style={styles.receiptBox}>
              <Text style={styles.receiptTitle}>🧾 Dernier Reçu (ID: {receipt.id})</Text>
              <Text>Montant:  {receipt.amount.toFixed(2)} Ar  </Text>
              <Text> Méthode:  {receipt.method}  </Text>
              <TouchableOpacity style={styles.shareButton} onPress={shareReceipt}>
                <Text style={styles.shareButtonText}><Ionicons name="share" size={16} color="white" /> Partager le reçu</Text>
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

  // --- Rendu principal ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerText} numberOfLines={1}> Menu du jour</Text>
        <View style={styles.topRight}>
          {/* Notifications */}
          <TouchableOpacity style={styles.topIcon} onPress={() => setShowNotif(true)}>
            <FontAwesome name="bell" size={22} color={CARD_COLOR} />
            {notifications.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{Math.min(notifications.length, 9)}</Text></View>}
          </TouchableOpacity>
          {/* Historique */}
          <TouchableOpacity style={styles.topIcon} onPress={() => navigation.navigate('Historique')}>
            <FontAwesome name="history" size={22} color={CARD_COLOR} />
          </TouchableOpacity>
          {/* Panier */}
          <TouchableOpacity style={styles.topIcon} onPress={() => setShowCart(true)}>
            <FontAwesome name="shopping-cart" size={22} color={CARD_COLOR} />
            {cart.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{cart.length}</Text></View>}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Contenu principal (Scrollable pour les catégories et le carrousel) */}
      <View style={{ flex: 1 }}>
        {/* CATEGORIES */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10 }}>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat}
                style={[styles.categoryButton, selectedCategory === cat && styles.categorySelected]}
                onPress={() => {
                  setSelectedCategory(cat);
                  currentIndex.current = 0;
                  scrollRef.current?.scrollTo({ x: 0, animated: true });
                }}
              >
                <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextSelected]}>
                  {cat} 
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* CARROUSEL */}
        {loading ? (
          <ActivityIndicator size="large" color={PRIMARY_COLOR} style={{ marginTop: 50 }} />
        ) : (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            ref={scrollRef}
            contentContainerStyle={styles.carouselContent}
            style={styles.carousel}
          >
            {filteredMenu.length === 0 ? (
              <View style={styles.emptyListMessage}>
                <Ionicons name="sad-outline" size={40} color="gray" />
                <Text style={{ fontSize: 18, color: 'gray', marginTop: 10 }}>Aucun plat dans cette catégorie.</Text>
              </View>
            ) : (
              filteredMenu.map(e => (
                <View key={e.id} style={[styles.cardList, { width: screenWidth - 60 }]}>
                  {e.image ? (
                    <Image source={{ uri: e.image }} style={styles.imageList} />
                  ) : (
                    <View style={styles.imageFallbackList}><Text style={{ color: CARD_COLOR, fontWeight: 'bold' }}>[Image manquante]</Text></View>
                  )}
                  <View style={styles.textBox}>
                    <Text style={styles.nameList} numberOfLines={1}>{getItemName(e)}</Text>
                    <Text style={styles.descList} numberOfLines={2}>{e.description}</Text>
                    {tableNumber && <Text style={styles.tableNumber}>Table:  {tableNumber} </Text>}
                    <Text style={styles.priceList}>{getItemPrice(e).toFixed(2)} Ar</Text>
                  </View>
                  <TouchableOpacity style={styles.orderBtnList} onPress={() => addToCart(e)}>
                    <FontAwesome name="cart-plus" color="white" size={18} />
                    <Text style={styles.orderTextList}> Ajouter</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

      <RenderNotificationModal />
      <RenderCartModal />

      {/* BARRE BAS FIXE */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate("accueil")}>
          <FontAwesome name="home" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.bottomText}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn}>
          <FontAwesome name="list" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.bottomText}>Menus</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('Publications')}>
          <FontAwesome name="bullhorn" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.bottomText}>Publi.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('admin')}>
          <FontAwesome name="cog" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.bottomText}>Admin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },

  // --- Header ---
  header: { 
    width: '100%', 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 45, 
    height: Platform.OS === 'android' ? 90 + StatusBar.currentHeight : 100, 
    backgroundColor: PRIMARY_COLOR, 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    elevation: 5,
  },
  headerText: { color: CARD_COLOR, fontSize: 24, flex: 1, fontWeight: 'bold' },
  topRight: { flexDirection: 'row', alignItems: 'center' },
  topIcon: { marginHorizontal: 10, position: 'relative', padding: 5 },
  badge: { position: 'absolute', right: -3, top: -3, backgroundColor: 'red', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: CARD_COLOR, fontSize: 11, fontWeight: 'bold' },

  // --- Catégories ---
  categoryContainer: { height: 55, paddingVertical: 8, backgroundColor: CARD_COLOR, borderBottomWidth: 1, borderColor: '#eee' },
  categoryButton: { paddingHorizontal: 18, paddingVertical: 8, marginHorizontal: 5, borderRadius: 25, backgroundColor: '#e0e0e0' },
  categorySelected: { backgroundColor: PRIMARY_COLOR, borderWidth: 1, borderColor: PRIMARY_COLOR },
  categoryText: { color: '#333', fontWeight: '600' },
  categoryTextSelected: { color: CARD_COLOR, fontWeight: 'bold' },

  // --- Carrousel et Cartes ---
  carousel: { paddingVertical: 15 },
  carouselContent: { alignItems: 'center', paddingHorizontal: 30 },
  emptyListMessage: { width: screenWidth, alignItems: 'center', justifyContent: 'center', height: 300 },
  
  cardList: { 
    marginHorizontal: 10, 
    backgroundColor: CARD_COLOR, 
    paddingBottom: 15, 
    alignItems: 'center', 
    borderRadius: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  imageList: { width: '100%', height: 220, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  imageFallbackList: { borderTopLeftRadius: 20, borderTopRightRadius: 20, width: '100%', height: 220, backgroundColor: '#555', justifyContent: 'center', alignItems: 'center' },
  
  textBox: { padding: 15, alignItems: 'center', width: '100%' },
  nameList: { fontSize: 24, fontWeight: '800', color: PRIMARY_COLOR, marginBottom: 5 },
  descList: { color: '#666', marginVertical: 5, fontSize: 14, textAlign: 'center', height: 40 },
  tableNumber: { color: PRIMARY_COLOR, fontSize: 14, fontStyle: 'italic', marginVertical: 5 },
  priceList: { fontSize: 22, fontWeight: 'bold', color: ACCENT_COLOR, marginTop: 10 },
  
  orderBtnList: { height: 48, backgroundColor: PRIMARY_COLOR, flexDirection: 'row', justifyContent: 'center', width: '85%', alignItems: 'center', borderRadius: 12, marginTop: 10 },
  orderTextList: { color: CARD_COLOR, fontSize: 18, fontWeight: 'bold', marginLeft: 10 },

  // --- Bottom Bar FIXE ---
  bottomBar: { 
    height: 65, 
    flexDirection: 'row', 
    backgroundColor: CARD_COLOR, 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    borderTopWidth: 0, 
    paddingBottom: Platform.OS === 'ios' ? 10 : 0, // Padding pour iPhone avec encoche
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  bottomBtn: { justifyContent: 'center', alignItems: 'center', padding: 5 },
  bottomText: { fontSize: 12, color: PRIMARY_COLOR, marginTop: 3, fontWeight: '600' },

  // --- Modals ---
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBox: { width: '100%', backgroundColor: CARD_COLOR, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 10, color: PRIMARY_COLOR },
  modalScrollView: { maxHeight: 280, marginBottom: 15 },
  
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderColor: '#ccc' },
  quantityControl: { flexDirection: 'row', alignItems: 'center', width: 90, justifyContent: 'space-between' },
  quantityText: { fontWeight: 'bold', marginHorizontal: 5, fontSize: 16 },
  cartPrice: { color: ACCENT_COLOR, fontWeight: 'bold', fontSize: 16 },
  
  totalText: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginBottom: 15, paddingHorizontal: 5 },
  
  payBtn: { backgroundColor: PRIMARY_COLOR, padding: 15, borderRadius: 10, alignItems: 'center', marginVertical: 5 },
  payBtnDisabled: { backgroundColor: 'gray', opacity: 0.8 },
  payText: { color: CARD_COLOR, fontWeight: 'bold', fontSize: 17 },
  
  modalCloseBtn: { backgroundColor: '#A9A9A9', padding: 12, borderRadius: 10, alignItems: 'center', marginVertical: 5 },
  modalCloseText: { color: CARD_COLOR, fontWeight: 'bold' },
  
  modalActionBtn: { padding: 12, borderRadius: 10, alignItems: 'center', marginVertical: 5 },
  modalActionText: { color: CARD_COLOR, fontWeight: 'bold' },

  receiptBox: { borderWidth: 1, borderColor: ACCENT_COLOR, padding: 12, marginVertical: 15, borderRadius: 10, backgroundColor: '#f9fff9' },
  receiptTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 5, color: PRIMARY_COLOR },
  shareButton: { backgroundColor: PRIMARY_COLOR, padding: 8, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  shareButtonText: { color: CARD_COLOR, fontWeight: 'bold', fontSize: 14 },
  
  notifItem: { marginVertical: 5, borderBottomWidth: 0.3, borderColor: '#ccc', paddingBottom: 8 },
});