import { useContext, useEffect, useState } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import {
  getDoctorSlotRuleAPI,
  setDoctorSlotRuleAPI,
  getDoctorPreviewSlotsAPI,
  getDoctorSlotsForDateAPI,
  updateDoctorCustomSlotAPI,
  cancelDoctorCustomSlotAPI,
  setDoctorLeaveAPI,
  removeDoctorLeaveAPI,
} from "../../services/doctorServices";
import { DoctorContext } from "../../context/DoctorContext";

const daysOfWeekLabels = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const slotDurations = [15, 20, 30, 45, 60];

const defaultRule = {
  daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
  startTime: "09:00",
  endTime: "17:00",
  slotDuration: 30,
  breaks: [] as { start: string; end: string }[],
  customDays: [] as any[],
};

// Helper to format date as YYYY-MM-DD in local time
function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Clean customDays before saving - remove filtering, let backend handle validation
function cleanCustomDays(customDays: any[]) {
  return (customDays || [])
    .map((cd) => ({
      date: cd.date,
      leaveType: cd.leaveType,
      breaks: Array.isArray(cd.breaks) ? cd.breaks : [],
      reason: cd.reason || "",
      slots: Array.isArray(cd.slots) ? cd.slots : [],
    }))
    .filter((cd) => cd.date && cd.leaveType);
}

