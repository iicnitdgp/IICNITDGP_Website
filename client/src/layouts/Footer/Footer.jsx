import React from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { loadUserFromStorage } from "../../store/slices/authSlice";
import styles from './styles/footer.module.scss'; // Import SCSS styles
import GradientText from "../../component/Core/TextStyle";
import { motion } from "framer-motion";
import { HashLink } from "react-router-hash-link";
import API from "../../common/api"

const Footer = () => {
  const [website_Visit,setWebsite_Visit] = React.useState(0);
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  React.useEffect(() => {
    // Load user data from localStorage on component mount
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  const response = async () => {
    const res = await fetch(API.WebsiteVisit.url, {
      method: API.WebsiteVisit.method,
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res.ok) {
      const data = await res.json();
      setWebsite_Visit(data.count);
    } else {
      console.error("Failed to fetch website visit data");
    }
  }
  React.useEffect(() => {
    response();
  }, []);
  return (
    <footer className={styles.footer}>
      <motion.div className={styles.footerColumns}
        whileInView={{ opacity: 1, x: 0 }}
        initial={{ opacity: 0, x: -30 }}
        transition={{ type: "spring", stiffness: 100, duration: 0.5 }}
      >
        {/* Column 1 */}
        <div className={styles.footerColumn}>
          <h3><GradientText text={"Address"} /></h3>

          <p className={styles.footerText}>5th and 6th Floor, Utkarsh Bhavan</p>
          <p className={styles.footerText}>National Institute of Technology Durgapur</p>

        </div>

        {/* Column 2 */}
        <div className={styles.footerColumn}>
          <h3><GradientText text={"President"} /></h3>
          <p className={styles.footerText}>Prof. Hirok Chaudhuri</p>
          <p className={styles.footerText}>IIC NIT Durgapur</p>
          <p className={styles.footerText}>Email : <a href="mailto:hchaudhuri.phy@nitdgp.ac.in" style={{ color: "var(--primary)", textDecoration: "none" }}>hchaudhuri.phy@nitdgp.ac.in</a></p>
        </div>

        {/* Column 3 */}
        <div className={styles.footerColumn}>
          <h3><GradientText text={"Contact Us"} /></h3>
          <p className={styles.footerText}>Email: <a href="mailto:iic@nitdgp.ac.in" style={{ color: "var(--primary)", textDecoration: "none" }}>iic@nitdgp.ac.in</a></p>
          <p className={styles.footerText}>Phone: <a href="tel:+91 9434789019" style={{ color: "var(--primary)", textDecoration: "none" }}>+91 9434789019</a></p>
          <HashLink to="/audition" style={{ marginTop: "3rem" ,paddingTop: '2rem'}}>
            <button className={styles.joinBtn}>Join Us</button>
          </HashLink>

        </div>

        {/* Column 4: Quick Links */}
        <div className={styles.footerColumn}>
          <h3><GradientText text={"Quick Links"} /></h3>
          <ul className={styles.footerLinks}>
            <li><Link className={styles.footerLink} to="/">Home</Link></li>
            <li><Link className={styles.footerLink} to="/team">Team</Link></li>
            {/* <li><Link className={styles.footerLink} to="/guidelines">Guidelines</Link></li> */}
            <li><HashLink smooth className={styles.footerLink} to="/#contact">Contact</HashLink></li>
            {isAuthenticated ? (
              <li>
                <Link className={styles.footerLink} to="/profile">
                  Profile ({user?.name})
                </Link>
              </li>
            ) : (
              <li><Link className={styles.footerLink} to="/login">Login</Link></li>
            )}
            <li className={styles.web_visit}>Website Visit : <GradientText text={website_Visit}/></li>
          </ul>

        </div>
      </motion.div>

      {/* VPN Notice */}
      <div className={styles.vpnNotice}>
        ⚠️ If the website is not working properly, please try using a VPN service.
      </div>

      {/* Copyright Section */}
      <div className={styles.footerCopyright}>
        <p>&copy; 2025 IIC NIT DURGAPUR. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;