import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { MemberPage } from './pages/Member';
import { BoardPage } from './pages/Board';
import { Contact } from './pages/Contact';
import { Clubs } from './pages/Clubs';
import { ClubDetail } from './pages/ClubDetail';
import { UsefulLinks } from './pages/UsefulLinks';

// ScrollToTop component to reset scroll position on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App: React.FC = () => {
  return (
    <Router>
      {/* ScrollToTop manually implemented as HashRouter doesn't always handle it automatically the way browsers handle normal history */}
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/clubs/:id" element={<ClubDetail />} />
          <Route path="/members" element={<MemberPage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/resources" element={<UsefulLinks />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;