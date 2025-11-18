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

      {/* ⭐ Responsive horizontal scroll of up to 5 doctors ⭐ */}
      <div
        className="w-full max-w-full overflow-x-auto pb-4 [-webkit-overflow-scrolling:_touch]"
      >
        <div className="flex gap-6 min-w-[350px] md:min-w-0 justify-start md:justify-center">
          {doctors.slice(0, 5).map((item: Doctor, index: number) => (
            <div
              onClick={() => {
                navigate(`/appointment/${item._id}`);
                scrollTo(0, 0);
              }}
              key={index}
              className="flex-shrink-0 w-64 sm:w-60 md:w-56 border border-blue-200 rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-2 hover:shadow-xl transition-all duration-500 bg-white shadow-md"
              style={{ minWidth: 220 }}
            >
              <img className="bg-blue-50 w-full h-44 object-cover" src={item.image} alt="" />
              <div className="p-4">
                {item.available ? (
                  <div className="flex items-center gap-2 text-sm text-green-500 mb-1">
                    <p className="w-2 h-2 bg-green-500 rounded-full"></p>
                    <p>Available</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-red-500 mb-1">
                    <p className="w-2 h-2 bg-red-500 rounded-full"></p>
                    <p>Not Available</p>
                  </div>
                )}
                <p className="text-gray-900 text-lg font-semibold truncate">{item.name}</p>
                <p className="text-gray-600 text-sm truncate">{item.speciality}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          navigate("/doctors");
          scrollTo(0, 0);
        }}
        className="bg-blue-50 text-gray-600 px-12 py-3 rounded-full mt-10 shadow hover:bg-blue-100 transition"
      >
        More Doctors
      </button>
    </div>
  );
};

export default TopDoctors;
