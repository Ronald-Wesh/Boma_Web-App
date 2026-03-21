// import { useState } from 'react'
import "./App.css";
import { Routes, Route } from "react-router-dom";
import {
  UserButton,
  SignedIn,
  SignedOut,
  SignIn,
} from "@clerk/clerk-react";
function App() {
  return (
    <>
      <nav className="flex justify-between items-center p-4 bg-white shadow-md">
        <SignedIn>
          <UserButton />
        </SignedIn>
      </nav>

      {/* Render form directly */}
      <div className="flex justify-center items-center h-screen">
        <SignedOut>
          <SignIn />
        </SignedOut>
      </div>
    </>
  );
}

export default App;
