import firebase from 'firebase/app';

const {
  REACT_APP_apiKey: apiKey,
  REACT_APP_authDomain: authDomain,
  REACT_APP_databaseURL: databaseURL,
  REACT_APP_projectId: projectId,
  REACT_APP_storageBucket: storageBucket,
  REACT_APP_messagingSenderId: messagingSenderId,
  REACT_APP_appId: appId,
} = process.env;

const firebaseConfig = {
  apiKey,
  authDomain,
  databaseURL,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

firebase.initializeApp(firebaseConfig);

const setRealViewportHeight = () => {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

setRealViewportHeight();

window.addEventListener('resize', setRealViewportHeight);
