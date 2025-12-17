"use client";

import { useState, useEffect } from "react";
import { Student } from "@/types";
import Modal from "@/components/Modal";
import * as XLSX from "xlsx";
import { FaDownload, FaEdit, FaFileImport, FaPlus, FaTrash, FaUserGraduate } from "react-icons/fa";
import ConfirmationModal from "@/components/ConfirmationModal";

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    // Filters
    const [year, setYear] = useState("");
    const [semester, setSemester] = useState("");
    const [section, setSection] = useState("");
    // The original loading state for fetchStudents is now replaced by the new `loading` state,
    // but its initial value was `false`. The new `loading` state starts as `true`.
    // I will keep the original `loading` state for filters as it was, assuming it's distinct.
    // If the user intended to remove the filter-specific loading, they would have specified.
    const [filterLoading, setFilterLoading] = useState(false); // Renamed to avoid conflict with new `loading`

    // Status State
    const [status, setStatus] = useState<{ type: "success" | "error" | null, message: string }>({ type: null, message: "" });

    // Dropdown Data
    const [departments, setDepartments] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        rollNumber: "",
        mobile: "",
        year: "1",
        semester: "1",
        departmentId: "",
        sectionId: ""
    });

    const fetchDepartments = async () => {
        try {
            const res = await fetch("/api/departments");
            if (res.ok) {
                const data = await res.json();
                // Filter ensures only CSE and CSM departments are available
                const specificDepts = data.filter((d: any) =>
                    d.code?.toUpperCase().includes("CSE") ||
                    d.code?.toUpperCase().includes("CSM") ||
                    d.name?.toUpperCase().includes("CSE") ||
                    d.name?.toUpperCase().includes("CSM")
                );
                // Fallback to all data if filter returns nothing (though user requirement implies we should be strict,
                // for safety if codes mismatch we might want to see at least something, but for now strict compliance with "ensure only")
                setDepartments(specificDepts.length > 0 ? specificDepts : []);
            }
        } catch (e) { console.error(e); }
    };

    const fetchSections = async () => {
        try {
            const res = await fetch("/api/sections");
            if (res.ok) setSections(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchStudents = async () => {
        setLoading(true);
        setStatus({ type: null, message: "" });
        try {
            const query = new URLSearchParams();
            if (year) query.set("year", year);
            if (semester) query.set("semester", semester);
            if (section) query.set("section", section);

            const res = await fetch(`/api/students?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            }
        } catch (error) {
            console.error(error);
            setStatus({ type: "error", message: "Failed to fetch students." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
        fetchDepartments();
        fetchSections();
    }, [year, semester, section]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ type: null, message: "" });

        try {
            const url = editingStudent
                ? `/api/students/${editingStudent.id}`
                : "/api/students";
            const method = editingStudent ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const successMessage = editingStudent ? "Student updated successfully" : "Student created successfully";
                setStatus({ type: "success", message: successMessage });
                setEditingStudent(null);
                setFormData({ rollNumber: "", name: "", mobile: "", year: "1", semester: "1", departmentId: "", sectionId: "" });
                fetchStudents();
                setTimeout(() => {
                    setIsModalOpen(false);
                    setStatus({ type: null, message: "" });
                }, 1500);
            } else {
                const data = await res.json();
                setStatus({ type: "error", message: data.error || "Failed to save student" });
            }
        } catch (error) {
            console.error(error);
            setStatus({ type: "error", message: "Error saving student" });
        }
    };

    const confirmDelete = (student: Student) => {
        setStudentToDelete(student);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        setStatus({ type: null, message: "" });
        try {
            const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
            if (res.ok) {
                setStatus({ type: "success", message: "Student deleted successfully" });
                setStudents(prev => prev.filter(s => s.id !== id));
                setTimeout(() => setStatus({ type: null, message: "" }), 3000);
            } else {
                setStatus({ type: "error", message: "Failed to delete student" });
            }
        } catch (error) {
            console.error(error);
            setStatus({ type: "error", message: "Error deleting student" });
        }
    };

    const openAddModal = () => {
        setEditingStudent(null);
        setFormData({ rollNumber: "", name: "", mobile: "", year: "1", semester: "1", departmentId: "", sectionId: "" });
        setIsModalOpen(true);
    };

    const openEditModal = (student: Student) => {
        setEditingStudent(student);
        setFormData({
            rollNumber: student.rollNumber,
            name: student.name,
            mobile: student.mobile,
            year: student.year,
            semester: student.semester,
            departmentId: student.departmentId || "",
            sectionId: student.sectionId || "",
        });
        setIsModalOpen(true);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data: any[] = XLSX.utils.sheet_to_json(ws);

            let successCount = 0;
            for (const row of data) {
                const studentPayload = {
                    rollNumber: String(row['Roll Number'] || row['Roll'] || row['rollNumber']),
                    name: String(row['Name'] || row['name']),
                    mobile: String(row['Mobile'] || row['Phone'] || row['mobile']),
                    year: String(row['Year'] || row['year']),
                    semester: String(row['Semester'] || row['Sem'] || row['semester']),
                    sectionId: String(row['SectionId'] || row['Section'] || row['Sec'] || row['section']),
                    departmentId: String(row['DepartmentId'] || row['Dept'] || row['department'])
                };

                if (!studentPayload.rollNumber) continue;

                const res = await fetch("/api/students", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(studentPayload)
                });
                if (res.ok) successCount++;
            }
            setStatus({ type: "success", message: `Import complete. ${successCount} students imported.` });
            fetchStudents();
            setTimeout(() => setStatus({ type: null, message: "" }), 3000);
        };
        reader.readAsBinaryString(file);
    };

    const downloadSample = () => {
        const headers = [
            { "Roll Number": "21131A0501", "Name": "John Doe", "Mobile": "9876543210", "Year": "1", "Semester": "1", "Section": "A" }
        ];
        const ws = XLSX.utils.json_to_sheet(headers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "student_import_template.xlsx");
    };

    const exportData = () => {
        const data = students.map(s => ({
            "Roll Number": s.rollNumber,
            "Name": s.name,
            "Mobile": s.mobile,
            "Year": s.year,
            "Semester": s.semester,
            "Section": s.section
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Students");
        XLSX.writeFile(wb, `students_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="mx-auto max-w-7xl">
            {/* Status Message */}
            {status.message && !isModalOpen && !isDeleteModalOpen && (
                <div className={`mb-4 rounded-md p-4 text-sm font-medium ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {status.message}
                </div>
            )}

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                        <FaUserGraduate size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Manage Students</h1>
                        <p className="text-sm text-slate-500">Add, edit, or import student details.</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={downloadSample}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
                        title="Download Template"
                    >
                        <FaFileImport className="text-slate-400" />
                        Sample CSV
                    </button>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
                        <FaFileImport className="text-blue-500" />
                        Import
                        <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <button
                        onClick={exportData}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
                    >
                        <FaDownload className="text-green-500" />
                        Export
                    </button>
                    <button onClick={openAddModal} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
                        <FaPlus size={12} /> Add Student
                    </button>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
                <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10">
                    <option value="">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                </select>
                <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10">
                    <option value="">All Semesters</option>
                    <option value="1">1st Sem</option>
                    <option value="2">2nd Sem</option>
                </select>
                <select value={section} onChange={(e) => setSection(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10">
                    <option value="">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                </select>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/50">
                                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Roll No</th>
                                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Class</th>
                                <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Loading...</td></tr> :
                                students.map((student) => (
                                    <tr key={student.id} className="group hover:bg-slate-50/80 transition-colors">
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-slate-600">{student.rollNumber}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">{student.name}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                                            {student.year}-{student.semester} ({typeof student.section === 'object' ? (student.section as any)?.name : student.section})
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => openEditModal(student)}
                                                    className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <FaEdit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(student)}
                                                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <FaTrash size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            {!loading && students.length === 0 && (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No students found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setStatus({ type: null, message: "" });
                }}
                title={editingStudent ? "Edit Student" : "Add New Student"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {status.message && (
                        <div className={`rounded-md p-3 text-sm ${status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                            }`}>
                            {status.message}
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-slate-700">Full Name</label>
                        <input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Roll Number</label>
                        <input
                            value={formData.rollNumber}
                            onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Mobile Number</label>
                        <input
                            value={formData.mobile}
                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Year</label>
                            <select
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            >
                                {[1, 2, 3, 4].map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Semester</label>
                            <select
                                value={formData.semester}
                                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            >
                                {[1, 2].map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Department</label>
                            <select
                                value={formData.departmentId}
                                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                required
                            >
                                <option value="">Select Dept</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Section</label>
                            <select
                                value={formData.sectionId}
                                onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                required
                            >
                                <option value="">Select Section</option>
                                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm">
                            {editingStudent ? "Save Changes" : "Save Student"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    if (studentToDelete) {
                        handleDelete(studentToDelete.id);
                        setIsDeleteModalOpen(false); // Close modal after confirming
                    }
                }}
                title="Delete Student"
                message={`Are you sure you want to delete ${studentToDelete?.name}? This action cannot be undone.`}
                confirmText="Delete"
                isDangerous={true}
            />
        </div>
    );
}
