import React, { useState, useEffect } from "react";
import Loading from "../../common/Loading";
import { request } from "../../utils/Request";

interface Session {
  id: string;
  class_id: string;
  term_id: string;
  teacher_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  class?: { name: string };
  term?: { name: string };
  teacher?: { user?: { name: string } };
}

const SessionManager = () => {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dayFilter, setDayFilter] = useState("all");
  const [sortBy, setSortBy] = useState("day-time");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Session | null>(null);
  
  const [terms, setTerms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    class_id: "",
    term_id: "",
    teacher_id: "",
    day_of_week: "Monday",
    start_time: "08:00",
    end_time: "10:00",
    subject_id: "1" // Default for now
  });

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await request("class-sessions");
      // Handle nesting: res.list.data or res.data or res.list or res
      const rawList = res?.list?.data || res?.data || res?.list || res || [];
      setSessions(Array.isArray(rawList) ? rawList : []);
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [tRes, cRes, teachRes] = await Promise.all([
        request("terms"),
        request("classes"),
        request("teachers")
      ]);
      
      const termList = tRes?.list?.data || tRes?.data || tRes?.list || tRes || [];
      const classList = cRes?.list?.data || cRes?.data || cRes?.list || cRes || [];
      const teacherList = teachRes?.list?.data || teachRes?.data || teachRes?.list || teachRes || [];

      setTerms(Array.isArray(termList) ? termList : []);
      setClasses(Array.isArray(classList) ? classList : []);
      setTeachers(Array.isArray(teacherList) ? teacherList : []);

      // Auto-select first items if creating new and currently empty
      if (!editItem) {
        setFormData(prev => ({
          ...prev,
          term_id: prev.term_id || (termList[0]?.id ? String(termList[0].id) : ""),
          class_id: prev.class_id || (classList[0]?.id ? String(classList[0].id) : ""),
          teacher_id: prev.teacher_id || (teacherList[0]?.id ? String(teacherList[0].id) : "")
        }));
      }
    } catch (e) {
      console.error("Failed to fetch session dependencies", e);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchDependencies();
  }, []);

  const handleOpenModal = (item: Session | null = null) => {
    if (item) {
      setEditItem(item);
      setFormData({
        class_id: String(item.class_id),
        term_id: String(item.term_id),
        teacher_id: String(item.teacher_id),
        day_of_week: item.day_of_week,
        start_time: item.start_time.split('T')[1]?.substring(0,5) || item.start_time,
        end_time: item.end_time.split('T')[1]?.substring(0,5) || item.end_time,
        subject_id: "1"
      });
    } else {
      setEditItem(null);
      setFormData({
        class_id: classes[0]?.id ? String(classes[0].id) : "",
        term_id: terms[0]?.id ? String(terms[0].id) : "",
        teacher_id: teachers[0]?.id ? String(teachers[0].id) : "",
        day_of_week: "Monday",
        start_time: "08:00",
        end_time: "10:00",
        subject_id: "1"
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editItem) {
        await request(`class-sessions/${editItem.id}`, "PUT", formData);
      } else {
        await request("class-sessions/create", "POST", formData);
      }
      setShowModal(false);
      fetchSessions();
    } catch (err: any) {
      console.error("Failed to save session", err);
      let errorMsg = "Error saving session.";
      if (err?.errors) {
        errorMsg += "\n" + Object.entries(err.errors)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
          .join("\n");
      }
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions
    .filter((item) => {
      const query = searchTerm.trim().toLowerCase();
      const className =
        item.class?.name || classes.find((c) => String(c.id) === String(item.class_id))?.name || "";
      const teacherName =
        item.teacher?.user?.name ||
        teachers.find((t) => String(t.id) === String(item.teacher_id))?.user?.name ||
        teachers.find((t) => String(t.id) === String(item.teacher_id))?.name ||
        "";
      const termName =
        item.term?.name || terms.find((t) => String(t.id) === String(item.term_id))?.name || "";

      const matchesSearch =
        !query ||
        className.toLowerCase().includes(query) ||
        teacherName.toLowerCase().includes(query) ||
        termName.toLowerCase().includes(query) ||
        item.day_of_week?.toLowerCase().includes(query);

      const matchesDay = dayFilter === "all" || item.day_of_week === dayFilter;

      return matchesSearch && matchesDay;
    })
    .sort((a, b) => {
      if (sortBy === "class-asc") {
        const aName = a.class?.name || classes.find((c) => String(c.id) === String(a.class_id))?.name || "";
        const bName = b.class?.name || classes.find((c) => String(c.id) === String(b.class_id))?.name || "";
        return aName.localeCompare(bName);
      }

      const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const dayDiff = dayOrder.indexOf(a.day_of_week || "") - dayOrder.indexOf(b.day_of_week || "");
      if (dayDiff !== 0) return dayDiff;
      return (a.start_time || "").localeCompare(b.start_time || "");
    });

  return (
    <div className="p-6">
      {loading && <Loading />}
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Class Sessions</h1>
            <p className="text-slate-500 text-sm">Define class schedules and assign teachers to terms.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex h-10 items-center gap-2 rounded-sm bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Create New Session
          </button>
        </div>

        <div className="grid gap-4 rounded-sm border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search class, teacher, term, or day"
            className="h-10 w-full rounded-sm border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
          />
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="h-10 w-full rounded-sm border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="all">All days</option>
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 w-full rounded-sm border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="day-time">Sort: Day and time</option>
            <option value="class-asc">Sort: Class A-Z</option>
          </select>
        </div>

        <div className="overflow-hidden border border-slate-200 bg-white shadow-sm rounded-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#0f172a] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="p-4 text-left">Term</th>
                <th className="p-4 text-left">Class</th>
                <th className="p-4 text-left">Teacher</th>
                <th className="p-4 text-left">Schedule</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-600">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium">
                      {item.term?.name || terms.find(t => String(t.id) === String(item.term_id))?.name || "N/A"}
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {item.class?.name || classes.find(c => String(c.id) === String(item.class_id))?.name || "N/A"}
                    </td>
                    <td className="p-4">
                      {item.teacher?.user?.name || (() => {
                        const teach = teachers.find(t => String(t.id) === String(item.teacher_id));
                        return teach?.user?.name || teach?.name || "N/A";
                      })()}
                    </td>
                    <td className="p-4">
                       <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase mr-2">{item.day_of_week}</span>
                       {item.start_time} - {item.end_time}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:underline font-bold text-xs">Edit</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 italic">No sessions match the current search and filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-sm border border-slate-200 bg-white p-8 shadow-xl">
            <h2 className="text-lg font-bold text-slate-800 mb-6">{editItem ? "Edit Session" : "Create Session"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Select Term</label>
                  <select
                    required
                    value={formData.term_id}
                    onChange={(e) => setFormData({ ...formData, term_id: e.target.value })}
                    className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400"
                  >
                    <option value="">Choose Term...</option>
                    {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Select Class</label>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400"
                  >
                    <option value="">Choose Class...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Assign Teacher</label>
                <select
                  required
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="">Choose Teacher...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.user?.name || t.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Day</label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                    className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400"
                  >
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Start</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">End</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-sm bg-slate-900 px-6 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  {editItem ? "Update Session" : "Create Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManager;
