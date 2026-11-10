import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';

const TOTAL_POKEMON = 1025;
const ARTWORK = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

const precioVenta = (exp) => Math.max(1, Math.floor(exp / 8));

// Rango según cuántos Pokémon distintos tienes
const obtenerRango = (unicos) => {
  if (unicos >= 400) return { nombre: 'Leyenda Pokéhodl', color: '#d4a017', emoji: '👑' };
  if (unicos >= 150) return { nombre: 'Maestro Pokémon', color: '#8e44ad', emoji: '🏆' };
  if (unicos >= 50) return { nombre: 'Entrenador Experto', color: '#2980b9', emoji: '⭐' };
  if (unicos >= 10) return { nombre: 'Entrenador', color: '#27ae60', emoji: '🎒' };
  return { nombre: 'Novato', color: '#7f8c8d', emoji: '🌱' };
};

export default function Perfil() {
  const uid = auth.currentUser?.uid;
  const correo = auth.currentUser?.email;

  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [telefono, setTelefono] = useState('');
  const [monedas, setMonedas] = useState(0);
  const [coleccion, setColeccion] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!uid) {
      setCargando(false);
      return;
    }
    const traerDatos = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'usuarios', uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setNombre(data.nombre || '');
          setFecha(data.fecha || '');
          setTelefono(data.telefono || '');
          setMonedas(data.monedas || 0);
          setColeccion(data.coleccion || []);
        } else {
          Alert.alert('Usuario no encontrado');
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'No se pudieron cargar tus datos.');
      }
      setCargando(false);
    };
    traerDatos();
  }, [uid]);

  const actualizarDatos = async () => {
    setGuardando(true);
    try {
      await updateDoc(doc(db, 'usuarios', uid), { nombre, fecha, telefono });
      Alert.alert('¡Listo!', 'Tu carnet de entrenador fue actualizado.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error al actualizar');
    }
    setGuardando(false);
  };

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const unicos = new Set(coleccion.map((p) => p.id)).size;
  const valor = coleccion.reduce((t, p) => t + precioVenta(p.exp), 0);
  const rango = obtenerRango(unicos);
  const progreso = Math.min(100, (unicos / TOTAL_POKEMON) * 100);
  // El Pokémon estrella es el de mayor experiencia base de tu colección
  const estrella = coleccion.length
    ? coleccion.reduce((mejor, p) => (p.exp > mejor.exp ? p : mejor), coleccion[0])
    : null;

  return (
    <ScrollView
      contentContainerStyle={styles.contenedor}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.carnet, { borderColor: rango.color }]}>
        <View style={[styles.avatar, { borderColor: rango.color }]}>
          {estrella ? (
            <Image source={{ uri: ARTWORK(estrella.id) }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarVacio}>🎒</Text>
          )}
        </View>
        <Text style={styles.nombre}>{nombre || 'Entrenador sin nombre'}</Text>
        <Text style={styles.correo}>{correo}</Text>
        <View style={[styles.rango, { backgroundColor: rango.color }]}>
          <Text style={styles.rangoTexto}>
            {rango.emoji} {rango.nombre}
          </Text>
        </View>
        {estrella && (
          <Text style={styles.estrella}>
            Pokémon estrella: {estrella.nombre.toUpperCase()}
          </Text>
        )}
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>🪙 {monedas}</Text>
          <Text style={styles.statLabel}>Monedas</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>🎴 {coleccion.length}</Text>
          <Text style={styles.statLabel}>Pokémon</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>💎 {valor}</Text>
          <Text style={styles.statLabel}>Valor</Text>
        </View>
      </View>

      <Text style={styles.progresoTexto}>
        Pokédex: {unicos} / {TOTAL_POKEMON} ({progreso.toFixed(1)}%)
      </Text>
      <View style={styles.barra}>
        <View style={[styles.barraRelleno, { width: `${progreso}%`, backgroundColor: rango.color }]} />
      </View>

      <Text style={styles.seccion}>Datos del entrenador</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
      />
      <TextInput
        style={styles.input}
        placeholder="Fecha de nacimiento (YYYY-MM-DD)"
        value={fecha}
        onChangeText={setFecha}
      />
      <TextInput
        style={styles.input}
        placeholder="Teléfono"
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
      />
      <TouchableOpacity
        style={[styles.boton, { backgroundColor: rango.color }]}
        onPress={actualizarDatos}
        disabled={guardando}
      >
        <Text style={styles.botonTexto}>{guardando ? 'Guardando...' : 'Guardar cambios'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  carnet: {
    borderWidth: 3,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'aliceblue',
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 110, height: 110 },
  avatarVacio: { fontSize: 56 },
  nombre: { fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  correo: { color: '#666', marginBottom: 8 },
  rango: { paddingVertical: 4, paddingHorizontal: 14, borderRadius: 20 },
  rangoTexto: { color: 'white', fontWeight: 'bold' },
  estrella: { marginTop: 8, color: '#444' },
  stats: { flexDirection: 'row', gap: 10, marginTop: 15 },
  stat: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statNum: { fontSize: 16, fontWeight: 'bold' },
  statLabel: { color: '#666', fontSize: 12 },
  progresoTexto: { marginTop: 15, marginBottom: 6 },
  barra: { height: 12, backgroundColor: '#ddd', borderRadius: 6, overflow: 'hidden' },
  barraRelleno: { height: 12, borderRadius: 6 },
  seccion: { fontSize: 18, fontWeight: 'bold', marginTop: 25, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 12,
    borderRadius: 10,
  },
  boton: { padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 30 },
  botonTexto: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});