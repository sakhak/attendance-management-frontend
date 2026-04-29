import React, { useState, useEffect } from "react";
import Loading from "../common/Loading";
import { request } from "../utils/Request";

// Define interfaces for your data types
interface Term {
  id: string;
  name: string;
}

interface ClassTime {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
}

interface StudentAttendance {
  id: number;
  rollNo: string;
  name: string;
  status: "present" | "absent" | "permission" | null;
  comment: string;
}

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [classSessionId, setClassSessionId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    term_id: "",
    class_id: "",
    teacher_id: ""
  });

  // State for dropdown options
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<ClassTime[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Helper to find the actual data array in inconsistent API responses
  const extractArray = (res: any) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    // Handle { data: { students: [...] } } - seen in Attendance
    if (res.data && res.data.students && Array.isArray(res.data.students)) return res.data.students;
    // Handle { list: { data: [...] } } - seen in Classes
    if (res.list && res.list.data && Array.isArray(res.list.data)) return res.list.data;
    // Handle { list: [...] } - seen in Terms
    if (res.list && Array.isArray(res.list)) return res.list;
    // Handle { data: [...] }
    if (res.data && Array.isArray(res.data)) return res.data;
    return [];
  };

  // 1. Fetch Terms on mount
  useEffect(() => {
    const fetchTerms = async () => {
      setLoading(true);
      try {
        const res = await request("terms");
        const rawList = extractArray(res);
        setTerms(rawList.map((item: any) => ({
          id: String(item.id),
          name: item.name || "Unnamed Term"
        })));
      } catch (error) {
        console.error("Failed to load terms:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  // 2. Fetch Classes when term_id changes
  useEffect(() => {
    if (!formData.term_id) {
      setClasses([]);
      return;
    }
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const res = await request(`classes?term_id=${formData.term_id}`);
        const rawList = extractArray(res);
        setClasses(rawList.map((item: any) => ({
          id: String(item.id),
          name: item.name || "Unnamed Class"
        })));
      } catch (error) {
        console.error("Failed to load classes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [formData.term_id]);

  // 3. Fetch Teachers when class_id changes
  useEffect(() => {
    if (!formData.class_id || !formData.term_id) {
      setTeachers([]);
      return;
    }
    const fetchTeachers = async () => {
      setLoading(true);
      try {
        const res = await request(`teachers?term_id=${formData.term_id}&class_id=${formData.class_id}`);
        const rawList = extractArray(res);
        setTeachers(rawList.map((item: any) => ({
          id: String(item.id),
          // Look inside user object for the name as seen in your JSON
          name: item.user?.name || item.name || (item.first_name ? `${item.first_name} ${item.last_name}` : "Unnamed Teacher")
        })));
      } catch (error) {
        console.error("Failed to load teachers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, [formData.class_id, formData.term_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Reset child dropdowns if parent changes
    if (name === "term_id") {
      setFormData(prev => ({ ...prev, term_id: value, class_id: "", teacher_id: "" }));
    } else if (name === "class_id") {
      setFormData(prev => ({ ...prev, class_id: value, teacher_id: "" }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSearch = async () => {
    if (!formData.term_id || !formData.class_id || !formData.teacher_id) {
      alert("Please select all required filters (*)");
      return;
    }

    setLoading(true);
    try {
      const query = `date=${formData.date}&term_id=${formData.term_id}&class_id=${formData.class_id}&teacher_id=${formData.teacher_id}`;
      const response = await request(`attendance-records/filter?${query}`);

      // Capture class_session_id for saving later
      if (response?.data?.class_session_id) {
        setClassSessionId(response.data.class_session_id);
      }

      const rawList = extractArray(response);
      const students = rawList
        .filter(isStudentAttendanceRecord)
        .map(mapStudentAttendanceRecord);

      setAttendanceData(students);
      setHasSearched(true);
    } catch (error) {
      console.error("Search failed:", error);
      alert("Failed to fetch attendance records from database.");
    } finally {
      setLoading(false);
    }
  };

  const [attendanceData, setAttendanceData] = useState<StudentAttendance[]>([]);

  const handleStatusChange = (studentId: number, status: "present" | "absent" | "permission") => {
    setAttendanceData(prev =>
      prev.map(item =>
        item.id === studentId ? { ...item, status: item.status === status ? null : status } : item
      )
    );
  };

  const handleCommentChange = (studentId: number, comment: string) => {
    setAttendanceData(prev =>
      prev.map(item =>
        item.id === studentId ? { ...item, comment } : item
      )
    );
  };

  const handleSave = async () => {
    if (attendanceData.length === 0 || !classSessionId) {
      alert("No class session found. Please search again.");
      return;
    }

    setLoading(true);
    console.log("Attempting to save attendance records...");

    // Construct the payload to match your backend's requirements
    const payload = {
      class_session_id: classSessionId,
      date: formData.date,
      term_id: formData.term_id,
      class_id: formData.class_id,
      teacher_id: formData.teacher_id,
      records: attendanceData.map(s => ({
        student_id: s.id,
        status: s.status,
        comment: s.comment
      }))
    };

    try {
      // Trying the most likely correct endpoint based on REST standards
      // If /save didn't work, /attendance-records is the standard for POST
      await request("attendance-records", "POST", payload);
      alert("Attendance records saved successfully!");
    } catch (error: any) {
      console.error("Save failed:", error);

      // If it was a 405 error again, show a more helpful message
      if (error?.message?.includes("method is not supported") || error?.status === 405) {
        alert("Server Configuration Error: The save endpoint does not allow POST. Please check your backend routes.");
      } else {
        alert("Failed to save attendance records. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 font-sans">
      {loading && <Loading />}
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Search / Filter Criteria Section */}
        <div className="rounded-sm border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center justify-between border-l-[3px] border-slate-900 pl-3">
            <h2 className="text-[15px] font-bold text-slate-700">Search / Filter Criteria</h2>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
              Refresh Data
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">
                Date Selection <span className="text-red-500 ml-6">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">
                Term Name <span className="text-red-500 ml-6">*</span>
              </label>
              <div className="relative">
                <select
                  name="term_id"
                  value={formData.term_id}
                  onChange={handleChange}
                  className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-slate-400 disabled:bg-slate-50"
                >
                  <option value="">Select Term</option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">
                Class Name <span className="text-red-500 ml-6">*</span>
              </label>
              <div className="relative">
                <select
                  name="class_id"
                  value={formData.class_id}
                  onChange={handleChange}
                  className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-slate-400 disabled:bg-slate-50"
                  disabled={!formData.term_id}
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">
                Teacher Name <span className="text-red-500 ml-6">*</span>
              </label>
              <div className="relative">
                <select
                  name="teacher_id"
                  value={formData.teacher_id}
                  onChange={handleChange}
                  className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-slate-400 disabled:bg-slate-50"
                  disabled={!formData.class_id}
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSearch}
              className="flex h-12 items-center gap-3 rounded-sm bg-[#1e293b] px-8 text-[13px] font-bold text-white transition hover:bg-slate-800 shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Search Records
            </button>
          </div>
        </div>

        {/* Daily Attendance Register Section */}
        {hasSearched ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-6 w-1 bg-slate-900" />
                <h2 className="text-lg font-bold text-[#1e293b]">Daily Attendance Register</h2>
                <span className="text-sm font-medium text-slate-400 border-l border-slate-300 pl-4">{new Date(formData.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={attendanceData.length === 0}
                  className={`flex h-10 items-center gap-2 rounded-sm px-4 text-xs font-bold text-white shadow-sm ml-2 transition ${attendanceData.length > 0 ? "bg-slate-700 hover:bg-slate-800" : "bg-[#94a3b8] opacity-80 cursor-not-allowed"
                    }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                  Save Records
                </button>
              </div>
            </div>

            <div className="overflow-hidden border border-slate-200 shadow-sm bg-white">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="bg-[#0f172a] p-4 text-left w-20">Roll No.</th>
                    <th className="bg-[#0f172a] p-4 text-left">Student Name</th>
                    <th className="bg-[#064e3b] p-4 text-center w-28">Presence</th>
                    <th className="bg-[#7f1d1d] p-4 text-center w-28">Absence</th>
                    <th className="bg-[#1e3a8a] p-4 text-center w-28">Permission</th>
                    <th className="bg-[#0f172a] p-4 text-left">Comments</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700">
                  {attendanceData.map((student) => (
                    <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-600">{student.rollNo}</td>
                      <td className="p-4 font-bold text-slate-800">{student.name}</td>

                      {/* Presence Radio */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleStatusChange(student.id, "present")}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${student.status === "present"
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-200 bg-white text-transparent hover:border-emerald-300"
                            }`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </button>
                      </td>

                      {/* Absence Radio */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleStatusChange(student.id, "absent")}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${student.status === "absent"
                            ? "border-rose-500 bg-rose-500 text-white"
                            : "border-slate-200 bg-white text-transparent hover:border-rose-300"
                            }`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </td>

                      {/* Permission Radio */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleStatusChange(student.id, "permission")}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${student.status === "permission"
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-slate-200 bg-white text-transparent hover:border-blue-300"
                            }`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                        </button>
                      </td>

                      <td className="p-4">
                        <input
                          type="text"
                          placeholder="Add note..."
                          value={student.comment}
                          onChange={(e) => handleCommentChange(student.id, e.target.value)}
                          className="w-full bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-300 border-b border-slate-100 focus:border-slate-300 pb-1"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Table Footer / Legend */}
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Showing {attendanceData.length} students
                </span>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                    <span className="text-[11px] font-bold text-slate-600 uppercase">
                      Present: {attendanceData.filter(s => s.status === "present").length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-200"></div>
                    <span className="text-[11px] font-bold text-slate-600 uppercase">
                      Absent: {attendanceData.filter(s => s.status === "absent").length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div>
                    <span className="text-[11px] font-bold text-slate-600 uppercase">
                      Permission: {attendanceData.filter(s => s.status === "permission").length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Summary Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 pt-4">
              <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Students</p>
                <p className="text-3xl font-bold text-slate-900">{attendanceData.length}</p>
                <p className="mt-2 text-[11px] text-slate-400 font-medium tracking-tight">Registered in selected class</p>
              </div>

              <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Average Attendance</p>
                <p className="text-3xl font-bold text-slate-900">
                  {attendanceData.length > 0
                    ? ((attendanceData.filter(s => s.status === "present").length / attendanceData.length) * 100).toFixed(1)
                    : "0.0"}%
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold tracking-tight">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                  1.2% from last month
                </div>
              </div>

              <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pending Excuses</p>
                <p className="text-3xl font-bold text-slate-900">
                  {attendanceData.filter(s => s.status === "permission").length}
                </p>
                <p className="mt-2 text-[11px] text-orange-500 font-bold tracking-tight">Requires verification</p>
              </div>
            </div>

            {/* Bottom Footer Section */}
            <footer className="mt-12 flex flex-col items-center justify-between border-t border-slate-100 py-8 text-[11px] font-bold text-slate-400 md:flex-row">
              <p>© 2026 SETEC Institute. All rights reserved.</p>
              <div className="mt-4 flex gap-8 md:mt-0">
                <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-slate-600 transition-colors">Support</a>
              </div>
            </footer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-sm border border-slate-200 bg-white p-20 text-center shadow-sm">
            <div className="mb-4 text-slate-200">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <p className="text-slate-500 font-medium">Please select criteria and click "Search Records" to load the student list.</p>
          </div>
        )}
      </div>
    </div>
  );
};

function isStudentAttendanceRecord(item: any) {
  const roles = extractRoles(item);
  const hasStudentRole = roles.includes("student");
  const hasNonStudentRole = roles.some((role) =>
    ["admin", "teacher", "staff", "instructor"].includes(role),
  );

  if (hasStudentRole) return true;
  if (hasNonStudentRole) return false;

  return Boolean(
    item?.student ||
    item?.student_id ||
    item?.student_code ||
    item?.roll_no ||
    item?.student?.student_code ||
    item?.student?.roll_no,
  );
}

function extractRoles(item: any) {
  const rawRoles = [
    item?.role,
    item?.type,
    item?.user_type,
    item?.user?.role,
    item?.user?.type,
    item?.user?.user_type,
    ...(Array.isArray(item?.roles) ? item.roles : []),
    ...(Array.isArray(item?.user?.roles) ? item.user.roles : []),
  ];

  return rawRoles
    .map((role) => {
      if (typeof role === "string") return role;
      return role?.name || role?.title || "";
    })
    .filter(Boolean)
    .map((role) => String(role).toLowerCase());
}

function mapStudentAttendanceRecord(item: any): StudentAttendance {
  const studentId = item?.student_id || item?.student?.id || item?.id;
  const firstName = item?.first_name || item?.student?.first_name || item?.user?.first_name || item?.student?.user?.first_name;
  const lastName = item?.last_name || item?.student?.last_name || item?.user?.last_name || item?.student?.user?.last_name;

  return {
    id: Number(studentId),
    rollNo:
      item?.student_code ||
      item?.roll_no ||
      item?.student?.student_code ||
      item?.student?.roll_no ||
      String(studentId).padStart(3, "0"),
    name:
      item?.student_name ||
      item?.name ||
      item?.student?.name ||
      item?.user?.name ||
      item?.student?.user?.name ||
      (firstName ? `${firstName} ${lastName || ""}`.trim() : "Unknown Student"),
    status: item?.status || null,
    comment: item?.comment || item?.remark || "",
  };
}

export default Attendance;
