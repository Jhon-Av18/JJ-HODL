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
import { COLORES, NIVELES, cargarDigimon, tierDe, valorDe } from '../digimonApi';

// El rango depende del nivel más alto que hayas conseguido
const RANGOS = [
  { nombre: 'Recluta Digital', emoji: '🥚' },
  { nombre: 'Domador', emoji: '🐣' },
  { nombre: 'Digielegido', emoji: '⚡' },
  { nombre: 'Guardián Digital', emoji: '🛡️' },
  { nombre: 'Caballero Real', emoji: '⚔️' },
  { nombre: 'Leyenda Mega', emoji: '👑' },
];

export default function Perfil() {
  const uid = auth.currentUser?.uid;
  const correo = auth.currentUser?.email;

  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [telefono, setTelefono] = useState('');
  const [monedas, setMonedas] = useState(0);
  const [victorias, setVictorias] = useState(0);
  const [derrotas, setDerrotas] = useState(0);
  const [coleccion, setColeccion] = useState([]);
  const [totalDigimon, setTotalDigimon] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!uid) {
      setCargando(false);
      return;
    }
    const traerDatos = async () => {
      try {
        const snap = await getDoc(doc(db, 'usuarios', uid));
        if (snap.exists()) {
          const data = snap.data();
          setNombre(data.nombre || '');
          setFecha(data.fecha || '');
          setTelefono(data.telefono || '');
          setMonedas(data.monedas || 0);
          setVictorias(data.victorias || 0);
          setDerrotas(data.derrotas || 0);
          setColeccion((data.coleccion || []).filter((d) => d && d.name && d.level));
        } else {
          Alert.alert('Usuario no encontrado');
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'No se pudieron cargar tus datos.');
      }
      try {
        setTotalDigimon((await cargarDigimon()).length);
      } catch (e) {
        // si falla la API, simplemente no mostramos el progreso del Digidex
      }
      setCargando(false);
    };
    traerDatos();
  }, [uid]);

  const actualizarDatos = async () => {
    setGuardando(true);
    try {
      await updateDoc(doc(db, 'usuarios', uid), { nombre, fecha, telefono });
      Alert.alert('¡Listo!', 'Tu Digivice fue actualizado.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error al actualizar');
    }
    setGuardando(false);
  };

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={COLORES.cian} />
      </View>
    );
  }

  const unicos = new Set(coleccion.map((d) => d.name)).size;
  const valor = coleccion.reduce((t, d) => t + valorDe(d.level), 0);
  const mejorTier = coleccion.length ? Math.max(...coleccion.map((d) => tierDe(d.level))) : -1;
  const rango = RANGOS[Math.max(0, mejorTier)];
  const color = mejorTier >= 0 ? NIVELES[mejorTier].color : COLORES.gris;
  // El Digimon estrella es el primero de tu colección con el nivel más alto
  const estrella = mejorTier >= 0 ? coleccion.find((d) => tierDe(d.level) === mejorTier) : null;
  const progreso = totalDigimon ? Math.min(100, (unicos / totalDigimon) * 100) : 0;
  const totalBatallas = victorias + derrotas;
  const porcentajeVictorias = totalBatallas ? Math.round((victorias / totalBatallas) * 100) : 0;

  return (
    <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">
      <View style={[styles.carnet, { borderColor: color }]}>
        <View style={[styles.avatar, { borderColor: color }]}>
          {estrella ? (
            <Image source={{ uri: estrella.img }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarVacio}>📟</Text>
          )}
        </View>
        <Text style={styles.nombre}>{nombre || 'Digielegido sin nombre'}</Text>
        <Text style={styles.correo}>{correo}</Text>
        <View style={[styles.rango, { backgroundColor: color }]}>
          <Text style={styles.rangoTexto}>
            {rango.emoji} {rango.nombre}
          </Text>
        </View>
        {estrella && <Text style={styles.estrella}>Compañero estrella: {estrella.name}</Text>}
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>🪙 {monedas}</Text>
          <Text style={styles.statLabel}>Monedas</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>🎴 {coleccion.length}</Text>
          <Text style={styles.statLabel}>Digimon</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>💎 {valor}</Text>
          <Text style={styles.statLabel}>Valor</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>🏆 {victorias}</Text>
          <Text style={styles.statLabel}>Victorias</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>💀 {derrotas}</Text>
          <Text style={styles.statLabel}>Derrotas</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>📊 {porcentajeVictorias}%</Text>
          <Text style={styles.statLabel}>Efectividad</Text>
        </View>
      </View>

      {totalDigimon > 0 && (
        <>
          <Text style={styles.progresoTexto}>
            Digidex: {unicos} / {totalDigimon} ({progreso.toFixed(1)}%)
          </Text>
          <View style={styles.barra}>
            <View
              style={[styles.barraRelleno, { width: `${progreso}%`, backgroundColor: color }]}
            />
          </View>
        </>
      )}

      <Text style={styles.seccion}>Datos del Digielegido</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        placeholderTextColor={COLORES.gris}
        value={nombre}
        onChangeText={setNombre}
      />
      <TextInput
        style={styles.input}
        placeholder="Fecha de nacimiento (YYYY-MM-DD)"
        placeholderTextColor={COLORES.gris}
        value={fecha}
        onChangeText={setFecha}
      />
      <TextInput
        style={styles.input}
        placeholder="Teléfono"
        placeholderTextColor={COLORES.gris}
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
      />
      <TouchableOpacity
        style={[styles.boton, { backgroundColor: COLORES.cian }]}
        onPress={actualizarDatos}
        disabled={guardando}
      >
        <Text style={styles.botonTexto}>{guardando ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: 20, paddingTop: 50, backgroundColor: COLORES.fondo },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORES.fondo,
  },
  carnet: {
    borderWidth: 3,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    backgroundColor: COLORES.panel,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    backgroundColor: COLORES.fondo,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 120, height: 120, resizeMode: 'contain' },
  avatarVacio: { fontSize: 56 },
  nombre: { fontSize: 22, fontWeight: 'bold', marginTop: 10, color: COLORES.texto },
  correo: { color: COLORES.gris, marginBottom: 8 },
  rango: { paddingVertical: 4, paddingHorizontal: 14, borderRadius: 20 },
  rangoTexto: { color: COLORES.fondo, fontWeight: 'bold' },
  estrella: { marginTop: 8, color: COLORES.gris },
  stats: { flexDirection: 'row', gap: 10, marginTop: 15 },
  stat: {
    flex: 1,
    backgroundColor: COLORES.panel,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statNum: { fontSize: 16, fontWeight: 'bold', color: COLORES.texto },
  statLabel: { color: COLORES.gris, fontSize: 12 },
  progresoTexto: { marginTop: 15, marginBottom: 6, color: COLORES.texto },
  barra: { height: 12, backgroundColor: COLORES.borde, borderRadius: 6, overflow: 'hidden' },
  barraRelleno: { height: 12, borderRadius: 6 },
  seccion: { fontSize: 18, fontWeight: 'bold', marginTop: 25, marginBottom: 10, color: COLORES.cian },
  input: {
    borderWidth: 1,
    borderColor: COLORES.borde,
    backgroundColor: COLORES.panel,
    color: COLORES.texto,
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
  },
  boton: { padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 30 },
  botonTexto: { color: COLORES.fondo, fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
});