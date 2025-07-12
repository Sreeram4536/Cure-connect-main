import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import type { Doctor } from "../../assets/user/assets";
import SearchBar from "../../components/common/SearchBar";
import Pagination from "../../components/common/Pagination";

const Doctors = () => {
  const navigate = useNavigate();
  const { speciality } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 1;
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("TopDoctors must be used within an AppContextProvider");
  }

  const { getDoctorsPaginated } = context;

  // Reset page to 1 when speciality or searchQuery changes
  // useEffect(() => {
  //   setCurrentPage(1);
  // }, [speciality, searchQuery]);

  useEffect(() => {
    fetchDoctors();
    // eslint-disable-next-line
  }, [currentPage, speciality, searchQuery]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const result = await getDoctorsPaginated(currentPage, itemsPerPage, speciality, searchQuery);
      setDoctors(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-gray-600">Browse through the doctors specialist.</p>
      <div className="flex flex-col sm:flex-row items-start gap-5 mt-5">
        <button
          className={`py-1 px-3 border rounded text-sm transition-all sm:hidden ${
            showFilter ? "bg-primary text-white" : ""
          }`}
          onClick={() => setShowFilter((prev) => !prev)}
        >
          Filters
        </button>
        <div
          className={`flex-col gap-4 text-sm text-gray-600 ${
            showFilter ? "flex" : "hidden sm:flex"
          }`}
        >
          {[
            "General physician",
            "Gynecologist",
            "Dermatologist",
            "Pediatrician",
            "Neurologist",
            "Gastroenterologist",
          ].map((spec) => (
            <p
              key={spec}
              onClick={() => {
                if (speciality !== spec) {
                  setCurrentPage(1);
                  navigate(`/doctors/${spec}`);
                } else {
                  // Only reset if not already on this filter
                  navigate("/doctors");
                  setCurrentPage(1);
                }
              }}
              className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
                speciality === spec ? "bg-indigo-100 text-black" : ""
              }`}
            >
              {spec}
            </p>
          ))}
        </div>

        {/* Right side: Search bar + doctor cards */}
        <div className="w-full flex flex-col gap-4">
          {/* Search bar */}
          <div className="mb-4 w-80">
            <SearchBar
              placeholder="Search by name or email"
              onSearch={(query) => {
                if (query !== searchQuery) {
                  setSearchQuery(query);
                  setCurrentPage(1);
                }
              }}
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : doctors.length > 0 ? (
            <>
              {/* Doctor cards */}
              <div className="grid grid-cols-auto gap-4 gap-y-6">
                {doctors.map((item: Doctor, index: number) => (
                    <div
                      onClick={() => navigate(`/appointment/${item._id}`)}
                      className="border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500"
                      key={index}
                    >
                      <img className="bg-blue-50" src={item.image} alt="" />
                      <div className="p-4">
                        {item.available ? (
                          <div className="flex items-center gap-2 text-sm text-green-500">
                            <p className="w-2 h-2 bg-green-500 rounded-full"></p>
                            <p>Available</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-red-500">
                            <p className="w-2 h-2 bg-red-500 rounded-full"></p>
                            <p>Not Available</p>
                          </div>
                        )}

                        <p className="text-gray-900 text-lg font-medium">
                          {item.name}
                        </p>
                        <p className="text-gray-600 text-sm">{item.speciality}</p>
                      </div>
                    </div>
                  ))}
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          ) : (
            <div className="text-gray-500 mt-6 text-center w-full">
              No doctors found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Doctors;
