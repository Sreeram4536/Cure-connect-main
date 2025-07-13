import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import type { Doctor } from "../../assets/user/assets";
import SearchBar from "../../components/common/SearchBar";
import Pagination from "../../components/common/Pagination";
import { FaSort, FaChevronDown, FaTimes } from 'react-icons/fa';
import { ArrowDownIcon, ArrowUpIcon, CurrencyRupeeIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const Doctors = () => {
  const navigate = useNavigate();
  const { speciality } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>();
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
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
  }, [currentPage, speciality, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const result = await getDoctorsPaginated(currentPage, itemsPerPage, speciality, searchQuery, sortBy, sortOrder);
      setDoctors(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortOptions = [
    { label: "Experience (High to Low)", by: "experience", order: "desc", icon: <ArrowDownIcon className="h-5 w-5 text-indigo-500" />, sub: <AcademicCapIcon className="h-5 w-5 text-indigo-500" /> },
    { label: "Experience (Low to High)", by: "experience", order: "asc", icon: <ArrowUpIcon className="h-5 w-5 text-indigo-500" />, sub: <AcademicCapIcon className="h-5 w-5 text-indigo-500" /> },
    { label: "Fees (High to Low)", by: "fees", order: "desc", icon: <ArrowDownIcon className="h-5 w-5 text-indigo-500" />, sub: <CurrencyRupeeIcon className="h-5 w-5 text-indigo-500" /> },
    { label: "Fees (Low to High)", by: "fees", order: "asc", icon: <ArrowUpIcon className="h-5 w-5 text-indigo-500" />, sub: <CurrencyRupeeIcon className="h-5 w-5 text-indigo-500" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-8 px-2 sm:px-8">
      <p className="text-gray-700 text-lg font-semibold mb-2">Browse through the doctors specialist.</p>
      <div className="flex flex-col sm:flex-row items-start gap-8 mt-5">
        <button
          className={`py-2 px-4 border rounded-lg text-base font-medium shadow-sm transition-all sm:hidden ${
            showFilter ? "bg-primary text-white" : "bg-white text-primary border-primary"
          }`}
          onClick={() => setShowFilter((prev) => !prev)}
        >
          Filters
        </button>
        <div
          className={`flex-col gap-2 text-base text-gray-700 ${
            showFilter ? "flex" : "hidden sm:flex"
          }`}
        >
          {/* Filter options and Sort button */}
          {!showSort && (
            <>
              {["General physician", "Gynecologist", "Dermatologist", "Pediatrician", "Neurologist", "Gastroenterologist"].map((spec) => (
                <p
                  key={spec}
                  onClick={() => {
                    if (speciality !== spec) {
                      setCurrentPage(1);
                      navigate(`/doctors/${spec}`);
                    } else {
                      navigate("/doctors");
                      setCurrentPage(1);
                    }
                  }}
                  className={`w-[94vw] sm:w-auto pl-3 py-1 pr-8 border border-gray-300 rounded-md shadow-sm transition-all cursor-pointer font-medium mb-1 text-sm hover:bg-indigo-100 hover:text-indigo-700 ${
                    speciality === spec ? "bg-indigo-100 text-indigo-700 border-indigo-300" : "bg-white"
                  }`}
                >
                  {spec}
                </p>
              ))}
              <button
                className="mt-3 bg-indigo-500 text-white rounded-md px-4 py-2 font-semibold shadow hover:bg-indigo-600 transition"
                onClick={() => setShowSort(true)}
              >
                Sort
              </button>
            </>
          )}

          {/* Sort options only */}
          {showSort && (
            <div className="mt-3 bg-white rounded-lg shadow border border-gray-200 p-2 w-full min-w-[180px] z-50 relative">
              <div className="font-semibold text-gray-800 mb-1 flex items-center gap-1 text-sm">
                <FaSort className="text-indigo-500" /> Sort By
              </div>
              <div className="flex flex-col gap-1">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.label}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors font-medium text-left border border-transparent hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm ${
                      sortBy === opt.by && sortOrder === opt.order ? "bg-indigo-100 text-indigo-700 border-indigo-300" : "text-gray-700"
                    }`}
                    onClick={() => {
                      setSortBy(opt.by);
                      setSortOrder(opt.order as 'asc' | 'desc');
                      setCurrentPage(1);
                      setShowSort(false);
                    }}
                  >
                    {opt.sub}
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
                <button
                  className="flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors font-medium text-left border border-transparent hover:bg-red-50 text-red-600 mt-1 text-sm"
                  onClick={() => {
                    setSortBy(undefined);
                    setSortOrder(undefined);
                    setCurrentPage(1);
                    setShowSort(false);
                  }}
                  disabled={!sortBy}
                >
                  <FaTimes /> Clear Sort
                </button>
                <button
                  className="mt-2 text-xs text-gray-500 hover:text-indigo-600"
                  onClick={() => setShowSort(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right side: Search bar + doctor cards */}
        <div className="w-full flex flex-col gap-6">
          {/* Search bar */}
          <div className="mb-2 w-full max-w-md">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {doctors.map((item: Doctor, index: number) => (
                  <div
                    onClick={() => navigate(`/appointment/${item._id}`)}
                    className="group border border-blue-200 rounded-2xl overflow-hidden cursor-pointer bg-white shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative"
                    key={index}
                  >
                    <div className="relative h-40 w-full overflow-hidden bg-blue-50 flex items-center justify-center">
                      <img className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300" src={item.image} alt="" />
                      {item.available ? (
                        <span className="absolute top-3 right-3 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold shadow">Available</span>
                      ) : (
                        <span className="absolute top-3 right-3 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-semibold shadow">Not Available</span>
                      )}
                    </div>
                    <div className="p-5 flex flex-col gap-2">
                      <p className="text-gray-900 text-lg font-bold truncate">{item.name}</p>
                      <p className="text-indigo-600 text-sm font-medium">{item.speciality}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-gray-500 text-xs">Experience: <span className="font-semibold text-gray-700">{item.experience} yrs</span></span>
                        <span className="text-gray-500 text-xs">Fees: <span className="font-semibold text-gray-700">₹{item.fees}</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
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
