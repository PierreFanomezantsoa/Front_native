import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Dimensions, Modal, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons'; // ✅ Expo vector icons

export default function MenuCarousel({ navigation }) {
  const scrollRef = useRef();
  const [currentIndex, setCurrentIndex] = useState(0);

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const menu = [
    { id: 1, name: "Pizza Fromage", price: 15000, image: require("../../assets/pizza.jpg"), description: "Pizza au fromage mozzarella fondant" },
    { id: 2, name: "Burger Spécial", price: 12000, image: require("../../assets/burger.jpg"), description: "Burger viande + cheddar + frites" },
    { id: 3, name: "Poulet pané", price: 10000, image: require("../../assets/burger.jpg"), description: "Poulet croustillant avec sauce" },
    { id: 4, name: "Salade César", price: 9000, image: require("../../assets/pizza.jpg"), description: "Salade verte avec poulet grillé et parmesan" },
  ];

  const screenWidth = Dimensions.get("window").width;

  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  const totalItems = cart.length;
  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % menu.length;
      setCurrentIndex(nextIndex);
      scrollRef.current?.scrollTo({ x: nextIndex * (screenWidth - 60), animated: true });
    }, 10000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  const handlePay = () => {
    Alert.alert("Paiement", `Total à payer : ${totalPrice} Ar`);
    setCart([]);
    setShowCart(false);
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="long-arrow-left" size={26} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Menu Restaurant</Text>

        <TouchableOpacity style={styles.cartBtn} onPress={() => setShowCart(true)}>
          <FontAwesome name="shopping-cart" size={26} color="white" />
          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={{ color: 'white', fontSize: 12 }}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {totalItems > 0 && (
        <Text style={styles.totalText}>
          {totalItems} articles | Total {totalPrice} Ar
        </Text>
      )}

      {/* Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselCenter}
      >
        {menu.map(item => (
          <View key={item.id} style={styles.card}>
            <Image source={item.image} style={styles.image} />
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.desc}>{item.description}</Text>
            <Text style={styles.price}>{item.price} Ar</Text>
            <TouchableOpacity style={styles.orderBtn} onPress={() => addToCart(item)}>
              <Text style={styles.orderText}>Commander <FontAwesome name="plus" color="white" /></Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Modal Panier */}
      <Modal visible={showCart} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🛒 Votre Panier</Text>
            <ScrollView style={styles.cartScroll} contentContainerStyle={{ paddingBottom: 10 }}>
              {cart.length === 0 ? (
                <Text style={{ textAlign: 'center', color: 'gray', fontSize: 18 }}>Panier vide</Text>
              ) : (
                cart.map((item, index) => (
                  <View key={index} style={styles.cartItem}>
                    <Text style={styles.cartName}>{item.name}</Text>
                    <Text style={styles.cartPrice}>{item.price} Ar</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <Text style={styles.modalTotal}>Total : {totalPrice} Ar</Text>

            {/* Boutons */}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: 'teal' }]} onPress={handlePay}>
                <Text style={styles.modalBtnText}>Payer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: 'gray' }]} onPress={() => setShowCart(false)}>
                <Text style={styles.modalBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate("accueil")}>
          <FontAwesome name="home" size={20} color="teal" />
          <Text style={styles.bottomText}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('menuList')}>
          <FontAwesome name="list" size={24} color="teal" />
          <Text style={styles.bottomText}>Tables</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('Publications')}>
          <FontAwesome name="bullhorn" size={24} color="teal" />
          <Text style={styles.bottomText}>Publication</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('admin')}>
          <FontAwesome name="cog" size={24} color="teal" />
          <Text style={styles.bottomText}>Admin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff", alignItems: "center" },

  header: { width: "100%", height: 90, backgroundColor: "teal", flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 15, paddingTop: 35 },
  headerText: { color: "white", fontSize: 22, fontWeight: "bold" },
  cartBtn: { padding: 5 },
  badge: { position: "absolute", right: -3, top: -1, backgroundColor: "red", width: 18, height: 18, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  totalText: { marginTop: 5, fontSize: 18, fontWeight: "bold", color: "teal" },

  carouselCenter: { justifyContent: "center", alignItems: "center", height: "75%" },
  card: { width: 300, marginHorizontal: 10, backgroundColor: "#fff", borderRadius: 15, padding: 15, alignItems: "center", elevation: 5 },
  image: { width: 200, height: 180, borderRadius: 15 },
  title: { fontSize: 22, fontWeight: "bold", color: "teal" },
  desc: { fontSize: 16, textAlign: "center", marginVertical: 8 },
  price: { fontSize: 20, fontWeight: "bold", color: "green" },
  orderBtn: { marginTop: 10, backgroundColor: "teal", paddingVertical: 10, paddingHorizontal: 25, borderRadius: 10 },
  orderText: { color: "white", fontSize: 18 },

  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalBox: { width: "85%", backgroundColor: "white", borderRadius: 15, padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  cartScroll: { maxHeight: 300, marginVertical: 10 },
  cartItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 0.5, borderColor: "#ccc" },
  cartName: { fontSize: 18 },
  cartPrice: { fontSize: 18, color: "green" },
  modalTotal: { marginTop: 15, textAlign: "right", fontSize: 20, fontWeight: "bold", color: "teal" },
  modalBtns: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 10, marginHorizontal: 5, alignItems: "center" },
  modalBtnText: { color: "white", fontSize: 18 },

  bottomBar: { width: "100%", height: 70, backgroundColor: "#fff", flexDirection: "row", justifyContent: "space-around", alignItems: "center", borderTopWidth: 0.5, borderColor: "#ccc", position: "absolute", bottom: 0 },
  bottomBtn: { alignItems: "center" },
  bottomText: { fontSize: 12, color: "teal", marginTop: 3 },
});
