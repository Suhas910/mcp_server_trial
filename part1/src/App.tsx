import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { GroupPage } from './pages/GroupPage';
import { FoodDetailPage } from './pages/FoodDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import './styles/global.css';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/groups/:groupId" element={<GroupPage />} />
          <Route path="/groups/:groupId/food/:foodId" element={<FoodDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
