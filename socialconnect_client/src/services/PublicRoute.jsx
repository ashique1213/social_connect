import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";


function PublicRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user ? <Navigate to="/feed" /> : children;
}

export default PublicRoute;
