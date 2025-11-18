import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Image,
  TouchableOpacity, Modal, Dimensions, Alert, Share
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

// Constantes pour éviter la duplication de la taille d'écran dans le composant
const { width: screenWidth } = Dimensions.get("window");

// Fonctions utilitaires
const getItemPrice = (item) => item.price || item.prix || 0;
const getItemName = (item) => item.name || item.nom || 'Article inconnu';
// NOTE: Assurez-vous que vos données de menu contiennent un champ 'category' ou 'categorie'
const getItemCategory = (item) => item.category || item.categorie || 'Autres';

export default function KiosqueMenu({ navigation }) {
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState(['Tout']); // Ajout des catégories
  const [selectedCategory, setSelectedCategory] = useState('Tout'); // Catégorie sélectionnée
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]); // {item, qty}
  const [showCart, setShowCart] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  const scrollRef = useRef();
  const currentIndex = useRef(0);

  // --- LOGIQUE ASYNCHRONE ---
  const loadMenu = async () => {
    try {
      const res = await fetch("http://192.168.137.118:8000/menu");
      const data = await res.json();
      const loadedMenu = data.menu || [];
      setMenu(loadedMenu);
      
      // 2. Extraire les catégories uniques
      const uniqueCategories = ['Tout', ...new Set(loadedMenu.map(getItemCategory))];
      setCategories(uniqueCategories);
      
    } catch (err) {
      console.error("Erreur lors du chargement du menu :", err);
    }
    setLoading(false);
  };

  // ... (handlePayment, shareReceipt restent inchangés) ...
  const handlePayment = async (method) => {
    if (cart.length === 0) return Alert.alert("Panier vide !", "Veuillez ajouter des articles avant de payer.");
    setProcessingPayment(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const txnId = "TXN" + Math.floor(Math.random() * 1000000);
      const newReceipt = {
        id: txnId, date: new Date().toLocaleString(), method, amount: totalPrice, items: cart,
      };

      setReceipt(newReceipt);
      setNotifications(prev => [
        { id: Date.now(), message: `Paiement confirmé (${method}) - ${totalPrice} Ar`, date: new Date().toLocaleString() },
        ...prev,
      ]);

      setCart([]);
      Alert.alert("Succès", `Paiement réussi pour ${totalPrice} Ar !`);

    } catch (err) {
      console.error("Erreur de paiement simulé :", err);
      Alert.alert("Erreur", "Une erreur est survenue lors du paiement.");
    } finally {
      setProcessingPayment(false);
    }
  };
  
  const shareReceipt = async () => {
    if (!receipt) return;
    const text =
      `🧾 Reçu: ${receipt.id}\nDate: ${receipt.date}\nMéthode: ${receipt.method}\nMontant: ${receipt.amount} Ar\n\nArticles:\n` +
      receipt.items.map(c => `- ${getItemName(c.item)} x${c.qty} (${getItemPrice(c.item) * c.qty} Ar)`).join("\n");

    try {
      await Share.share({ message: text });
    } catch (err) {
      console.error("Erreur de partage :", err);
    }
  };

  // --- LOGIQUE DU COMPOSANT ---
  useEffect(() => { loadMenu(); }, []);

  // 4. Filtrer le menu pour l'affichage
  const filteredMenu = menu.filter(item => 
    selectedCategory === 'Tout' || getItemCategory(item) === selectedCategory
  );
  
  // Carrousel auto-scroll (mis à jour pour utiliser filteredMenu)
  useEffect(() => {
    if (filteredMenu.length <= 1) return; 
    const interval = setInterval(() => {
      currentIndex.current = (currentIndex.current + 1) % filteredMenu.length;
      scrollRef.current?.scrollTo({
        x: currentIndex.current * (screenWidth - 40), 
        animated: true
      });
    }, 10000); 
    return () => clearInterval(interval);
  }, [filteredMenu, selectedCategory]); // Dépend de la catégorie sélectionnée

  const addToCart = (item) => {
    setCart(prevCart => {
      const existing = prevCart.find(c => c.item.id === item.id);
      if (existing) {
        return prevCart.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      } else {
        return [...prevCart, { item, qty: 1 }];
      }
    });

    setNotifications(prev => [
      { id: Date.now(), message: `Ajouté : ${getItemName(item)}`, date: new Date().toLocaleString() },
      ...prev,
    ]);
  };

  const totalPrice = cart.reduce((sum, c) => sum + getItemPrice(c.item) * c.qty, 0);


  
  // Fonctions de rendu des modals (pour ne pas surcharger le code principal)
  const RenderNotificationModal = () => (
    <Modal visible={showNotif} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>🔔 Notifications</Text>
          <ScrollView style={{ maxHeight: 260 }}>
            {notifications.length === 0 ? (
              <Text style={{ textAlign: 'center', color: 'gray' }}>Aucune notification</Text>
            ) : (
              notifications.map((n) => (
                <View key={n.id} style={styles.notifItem}>
                  <Text style={{ fontWeight: 'bold' }}>{n.message}</Text>
                  <Text style={{ fontSize: 12, color: 'gray' }}>{n.date}</Text>
                </View>
              )).reverse()
            )}
          </ScrollView>
          <TouchableOpacity style={[styles.payBtn, { backgroundColor: 'teal' }]} onPress={() => setNotifications([])}>
            <Text style={{ color: 'white' }}>🗑 Vider les notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setShowNotif(false)}>
            <Text style={{ color: 'white' }}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const RenderCartModal = () => (
    <Modal visible={showCart} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>🛒 Votre Panier</Text>
          <ScrollView style={{ maxHeight: 230, marginBottom: 10 }}>
            {cart.length === 0 ? (
              <Text style={{ textAlign: 'center', color: 'gray' }}>Panier vide</Text>
            ) : (
              cart.map((c, idx) => (
                <View key={idx} style={styles.cartItem}>
                  <Text>{getItemName(c.item)} x{c.qty}</Text>
                  <Text style={{ color: 'green', fontWeight: 'bold' }}>{getItemPrice(c.item) * c.qty} Ar</Text>
                </View>
              ))
            )}
          </ScrollView>

          <Text style={styles.totalText}>Total : {totalPrice} Ar</Text>

          <TouchableOpacity
            style={styles.payBtn}
            disabled={cart.length === 0 || processingPayment}
            onPress={() => Alert.alert(
              "Choisir le paiement", "Sélectionnez une méthode",
              [
                { text: "Mobile Money", onPress: () => handlePayment("Mobile Money") },
                { text: "Carte bancaire", onPress: () => handlePayment("Carte bancaire") },
                { text: "Annuler", style: "cancel" }
              ]
            )}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>
              {processingPayment ? "⏳ Traitement..." : "✅ Payer"}
            </Text>
          </TouchableOpacity>

          {receipt && (
            <View style={styles.receiptBox}>
              <Text style={styles.receiptTitle}>Reçu de paiement (Dernière transaction)</Text>
              <Text>ID : **{receipt.id}**</Text>
              <Text>Date : {receipt.date}</Text>
              <Text>Méthode : **{receipt.method}**</Text>
              <Text style={{ fontWeight: 'bold', marginVertical: 5 }}>Montant : {receipt.amount} Ar</Text>
              <TouchableOpacity style={styles.shareButton} onPress={shareReceipt}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>📤 Partager le reçu</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCart(false)}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );


  // --- RENDU PRINCIPAL ---
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerText}> Menu du jour</Text>
        <View style={styles.topRight}>
          <TouchableOpacity style={styles.topIcon} onPress={() => setShowNotif(true)}>
            <FontAwesome name="bell" size={22} color="white" />
            {notifications.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{notifications.length}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.topIcon} onPress={() => navigation.navigate('Historique')}>
            <FontAwesome name="history" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topIcon} onPress={() => setShowCart(true)}>
            <FontAwesome name="shopping-cart" size={22} color="white" />
            {cart.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{cart.length}</Text></View>}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* 3. CATEGORIES */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat}
              style={[
                styles.categoryButton, 
                selectedCategory === cat && styles.categorySelected // Style si sélectionné
              ]}
              onPress={() => {
                setSelectedCategory(cat);
                currentIndex.current = 0; // Réinitialiser le carrousel
                scrollRef.current?.scrollTo({ x: 0, animated: true });
              }}
            >
              <Text style={[
                styles.categoryText, 
                selectedCategory === cat && styles.categoryTextSelected
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* CARROUSEL DES MENUS FILTRÉS */}
      {loading ? (
        <ActivityIndicator size="large" color="teal" style={{ marginTop: 20 }} />
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
            <View style={{ width: screenWidth, alignItems: 'center', justifyContent: 'center', height: 300 }}>
                <Text style={{ fontSize: 18, color: 'gray' }}>Aucun plat dans cette catégorie.</Text>
            </View>
          ) : (
            filteredMenu.map(e => (
              <View key={e.id} style={[styles.cardList, { width: screenWidth - 40 }]}>
                {e.image ? (
                  <Image source={{ uri: e.image }} style={styles.imageList} />
                ) : (
                  <View style={styles.imageFallbackList}><Text style={{ color: '#fff' }}>Aucune image</Text></View>
                )}
                <View style={styles.textBox}>
                  <Text style={styles.nameList}>{getItemName(e)}</Text>
                  <Text style={styles.descList}>{e.description}</Text>
                  <Text style={styles.priceList}>{getItemPrice(e)} Ar</Text>
                </View>
                <TouchableOpacity style={styles.orderBtnList} onPress={() => addToCart(e)}>
                  <FontAwesome name="plus" color="white" size={16} />
                  <Text style={styles.orderTextList}> Commander</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <RenderNotificationModal />
      <RenderCartModal />

      {/* BARRE BAS */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate("accueil")}>
          <FontAwesome name="home" size={20} color="teal" />
          <Text style={styles.bottomText}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn}>
          <FontAwesome name="list" size={20} color="teal" />
          <Text style={styles.bottomText}>Menus</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('Publications')}>
          <FontAwesome name="bullhorn" size={20} color="teal" />
          <Text style={styles.bottomText}>Publi.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('admin')}>
          <FontAwesome name="cog" size={20} color="teal" />
          <Text style={styles.bottomText}>Admin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- STYLES SIMPLIFIÉS ET OPTIMISÉS ---
const styles = StyleSheet.create({
  // Conteneur Principal
  container: { flex: 1, backgroundColor: '#edf0f3' },

  // En-tête (Header)
  header: { width: '100%', height: 90, backgroundColor: 'teal', justifyContent: 'center', paddingTop: 25, flexDirection: 'row', alignItems: 'center' },
  headerText: { color: 'white', fontSize: 26, flex: 1, marginLeft: 20, fontWeight: 'bold' },
  topRight: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  topIcon: { marginHorizontal: 8, position: 'relative' },
  badge: { position: 'absolute', right: -6, top: -6, backgroundColor: 'red', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: 'white', fontSize: 10 },

  // NOUVEAUX STYLES CATEGORIES
  categoryContainer: { 
    height: 50, 
    paddingVertical: 8, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0', // Couleur de fond neutre
  },
  categorySelected: {
    backgroundColor: 'teal', // Couleur de fond sélectionnée
    borderWidth: 1,
    borderColor: 'darkblue',
  },
  categoryText: {
    color: '#333',
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: 'white', // Texte blanc si sélectionné
    fontWeight: 'bold',
  },

  // Carrousel
  carousel: { paddingVertical: 20 },
  carouselContent: { alignItems: 'center', paddingHorizontal: 12 },
  cardList: { marginHorizontal: 10, padding: 8, backgroundColor: 'white', paddingBottom: 15, alignItems: 'center', elevation: 10, borderRadius: 15 },
  imageList: { width: '100%', height: 200, borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  imageFallbackList: { borderTopLeftRadius: 15, borderTopRightRadius: 15, width: '100%', height: 200, backgroundColor: '#555', justifyContent: 'center', alignItems: 'center' },
  textBox: { padding: 15, alignItems: 'center' },
  nameList: { fontSize: 22, fontWeight: 'bold', color: '#006666' },
  descList: { color: '#666', marginVertical: 5, fontSize: 14, textAlign: 'center' },
  priceList: { fontSize: 20, fontWeight: 'bold', color: 'green' },
  orderBtnList: { height: 42, backgroundColor: 'teal', flexDirection: 'row', justifyContent: 'center', width: '90%', alignItems: 'center', borderRadius: 10, marginTop: 5 },
  orderTextList: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  // Modals (Panier & Notif)
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#333' },
  notifItem: { backgroundColor: '#f2f2f2', padding: 10, borderRadius: 10, marginBottom: 8 },
  
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
  totalText: { fontSize: 24, fontWeight: 'bold', color: 'teal', marginTop: 15, textAlign: 'right' },
  
  payBtn: { backgroundColor: 'green', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  closeBtn: { backgroundColor: 'gray', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },

  receiptBox: { backgroundColor: '#f0fff0', padding: 15, borderRadius: 10, marginTop: 15, borderWidth: 1, borderColor: 'lightgreen' },
  receiptTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  shareButton: { backgroundColor: 'teal', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },

  // Barre Bas (Bottom Bar)
  bottomBar: { width: '100%', height: 70, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderColor: '#eee', position: 'absolute', bottom: 0 },
  bottomBtn: { alignItems: 'center', padding: 5 },
  bottomText: { fontSize: 12, color: 'teal', marginTop: 3, fontWeight: '500' },
});