import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  Platform,
  Share
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

export default function KiosqueMenu({ navigation }) {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const scrollRef = useRef();
  const slideWidth = Dimensions.get("window").width;
  let currentIndex = useRef(0);

  // Chargement du menu
  const loadMenu = async () => {
    try {
      const res = await fetch("http://192.168.43.58:8000/menu");
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

  // Slide automatique
  useEffect(() => {
    if (menu.length === 0) return;
    const interval = setInterval(() => {
      currentIndex.current = (currentIndex.current + 1) % menu.length;
      scrollRef.current?.scrollTo({ x: currentIndex.current * slideWidth, animated: true });
    }, 10000);
    return () => clearInterval(interval);
  }, [menu]);

  const addToCart = (item) => setCart([...cart, item]);
  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  // Paiement simulé
  const handlePayment = async (method) => {
    if (cart.length === 0) return alert("Panier vide !");
    setProcessingPayment(true);
    setPaymentMethod(method);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // simulate processing
      const transactionId = "TXN" + Math.floor(Math.random() * 1000000);

      const newReceipt = {
        id: transactionId,
        date: new Date().toLocaleString(),
        amount: totalPrice,
        method,
        items: cart,
      };

      setReceipt(newReceipt);
      setCart([]);
      alert("Paiement réussi !");
    } catch (err) {
      console.log(err);
      alert("Erreur de paiement");
    } finally {
      setProcessingPayment(false);
    }
  };

  // Génération PDF
  const generatePDF = async () => {
    if (!receipt) return;

    const htmlContent = `
      <h1 style="text-align:center;">Reçu de paiement</h1>
      <p><strong>ID Transaction :</strong> ${receipt.id}</p>
      <p><strong>Date :</strong> ${receipt.date}</p>
      <p><strong>Méthode :</strong> ${receipt.method}</p>
      <p><strong>Montant :</strong> ${receipt.amount} Ar</p>
      <p><strong>Articles :</strong></p>
      <ul>
        ${receipt.items.map(item => `<li>${item.name} (${item.price} Ar)</li>`).join('')}
      </ul>
    `;

    try {
      const options = {
        html: htmlContent,
        fileName: `Recu_${receipt.id}`,
        directory: 'Documents',
      };

      const file = await RNHTMLtoPDF.convert(options);

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Share.share({
          url: `file://${file.filePath}`,
          title: 'Reçu de paiement',
        });
      }
    } catch (err) {
      console.log("Erreur PDF:", err);
      alert("Impossible de générer le PDF");
    }
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerText}>🍴 Menu du jour</Text>
        <TouchableOpacity style={styles.cartBtn} onPress={() => setShowCart(true)}>
          <Icon name="shopping-cart" size={28} color="white" />
          {cart.length > 0 && (
            <View style={styles.badge}>
              <Text style={{ color: 'white', fontWeight: "bold" }}>{cart.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* SLIDE MENU */}
      {loading ? (
        <ActivityIndicator size="large" color="teal" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          ref={scrollRef}
        >
          {menu.map((e) => (
            <View key={e.id} style={[styles.cardList, { width: slideWidth }]}>
              {e.image ? (
                <Image source={{ uri: e.image }} style={styles.imageList} />
              ) : (
                <View style={styles.imageFallbackList}>
                  <Text style={{ color: "#fff" }}>Aucune image</Text>
                </View>
              )}
              <View style={styles.textBox}>
                <Text style={styles.nameList}>{e.name}</Text>
                <Text style={styles.descList}>{e.description}</Text>
                <Text style={styles.priceList}>{e.price} Ar</Text>
              </View>
              <TouchableOpacity style={styles.orderBtnList} onPress={() => addToCart(e)}>
                <Icon name="plus" color="white" size={16} />
                <Text style={styles.orderTextList}> Commander</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* MODAL PANIER */}
      <Modal visible={showCart} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🛒 Votre Panier</Text>
            {cart.length === 0 ? (
              <Text style={{ textAlign: "center", marginTop: 20, color: "gray", fontSize: 18 }}>Panier vide</Text>
            ) : (
              <ScrollView style={{ maxHeight: 220 }}>
                {cart.map((item, i) => (
                  <View key={i} style={styles.cartItem}>
                    <Text style={{ fontSize: 18 }}>{item.name}</Text>
                    <Text style={{ fontSize: 18, color: "green" }}>{item.price} Ar</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <Text style={styles.totalText}>Total : {totalPrice} Ar</Text>

            {/* Bouton Payer */}
            <TouchableOpacity
              style={styles.payBtn}
              onPress={() => {
                if (cart.length === 0) return alert("Panier vide !");
                Alert.alert(
                  "Choisir le moyen de paiement",
                  "Sélectionnez Mobile Money ou Carte bancaire",
                  [
                    { text: "Mobile Money", onPress: () => handlePayment("mobile") },
                    { text: "Carte bancaire", onPress: () => handlePayment("card") },
                    { text: "Annuler", style: "cancel" }
                  ]
                );
              }}
              disabled={processingPayment}
            >
              <Text style={{ color: "white", fontSize: 18 }}>
                {processingPayment ? "Traitement..." : "✅ Payer"}
              </Text>
            </TouchableOpacity>

            {/* Reçu et PDF */}
            {receipt && (
              <View style={{ marginTop: 20, padding: 15, borderWidth: 1, borderColor: "green", borderRadius: 10 }}>
                <Text style={{ fontWeight: "bold", fontSize: 18 }}>Reçu de paiement</Text>
                <Text>ID Transaction : {receipt.id}</Text>
                <Text>Date : {receipt.date}</Text>
                <Text>Méthode : {receipt.method}</Text>
                <Text>Montant : {receipt.amount} Ar</Text>
                <Text>Articles :</Text>
                {receipt.items.map((item, i) => (
                  <Text key={i}>- {item.name} ({item.price} Ar)</Text>
                ))}

                <TouchableOpacity style={[styles.payBtn, { marginTop: 15 }]} onPress={generatePDF}>
                  <Text style={{ color: "white", fontSize: 18 }}>📄 Télécharger le PDF</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCart(false)}>
              <Text style={{ color: "white", fontSize: 18 }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BOTTOM NAV */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.goBack()}>
          <Icon name="home" size={20} color="teal" />
          <Text style={styles.bottomText}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn}>
          <Icon name="list" size={20} color="teal" />
          <Text style={styles.bottomText}>Menus</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('Publications')}>
          <Icon name="bullhorn" size={20} color="teal" />
          <Text style={styles.bottomText}>Publication</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('affectMin1')}>
          <Icon name="cog" size={20} color="teal" />
          <Text style={styles.bottomText}>Admin</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#edf0f3ff" },
  header: { width: "100%", height: 90, backgroundColor: "teal", justifyContent: "center", alignItems: "center", paddingTop: 25 },
  headerText: { color: "white", fontSize: 26, fontWeight: "bold" },
  cartBtn: { position: "absolute", right: 20, top: 30 },
  badge: { position: "absolute", right: -6, top: -6, backgroundColor: "red", width: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  cardList: { backgroundColor: "white", marginVertical: 0, paddingBottom: 15, alignItems: "center", elevation: 6 },
  imageList: { width: "100%", height: 180 },
  imageFallbackList: { width: "100%", height: 180, backgroundColor: "#777", justifyContent: "center", alignItems: "center" },
  textBox: { padding: 15, alignItems: "center" },
  nameList: { fontSize: 24, fontWeight: "bold", color: "#0b6e6a" },
  descList: { color: "#666", marginVertical: 5, fontSize: 15, textAlign: "center" },
  priceList: { fontSize: 20, fontWeight: "bold", color: "green" },
  orderBtnList: { backgroundColor: "teal", paddingVertical: 12, paddingHorizontal: 20, flexDirection: "row", justifyContent: "center", alignItems: "center", borderRadius: 20 },
  orderTextList: { color: "white", fontSize: 18, fontWeight: "bold" },
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalBox: { width: "85%", backgroundColor: "white", borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  cartItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 0.5, borderColor: "#ddd" },
  totalText: { fontSize: 22, fontWeight: "bold", color: "teal", marginTop: 15, textAlign: "right" },
  payBtn: { backgroundColor: "green", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginTop: 15 },
  closeBtn: { backgroundColor: "gray", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginTop: 10 },
  bottomBar: { width: "100%", height: 70, backgroundColor: "#fff", flexDirection: "row", justifyContent: "space-around", alignItems: "center", borderTopWidth: 0.5, borderColor: "#ccc", position: "absolute", bottom: 0 },
  bottomBtn: { alignItems: "center" },
  bottomText: { fontSize: 12, color: "teal", marginTop: 3 },
});
