import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import ListingPage from './pages/ListingPage';
import LoginPage from './pages/LoginPage';
import BookingSuccess from './pages/BookingSuccess';
import Trips from './pages/Trips';
import Wishlists from './pages/Wishlists';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/listing/:id" element={<ListingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/booking/success" element={<BookingSuccess />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/wishlists" element={<Wishlists />} />
      </Route>
    </Routes>
  );
}
