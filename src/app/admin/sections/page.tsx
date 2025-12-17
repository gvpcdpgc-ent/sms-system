"use client";

import { useState, useEffect } from "react";
import { FaLayerGroup, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import Modal from "@/components/Modal";
import ConfirmationModal from "@/components/ConfirmationModal";

interface Section {
    id: string;
    name: string;
}

export default function SectionsPage() {
    const [sections, setSections] = useState<Section[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Edit/Delete State
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);

    const [name, setName] = useState("");
    const [status, setStatus] = useState<{ type: "success" | "error" | null, message: string }>({ type: null, message: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        const res = await fetch("/api/sections");
        if (res.ok) setSections(await res.json());
    };

    const openAddModal = () => {
        setEditingSection(null);
        setName("");
        setIsModalOpen(true);
    };

    const openEditModal = (sec: Section) => {
        setEditingSection(sec);
        setName(sec.name);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: null, message: "" });

        try {
            const url = editingSection ? `/api/sections/${editingSection.id}` : "/api/sections";
            const method = editingSection ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name })
            });

            if (res.ok) {
                setStatus({ type: "success", message: `Section ${editingSection ? "updated" : "created"} successfully!` });
                setName("");
                setEditingSection(null);
                fetchSections();
                setTimeout(() => {
                    setIsModalOpen(false);
                    setStatus({ type: null, message: "" });
                }, 1500);
            } else {
                setStatus({ type: "error", message: "Failed to save section." });
            }
        } catch (e) {
            setStatus({ type: "error", message: "An error occurred." });
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (sec: Section) => {
        setSectionToDelete(sec);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!sectionToDelete) return;
        setStatus({ type: null, message: "" });

        try {
            const res = await fetch(`/api/sections/${sectionToDelete.id}`, { method: "DELETE" });
            if (res.ok) {
                setStatus({ type: "success", message: "Section deleted successfully" });
                setSections(prev => prev.filter(s => s.id !== sectionToDelete.id));
                setIsDeleteModalOpen(false);
                setSectionToDelete(null);
                setTimeout(() => setStatus({ type: null, message: "" }), 3000);
            } else {
                const data = await res.json();
                setStatus({ type: "error", message: data.error || "Failed to delete section" });
            }
        } catch (error) {
            setStatus({ type: "error", message: "Error deleting section" });
        }
    };

    return (
        <div className="mx-auto max-w-7xl">
            {/* Global Status Message for Delete */}
            {status.message && !isModalOpen && (
                <div className={`mb-4 rounded-md p-4 text-sm font-medium ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {status.message}
                </div>
            )}

            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                        <FaLayerGroup size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Sections</h1>
                        <p className="text-sm text-slate-500">Manage available sections.</p>
                    </div>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
                >
                    <FaPlus /> Add Section
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {sections.map((sec) => (
                    <div key={sec.id} className="group relative flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-teal-300 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold">
                                {sec.name}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Section {sec.name}</h3>
                                {/* Hidden ID */}
                            </div>
                        </div>
                        <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => openEditModal(sec)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit"
                            >
                                <FaEdit />
                            </button>
                            <button
                                onClick={() => confirmDelete(sec)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingSection ? "Edit Section" : "Add Section"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {status.message && (
                        <div className={`rounded-md p-3 text-sm ${status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                            }`}>
                            {status.message}
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-slate-700">Section Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. A, B, C"
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                            required
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
                            {editingSection ? "Save Changes" : "Create Section"}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Section"
                message={`Are you sure you want to delete Section ${sectionToDelete?.name}? This might fail if students are assigned to it.`}
                confirmText="Delete"
                isDangerous={true}
            />
        </div>
    );
}
