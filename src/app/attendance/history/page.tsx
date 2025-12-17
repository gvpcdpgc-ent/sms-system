"use client";

import { useEffect, useState } from "react";
import { AttendanceHistory } from "@/types";
import { useSession } from "next-auth/react";
import * as XLSX from "xlsx";
import { FaCalendarAlt, FaFileExcel, FaFilter, FaHistory, FaTrash, FaUserCircle } from "react-icons/fa";

import ConfirmationModal from "@/components/ConfirmationModal";

export default function HistoryPage() {
    const [history, setHistory] = useState<AttendanceHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const { data: session } = useSession();

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<AttendanceHistory | null>(null);

    // Filters
    const [filterType, setFilterType] = useState<"all" | "today" | "yesterday" | "range">("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [status, setStatus] = useState<{ type: "success" | "error" | null, message: string }>({ type: null, message: "" });

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/attendance/history");
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (record: AttendanceHistory) => {
        setRecordToDelete(record);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        setStatus({ type: null, message: "" });

        try {
            const res = await fetch(`/api/attendance/history/${id}`, { method: "DELETE" });
            if (res.ok) {
                setHistory(prev => prev.filter(h => h.id !== id));
                setStatus({ type: "success", message: "Record deleted successfully" });
                setTimeout(() => setStatus({ type: null, message: "" }), 3000);
            } else {
                setStatus({ type: "error", message: "Failed to delete record" });
            }
        } catch (error) {
            console.error(error);
            setStatus({ type: "error", message: "Error deleting record" });
        }
    };

    const handleReDownload = (record: AttendanceHistory) => {
        if (!record.details || record.details === "[]") {
            // Replaced alert with status message for consistency, or keep alert if critical. 
            // User requested inline feedback, so using status.
            setStatus({ type: "error", message: "No details available for this record (Legacy data)." });
            setTimeout(() => setStatus({ type: null, message: "" }), 3000);
            return;
        }

        try {
            const data = JSON.parse(record.details);
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Report");
            XLSX.writeFile(wb, record.fileName || "report.xlsx");
            setStatus({ type: "success", message: "Report downloaded successfully." });
            setTimeout(() => setStatus({ type: null, message: "" }), 3000);
        } catch (e) {
            console.error("Error parsing details", e);
            setStatus({ type: "error", message: "Error regenerating file." });
            setTimeout(() => setStatus({ type: null, message: "" }), 3000);
        }
    };

    const getFilteredHistory = () => {
        if (filterType === "all") return history;

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return history.filter(record => {
            const recordDate = new Date(record.date);

            if (filterType === "today") {
                return recordDate >= startOfDay;
            }

            if (filterType === "yesterday") {
                const startOfYesterday = new Date(startOfDay);
                startOfYesterday.setDate(startOfYesterday.getDate() - 1);
                return recordDate >= startOfYesterday && recordDate < startOfDay;
            }

            if (filterType === "range") {
                if (!startDate) return true;
                const start = new Date(startDate);
                const end = endDate ? new Date(endDate) : new Date();
                end.setHours(23, 59, 59); // End of day
                return recordDate >= start && recordDate <= end;
            }

            return true;
        });
    };

    const filteredHistory = getFilteredHistory();

    return (
        <div className="mx-auto max-w-7xl">
            {status.message && !isDeleteModalOpen && (
                <div className={`mb-4 rounded-md p-4 text-sm font-medium ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                    {status.message}
                </div>
            )}

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                        <FaHistory size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Attendance History</h1>
                        <p className="text-sm text-slate-500">View and manage past reports.</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500">
                    <FaFilter />
                    <span className="text-sm font-semibold">Filter:</span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {["all", "today", "yesterday", "range"].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type as any)}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${filterType === type
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>

                {filterType === "range" && (
                    <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                            <FaCalendarAlt className="text-slate-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent text-sm outline-none"
                            />
                        </div>
                        <span className="text-slate-400">-</span>
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                            <FaCalendarAlt className="text-slate-400" />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent text-sm outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/50">
                                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Class Details</th>
                                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">File</th>
                                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Downloaded By</th>
                                {session?.user.role === "ADMIN" && <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading records...</td></tr>
                            ) : filteredHistory.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No records found matching filters</td></tr>
                            ) : (
                                filteredHistory.map((record) => (
                                    <tr key={record.id} className="group hover:bg-slate-50/80 transition-colors">
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                            {new Date(record.date).toLocaleDateString("en-IN", {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-900">
                                                    Year {record.year} - Sem {record.semester}
                                                </span>
                                                <span className="text-xs text-slate-500">Section {record.section?.name}</span>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${record.status === "Marked Absent"
                                                ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10"
                                                : "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/10"
                                                }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <button
                                                onClick={() => handleReDownload(record)}
                                                className="group/btn flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                                                title="Click to Download Again"
                                            >
                                                <FaFileExcel className="text-green-600" />
                                                <span className="font-mono text-xs">{record.fileName}</span>
                                            </button>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <FaUserCircle className="text-slate-400" />
                                                <span>{record.user?.username || "Unknown"}</span>
                                            </div>
                                        </td>
                                        {session?.user.role === "ADMIN" && (
                                            <td className="whitespace-nowrap px-6 py-4 text-right">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); confirmDelete(record); }}
                                                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                    title="Delete Record"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    if (recordToDelete) {
                        handleDelete(recordToDelete.id);
                        setIsDeleteModalOpen(false);
                    }
                }}
                title="Delete Record"
                message={`Are you sure you want to delete the attendance report for ${recordToDelete ? new Date(recordToDelete.date).toLocaleDateString() : ''}?`}
                confirmText="Delete"
                isDangerous={true}
            />
        </div>
    );
}
