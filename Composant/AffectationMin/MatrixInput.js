import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function AddMenu({ navigation }) {
  const [menuItem, setMenuItem] = useState({ name: '', description: '', price: '', image: null });

  const updateField = (field, value) => setMenuItem({ ...menuItem, [field]: value });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) updateField('image', result.assets[0].uri);
  };

  const saveMenu = () => {
    if (!menuItem.name || !menuItem.price) {
      alert("Veuillez remplir le nom et le prix du plat.");
      return;
    }
    alert(`Plat enregistré:\n${JSON.stringify(menuItem, null, 2)}`);
    setMenuItem({ name: '', description: '', price: '', image: null });
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid={true}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.formCard}>
        {/* Bouton Retour */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('affectMin')}>
          <Ionicons name="arrow-back" size={24} color="teal" />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Ajouter un nouveau plat</Text>

        {/* Nom */}
        <View style={styles.inputContainer}>
          <Ionicons name="fast-food" size={22} color="teal" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Nom du plat"
            value={menuItem.name}
            onChangeText={(text) => updateField('name', text)}
          />
        </View>

        {/* Description */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="description" size={22} color="teal" style={styles.icon} />
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Description"
            value={menuItem.description}
            onChangeText={(text) => updateField('description', text)}
            multiline
          />
        </View>

        {/* Prix */}
        <View style={styles.inputContainer}>
          <Ionicons name="pricetag" size={22} color="teal" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Prix"
            keyboardType="numeric"
            value={menuItem.price}
            onChangeText={(text) => updateField('price', text)}
          />
        </View>

        {/* Image */}
        <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
          <Text style={styles.imageText}>{menuItem.image ? "Modifier l'image" : "Ajouter une image"}</Text>
        </TouchableOpacity>
        {menuItem.image && <Image source={{ uri: menuItem.image }} style={styles.imagePreview} />}

        {/* Bouton enregistrer */}
        <TouchableOpacity style={styles.saveBtn} onPress={saveMenu}>
          <Text style={styles.saveText}>Enregistrer le plat</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: "#FAFAFA",
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backText: {
    color: 'teal',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'teal',
    marginBottom: 20,
    textAlign: "center"
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: "#f9f9f9"
  },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 8, fontSize: 16, color: "#333" },
  imageBtn: { backgroundColor: 'teal', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  imageText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  imagePreview: { width: "100%", height: 200, borderRadius: 15, marginBottom: 15 },
  saveBtn: { backgroundColor: 'teal', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});
