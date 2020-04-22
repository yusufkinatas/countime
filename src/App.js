import React, { useState, useEffect } from 'react';
import './App.css';
import './initialize';
import firebase from 'firebase/app';
import 'firebase/database';
import Timer from 'Timer';
import parseQueryString from 'utils/parseQueryString';

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
          if (!timerVisible) setTimerVisible(true);
        });
      setTimerName('');

      if (recentTimers.includes(selectedTimerName)) {
        const foundIndex = recentTimers.indexOf(selectedTimerName);
        const clone = [...recentTimers];
        clone.splice(foundIndex, 1);

        setRecentTimers([...clone, selectedTimerName]);
      } else {
        const rememberCount = 3;
        if (recentTimers.length >= rememberCount) {
          setRecentTimers([...recentTimers.slice(1, rememberCount), selectedTimerName]);
        } else {
          setRecentTimers([...recentTimers, selectedTimerName]);
        }
      }

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
      <header className="App-header">
        {Boolean(!timerVisible && selectedTimerName) && <div className="loader">LOADING</div>}

        {timerVisible ? (
          <Timer name={selectedTimerName} timerData={timerData} goBack={goBack} />
        ) : (
          <div>
            <input
              onChange={handleInputChange}
              value={timerName}
              placeholder="timer name"
              autoFocus
              onKeyDown={handleInputKeyDown}
            />
            <button onClick={selectTimer}>Select</button>
            <div>
              <h5>Recent Timers</h5>
              {[...recentTimers].reverse().map(t => (
                <div key={t} onClick={() => setSelectedTimerName(t)}>
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
