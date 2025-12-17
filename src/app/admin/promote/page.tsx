"use client";

import { useState, useEffect } from "react";
import { Student } from "@/types";
import { FaArrowRight, FaCheckSquare, FaGraduationCap, FaSquare, FaUserGraduate } from "react-icons/fa";

import Modal from "@/components/Modal";
import { FaExclamationTriangle } from "react-icons/fa";

export default function PromotePage() {
    const [year, setYear] = useState("");
    const [semester, setSemester] = useState("");
    const [section, setSection] = useState("");
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [promoting, setPromoting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        if (year && semester && section) {
            fetchStudents();
        } else {
            setStudents([]);
        }
    }, [year, semester, section]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/students?year=${year}&semester=${semester}&section=${section}`);
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
                // Auto-select all by default
                setSelectedIds(new Set(data.map((s: Student) => s.id)));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleAll = () => {
        if (selectedIds.size === students.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(students.map(s => s.id)));
        }
    };

    const getTargetDetails = () => {
        const y = parseInt(year);
        const s = parseInt(semester);

        if (y === 4 && s === 2) {
            return { isAlumni: true, label: "Alumni (Graduated)" };
        }

        if (s === 1) {
            return { isAlumni: false, year: y, semester: 2, label: `${y}-${2} (Next Semester)` };
        } else {
            return { isAlumni: false, year: y + 1, semester: 1, label: `${y + 1}-${1} (Next Year)` };
        }
    };

    const confirmPromote = () => {
        setError(""); // Reset error
        setIsModalOpen(true);
    };

    const handlePromote = async () => {
        if (selectedIds.size === 0) return;

        setError("");
        const target = getTargetDetails();

        setPromoting(true);
        try {
            const res = await fetch("/api/students/promote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentIds: Array.from(selectedIds),
                    targetYear: target.year,
                    targetSemester: target.semester,
                    isAlumni: target.isAlumni
                }),
            });

            if (res.ok) {
                setIsModalOpen(false);
                setSuccessMsg("Successfully promoted students!");
                setTimeout(() => setSuccessMsg(""), 3000);

                setStudents([]);
                setSelectedIds(new Set());
                setYear("");
                setSemester("");
                setSection("");
            } else {
                const data = await res.json();
                setError(data.error || "Promotion failed");
            }
        } catch (error) {
            console.error(error);
            setError("Network or Server error occurred");
        } finally {
            setPromoting(false);
        }
    };

    const target = year && semester ? getTargetDetails() : { label: "", isAlumni: false };

    return (
        <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <FaGraduationCap size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Promote Students</h1>
                    <p className="text-sm text-slate-500">Move students to the next semester or Alumni.</p>
                </div>
                {successMsg && (
                    <div className="ml-auto rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700 shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
                        {successMsg}
                    </div>
                )}
            </div>

            {/* Selection Controls */}
            <div className="mb-8 grid grid-cols-1 gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Current Year</label>
                    <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10">
                        <option value="">Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Current Semester</label>
                    <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10">
                        <option value="">Select Semester</option>
                        <option value="1">1st Sem</option>
                        <option value="2">2nd Sem</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Current Section</label>
                    <select value={section} onChange={(e) => setSection(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10">
                        <option value="">Select Section</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                        <option value="D">Section D</option>
                    </select>
                </div>
            </div>

            {/* List and Action */}
            {students.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleAll}
                                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                            >
                                {selectedIds.size === students.length ? <FaCheckSquare className="text-blue-600" /> : <FaSquare className="text-slate-300" />}
                                Select All ({students.length})
                            </button>
                            <span className="text-sm text-slate-400">|</span>
                            <span className="text-sm font-semibold text-slate-900">
                                {selectedIds.size} Selected for Promotion
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                                <span>Current: {year}-{semester}</span>
                                <FaArrowRight size={10} />
                                <span className={target.isAlumni ? "text-amber-600 font-bold" : "text-green-600 font-bold"}>
                                    {target.label}
                                </span>
                            </div>

                            <button
                                onClick={confirmPromote}
                                disabled={promoting || selectedIds.size === 0}
                                className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:bg-amber-300 disabled:cursor-not-allowed transition-colors"
                            >
                                Promote Students
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-slate-100">
                                {students.map((student) => {
                                    const isSelected = selectedIds.has(student.id);
                                    return (
                                        <tr key={student.id}
                                            onClick={() => toggleSelection(student.id)}
                                            className={`cursor-pointer transition-colors ${isSelected ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-slate-50"}`}
                                        >
                                            <td className="px-6 py-4 w-10">
                                                {isSelected ? <FaCheckSquare className="text-blue-600" /> : <FaSquare className="text-slate-300" />}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-slate-600">{student.rollNumber}</td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">{student.name}</td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                                                {isSelected ? (
                                                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                        Promoting
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                                                        Retained
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Confirm Promotion"
            >
                <div className="flex flex-col gap-4">
                    <div className="rounded-lg bg-amber-50 p-4 border border-amber-100">
                        <div className="flex gap-3">
                            <FaExclamationTriangle className="mt-0.5 text-amber-600 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-amber-900">Warning: Irreversible Action</h4>
                                <p className="mt-1 text-sm text-amber-800">
                                    You are about to promote <span className="font-bold">{selectedIds.size} students</span>.
                                    This will update their academic records permanently.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 py-2">
                        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                            <div className="text-center">
                                <p className="text-xs font-medium uppercase text-slate-500">From</p>
                                <p className="font-bold text-slate-900">{year}-{semester}</p>
                            </div>
                            <FaArrowRight className="text-slate-400" />
                            <div className="text-center">
                                <p className="text-xs font-medium uppercase text-slate-500">To</p>
                                <p className="font-bold text-green-600">{target.label}</p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-600 text-center">
                            {students.length - selectedIds.size} students have been unchecked and will remain detained in the current year.
                        </p>

                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 text-center">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex justify-end gap-3 border-t border-slate-100 pt-5">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePromote}
                            disabled={promoting}
                            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
                        >
                            {promoting ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Processing...
                                </>
                            ) : (
                                <>Yes, Promote Students</>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
