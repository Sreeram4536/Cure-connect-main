// import React, { useState, useEffect, useContext } from 'react';
// import { assets } from '../../assets/user/assets';
// import Footer from '../../components/common/Footer';
// import { useNavigate } from 'react-router-dom';
// import { AppContext } from '../../context/AppContext';

// const UserLandingPage: React.FC = () => {
//   const navigate = useNavigate();
//   const [scrollY, setScrollY] = useState(0);
//   const context = useContext(AppContext);

//   useEffect(() => {
//     const handleScroll = () => setScrollY(window.scrollY);
//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   // useEffect(() => {
//   //   if (context?.token) {
//   //     navigate('/home');
//   //   }
//   // }, [context?.token, navigate]);

//   const scrollToSection = (sectionId: string) => {
//     const el = document.getElementById(sectionId);
//     if (el) el.scrollIntoView({ behavior: 'smooth' });
//   };

//   const features = [
//     {
//       icon: '🩺',
//       title: 'Top Specialists',
//       description: 'Browse and consult highly experienced doctors across all specialties.'
//     },
//     {
//       icon: '💸',
//       title: 'Affordable Fees',
//       description: 'Quality healthcare at budgets you can afford. No hidden charges.'
//     },
//     {
//       icon: '⏰',
//       title: 'Instant Booking',
//       description: 'Schedule consultations in just a few clicks, anytime, anywhere.'
//     },
//     {
//       icon: '🖥️',
//       title: 'Secure Video Calls',
//       description: 'HD video consultations with end-to-end encryption.'
//     },
//     {
//       icon: '📑',
//       title: 'Digital Prescriptions',
//       description: 'Receive prescriptions directly in the app.'
//     },
//     {
//       icon: '🔍',
//       title: 'Health Records',
//       description: 'Manage past consultations and prescriptions in one place.'
//     }
//   ];

//   const stats = [
//     { number: '100K+', label: 'Registered Users' },
//     { number: '20K+', label: 'Doctors Available' },
//     { number: '300K+', label: 'Consultations Done' },
//     { number: '4.8/5', label: 'User Satisfaction' }
//   ];

//   const ctaClass = "bg-primary text-white py-2 px-4 sm:py-2.5 sm:px-6 rounded-full text-sm sm:text-base font-medium transition-all duration-300 transform hover:-translate-y-1 shadow-[0_4px_12px_rgba(255,107,107,0.3)] hover:shadow-[0_6px_16px_rgba(255,107,107,0.4)]";

//   return (
//     <div className="min-h-screen bg-white overflow-x-hidden">
//       {/* Floating Particles */}
//       <div className="fixed top-[10%] left-[10%] w-2.5 h-2.5 bg-blue-100 rounded-full animate-pulse opacity-30" />
//       <div className="fixed top-[20%] right-[20%] w-4 h-4 bg-purple-100 rounded-full animate-bounce opacity-30" style={{ animationDelay: '2s' }} />
//       <div className="fixed bottom-[30%] left-[30%] w-2 h-2 bg-blue-100 rounded-full animate-ping opacity-30" style={{ animationDelay: '4s' }} />
//       <div className="fixed bottom-[20%] right-[10%] w-3 h-3 bg-purple-100 rounded-full animate-pulse opacity-30" style={{ animationDelay: '1s' }} />

//       {/* Header */}
//       <header className="flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-white">
//         <div className="flex items-center gap-2 text-xs">
//           <img className="w-36 sm:w-40 cursor-pointer" src={assets.logo} alt="Logo" onClick={() => navigate('/')} />
//         </div>
//         <div className="space-x-2 sm:space-x-4">
//           <button onClick={() => navigate('/login')} className={ctaClass}>Register as User</button>
//           <button onClick={() => navigate('/doctor/register')} className={ctaClass}>Register as Doctor</button>
//         </div>
//       </header>

