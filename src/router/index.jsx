
// src/router/index.jsx
import { createBrowserRouter } from 'react-router-dom';
import RootWrapper from '../components/rootwrapper/RootWrapper';
import HomePage from '../pages/HomePage';
import Technology from '../pages/Technology';

// Placeholder pages (create these files)
const AboutPage = () => <div style={{padding:'2rem'}}><h1>About Page</h1></div>;
const MethodologyPage = () => <div style={{padding:'2rem'}}><h1>Methodology Page</h1></div>;
const ContactPage = () => <div style={{padding:'2rem'}}><h1>Contact Page</h1></div>;
const NotFoundPage = () => (
  <div style={{padding:'2rem',textAlign:'center'}}>
    <h1>404 - Page Not Found</h1>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootWrapper />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'methodology', element: <MethodologyPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'technology/:subTechId', element: <Technology /> },
      { path: '*', element: <NotFoundPage /> }
    ]
  }
]);