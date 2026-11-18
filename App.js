import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/firebaseConfig';
import { COLORES } from './digimonApi';

import Login from './componentes/Login';
import Registro from './componentes/Registro';
import Home from './componentes/Home';
import Original from './componentes/Original';
import Batalla from './componentes/Batalla';
import Perfil from './componentes/Perfil';
import Logout from './componentes/Logout';

const Tab = createBottomTabNavigator();

const temaOscuro = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORES.fondo,
    card: COLORES.panel,
    text: COLORES.texto,
    border: COLORES.borde,
    primary: COLORES.cian,
  },
};

const iconos = {
  Login: '🔑',
  Registro: '📝',
  Catalogo: '📖',
  Digievolucion: '🧬',
  Batalla: '⚔️',
  Perfil: '🪪',
  Salir: '🚪',
};

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCargando(false);
    });
    return unsubscribe;
  }, []);

  if (cargando) {
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
      </View>
    );
  }

  return (
    <NavigationContainer theme={temaOscuro}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORES.cian,
          tabBarInactiveTintColor: COLORES.gris,
          tabBarStyle: {
            backgroundColor: COLORES.panel,
            borderTopColor: COLORES.borde,
            height: 64,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: 'bold' },
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 24 : 20 }}>{iconos[route.name]}</Text>
          ),
        })}
      >
        {usuario ? (
          <>
            <Tab.Screen name="Catalogo" component={Home} options={{ title: 'Catálogo' }} />
            <Tab.Screen
              name="Digievolucion"
              component={Original}
              options={{ title: 'Digievolución' }}
            />
            <Tab.Screen name="Batalla" component={Batalla} />
            <Tab.Screen name="Perfil" component={Perfil} />
            <Tab.Screen name="Salir" component={Logout} />
          </>
        ) : (
          <>
            <Tab.Screen name="Login" component={Login} options={{ title: 'Entrar' }} />
            <Tab.Screen name="Registro" component={Registro} />
          </>
        )}
      </Tab.Navigator>
    </NavigationContainer>
  );
}