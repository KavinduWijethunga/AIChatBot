import React, {useState, useEffect} from 'react';
import {StyleSheet, Alert} from 'react-native';
import Background from '../basic_components/Background';
import Logo from '../basic_components/Logo';
import Header from '../basic_components/Header';
import Button from '../basic_components/Button';
import TextInput from '../basic_components/TextInput';
import BackButton from '../basic_components/BackButton';
import {theme} from '../core/theme';
import {emailValidator} from '../helpers/emailValidator';
import {passwordValidator} from '../helpers/passwordValidator';
import {ipAddressValidator} from '../helpers/ipAddressValidator';

import {TextInput as TextInput2} from 'react-native-paper';

import Spinner from 'react-native-loading-spinner-overlay';

import AsyncStorage from '@react-native-async-storage/async-storage';

import NetInfo from '@react-native-community/netinfo';

import hide from '../assets/hide.png';
import view from '../assets/view.png';

export default function LoginScreen({navigation}) {
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const [email, setEmail] = useState({
    value: '',
    error: '',
  });
  const [password, setPassword] = useState({
    value: '',
    error: '',
  });
  const [ipAddress, setIPAddress] = useState({
    value: '',
    error: '',
  });

  const [loading, setLoading] = useState(false);
  const [spinnerTxt, setSpinnerTxt] = useState(' Loading ... ');

  // Retrieve an integer value
  const getValueAsyncStorage = async key => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        console.log('Value retrieved successfully:', value);
        return value;
      } else {
        console.log('No value  found.');
        return null;
      }
    } catch (error) {
      console.log('Error retrieving value :', error);
      return null;
    }
  };

  useEffect(() => {
    //get user email

    const getipSaved = async () => {
      const hostIpRead = await getValueAsyncStorage('hostip');

      console.log(' value host ip read -> ', hostIpRead, typeof hostIpRead);

      if (hostIpRead) {
        setIPAddress({
          value: hostIpRead,
          error: '',
        });
      }
    };

    getipSaved();
  }, []);

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

  const loggedInApi = async () => {
    try {
      // console.log({
      //   ipAddress,
      // });

      const em = email.value;
      const pass = password.value;
      const ip = ipAddress.value;

      //console.log('test 0');

      const response = await fetchWithTimeout(`http://${ip}:5000/login_user`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          em,
          pass,
        }),
      });

      //console.log('test 1');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const results = await response.json();

      setLoading(false);

      if (results.status === 200) {
        console.log(results.status, results.userId, results.userName);

        try {
          await AsyncStorage.setItem('username', results.userName);
          console.log('Username saved successfully.');

          try {
            await AsyncStorage.setItem('userid', results.userId.toString());
            console.log('User Id  saved successfully.');

            try {
              await AsyncStorage.setItem('hostip', ip);
              console.log('Host ip saved successfully.');

              //! All savings done

              // navigation.reset({
              //   index: 0,
              //   routes: [
              //     {
              //       name: 'ChatBotScreen',
              //       params: {
              //         username: results.userName,
              //         userid: results.userId,
              //         ip: ip,
              //       },
              //     },
              //   ],
              // });

              navigation.navigate('ChatTestScreen', {
                username: results.userName,
                userid: results.userId,
                ip: ip,
              });
            } catch (error) {
              console.log('Error saving host ip :', error);

              Alert.alert('App Info', `Error saving host ip : ${error}`, [
                {
                  text: 'Go Back',
                  onPress: () => {
                    console.log('Cancel Pressed');
                  },
                  style: 'cancel',
                },
                {
                  text: 'OK',
                  onPress: () => {
                    console.log('OK Pressed');
                  },
                },
              ]);
            }
          } catch (error) {
            console.log('Error saving user Id :', error);

            Alert.alert('User Info', `Error saving user id : ${error}`, [
              {
                text: 'Go Back',
                onPress: () => {
                  console.log('Cancel Pressed');
                },
                style: 'cancel',
              },
              {
                text: 'OK',
                onPress: () => {
                  console.log('OK Pressed');
                },
              },
            ]);
          }
        } catch (error) {
          console.log('Error saving username:', error);

          Alert.alert('User Info', `Error saving username: ${error}`, [
            {
              text: 'Go Back',
              onPress: () => {
                console.log('Cancel Pressed');
              },
              style: 'cancel',
            },
            {
              text: 'OK',
              onPress: () => {
                console.log('OK Pressed');
              },
            },
          ]);
        }
      } else {
        Alert.alert('User Login', results.message, [
          {
            text: 'Go Back',
            onPress: () => {
              // console.log('Cancel Pressed');
              navigation.goBack();
            },
            style: 'cancel',
          },
          {
            text: 'OK',
            onPress: () => {
              console.log('OK Pressed');
            },
          },
        ]);
      }
    } catch (error) {
      setLoading(false);
      console.error(' error login ', error.toString());

      Alert.alert('User Login', error.toString(), [
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

  const onLoginPressed = async () => {
    checkInternetConnectivity()
      .then(isConnected => {
        console.log('Internet connectivity status:', isConnected);
      })
      .catch(error => {
        console.log('Error:', error);
        Alert.alert('App Info', 'No Internet Conneted ', [
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

        return;
      });

    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);
    const ipAddressError = ipAddressValidator(ipAddress.value);

    if (emailError || passwordError || ipAddressError) {
      setEmail({
        ...email,
        error: emailError,
      });
      setPassword({
        ...password,
        error: passwordError,
      });
      setIPAddress({
        ...ipAddress,
        error: ipAddressError,
      });
      return;
    }

    setSpinnerTxt(' Wait User Logging In ...');
    setLoading(true);
    // setTimeout(() => {
    //   setLoading(false);
    // }, 3000);

    loggedInApi();
    // navigation.reset({
    //   index: 0,
    //   routes: [{name: 'Dashboard'}],
    // });
  };

  const checkInternetConnectivity = () => {
    return new Promise((resolve, reject) => {
      NetInfo.fetch()
        .then(state => {
          if (state.isConnected) {
            console.log('Internet is connected');
            resolve(true);
          } else {
            console.log('Internet is not connected');
            resolve(false);
          }
        })
        .catch(error => {
          console.log('Error checking internet connectivity:', error);
          reject(error);
        });
    });
  };

  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      <Logo />
      <Header> Login for AI Adventure </Header>
      <Spinner
        visible={loading}
        textContent={spinnerTxt}
        textStyle={styles.spinnerTextStyle}
        color={styles.spinnerColor}
        overlayColor={styles.spinnerOverlay.color}
      />
      <TextInput
        label="Email"
        returnKeyType="next"
        value={email.value}
        onChangeText={text =>
          setEmail({
            value: text,
            error: '',
          })
        }
        error={!!email.error}
        errorText={email.error}
        autoCapitalize="none"
        autoCompleteType="email"
        textContentType="emailAddress"
        keyboardType="email-address"
      />
      <TextInput
        label="Password"
        returnKeyType="next"
        value={password.value}
        onChangeText={text =>
          setPassword({
            value: text,
            error: '',
          })
        }
        error={!!password.error}
        errorText={password.error}
        secureTextEntry={secureTextEntry}
        right={
          <TextInput2.Icon
            icon={secureTextEntry ? hide : view}
            onPress={() => {
              setSecureTextEntry(!secureTextEntry);
              return false;
            }}
          />
        }
      />
      <TextInput
        label="IpAddress"
        returnKeyType="done"
        value={ipAddress.value}
        onChangeText={text =>
          setIPAddress({
            value: text,
            error: '',
          })
        }
        error={!!ipAddress.error}
        errorText={ipAddress.error}
        autoCapitalize="none"
        keyboardType="numeric"
        maxLength={15}
      />

      <Button mode="contained" onPress={onLoginPressed}>
        Login
      </Button>
    </Background>
  );
}

const styles = StyleSheet.create({
  forgotPassword: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    marginTop: 4,
  },
  forgot: {
    fontSize: 13,
    color: theme.colors.secondary,
  },
  link: {
    fontWeight: 'bold',
    color: theme.colors.primary,
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
