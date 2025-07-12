import { useEffect, useState } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { getDoctorSlotRuleAPI,setDoctorSlotRuleAPI,getDoctorPreviewSlotsAPI, getDoctorSlotsForDateAPI, updateDoctorCustomSlotAPI, cancelDoctorCustomSlotAPI } from "../../services/doctorServices";

const daysOfWeekLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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
  return (customDays || []).map(cd => ({
    date: cd.date,
    leaveType: cd.leaveType,
    breaks: Array.isArray(cd.breaks) ? cd.breaks : [],
    reason: cd.reason || "",
    slots: Array.isArray(cd.slots) ? cd.slots : []
  })).filter(cd => cd.date && cd.leaveType);
}

const DoctorSlotManager = () => {
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
      const ruleToSave = { ...rule, customDays: cleanCustomDays(rule.customDays) };
      await setDoctorSlotRuleAPI(ruleToSave);
      toast.success("Slot rule saved!");
      fetchPreviewSlots();
    } catch(error) {
      toast.error("Failed to save rule");
      console.log(error)
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
      const { data } = await getDoctorPreviewSlotsAPI(year,month);
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
        throw new Error(data.message || 'Failed to fetch slots');
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

  const handleBreakChange = (idx: number, field: "start" | "end", value: string) => {
    setRule((prev) => {
      const breaks = [...prev.breaks];
      breaks[idx][field] = value;
      return { ...prev, breaks };
    });
  };

  const addBreak = () => {
    setRule((prev) => ({ ...prev, breaks: [...prev.breaks, { start: "12:00", end: "13:00" }] }));
  };

  const removeBreak = (idx: number) => {
    setRule((prev) => {
      const breaks = [...prev.breaks];
      breaks.splice(idx, 1);
      return { ...prev, breaks };
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Rule-Based Slot Management</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* Rule Form */}
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Set Your Slot Rule</h3>
            <div className="mb-4">
              <label className="block font-medium mb-2">Working Days</label>
              <div className="flex flex-wrap gap-3">
                {daysOfWeekLabels.map((label, idx) => (
                  <label key={label} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.daysOfWeek.includes(idx)}
                      onChange={() => handleDayToggle(idx)}
                    />
                    <span>{label.slice(0, 3)}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-4 flex gap-6">
              <div>
                <label className="block font-medium mb-2">Start Time</label>
                <input
                  type="time"
                  value={rule.startTime}
                  onChange={(e) => setRule((prev) => ({ ...prev, startTime: e.target.value }))}
                  className="border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">End Time</label>
                <input
                  type="time"
                  value={rule.endTime}
                  onChange={(e) => setRule((prev) => ({ ...prev, endTime: e.target.value }))}
                  className="border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">Slot Duration (min)</label>
                <select
                  value={rule.slotDuration}
                  onChange={(e) => setRule((prev) => ({ ...prev, slotDuration: Number(e.target.value) }))}
                  className="border px-3 py-2 rounded"
                >
                  {slotDurations.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
        </div>
      </div>
            <div className="mb-4">
              <label className="block font-medium mb-2">Breaks (optional)</label>
              {rule.breaks.map((br, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <input
                    type="time"
                    value={br.start}
                    onChange={(e) => handleBreakChange(idx, "start", e.target.value)}
                    className="border px-2 py-1 rounded"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={br.end}
                    onChange={(e) => handleBreakChange(idx, "end", e.target.value)}
                    className="border px-2 py-1 rounded"
                  />
                  <button
                    onClick={() => removeBreak(idx)}
                    className="text-red-500 hover:underline"
                  >Remove</button>
                </div>
              ))}
              <button onClick={addBreak} className="text-blue-600 hover:underline mt-2">+ Add Break</button>
            </div>

            {/* Custom Days (Leave/Breaks) Section */}
            <div className="mb-6">
              <label className="block font-medium mb-2">Custom Days (Leave/Breaks)</label>
              {rule.customDays?.map((cd, idx) => (
                <div key={idx} className="bg-gray-50 rounded p-3 mb-2 flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <input
                      type="date"
                      value={cd.date}
                      onChange={e => {
                        const customDays = [...rule.customDays];
                        customDays[idx].date = formatLocalDate(new Date(e.target.value));
                        setRule(prev => ({ ...prev, customDays }));
                      }}
                      className="border px-2 py-1 rounded"
                    />
                    <select
                      value={cd.leaveType}
                      onChange={e => {
                        const customDays = [...rule.customDays];
                        customDays[idx].leaveType = e.target.value;
                        if (e.target.value === "full") customDays[idx].breaks = [];
                        setRule(prev => ({ ...prev, customDays }));
                      }}
                      className="border px-2 py-1 rounded"
                    >
                      <option value="full">Full Day Leave</option>
                      <option value="break">Partial Leave</option>
                    </select>
                    <button
                      onClick={() => {
                        const customDays = [...rule.customDays];
                        customDays.splice(idx, 1);
                        setRule(prev => ({ ...prev, customDays }));
                      }}
                      className="text-red-500 hover:underline ml-2"
                    >Remove</button>
                  </div>
                  {cd.leaveType === "break" && (
                    <div className="flex flex-col gap-1 ml-2">
                      {cd.breaks?.map((br: any, bidx: number) => (
                        <div key={bidx} className="flex gap-2 items-center">
                          <input
                            type="time"
                            value={br.start}
                            onChange={e => {
                              const customDays = [...rule.customDays];
                              customDays[idx].breaks[bidx].start = e.target.value;
                              setRule(prev => ({ ...prev, customDays }));
                            }}
                            className="border px-2 py-1 rounded"
                          />
                          <span>to</span>
                          <input
                            type="time"
                            value={br.end}
                            onChange={e => {
                              const customDays = [...rule.customDays];
                              customDays[idx].breaks[bidx].end = e.target.value;
                              setRule(prev => ({ ...prev, customDays }));
                            }}
                            className="border px-2 py-1 rounded"
                          />
                          <button
                            onClick={() => {
                              const customDays = [...rule.customDays];
                              customDays[idx].breaks.splice(bidx, 1);
                              setRule(prev => ({ ...prev, customDays }));
                            }}
                            className="text-red-500 hover:underline"
                          >Remove</button>
              </div>
            ))}
                      <button
                        onClick={() => {
                          const customDays = [...rule.customDays];
                          customDays[idx].breaks = customDays[idx].breaks || [];
                          customDays[idx].breaks.push({ start: "12:00", end: "13:00" });
                          setRule(prev => ({ ...prev, customDays }));
                        }}
                        className="text-blue-600 hover:underline mt-1"
                      >+ Add Break</button>
          </div>
        )}
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={cd.reason || ""}
                    onChange={e => {
                      const customDays = [...rule.customDays];
                      customDays[idx].reason = e.target.value;
                      setRule(prev => ({ ...prev, customDays }));
                    }}
                    className="border px-2 py-1 rounded mt-1"
                  />
                </div>
              ))}
              <button
                onClick={() => setRule(prev => ({
                  ...prev,
                  customDays: [
                    ...(prev.customDays || []),
                    { date: "", leaveType: "full", breaks: [], reason: "" }
                  ]
                }))}
                className="text-blue-600 hover:underline"
              >+ Add Custom Day</button>
            </div>

            <button
              onClick={saveRule}
              disabled={saving}
              className="bg-primary text-white px-6 py-2 rounded-full font-semibold mt-4 hover:bg-primary-dark transition"
            >
              {saving ? "Saving..." : "Save Rule"}
            </button>
          </div>

          {/* Slot Preview */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-lg font-semibold">Slot Calendar</h3>
              <DatePicker
                selected={selectedMonth}
                onChange={(date) => date && setSelectedMonth(date)}
                dateFormat="MMMM yyyy"
                showMonthYearPicker
                className="border px-3 py-2 rounded"
              />
              <button
                onClick={fetchPreviewSlots}
                disabled={previewing}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded shadow hover:from-indigo-500 hover:to-blue-500 transition"
              >
                {previewing ? "Loading..." : "Show Slots"}
              </button>
            </div>
            {/* Legend */}
            <div className="flex gap-4 mb-4">
              <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-400 inline-block"></span>Available</span>
              <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-red-400 inline-block"></span>Booked</span>
              <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-gray-400 inline-block"></span>Leave</span>
              <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-blue-400 inline-block"></span>Custom Duration</span>
            </div>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 border rounded-xl overflow-hidden bg-white">
              {/* Render day headers */}
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day => (
                <div key={day} className="bg-blue-50 text-blue-700 font-semibold text-center py-2 border-b">{day}</div>
              ))}
              {/* Render days in month */}
              {(() => {
                const year = selectedMonth.getFullYear();
                const month = selectedMonth.getMonth();
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                const daysInMonth = lastDay.getDate();
                const startDay = firstDay.getDay();
                const cells = [];
                // Fill empty cells before first day
                for (let i = 0; i < startDay; i++) cells.push(<div key={"empty-"+i}></div>);
                // Group slots by date
                const slotMap = previewSlots.reduce((acc: any, slot: any) => {
                  if (!acc[slot.date]) acc[slot.date] = [];
                  acc[slot.date].push(slot);
                  return acc;
                }, {});
                for (let d = 1; d <= daysInMonth; d++) {
                  const dateStr = formatLocalDate(new Date(year, month, d));
                  const slots = slotMap[dateStr] || [];
                  cells.push(
                    <div
                      key={dateStr}
                      className={`min-h-[80px] border-r border-b p-1 flex flex-col gap-1 cursor-pointer hover:bg-blue-50 transition`}
                      onClick={() => {
                        setSelectedDay(dateStr);
                        fetchSlotsForDate(dateStr);
                      }}
                    >
                      <div className="font-bold text-xs text-gray-700 mb-1">{d}</div>
                      {slots.length === 0 ? (
                        <span className="text-xs text-gray-300">No slots</span>
                      ) : (
                        <span className="text-xs text-blue-500">{slots.length} slots</span>
                      )}
                    </div>
                  );
                }
                return cells;
              })()}
            </div>
          </div>
        </>
      )}
      {/* Slot List Modal/Panel */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setSelectedDay(null)}>&times;</button>
            <h3 className="text-lg font-semibold mb-4">Slots for {selectedDay}</h3>
            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
              {previewSlots.length === 0 ? (
                <span className="text-gray-400">No slots for this day.</span>
              ) : (
                previewSlots.map((slot: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 bg-blue-50 rounded p-2">
                    <span className="font-mono text-sm flex-1">{slot.start} {slot.end ? `- ${slot.end}` : ""} {slot.customDuration && <span className="ml-2 text-blue-600">({slot.customDuration}m)</span>}</span>
                    <button className="text-blue-600 hover:underline text-xs" onClick={() => { setEditSlot(slot); setEditTime(slot.start); setEditDuration(slot.customDuration || 30); }}>Edit</button>
                  </div>
                ))
              )}
            </div>
            {/* Add Slot Button */}
            <button
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition w-full"
              onClick={() => { setEditSlot({ date: selectedDay, start: '', customDuration: 30 }); setEditTime(''); setEditDuration(30); }}
            >+ Add Slot</button>
          </div>
        </div>
      )}
      {/* Edit/Add Slot Modal */}
      {editSlot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setEditSlot(null)}>&times;</button>
            <h3 className="text-lg font-semibold mb-4">{editSlot.start ? 'Edit Slot' : 'Add Slot'}</h3>
            <div className="mb-4">
              <label className="block font-medium mb-2">Start Time</label>
              <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} className="border px-3 py-2 rounded w-full" />
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-2">Duration (minutes)</label>
              <input type="number" value={editDuration} min={5} max={180} onChange={e => setEditDuration(Number(e.target.value))} className="border px-3 py-2 rounded w-full" />
            </div>
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition w-full mb-2"
              onClick={async () => {
                try {
                  await updateDoctorCustomSlotAPI(editSlot.date, editTime, editDuration);
                  toast.success(editSlot.start ? 'Slot updated!' : 'Slot added!');
                  setEditSlot(null);
                  setSelectedDay(null);
                  fetchPreviewSlots();
                } catch (err: any) {
                  toast.error(err?.response?.data?.message || (editSlot.start ? 'Failed to update slot' : 'Failed to add slot'));
                }
              }}
            >{editSlot.start ? 'Save Changes' : 'Add Slot'}</button>
            {editSlot.start && (
              <button
                className="bg-red-500 text-white px-6 py-2 rounded font-semibold hover:bg-red-600 transition w-full"
                onClick={async () => {
                  try {
                    await cancelDoctorCustomSlotAPI(editSlot.date, editTime);
                    toast.success('Slot cancelled!');
                    setEditSlot(null);
                    setSelectedDay(null);
                    fetchPreviewSlots();
                  } catch (err: any) {
                    toast.error(err?.response?.data?.message || 'Failed to cancel slot');
                  }
                }}
              >Cancel Slot</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSlotManager;
