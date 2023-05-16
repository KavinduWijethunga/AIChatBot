import React, {useState, useCallback, useEffect, useRef} from 'react';

import {GiftedChat, Bubble, Composer} from 'react-native-gifted-chat';

import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';

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
  PanResponder,
  Animated,
} from 'react-native';

import RNFetchBlob from 'rn-fetch-blob';

import io from 'socket.io-client';

import Spinner from 'react-native-loading-spinner-overlay';

import Logo from '../basic_components/Logo';
import Header from '../basic_components/Header';
import BackButton from '../basic_components/BackButton';
import BackgroundChat from '../basic_components/BackgroundChat';

import Paragraph from '../basic_components/Paragraph';

import AudioPlayerBubble from '../bubble_components/AudioPlayerBubble';
import TTSPlayerBubble from '../bubble_components/TTSPlayerBubble';

import MicOn from '../assets/mic_on.png';
import MicOff from '../assets/mic_off.png';

export default function ChatTestScreen({navigation, route}) {
  const username = route.params.username;
  const userid = route.params.userid;

  const CHAT_SERVER_URL = `http://${route.params.ip}:5000`;

  const userFile = username + '_' + userid.toString() + '_chat_history';

  const [mentalStatus, setMentalStatus] = useState('Not Analyzed');

  const [messages, setMessages] = useState([]);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [allMessagesLoaded, setAllMessagesLoaded] = useState(false);
  const [messageLimit, setMessageLimit] = useState(10);
  const [premessageLimit, setPreMessageLimit] = useState(0);

  const socketRef = useRef();

  const [loading, setLoading] = useState(false);
  const [spinnerTxt, setSpinnerTxt] = useState(' Loading ... ');

  //!========== Audio Status ==========

  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  const audioRecorderPlayerRef = useRef(null);

  const [recordTime, setrecordTime] = useState(0);
  const [recordSecs, setrecordSecs] = useState('00:00:00');

  const [mainAudioPath, setMainAudioPath] = useState(null);

  const [currentAudioID, setCurrentAudioID] = useState(null);

  const [isRecording, setRecording] = useState(false);

  //!  tets

  //! ============= Handle Chats ===========

  useEffect(() => {
    socketRef.current = io.connect(CHAT_SERVER_URL);

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      socketRef.current.emit('join room', {
        username,
        userid,
        userFile,
      });
    });

    socketRef.current.on('bot response', response => {
      setMessages(prevMessages => GiftedChat.append(prevMessages, response));
    });

    socketRef.current.on('mental response', response => {
      setMentalStatus(response.toString());
    });

    return () => {
      socketRef.current.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSend = useCallback((msg = []) => {
    //console.log(msg[0]);

    const message = {};
    message._id = msg[0]._id;
    message.createdAt = msg[0].createdAt;
    message.user = {
      _id: msg[0].user._id,
      name: msg[0].user.name,
      avatar: msg[0].user.avatar,
    };
    message.text = msg[0].text;
    message.audio = '';
    message.messageType = 'message';

    //* add message type
    msg[0].messageType = 'message';

    setMessages(previousMessages => GiftedChat.append(previousMessages, msg));

    var userMSG = {
      giftedchatmessage: message,
      username: username,
      userid: userid,
      userFile: userFile,
      audiobase64msg: '',
    };

    socketRef.current.emit('user message', userMSG);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //*get chat history promise

  const timeoutPromise = timeout => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timed out after ${timeout} ms`));
      }, timeout);
    });
  };

  const fetchWithTimeout = (url, options, timeout = 3000) => {
    return Promise.race([fetch(url, options), timeoutPromise(timeout)]);
  };

  useEffect(() => {
    pingIpAddress(route.params.ip)
      .then(time => {
        console.log(`Ping response time: ${time}ms`);

        setSpinnerTxt(' Getting if any Previous Messages ...');
        setLoading(true);

        getChatHistory();
      })
      .catch(error => {
        console.error(`Ping error: ${error.message}`);
        Alert.alert('App Info', 'Server Not Connected Check Connections ', [
          // {
          //   text: 'Cancel',
          //   onPress: () => {
          //     console.log('Cancel Pressed');
          //   },
          //   style: 'cancel',
          // },
          {
            text: 'Ok',
            onPress: () => {
              console.log('Ok Pressed');
            },
          },
        ]);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pingIpAddress = ipAddress => {
    try {
      return new Promise((resolve, reject) => {
        const start = new Date().getTime();
        const timeout = 3000; // 3 seconds timeout

        fetch(`http://${ipAddress}:5000`, {
          method: 'GET',
          cache: 'no-store',
          mode: 'no-cors',
        })
          .then(response => {
            const end = new Date().getTime();
            const time = end - start;
            resolve(time);
          })
          .catch(error => {
            reject(error);
          });

        setTimeout(() => {
          reject(new Error('Request timed out'));
        }, timeout);
      });
    } catch (error) {
      console.log(`Error pinging IP address: ${error}`);
    }
  };

  async function checkFileExists(filePath) {
    try {
      const exist = await RNFetchBlob.fs.exists(filePath);
      return exist;
    } catch (error) {
      console.error(error);
      return false; // or throw the error
    }
  }

  const filterMessages = async message => {
    if (message.audio !== '') {
      const fileExists = await checkFileExists(message.audio);

      var msgObj = {
        _id: message._id,
        text: fileExists ? '' : 'Erro Audio File Not Found in device',
        audio: fileExists ? message.audio : '',
        messageType: fileExists ? message.messageType : 'error',
        createdAt: new Date(message.createdAt),
        user: {
          _id: message.user._id,
          name: message.user.name,
          avatar: message.user.avatar,
        },
      };

      return msgObj;
    } else {
      var msgObj = {
        _id: message._id,
        text: message.text ? message.text : '',
        audio: message.audio ? message.audio : '',
        messageType: message.messageType,
        createdAt: new Date(message.createdAt),
        user: {
          _id: message.user._id,
          name: message.user.name,
          avatar: message.user.avatar,
        },
      };

      return msgObj;
    }
  };

  const getChatHistory = async () => {
    try {
      const response = await fetchWithTimeout(
        `http://${route.params.ip}:5000/chat_history`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pre_chat_limit: Number(premessageLimit),
            chat_limit: Number(messageLimit),
            username,
            userid,
            userFile,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const chatHistory = data; //.reverse();

      setLoading(false);

      // console.log('chat history read -> ', chatHistory);

      if (chatHistory.length > 0) {
        const newMessages = await Promise.all(chatHistory.map(filterMessages));

        //console.log(newMessages);

        setMessages(previousMessages =>
          GiftedChat.prepend(previousMessages, newMessages),
        );
      } else {
        setAllMessagesLoaded(true);
      }
    } catch (error) {
      setLoading(false);
      console.error(error.toString());

      Alert.alert('Chat Info', error.toString(), [
        // {
        //   text: 'Go Back',
        //   onPress: () => {
        //     navigation.goBack();
        //   },
        //   style: 'cancel',
        // },
        {
          text: 'OK',
          onPress: () => {
            console.log('OK Pressed');
          },
        },
      ]);
    }
  };

  const onLoadEarlier = () => {
    if (isLoadingEarlier || allMessagesLoaded) {
      return;
    }

    setIsLoadingEarlier(true);

    setPreMessageLimit(messageLimit);
    setMessageLimit(prevLimit => prevLimit + 10);
  };

  useEffect(() => {
    if (isLoadingEarlier) {
      pingIpAddress(route.params.ip)
        .then(time => {
          console.log(`Ping response time: ${time}ms`);

          // setSpinnerTxt(' Getting Previous Messages ...');
          // setLoading(true);

          getChatHistory().then(() => {
            setIsLoadingEarlier(false);
          });
        })
        .catch(error => {
          console.error(`Ping error: ${error.message}`);
          Alert.alert('App Info', 'Server Not Connected Check Connections ', [
            // {
            //   text: 'Cancel',
            //   onPress: () => {
            //     console.log('Cancel Pressed');
            //   },
            //   style: 'cancel',
            // },
            {
              text: 'Ok',
              onPress: () => {
                console.log('Ok Pressed');
              },
            },
          ]);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingEarlier]);

  //* handle back button pressed
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress,
    );

    return () => backHandler.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBackPress = () => {
    // Handle the back button press event
    // For example, navigate to the previous screen or show an alert dialog

    Alert.alert('User Logout', 'Do you want to Log out', [
      {
        text: 'Log out',
        onPress: () => {
          console.log('Cancel Pressed');

          socketRef.current.disconnect();
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

    return true; // Return true to prevent default behavior (exit the app)
  };

  const handleBackCustom = () => {
    Alert.alert('User Logout', 'Do you want to Log out', [
      {
        text: 'Log out',
        onPress: () => {
          console.log('Cancel Pressed');

          socketRef.current.disconnect();
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
  };

  //! ============= Handle Audio ===========

  useEffect(() => {
    const dirs = RNFetchBlob.fs.dirs;

    const path = Platform.select({
      ios: undefined,
      //android: undefined,

      // Discussion: https://github.com/hyochan/react-native-audio-recorder-player/discussions/479
      // ios: 'https://firebasestorage.googleapis.com/v0/b/cooni-ebee8.appspot.com/o/test-audio.mp3?alt=media&token=d05a2150-2e52-4a2e-9c8c-d906450be20b',
      // ios: 'https://staging.media.ensembl.fr/original/uploads/26403543-c7d0-4d44-82c2-eb8364c614d0',
      // ios: 'hello.m4a',
      android: `${dirs.CacheDir}`,
      //android: `${dirs.CacheDir}/hello.mp3`,
    });

    setMainAudioPath(path);

    audioRecorderPlayerRef.current = new AudioRecorderPlayer();

    audioRecorderPlayerRef.current.setSubscriptionDuration(0.1);

    //console.error(' permisiion error on load ');

    return () => {
      audioRecorderPlayerRef.current.removeRecordBackListener(
        onRecordPlaybackEvent,
      );
      setrecordSecs(0);
      setrecordTime(audioRecorderPlayerRef.current.mmssss(Math.floor(0)));
    };
  }, []);

  const onRecordPlaybackEvent = e => {
    // console.log('RecordPlayback event occurred', e);

    setrecordSecs(e.currentPosition);
    setrecordTime(
      audioRecorderPlayerRef.current.mmssss(Math.floor(e.currentPosition)),
    );
  };

  // useEffect(() => {
  //   AppState.addEventListener('change', _handleAppStateChange);

  //   return () => {
  //     AppState.removeEventListener('change', _handleAppStateChange);
  //   };
  // }, []);

  // const _handleAppStateChange = nextAppState => {
  //   if (
  //     appState.current.match(/inactive|background/) &&
  //     nextAppState === 'active'
  //   ) {
  //     console.log('App has come to the foreground!');
  //   }

  //   appState.current = nextAppState;
  //   setAppStateVisible(appState.current);
  //   console.log('AppState', appState.current);
  // };

  // useEffect(() => {
  //   if (appStateVisible !== 'active') {
  //     if (audioRecorderPlayer) {
  //       // onStopPlay();
  //       // setcurrentPositionSec('00:00:00');
  //       // setplayTime(0);
  //       // audioRecorderPlayer.seekToPlayer(0);
  //     }
  //   }
  // }, [appStateVisible]);

  // useEffect(() => {
  //   const backAction = () => {
  //     console.log('Back button pressed');
  //     if (audioRecorderPlayer) {
  //       // onStopPlay();
  //       // setcurrentPositionSec('00:00:00');
  //       // setplayTime(0);
  //       // audioRecorderPlayer.seekToPlayer(0);
  //     }
  //     return true;
  //   };

  //   const backHandler = BackHandler.addEventListener(
  //     'hardwareBackPress',
  //     backAction,
  //   );

  //   return () => backHandler.remove();
  // }, []);

  const handleAvatarPress = user => {
    // add navigation to user's profile
    console.log(user._id);
  };

  const messageIdGenerator = () => {
    try {
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        c => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        },
      );

      //uuid = null;

      if (!uuid) {
        throw new Error('Failed to generate UUID');
      }

      return uuid;
    } catch (error) {
      // generates uuid.
      console.error(' error id creating ', error.toString());
      return null;
    }
  };

  const renderAudioMsg = (props, uuidtemp) => {
    var content = null;

    console.log('render audio  is playing and id  ', props.currentMessage._id);

    content = (
      <AudioPlayerBubble
        key={props.currentMessage._id}
        //audioRecorderPlayer={audioRecorderPlayer}
        //msgId={props.currentMessage._id}
        audiopath={props.currentMessage.audio}
        timeIn={props.currentMessage.createdAt}
        navigation={navigation}
        // isAudioPlay={playAudio}
        // setupAudioPlay={val => setPlayAudio(val)}
        // currentAudioID={currentAudioID}
      />
    );

    return content;
  };

  const renderTTsMsg = (props, uuidtemp) => {
    const isLivePlay = props.currentMessage.messageLive ? true : false;

    var content = <View />;

    content = (
      <TTSPlayerBubble
        key={props.currentMessage._id}
        textIn={props.currentMessage.text}
        timeIn={props.currentMessage.createdAt}
        livePlay={isLivePlay}
        navigation={navigation}
      />
    );

    return content;
  };

  const renderMyBubble = props => {
    //console.log('props data -> ', props.currentMessage.messageType);
    var content = null;

    const uuidtemp = props.currentMessage._id;

    if (props.currentMessage.messageType === 'audio') {
      content = (
        <View
          key={uuidtemp}
          style={styles.bubleView}
          accessibilityElementsHidden={true}>
          {renderAudioMsg(props, uuidtemp)}
        </View>
      );
    } else if (props.currentMessage.messageType === 'tts') {
      content = (
        <View
          key={uuidtemp}
          style={styles.bubleView}
          accessibilityElementsHidden={true}>
          {renderTTsMsg(props, uuidtemp)}
        </View>
      );
    } else if (props.currentMessage.messageType === 'error') {
      content = (
        <View
          key={uuidtemp}
          style={styles.bubleView}
          accessibilityElementsHidden={true}>
          <Bubble
            {...props}
            wrapperStyle={styles.bubleWrapper}
            textStyle={styles.bubletextStyleErro}
          />
        </View>
      );
    } else {
      content = (
        <View
          key={uuidtemp}
          style={styles.bubleView}
          accessibilityElementsHidden={true}>
          <Bubble
            {...props}
            wrapperStyle={styles.bubleWrapper}
            textStyle={styles.bubletextStyle}
          />
        </View>
      );
    }

    return content;
  };

  //* User audio Records Controller
  const onStartRecord = async () => {
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
        } else {
          console.log('All required permissions not granted');

          return;
        }
      } catch (err) {
        console.warn(err);

        return;
      }
    }

    const audioSet = {
      AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
      AudioSourceAndroid: AudioSourceAndroidType.MIC,
      AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
      AVNumberOfChannelsKeyIOS: 2,
      AVFormatIDKeyIOS: AVEncodingOption.aac,
      OutputFormatAndroid: OutputFormatAndroidType.AAC_ADTS,
    };

    console.log('audioSet', audioSet);

    const msgid = messageIdGenerator();

    setCurrentAudioID(msgid);

    var tempPath = mainAudioPath + '/' + msgid + 'temp.mp3';

    const uri = await audioRecorderPlayerRef.current.startRecorder(
      tempPath,
      audioSet,
    );

    console.log(`uri: ${uri}`);

    audioRecorderPlayerRef.current.addRecordBackListener(onRecordPlaybackEvent);

    setRecording(true);
  };

  const onPauseRecord = async () => {
    try {
      const r = await audioRecorderPlayerRef.current.pauseRecorder();
      console.log(r);
    } catch (err) {
      console.log('pauseRecord', err);
    }
  };

  const onResumeRecord = async () => {
    await audioRecorderPlayerRef.current.resumeRecorder();
  };

  const onStopRecord = async () => {
    const result = await audioRecorderPlayerRef.current.stopRecorder();
    audioRecorderPlayerRef.current.removeRecordBackListener(
      onRecordPlaybackEvent,
    );
    setrecordSecs(0);
    setrecordTime(audioRecorderPlayerRef.current.mmssss(Math.floor(0)));
    console.log(result);

    setRecording(false);

    const message = {};
    message._id = currentAudioID;
    message.createdAt = Date.now();
    message.user = {
      _id: 1,
      name: 'Current User',
      avatar: 'https://picsum.photos/id/338/200/300',
    };
    message.text = '';
    message.audio = mainAudioPath + '/' + currentAudioID + 'temp.mp3';
    message.messageType = 'audio';

    console.log(' audio msg ', message);

    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, message),
    );

    try {
      var mp3file = mainAudioPath + '/' + currentAudioID + 'temp.mp3';
      //convertToWav(mp3file);
      audioSendsocket(message, mp3file);
    } catch (error) {
      console.log(' test errro ', error);
    }
  };

  const audioSendsocket = async (message, mp3Path) => {
    const mp3base64 = await RNFetchBlob.fs.readFile(mp3Path, 'base64');

    var userMSG = {
      giftedchatmessage: message,
      username: username,
      userid: userid,
      userFile: userFile,
      audiobase64msg: mp3base64,
    };

    socketRef.current.emit('user message', userMSG);
  };

  const renderMicOnChat = () => {
    var content = (
      <View
        style={
          !isRecording ? styles.recordContainerStop : styles.recordContainerPlay
        }
        accessibilityElementsHidden={true}>
        <View style={styles.viewRecorderText}>
          <Text
            style={
              !isRecording
                ? styles.txtRecordCounterStop
                : styles.txtRecordCounterPlay
            }>
            {!isRecording ? recordTime : `Recording.. ${recordTime}`}
          </Text>
        </View>
        <View style={styles.viewRecorderIcon}>
          <TouchableOpacity
            onPressIn={onStartRecord}
            onPressOut={onStopRecord}
            style={[styles.card, styles.shadowProp]}>
            {!isRecording ? (
              <Image style={styles.recordimage} source={MicOn} />
            ) : (
              <Image style={styles.recordimage} source={MicOff} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
    return content;
  };

  /*

              {!isRecording ? (
              <Image style={styles.recordimage} source={MicOn} />
            ) : (
              <Image style={styles.recordimage} source={MicOff} />
            )}

          <TouchableOpacity
            onPressIn={onStartRecord}
            onPressOut={onStopRecord}
            style={[styles.card, styles.shadowProp]}>
            {!isRecording ? (
              <Image style={styles.recordimage} source={MicOn} />
            ) : (
              <Image style={styles.recordimage} source={MicOff} />
            )}
          </TouchableOpacity>


          {!isRecording ? (
            <TouchableOpacity
              onPress={onStartRecord}
              style={[styles.card, styles.shadowProp]}>
              <Image style={styles.recordimage} source={MicOn} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onStopRecord}
              style={[styles.card, styles.shadowProp]}>
              <Image style={styles.recordimage} source={MicOff} />
            </TouchableOpacity>
          )}


*/

  /*
  var tests = (
    <BackgroundChat>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          width: '100%',
          justifyContent: 'center',
        }}>
        <TouchableOpacity {...panResponder.panHandlers}>
          <View
            style={{
              backgroundColor: isDragging ? 'red' : 'green',
              padding: 20,
            }}>
            <Text style={{color: 'white'}}>Drag me to the left!</Text>
          </View>
        </TouchableOpacity>
      </View>
    </BackgroundChat>
  );
  */

  var maincontent = (
    <>
      <BackgroundChat>
        <BackButton goBack={handleBackCustom} />
        <Logo />
        <Header> Hey {route.params.username} what's on your mind </Header>
        <Paragraph> Your mentality status : {mentalStatus}</Paragraph>
        <Spinner
          visible={loading}
          textContent={spinnerTxt}
          textStyle={styles.spinnerTextStyle}
          color={styles.spinnerColor}
          overlayColor={styles.spinnerOverlay.color}
        />
        <View
          style={styles.giftViewcontainer}
          accessibilityElementsHidden={true}>
          <GiftedChat
            messages={messages}
            renderBubble={renderMyBubble}
            onSend={msg => onSend(msg)}
            isAnimated
            showUserAvatar
            onPressAvatar={handleAvatarPress}
            user={{
              _id: 1,
              name: 'Current User',
              avatar: 'https://picsum.photos/id/338/200/300',
            }}
            renderComposer={props => (
              <Composer textInputStyle={styles.textInputColor} {...props} />
            )}
            renderChatFooter={renderMicOnChat}
            loadEarlier={!allMessagesLoaded}
            onLoadEarlier={onLoadEarlier}
            isLoadingEarlier={isLoadingEarlier}
          />
        </View>
      </BackgroundChat>
    </>
  );

  return maincontent;
}

const styles = StyleSheet.create({
  bubleView: {maxWidth: 230},

  bubleWrapper: {
    right: {
      backgroundColor: '#007AFF',
    },
    left: {
      backgroundColor: '#F0F0F0',
    },
  },
  bubletextStyle: {
    right: {
      color: '#fff',
    },
    left: {
      color: '#000',
    },
  },

  bubletextStyleErro: {
    right: {
      color: '#ff1a1a',
    },
    left: {
      color: '#ff1a1a',
    },
  },
  recordContainerPlay: {
    flex: 1,
    backgroundColor: '#ffcccc',
    flexDirection: 'row',
    alignItems: 'center',
    height: 70,
    maxHeight: 70,
    bottom: 2,
    top: 5,
  },
  recordContainerStop: {
    flex: 1,
    backgroundColor: '#80aaff',
    flexDirection: 'row',
    alignItems: 'center',
    height: 70,
    maxHeight: 70,
    bottom: 2,
    top: 5,
  },

  txtRecordCounterPlay: {
    margin: 2,
    color: '#000',
    fontSize: 20,
    textAlignVertical: 'center',
    fontWeight: '200',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 3,
  },
  txtRecordCounterStop: {
    margin: 2,
    color: '#fff',
    fontSize: 18,
    textAlignVertical: 'center',
    fontWeight: '400',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 3,
  },

  viewRecorderText: {
    flex: 3,
    marginTop: 2,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    //color: '#000',
  },

  viewRecorderIcon: {
    flex: 3,
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    height: 45,
    maxWidth: 45,
  },

  card: {
    backgroundColor: 'white',
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

  recordimage: {
    width: 35,
    height: 35,
  },

  //* Gifted chat data
  textInputColor: {
    color: 'black',
  },
  giftViewcontainer: {
    flex: 1,
    padding: 2,
    width: '100%',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 10,
    // ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  spinnerTextStyle: {
    color: '#FFF',
  },

  spinnerColor: {
    color: '#3333cc',
  },

  spinnerOverlay: {
    color: 'rgba(0, 0, 0, 0.75)',
  },
});
