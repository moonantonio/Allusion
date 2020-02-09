import React from 'react';
import '../../resources/style/animate.scss';

import SVG from 'react-inlinesvg';

// import PreloadIcon from '../../resources/icons/preload.svg';
import PreloadIcon from '../../resources/icons/preload-anim.svg';
// import PreloadIcon from 'https://cdn.shopify.com/s/files/1/0038/9408/3648/t/6/assets/aoku-animation.svg';
// 'URL(https://cdn.shopify.com/s/files/1/0038/9408/3648/t/6/assets/aoku-animation.svg) 0px 0px'

// const animStyle: React.CSSProperties = {
//   background: 'url('+{PreloadIcon}+') 0px 0px',
// };

// Using inline style since css file might not have been loaded
const splashScreenStyles: React.CSSProperties = {
  position: 'relative',
  // top: '25%',
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
  flexDirection: 'column',
  verticalAlign: 'top',
  textAlign: 'center',
  width: '200p',
  color: '#f5f8fa',
};

const textStyles: React.CSSProperties = {
  margin: '0',
  fontSize: '18px',
  fontWeight: 700,
  fontFamily:
    '-apple-system, "BlinkMacSystemFont", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", \
    "Open Sans", "Helvetica Neue", "Icons16", sans-serif',
};

const SplashScreen = () => (
  <div style={splashScreenStyles}>
    <svg style={{ width: 0 }}>
      <defs>
        <linearGradient id="yellow-blue" x2="1" y2="1">
          <stop offset="0%" stopColor="#F7EA3A" stopOpacity="1">
            <animate
              attributeName="stop-color"
              values="#F7EA3A;#009DE0;#F7EA3A;#009DE0;#F7EA3A;#009DE0"
              dur="3s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="#009DE0" stopOpacity="1">
            <animate
              attributeName="stop-color"
              values="#F7EA3A;#009DE0;#F7EA3A;#009DE0;#F7EA3A;#009DE0"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="offset"
              values=".95;.80;.60;.40;.20;0;.20;.40;.60;.80;.95"
              dur="2s"
            />
          </stop>
        </linearGradient>
      </defs>
    </svg>
    <span style={{ display: 'block', overflow: 'hidden', width: '44px', margin: '0 auto' }}>
      <SVG src={PreloadIcon} style={{ fill: 'url(#yellow-blue)', position: 'relative', width: '402px', display: 'block', animation: 'play 0.9s steps(9) 0s 50 normal forwards' }} />
    </span>
    {/* <div style={{ fill: 'url(#yellow-blue)', position: 'relative', top: '25%', margin: '0 auto', width: '96px', height: '96px', background: 'URL(\''+PreloadIcon+'\') 0px 0px', animation: 'play 0.5s steps(8) 0s 999 normal forwards'}}></div> */}
    {/* <div style={{ fill: 'url(#yellow-blue)', position: 'relative', top: '25%', margin: '0 auto', width: '200px', height: '200px', background: 'URL(https://cdn.shopify.com/s/files/1/0038/9408/3648/t/6/assets/aoku-animation.svg) 0px 0px', animation: 'play 0.5s steps(8) 0s 999 normal forwards'}}></div> */}



    <p style={textStyles} className="preloader">
      Allusion
    </p>
  </div>
);

export default SplashScreen;
