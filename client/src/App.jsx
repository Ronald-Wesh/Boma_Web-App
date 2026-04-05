// import "./App.css";
// import { Routes, Route } from "react-router-dom";
// import { UserButton, SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";
// import Listings from "./Pages/Listing";

// function App() {
//   return (
//     <>
//       <nav className="flex justify-between items-center p-4 bg-white shadow-md">
//         <SignedIn>
//           <UserButton />
//         </SignedIn>
//       </nav>

//       <Routes>
//         {/* Listings page (main app) */}
//         <Route
//           path="/"
//           element={
//             <>
//               <SignedIn>
//                 <Listings />
//               </SignedIn>
//               <SignedOut>
//                 <div className="flex justify-center items-center h-screen">
//                   <SignIn />
//                 </div>
//               </SignedOut>
//             </>
//           }
//         />
//       </Routes>
//     </>
//   );
// }

// export default App;
import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Listings from "./Pages/Listing";

export default function App() {
  return (
    <>       
      <nav className="flex justify-between items-center p-4 bg-white shadow-md">
        <p className="font-semibold">Dev Mode</p>
      </nav>

      <Routes>
        <Route path="/" element={<Listings />} />
      </Routes>
    </>
  );
}


// import "./App.css";
// import { Routes, Route } from "react-router-dom";
// import { UserButton, SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";
// import { toast} from "sonner";
// import { useEffect } from "react";

// function App() {
//   return (
//     <>
//       <nav className="flex justify-between items-center p-4 bg-white shadow-md">
//         <SignedIn>
//           <UserButton />
//         </SignedIn>
//       </nav>

//       {/* Render form directly */}
//       <div className="flex justify-center items-center h-screen">
//         <SignedOut>
//           <SignIn />
//         </SignedOut>
//       </div>
//     </>
//   );
// }

// export defaul