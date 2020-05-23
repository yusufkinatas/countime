import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import firebase from 'firebase/app';
import 'firebase/database';

import Modal from 'components/Modal';
import formatSeconds from 'utils/formatSeconds';
import getTimeValues from 'utils/getTimeValues';
import './Timer.css';

let tickInterval;
let alertTimeout;

const bell = new Audio('/bell.mp3');
bell.loop = true;

const clearTickInterval = () => {
  clearInterval(tickInterval);
  tickInterval = null;
};

function Timer(props) {
  const { timerData, name, goBack } = props;
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [selectedInput, setSelectedInput] = useState('h'); //h-m-s
  const [timeInputs, setTimeInputs] = useState({ h: 0, m: 0, s: 0 });
  const [alertVisible, setAlertVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pin, setPin] = useState('');

  const databaseRef = firebase.database().ref(`/timers/${name}`);

  const inputtedSeconds = timeInputs.h * 3600 + timeInputs.m * 60 + timeInputs.s;

  useEffect(() => {
    const startTickInterval = () => {
      if (!tickInterval) {
        bell.pause();
        tickInterval = setInterval(() => {
          let alarmed = false;
          setRemainingSeconds(r => {
            if (r === 1 && !alarmed) {
              bell.play();
              alarmed = true;
            }
            return r - 1;
          });
        }, 1000);
      }
    };

    const setRemainingSecondsAndStartTickInterval = s => {
      setRemainingSeconds(s);
      startTickInterval();
    };

    const clearTickAndReset = () => {
      setRemainingSeconds(null);
      clearTickInterval();
    };

    if (!timerData) {
      bell.pause();
      //no timerData

      clearTickAndReset();
    } else if (timerData && remainingSeconds === null) {
      //timerData exists and no remainingSeconds
      const { endsAt, pausedAt } = timerData;
      const now = new Date().getTime();

      let newRemainingSeconds = pausedAt
        ? Math.round((endsAt - pausedAt) / 1000)
        : Math.round((endsAt - now) / 1000);

      if (newRemainingSeconds < 0) newRemainingSeconds = 0;

      setRemainingSecondsAndStartTickInterval(newRemainingSeconds);
    } else if (timerData && !timerData.pausedAt && remainingSeconds) {
      //timerData exists, not paused, remainingSeconds > 0
      startTickInterval();
    } else if (timerData.pausedAt || remainingSeconds === 0) {
      //paused or remainingSeconds == 0
      clearTickInterval();
    }
  }, [timerData, remainingSeconds]);

  useEffect(() => {
    if (typeof remainingSeconds === 'number') {
      document.title = formatSeconds(remainingSeconds);
    }
  }, [remainingSeconds]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  });

  useEffect(() => {
    return () => {
      bell.pause();
    };
  }, []);

  const showAlert = () => {
    setAlertVisible(true);

    clearTimeout(alertTimeout);
    alertTimeout = setTimeout(() => {
      setAlertVisible(false);
    }, 2000);
  };

  const hideAlert = () => {
    clearTimeout(alertTimeout);
    setAlertVisible(false);
  };

  const startTimer = async seconds => {
    await databaseRef.set({
      duration: seconds,
      endsAt: new Date().getTime() + seconds * 1000,
      pin: '',
    });

    setRemainingSeconds(seconds);
  };

  const startTimerWithInputtedTime = () => {
    if (inputtedSeconds > 0) {
      startTimer(inputtedSeconds);
      clearTimeInput();
    }
  };

  const restartTimer = () => {
    if (timerData.pin) return showAlert();

    startTimer(timerData.duration);
  };

  const clearTimer = async () => {
    if (timerData.pin) return showAlert();

    clearTickInterval();
    await databaseRef.remove();
  };

  const pauseTimer = () => {
    if (timerData.pin) return showAlert();

    clearTickInterval();
    databaseRef.update({
      pausedAt: new Date().getTime(),
    });
  };

  const resumeTimer = () => {
    if (timerData.pin) return showAlert();

    const msDifference = timerData.endsAt - timerData.pausedAt;
    databaseRef.update({
      pausedAt: null,
      endsAt: new Date().getTime() + msDifference,
    });
  };

  const handleOnBackPress = () => {
    clearTickInterval();
    goBack();
  };

  const clearSelectedInput = () => {
    if (timeInputs[selectedInput] === 0) {
      return clearTimeInput();
    }
    setTimeInputs({ ...timeInputs, [selectedInput]: 0 });
  };

  const clearTimeInput = () => {
    setTimeInputs({ h: 0, m: 0, s: 0 });
    setSelectedInput('h');
  };

  const handleKeyPress = e => {
    const { key } = e;

    if (timerData) {
      switch (key) {
        case 'Escape':
          handleOnBackPress();
          break;
        default:
      }
      return;
    }

    e.preventDefault();
    if (!isNaN(parseInt(key))) {
      const num = parseInt(key);
      handleNumberPress(num);
    }

    switch (key) {
      case 'Tab':
        if (selectedInput === 's') {
          setSelectedInput('h');
        } else {
          tryToSelectNextTimer();
        }
        break;
      case 'Enter':
        if (selectedInput === 's') {
          startTimerWithInputtedTime();
        } else {
          tryToSelectNextTimer();
        }
        break;
      case 'ArrowRight':
        tryToSelectNextTimer();
        break;
      case 'ArrowLeft':
        tryToSelectPreviousTimer();
        break;
      case 'Backspace':
        clearSelectedInput();
        break;
      case 'Delete':
        clearSelectedInput();
        break;
      case 'Escape':
        handleOnBackPress();
        break;
      default:
        break;
    }
  };

  const tryToSelectNextTimer = () => {
    if (selectedInput === 'h') return setSelectedInput('m');
    if (selectedInput === 'm') return setSelectedInput('s');
  };

  const tryToSelectPreviousTimer = () => {
    if (selectedInput === 's') return setSelectedInput('m');
    if (selectedInput === 'm') return setSelectedInput('h');
  };

  const handleNumberPress = num => {
    if (selectedInput === 'h') {
      setTimeInputs({ ...timeInputs, h: num });
      return tryToSelectNextTimer();
    }

    let newValue = timeInputs[selectedInput] * 10 + num;
    if (newValue > 99) {
      newValue = num;
    } else if (newValue > 59) {
      newValue = 59;
    }
    setTimeInputs({ ...timeInputs, [selectedInput]: newValue });

    if (newValue > 9 || newValue === 0) {
      tryToSelectNextTimer();
    }
  };

  const renderNumberButton = num => {
    return (
      <button key={num} onClick={() => handleNumberPress(num)}>
        {num}
      </button>
    );
  };

  const renderTimeInput = type => {
    return (
      <div
        onClick={() => setSelectedInput(type)}
        className={clsx(type, selectedInput === type && 'selected')}>
        {String(timeInputs[type]).padStart(2, '0')}
      </div>
    );
  };

  const lockTimer = () => {
    if (!pin) return;

    hideModal();
    databaseRef.update({ pin });
  };

  const unlockTimer = () => {
    hideModal();

    if (pin !== timerData.pin) {
      return showAlert();
    }

    databaseRef.update({ pin: '' });
  };

  const showModal = () => {
    setModalVisible(true);
    setPin('');
  };

  const hideModal = () => setModalVisible(false);

  const handlePinChange = e => {
    setPin(e.target.value);
  };

  const handlePinInputKeyDown = e => {
    if (e.key === 'Enter') {
      timerData.pin ? unlockTimer() : lockTimer();
    }
  };

  const renderSecurityButton = () => {
    return (
      <button
        className={clsx(
          'security-button',
          timerData.pin ? 'unlock' : 'lock',
          alertVisible && 'alert'
        )}
        onClick={showModal}
      />
    );
  };

  return (
    <div className="timer-container">
      <h2>{`-${name}-`}</h2>

      {timerData ? (
        <React.Fragment>
          {renderSecurityButton()}
          {remainingSeconds === 0 ? (
            <React.Fragment>
              <div className="time-container">TIME'S UP</div>
              <button className="big-button" onClick={restartTimer}>
                Restart ({formatSeconds(timerData.duration)})
              </button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <div className="time-container">
                <div className="h">{getTimeValues(remainingSeconds).hours}</div>:
                <div className="m">{getTimeValues(remainingSeconds).mins}</div>:
                <div className="s">{getTimeValues(remainingSeconds).secs}</div>
              </div>
              <button
                className="big-button"
                onClick={timerData.pausedAt ? resumeTimer : pauseTimer}>
                {timerData.pausedAt ? 'Resume' : 'Pause'}
              </button>
            </React.Fragment>
          )}
          <button className="big-button" onClick={clearTimer}>
            Clear
          </button>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className="time-container">
            {renderTimeInput('h')}:{renderTimeInput('m')}:{renderTimeInput('s')}
          </div>
          <div className="number-buttons">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => renderNumberButton(num))}
          </div>
          <button
            className={clsx('big-button start', !inputtedSeconds && 'disabled')}
            onClick={startTimerWithInputtedTime}>
            Start
          </button>
          <button className="big-button" onClick={clearTimeInput}>
            Clear
          </button>
        </React.Fragment>
      )}

      <div onClick={hideAlert} className={clsx('locked-alert', alertVisible && 'visible')}>
        LOCKED
      </div>
      <button className="back-button" onClick={handleOnBackPress} />

      {timerData && (
        <Modal visible={modalVisible} onOverlay={hideModal}>
          <h3 className="modalTitle">{timerData.pin ? 'Unlock Timer' : 'Lock Timer'}</h3>
          <input
            className="modalInput"
            onKeyDown={handlePinInputKeyDown}
            autoFocus
            onChange={handlePinChange}
            value={pin}
            placeholder="Enter Pin"
          />
          <div className="modalButtons">
            <div onClick={hideModal}>Cancel</div>
            <div onClick={timerData.pin ? unlockTimer : lockTimer}>
              {timerData.pin ? 'Unlock' : 'Lock'}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Timer;
