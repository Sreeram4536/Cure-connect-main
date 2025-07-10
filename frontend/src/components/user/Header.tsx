// import { assets } from "../../assets/user/assets";

// const Header = () => {
//   return (
//     <div className="flex flex-col md:flex-row flex-wrap bg-primary rounded-lg px-6 md:px-10 lg:px-20">
//       {/*------------ Left Side ------------ */}
//       <div className="md:w-1/2 flex flex-col items-start justify-center gap-4 py-10 m-auto md:py-[10vw] md:mb-[-30px]">
//         <p className="text-3xl md:text-4xl lg:text-5xl text-white font-semibold leading-tight md:leading-tight lg:leading-tight">
//           Cure Health Issues, <br />
//           With Trusted Doctors
//         </p>
//         <div className="flex flex-col md:flex-row items-center gap-3 text-white text-sm fort-light">
//           <img className="w-28" src={assets.group_profiles} alt="" />
//           <p>
//             Simply browse through our extensive list of trusted doctors,{" "}
//             <br className="hidden sm:block" />
//             schedule your appointment hassle-free.
//           </p>
//         </div>
//         <a
//           href="#speciality"
//           className="flex items-center gap-2 bg-white px-8 py-3 rounded-full text-gray-600 text-sm m-auto md:m-0 hover:scale-105 transition-all duration-300"
//         >
//           Book appointment{" "}
//           <img className="w-3" src={assets.arrow_icon} alt="" />
//         </a>
//       </div>

//       {/*------------ Right Side ------------ */}
//       <div className="md:w-1/2 relative">
//         <img
//           className="w-full md:absolute bottom-0 h-auto rounded-lg"
//           src={assets.header_img}
//           alt=""
//         />
//       </div>
//     </div>
//   );
// };

// export default Header;

import { assets } from "../../assets/user/assets";
import { ArrowRight, CheckCircle, Play, Heart, Clock } from "lucide-react";

const Header = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl mx-4 lg:mx-8 mt-6 mb-12">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col lg:flex-row items-center px-6 lg:px-12 py-12 lg:py-20">
        {/* Left Content */}
        <div className="lg:w-1/2 text-center lg:text-left mb-10 lg:mb-0">
          <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <CheckCircle className="w-4 h-4 text-green-300 mr-2" />
            <span className="text-white text-sm font-medium">Trusted by 50,000+ patients</span>
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Your Health,
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Our Priority
            </span>
          </h1>
          
          <p className="text-blue-100 text-lg lg:text-xl mb-8 leading-relaxed">
            Connect with certified healthcare professionals. Book appointments instantly and get expert medical care from the comfort of your home.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start mb-8">
            <a
              href="#speciality"
              className="group bg-white text-blue-700 px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
            >
              Book Appointment
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
            
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-center lg:justify-start gap-8 text-white">
            <div className="text-center">
              <div className="text-2xl font-bold">1000+</div>
              <div className="text-blue-200 text-sm">Doctors</div>
            </div>
            <div className="w-px h-8 bg-white/30"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">50k+</div>
              <div className="text-blue-200 text-sm">Patients</div>
            </div>
            <div className="w-px h-8 bg-white/30"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">4.9★</div>
              <div className="text-blue-200 text-sm">Rating</div>
            </div>
          </div>
        </div>
        
        {/* Right Image */}
        <div className="lg:w-1/2 relative">
          <div className="relative z-10">
            <img
              className="w-full max-w-md mx-auto rounded-2xl shadow-2xl"
              src={assets.header_img}
              alt="Healthcare Professional"
            />
            <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500" />
                <div>
                  <div className="font-semibold text-gray-800">98%</div>
                  <div className="text-xs text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-500" />
                <div>
                  <div className="font-semibold text-gray-800">24/7</div>
                  <div className="text-xs text-gray-600">Available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;