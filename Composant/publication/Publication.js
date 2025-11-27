import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  Animated,
  Alert,
} from "react-native";
import axios from "axios";
import { io } from "socket.io-client";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const API_URL = "http://192.168.1.133:3000";
const { width } = Dimensions.get("window");

// Couleurs
const PRIMARY_COLOR = "#008080";
const ACCENT_COLOR = "#4CAF50";
const BUTTON_COLOR = "#FF4500";
const BACKGROUND_COLOR = "#F4F7F9";
const CARD_COLOR = "#FFFFFF";
const TEXT_COLOR_DARK = "#1A1A1A";

export default function PublicationScreen({ navigation }) {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const socketRef = useRef(null);
  const scrollViewRef = useRef(null);
  const autoScrollTimer = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // --- Fetch publications ---
  const getPublications = async () => {
    try {
      const res = await axios.get(`${API_URL}/publications`);
      setPublications(res.data);
    } catch (err) {
      console.log("Erreur fetch :", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Handle Order ---
  const handleOrder = (item) => {
    Alert.alert(
      "Passer la commande",
      `Vous souhaitez commander : ${item.nom}. Ceci mènerait à l'écran de commande.`
    );
    // navigation.navigate("OrderScreen", { publicationId: item.id });
  };

  // --- WebSocket et gestion des publications ---
  useEffect(() => {
    getPublications();

    const socket = io(API_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => console.log("Socket connecté:", socket.id));
    socket.on("disconnect", () => console.log("Socket déconnecté"));

    socket.on("publication_created", (pub) => {
      setPublications((prev) => {
        if (prev.find((p) => p.id === pub.id)) return prev;
        return [pub, ...prev];
      });
      setCurrentIndex(0);
      scrollViewRef.current?.scrollTo({ x: 0, animated: true });
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      ]).start();
    });

    socket.on("publication_updated", (pub) => {
      setPublications((prev) =>
        prev.map((p) => (p.id === pub.id ? { ...pub, _updated: true } : p))
      );
      setTimeout(() => {
        setPublications((prev) =>
          prev.map((p) => ({ ...p, _updated: false }))
        );
      }, 2000);
    });

    socket.on("publication_deleted", ({ id }) => {
      setPublications((prev) => prev.filter((p) => p.id !== id));
    });

    return () => {
      socket.off("publication_created");
      socket.off("publication_updated");
      socket.off("publication_deleted");
      socket.disconnect();
    };
  }, []);

  // --- Auto-scroll carousel ---
  useEffect(() => {
    if (publications.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % publications.length;
        const cardWidthWithMargin = width * 0.9 + width * 0.1;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * cardWidthWithMargin,
          animated: true,
        });
        return nextIndex;
      });
    }, 10000);

    return () => clearInterval(timer);
  }, [publications.length]);

  // --- Handle scroll ---
  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const cardWidthWithMargin = width * 0.9 + width * 0.1;
    setCurrentIndex(Math.round(offsetX / cardWidthWithMargin));
  };

  // --- Publication Card ---
  const PublicationCard = ({ item, scaleAnim, isCurrent }) => {
    const isPromo = item.prixPromo && item.prix && item.prixPromo < item.prix;
    const priceToDisplay = isPromo ? item.prixPromo : item.prix;

    return (
      <Animated.View
        style={[
          styles.carouselCard,
          item._updated && styles.updatedCard,
          isCurrent && { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {item.image ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.image }}
              style={styles.carouselImage}
              resizeMode="cover"
            />
            {isPromo && (
              <View style={styles.promoBadge}>
                <FontAwesome name="star" size={12} color="#fff" />
                <Text style={styles.promoText}>PROMO</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noImageContainer}>
            <FontAwesome name="image" size={64} color="#ccc" />
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.nom} numberOfLines={2}>
            {item.nom}
          </Text>
          <Text style={styles.desc} numberOfLines={3}>
            {item.description}
          </Text>

          <View style={styles.priceContainerSolo}>
            {isPromo && (
              <View style={styles.oldPriceContainer}>
                <Text style={styles.prixBarre}>{item.prix} Ar</Text>
                <View style={styles.strikethrough} />
              </View>
            )}
            {priceToDisplay && (
              <View style={styles.currentPriceContainer}>
                <FontAwesome
                  name="money"
                  size={20}
                  color={isPromo ? BUTTON_COLOR : PRIMARY_COLOR}
                />
                <Text
                  style={[styles.prixDisplay, isPromo && styles.promoPrixDisplay]}
                >
                  {priceToDisplay} Ar
                </Text>
              </View>
            )}
            {isPromo && (
              <View style={styles.savingsContainer}>
                <Text style={styles.savingsText}>
                  🎉 Économisez {item.prix - item.prixPromo} Ar
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.fullWidthOrderButton}
            onPress={() => handleOrder(item)}
          >
            <FontAwesome name="cart-plus" size={20} color="#fff" />
            <Text style={styles.orderButtonText}>Commander Maintenant</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // --- Rendu ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} />
      <LinearGradient
        colors={[PRIMARY_COLOR, "#006666"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topBar}
      >
        <View style={styles.topBarContent}>
          <View style={styles.titleContainer}>
            <View style={styles.iconBadge}>
              <FontAwesome name="bullhorn" size={20} color="#fff" />
            </View>
            <Text style={styles.topTitle}>Offres du Jour</Text>
          </View>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.openDrawer?.()}
          >
            <FontAwesome name="bars" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Chargement des publications...</Text>
        </View>
      ) : publications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="inbox" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            Aucune offre spéciale disponible pour le moment.
          </Text>
        </View>
      ) : (
        <View style={styles.carouselContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.scrollViewContent}
          >
            {publications.map((item, index) => (
              <PublicationCard
                key={item.id}
                item={item}
                scaleAnim={scaleAnim}
                isCurrent={currentIndex === index}
              />
            ))}
          </ScrollView>

          <View style={styles.pagination}>
            {publications.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  currentIndex === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>

          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {publications.length}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomBtn}
          onPress={() => navigation.navigate("accueil")}
        >
          <FontAwesome name="home" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.bottomText}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomBtn}
          onPress={() => navigation.navigate("menuList")}
        >
          <FontAwesome name="list" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.bottomText}>Menus</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomBtn}
          onPress={() => navigation.navigate("Publications")}
        >
          <View style={styles.activeIndicator}>
            <FontAwesome name="bullhorn" size={24} color="#fff" />
          </View>
          <Text style={[styles.bottomText, styles.activeText]}>Publi.</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomBtn}
          onPress={() => navigation.navigate("admin")}
        >
          <FontAwesome name="cog" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.bottomText}>Admin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  topBar: {
    height: Platform.OS === "android" ? 90 : 100,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  topBarContent: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
  titleContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  topTitle: { color: "white", fontSize: 22, fontWeight: "700", letterSpacing: 0.5 },
  menuButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, color: "#666" },
  carouselContainer: { flex: 1, position: "relative" },
  scrollViewContent: { alignItems: 'center', paddingVertical: 10 },
  carouselCard: { width: width * 0.9, marginHorizontal: width * 0.05, borderRadius: 16, backgroundColor: CARD_COLOR, marginBottom: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 4.65, elevation: 6 },
  updatedCard: { borderWidth: 3, borderColor: BUTTON_COLOR },
  carouselImage: { width: "100%", height: "100%" },
  imageContainer: { position: "relative", width: "100%", height: 200, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' },
  promoBadge: { position: "absolute", top: 12, right: 12, backgroundColor: BUTTON_COLOR, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, gap: 5 },
  promoText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  noImageContainer: { width: "100%", height: 200, backgroundColor: "#e0e0e0", borderTopLeftRadius: 16, borderTopRightRadius: 16, justifyContent: "center", alignItems: "center" },
  cardContent: { padding: 18 },
  nom: { fontSize: 20, fontWeight: "700", color: TEXT_COLOR_DARK, marginBottom: 6 },
  desc: { fontSize: 14, color: "#444", lineHeight: 20, marginBottom: 12 },
  priceContainerSolo: { flexDirection: 'column', alignItems: 'flex-start', paddingVertical: 10, marginBottom: 15, borderTopWidth: 1, borderTopColor: BACKGROUND_COLOR, paddingTop: 15 },
  oldPriceContainer: { position: "relative", marginBottom: 2 },
  prixBarre: { fontSize: 14, fontWeight: "500", color: "#999" },
  strikethrough: { position: "absolute", top: "50%", left: 0, right: 0, height: 1.5, backgroundColor: "#999" },
  currentPriceContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  prixDisplay: { fontSize: 22, color: PRIMARY_COLOR, fontWeight: "bold" },
  promoPrixDisplay: { fontSize: 26, color: BUTTON_COLOR, fontWeight: "900" },
  savingsContainer: { marginTop: 6, alignSelf: "flex-start", backgroundColor: ACCENT_COLOR + '10', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: ACCENT_COLOR },
  savingsText: { fontSize: 13, color: ACCENT_COLOR, fontWeight: "600" },
  fullWidthOrderButton: { backgroundColor: BUTTON_COLOR, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: BUTTON_COLOR, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 8 },
  orderButtonText: { color: "#fff", fontSize: 16, fontWeight: "800", textTransform: 'uppercase' },
  pagination: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 15, gap: 10 },
  paginationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#D1D5DB" },
  paginationDotActive: { width: 28, height: 8, backgroundColor: PRIMARY_COLOR, borderRadius: 4 },
  counter: { position: "absolute", bottom: 90, right: 20, backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  counterText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: "#999" },
  bottomBar: { height: 70, flexDirection: "row", backgroundColor: CARD_COLOR, justifyContent: "space-around", alignItems: "center", paddingBottom: Platform.OS === "ios" ? 20 : 0, position: "absolute", bottom: 0, left: 0, right: 0, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  bottomBtn: { justifyContent: "center", alignItems: "center", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  activeIndicator: { width: 50, height: 50, borderRadius: 25, backgroundColor: PRIMARY_COLOR, justifyContent: "center", alignItems: "center" },
  bottomText: { fontSize: 11, color: PRIMARY_COLOR, marginTop: 4, fontWeight: "600" },
  activeText: { color: PRIMARY_COLOR, fontWeight: "700" },
});
