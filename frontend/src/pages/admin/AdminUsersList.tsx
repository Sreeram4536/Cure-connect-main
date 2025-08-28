import { useEffect, useContext, useState, useRef } from "react";
import { AdminContext } from "../../context/AdminContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SearchBar from "../../components/common/SearchBar";
import Pagination from "../../components/common/Pagination";
import DataTable from "../../components/common/DataTable";

const AdminUsersList = () => {
  const navigate = useNavigate();
  const context = useContext(AdminContext);
  if (!context) throw new Error("AdminContext must be used inside provider");

  const { aToken, getUsersPaginated, toggleBlockUser } = context;

  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const itemsPerPage = 6;
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [targetAction, setTargetAction] = useState<"block" | "unblock" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  // Ref to track if we're currently searching to prevent race conditions
  const isSearching = useRef(false);

  // Simple fetch function without useCallback
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await getUsersPaginated(currentPage, itemsPerPage, searchQuery);
      setUsers(result.data);
      setTotalPages(result.totalPages);
  // setTotalCount(result.totalCount); // Removed unused state
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Effect for page changes only
  useEffect(() => {
    if (aToken) {
      fetchUsers();
    }
  }, [aToken, currentPage]);

  // Effect for search changes only
  useEffect(() => {
    if (aToken && searchQuery !== "") {
      setCurrentPage(1); // Reset to first page when searching
      fetchUsers();
    }
  }, [aToken, searchQuery]);

  useEffect(() => {
    if (!aToken) {
      navigate("/admin/login");
    }
  }, [aToken, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const handleToggleBlock = (userId: string, isBlocked: boolean) => {
    setTargetUser(users.find((u) => u._id === userId));
    setTargetAction(isBlocked ? "unblock" : "block");
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!targetUser || !targetAction) return;
    setActionLoading(true);
    try {
      await toggleBlockUser(targetUser._id, targetAction === "block");
      setConfirmOpen(false);
      setTargetUser(null);
      setTargetAction(null);
      fetchUsers();
    } catch (error) {
      console.error("Failed to toggle user block:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAction = () => {
    setConfirmOpen(false);
    setTargetUser(null);
    setTargetAction(null);
  };

  // Debounce search
  const handleSearch = (query: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      setSearchQuery(query);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const filteredUsers = users;

  // const filteredUsers = users.filter((user) => {
  //   const q = searchQuery.toLowerCase();
  //   return (
  //     user.name?.toLowerCase().includes(q) ||
  //     user.email?.toLowerCase().includes(q)
  //   );
  // });

  const columns = [
    {
      key: "index",
      header: "SL.NO",
      width: "0.5fr",
      hideOnMobile: true,
      render: (_: any, index: number) => (
        <p>{(currentPage - 1) * itemsPerPage + index + 1}</p>
      ),
    },
    {
      key: "image",
      header: "Image",
      width: "2fr",
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <img
            src={item.image || "/default-avatar.png"}
            alt="User"
            className="w-10 h-10 rounded-full object-cover border"
          />
        </div>
      ),
    },
    {
      key: "name",
      header: "Name",
      width: "2fr",
      render: (item: any) => (
        <p className="text-gray-800 font-medium truncate">{item.name}</p>
      ),
    },
    {
      key: "email",
      header: "Email",
      width: "3fr",
      render: (item: any) => (
        <p className="text-sm text-gray-600 truncate">{item.email}</p>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "1.5fr",
      render: (item: any) => (
        <span
          className={`px-3 py-1 text-xs rounded-full font-semibold w-fit transition-colors duration-300 ${
            item.isBlocked
              ? "bg-red-100 text-red-600"
              : "bg-green-100 text-green-600"
          }`}
        >
          {item.isBlocked ? "Blocked" : "Active"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "1.5fr",
      className: "text-right pr-4",
      render: (item: any) => (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleBlock(item._id, item.isBlocked);
          }}
          className={`px-4 py-1.5 text-sm rounded-lg font-medium text-white shadow-sm transition duration-200 ${
            item.isBlocked
              ? "bg-green-500 hover:bg-green-600"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {item.isBlocked ? "Unblock" : "Block"}
        </motion.button>
      ),
    },
  ];

  return (
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-semibold">👥 All Users</p>

      <div className="mb-4">
        <SearchBar
          placeholder="Search by name or email"
          // onSearch={(query) => {
          //   setSearchQuery(query);
          // }}
          onSearch={handleSearch}
        />
      </div>

      <DataTable
        data={filteredUsers}
        columns={columns}
        loading={loading}
        emptyMessage="No matching users found."
        gridCols="grid-cols-[0.5fr_2fr_2fr_3fr_1.5fr_1.5fr]"
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md animate-fadeIn">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-red-400 to-pink-400 mb-2">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 text-center">
                {targetAction === "block" ? "Block" : "Unblock"} User
              </h2>
              <p className="text-gray-600 text-center">
                Are you sure you want to <span className="font-semibold text-red-500">{targetAction}</span> <span className="font-semibold">{targetUser?.name}</span>?
                <br />This action can be reversed later.
              </p>
              <div className="flex gap-4 mt-4 w-full justify-center">
                <button
                  onClick={handleCancelAction}
                  className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`px-5 py-2 rounded-lg text-white font-semibold shadow transition ${
                    targetAction === "block"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-500 hover:bg-green-600"
                  } ${actionLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : targetAction === "block" ? "Block" : "Unblock"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersList;
