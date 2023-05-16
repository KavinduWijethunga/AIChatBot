import React, {useState, useCallback, useEffect, useRef, useMemo} from 'react';

import AudioRecorderPlayer from 'react-native-audio-recorder-player';

import {
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  AppState,
  BackHandler,
  Alert,
} from 'react-native';

import Play from '../assets/play_on.png';
import Pause from '../assets/play_off.png';

const playerscreenWidth = 165; // Dimensions.get('screen').width;

const AudioPlayerBubble = ({
  // audioRecorderPlayer,
  // key,
  //msgId,
  audiopath,
  timeIn,
  navigation,
  // isAudioPlay,
  // setupAudioPlay,
  // currentAudioID,
}) => {
  const audioRecorderPlayerRef = useRef(null);

  const [currentPositionSec, setcurrentPositionSec] = useState('00:00:00');
  const [currentDurationSec, setcurrentDurationSec] = useState(0);
  const [playTime, setplayTime] = useState(0);
  const [duration, setduration] = useState('00:00:00');

  const [playAudio, setPlayAudio] = useState(false);

  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  useEffect(() => {
    if (checkpermissions()) {
      audioRecorderPlayerRef.current = new AudioRecorderPlayer();

      audioRecorderPlayerRef.current.setSubscriptionDuration(0.1);
    } else {
      console.error(' permisiion error on load ');
    }
    return () => {
      audioRecorderPlayerRef.current.removePlayBackListener(onPlaybackEvent);
      setPlayAudio(false);
    };
  }, []);

  const onPlaybackEvent = e => {
    //  console.log('Playback event occurred', e);

    setcurrentPositionSec(e.currentPosition);
    setcurrentDurationSec(e.duration);
    setplayTime(
      audioRecorderPlayerRef.current.mmssss(Math.floor(e.currentPosition)),
    );
    setduration(audioRecorderPlayerRef.current.mmssss(Math.floor(e.duration)));
  };

  const checkpermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
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
          return true;
        } else {
          console.log('All required permissions not granted');

          return false;
        }
      } catch (err) {
        console.warn(err);

        return false;
      }
    }
  };

  /*

  //! Handle Back Button pressed
  useEffect(() => {
    const backAction = () => {
      console.log('Back button pressed tts ');

      Alert.alert('User Logout', 'Do you want to Log out', [
        {
          text: 'Log out',
          onPress: () => {
            console.log('Cancel Pressed');
            try {
              audioRecorderPlayerRef.current.removePlayBackListener(
                onPlaybackEvent,
              );
              setPlayAudio(false);
            } catch (error) {
              console.log('error audio  ', error);
            }

            navigation.goBack();
          },
        },
        {
          text: 'Cancel',
          onPress: () => {
            console.log('Cancel Pressed');
          },
          style: 'cancel',
        },
      ]);

      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //! handle App In Background

  useEffect(() => {
    AppState.addEventListener('change', _handleAppStateChange);

    return () => {
      AppState.removeEventListener('change', _handleAppStateChange);
    };
  }, []);

  const _handleAppStateChange = nextAppState => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // console.log('App has come to the foreground!');
    }

    appState.current = nextAppState;
    setAppStateVisible(appState.current);
    // console.log('AppState', appState.current);
  };

  useEffect(() => {
    if (appStateVisible !== 'active') {
      try {
        audioRecorderPlayerRef.current.removePlayBackListener(onPlaybackEvent);
        setPlayAudio(false);
      } catch (error) {
        console.log('error tts ', error);
      }
    }
  }, [appStateVisible]);

  */

  useEffect(() => {
    if (
      currentDurationSec > 0 &&
      currentPositionSec > 0 &&
      currentDurationSec === currentPositionSec
    ) {
      onStopPlay();
    }
  }, [currentPositionSec, currentDurationSec]);

  const onStartPlay = async () => {
    //console.log(' is playing ', msgId); //audiopath

    var pathtemp = audiopath; //'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'; //'./src/assets/5mb-audio.mp3'; //path;

    //var tempPath = path + '/' + msgId + 'temp.mp3';

    console.log('onStartPlay path is ', pathtemp);

    audioRecorderPlayerRef.current.removePlayBackListener(onPlaybackEvent);

    try {
      const msg = await audioRecorderPlayerRef.current.startPlayer(pathtemp);

      //? Default path
      // const msg = await audioRecorderPlayer.startPlayer();
      const volume = await audioRecorderPlayerRef.current.setVolume(1.0);
      console.log(`path: ${msg}`, `volume: ${volume}`);

      // Register the listener on the specific instance of AudioRecorderPlayer
      audioRecorderPlayerRef.current.addPlayBackListener(onPlaybackEvent);

      setPlayAudio(true);
    } catch (err) {
      console.log('startPlayer error', err);
    }
  };

  const onStatusPress = e => {
    const touchX = e.nativeEvent.locationX;
    //console.log(`touchX: ${touchX}  `);

    //console.log(`widths : ${playerscreenWidth}  `);

    const playWidth =
      (currentPositionSec / currentDurationSec) * (playerscreenWidth - 10);
    // console.log(`currentPlayWidth: ${playWidth}`);

    const currentPosition = Math.round(currentPositionSec);

    var forwardSecs = 10000;

    if (currentDurationSec <= forwardSecs) {
      forwardSecs = 1000;
    } else if (
      currentDurationSec > 1000 * 60 * 1 &&
      currentDurationSec < 1000 * 60 * 5
    ) {
      forwardSecs = 10000;
    } else {
      forwardSecs = 15000;
    }

    if (playWidth && playWidth < touchX) {
      const addSecs = Math.round(currentPosition + forwardSecs);
      audioRecorderPlayerRef.current.seekToPlayer(addSecs);
      // console.log(`addSecs: ${addSecs}`);
    } else {
      const subSecs = Math.round(currentPosition - forwardSecs);
      audioRecorderPlayerRef.current.seekToPlayer(subSecs);
      // console.log(`subSecs: ${subSecs}`);
    }
  };

  const onPausePlay = async () => {
    await audioRecorderPlayerRef.current.pausePlayer();
    setPlayAudio(false);
  };

  const onResumePlay = async () => {
    await audioRecorderPlayerRef.current.resumePlayer();
    setPlayAudio(true);
  };

  const onStopPlay = async () => {
    console.log('onStopPlay');
    await audioRecorderPlayerRef.current.stopPlayer();
    audioRecorderPlayerRef.current.removePlayBackListener();
    setPlayAudio(false);
  };

  let playWidth = 0;

  if (currentDurationSec <= 0) {
    playWidth = 0;
  } else {
    playWidth =
      (currentPositionSec / currentDurationSec) * (playerscreenWidth - 10);
  }

  if (!playWidth) {
    playWidth = 0;
  }

  //console.log('play width ', playWidth);

  var timedata = new Date(timeIn);

  var content = (
    <View style={styles.conatinermain}>
      <View style={styles.container}>
        <View style={styles.tTsIcon}>
          {!playAudio ? (
            <TouchableOpacity
              onPress={onStartPlay}
              style={[
                playAudio ? styles.cardOn : styles.cardOff,
                styles.shadowProp,
              ]}>
              <Image style={styles.tTsimage} source={Play} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onStopPlay}
              style={[
                playAudio ? styles.cardOn : styles.cardOff,
                styles.shadowProp,
              ]}>
              <Image style={styles.tTsimage} source={Pause} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.viewPlayer}>
          <TouchableOpacity
            style={styles.viewBarWrapper}
            onPress={onStatusPress}>
            <View style={styles.viewBar}>
              <View style={[styles.viewBarPlay, {width: playWidth}]} />
            </View>
          </TouchableOpacity>
          <Text style={styles.txtCounter}>
            {playTime} / {duration}
          </Text>
        </View>
      </View>

      <View style={styles.bottomView}>
        <Text style={styles.bottomText}>
          {timedata.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
          })}
        </Text>
      </View>
    </View>
  );

  return content;
  /*

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.viewPlayer}>
        <TouchableOpacity style={styles.viewBarWrapper} onPress={onStatusPress}>
          <View style={styles.viewBar}>
            <View style={[styles.viewBarPlay, {width: playWidth}]} />
          </View>
        </TouchableOpacity>
        <Text style={styles.txtCounter}>
          {playTime} / {duration}
        </Text>
        <View style={styles.playBtnWrapper}>
          <Button onPress={onStartPlay} title="Play" />
          <Button onPress={onPausePlay} title="Pause" />
          <Button onPress={onResumePlay} title="Resume" />
          <Button onPress={onStopPlay} title="Stop" />
        </View>
      </View>
    </SafeAreaView>
  );
  */
};

