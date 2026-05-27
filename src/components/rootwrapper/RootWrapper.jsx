import { Outlet } from 'react-router-dom';
import Header from '../header/Header';
import Footer from '../footer/Footer';

export default function RootWrapper() {  // ← Must be "export default"
  return (
    <>
      <Header />
      {/* <main style={{ minHeight: '60vh', padding: '2rem 0', flex: 1 }}> */}
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}