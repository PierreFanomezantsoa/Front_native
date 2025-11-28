import React, { useEffect, useState, useRef, memo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import io from "socket.io-client";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.137.118:3000";

const COLORS = {
  primary: "#008080",
  colorQnt: "#d55937ff",
  success: "#4CAF50",
  warning: "#FFA500",
  danger: "#FF4D4D",
  light: "#F4F7F9",
  dark: "#1a1a1a",
  white: "#FFFFFF",
  gray: "#E0E0E0",
  text: "#333333",
};

const STATUS_COLORS = {
  "En attente": "#FFB74D",
  "En cours": "#2196F3",
  Prête: "#4CAF50",
  "Payée": "#00796B",
  Livrée: "#689F38",
  Annulée: "#F44336",
};

export default function CommandeScreen({ navigation }) {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const fetchCommandes = async () => {
    try {
      const response = await axios.get(`${API_URL}/commande`);
      const storedNew = JSON.parse(await AsyncStorage.getItem("newCommandes") || "{}");

      const data = response.data.map((c) => ({
        ...c,
        isNew: storedNew[c.id] ? true : false,
      }));

      setCommandes(data);
    } catch (error) {
      console.log("❌ Erreur de chargement :", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCommandes();

    const initSocket = async () => {
      let userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        userId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
        await AsyncStorage.setItem("userId", userId);
      }

      const socket = io(API_URL, {
        transports: ["websocket"],
        reconnection: true,
        auth: { userId },
      });

      socket.on("connect", () =>
        console.log("📡 Socket connecté :", socket.id, "userId:", userId)
      );

      socket.on("commande:new", async (newCommande) => {
        const commandeWithFlag = { ...newCommande, isNew: true };

        Animated.sequence([
          Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        ]).start();

        setCommandes((prev) => [commandeWithFlag, ...prev]);

        // Mitahiry ao AsyncStorage
        const storedNew = JSON.parse(await AsyncStorage.getItem("newCommandes") || "{}");
        storedNew[newCommande.id] = Date.now();
        await AsyncStorage.setItem("newCommandes", JSON.stringify(storedNew));
      });

      socket.on("commande:update", (updatedCommande) => {
        setCommandes((prev) =>
          prev.map((c) =>
            c.id === updatedCommande.id ? { ...updatedCommande, isNew: c.isNew || false } : c
          )
        );
      });

      socket.on("commande:delete", (id) => {
        setCommandes((prev) => prev.filter((c) => c.id !== id));
      });

      return () => {
        socket.disconnect();
        console.log("📴 Socket déconnecté");
      };
    };

    initSocket();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCommandes();
  };

  const filteredCommandes = commandes.filter((item) => {
    if (filter === "all") return true;
    if (filter === "new") return item.isNew;
    if (filter === "pending") return item.status !== "Livrée";
    return true;
  });

  const getStatusIcon = (status) => {
    const icons = {
      "En attente": "clock-outline",
      "En cours": "chef-hat",
      Prête: "check-circle-outline",
      "Payée": "credit-card",
      Livrée: "truck-check",
      Annulée: "close-circle-outline",
    };
    return icons[status] || "help-circle-outline";
  };

  // -------------------- Components --------------------
  const Header = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>📦 Commandes</Text>
        <Text style={styles.headerSubtitle}>
          {filteredCommandes.length} commande{filteredCommandes.length > 1 ? "s" : ""}
        </Text>
      </View>
      {commandes.some((c) => c.isNew) && (
        <View style={styles.newBadgeHeader}>
          <Text style={styles.newBadgeHeaderText}>
            {commandes.filter((c) => c.isNew).length} 🆕
          </Text>
        </View>
      )}
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="inbox-multiple-outline" size={80} color={COLORS.gray} />
      <Text style={styles.emptyText}>Aucune commande</Text>
      <Text style={styles.emptySubtext}>Les commandes apparaîtront ici</Text>
    </View>
  );

  const CommandeCard = memo(({ item }) => {
    const items = (() => {
      try {
        return typeof item.items === "string" ? JSON.parse(item.items) : item.items;
      } catch {
        return [];
      }
    })();

    const handleValidate = async () => {
      setCommandes((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, isNew: false } : c))
      );

      const stored = JSON.parse(await AsyncStorage.getItem("newCommandes") || "{}");
      delete stored[item.id];
      await AsyncStorage.setItem("newCommandes", JSON.stringify(stored));
    };

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          { transform: [{ scale: item.isNew ? scaleAnim : 1 }] },
        ]}
      >
        <View
          style={[
            styles.card,
            item.isNew && styles.cardNew,
            { borderLeftColor: STATUS_COLORS[item.status] || COLORS.primary },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: STATUS_COLORS[item.status] || COLORS.primary },
                ]}
              >
                <MaterialCommunityIcons
                  name={getStatusIcon(item.status)}
                  size={16}
                  color={COLORS.white}
                />
              </View>
              <View>
                <Text style={styles.commandeId}>Commande #{item.id}</Text>
                {item.order_number && <Text style={styles.orderNumber}>{item.order_number}</Text>}
              </View>
            </View>
            {item.isNew && (
              <View style={styles.newBadge}>
                <Ionicons name="star" size={14} color={COLORS.white} />
                <Text style={styles.newBadgeText}>Nouveau</Text>
              </View>
            )}
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons
                  name="table-furniture"
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={styles.infoLabel}>Table {item.table_number}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="cash" size={18} color={COLORS.success} />
                <Text style={[styles.infoLabel, { fontWeight: "700", color: COLORS.success }]}>
                  {item.total_amount} Ar
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons
                  name="credit-card-multiple"
                  size={18}
                  color={COLORS.warning}
                />
                <Text style={styles.infoLabel}>{item.payment_method}</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={18}
                  color={STATUS_COLORS[item.status] || COLORS.primary}
                />
                <Text style={[styles.infoLabel, { fontWeight: "600" }]}>{item.status}</Text>
              </View>
            </View>

            {items.length > 0 && (
              <View style={styles.itemsSection}>
                <Text style={styles.itemsTitle}>📦 Articles ({items.length})</Text>
                {items.slice(0, 3).map((product, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={styles.itemQty}>( x {product.qty} )</Text>
                    <Text style={styles.itemPrice}>
                      {(product.price * product.qty).toFixed(0)} Ar
                    </Text>
                  </View>
                ))}
                {items.length > 3 && (
                  <Text style={styles.moreItems}>+{items.length - 3} articles</Text>
                )}
              </View>
            )}

            <View style={styles.footer}>
              <Ionicons name="calendar" size={14} color={COLORS.gray} />
              <Text style={styles.date}>{new Date(item.created_at).toLocaleString("fr-FR")}</Text>
            </View>

            {item.isNew && (
              <TouchableOpacity
                onPress={handleValidate}
                style={{
                  marginTop: 10,
                  backgroundColor: COLORS.success,
                  paddingVertical: 6,
                  borderRadius: 6,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: COLORS.white, fontWeight: "700" }}>✅ Valider</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    );
  });

  // -------------------- RENDER --------------------
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Header />

      <View style={styles.filterContainer}>
        {["all", "new", "pending"].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "all" ? "Toutes" : f === "new" ? "Nouvelles" : "En cours"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Chargement des commandes...</Text>
        </View>
      ) : filteredCommandes.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={filteredCommandes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <CommandeCard item={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </View>
  );
}

