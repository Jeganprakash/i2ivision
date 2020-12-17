import React, { useEffect } from 'react';
import { View, Dimensions, FlatList, Image, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
const { width, height } = Dimensions.get('window');

import { RTCView } from 'react-native-webrtc';
import { disconnect, stream } from '../store/actions/videoActions';

const calls = [
  { src: require('../assets/call1.jpg') },
  { src: require('../assets/call2.jpg') },
  { src: require('../assets/call3.jpg') },
  { src: require('../assets/call4.jpg') },
];

export default function GroupCallScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const state = useSelector((state) => state.video);

  const len = state.streams.length;
  const newStreams = state.streams.map((ls) => {
    let fn = 1
    if (len >= 2) {
      fn = 2
    }
    return {
      ...ls,
      len: fn,
    }
  })


  console.log("vv group stream ", newStreams)
  useEffect(() => {
    dispatch(stream());

  }, []);

  console.log('getting stream', state.streams)
  return (
    <View style={styles.container1}>
      {/* <View
        height={height * 0.07}
        style={{
          alignItems: 'center',
          paddingTop: 10,
        }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '900',
            textTransform: 'uppercase',
            color: '#2D8CFF',
          }}>
          Group call screen kk
        </Text>
      </View> */}
      <FlatList
        contentContainerStyle={styles.container1}
        showsVerticalScrollIndicator={false}
        data={newStreams}
        numColumns={len > 2 ? 2 : 1}
        key={len > 2 ? 2 : 1}

        renderItem={({ item: { name, stream, len } }) => {
          console.log("call List calling", len)
          return (
            <>
              <CallList {...{ stream, len }} />
            </>
          );
        }}
        keyExtractor={() => Math.random().toString(36).slice(2).toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({

  container1: {
    flex: 1,
    backgroundColor: "red",
  },
});


function CallList({ name, stream, len }) {
  console.log("call List inside oo", stream, "nii", len)
  return (
    <View
      style={{
        minHeight: Dimensions.get('window').height / len,
        flex: 1,
        backgroundColor: "red",
        margin: 2,
      }}>
      <RTCView
        streamURL={stream.toURL()}
        style={{ ...StyleSheet.absoluteFillObject }}
        objectFit="cover"
      />

      <Button
        style={{
          backgroundColor: '#2D8CFF',
          borderRadius: 50,
          position: 'absolute',
          bottom: 10,
          right: 10,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text
          style={{
            color: '#fff',
            textTransform: 'uppercase',
            fontWeight: '700',
            fontSize: 10,
          }}>
          Mute
          </Text>
      </Button>
    </View>
  );
}

