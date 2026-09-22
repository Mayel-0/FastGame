import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from './views/HomePage'
import Header from './components/header';
import Footer from './components/footer';
import LoginPage from './views/LoginPage';
import RegisterPage from './views/RegisterPage';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/*  <Route path="*" element={<Notfound />} /> */}
      </Routes>
      <Footer/>
    </BrowserRouter>
  );
}

export default App;
