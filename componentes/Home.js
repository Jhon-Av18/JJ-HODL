import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { COLORES, NIVELES, cargarDigimon, nivelDe } from '../digimonApi';

export default function Home() {
  const [digimon, setDigimon] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState(null); // null = todos, o el número del nivel
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      setDigimon(await cargarDigimon());
    } catch (e) {
      console.error(e);
      setError('No se pudo cargar el catálogo. Revisa tu conexión e intenta de nuevo.');
    }
    setCargando(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = digimon.filter(
    (d) =>
      d.name.toLowerCase().includes(busqueda.trim().toLowerCase()) &&
      (filtro === null || nivelDe(d.level).tier === filtro)
  );

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={COLORES.cian} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centro}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.boton} onPress={cargar}>
          <Text style={styles.botonTexto}>REINTENTAR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>DIGI-CATÁLOGO</Text>
      <Text style={styles.contador}>
        {filtrados.length} de {digimon.length} Digimon
      </Text>

      <TextInput
        style={styles.buscador}
        placeholder="Buscar Digimon..."
        placeholderTextColor={COLORES.gris}
        value={busqueda}
        onChangeText={setBusqueda}
        autoCapitalize="none"
      />

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <TouchableOpacity
            style={[styles.chip, filtro === null && styles.chipActivo]}
            onPress={() => setFiltro(null)}
          >
            <Text style={[styles.chipTexto, filtro === null && styles.chipTextoActivo]}>
              Todos
            </Text>
          </TouchableOpacity>
          {NIVELES.map((n) => (
            <TouchableOpacity
              key={n.tier}
              style={[
                styles.chip,
                { borderColor: n.color },
                filtro === n.tier && { backgroundColor: n.color },
              ]}
              onPress={() => setFiltro(filtro === n.tier ? null : n.tier)}
            >
              <Text
                style={[
                  styles.chipTexto,
                  { color: filtro === n.tier ? COLORES.fondo : n.color },
                ]}
              >
                {n.emoji} {n.etiqueta}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtrados}
        numColumns={2}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
        ListEmptyComponent={<Text style={styles.vacio}>No hay Digimon con ese filtro.</Text>}
        renderItem={({ item }) => {
          const nivel = nivelDe(item.level);
          return (
            <View style={[styles.carta, { borderColor: nivel.color }]}>
              <Image source={{ uri: item.img }} style={styles.imagen} />
              <Text style={styles.nombre} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={[styles.insignia, { backgroundColor: nivel.color }]}>
                <Text style={styles.insigniaTexto}>{item.level}</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, paddingTop: 50, backgroundColor: COLORES.fondo },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORES.fondo,
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORES.cian,
    textAlign: 'center',
    letterSpacing: 3,
  },
  contador: { color: COLORES.gris, textAlign: 'center', marginBottom: 10 },
  buscador: {
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORES.borde,
    backgroundColor: COLORES.panel,
    color: COLORES.texto,
    borderRadius: 10,
  },
  chips: { paddingHorizontal: 12, gap: 8, paddingBottom: 6 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORES.cian,
  },
  chipActivo: { backgroundColor: COLORES.cian },
  chipTexto: { color: COLORES.cian, fontWeight: 'bold', fontSize: 12 },
  chipTextoActivo: { color: COLORES.fondo },
  carta: {
    width: '48%',
    backgroundColor: COLORES.panel,
    borderWidth: 2,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  imagen: { width: 100, height: 100, resizeMode: 'contain', borderRadius: 8 },
  nombre: { color: COLORES.texto, fontWeight: 'bold', marginTop: 8 },
  insignia: { marginTop: 6, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10 },
  insigniaTexto: { color: COLORES.fondo, fontSize: 11, fontWeight: 'bold' },
  vacio: { color: COLORES.gris, textAlign: 'center', marginTop: 30 },
  error: { color: COLORES.rojo, textAlign: 'center', marginBottom: 14 },
  boton: { backgroundColor: COLORES.cian, padding: 12, borderRadius: 8 },
  botonTexto: { color: COLORES.fondo, fontWeight: 'bold' },
});