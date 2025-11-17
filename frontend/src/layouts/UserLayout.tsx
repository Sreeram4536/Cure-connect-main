// import React from "react";
// import Navbar from "../components/user/Navbar";
// import Footer from "../components/common/Footer";

// const UserLayout = ({ children }: { children: React.ReactNode }) => {
//   return (
//     <div className="mx-4 sm:mx-[10%]">
//       <Navbar />
//       {children}
//       <Footer />
//     </div>
//   );
// };

// export default UserLayout;

import React from "react";
import Navbar from "../components/user/Navbar";
import Footer from "../components/common/Footer";

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {/* Navbar full width */}
      <Navbar />

      {/* Content container with margins */}
      <div className="mx-4 sm:mx-[10%]">
        {children}
      </div>

      <Footer />
    </div>
  );
};

export default UserLayout;

