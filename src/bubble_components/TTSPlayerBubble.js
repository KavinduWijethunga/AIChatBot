// import React in our code
import React, {useState, useEffect, useRef} from 'react';

import {
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

// import Tts Text to Speech
import Tts from 'react-native-tts';

import SpeakerOn from '../assets/speaker_on.png';
import SpeakerOff from '../assets/speaker_off.png';

const TTSPlayerBubble = ({textIn, timeIn, livePlay, navigation}) => {
  const [voices, setVoices] = useState([]);
  const [ttsStatus, setTtsStatus] = useState('initiliazing');
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [speechRate, setSpeechRate] = useState(0.5);
  const [speechPitch, setSpeechPitch] = useState(1);
  const [text, setText] = useState(textIn);

  const ttsRef = useRef(null);

  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  // useEffect(() => {
  //   console.log('MyComponent is loaded!', livePlay, ttsRef.current, ttsStatus);
  //   if (
  //     livePlay &&
  //     ttsRef.current &&
  //     (ttsStatus !== 'started' || ttsStatus === 'initiliazing')
  //   ) {
  //     //onTTsStart();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [livePlay, ttsRef.current]);

  const setUpInit = () => {
    //console.log('MyComponent is loaded!', livePlay);

    initTts().then(() => {
      if (livePlay && ttsRef.current) {
        console.log(
          'TTs Bubble Loaded After Init and play status ->',
          livePlay,
        );
        onTTsStart();
      }
    });
  };

  useEffect(() => {
    ttsRef.current = Tts;
    //const ttsRefCurrent = ttsRef.current;
    ttsRef.current.addEventListener('tts-start', _event =>
      setTtsStatus('started'),
    );
    ttsRef.current.addEventListener('tts-finish', _event =>
      setTtsStatus('finished'),
    );
    ttsRef.current.addEventListener('tts-cancel', _event =>
      setTtsStatus('cancelled'),
    );
    ttsRef.current.setDefaultRate(speechRate);
    ttsRef.current.setDefaultPitch(speechPitch);

    ttsRef.current.getInitStatus().then(setUpInit);

    return () => {
      try {
        if (ttsRef.current) {
          ttsRef.current.removeEventListener('tts-start', _event =>
            setTtsStatus('started'),
          );
          ttsRef.current.removeEventListener('tts-finish', _event =>
            setTtsStatus('finished'),
          );
          ttsRef.current.removeEventListener('tts-cancel', _event =>
            setTtsStatus('cancelled'),
          );
        }
      } catch (error) {
        console.log('error tts component unmount  ', error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initTts = async () => {
    const voices = await ttsRef.current.voices();
    const availableVoices = voices
      .filter(v => !v.networkConnectionRequired && !v.notInstalled)
      .map(v => {
        return {id: v.id, name: v.name, language: v.language};
      });
    let selectedVoice = null;

    //console.log('Available voices:', availableVoices);

    if (voices && voices.length > 0) {
      selectedVoice = voices[0].id;
      try {
        //await ttsRef.current.setDefaultLanguage(voices[0].language);
        await ttsRef.current.setDefaultLanguage('en-US');
      } catch (err) {
        //Samsung S9 has always this error:
        //"Language is not supported"
        console.log('setDefaultLanguage error ', err);
      }
      //await ttsRef.current.setDefaultVoice('en-us-x-iol-local');
      await Tts.setDefaultVoice(voices[0].id);
      //await ttsRef.current.setDefaultVoice('com.apple.ttsbundle.Moira-compact');
      setVoices(availableVoices);
      setSelectedVoice(selectedVoice);
      setTtsStatus('initialized');
    } else {
      setTtsStatus('initialized');
    }
  };

  const onTTsStart = async () => {
    ttsRef.current.stop();
    ttsRef.current.speak(text);
  };

  const onTTsStop = async () => {
    ttsRef.current.stop();
  };

  var timedata = new Date(timeIn);

  var content = (
    <View style={styles.conatinermain}>
      <View style={styles.container}>
        <View style={styles.txtTtsview}>
          <Text style={styles.txtTTs}>{text}</Text>
        </View>
        <View style={styles.tTsIcon}>
          {ttsStatus === 'started' ? (
            <TouchableOpacity
              onPress={onTTsStop}
              style={[
                ttsStatus === 'started' ? styles.cardOn : styles.cardOff,
                styles.shadowProp,
              ]}>
              <Image style={styles.tTsimage} source={SpeakerOff} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onTTsStart}
              style={[
                ttsStatus === 'started' ? styles.cardOn : styles.cardOff,
                styles.shadowProp,
              ]}>
              <Image style={styles.tTsimage} source={SpeakerOn} />
            </TouchableOpacity>
          )}
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
};

export default TTSPlayerBubble;

const styles = StyleSheet.create({
  conatinermain: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#F0F0F0',
    marginTop: 5,
    borderRadius: 20,
    //maxHeight: 40,
    minWidth: 150 + 80,
  },
  container: {
    flex: 1,

    flexDirection: 'row',
    alignItems: 'center',
  },
  txtTtsview: {
    flex: 3,
    margin: 5,
    width: '100%',
    alignItems: 'center',
    minWidth: 150,
    maxWidth: 150,
  },
  txtTTs: {
    margin: 1,
    color: '#000',
    fontSize: 15,
    textAlignVertical: 'center',
    fontWeight: '200',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },

  tTsIcon: {
    flex: 1,
    margin: 2,
    marginLeft: 25,
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

  shadowProp: {
    shadowColor: '#171717',
    shadowOffset: {width: -2, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 3,
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
    color: '#b8b894',
    fontSize: 12,
    textAlignVertical: 'center',
    fontWeight: '200',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },
});
