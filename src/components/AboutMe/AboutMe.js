import React, { useState } from 'react';

import './AboutMe.css';

function AboutMe() {
  const [visible, setVisible] = useState(true);

  const toggle = () => setVisible(!visible);

  const hide = () => setVisible(false);

  return (
    <React.Fragment>
      {visible && <div onClick={hide} className="aboutme-overlay" />}
      <div onClick={toggle} className={'aboutme-handle' + (visible ? ' visible' : '')}>
        About Me
      </div>
      <div className={'aboutme-body' + (visible ? ' visible' : '')}>
        <p>This is contentt</p>
        <p>This is contentt</p>
        <p>This is contentt</p>
        <p>This is contentt</p>
        <p>This is contentt</p>
      </div>
    </React.Fragment>
  );
}

export default AboutMe;