const DoctorSlotManager = () => {
  const { loading: contextLoading } = useContext(DoctorContext);
  const [rule, setRule] = useState({ ...defaultRule });
  const [loading, setLoading] = useState(true);
  const [previewSlots, setPreviewSlots] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [editSlot, setEditSlot] = useState<any | null>(null);
  const [editTime, setEditTime] = useState("");
  const [editDuration, setEditDuration] = useState<number>(30);
  const [markingLeave, setMarkingLeave] = useState(false);
  const [leaveType, setLeaveType] = useState<'full' | 'break' | 'custom'>('full');

  // Fetch existing rule on mount
  useEffect(() => {
    fetchRule();
  }, []);

  // Fetch rule data
  const fetchRule = async () => {
    try {
      const { data } = await getDoctorSlotRuleAPI();
      if (data.rule) setRule(data.rule);
    } catch {
      // No rule set yet
    } finally {
      setLoading(false);
    }
  };

  // Save rule
  const saveRule = async () => {
    setSaving(true);
    try {
      // Ensure customDays is always present and valid
      const ruleToSave = {
        ...rule,
        customDays: cleanCustomDays(rule.customDays),
      };
      await setDoctorSlotRuleAPI(ruleToSave);
      toast.success("Slot rule saved!");
      fetchPreviewSlots();
    } catch (error) {
      toast.error("Failed to save rule");
      console.log(error);
    } finally {
      setSaving(false);
    }
  };

  // Fetch preview slots for selected month
  const fetchPreviewSlots = async () => {
    setPreviewing(true);
    try {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      const { data } = await getDoctorPreviewSlotsAPI(year, month);
      console.log("Preview slots API response:", data);

      setPreviewSlots(Array.isArray(data.slots) ? data.slots : []);
    } catch {
      toast.error("Failed to fetch preview slots");
    } finally {
      setPreviewing(false);
    }
  };

  // Fetch slots for a specific date
  const fetchSlotsForDate = async (date: string) => {
    setPreviewing(true);
    try {
      const { data } = await getDoctorSlotsForDateAPI(date);

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch slots");
      }

      setPreviewSlots(data.slots || []);
    } catch (error) {
      toast.error("Failed to fetch slots for date");
    } finally {
      setPreviewing(false);
    }
  };

  // Handle rule changes
  const handleDayToggle = (dayIdx: number) => {
    setRule((prev) => {
      const days = prev.daysOfWeek.includes(dayIdx)
        ? prev.daysOfWeek.filter((d) => d !== dayIdx)
        : [...prev.daysOfWeek, dayIdx];
      return { ...prev, daysOfWeek: days.sort((a, b) => a - b) };
    });
  };

  const handleBreakChange = (
    idx: number,
    field: "start" | "end",
    value: string
  ) => {
    setRule((prev) => {
      const breaks = [...prev.breaks];
      breaks[idx][field] = value;
      return { ...prev, breaks };
    });
  };

  const addBreak = () => {
    setRule((prev) => ({
      ...prev,
      breaks: [...prev.breaks, { start: "12:00", end: "13:00" }],
    }));
  };

  const removeBreak = (idx: number) => {
    setRule((prev) => {
      const breaks = [...prev.breaks];
      breaks.splice(idx, 1);
      return { ...prev, breaks };
    });
  };

  // Handle marking a day as leave
  const handleMarkAsLeave = async () => {
    if (!selectedDay) return;
    
    setMarkingLeave(true);
    try {
      const response = await setDoctorLeaveAPI(selectedDay, leaveType);
      
      if (response.data.success) {
        toast.success(response.data.message || "Day marked as leave successfully!");
        
        // Show leave management result if available
        if (response.data.data?.leaveManagementResult) {
          const result = response.data.data.leaveManagementResult;
          if (result.cancelledAppointments > 0) {
            toast.info(`${result.cancelledAppointments} appointments cancelled and ₹${result.refundedAmount} refunded`);
          } else {
            toast.info("No appointments were cancelled for this date");
          }
        }
        
        // Refresh the rule data and preview slots to show the updated calendar
        await fetchRule();
        fetchPreviewSlots();
        setSelectedDay(null);
      } else {
        toast.error(response.data.message || "Failed to mark day as leave");
      }
    } catch (error: any) {
      console.error("Error marking day as leave:", error);
      toast.error(error.response?.data?.message || "Failed to mark day as leave");
    } finally {
      setMarkingLeave(false);
    }
  };

  // Handle removing leave for a day
  const handleRemoveLeave = async () => {
    if (!selectedDay) return;
    
    setMarkingLeave(true);
    try {
      const response = await removeDoctorLeaveAPI(selectedDay);
      
      if (response.data.success) {
        toast.success("Leave removed successfully!");
        await fetchRule();
        fetchPreviewSlots();
        setSelectedDay(null);
      } else {
        toast.error(response.data.message || "Failed to remove leave");
      }
    } catch (error: any) {
      console.error("Error removing leave:", error);
      toast.error(error.response?.data?.message || "Failed to remove leave");
    } finally {
      setMarkingLeave(false);
    }
  };

  // Check if the selected day is already marked as leave
  const isDayMarkedAsLeave = () => {
    if (!selectedDay) return false;
    return rule.customDays?.some((cd: any) => cd.date === selectedDay);
  };

  const getLeaveTypeForDay = () => {
    if (!selectedDay) return null;
    const customDay = rule.customDays?.find((cd: any) => cd.date === selectedDay);
    return customDay?.leaveType || null;
  };

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Slot Management</h1>
          <p className="text-gray-600">Configure your availability and manage appointment slots</p>
        </div>
        
        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your slot configuration...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rule Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Slot Configuration</h2>
              </div>

              {/* Working Days */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Working Days</label>
                <div className="grid grid-cols-7 gap-2">
                  {daysOfWeekLabels.map((label, idx) => (
                    <label
                      key={label}
                      className="relative cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={rule.daysOfWeek.includes(idx)}
                        onChange={() => handleDayToggle(idx)}
                        className="sr-only"
                      />
                      <div className={`w-full aspect-square rounded-xl border-2 flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                        rule.daysOfWeek.includes(idx)
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-500 text-white shadow-lg'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                      }`}>
                        {label.slice(0, 3)}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Time Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={rule.startTime}
                    onChange={(e) =>
                      setRule((prev) => ({ ...prev, startTime: e.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={rule.endTime}
                    onChange={(e) =>
                      setRule((prev) => ({ ...prev, endTime: e.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (min)</label>
                  <select
                    value={rule.slotDuration}
                    onChange={(e) =>
                      setRule((prev) => ({
                        ...prev,
                        slotDuration: Number(e.target.value),
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {slotDurations.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Breaks */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Breaks (Optional)</label>
                <div className="space-y-3">
                  {rule.breaks.map((br, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <input
                        type="time"
                        value={br.start}
                        onChange={(e) =>
                          handleBreakChange(idx, "start", e.target.value)
                        }
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-gray-500 font-medium">to</span>
                      <input
                        type="time"
                        value={br.end}
                        onChange={(e) =>
                          handleBreakChange(idx, "end", e.target.value)
                        }
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => removeBreak(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addBreak}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Break
                  </button>
                </div>
              </div>

              {/* Custom Days */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Custom Days (Leave/Breaks)</label>
                <div className="space-y-3">
                  {rule.customDays?.map((cd, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="flex gap-3 items-center mb-3">
                        <input
                          type="date"
                          value={cd.date}
                          onChange={(e) => {
                            const customDays = [...rule.customDays];
                            customDays[idx].date = formatLocalDate(
                              new Date(e.target.value)
                            );
                            setRule((prev) => ({ ...prev, customDays }));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <select
                          value={cd.leaveType}
                          onChange={(e) => {
                            const customDays = [...rule.customDays];
                            customDays[idx].leaveType = e.target.value;
                            if (e.target.value === "full")
                              customDays[idx].breaks = [];
                            setRule((prev) => ({ ...prev, customDays }));
                          }}
                          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="full">Full Day Leave</option>
                          <option value="break">Partial Leave</option>
                        </select>
                        <button
                          onClick={() => {
                            const customDays = [...rule.customDays];
                            customDays.splice(idx, 1);
                            setRule((prev) => ({ ...prev, customDays }));
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      
                      {cd.leaveType === "break" && (
                        <div className="space-y-2 mb-3">
                          {cd.breaks?.map((br: any, bidx: number) => (
                            <div key={bidx} className="flex items-center gap-2">
                              <input
                                type="time"
                                value={br.start}
                                onChange={(e) => {
                                  const customDays = [...rule.customDays];
                                  customDays[idx].breaks[bidx].start =
                                    e.target.value;
                                  setRule((prev) => ({ ...prev, customDays }));
                                }}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <span className="text-gray-500">to</span>
                              <input
                                type="time"
                                value={br.end}
                                onChange={(e) => {
                                  const customDays = [...rule.customDays];
                                  customDays[idx].breaks[bidx].end = e.target.value;
                                  setRule((prev) => ({ ...prev, customDays }));
                                }}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <button
                                onClick={() => {
                                  const customDays = [...rule.customDays];
                                  customDays[idx].breaks.splice(bidx, 1);
                                  setRule((prev) => ({ ...prev, customDays }));
                                }}
                                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const customDays = [...rule.customDays];
                              customDays[idx].breaks = customDays[idx].breaks || [];
                              customDays[idx].breaks.push({
                                start: "12:00",
                                end: "13:00",
                              });
                              setRule((prev) => ({ ...prev, customDays }));
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Break
                          </button>
                        </div>
                      )}
                      
                      <input
                        type="text"
                        placeholder="Reason (optional)"
                        value={cd.reason || ""}
                        onChange={(e) => {
                          const customDays = [...rule.customDays];
                          customDays[idx].reason = e.target.value;
                          setRule((prev) => ({ ...prev, customDays }));
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setRule((prev) => ({
                        ...prev,
                        customDays: [
                          ...(prev.customDays || []),
                          { date: "", leaveType: "full", breaks: [], reason: "" },
                        ],
                      }))
                    }
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Custom Day
                  </button>
                </div>
              </div>

              <button
                onClick={saveRule}
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Configuration
                  </>
                )}
              </button>
            </div>

            {/* Slot Calendar */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Slot Calendar</h2>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <DatePicker
                  selected={selectedMonth}
                  onChange={(date) => date && setSelectedMonth(date)}
                  dateFormat="MMMM yyyy"
                  showMonthYearPicker
                  minDate={new Date()}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  
                />
                <button
                  onClick={fetchPreviewSlots}
                  disabled={previewing}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {previewing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Show Slots
                    </>
                  )}
                </button>
              </div>

              <div className="flex gap-6 mb-6">
                <span className="flex items-center gap-2 text-sm">
                  <span className="w-4 h-4 rounded-full bg-red-400"></span>
                  Full Leave Day
                </span>
                <span className="flex items-center gap-2 text-sm">
                  <span className="w-4 h-4 rounded-full bg-yellow-300"></span>
                  Partial Leave Day
                </span>
                <span className="flex items-center gap-2 text-sm">
                  <span className="w-4 h-4 rounded-full bg-orange-400"></span>
                  Custom Leave Day
                </span>
              </div>

              {/* Calendar Grid */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="grid grid-cols-7">
                  {/* Day headers */}
                  {"Sun,Mon,Tue,Wed,Thu,Fri,Sat".split(",").map((day) => (
                    <div
                      key={day}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-semibold text-center py-3 border-b border-gray-200"
                    >
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {(() => {
                    const year = selectedMonth.getFullYear();
                    const month = selectedMonth.getMonth();
                    const firstDay = new Date(year, month, 1);
                    const lastDay = new Date(year, month + 1, 0);
                    const daysInMonth = lastDay.getDate();
                    const startDay = firstDay.getDay();
                    const cells = [];
                    
                    // Fill empty cells before first day
                    for (let i = 0; i < startDay; i++)
                      cells.push(<div key={"empty-" + i} className="min-h-[80px] bg-gray-50"></div>);
                    
                    // Group slots by date
                    const slotMap = previewSlots.reduce((acc: any, slot: any) => {
                      if (!acc[slot.date]) acc[slot.date] = [];
                      acc[slot.date].push(slot);
                      return acc;
                    }, {});

                    const customDayMap = (rule.customDays || []).reduce(
                      (acc: any, cd: any) => {
                        acc[cd.date] = cd;
                        return acc;
                      },
                      {}
                    );
                    
                    const todayStr = formatLocalDate(new Date());
                    
                    for (let d = 1; d <= daysInMonth; d++) {
                      const dateStr = formatLocalDate(new Date(year, month, d));
                      const slots = slotMap[dateStr] || [];
                      const customDay = customDayMap[dateStr];
                      const isPast = dateStr < todayStr;
                      
                      let dayBg = "bg-white";
                      if (customDay) {
                        if (customDay.leaveType === "full") {
                          dayBg = "bg-red-100";
                        } else if (customDay.leaveType === "break") {
                          dayBg = "bg-yellow-100";
                        } else if (customDay.leaveType === "custom") {
                          dayBg = "bg-orange-100";
                        }
                      }
                      
                      cells.push(
                        <div
                          key={dateStr}
                          className={`min-h-[80px] border-r border-b border-gray-200 p-2 flex flex-col gap-1 transition-all duration-200 ${dayBg} ${
                            isPast ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-blue-50"
                          }`}
                          onClick={
                            isPast
                              ? undefined
                              : () => {
                                  setSelectedDay(dateStr);
                                  fetchSlotsForDate(dateStr);
                                }
                          }
                        >
                          <div className="font-bold text-sm text-gray-700 mb-1 flex items-center justify-between">
                            <span>{d}</span>
                            {customDay && (
                              <span className={`w-2 h-2 rounded-full ${
                                customDay.leaveType === "full" ? "bg-red-500" :
                                customDay.leaveType === "break" ? "bg-yellow-500" :
                                "bg-orange-500"
                              }`}></span>
                            )}
                          </div>
                          {customDay ? (
                            <span className="text-xs font-medium text-red-600">
                              {customDay.leaveType === "full" ? "Full Leave" :
                               customDay.leaveType === "break" ? "Partial Leave" :
                               "Custom Leave"}
                            </span>
                          ) : slots.length === 0 ? (
                            <span className="text-xs text-gray-400">No slots</span>
                          ) : (
                            <span className="text-xs text-blue-600 font-medium">
                              {slots.length} slots
                            </span>
                          )}
                        </div>
                      );
                    }
                    return cells;
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slot List Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative max-h-[90vh] overflow-hidden">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
              onClick={() => setSelectedDay(null)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Slots for {selectedDay}
            </h3>

            {/* Leave Management Section */}
            <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Leave Management
              </h4>
              
              {isDayMarkedAsLeave() ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    This day is marked as <span className="font-semibold">{getLeaveTypeForDay()} leave</span>
                  </div>
                  <button
                    onClick={handleRemoveLeave}
                    disabled={markingLeave}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {markingLeave ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Removing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Remove Leave
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 mb-3">
                    Mark this day as leave to automatically cancel all appointments and process refunds.
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Leave Type:</label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value as 'full' | 'break' | 'custom')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="full">Full Day Leave</option>
                      <option value="break">Partial Leave (Break)</option>
                      <option value="custom">Custom Leave</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={handleMarkAsLeave}
                    disabled={markingLeave}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-2 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {markingLeave ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Marking as Leave...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Mark as Leave
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto mb-4">
              {previewSlots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>No slots for this day.</p>
                </div>
              ) : (
                previewSlots.map((slot: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200"
                  >
                    <div className="flex-1">
                      <span className="font-mono text-sm font-medium text-gray-700">
                        {slot.start} {slot.end ? `- ${slot.end}` : ""}
                      </span>
                      {slot.customDuration && (
                        <span className="ml-2 text-blue-600 text-xs font-medium">
                          ({slot.customDuration}m)
                        </span>
                      )}
                    </div>
                    <button
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:bg-blue-100 p-2 rounded-lg transition-colors"
                      onClick={() => {
                        setEditSlot(slot);
                        setEditTime(slot.start);
                        setEditDuration(slot.customDuration || 30);
                      }}
                    >
                      Edit
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <button
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
              onClick={() => {
                setEditSlot({
                  date: selectedDay,
                  start: "",
                  customDuration: 30,
                });
                setEditTime("");
                setEditDuration(30);
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Slot
            </button>
          </div>
        </div>
      )}

      {/* Edit/Add Slot Modal */}
      {editSlot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
              onClick={() => setEditSlot(null)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {editSlot.start ? "Edit Slot" : "Add Slot"}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={editDuration}
                  min={5}
                  max={180}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <button
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
                onClick={async () => {
                  try {
                    await updateDoctorCustomSlotAPI(
                      editSlot.date,
                      editTime,
                      editDuration
                    );
                    toast.success(
                      editSlot.start ? "Slot updated!" : "Slot added!"
                    );
                    setEditSlot(null);
                    setSelectedDay(null);
                    fetchPreviewSlots();
                  } catch (err: any) {
                    toast.error(
                      err?.response?.data?.message ||
                        (editSlot.start
                          ? "Failed to update slot"
                          : "Failed to add slot")
                    );
                  }
                }}
              >
                {editSlot.start ? "Save Changes" : "Add Slot"}
              </button>
              
              {editSlot.start && (
                <button
                  className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg"
                  onClick={async () => {
                    try {
                      await cancelDoctorCustomSlotAPI(editSlot.date, editTime);
                      toast.success("Slot cancelled!");
                      setEditSlot(null);
                      setSelectedDay(null);
                      fetchPreviewSlots();
                    } catch (err: any) {
                      toast.error(
                        err?.response?.data?.message || "Failed to cancel slot"
                      );
                    }
                  }}
                >
                  Cancel Slot
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSlotManager;
