import React, { useState } from 'react';
import email from 'assets/email.png';
import linkedin from 'assets/linkedin.png';
import github from 'assets/github.png';

import './AboutMe.css';

function AboutMe() {
  const [visible, setVisible] = useState(false);

  const toggle = () => setVisible(!visible);

  const hide = () => setVisible(false);

  return (
    <React.Fragment>
      {visible && <div onClick={hide} className="aboutme-overlay" />}
      <div onClick={toggle} className={'aboutme-handle' + (visible ? ' visible' : '')}>
        About Me
      </div>
      <div className={'aboutme-body ' + (visible ? ' visible' : '')}>
        <p>
          Hi, I am Yusuf. A software developer from Turkey. I'm developing software for different
          platforms (mobile, desktop, web) since 2014.
        </p>
        <p>
          My favorite part of the software development is to create ease in other people's lives.
        </p>
        <p>
          If you want to contact with me, hire me, see my other projects or just chat while having a
          cup of coffee, you can use links below.
        </p>
        <div className="filler" />
        <div className="social-buttons">
          <a className="email" href="mailto:yusufkinatas@gmail.com" target="_blank">
            <img src={email} />
            <span>E-Mail</span>
          </a>
          <a className="linkedin" href="https://www.linkedin.com/in/yusuf-kinatas/" target="_blank">
            <img src={linkedin} />
            <span>Linkedin</span>
          </a>
          <a className="github" href="https://github.com/yusufkinatas" target="_blank">
            <img src={github} />
            <span>Github</span>
          </a>
        </div>
      </div>
    </React.Fragment>
  );
}

export default AboutMe;
