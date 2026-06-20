

import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/DashBoard.jsx";
import AskDoubt from "./pages/AskDoubt.jsx";
import SavedQuestions from "./pages/SavedQuestions.jsx";
import Analytics from "./pages/Analytics";
import PropTypes from "prop-types";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("accessToken");
  if (!token) return <Navigate to="/login" replace />;
  return children;
};
ProtectedRoute.propTypes = { children: PropTypes.node.required };
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("accessToken");
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
};
PublicRoute.propTypes = { children: PropTypes.node.required };
function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={
          <PublicRoute><Login /></PublicRoute>
        } />

        <Route path="/register" element={
          <PublicRoute><Register /></PublicRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />

        <Route path="/ask-doubt" element={
          <ProtectedRoute><AskDoubt /></ProtectedRoute>
        } />

        <Route path="/saved-questions" element={
          <ProtectedRoute><SavedQuestions /></ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute><Analytics /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
