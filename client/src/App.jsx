import { useState } from "react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

export default function App() {
  const [page, setPage] = useState("landing");

  return (
    <div>
      {page === "landing" && <Landing onNavigate={setPage} />}
      {page === "login" && <Login onNavigate={setPage} />}
      {page === "signup" && <Signup onNavigate={setPage} />}
    </div>
  );
}