// -------------------- Styles --------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  headerContainer: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 15 : 15,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: COLORS.white },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  newBadgeHeader: {
    backgroundColor: COLORS.success,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  newBadgeHeaderText: { color: COLORS.white, fontWeight: "700", fontSize: 12 },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.gray },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  filterTextActive: { color: COLORS.white },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 10, color: COLORS.text, fontWeight: "500" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30 },
  emptyText: { fontSize: 18, fontWeight: "bold", color: COLORS.text, marginTop: 15 },
  emptySubtext: { fontSize: 14, color: COLORS.gray, marginTop: 5 },
  listContent: { paddingHorizontal: 12, paddingVertical: 10 },
  cardContainer: { marginBottom: 12 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, borderLeftWidth: 5, overflow: "hidden", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardNew: { backgroundColor: "rgba(76, 175, 80, 0.05)" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 15, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  statusBadge: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  commandeId: { fontSize: 15, fontWeight: "700", color: COLORS.dark },
  orderNumber: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  newBadge: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.success, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  newBadgeText: { color: COLORS.white, fontWeight: "600", fontSize: 12 },
  cardBody: { padding: 15, gap: 10 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  infoItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(0,128,128,0.05)", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  infoLabel: { fontSize: 13, color: COLORS.text, fontWeight: "500", flex: 1 },
  itemsSection: { marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.gray },
  itemsTitle: { fontSize: 12, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  itemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 4, paddingVertical: 6, paddingHorizontal: 8, backgroundColor: COLORS.light, borderRadius: 6 },
  itemName: { flex: 1, fontSize: 12, color: COLORS.text, fontWeight: "500" },
  itemQty: { fontSize: 12, fontWeight: "600", color: COLORS.colorQnt, marginHorizontal: 6 },
  itemPrice: { fontSize: 12, fontWeight: "700", color: COLORS.success },
  moreItems: { fontSize: 11, color: COLORS.primary, fontWeight: "600", marginTop: 6 },
  footer: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  date: { fontSize: 12, color: COLORS.gray, fontStyle: "italic" },
  actionButtons: { flexDirection: "row", borderTopWidth: 1, borderTopColor: COLORS.gray, padding: 0 },
  actionBtn: { flex: 1, paddingVertical: 12, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 6 },
  viewBtn: { borderRightWidth: 1, borderRightColor: COLORS.gray },
  viewBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
  moreBtn: { justifyContent: "center", alignItems: "center" },
});
