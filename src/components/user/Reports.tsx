import React, { useState, useEffect } from "react";
import Loading from "../common/Loading";
import { request } from "../utils/Request";

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  
  // Selection Data State
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    academic_year_id: "",
    term_id: "",
    class_id: "",
    teacher_id: ""
  });

  const [reportStats, setReportStats] = useState<any[]>([]);
  const [reportTableData, setReportTableData] = useState<any[]>([]);
  const [reportRawRecords, setReportRawRecords] = useState<any[]>([]);

  // Helper to find the actual data array
  const extractArray = (res: any) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res.data && Array.isArray(res.data)) return res.data;
    if (res.list && Array.isArray(res.list)) return res.list;
    if (res.list && res.list.data && Array.isArray(res.list.data)) return res.list.data;
    return [];
  };

  // 1. Fetch Academic Years on mount
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await request("academic-years");
        setAcademicYears(extractArray(res));
      } catch (e) { console.error("Failed to load years", e); }
    };
    fetchYears();
  }, []);

  // 2. Fetch Terms when Academic Year changes
  useEffect(() => {
    if (!formData.academic_year_id) { setTerms([]); return; }
    const fetchTerms = async () => {
      try {
        const res = await request(`terms?academic_year_id=${formData.academic_year_id}`);
        setTerms(extractArray(res));
      } catch (e) { console.error("Failed to load terms", e); }
    };
    fetchTerms();
  }, [formData.academic_year_id]);

  // 3. Fetch Classes when Term changes
  useEffect(() => {
    if (!formData.term_id) { setClasses([]); return; }
    const fetchClasses = async () => {
      try {
        const res = await request(`classes?term_id=${formData.term_id}`);
        setClasses(extractArray(res));
      } catch (e) { console.error("Failed to load classes", e); }
    };
    fetchClasses();
  }, [formData.term_id]);

  // 4. Fetch Teachers when Class changes
  useEffect(() => {
    if (!formData.class_id || !formData.term_id) { setTeachers([]); return; }
    const fetchTeachers = async () => {
      try {
        const res = await request(`teachers?term_id=${formData.term_id}&class_id=${formData.class_id}`);
        const rawList = extractArray(res);
        setTeachers(rawList.map((item: any) => ({
          id: String(item.id),
          name: item.user?.name || item.name || "Unnamed Teacher"
        })));
      } catch (e) { console.error("Failed to load teachers", e); }
    };
    fetchTeachers();
  }, [formData.class_id, formData.term_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "academic_year_id") {
      setFormData(prev => ({ ...prev, academic_year_id: value, term_id: "", class_id: "", teacher_id: "" }));
    } else if (name === "term_id") {
      setFormData(prev => ({ ...prev, term_id: value, class_id: "", teacher_id: "" }));
    } else if (name === "class_id") {
      setFormData(prev => ({ ...prev, class_id: value, teacher_id: "" }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleGenerate = async () => {
    if (!formData.term_id || !formData.class_id || !formData.teacher_id) {
      alert("Please select Term, Class, and Teacher first.");
      return;
    }

    setLoading(true);
    setHasGenerated(false);
    try {
      const query = `start_date=${formData.startDate}&end_date=${formData.endDate}&term_id=${formData.term_id}&class_id=${formData.class_id}&teacher_id=${formData.teacher_id}`;
      const response = await request(`attendance-records/report?${query}`);
      
      const records = extractArray(response);
      console.log("Processing records for report:", records);

      if (records.length === 0) {
        setReportStats([]);
        setReportTableData([]);
        setHasGenerated(true);
        setLoading(false);
        return;
      }

      // 1. Calculate Summary Stats
      const totalPresent = records.filter((r: any) => r.status === "present").length;
      const totalAbsent = records.filter((r: any) => r.status === "absent").length;
      const totalPermission = records.filter((r: any) => r.status === "permission").length;
      const uniqueSessions = new Set(records.map((r: any) => r.class_session_id)).size;
      const avgAttendance = records.length > 0 ? ((totalPresent / (records.length - totalPermission)) * 100).toFixed(1) : "0";

      setReportStats([
        { label: "Classes Held", value: String(uniqueSessions), color: "text-slate-900" },
        { label: "Avg. Attendance", value: `${avgAttendance} %`, color: "text-slate-900" },
        { label: "Total Present", value: String(totalPresent), color: "text-emerald-500" },
        { label: "Total Absent", value: String(totalAbsent), color: "text-rose-500" },
        { label: "Total Permission", value: String(totalPermission), color: "text-blue-500" },
      ]);

      // 2. Group by Date for Table
      const groupedByDate: Record<string, any> = {};
      const selectedClassName = classes.find(c => String(c.id) === formData.class_id)?.name || "N/A";

      records.forEach((record: any) => {
        const fullDate = record.attendance_date || record.created_at;
        const dateKey = new Date(fullDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = { date: dateKey, class: selectedClassName, present: 0, absent: 0, permission: 0 };
        }

        if (record.status === "present") groupedByDate[dateKey].present++;
        else if (record.status === "absent") groupedByDate[dateKey].absent++;
        else if (record.status === "permission") groupedByDate[dateKey].permission++;
      });

      const tableData = Object.values(groupedByDate).map((day: any) => {
        const total = day.present + day.absent;
        return {
          ...day,
          rate: total > 0 ? ((day.present / total) * 100).toFixed(1) + " %" : "100 %"
        };
      });

      setReportTableData(tableData);
      setReportRawRecords(records); // Save the raw records for the detailed list
      setHasGenerated(true);
    } catch (error: any) {
      console.error("Report generation failed:", error);
      alert(error?.message || "Failed to load report data.");
    } finally {
      setLoading(false);
    }
  };

  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const displayStats = hasGenerated && reportStats.length > 0 ? reportStats : [
    { label: "Classes Held", value: "-", color: "text-slate-900" },
    { label: "Avg. Attendance", value: "- %", color: "text-slate-900" },
    { label: "Total Present", value: "-", color: "text-emerald-500" },
    { label: "Total Absent", value: "-", color: "text-rose-500" },
    { label: "Total Permission", value: "-", color: "text-blue-500" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 font-sans">
      {loading && <Loading />}
      <div className="mx-auto max-w-7xl space-y-6 pb-20">
        
        {/* Report Configuration Card */}
        <div className="rounded-sm border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-3">
             <div className="text-slate-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
             </div>
            <h2 className="text-[15px] font-bold text-slate-700">Report Configuration</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Year</label>
              <select 
                name="academic_year_id"
                value={formData.academic_year_id}
                onChange={handleChange}
                className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat"
              >
                <option value="">Select Year</option>
                {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Term</label>
              <select 
                name="term_id"
                value={formData.term_id}
                onChange={handleChange}
                disabled={!formData.academic_year_id}
                className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat disabled:bg-slate-50"
              >
                <option value="">Select Term</option>
                {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Class</label>
              <select 
                name="class_id"
                value={formData.class_id}
                onChange={handleChange}
                disabled={!formData.term_id}
                className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat disabled:bg-slate-50"
              >
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Teacher</label>
              <select 
                name="teacher_id"
                value={formData.teacher_id}
                onChange={handleChange}
                disabled={!formData.class_id}
                className="h-11 w-full rounded-sm border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-400 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat disabled:bg-slate-50"
              >
                <option value="">Select Teacher</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleGenerate}
              className="flex h-12 items-center gap-3 rounded-sm bg-[#1e293b] px-8 text-[13px] font-bold text-white transition hover:bg-slate-800 shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Generate Report
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {displayStats.map((stat, i) => (
            <div key={i} className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Daily Attendance Summary Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-6 w-1 bg-slate-900" />
              <h2 className="text-[15px] font-bold text-slate-700">Daily Attendance Summary</h2>
            </div>
          </div>
          
          <div className="overflow-hidden border border-slate-200 shadow-sm bg-white rounded-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#0f172a] text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Class</th>
                  <th className="p-4 text-center">Present</th>
                  <th className="p-4 text-center">Absent</th>
                  <th className="p-4 text-center">Permission</th>
                  <th className="p-4 text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-600 font-medium">
                {hasGenerated ? (
                  reportTableData.length > 0 ? (
                    reportTableData.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-4">{row.date}</td>
                        <td className="p-4 text-slate-400">{row.class}</td>
                        <td className="p-4 text-center">
                          <span className="inline-flex h-7 min-w-[36px] items-center justify-center rounded-full bg-emerald-50 px-2 text-[12px] font-bold text-emerald-600">
                            {row.present}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex h-7 min-w-[36px] items-center justify-center rounded-full bg-rose-50 px-2 text-[12px] font-bold text-rose-600">
                            {row.absent}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex h-7 min-w-[36px] items-center justify-center rounded-full bg-blue-50 px-2 text-[12px] font-bold text-blue-600">
                            {row.permission}
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold text-slate-800">{row.rate}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400 italic">No records found for the selected period.</td>
                    </tr>
                  )
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 italic">Please configure filters and click "Generate Report" to view data.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Student Status Table */}
        {hasGenerated && reportRawRecords.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-6 w-1 bg-emerald-500" />
              <h2 className="text-[15px] font-bold text-slate-700">Detailed Student Attendance List</h2>
            </div>
            
            <div className="overflow-hidden border border-slate-200 shadow-sm bg-white rounded-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4 text-left">Student Name</th>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-left">Remark</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-600">
                  {reportRawRecords.map((record, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-700">
                        {record.student?.user?.name || record.student_name || "Unknown"}
                      </td>
                      <td className="p-4 text-xs font-medium text-slate-500">
                        {new Date(record.attendance_date || record.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                          record.status === "present" ? "bg-emerald-50 text-emerald-700" :
                          record.status === "absent" ? "bg-rose-50 text-rose-700" :
                          "bg-blue-50 text-blue-700"
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs italic text-slate-400">
                        {record.remarks || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
