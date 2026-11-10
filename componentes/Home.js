import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image } from
'react-native';
export default function Home() {
const [data, setData] = useState([]);
useEffect(() => {
 const obtenerDatos = async () => {
 const res = await
fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
 const json = await res.json();
 setData(json.results);
 };
 obtenerDatos();
}, []); // ← vacío si no usas tipoSeleccionado aún
return (
 <ScrollView>
 <View style={styles.lista}>
 {data.map((pokemon, index) => {
 const id = pokemon.url.split("/")[6];
 return (
 <View key={index} style={styles.item}>
 <Text>{id} - {pokemon.name}</Text>
 <Image
 source={{
 uri:
`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokem
on/other/official-artwork/${id}.png`,
 }}
 style={styles.imagen}
 />
 </View>
 );
 })}
 </View>
 </ScrollView>
);
}
const styles = StyleSheet.create({
lista: {
 flexDirection: 'row',
 flexWrap: 'wrap',
 gap: 5,
 justifyContent: 'space-between',
 padding: 10,
},
item: {
 backgroundColor: 'aliceblue',
 width: '48%',
 padding: 10,
 alignItems: 'center',
 marginBottom: 10,
},
imagen: {
 width: 100,
 height: 100,
 resizeMode: 'contain',
},
buscador: {
 margin: 10,
 padding: 10,
 borderWidth: 1,
 borderColor: '#ccc',
 borderRadius: 10,
},
});