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

// Helper to check if date is in the past
function isPastDate(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(dateStr);
  return selectedDate < today;
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
  const [leaveReason, setLeaveReason] = useState("");

  // Fetch existing rule on mount
  useEffect(() => {
    (async () => {
      try {
        // const { data } = await axios.get("/api/doctor/slot-rule");
        const { data } = await getDoctorSlotRuleAPI();
        if (data.rule) setRule(data.rule);
      } catch {
        // No rule set yet
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  // Mark day as leave
  const markDayAsLeave = async (date: string, leaveType: "full" | "break", reason: string = "") => {
    if (isPastDate(date)) {
      toast.error("Cannot modify past dates");
      return;
    }

    try {
      // Add to customDays
      const updatedCustomDays = [...(rule.customDays || [])];
      const existingIndex = updatedCustomDays.findIndex(cd => cd.date === date);
      
      if (existingIndex >= 0) {
        updatedCustomDays[existingIndex] = {
          date,
          leaveType,
          breaks: leaveType === "break" ? [{ start: "12:00", end: "13:00" }] : [],
          reason
        };
      } else {
        updatedCustomDays.push({
          date,
          leaveType,
          breaks: leaveType === "break" ? [{ start: "12:00", end: "13:00" }] : [],
          reason
        });
      }

      setRule(prev => ({
        ...prev,
        customDays: updatedCustomDays
      }));

      await saveRule();
      toast.success(`Day marked as ${leaveType === "full" ? "full day leave" : "partial leave"}`);
      setSelectedDay(null);
      setLeaveReason("");
    } catch (error) {
      toast.error("Failed to mark day as leave");
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

  if (contextLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Slot Management</h1>
          <p className="text-gray-600">Manage your appointment availability and schedule</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rule Form */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Schedule Settings</h3>
              </div>

              <div className="space-y-6">
                {/* Working Days */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Working Days</label>
                  <div className="grid grid-cols-7 gap-2">
                    {daysOfWeekLabels.map((label, idx) => (
                      <label
                        key={label}
                        className="relative flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all hover:border-blue-300"
                      >
                        <input
                          type="checkbox"
                          checked={rule.daysOfWeek.includes(idx)}
                          onChange={() => handleDayToggle(idx)}
                          className="sr-only"
                        />
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                          rule.daysOfWeek.includes(idx)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}>
                          {label.slice(0, 3)}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Time Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={rule.startTime}
                      onChange={(e) =>
                        setRule((prev) => ({ ...prev, startTime: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Slot Duration</label>
                    <select
                      value={rule.slotDuration}
                      onChange={(e) =>
                        setRule((prev) => ({
                          ...prev,
                          slotDuration: Number(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      {slotDurations.map((d) => (
                        <option key={d} value={d}>
                          {d} minutes
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Breaks */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Breaks (Optional)</label>
                  <div className="space-y-3">
                    {rule.breaks.map((br, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <input
                          type="time"
                          value={br.start}
                          onChange={(e) =>
                            handleBreakChange(idx, "start", e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="text-gray-500 font-medium">to</span>
                        <input
                          type="time"
                          value={br.end}
                          onChange={(e) =>
                            handleBreakChange(idx, "end", e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Break
                    </button>
                  </div>
                </div>

                {/* Custom Days */}
                <div>
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
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          <div className="space-y-2 ml-4">
                            {cd.breaks?.map((br: any, bidx: number) => (
                              <div key={bidx} className="flex gap-2 items-center">
                                <input
                                  type="time"
                                  value={br.start}
                                  onChange={(e) => {
                                    const customDays = [...rule.customDays];
                                    customDays[idx].breaks[bidx].start =
                                      e.target.value;
                                    setRule((prev) => ({ ...prev, customDays }));
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                  onClick={() => {
                                    const customDays = [...rule.customDays];
                                    customDays[idx].breaks.splice(bidx, 1);
                                    setRule((prev) => ({ ...prev, customDays }));
                                  }}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
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
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
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
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </div>
                  ) : (
                    "Save Settings"
                  )}
                </button>
              </div>
            </div>

            {/* Calendar Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Calendar View</h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <DatePicker
                    selected={selectedMonth}
                    onChange={(date) => date && setSelectedMonth(date)}
                    dateFormat="MMMM yyyy"
                    showMonthYearPicker
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={fetchPreviewSlots}
                    disabled={previewing}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 disabled:opacity-50"
                  >
                    {previewing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Loading...
                      </div>
                    ) : (
                      "Show Slots"
                    )}
                  </button>
                </div>

                <div className="flex gap-4 mb-4">
                  <span className="flex items-center gap-2 text-sm">
                    <span className="w-4 h-4 rounded bg-red-400"></span>
                    Leave Day
                  </span>
                  <span className="flex items-center gap-2 text-sm">
                    <span className="w-4 h-4 rounded bg-yellow-300"></span>
                    Partial Leave
                  </span>
                </div>

                {/* Calendar Grid */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Day headers */}
                  <div className="grid grid-cols-7 bg-gradient-to-r from-blue-50 to-indigo-50">
                    {"Sun,Mon,Tue,Wed,Thu,Fri,Sat".split(",").map((day) => (
                      <div
                        key={day}
                        className="text-blue-700 font-semibold text-center py-3 border-b border-gray-200"
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar days */}
                  <div className="grid grid-cols-7">
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
                        cells.push(<div key={"empty-" + i} className="min-h-[80px] border-r border-b border-gray-100"></div>);
                      
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
                      
                      for (let d = 1; d <= daysInMonth; d++) {
                        const dateStr = formatLocalDate(new Date(year, month, d));
                        const slots = slotMap[dateStr] || [];
                        const customDay = customDayMap[dateStr];
                        const isPast = isPastDate(dateStr);
                        
                        let dayBg = "";
                        if (customDay) {
                          if (customDay.leaveType === "full") {
                            dayBg = "bg-red-100 border-red-200";
                          } else if (customDay.leaveType === "break") {
                            dayBg = "bg-yellow-100 border-yellow-200";
                          }
                        }
                        
                        cells.push(
                          <div
                            key={dateStr}
                            className={`min-h-[80px] border-r border-b border-gray-200 p-2 flex flex-col gap-1 cursor-pointer transition-all hover:bg-blue-50 ${dayBg} ${isPast ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => {
                              if (!isPast) {
                                setSelectedDay(dateStr);
                                fetchSlotsForDate(dateStr);
                              }
                            }}
                          >
                            <div className="font-bold text-sm text-gray-700 mb-1">
                              {d}
                            </div>
                            {slots.length === 0 ? (
                              <span className="text-xs text-gray-400">No slots</span>
                            ) : (
                              <span className="text-xs text-blue-600 font-medium">
                                {slots.length} slots
                              </span>
                            )}
                            {customDay && (
                              <span className="text-xs text-gray-500">
                                {customDay.leaveType === "full" ? "Leave" : "Partial"}
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
          </div>
        )}

        {/* Slot List Modal */}
        {selectedDay && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {new Date(selectedDay).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <button
                    className="text-gray-400 hover:text-gray-700 transition-colors"
                    onClick={() => setSelectedDay(null)}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {previewSlots.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>No slots for this day</p>
                    </div>
                  ) : (
                    previewSlots.map((slot: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200"
                      >
                        <span className="font-mono text-sm text-blue-800">
                          {slot.start} {slot.end ? `- ${slot.end}` : ""}
                          {slot.customDuration && (
                            <span className="ml-2 text-blue-600">
                              ({slot.customDuration}m)
                            </span>
                          )}
                        </span>
                        <button
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
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

                <div className="space-y-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105"
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
                    + Add Slot
                  </button>
                  
                  <button
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105"
                    onClick={() => {
                      setLeaveReason("");
                      // Show leave modal
                      const leaveType = prompt("Enter leave type (full/break):", "full");
                      if (leaveType === "full" || leaveType === "break") {
                        const reason = prompt("Enter reason (optional):", "");
                        markDayAsLeave(selectedDay, leaveType, reason || "");
                      }
                    }}
                  >
                    Mark as Leave
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit/Add Slot Modal */}
        {editSlot && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {editSlot.start ? "Edit Slot" : "Add Slot"}
                  </h3>
                  <button
                    className="text-gray-400 hover:text-gray-700 transition-colors"
                    onClick={() => setEditSlot(null)}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (minutes)</label>
                    <input
                      type="number"
                      value={editDuration}
                      min={5}
                      max={180}
                      onChange={(e) => setEditDuration(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <button
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
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
                      className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105"
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
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorSlotManager;
