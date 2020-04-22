import React, { useState, useEffect } from 'react';
import firebase from 'firebase/app';
import 'firebase/database';
import formatSeconds from 'utils/formatSeconds';

let tickInterval;

const clearTickInterval = () => {
  clearInterval(tickInterval);
  tickInterval = null;
};

function Timer(props) {
  const { timerData, name, goBack } = props;
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [paused, setPaused] = useState(false);
  const [selectedInput, setSelectedInput] = useState('h'); //h-m-s
  const [timeInputs, setTimeInputs] = useState({ h: 0, m: 0, s: 0 });

  const databaseRef = firebase.database().ref(`/timers/${name}`);

  const inputtedSeconds = timeInputs.h * 3600 + timeInputs.m * 60 + timeInputs.s;

  useEffect(() => {
    if (timerData) {
      const { endsAt, pausedAt } = timerData;

      setPaused(!!pausedAt);

      if (!remainingSeconds) {
        const now = new Date().getTime();

        const _remainingSeconds = pausedAt
          ? Math.round((endsAt - pausedAt) / 1000)
          : Math.round((endsAt - now) / 1000);
        setRemainingSeconds(_remainingSeconds < 0 ? 0 : _remainingSeconds);
      }
    } else {
      clearTickInterval();
      clearTimeInput();
      setRemainingSeconds(null);
    }
  }, [timerData]);

  useEffect(() => {
    console.log('remainingSeconds', remainingSeconds);

    if (typeof remainingSeconds === 'number') {
      document.title = formatSeconds(remainingSeconds);
    }

    if (remainingSeconds > 0 && timerData && !timerData.pausedAt) {
      if (!tickInterval) {
        tickInterval = setInterval(() => {
          setRemainingSeconds(r => r - 1);
        }, 1000);
      }
    } else {
      clearTickInterval();
    }
  }, [remainingSeconds]);

  useEffect(() => {
    if (paused) {
      clearTickInterval();
    } else if (remainingSeconds > 0 && !tickInterval) {
      tickInterval = setInterval(() => {
        setRemainingSeconds(r => r - 1);
      }, 1000);
    }
  }, [paused]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  });

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
    }
  };

  const restartTimer = () => {
    startTimer(timerData.duration);
  };

  const clearTimer = async () => {
    if (timerData.pin) return alert('LOCKED');

    clearTickInterval();
    await databaseRef.remove();
  };

  const pauseTimer = () => {
    if (timerData.pin) return alert('LOCKED');

    clearTickInterval();
    databaseRef.update({
      pausedAt: new Date().getTime(),
    });
  };

  const resumeTimer = () => {
    if (timerData.pin) return alert('LOCKED');

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
        className={selectedInput === type ? 'selected' : ''}>
        {String(timeInputs[type]).padStart(2, '0')}
      </div>
    );
  };

  const lockTimer = () => {
    const pin = parseInt(prompt('enter pin'));
    if (!pin) return;

    databaseRef.update({ pin });
  };

  const unlockTimer = () => {
    const pin = parseInt(prompt('enter pin'));

    if (pin !== timerData.pin) {
      return alert('wrong password');
    }

    databaseRef.update({ pin: '' });
  };

  const renderSecurityButton = () => {
    if (timerData.pin) {
      return <button onClick={unlockTimer}>Unlock</button>;
    }
    return <button onClick={lockTimer}>Lock</button>;
  };

  return (
    <div className="timer-container">
      <h2>{`-${name}-`}</h2>

      {timerData ? (
        <React.Fragment>
          {remainingSeconds === 0 ? (
            <div>
              <div className="timer">TIME'S UP</div>
              <button onClick={restartTimer}>Restart ({timerData.duration})</button>
            </div>
          ) : (
            <div>
              <div className="timer">{formatSeconds(remainingSeconds)}</div>
              <button onClick={timerData.pausedAt ? resumeTimer : pauseTimer}>
                {timerData.pausedAt ? 'Resume' : 'Pause'}
              </button>
              {renderSecurityButton()}
            </div>
          )}
          <button onClick={clearTimer}>Clear</button>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className="time-input-container">
            {renderTimeInput('h')}:{renderTimeInput('m')}:{renderTimeInput('s')}
          </div>
          <div className="number-buttons">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => renderNumberButton(num))}
          </div>
          <button
            className={!inputtedSeconds ? 'disabled' : ''}
            onClick={startTimerWithInputtedTime}>
            Start Timer
          </button>
          <button onClick={clearTimeInput}>Clear</button>
        </React.Fragment>
      )}

      <button className="back-button" onClick={handleOnBackPress}>
        X
      </button>
    </div>
  );
}

export default Timer;
