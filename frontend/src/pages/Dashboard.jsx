import React, { useState, useEffect, useContext } from "react";
import { ModalContext } from '../components/layout/AppShell';

const TRAINERS = ["Enoch Haney", "Yancy Shepherd"];
const CATEGORIES = ["Game Tech", "Travel Tech"];

const Dashboard = () => {
  const [learners, setLearners] = useState([]);
  const { openModal, search } = useContext(ModalContext);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [form, setForm] = useState({
    name: "",
    title: "",
    customTitle: "",
    trainer: "",
    completedDate: "",
    testScore: ""
  });

  useEffect(() => {
    // Fetch learners from backend API
    fetch("/api/learners")
      .then((res) => res.json())
      .then((data) => {
        // Sort by most recent (assuming start_date or completion_date)
        const sorted = [...data].sort((a, b) => {
          const dateA = new Date(a.completion_date || a.start_date || 0);
          const dateB = new Date(b.completion_date || b.start_date || 0);
          return dateB - dateA;
        });
        setLearners(sorted);
      });
  }, []);

  // Listen for nav Quick Add
  // Quick Add modal handled globally

  // For editing learners only (not Quick Add)
  const openEditModal = (type, learner = null) => {
    setModalType(type);
    setShowModal(true);
    if (type === "edit" && learner) {
      setSelectedLearner(learner);
      setForm({
        name: learner.name,
        title: CATEGORIES.includes(learner.title) ? learner.title : "Other",
        customTitle: CATEGORIES.includes(learner.title) ? "" : learner.title,
        trainer: learner.trainer,
        completedDate: learner.completedDate || "",
        testScore: learner.testScore || ""
      });
    } else {
      setSelectedLearner(null);
      setForm({ name: "", title: "", customTitle: "", trainer: "", completedDate: "", testScore: "" });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (modalType === "add") {
      setLearners((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          name: form.name,
          title: form.title === "Other" ? form.customTitle : form.title,
          trainer: form.trainer,
          completedDate: form.completedDate,
          testScore: form.testScore
        }
      ]);
    } else if (modalType === "edit" && selectedLearner) {
      setLearners((prev) =>
        prev.map((l) =>
          l.id === selectedLearner.id
            ? {
                ...l,
                name: form.name,
                title: form.title === "Other" ? form.customTitle : form.title,
                trainer: form.trainer,
                completedDate: form.completedDate,
                testScore: form.testScore
              }
            : l
        )
      );
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (selectedLearner) {
      setLearners((prev) => prev.filter((l) => l.id !== selectedLearner.id));
      setShowModal(false);
    }
  };

  const fieldStyle = {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    padding: "8px 12px",
    marginBottom: 12,
    width: "100%"
  };

  // KPI calculations
  const totalLearners = learners.length;
  const currentLearners = learners.filter(l => l.status !== 'Completed').length;
  const pendingLearners = learners.filter(l => l.status === 'Pending').length;
  const pendingRetest = learners.filter(l => l.status === 'Pending Retest').length;

  // When modal closes, reset nav modal state
  const closeModal = () => {
    setShowModal(false);
    setShowQuickAdd(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Learners Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KPI title="Current Learners" value={currentLearners} />
        <KPI title="Pending Learners" value={pendingLearners} />
        <KPI title="Total Learners" value={totalLearners} />
        <KPI title="Pending Retest" value={pendingRetest} />
      </div>

      <div className="mb-4 text-lg font-semibold">10 Most Recent Learners</div>
      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th className="py-2 px-4 text-left">Name</th>
            <th className="py-2 px-4 text-left">Title</th>
            <th className="py-2 px-4 text-left">Trainer</th>
            <th className="py-2 px-4 text-left">Completed Date</th>
            <th className="py-2 px-4 text-left">Test Score</th>
          </tr>
        </thead>
        <tbody>
          {learners
            .filter(l => {
              if (!search) return true;
              const q = search.toLowerCase();
              const name = (l.employee_name || l.name || '').toLowerCase();
              const title = (l.title || '').toLowerCase();
              const trainer = (l.trainer || '').toLowerCase();
              const region = (l.region || '').toLowerCase();
              const status = (l.status || '').toLowerCase();
              return [name, title, trainer, region, status].some(v => v.includes(q));
            })
            .slice(0, 10)
            .map((learner) => (
            <tr
              key={learner.id}
              className="hover:bg-blue-50"
            >
              <td className="py-2 px-4">{learner.employee_name || learner.name}</td>
              <td className="py-2 px-4">{learner.title || learner.title}</td>
              <td className="py-2 px-4">{learner.trainer}</td>
              <td className="py-2 px-4">{learner.completion_date || learner.completedDate}</td>
              <td className="py-2 px-4">{learner.new_hire_test_score || learner.testScore}</td>
            </tr>
          ))}
        </tbody>
  </table>

  {/* Modal */}
  {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <h2 className="text-xl font-semibold mb-4">
              {modalType === "add" ? "Add Learner" : "Edit Learner"}
            </h2>
            <div className="mb-3">
              <label className="block mb-1 font-medium">Name</label>
              <input
                style={fieldStyle}
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter learner name"
              />
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium">Title</label>
              <select
                style={fieldStyle}
                name="title"
                value={form.title}
                onChange={handleChange}
              >
                <option value="">Title</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="Other">Other</option>
              </select>
              {form.title === "Other" && (
                <input
                  style={fieldStyle}
                  name="customTitle"
                  value={form.customTitle}
                  onChange={handleChange}
                  placeholder="Type new title"
                />
              )}
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium">Trainer</label>
              <select
                style={fieldStyle}
                name="trainer"
                value={form.trainer}
                onChange={handleChange}
              >
                <option value="">Select trainer</option>
                {TRAINERS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium">Start Date</label>
              <input
                style={fieldStyle}
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium">Test Score</label>
              <input
                style={fieldStyle}
                name="testScore"
                type="number"
                value={form.testScore}
                onChange={handleChange}
                placeholder="Enter test score"
              />
            </div>
            <div className="flex justify-end items-center gap-3 mt-6">
              {modalType === "edit" && (
                <button
                  className="p-2 hover:bg-red-100 rounded"
                  title="Delete Learner"
                  onClick={handleDelete}
                  style={{ marginRight: 8 }}
                >
                  {/* Modern trash can icon (Lucide/Feather style) */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 40 40" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-red-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m2 0v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6h16z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              )}
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// KPI Card component
function KPI({ title, value }) {
  return (
    <div className="bg-white rounded shadow p-4 flex flex-col items-center">
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-gray-500 text-sm">{title}</div>
    </div>
  );
}

export default Dashboard;
