import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          {/* Logo Section */}
          <div className={styles.logoSection}>
            <img 
              src="https://www.psa.gov.in/CMS/web/sites/default/files/common/PSA25Logo.png" 
              alt="PSA Logo" 
              className={styles.footerLogo}
            />
          </div>

          {/* Quick Links */}
          <div className={styles.linksSection}>
            <h4 className={styles.sectionTitle}>Quick Links</h4>
            <Link to="/methodology" className={styles.footerLink}>Methodology</Link>
            <Link to="/about" className={styles.footerLink}>About</Link>
            <Link to="/contact" className={styles.footerLink}>Contact</Link>
          </div>

          {/* Contact Info */}
          <div className={styles.contactSection}>
            <h4 className={styles.sectionTitle}>Contact Us</h4>
            <address className={styles.address}>
              Room No. 33010, 3rd Floor,<br />
              Kartavya Bhavan 3, Central Secretariat,<br />
              New Delhi - 110001 , India<br />
              
            </address>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} OPSA - All Rights Reserved
          </p>
          <div className={styles.policies}>
            <Link to="/privacy-policy" className={styles.policyLink}>Privacy Policy</Link>
            <span className={styles.separator}>|</span>
            <Link to="/terms" className={styles.policyLink}>Terms of Use</Link>
            <span className={styles.separator}>|</span>
            <Link to="/disclaimer" className={styles.policyLink}>Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}