export default AudioPlayerBubble;

const styles = StyleSheet.create({
  conatinermain: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#007AFF',
    marginTop: 5,
    borderRadius: 20,
    minWidth: 150 + 80,

    //width: 300,
  },

  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    // width: 150 + 80,
    height: 80,
  },

  viewPlayer: {
    flex: 3,
    marginTop: 30,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  viewBarWrapper: {
    marginTop: 2,
    marginHorizontal: 5,
    alignSelf: 'stretch',
  },
  viewBar: {
    backgroundColor: '#b3d9ff',
    height: 8,
    alignSelf: 'stretch',
  },
  viewBarPlay: {
    backgroundColor: 'white',
    height: 7,
    width: 0,
  },

  txtCounter: {
    marginTop: 12,
    color: 'white',
    fontSize: 10,
    textAlignVertical: 'center',
    fontWeight: '200',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 3,
  },

  tTsIcon: {
    flex: 1,
    marginLeft: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    height: 45,
    maxWidth: 45,
  },

  tTsimage: {
    width: 35,
    height: 35,
  },

  cardOff: {
    backgroundColor: '#ffcc80',
    borderRadius: 8,
    paddingVertical: 25,
    paddingHorizontal: 25,
    width: '100%',
    marginVertical: 10,
    flex: 1,
    margin: 2,
    marginRight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    //backgroundColor: 'transparent',
    height: 45,
    maxWidth: 45,
  },
  cardOn: {
    backgroundColor: '#ff8566',
    borderRadius: 8,
    paddingVertical: 25,
    paddingHorizontal: 25,
    width: '100%',
    marginVertical: 10,
    flex: 1,
    margin: 2,
    marginRight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    //backgroundColor: 'transparent',
    height: 45,
    maxWidth: 45,
  },

  bottomView: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 2,
    marginLeft: 10,
    marginBottom: 4,
  },
  bottomText: {
    margin: 1,
    color: '#fff',
    fontSize: 12,
    textAlignVertical: 'center',
    fontWeight: '200',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },
});
