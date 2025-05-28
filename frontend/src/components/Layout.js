import React from "react";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
  return (
    <div className="bg-black text-white min-vh-100 d-flex flex-column">
      <Navbar />
      <div className="flex-grow-1">{children}</div>
      <footer
        className="text-center py-3"
        style={{ backgroundColor: "#fff", color: "#4E6688" }}
      >
        <small>&copy; 2025 EduSync. All rights reserved By Yash Suman.</small>
      </footer>
    </div>
  );
};

export default Layout;
