import axios from "axios";
import React, { useEffect, useState } from "react";
import Loading from "../common/Loading";
import { config } from "../utils/Config";
import { request } from "../utils/Request";

type BlacklistStatus = "Blacklisted" | "Warning" | "Good Standing";

type BlacklistStudent = {
  student_id: number;
  roll_no: string;
  student_name: string;
  total_absences: number;
  attendance_rate: number;
  status: BlacklistStatus;
  role?: string;
  type?: string;
  user_type?: string;
  roles?: Array<string | { name?: string; key?: string; title?: string }>;
  user?: {
    role?: string;
    type?: string;
    user_type?: string;
    roles?: Array<string | { name?: string; key?: string; title?: string }>;
  };
};

type BlacklistSummary = {
  blacklisted_count: number;
  warning_count: number;
  good_standing_count: number;
  total_students: number;
};

type BlacklistResponse = {
  academic_year: string;
  absence_threshold: number;
  summary: BlacklistSummary;
  students: BlacklistStudent[];
};

type AttendanceRulesResponse = {
  absent_threshold_minutes?: number;
};

type TermOption = {
  id: string;
  name: string;
};

type ClassOption = {
  id: string;
  name: string;
};

const academicYearOptions = ["2023-2024", "2024-2025", "2025-2026"];

