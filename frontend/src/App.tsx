import { lazy, Suspense } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Footer from './components/Footer';
import { Navbar } from './components/nav';
import { Spinner } from './components/ui/Spinner';
import { CreateLotteryPage } from './pages/create-lottery';
import { LotteryViewPage } from './pages/lottery';

const HomePage = lazy(() =>
  import('./pages/home').then((mod) => ({ default: mod.HomePage }))
);
const DashboardPage = lazy(() =>
  import('./pages/dashboard').then((mod) => ({ default: mod.DashboardPage }))
);

function Layout({
  children
}: {
  children: React.ReactNode;
  maxWidth?: number;
}) {
  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900'>
      <Navbar />
      <div className='container mx-auto px-4 py-8'>{children}</div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/dashboard' element={<DashboardPage />} />
            <Route path='/create-lottery' element={<CreateLotteryPage />} />
            <Route path='/lottery/:lotteryId' element={<LotteryViewPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
}

export default App;
