import { useState, useEffect } from "react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home/Home";

export default function App() {
  const [page, setPage] = useState("landing");

  // If user is already logged in, go straight to home
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setPage("home");
  }, []);

  return (
    <div>
      {page === "landing" && <Landing onNavigate={setPage} />}
      {page === "login"   && <Login   onNavigate={setPage} />}
      {page === "signup"  && <Signup  onNavigate={setPage} />}
      {page === "home"    && <Home    onNavigate={setPage} />}
    </div>
  );
}