//       {/* Hero */}
//       <section className="pt-32 pb-16 text-center text-gray-800">
//         <div className="max-w-6xl mx-auto px-5">
//           <h1 className="text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-bounce" style={{ animationDuration: '3s', animationIterationCount: 'infinite' }}>
//             Your Health, Our Priority
//           </h1>
//           <p className="text-xl mb-8 text-gray-600 max-w-2xl mx-auto">
//             Consult top doctors from the comfort of your home. Fast, secure, and affordable medical advice at your fingertips.
//           </p>
//           <button onClick={() => scrollToSection('features')} className="bg-primary text-white py-4 px-10 rounded-full text-base font-semibold transition-all duration-300 transform hover:-translate-y-1 shadow-[0_6px_16px_rgba(255,107,107,0.3)] hover:shadow-[0_8px_20px_rgba(255,107,107,0.4)]">Explore Features</button>
//         </div>
//       </section>

//       {/* Image */}
//       <section className="py-16 text-center">
//         <div className="max-w-6xl mx-auto px-5">
//           <div className="w-full max-w-2xl h-96 bg-gradient-to-br from-gray-50 to-gray-200 rounded-3xl overflow-hidden mx-auto border-2 border-gray-200 shadow-lg relative" style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)' }}>
//             <img
//               src={assets.about_image}
//               alt="Consultation"
//               className="w-full h-full object-contain object-center block"
//               draggable={false}
//             />
//           </div>
//         </div>
//       </section>

//       {/* Features */}
//       <section id="features" className="py-16 bg-gray-50 rounded-3xl my-8 mx-4 border border-gray-200">
//         <div className="max-w-6xl mx-auto px-5">
//           <h2 className="text-center text-4xl text-gray-800 mb-12 font-bold">Why Choose CureConnect?</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-8">
//             {features.map((f, i) => (
//               <div key={i} className="bg-white rounded-3xl p-8 border border-gray-200 transition-all duration-500 cursor-pointer relative overflow-hidden group hover:-translate-y-3 hover:scale-105 hover:border-blue-500 shadow-md hover:shadow-xl">
//                 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-blue-50 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
//                 <div className="w-[60px] h-[60px] bg-primary rounded-full flex items-center justify-center text-2xl mb-4 animate-spin" style={{ animationDuration: '10s' }}>
//                   {f.icon}
//                 </div>
//                 <h3 className="text-xl mb-2 font-semibold text-gray-800">{f.title}</h3>
//                 <p className="text-gray-600">{f.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Stats */}
//       <section className="py-16 text-center">
//         <div className="max-w-6xl mx-auto px-5">
//           <h2 className="text-gray-800 text-4xl mb-8 font-bold">Trusted by Thousands</h2>
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
//             {stats.map((s, i) => (
//               <div key={i} className="text-gray-800">
//                 <div className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//                   {s.number}
//                 </div>
//                 <div className="text-lg text-gray-600 mt-2">{s.label}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Registration Cards */}
//       <section id="register" className="py-32 text-center text-gray-800">
//         <div className="max-w-4xl mx-auto px-5 grid grid-cols-1 md:grid-cols-2 gap-12">
//           <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-md hover:shadow-xl transition hover:-translate-y-2">
//             <h3 className="text-2xl font-bold mb-4">Register as a User</h3>
//             <p className="text-gray-600 mb-6">Create your account to start consulting doctors immediately.</p>
//             <button onClick={() => navigate('/login')} className={ctaClass}>User Register</button>
//           </div>
//           <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-md hover:shadow-xl transition hover:-translate-y-2">
//             <h3 className="text-2xl font-bold mb-4">Register as a Doctor</h3>
//             <p className="text-gray-600 mb-6">Join our network of experts and expand your practice.</p>
//             <button onClick={() => navigate('/doctor/register')} className={ctaClass}>Doctor Register</button>
//           </div>
//         </div>
//       </section>

//       <Footer />
//     </div>
//   );
// };

// export default UserLandingPage;

import React, { useState, useEffect, useContext } from 'react';
import { assets } from '../../assets/user/assets';
import Footer from '../../components/common/Footer';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import SpecialityMenu from '../../components/user/SpecialityMenu';
import TopDoctors from '../../components/user/TopDoctors';
import Banner from '../../components/user/Banner';

const UserLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const context = useContext(AppContext);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redirect authenticated users to home
  useEffect(() => {
    if (context?.token) {
      navigate('/home');
    }
  }, [context?.token, navigate]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const ctaClass = "bg-primary text-white py-2 px-4 sm:py-2.5 sm:px-6 rounded-full text-sm sm:text-base font-medium transition-all duration-300 transform hover:-translate-y-1 shadow-[0_4px_12px_rgba(255,107,107,0.3)] hover:shadow-[0_6px_16px_rgba(255,107,107,0.4)]";

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
        {/* Header/Navbar */}
        <header className="flex flex-col md:flex-row justify-between items-center px-4 sm:px-10 py-4 mb-8 bg-white/80 backdrop-blur-sm rounded-2xl mx-4 mt-4 shadow-lg border border-white/40 gap-4">
          <div className="flex items-center gap-2">
            <img 
              className="w-36 sm:w-44 cursor-pointer" 
              src={assets.logo} 
              alt="Logo" 
              onClick={() => navigate('/')} 
            />
          </div>
          
          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <button 
              onClick={() => navigate('/')} 
              className="text-gray-700 hover:text-primary transition-colors font-medium"
            >
              HOME
            </button>
            <button 
              onClick={() => scrollToSection('speciality')} 
              className="text-gray-700 hover:text-primary transition-colors font-medium"
            >
              ALL DOCTORS
            </button>
            <button 
              onClick={() => scrollToSection('about')} 
              className="text-gray-700 hover:text-primary transition-colors font-medium"
            >
              ABOUT
            </button>
            <button 
              onClick={() => scrollToSection('contact')} 
              className="text-gray-700 hover:text-primary transition-colors font-medium"
            >
              CONTACT
            </button>
          </nav>
          
          {/* Registration Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button 
              onClick={() => navigate('/login')} 
              className="bg-primary text-white py-2 px-4 rounded-full text-sm font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              Register as User
            </button>
            <button 
              onClick={() => navigate('/doctor/register')} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-full text-sm font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              Register as Doctor
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-16 pb-12 text-center px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Your Health, Our Priority
            </h1>
            <p className="text-lg sm:text-xl mb-8 text-gray-700 max-w-2xl mx-auto">
              Consult top doctors from the comfort of your home. Fast, secure, and affordable medical advice at your fingertips.
            </p>
          </div>
        </section>

        {/* Speciality Menu Section */}
        <div id="speciality" className="mb-10 px-4">
          <div className="bg-gradient-to-br from-white/80 via-blue-100/60 to-cyan-50/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-blue-100/40">
            <SpecialityMenu />
          </div>
        </div>

        {/* Top Doctors Section */}
        <div className="mb-10 px-4">
          <div className="bg-gradient-to-br from-white/80 via-pink-100/60 to-purple-50/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-pink-100/40">
            <TopDoctors />
          </div>
        </div>

        {/* Banner Section */}
        <div className="mb-10 px-4">
          <Banner />
        </div>

        {/* Features Section */}
        <div id="about" className="mb-10 px-4">
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

        {/* Stats Section */}
        <div className="mb-8 px-4">
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

        {/* Call to Action Section */}
        <section id="contact" className="py-16 text-center px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to Get Started?</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied patients and healthcare professionals on CureConnect today.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border-2 border-blue-100/40 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Register as a User</h3>
                <p className="text-gray-600 mb-6">Create your account to start consulting doctors immediately.</p>
                <button onClick={() => navigate('/login')} className={ctaClass}>
                  Get Started
                </button>
              </div>
              
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border-2 border-pink-100/40 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Register as a Doctor</h3>
                <p className="text-gray-600 mb-6">Join our network of experts and expand your practice.</p>
                <button onClick={() => navigate('/doctor/register')} className={ctaClass}>
                  Join Now
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* <Footer /> */}
    </div>
  );
};

export default UserLandingPage;
