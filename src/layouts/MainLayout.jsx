import { Outlet, Link } from 'react-router-dom';
import styles from './css/MainLayout.module.css';

export default function MainLayout() {
    // const baseurl = process.env.VITE_API_BASE_URL;
    const baseurl = import.meta.env.VITE_API_BASE_URL;
  return (
    <p>Hello { baseurl }</p>

  );
}