import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Image,
  TouchableOpacity, Modal, Dimensions, Alert, Share
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function KiosqueMenu({ navigation }) {

  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState([]); // {item, qty}
  const [showCart, setShowCart] = useState(false);

  const [receipt, setReceipt] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  const scrollRef = useRef();
  const screenWidth = Dimensions.get("window").width;
  const currentIndex = useRef(0);

  // Chargement menu
  const loadMenu = async () => {
    try {
      const res = await fetch("http://192.168.137.1:8000/menu");
      const data = await res.json();
      setMenu(data.menu);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  useEffect(() => { loadMenu(); }, []);

  // Carrousel auto-scroll
  useEffect(() => {
    if (menu.length === 0) return;
    const interval = setInterval(() => {
      currentIndex.current = (currentIndex.current + 1) % menu.length;
      scrollRef.current?.scrollTo({
        x: currentIndex.current * screenWidth,
        animated: true
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [menu]);

  // Ajouter dans le panier (pas de redondance)
  const addToCart = (item) => {
    const existing = cart.find(c => c.item.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { item, qty: 1 }]);
    }

    // Notification
    setNotifications(prev => [
      ...prev,
      {
        id: Date.now(),
        message: `Ajout dans le panier : ${item.name || item.nom}`,
        date: new Date().toLocaleString()
      }
    ]);
  };

  const totalPrice = cart.reduce((sum, c) => sum + (c.item.price || c.item.prix) * c.qty, 0);

  // Paiement
  const handlePayment = async (method) => {
    if (cart.length === 0) return alert("Panier vide !");
    setProcessingPayment(true);

    try {
      await new Promise(r => setTimeout(r, 2000));

      const txnId = "TXN" + Math.floor(Math.random() * 1000000);

      const newReceipt = {
        id: txnId,
        date: new Date().toLocaleString(),
        method,
        amount: totalPrice,
        items: cart,
      };

      setReceipt(newReceipt);

      setNotifications(prev => [
        ...prev,
        {
          id: Date.now(),
          message: `Paiement confirmé (${method}) - ${totalPrice} Ar`,
          date: new Date().toLocaleString()
        }
      ]);

      setCart([]);
      alert("Paiement réussi !");
    } catch (err) {
      console.log(err);
      alert("Erreur de paiement");
    } finally {
      setProcessingPayment(false);
    }
  };

  const shareReceipt = async () => {
    if (!receipt) return;

    const text =
      `Reçu : ${receipt.id}\nDate : ${receipt.date}\nMéthode : ${receipt.method}\nMontant : ${receipt.amount} Ar\nArticles:\n`
      + receipt.items.map(c => `- ${c.item.name || c.item.nom} x${c.qty} (${(c.item.price || c.item.prix) * c.qty} Ar)`).join("\n");

    try {
      await Share.share({ message: text });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerText}>🍴 Menu du jour</Text>
        <View style={styles.topRight}>
          {/* Notifications */}
          <TouchableOpacity style={styles.topIcon} onPress={() => setShowNotif(true)}>
            <FontAwesome name="bell" size={22} color="white" />
            {notifications.length > 0 && (
              <View style={styles.badge}>
                <Text style={{ color: 'white', fontSize: 10 }}>{notifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.topIcon} onPress={() => navigation.navigate('Historique')}>
            <FontAwesome name="history" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.topIcon} onPress={() => setShowCart(true)}>
            <FontAwesome name="shopping-cart" size={22} color="white" />
            {cart.length > 0 && (
              <View style={styles.badge}>
                <Text style={{ color: 'white', fontSize: 10 }}>{cart.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* CARROUSEL */}
      {loading ? (
        <ActivityIndicator size="large" color="teal" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          ref={scrollRef}
          contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 15 }}
          style={styles.carousel}
        >
          {menu.map(e => (
            <View key={e.id} style={[styles.cardList, { width: screenWidth - 40, marginHorizontal: 17 }]}>
              {e.image ? (
                <Image source={{ uri: e.image }} style={styles.imageList} />
              ) : (
                <View style={styles.imageFallbackList}>
                  <Text style={{ color: '#fff' }}>Aucune image</Text>
                </View>
              )}
              <View style={styles.textBox}>
                <Text style={styles.nameList}>{e.name || e.nom}</Text>
                <Text style={styles.descList}>{e.description}</Text>
                <Text style={styles.priceList}>{e.price || e.prix} Ar</Text>
              </View>
              <TouchableOpacity style={styles.orderBtnList} onPress={() => addToCart(e)}>
                <FontAwesome name="plus" color="white" size={16} />
                <Text style={styles.orderTextList}> Commander</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* MODAL NOTIFICATIONS */}
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
                ))
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

      {/* MODAL PANIER */}
      <Modal visible={showCart} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🛒 Votre Panier</Text>
            <ScrollView style={{ maxHeight: 230 }}>
              {cart.length === 0 ? (
                <Text style={{ textAlign: 'center', color: 'gray' }}>Panier vide</Text>
              ) : (
                cart.map((c, idx) => (
                  <View key={idx} style={styles.cartItem}>
                    <Text>{c.item.name || c.item.nom} x{c.qty}</Text>
                    <Text style={{ color: 'green' }}>{(c.item.price || c.item.prix) * c.qty} Ar</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <Text style={styles.totalText}>Total : {totalPrice} Ar</Text>

            <TouchableOpacity
              style={styles.payBtn}
              onPress={() => {
                if (cart.length === 0) return alert("Panier vide !");
                Alert.alert(
                  "Choisir le moyen de paiement",
                  "Sélectionnez Mobile Money ou Carte",
                  [
                    { text: "Mobile Money", onPress: () => handlePayment("mobile") },
                    { text: "Carte bancaire", onPress: () => handlePayment("card") },
                    { text: "Annuler", style: "cancel" }
                  ]
                );
              }}
            >
              <Text style={{ color: 'white' }}>
                {processingPayment ? "Traitement..." : "✅ Payer"}
              </Text>
            </TouchableOpacity>

            {/* REÇU */}
            {receipt && (
              <View style={[styles.cardList, { marginTop: 10 }]}>
                <Text style={{ fontWeight: 'bold' }}>Reçu de paiement</Text>
                <Text>ID : {receipt.id}</Text>
                <Text>Date : {receipt.date}</Text>
                <Text>Méthode : {receipt.method}</Text>
                <Text>Montant : {receipt.amount} Ar</Text>

                {receipt.items.map((c, idx) => (
                  <Text key={idx}>
                    - {c.item.name || c.item.nom} x{c.qty} ({(c.item.price || c.item.prix) * c.qty} Ar)
                  </Text>
                ))}

                <TouchableOpacity style={[styles.payBtn1, { marginTop: 10 }]} onPress={shareReceipt}>
                  <Text style={{ color: 'white' }}>📤 Partager</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCart(false)}>
              <Text style={{ color: 'white' }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
          <Text style={styles.bottomText}>Publication</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('affectMin1')}>
          <FontAwesome name="cog" size={20} color="teal" />
          <Text style={styles.bottomText}>Admin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#edf0f3' },
  header: { width: '100%', height: 90, backgroundColor: 'teal', justifyContent: 'center', paddingTop: 25 },
  headerText: { color: 'white', fontSize: 26, left: 24, fontWeight: 'bold' },
  topRight: { position: 'absolute', right: 20, top: 45, flexDirection: 'row', alignItems: 'center' },
  topIcon: { marginHorizontal: 8, position: 'relative' },
  badge: { position: 'absolute', right: -6, top: -6, backgroundColor: 'red', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  carousel: { paddingVertical: 70 },
  cardList: { marginTop: 10, padding: 8, backgroundColor: 'white', paddingBottom: 15, alignItems: 'center', elevation: 10, borderRadius: 20, width: 260, marginHorizontal: 2 },
  imageList: { width: '100%', height: 200, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  imageFallbackList: { borderTopLeftRadius: 20, borderTopRightRadius: 20, width: '100%', height: 200, backgroundColor: '#555', justifyContent: 'center', alignItems: 'center' },

  textBox: { padding: 15, alignItems: 'center' },
  nameList: { fontSize: 22, fontWeight: 'bold', color: '#006666' },
  descList: { color: '#666', marginVertical: 5, fontSize: 14, textAlign: 'center' },
  priceList: { fontSize: 20, fontWeight: 'bold', color: 'green' },

  orderBtnList: { height: 42, backgroundColor: 'teal', flexDirection: 'row', justifyContent: 'center', width: '90%', alignItems: 'center', borderRadius: 10, marginTop: 5 },
  orderTextList: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  notifItem: { backgroundColor: '#f2f2f2', padding: 10, borderRadius: 10, marginBottom: 10 },

  cartItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 0.5, borderColor: '#ddd' },
  totalText: { fontSize: 22, fontWeight: 'bold', color: 'teal', marginTop: 12, textAlign: 'right' },
  payBtn: { backgroundColor: 'green', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  payBtn1: { backgroundColor: 'green', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 15, width: 87 },
  closeBtn: { backgroundColor: 'gray', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },

  bottomBar: { width: '100%', height: 70, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 0.5, borderColor: '#ccc', position: 'absolute', bottom: 0 },
  bottomBtn: { alignItems: 'center' },
  bottomText: { fontSize: 12, color: 'teal', marginTop: 3 },
});
