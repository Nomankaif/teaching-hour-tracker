"use client";

import { CalendarDays, Clock, DollarSign, GraduationCap, Plus, RefreshCcw, Trash2, Users } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { formatShortDate, toDateInputValue } from "@/lib/dates";
import type { Entry, Student, Summary } from "@/lib/types";

const emptySummary: Summary = {
  todayHours: 0,
  weekHours: 0,
  totalHours: 0,
  activeStudents: 0,
  recentEntries: [],
  weeklyRows: [],
  totalRows: []
};

type LoadState = "loading" | "ready" | "error";

export default function Home() {
  const [students, setStudents] = useState<Student[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const [studentForm, setStudentForm] = useState({ name: "", parentName: "", email: "", hourlyRate: "" });
  const [entryForm, setEntryForm] = useState({ studentId: "", date: toDateInputValue(), hours: "", notes: "" });

  const activeStudents = useMemo(() => students.filter((student) => student.status === "active"), [students]);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoadState("loading");
    }
    try {
      const [studentResponse, summaryResponse] = await Promise.all([fetch("/api/students"), fetch("/api/summary")]);

      if (!studentResponse.ok || !summaryResponse.ok) {
        throw new Error("Database request failed");
      }

      const nextStudents = await studentResponse.json();
      const nextSummary = await summaryResponse.json();
      setStudents(nextStudents);
      setSummary(nextSummary);
      setEntryForm((current) => ({
        ...current,
        studentId: current.studentId || nextStudents[0]?._id || ""
      }));
      setLoadState("ready");
    } catch {
      setLoadState("error");
      setMessage("Could not connect to MongoDB. Check MONGODB_URI and make sure MongoDB is running.");
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  async function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentForm)
    });

    if (!response.ok) {
      setMessage("Student could not be saved.");
      return;
    }

    setStudentForm({ name: "", parentName: "", email: "", hourlyRate: "" });
    setMessage("Student added.");
    await loadData();
  }

  async function addEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entryForm)
    });

    if (!response.ok) {
      setMessage("Hours could not be saved.");
      return;
    }

    setEntryForm((current) => ({ ...current, hours: "", notes: "" }));
    setMessage("Teaching hours saved.");
    await loadData();
  }

  async function deleteEntry(entry: Entry) {
    await fetch(`/api/entries/${entry._id}`, { method: "DELETE" });
    setMessage("Entry deleted.");
    await loadData();
  }

  async function toggleStudent(student: Student) {
    await fetch(`/api/students/${student._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...student, status: student.status === "active" ? "inactive" : "active" })
    });
    await loadData();
  }

  async function deleteStudent(student: Student) {
    await fetch(`/api/students/${student._id}`, { method: "DELETE" });
    setMessage("Student and related entries deleted.");
    await loadData();
  }

  return (
    <main className="min-h-screen bg-[#f4f1ea]">
      <section className="border-b border-[#d9d1c1] bg-[#fbfaf7]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3 text-[#52715c]">
              <GraduationCap className="h-7 w-7" />
              <span className="text-sm font-semibold uppercase tracking-wide">Tuition tracker</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-[#17211c] sm:text-4xl">Daily hours, weekly totals, total hours</h1>
          </div>
          <button
            onClick={() => loadData()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#17211c] px-4 text-sm font-semibold text-white hover:bg-[#2e4438]"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          {message ? (
            <div className="rounded-md border border-[#d6c49f] bg-[#fff8e6] px-4 py-3 text-sm text-[#5a4520]">{message}</div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={<Clock />} label="Today" value={`${summary.todayHours.toFixed(1)} h`} />
            <Metric icon={<CalendarDays />} label="This week" value={`${summary.weekHours.toFixed(1)} h`} />
            <Metric icon={<Clock />} label="Total hours" value={`${summary.totalHours.toFixed(1)} h`} />
            <Metric icon={<Users />} label="Active students" value={String(summary.activeStudents)} />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel title="Add Daily Hours">
              <form onSubmit={addEntry} className="space-y-4">
                <label className="block text-sm font-medium text-[#314139]">
                  Student
                  <select
                    value={entryForm.studentId}
                    onChange={(event) => setEntryForm({ ...entryForm, studentId: event.target.value })}
                    className="mt-1 h-11 w-full rounded-md border border-[#cfc6b6] bg-white px-3"
                    required
                  >
                    <option value="">Select student</option>
                    {activeStudents.map((student) => (
                      <option value={student._id} key={student._id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-[#314139]">
                    Date
                    <input
                      type="date"
                      value={entryForm.date}
                      onChange={(event) => setEntryForm({ ...entryForm, date: event.target.value })}
                      className="mt-1 h-11 w-full rounded-md border border-[#cfc6b6] bg-white px-3"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-[#314139]">
                    Hours
                    <input
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={entryForm.hours}
                      onChange={(event) => setEntryForm({ ...entryForm, hours: event.target.value })}
                      className="mt-1 h-11 w-full rounded-md border border-[#cfc6b6] bg-white px-3"
                      required
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium text-[#314139]">
                  Notes
                  <textarea
                    value={entryForm.notes}
                    onChange={(event) => setEntryForm({ ...entryForm, notes: event.target.value })}
                    className="mt-1 min-h-24 w-full rounded-md border border-[#cfc6b6] bg-white px-3 py-2"
                    placeholder="SAT practice, Algebra revision, reading class..."
                  />
                </label>
                <SubmitButton label="Save Hours" />
              </form>
            </Panel>

            <Panel title="Add Student">
              <form onSubmit={addStudent} className="space-y-4">
                <TextField label="Student name" value={studentForm.name} onChange={(name) => setStudentForm({ ...studentForm, name })} required />
                <TextField label="Parent name" value={studentForm.parentName} onChange={(parentName) => setStudentForm({ ...studentForm, parentName })} />
                <TextField label="Email" value={studentForm.email} onChange={(email) => setStudentForm({ ...studentForm, email })} />
                <TextField
                  label="Hourly rate"
                  type="number"
                  value={studentForm.hourlyRate}
                  onChange={(hourlyRate) => setStudentForm({ ...studentForm, hourlyRate })}
                />
                <SubmitButton label="Add Student" />
              </form>
            </Panel>
          </div>

          <Panel title="Weekly Report">
            <ReportTable rows={summary.weeklyRows} />
          </Panel>

          <Panel title="Total Hours Report">
            <ReportTable rows={summary.totalRows} showEarnings emptyText="No hours saved yet." />
          </Panel>
        </section>

        <aside className="space-y-5">
          <Panel title="Students">
            <div className="space-y-3">
              {students.length === 0 ? <EmptyText text="Add your first student to begin tracking." /> : null}
              {students.map((student) => (
                <div key={student._id} className="rounded-md border border-[#ddd5c8] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-[#17211c]">{student.name}</h3>
                      <p className="mt-1 text-sm text-[#657268]">{student.email || student.parentName || "No contact added"}</p>
                      <p className="mt-2 text-sm text-[#52715c]">
                        ${Number(student.hourlyRate || 0).toFixed(2)} / hour · {student.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleStudent(student)}
                        className="h-9 rounded-md border border-[#b7c5b9] px-3 text-xs font-semibold text-[#314139] hover:bg-[#eef4ef]"
                      >
                        {student.status === "active" ? "Pause" : "Activate"}
                      </button>
                      <IconButton label="Delete student" onClick={() => deleteStudent(student)}>
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recent Entries">
            <div className="space-y-3">
              {summary.recentEntries.length === 0 ? <EmptyText text={loadState === "error" ? "MongoDB is not connected yet." : "No hours saved yet."} /> : null}
              {summary.recentEntries.map((entry) => (
                <div key={entry._id} className="rounded-md border border-[#ddd5c8] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-[#17211c]">{entry.studentName}</h3>
                      <p className="mt-1 text-sm text-[#657268]">
                        {formatShortDate(entry.date)} · {entry.hours} hours
                      </p>
                      {entry.notes ? <p className="mt-2 text-sm text-[#314139]">{entry.notes}</p> : null}
                    </div>
                    <IconButton label="Delete entry" onClick={() => deleteEntry(entry)}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#ddd5c8] bg-[#fbfaf7] p-4">
      <div className="flex items-center gap-2 text-[#52715c]">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-[#e9f0ea] [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="mt-4 text-3xl font-bold text-[#17211c]">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-[#d9d1c1] bg-[#fbfaf7] p-5">
      <h2 className="mb-4 text-lg font-bold text-[#17211c]">{title}</h2>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  required = false,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm font-medium text-[#314139]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-11 w-full rounded-md border border-[#cfc6b6] bg-white px-3"
        required={required}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
      />
    </label>
  );
}

function SubmitButton({ label }: { label: string }) {
  return (
    <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#52715c] px-4 text-sm font-semibold text-white hover:bg-[#405b49]">
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}

function IconButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-md border border-[#d0c7b8] text-[#5f352d] hover:bg-[#fff1ed]"
    >
      {children}
    </button>
  );
}

function ReportTable({
  rows,
  showEarnings = false,
  emptyText = "No entries for this period."
}: {
  rows: Summary["weeklyRows"];
  showEarnings?: boolean;
  emptyText?: string;
}) {
  const totalHours = rows.reduce((sum, row) => sum + row.totalHours, 0);
  const totalEarnings = rows.reduce((sum, row) => sum + row.totalEarnings, 0);

  if (rows.length === 0) {
    return <EmptyText text={emptyText} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#d9d1c1] text-[#657268]">
            <th className="py-3 pr-3 font-semibold">Student</th>
            <th className="px-3 py-3 font-semibold">Hours</th>
            {showEarnings ? <th className="px-3 py-3 font-semibold">Earnings</th> : null}
            <th className="px-3 py-3 font-semibold">Days taught</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.studentId} className="border-b border-[#ebe5da]">
              <td className="py-3 pr-3 font-semibold text-[#17211c]">{row.studentName}</td>
              <td className="px-3 py-3">{row.totalHours.toFixed(1)}</td>
              {showEarnings ? (
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {row.totalEarnings.toFixed(2)}
                  </span>
                </td>
              ) : null}
              <td className="px-3 py-3">{Object.keys(row.days).length}</td>
            </tr>
          ))}
          <tr className="font-bold text-[#17211c]">
            <td className="pt-3 pr-3">Total</td>
            <td className="px-3 pt-3">{totalHours.toFixed(1)}</td>
            {showEarnings ? <td className="px-3 pt-3">${totalEarnings.toFixed(2)}</td> : null}
            <td className="px-3 pt-3" />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed border-[#cfc6b6] bg-white px-4 py-5 text-sm text-[#657268]">{text}</p>;
}
