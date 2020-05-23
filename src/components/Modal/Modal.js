import React, { useEffect, useState } from 'react';

import './Modal.css';
import clsx from 'clsx';

function Modal({ visible, onOverlay, children }) {
  const [_visible, set_visible] = useState(false);
  const [destoyed, setDestoyed] = useState(true);

  useEffect(() => {
    if (visible) {
      setDestoyed(false);
      setTimeout(() => {
        set_visible(true);
      }, 50);
    } else {
      set_visible(false);
      setTimeout(() => {
        setDestoyed(true);
      }, 400);
    }
  }, [visible]);

  const onContainer = e => e.stopPropagation();

  if (destoyed) return null;

  return (
    <div onClick={onOverlay} className={clsx('overlay', _visible && 'visible')}>
      <div onClick={onContainer} className="container">
        {children}
      </div>
    </div>
  );
}

export default Modal;
