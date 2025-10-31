// import React from "react";
// import { motion } from "framer-motion";
// import type { Variants } from "framer-motion";

// interface Column {
//   key: string;
//   header: string;
//   width?: string;
//   render?: (item: any, index: number) => React.ReactNode;
//   hideOnMobile?: boolean;
//   className?: string;
// }

// interface DataTableProps {
//   data: any[];
//   columns: Column[];
//   loading?: boolean;
//   emptyMessage?: string;
//   onRowClick?: (item: any) => void;
//   className?: string;
//   gridCols?: string;
//   showHeader?: boolean;
//   containerClassName?: string;
// }

// const fadeInUp: Variants = {
//   hidden: { opacity: 0, y: 20 },
//   visible: (i: number) => ({
//     opacity: 1,
//     y: 0,
//     transition: { delay: i * 0.05, type: "spring", stiffness: 100 },
//   }),
// };

// const DataTable: React.FC<DataTableProps> = ({
//   data,
//   columns,
//   loading = false,
//   emptyMessage = "No data found.",
//   onRowClick,
//   className = "",
//   gridCols,
//   showHeader = true,
//   containerClassName = "",
// }) => {
//   const defaultGridCols = `grid-cols-[${columns.map(col => col.width || "1fr").join("_")}]`;

//   return (
//     <div className={`bg-white border rounded shadow-sm text-sm max-h-[80vh] min-h-[60vh] overflow-y-scroll ${containerClassName}`}>
//       {/* Table Header */}
//       {showHeader && (
//         <div className={`hidden sm:grid ${gridCols || defaultGridCols} py-3 px-6 border-b bg-gray-50 font-medium text-gray-700`}>
//           {columns.map((column) => (
//             <p key={column.key} className={`${column.hideOnMobile ? "max-sm:hidden" : ""} ${column.className || ""}`}>
//               {column.header}
//             </p>
//           ))}
//         </div>
//       )}

//       {/* Table Body */}
//       {loading ? (
//         <div className="text-center py-10 text-gray-500 text-sm">
//           Loading...
//         </div>
//       ) : data.length > 0 ? (
//         data.map((item, index) => (
//           <motion.div
//             key={item._id || index}
//             custom={index}
//             initial="hidden"
//             animate="visible"
//             variants={fadeInUp}
//             whileHover={{ scale: 1.01 }}
//             onClick={() => onRowClick?.(item)}
//             className={`flex flex-wrap justify-between max-sm:gap-2 sm:grid ${gridCols || defaultGridCols} items-center text-gray-600 py-3 px-6 border-b hover:bg-gray-50 transition ${
//               onRowClick ? "cursor-pointer" : ""
//             } ${className}`}
//           >
//             {columns.map((column) => (
//               <div key={column.key} className={`${column.hideOnMobile ? "max-sm:hidden" : ""} ${column.className || ""}`}>
//                 {column.render ? column.render(item, index) : item[column.key]}
//               </div>
//             ))}
//           </motion.div>
//         ))
//       ) : (
//         <div className="text-center py-10 text-gray-500 text-sm">
//           {emptyMessage}
//         </div>
//       )}
//     </div>
//   );
// };

// export default DataTable; 

import React from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

interface Column {
  key: string;
  header: string;
  width?: string;
  render?: (item: any, index: number) => React.ReactNode;
  hideOnMobile?: boolean;
  className?: string;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: any) => void;
  className?: string;
  gridCols?: string;
  showHeader?: boolean;
  containerClassName?: string;
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, type: "spring", stiffness: 120 },
  }),
};

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  loading = false,
  emptyMessage = "No data found.",
  onRowClick,
  className = "",
  gridCols,
  showHeader = true,
  containerClassName = "",
}) => {
  const defaultGridCols = `grid-cols-[${columns.map(col => col.width || "1fr").join("_")}]`;

  return (
    <div
      className={`bg-white border rounded-xl shadow-md text-[15px] overflow-y-auto max-h-[80vh] ${containerClassName}`}
    >
      {/* Header (desktop only) */}
      {showHeader && (
        <div
          className={`hidden sm:grid ${gridCols || defaultGridCols} py-3 px-6 border-b bg-gray-100 font-semibold text-gray-700 text-sm`}
        >
          {columns.map((column) => (
            <p
              key={column.key}
              className={`${column.hideOnMobile ? "max-sm:hidden" : ""} ${
                column.className || ""
              } truncate`}
            >
              {column.header}
            </p>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12 text-gray-500 text-sm">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mr-2"></div>
          Loading data...
        </div>
      ) : data.length > 0 ? (
        data.map((item, index) => (
          <motion.div
            key={item._id || index}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            whileHover={{ scale: 1.01 }}
            onClick={() => onRowClick?.(item)}
            className={`border-b last:border-b-0 sm:grid ${gridCols || defaultGridCols} items-center py-4 px-6 text-gray-700 transition-all hover:bg-gray-50 ${
              onRowClick ? "cursor-pointer" : ""
            } ${className} flex flex-col sm:flex-none gap-3 sm:gap-0`}
          >
            {columns.map((column) => (
              <div
                key={column.key}
                className={`${
                  column.hideOnMobile ? "max-sm:hidden" : ""
                } ${column.className || ""} w-full sm:w-auto`}
              >
                {/* Mobile View (label + value) */}
                <div className="sm:hidden flex justify-between gap-4">
                  <span className="text-gray-500 font-medium text-[14px]">
                    {column.header}
                  </span>
                  <span className="text-gray-800 text-right break-words max-w-[60%]">
                    {column.render
                      ? column.render(item, index)
                      : item[column.key]}
                  </span>
                </div>

                {/* Desktop View */}
                <div className="hidden sm:block text-[15px] truncate">
                  {column.render ? column.render(item, index) : item[column.key]}
                </div>
              </div>
            ))}
          </motion.div>
        ))
      ) : (
        <div className="text-center py-10 text-gray-500 text-sm">
          {emptyMessage}
        </div>
      )}
    </div>
  );
};

export default DataTable;

