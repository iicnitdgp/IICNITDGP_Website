import React, { useState } from 'react';
import styles from './styles/mobileheader.module.scss';
import { Link } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import IICLOGO from '../../assets/iiclogo.png';
import NITDGPLOGO from '../../assets/NITLogo2.png';
import { HashLink } from 'react-router-hash-link';

const MobileHeader = () => {
    const [isDown, setIsDown] = useState(false);

    return (
        <div className={styles.mobilecontainer}>
            <img src={NITDGPLOGO} alt="NIT Durgapur Logo" className={styles.logo} />
            <img src={IICLOGO} alt="IIC Logo" className={styles.logo} />

            <div className={styles.iconWrapper}>
                {!isDown ? (
                    <MenuIcon onClick={() => setIsDown(true)} />
                ) : (
                    <CloseIcon onClick={() => setIsDown(false)} />
                )}
            </div>

            {isDown && (
                <ul className={styles.dropdown} onClick={() => setIsDown(false)}>
                    <li><HashLink smooth to="/">Home</HashLink></li>
                    <li><HashLink smooth to="/#about">About Us</HashLink></li>
                    <li><Link to="/team">Team</Link></li>
                    {/* <li><Link to="/facilities">Facilities</Link></li> */}
                    <li><Link to="/faq">FAQ</Link></li>
                    {/* <li><Link to="/program">Program</Link></li> */}
                    <li><Link to="/guidelines">Guidelines</Link></li>
                    <li><Link to="/activity">Activity</Link></li>
                    <li><Link to="/hackathon">Hackathon</Link></li>
                    <li><Link to='/collaboration'>Collaboration</Link></li>
                    <li><Link to='/research'>Research</Link></li>
                    <li><Link to='/gallery'>Gallery</Link></li>
                    <li><Link to='/ai2summit'>AI2 Summit</Link></li>
                    
                    {/* <li><Link to="/thinkinglab">Thinking Lab</Link></li> */}
                    {/* <li><Link to="/asokesen">AsokeSen</Link></li>
                    <li><Link to="/login">Login</Link></li>
                    <li><Link to="/contact">Contact Us</Link></li> */}
                </ul>
            )}
        </div>
    );
};

export default MobileHeader;
