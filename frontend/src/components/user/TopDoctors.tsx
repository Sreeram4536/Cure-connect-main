import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import type { Doctor } from "../../assets/user/assets";

const TopDoctors = () => {
  const navigate = useNavigate();
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("TopDoctors must be used within an AppContextProvider");
  }

  const { doctors, getDoctorsData } = context;

  useEffect(() => {
    getDoctorsData();
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 my-16 text-gray-900 md:mx-10">
      <h1 className="text-3xl font-medium">Top Doctors to Book</h1>
      <p className="sm:w-1/3 text-center text-sm">
        Simply browse through our extensive list of trusted doctors.
      </p>
      <div className="w-full grid grid-cols-auto gap-4 pt-5 gap-y-6 px-3 sm:px-0">
        {doctors
        .filter((doctor) => doctor.status === "approved")
        .slice(0, 10).map((item: Doctor, index: number) => (
          <div
            onClick={() => {
              navigate(`/appointment/${item._id}`);
              scrollTo(0, 0);
            }}
            className="border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500"
            key={index}
          >
            <img className="bg-blue-50" src={item.image} alt="" />
            <div className="p-4">
              {
  item.available ? (
    <div className="flex items-center gap-2 text-sm text-green-500">
      <p className="w-2 h-2 bg-green-500 rounded-full"></p>
      <p>Available</p>
    </div>
  ) : (
    <div className="flex items-center gap-2 text-sm text-red-500">
      <p className="w-2 h-2 bg-red-500 rounded-full"></p>
      <p>Not Available</p>
    </div>
  )
}
              <p className="text-gray-900 text-lg font-medium">{item.name}</p>
              <p className="text-gray-600 text-sm">{item.speciality}</p>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          navigate("/doctors");
          scrollTo(0, 0);
        }}
        className="bg-blue-50 text-gray-600 px-12 py-3 rounded-full mt-10"
      >
        more
      </button>
    </div>
  );
};

export default TopDoctors;


// import { useContext, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { AppContext } from "../../context/AppContext";
// import type { Doctor } from "../../assets/user/assets";
// import { Star, Clock, Users, MapPin } from "lucide-react";

// const TopDoctors = () => {
//   const navigate = useNavigate();
//   const context = useContext(AppContext);

//   if (!context) {
//     throw new Error("TopDoctors must be used within an AppContextProvider");
//   }

//   const { doctors, getDoctorsData } = context;

//   useEffect(() => {
//     getDoctorsData();
//   }, []);

//   return (
//     <div className="px-4 lg:px-8 mb-16">
//       <div className="text-center mb-12">
//         <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
//           Top Rated Doctors
//         </h2>
//         <p className="text-gray-600 text-lg max-w-2xl mx-auto">
//           Book appointments with our most experienced and highly-rated healthcare professionals
//         </p>
//       </div>
      
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
//         {doctors
//           .filter((doctor) => doctor.status === "approved")
//           .slice(0, 12)
//           .map((item: Doctor, index: number) => (
//             <div
//               onClick={() => {
//                 navigate(`/appointment/${item._id}`);
//                 scrollTo(0, 0);
//               }}
//               className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
//               key={index}
//             >
//               <div className="relative">
//                 <img
//                   className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
//                   src={item.image}
//                   alt={item.name}
//                 />
//                 <div className="absolute top-4 right-4">
//                   {item.available ? (
//                     <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center shadow-lg">
//                       <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
//                       Available
//                     </div>
//                   ) : (
//                     <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center shadow-lg">
//                       <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
//                       Busy
//                     </div>
//                   )}
//                 </div>
                
//                 {/* Rating Badge */}
//                 <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center shadow-lg">
//                   <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
//                   <span className="text-sm font-semibold text-gray-800">4.{Math.floor(Math.random() * 3) + 7}</span>
//                 </div>
//               </div>
              
//               <div className="p-6">
//                 <div className="mb-4">
//                   <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
//                     {item.name}
//                   </h3>
//                   <p className="text-blue-600 font-medium text-lg">{item.speciality}</p>
//                 </div>
                
//                 <div className="space-y-3 mb-6">
//                   <div className="flex items-center text-sm text-gray-600">
//                     <Clock className="w-4 h-4 mr-2" />
//                     <span>{Math.floor(Math.random() * 10) + 8} years experience</span>
//                   </div>
//                   <div className="flex items-center text-sm text-gray-600">
//                     <Users className="w-4 h-4 mr-2" />
//                     <span>{(Math.random() * 3 + 1).toFixed(1)}k+ patients treated</span>
//                   </div>
//                   <div className="flex items-center text-sm text-gray-600">
//                     <MapPin className="w-4 h-4 mr-2" />
//                     <span>Multi-specialty Hospital</span>
//                   </div>
//                 </div>
                
//                 <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform group-hover:scale-105 shadow-lg">
//                   Book Appointment
//                 </button>
//               </div>
//             </div>
//           ))}
//       </div>
      
//       <div className="text-center mt-12">
//         <button
//           onClick={() => {
//             navigate("/doctors");
//             scrollTo(0, 0);
//           }}
//           className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-12 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
//         >
//           View All Doctors
//         </button>
//       </div>
//     </div>
//   );
// };

// export default TopDoctors;