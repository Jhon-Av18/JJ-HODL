import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { COLORES } from '../digimonApi';

export default function Logout() {
  useEffect(() => {
    signOut(auth);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORES.fondo,
      }}
    >
      <ActivityIndicator size="large" color={COLORES.cian} />
      <Text style={{ color: COLORES.gris, marginTop: 14, fontFamily: 'monospace' }}>
        {'> desconectando Digivice_'}
      </Text>
    </View>
  );
}