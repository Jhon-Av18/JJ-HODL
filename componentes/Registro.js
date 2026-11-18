import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase/firebaseConfig';
import { COLORES, mensajeAuth } from '../digimonApi';

const MONEDAS_INICIALES = 100;

export default function Registro() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [fecha, setFecha] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);
  const navigation = useNavigation();

  const handleRegistro = async () => {
    if (!nombre.trim() || !correo.trim() || !contrasena) {
      Alert.alert('Faltan datos', 'Nombre, correo y contraseña son obligatorios.');
      return;
    }
    setGuardando(true);
    try {
      const correoLimpio = correo.trim().toLowerCase();
      const cred = await createUserWithEmailAndPassword(auth, correoLimpio, contrasena);
      const user = cred.user;

      // Guardamos el perfil en Firestore usando el uid como id del documento
      await setDoc(
        doc(db, 'usuarios', user.uid),
        {
          uid: user.uid,
          nombre: nombre.trim(),
          correo: correoLimpio,
          fecha,
          telefono,
          monedas: MONEDAS_INICIALES,
          coleccion: [],
          ultimoBono: null,
        },
        { merge: true }
      );
      Alert.alert('¡Bienvenido!', 'Tu Digivice está listo.');
    } catch (error) {
      console.error(error);
      Alert.alert('No se pudo registrar', mensajeAuth(error.code));
    }
    setGuardando(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.titulo}>NUEVO DIGIELEGIDO</Text>
      <Text style={styles.subtitulo}>{'> registra tu Digivice_'}</Text>

      <TextInput
        placeholder="Nombre"
        placeholderTextColor={COLORES.gris}
        value={nombre}
        onChangeText={setNombre}
        style={styles.input}
      />
      <TextInput
        placeholder="Correo"
        placeholderTextColor={COLORES.gris}
        value={correo}
        onChangeText={setCorreo}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Contraseña (mínimo 6 caracteres)"
        placeholderTextColor={COLORES.gris}
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        placeholder="Fecha de nacimiento (YYYY-MM-DD)"
        placeholderTextColor={COLORES.gris}
        value={fecha}
        onChangeText={setFecha}
        style={styles.input}
      />
      <TextInput
        placeholder="Teléfono"
        placeholderTextColor={COLORES.gris}
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
        style={styles.input}
      />

      <TouchableOpacity style={styles.boton} onPress={handleRegistro} disabled={guardando}>
        <Text style={styles.botonTexto}>{guardando ? 'CREANDO...' : 'CREAR DIGIVICE'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.enlace}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORES.fondo,
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORES.cian,
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitulo: {
    color: COLORES.naranja,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 6,
    fontFamily: 'monospace',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORES.borde,
    backgroundColor: COLORES.panel,
    color: COLORES.texto,
    padding: 13,
    marginBottom: 12,
    borderRadius: 10,
  },
  boton: {
    backgroundColor: COLORES.naranja,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  botonTexto: { color: COLORES.fondo, fontWeight: 'bold', letterSpacing: 1 },
  enlace: { color: COLORES.cian, textAlign: 'center', marginTop: 20, marginBottom: 20 },
});