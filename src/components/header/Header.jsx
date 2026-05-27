import { Link } from 'react-router-dom';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logoSection}>
          <img 
            src="https://www.psa.gov.in/CMS/web/sites/default/files/common/PSA25Logo.png" 
            alt="PSA Logo" 
            className={styles.logo}
          />
        </div>
        
        <nav className={styles.nav}>
          <Link to="/methodology" className={styles.navLink}>Methodology</Link>
          <Link to="/about" className={styles.navLink}>About</Link>
          <Link to="/contact" className={styles.navLink}>Contact</Link>
        </nav>
      </div>
    </header>
  );
}