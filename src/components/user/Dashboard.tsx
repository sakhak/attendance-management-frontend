import React, { useEffect, useState } from "react";
import Loading from "../common/Loading";
import { request } from "../utils/Request";

type TeacherItem = {
  id: string | number;
  user?: {
    name?: string;
  };
  name?: string;
  created_at?: string;
};

type EnrollmentItem = {
  id: string | number;
  student_id?: string | number;
  class_id?: string | number;
  created_at?: string;
  student?: {
    student_code?: string;
    user?: {
      name?: string;
    };
  };
};

type ClassItem = {
  id: string | number;
  name?: string;
  created_at?: string;
};

type SessionItem = {
  id: string | number;
  class_id?: string | number;
  term_id?: string | number;
  teacher_id?: string | number;
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
  class?: { name?: string };
  term?: { name?: string };
  teacher?: { user?: { name?: string } };
};

type TermItem = {
  id: string | number;
  name?: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
};

type AcademicYearItem = {
  id: string | number;
  name?: string;
};

type BlacklistResponse = {
  summary?: {
    blacklisted_count?: number;
    warning_count?: number;
    total_students?: number;
  };
};

type AttendanceRulesResponse = {
  absent_threshold_minutes?: number;
};

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [dashboardData, setDashboardData] = useState({
    classes: [] as ClassItem[],
    teachers: [] as TeacherItem[],
    enrollments: [] as EnrollmentItem[],
    sessions: [] as SessionItem[],
    terms: [] as TermItem[],
    academicYears: [] as AcademicYearItem[],
    blacklistSummary: {
      blacklisted_count: 0,
      warning_count: 0,
      total_students: 0,
    },
    absenceThreshold: 16,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [
        classesResponse,
        teachersResponse,
        enrollmentsResponse,
        sessionsResponse,
        termsResponse,
        academicYearsResponse,
        blacklistResponse,
        attendanceRulesResponse,
      ] = await Promise.all([
        request("classes"),
        request("teachers"),
        request("enrollments"),
        request("class-sessions"),
        request("terms"),
        request("academic-years"),
        request("blacklist"),
        request("/settings/attendance-rules"),
      ]);

      setDashboardData({
        classes: extractArray(classesResponse),
        teachers: extractArray(teachersResponse),
        enrollments: extractArray(enrollmentsResponse),
        sessions: extractArray(sessionsResponse),
        terms: extractArray(termsResponse),
        academicYears: extractArray(academicYearsResponse),
        blacklistSummary: {
          blacklisted_count: Number((blacklistResponse as BlacklistResponse)?.summary?.blacklisted_count || 0),
          warning_count: Number((blacklistResponse as BlacklistResponse)?.summary?.warning_count || 0),
          total_students: Number((blacklistResponse as BlacklistResponse)?.summary?.total_students || 0),
        },
        absenceThreshold: Number((attendanceRulesResponse as AttendanceRulesResponse)?.absent_threshold_minutes || 16),
      });
    } catch (error: any) {
      console.error("Failed to load dashboard data:", error);
      setErrorMessage(error?.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = new Set(
    dashboardData.enrollments
      .map((item) => String(item.student_id || ""))
      .filter(Boolean),
  ).size;
  const totalTeachers = dashboardData.teachers.length;
  const totalClasses = dashboardData.classes.length;
  const totalSessions = dashboardData.sessions.length;
  const averageStudentsPerClass =
    totalClasses > 0 ? (dashboardData.enrollments.length / totalClasses).toFixed(1) : "0.0";

  const classEnrollmentMap = dashboardData.enrollments.reduce<Record<string, number>>((acc, item) => {
    const key = String(item.class_id || "");
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const topClasses = dashboardData.classes
    .map((item) => ({
      id: String(item.id),
      name: item.name || "Unnamed Class",
      count: classEnrollmentMap[String(item.id)] || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const latestTerms = [...dashboardData.terms]
    .sort((a, b) => toTimestamp(b.start_date || b.created_at) - toTimestamp(a.start_date || a.created_at))
    .slice(0, 4);

  const nextSessions = [...dashboardData.sessions]
    .sort((a, b) => compareSessionOrder(a, b))
    .slice(0, 6);

  const newestEnrollments = [...dashboardData.enrollments]
    .sort((a, b) => toTimestamp(b.created_at) - toTimestamp(a.created_at))
    .slice(0, 5);

  const statCards = [
    {
      label: "Enrolled Students",
      value: formatNumber(totalStudents),
      hint: `${dashboardData.blacklistSummary.total_students || totalStudents} in tracked roster`,
      tone: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      label: "Teaching Staff",
      value: formatNumber(totalTeachers),
      hint: `${totalSessions} scheduled sessions`,
      tone: "bg-sky-50 text-sky-700 border-sky-200",
    },
    {
      label: "Classes",
      value: formatNumber(totalClasses),
      hint: `${averageStudentsPerClass} students per class`,
      tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      label: "Blacklist Alerts",
      value: formatNumber(dashboardData.blacklistSummary.blacklisted_count),
      hint: `${dashboardData.blacklistSummary.warning_count} warning cases`,
      tone: "bg-rose-50 text-rose-700 border-rose-200",
    },
  ];

  return (
    <div className="space-y-6">
      {loading && <Loading />}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1.35fr_0.9fr] lg:px-8">
          <div>
            <div className="mb-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Live Academic Overview
            </div>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-950">
              Operational snapshot built from your current attendance, roster, and scheduling data.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              The dashboard reads your classes, teachers, enrollments, sessions, blacklist, and attendance rule settings
              directly from the database.
            </p>

            {errorMessage && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <MetricPanel
              label="Academic Years"
              value={formatNumber(dashboardData.academicYears.length)}
              note="Configured cycles"
            />
            <MetricPanel
              label="Terms"
              value={formatNumber(dashboardData.terms.length)}
              note="Available term windows"
            />
            <MetricPanel
              label="Sessions"
              value={formatNumber(totalSessions)}
              note="Timetabled class sessions"
            />
            <MetricPanel
              label="Absence Threshold"
              value={String(dashboardData.absenceThreshold)}
              note="From Attendance Rules"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`inline-flex rounded-2xl border px-3 py-1 text-xs font-semibold ${card.tone}`}>
              {card.label}
            </div>
            <div className="mt-4 text-3xl font-semibold text-slate-950">{card.value}</div>
            <div className="mt-2 text-sm text-slate-500">{card.hint}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Class Enrollment Load</h2>
              <p className="mt-1 text-sm text-slate-500">Student distribution across your most populated classes.</p>
            </div>
          </div>
          <div className="space-y-4">
            {topClasses.length === 0 ? (
              <EmptyState message="No class enrollment data available." />
            ) : (
              topClasses.map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="min-w-0 text-sm font-medium text-slate-800">{item.name}</div>
                    <div className="text-sm font-semibold text-slate-950">{item.count} students</div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-slate-900"
                      style={{ width: `${topClasses[0]?.count ? (item.count / topClasses[0].count) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950">Session Schedule Snapshot</h2>
            <p className="mt-1 text-sm text-slate-500">Ordered by teaching day and start time from your class session table.</p>
          </div>
          <div className="space-y-3">
            {nextSessions.length === 0 ? (
              <EmptyState message="No class sessions available." />
            ) : (
              nextSessions.map((session) => (
                <div key={String(session.id)} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {session.class?.name || "Unassigned Class"}
                    </div>
                    <div className="mt-1 truncate text-xs text-slate-500">
                      {session.teacher?.user?.name || "Unassigned Teacher"} • {session.term?.name || "No term"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {session.day_of_week || "Day"}
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-800">
                      {formatTime(session.start_time)} - {formatTime(session.end_time)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.15fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950">Recent Term Timeline</h2>
            <p className="mt-1 text-sm text-slate-500">Latest configured academic terms from the database.</p>
          </div>
          <div className="space-y-4">
            {latestTerms.length === 0 ? (
              <EmptyState message="No term data available." />
            ) : (
              latestTerms.map((term) => (
                <div key={String(term.id)} className="rounded-2xl bg-slate-50 px-4 py-4">
                  <div className="text-sm font-semibold text-slate-900">{term.name || "Unnamed Term"}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    {formatDate(term.start_date)} to {formatDate(term.end_date)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950">Latest Enrollments</h2>
            <p className="mt-1 text-sm text-slate-500">Newest student-to-class assignments recorded in enrollments.</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full border-collapse">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3 text-right">Added</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700">
                {newestEnrollments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      No enrollment records available.
                    </td>
                  </tr>
                ) : (
                  newestEnrollments.map((item) => (
                    <tr key={String(item.id)} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {item.student?.user?.name || "Unknown Student"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {item.student?.student_code || "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-500">
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

function extractArray(response: any) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.list?.data && Array.isArray(response.list.data)) return response.list.data;
  if (response.data && Array.isArray(response.data)) return response.data;
  if (response.list && Array.isArray(response.list)) return response.list;
  return [];
}

function toTimestamp(value?: string) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatDate(value?: string) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value?: string) {
  if (!value) return "--:--";
  const timePart = value.includes("T") ? value.split("T")[1] : value;
  return timePart.slice(0, 5);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function compareSessionOrder(a: SessionItem, b: SessionItem) {
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayDiff = dayOrder.indexOf(a.day_of_week || "") - dayOrder.indexOf(b.day_of_week || "");
  if (dayDiff !== 0) return dayDiff;
  return formatTime(a.start_time).localeCompare(formatTime(b.start_time));
}

function MetricPanel({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{note}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export default Dashboard;
