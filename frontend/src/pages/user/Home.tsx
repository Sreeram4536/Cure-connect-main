// import Header from "../../components/user/Header";
// import SpecialityMenu from "../../components/user/SpecialityMenu";
// import TopDoctors from "../../components/user/TopDoctors";
// import Banner from "../../components/user/Banner";
// import { useContext, useEffect } from "react";
// import { AppContext } from "../../context/AppContext";
// import { useNavigate } from "react-router-dom";

// const Home = () => {

//       const context = useContext(AppContext);
//       const navigate = useNavigate();
      
//         if (!context) {
//           throw new Error("LangingPage must be used within an AppContextProvider");
//         }
      
//         const { token } = context;

//     useEffect(() => {
//       if (!token) {
//         navigate("/login");
//       }
//     }, [token, navigate]);


//   return (
//     <div>
//       <Header />
//       <SpecialityMenu />
//       <TopDoctors />
//       <Banner />
//     </div>
//   );
// };

// export default Home;

import Header from "../../components/user/Header";
import SpecialityMenu from "../../components/user/SpecialityMenu";
import TopDoctors from "../../components/user/TopDoctors";
import Banner from "../../components/user/Banner";

import { useContext, useEffect } from "react";
import { AppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  
  if (!context) {
    throw new Error("Home must be used within an AppContextProvider");
  }
  
  const { token } = context;

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Enhanced Multi-Color Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 via-pink-50 via-yellow-50 to-purple-100"></div>
      {/* Dynamic Colorful Blobs and Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-5 w-96 h-96 bg-gradient-to-br from-blue-300/30 via-cyan-200/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 right-10 w-80 h-80 bg-gradient-to-br from-pink-300/30 via-purple-200/20 to-pink-300/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute bottom-10 left-1/3 w-72 h-72 bg-gradient-to-br from-cyan-300/20 via-yellow-200/20 to-blue-300/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-br from-emerald-200/20 via-green-200/10 to-teal-300/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2.5s'}}></div>
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-gradient-to-br from-orange-200/20 via-yellow-100/10 to-red-300/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-blue-400/40 rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-indigo-400/50 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1/4 left-1/2 w-4 h-4 bg-pink-400/30 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-3/4 right-1/3 w-2 h-2 bg-cyan-400/40 rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute bottom-1/2 left-1/5 w-3 h-3 bg-emerald-400/35 rounded-full animate-bounce" style={{animationDelay: '2s'}}></div>
        {/* Geometric accents */}
        <div className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-blue-300/30 rotate-45 animate-spin" style={{animationDuration: '30s'}}></div>
        <div className="absolute bottom-1/3 right-1/3 w-12 h-12 border-2 border-pink-300/25 rotate-12 animate-spin" style={{animationDuration: '25s', animationDirection: 'reverse'}}></div>
        <div className="absolute top-2/3 left-1/4 w-10 h-10 border-2 border-yellow-300/20 rotate-30 animate-spin" style={{animationDuration: '35s'}}></div>
      </div>
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header Section - Reduced spacing */}
        <div className="mb-8">
          <Header />
        </div>
        {/* Speciality Menu Section - Vibrant card */}
        <div className="mb-10">
          <div className="bg-gradient-to-br from-white/80 via-blue-100/60 to-cyan-50/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-blue-100/40">
            <SpecialityMenu />
          </div>
        </div>
        {/* Top Doctors Section - Vibrant card */}
        <div className="mb-10">
          <div className="bg-gradient-to-br from-white/80 via-pink-100/60 to-purple-50/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-pink-100/40">
            <TopDoctors />
          </div>
        </div>
        {/* Banner Section - Reduced spacing */}
        <div className="mb-10">
          <Banner />
        </div>
        {/* Features Section - Pastel gradient card */}
        <div className="mb-10">
          <div className="bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50 rounded-2xl p-8 shadow-xl border-2 border-white/40">
            <div className="text-center mb-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                Why Choose <span className="text-primary">CureConnect</span>
              </h2>
              <p className="text-gray-600 text-base max-w-xl mx-auto">
                Experience healthcare reimagined
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-100/40 group hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">24/7 Availability</h3>
                <p className="text-gray-600 text-sm">Get medical consultation anytime, anywhere with instant booking.</p>
              </div>
              {/* Feature 2 */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-green-100/40 group hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Verified Doctors</h3>
                <p className="text-gray-600 text-sm">All healthcare professionals are thoroughly verified and certified.</p>
              </div>
              {/* Feature 3 */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-pink-100/40 group hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Personalized Care</h3>
                <p className="text-gray-600 text-sm">Receive personalized care with detailed health tracking.</p>
              </div>
            </div>
          </div>
        </div>
        {/* Stats Section - Compact design */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-white/80 via-blue-100/60 to-cyan-50/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-blue-100/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-primary mb-1">1000+</div>
                <div className="text-gray-600 text-sm">Certified Doctors</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary mb-1">50k+</div>
                <div className="text-gray-600 text-sm">Happy Patients</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary mb-1">4.9★</div>
                <div className="text-gray-600 text-sm">Average Rating</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary mb-1">24/7</div>
                <div className="text-gray-600 text-sm">Support Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;