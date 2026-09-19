import React, { useState } from 'react';
import styles from './styles/desktopheader.module.scss';
import { Link } from 'react-router-dom';
import NITDGPLOGO from '../../assets/NITLogo2.png';
import IICLOGO from '../../assets/iiclogo.png';
import {HashLink} from 'react-router-hash-link';

const DesktopHeader = () => {
    const [isDown, setIsDown] = useState(false);

    return (
        <div className={styles.desktopHeaderContainer}>
            <ul className={styles.logo}>
                <a href='https://nitdgp.ac.in/'><img src={NITDGPLOGO} alt="Nit DGP Logo" /></a>
                <Link to='/'><img src={IICLOGO} alt="IIC Logo" /></Link>
            </ul>
            
            <ul>
                <li>
                    <Link to="/">Home</Link>
                </li>
                <li
                    className={styles.dropdown}
                    onMouseEnter={() => setIsDown(true)}
                    onMouseLeave={() => setIsDown(false)}
                >
                    About
                    {isDown && (
                        <div className={styles.dropdownContent}>
                            <HashLink smooth to="/#about">About Us</HashLink>
                            <Link to="/team">Team</Link>
                            {/* <Link to="/facilities">Facilities</Link> */}
                            <Link to="/faq">FAQ</Link>
                        </div>
                    )}
                </li>
                {/* <li>
                    <Link to="/program">Program</Link>
                </li> */}
                <li>
                    <Link to="/guidelines">Guidelines</Link>
                </li>
                <li>
                    <Link to="/activity">Activity</Link>
                </li>
                <li>
                    <Link to="/hackathon">Hackathon</Link>
                </li>
                <li>
                    <Link to='/collaboration'>Collaboration</Link>
                </li>
                <li>
                    <Link to='/research'>Research</Link>
                </li>
                {/* <li>
                    <Link to="/thinkinglab">Thinking Lab</Link>
                </li> */}
                {/* <li>
                    <Link to="/asokesen">AsokeSen</Link>
                </li> */}
                <li>
                    <Link to="/gallery">Gallery</Link>
                </li>
                <li>
                    <Link to="/ai2summit">AI2 Summit</Link>
                </li>
            </ul>
        </div>
    );
};

export default DesktopHeader;