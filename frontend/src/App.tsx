import { BrowserRouter, Route, Routes } from 'react-router-dom'
import GamesPage from './views/GamesPage'
import Header from './components/header';
import Footer from './components/footer';
import LoginPage from './views/LoginPage';
import RegisterPage from './views/RegisterPage';
import ProfilPage from './views/ProfilPage';
import HomePage from './views/HomePage';
import LikesPages from './views/LikesPage';
import Notfound from './views/NotFound';
import PageDetailsgame from './views/PageDetailsGame';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path='/jeux/d/:slug' element={<PageDetailsgame />} />
        <Route path='/likes' element={<LikesPages/>} />
        <Route path='/' element={<HomePage/>}/>
        <Route path="/jeux" element={<GamesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profil" element={<ProfilPage />} />
        <Route path="*" element={<Notfound />} />
      </Routes>
      <Footer/>
    </BrowserRouter>
  );
}

export default App;
