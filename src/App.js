import React, { useState, useEffect } from 'react';
import './App.css';
import './initialize';
import firebase from 'firebase/app';
import 'firebase/database';
import Timer from 'components/Timer';
import parseQueryString from 'utils/parseQueryString';
import LoadingOverlay from 'components/LoadingOverlay';
import AboutMe from 'components/AboutMe';

function App() {
  const [selectedTimerName, setSelectedTimerName] = useState(null);
  const [timerData, setTimerData] = useState(null);
  const [timerVisible, setTimerVisible] = useState(false);
  const [timerName, setTimerName] = useState('');
  const [recentTimers, setRecentTimers] = useState([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (selectedTimerName) {
      firebase
        .database()
        .ref(`/timers/${selectedTimerName}`)
        .on('value', snapshot => {
          const timerData = snapshot.val();

          setTimerData(timerData);
          setTimerVisible(true);
        });
      setTimerName('');

      setRecentTimers(rt => {
        if (rt.includes(selectedTimerName)) {
          const foundIndex = rt.indexOf(selectedTimerName);
          const clone = [...rt];
          clone.splice(foundIndex, 1);

          return [...clone, selectedTimerName];
        } else {
          const rememberCount = 3;
          if (rt.length >= rememberCount) {
            return [...rt.slice(1, rememberCount), selectedTimerName];
          } else {
            return [...rt, selectedTimerName];
          }
        }
      });

      window.history.replaceState({}, document.title, '/?timer=' + selectedTimerName);
    } else {
      if (initialized) {
        window.history.replaceState({}, document.title, '/');
      } else {
        setInitialized(true);
      }
    }
  }, [selectedTimerName, initialized]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('recentTimers')) || [];
    setRecentTimers(data);

    const params = parseQueryString();

    if (params.timer) {
      setSelectedTimerName(params.timer);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('recentTimers', JSON.stringify(recentTimers));
  }, [recentTimers]);

  const selectTimer = async () => {
    if (timerName.length > 0) {
      setSelectedTimerName(timerName);
    }
  };

  const goBack = () => {
    firebase
      .database()
      .ref(`/timers/${selectedTimerName}`)
      .off();

    setTimerVisible(false);
    setSelectedTimerName(null);
  };

  const handleInputKeyDown = e => {
    switch (e.key) {
      case ' ':
        e.preventDefault();
        break;
      case 'Enter':
        selectTimer();
        break;
      default:
        break;
    }
  };

  const handleInputChange = e => {
    setTimerName(e.target.value);
  };

  return (
    <div className="App">
      <LoadingOverlay loading={Boolean(!timerVisible && selectedTimerName)} />
      <header className="App-container">
        {timerVisible ? (
          <Timer name={selectedTimerName} timerData={timerData} goBack={goBack} />
        ) : (
          <div className="landing">
            <div className="title">
              <div className="title-logo" />
              <div className="title-text">Your online timer</div>
            </div>

            <div className="langing-content">
              <h2>Welcome to Countime</h2>
              <h4>Have your timer on any online device</h4>
            </div>

            <div className="recent-timers">
              <label>Recent Timers</label>
              {[...recentTimers].reverse().map(t => (
                <button key={t} onClick={() => setSelectedTimerName(t)}>
                  {t}
                </button>
              ))}
            </div>

            <div className="name-input">
              <label className="label">Create a shareable timer</label>
              <label className="prefix">Timer name:</label>
              <input
                className="input"
                onChange={handleInputChange}
                value={timerName}
                placeholder="type anything"
                onKeyDown={handleInputKeyDown}
              />
              <button className="btn-select" onClick={selectTimer} />
            </div>

            <AboutMe />
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
