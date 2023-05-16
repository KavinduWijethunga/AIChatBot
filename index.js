/**
 * @format
 */

import {AppRegistry} from 'react-native';

// import {LogBox} from 'react-native';
// LogBox.ignoreLogs(['new NativeEventEmitter']);

import AppJs from './AppJs.js';

//import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => AppJs);
