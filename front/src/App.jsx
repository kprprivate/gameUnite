import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context providers
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';

// Layout
import Layout from './components/Layout/Layout';

// Pages
import Home from './pages/Home/Home';
import Games from './pages/Games/Games';
import GameDetails from './pages/Games/GameDetails';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile/Profile';
import CreateAd from './pages/Ads/CreateAd';
import EditAd from './pages/Ads/EditAd';
import AdDetails from './pages/Ads/AdDetails';
import UserProfile from './pages/Users/UserProfile';
import Favorites from './pages/Favorites/Favorites';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Cart/Checkout';
import Orders from './pages/Orders/Orders';
import OrderDetails from './pages/Orders/OrderDetails';

// Components
import ProtectedRoute from './components/Auth/ProtectedRoute';

import './App.css';

function App() {
  return (
      <AuthProvider>
        <GameProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Layout><Home /></Layout>} />
                <Route path="/games" element={<Layout><Games /></Layout>} />
                <Route path="/games/:gameId" element={<Layout><GameDetails /></Layout>} />
                <Route path="/ads/:adId" element={<Layout><AdDetails /></Layout>} />
                <Route path="/users/:userId" element={<Layout><UserProfile /></Layout>} />

                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Layout><Dashboard /></Layout>
                      </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Layout><Profile /></Layout>
                      </ProtectedRoute>
                    }
                />
                <Route
                    path="/favorites"
                    element={
                      <ProtectedRoute>
                        <Layout><Favorites /></Layout>
                      </ProtectedRoute>
                    }
                />
                <Route
                    path="/cart"
                    element={
                      <ProtectedRoute>
                        <Layout><Cart /></Layout>
                      </ProtectedRoute>
                    }
                />
                <Route
                    path="/checkout"
                    element={
                      <ProtectedRoute>
                        <Layout><Checkout /></Layout>
                      </ProtectedRoute>
                    }
                />
                <Route
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <Layout><Orders /></Layout>
                      </ProtectedRoute>
                    }
                />
                <Route
                    path="/orders/:orderId"
                    element={
                      <ProtectedRoute>
                        <Layout><OrderDetails /></Layout>
                      </ProtectedRoute>
                    }
                />
                <Route
                    path="/create-ad"
                    element={
                      <ProtectedRoute>
                        <Layout><CreateAd /></Layout>
                      </ProtectedRoute>
                    }
                />
                <Route
                    path="/ads/:adId/edit"
                    element={
                      <ProtectedRoute>
                        <Layout><EditAd /></Layout>
                      </ProtectedRoute>
                    }
                />

                {/* 404 Route */}
                <Route
                    path="*"
                    element={
                      <Layout>
                        <div className="min-h-screen flex items-center justify-center">
                          <div className="text-center">
                            <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                            <p className="text-gray-600 mb-6">Página não encontrada</p>
                            <a href="/" className="text-blue-600 hover:text-blue-800">
                              Voltar para o início
                            </a>
                          </div>
                        </div>
                      </Layout>
                    }
                />
              </Routes>

              {/* Toast notifications */}
              <ToastContainer
                  position="top-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
              />
            </div>
          </Router>
        </GameProvider>
      </AuthProvider>
  );
}

export default App;