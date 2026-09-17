import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from './views/HomePage'
import Header from './components/header';
import Footer from './components/footer';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/*  <Route path="*" element={<Notfound />} /> */}
      </Routes>
      <Footer/>
    </BrowserRouter>
  );
}

export default App;
