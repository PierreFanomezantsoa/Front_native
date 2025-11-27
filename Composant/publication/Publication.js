import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  Animated,
  ScrollView,
} from "react-native";
import axios from "axios";
import { io } from "socket.io-client";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = "http://192.168.1.133:3000";
const { width } = Dimensions.get('window');

const PRIMARY_COLOR = "#008080"; 
const ACCENT_COLOR = "#4CAF50";  
const BACKGROUND_COLOR = "#F4F7F9";
const CARD_COLOR = "#FFFFFF";

export default function PublicationScreen({ navigation }) {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const socketRef = useRef(null);
  const scrollViewRef = useRef(null);
  const autoScrollTimer = useRef(null);

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

  // Auto-scroll toutes les 10 secondes
  useEffect(() => {
    if (publications.length > 0) {
      autoScrollTimer.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % publications.length;
          scrollViewRef.current?.scrollTo({
            x: nextIndex * width,
            animated: true,
          });
          return nextIndex;
        });
      }, 10000); // 10 secondes

      return () => {
        if (autoScrollTimer.current) {
          clearInterval(autoScrollTimer.current);
        }
      };
    }
  }, [publications.length]);

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const handleMomentumScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  useEffect(() => {
    getPublications();

    socketRef.current = io(API_URL, { transports: ["websocket"] });

    socketRef.current.on("publication_created", (pub) => {
      setPublications((prev) => [pub, ...prev]);
    });

    socketRef.current.on("publication_updated", (pub) => {
      setPublications((prev) => prev.map((p) => (p.id === pub.id ? pub : p)));
    });

    socketRef.current.on("publication_deleted", ({ id }) => {
      setPublications((prev) => prev.filter((p) => p.id !== id));
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} />

      {/* TOP BAR avec Gradient */}
      <LinearGradient
        colors={[PRIMARY_COLOR, '#006666']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topBar}
      >
        <View style={styles.topBarContent}>
          <View style={styles.titleContainer}>
            <View style={styles.iconBadge}>
              <FontAwesome name="bullhorn" size={20} color="#fff" />
            </View>
            <Text style={styles.topTitle}>Publications</Text>
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
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : publications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="inbox" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Aucune publication disponible</Text>
        </View>
      ) : (
        <View style={styles.carouselContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            scrollEventThrottle={16}
            decelerationRate="fast"
          >
            {publications.map((item, index) => (
              <TouchableOpacity 
                key={item.id}
                style={styles.carouselCard}
                activeOpacity={0.9}
              >
                {item.image ? (
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ uri: item.image }} 
                      style={styles.carouselImage}
                      resizeMode="cover"
                    />
                    {item.prixPromo && (
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
                  <Text style={styles.nom} numberOfLines={2}>{item.nom}</Text>
                  <Text style={styles.desc} numberOfLines={4}>{item.description}</Text>

                  <View style={styles.priceContainer}>
                    {item.prix ? (
                      <View style={styles.oldPriceContainer}>
                        <Text style={styles.prix}>{item.prix} Ar</Text>
                        <View style={styles.strikethrough} />
                      </View>
                    ) : null}

                    <View style={styles.promoPriceContainer}>
                      <FontAwesome name="tag" size={18} color="#FF6B6B" />
                      <Text style={styles.prixPromo}>{item.prixPromo} Ar</Text>
                    </View>
                  </View>

                  {item.prix && item.prixPromo && (
                    <View style={styles.savingsContainer}>
                      <Text style={styles.savingsText}>
                        💰 Économisez {item.prix - item.prixPromo} Ar
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Indicateurs de pagination */}
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

          {/* Compteur */}
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {publications.length}
            </Text>
          </View>
        </View>
      )}

      {/* BOTTOM BAR avec ombre élégante */}
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
          style={[styles.bottomBtn, styles.activeBtn]} 
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

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },

  /* TOP BAR */
  topBar: {
    height: Platform.OS === "android" ? 90 : 100,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  topBarContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* LOADING */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },

  /* LIST */
  listContent: {
    paddingTop: 15,
    paddingBottom: 85,
    paddingHorizontal: 16,
  },

  /* CAROUSEL */
  carouselContainer: {
    flex: 1,
    position: 'relative',
  },
  carouselCard: {
    width: width,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  noImageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* CARD */
  card: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: CARD_COLOR,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
    marginBottom: 16,
  },
  image: {
    width: "100%",
    height: '100%',
  },
  promoBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  promoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    backgroundColor: CARD_COLOR,
    padding: 20,
    borderRadius: 20,
    marginTop: -10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  nom: { 
    fontSize: 24, 
    fontWeight: "bold",
    color: '#1a1a1a',
    marginBottom: 10,
  },
  desc: { 
    fontSize: 15, 
    color: "#666",
    lineHeight: 22,
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  oldPriceContainer: {
    position: 'relative',
  },
  prix: { 
    fontSize: 16, 
    fontWeight: "500", 
    color: '#999',
  },
  strikethrough: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: '#999',
  },
  promoPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prixPromo: { 
    fontSize: 26, 
    color: "#FF6B6B", 
    fontWeight: "bold",
  },
  savingsContainer: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  savingsText: {
    fontSize: 13,
    color: ACCENT_COLOR,
    fontWeight: '600',
  },

  /* PAGINATION */
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    transition: 'all 0.3s',
  },
  paginationDotActive: {
    width: 24,
    height: 8,
    backgroundColor: PRIMARY_COLOR,
  },

  /* COUNTER */
  counter: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  /* EMPTY STATE */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },

  /* BOTTOM BAR */
  bottomBar: {
    height: 70,
    flexDirection: "row",
    backgroundColor: CARD_COLOR,
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  bottomBtn: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  activeBtn: {
    // Style pour le bouton actif
  },
  activeIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  bottomText: {
    fontSize: 11,
    color: PRIMARY_COLOR,
    marginTop: 4,
    fontWeight: "600",
  },
  activeText: {
    color: PRIMARY_COLOR,
    fontWeight: "700",
  },
});