const Blacklist = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [academicYear, setAcademicYear] = useState("2023-2024");
  const [termId, setTermId] = useState("");
  const [classId, setClassId] = useState("");
  const [threshold, setThreshold] = useState("");
  const [search, setSearch] = useState("");
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [blacklistData, setBlacklistData] = useState<BlacklistResponse>({
    academic_year: "2023-2024",
    absence_threshold: 16,
    summary: {
      blacklisted_count: 0,
      warning_count: 0,
      good_standing_count: 0,
      total_students: 0,
    },
    students: [],
  });

  useEffect(() => {
    fetchAttendanceRuleThreshold();
    fetchTerms();
  }, []);

  useEffect(() => {
    if (!termId) {
      setClasses([]);
      setClassId("");
      return;
    }

    fetchClasses(termId);
  }, [termId]);

  const fetchAttendanceRuleThreshold = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await request("/settings/attendance-rules");
      const rules = response as AttendanceRulesResponse;
      setThreshold(String(rules.absent_threshold_minutes ?? 16));
    } catch (error) {
      console.error("Failed to fetch attendance rules:", error);
      setThreshold("16");
      setErrorMessage(getRequestErrorMessage(error, "Unable to load Attendance Rules threshold. Using default 16."));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!threshold) return;
    fetchBlacklist();
  };

  const fetchTerms = async () => {
    try {
      const response = await request("terms");
      const termList = extractArray(response).map((item: any) => ({
        id: String(item.id),
        name: item.name || "Unnamed Term",
      }));
      setTerms(termList);
    } catch (error) {
      console.error("Failed to fetch terms:", error);
    }
  };

  const fetchClasses = async (selectedTermId: string) => {
    try {
      const response = await request(`classes?term_id=${selectedTermId}`);
      const classList = extractArray(response).map((item: any) => ({
        id: String(item.id),
        name: item.name || "Unnamed Class",
      }));
      setClasses(classList);
    } catch (error) {
      console.error("Failed to fetch classes:", error);
      setClasses([]);
    }
  };

  const fetchBlacklist = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await request(
        `blacklist?${buildQueryString({
          academicYear,
          termId,
          classId,
          threshold,
          search,
        })}`,
      );
      const data = response as BlacklistResponse;
      const studentRows = (data.students || []).filter(isStudentRow);
      setBlacklistData({
        ...data,
        students: studentRows,
        summary: {
          blacklisted_count: studentRows.filter((student) => student.status === "Blacklisted").length,
          warning_count: studentRows.filter((student) => student.status === "Warning").length,
          good_standing_count: studentRows.filter((student) => student.status === "Good Standing").length,
          total_students: studentRows.length,
        },
      });
      setThreshold(String(data.absence_threshold || threshold || 16));
    } catch (error) {
      console.error("Failed to fetch blacklist:", error);
      setErrorMessage(getRequestErrorMessage(error, "Unable to load blacklist data from the database."));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const token = getStoredToken();
      const response = await axios.get(
        `${config.api_url}/blacklist/export?${buildQueryString({
          academicYear,
          termId,
          classId,
          threshold,
          search,
        })}`,
        {
          headers: {
            Accept: "text/csv, application/vnd.ms-excel, application/octet-stream",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          responseType: "blob",
        },
      );

      const downloadUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `blacklist-${academicYear}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Failed to export blacklist:", error);
      setErrorMessage(getRequestErrorMessage(error, "Unable to export blacklist data."));
    } finally {
      setLoading(false);
    }
  };

  const thresholdNumber = Number(threshold) || blacklistData.absence_threshold || 16;
  const students = blacklistData.students || [];

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-6 font-sans">
      {loading && <Loading />}

      <div className="mx-auto max-w-7xl space-y-6">
        {errorMessage && (
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="border-l-4 border-red-500 bg-red-50 px-5 py-5">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 text-red-500">
              <ShieldAlertIcon />
            </div>
            <div className="text-sm text-red-600">
              <div className="font-bold">Blacklist Alert System</div>
              <p className="mt-2">
                There are{" "}
                <span className="font-bold">{blacklistData.summary.blacklisted_count} students</span> who have exceeded
                the absence threshold of <span className="font-bold">{thresholdNumber}</span> classes. Immediate action
                required.
              </p>
            </div>
          </div>
        </section>

        <section className="border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[180px_180px_180px_180px_1fr_auto_auto] xl:items-end">
            <FilterSelect
              label="Academic Year"
              value={academicYear}
              onChange={(event) => setAcademicYear(event.target.value)}
              options={academicYearOptions}
            />

            <FilterSelect
              label="Term"
              value={termId}
              onChange={(event) => setTermId(event.target.value)}
              options={terms.map((term) => ({ value: term.id, label: term.name }))}
              placeholder="All Terms"
            />

            <FilterSelect
              label="Class"
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              options={classes.map((classItem) => ({ value: classItem.id, label: classItem.name }))}
              placeholder="All Classes"
              disabled={!termId}
            />

            <FilterInput
              label="Absence Threshold"
              value={threshold}
              readOnly
            />

            <FilterInput
              label="Search Student"
              value={search}
              placeholder="Search Student by Name"
              onChange={(event) => setSearch(event.target.value)}
            />

            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex h-11 items-center justify-center gap-3 bg-slate-900 px-6 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <SearchIcon />
              Search
            </button>

            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-11 items-center justify-center gap-3 border border-slate-300 bg-white px-6 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <DownloadIcon />
              Export List
            </button>
          </div>
        </section>

        <section className="overflow-hidden border border-slate-300 bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-950 text-left text-xs font-bold text-white">
                <th className="px-6 py-4">Roll No</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4 text-center">Total Absences</th>
                <th className="px-6 py-4 text-center">Attendance Rate</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    No blacklist records found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.student_id} className="border-b border-slate-200 last:border-b-0">
                    <td className="px-6 py-4 font-medium text-slate-700">{student.roll_no}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{student.student_name}</td>
                    <td className="px-6 py-4 text-center">
                      <AbsenceBadge value={student.total_absences} status={student.status} />
                    </td>
                    <td className="px-6 py-4 text-center text-slate-500">
                      {Number(student.attendance_rate).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={student.status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button type="button" className="font-medium text-slate-700 hover:text-slate-950">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

function extractArray(response: any) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.list?.data && Array.isArray(response.list.data)) return response.list.data;
  if (response.list && Array.isArray(response.list)) return response.list;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
}

function buildQueryString({
  academicYear,
  termId,
  classId,
  threshold,
  search,
}: {
  academicYear: string;
  termId: string;
  classId: string;
  threshold: string;
  search: string;
}) {
  const params = new URLSearchParams();

  if (academicYear) params.set("academic_year", academicYear);
  if (termId) params.set("term_id", termId);
  if (classId) params.set("class_id", classId);
  if (threshold) params.set("absence_threshold", threshold);
  if (search.trim()) params.set("search", search.trim());

  return params.toString();
}

function getStoredToken() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    user?.token ||
    user?.access_token ||
    user?.plainTextToken ||
    user?.api_token ||
    user?.user?.token ||
    user?.user?.access_token ||
    ""
  );
}

function getRequestErrorMessage(error: unknown, fallback: string) {
  const apiError = error as { message?: string };

  if (apiError?.message === "Unauthorized.") {
    return "Unauthorized. Please log in with an admin account before opening Blacklist System.";
  }

  return apiError?.message || fallback;
}

function isStudentRow(item: BlacklistStudent) {
  const roles = extractRoles(item);
  const hasStudentRole = roles.includes("student");
  const hasNonStudentRole = roles.some((role) =>
    ["admin", "teacher", "staff", "instructor"].includes(role),
  );

  if (hasStudentRole) return true;
  if (hasNonStudentRole) return false;

  return Boolean(item.student_id && item.roll_no && item.student_name);
}

function extractRoles(item: BlacklistStudent) {
  const rawRoles = [
    item.role,
    item.type,
    item.user_type,
    item.user?.role,
    item.user?.type,
    item.user?.user_type,
    ...(Array.isArray(item.roles) ? item.roles : []),
    ...(Array.isArray(item.user?.roles) ? item.user.roles : []),
  ];

  return rawRoles
    .map((role) => {
      if (typeof role === "string") return role;
      return role?.name || role?.key || role?.title || "";
    })
    .filter(Boolean)
    .map((role) => String(role).toLowerCase());
}

function FilterInput({
  label,
  value,
  placeholder,
  readOnly,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  readOnly?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-slate-600">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={onChange}
        className={`h-11 w-full border border-slate-300 px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 ${readOnly
          ? "cursor-not-allowed bg-slate-100 text-slate-500"
          : "bg-slate-50 focus:border-slate-500 focus:bg-white"
          }`}
      />

    </label>
  );
}

function FilterSelect({
  label,
  value,
  options,
  placeholder,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<string | { value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-slate-600">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={onChange}
        className="h-11 w-full border border-slate-300 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        <option value="">{placeholder || "All"}</option>
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function AbsenceBadge({ value, status }: { value: number; status: BlacklistStatus }) {
  const colors = {
    Blacklisted: "bg-red-100 text-red-600",
    Warning: "bg-amber-100 text-amber-600",
    "Good Standing": "bg-slate-100 text-slate-600",
  };

  return (
    <span className={`inline-flex h-8 min-w-10 items-center justify-center rounded-full px-3 font-bold ${colors[status]}`}>
      {value}
    </span>
  );
}

function StatusBadge({ status }: { status: BlacklistStatus }) {
  const colors = {
    Blacklisted: "bg-red-600",
    Warning: "bg-amber-500",
    "Good Standing": "bg-emerald-600",
  };

  return (
    <span className={`inline-flex min-w-28 justify-center px-4 py-1.5 text-xs font-bold text-white ${colors[status]}`}>
      {status}
    </span>
  );
}

function ShieldAlertIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export default Blacklist;
