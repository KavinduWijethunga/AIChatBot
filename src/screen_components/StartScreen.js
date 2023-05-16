import React, {useEffect} from 'react';

import Background from '../basic_components/Background';
import Logo from '../basic_components/Logo';
import Header from '../basic_components/Header';
import Button from '../basic_components/Button';
import Paragraph from '../basic_components/Paragraph';

import {Platform, PermissionsAndroid} from 'react-native';

export default function StartScreen({navigation}) {
  useEffect(() => {
    if (Platform.OS === 'android' && Platform.Version > 29) {
      checkpermissionsAbove29();
    } else {
      checkpermissionsBelow29();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkpermissionsBelow29 = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        console.log('write external stroage', grants);

        if (
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.RECORD_AUDIO'] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('permissions granted');
        } else {
          console.log('All required permissions not granted');

          checkpermissionsBelow29();
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const checkpermissionsAbove29 = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          // PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          // PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        console.log('write external stroage', grants);

        if (
          // grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
          //   PermissionsAndroid.RESULTS.GRANTED &&
          // grants['android.permission.READ_EXTERNAL_STORAGE'] ===
          //   PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.RECORD_AUDIO'] ===
          PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('permissions granted');
        } else {
          console.log('All required permissions not granted');

          checkpermissionsAbove29();
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };
  const callLoginBtn = () => {
    navigation.navigate('LoginScreen');
  };

  return (
    <Background>
      <Logo />
      <Header> AI Chat Bot </Header>
      <Paragraph>Explore New Adventure With Chat Bot V2</Paragraph>
      <Button mode="elevated" onPress={callLoginBtn}>
        Login
      </Button>
    </Background>
  );
}
