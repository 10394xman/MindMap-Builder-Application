import { useState, useEffect } from "react";
import "../../public/fontawesome.css";
import { Link } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const [mindMaps, setMindMaps] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editField, setEditField] = useState(null); // 'title' or 'desc'
  const [editValue, setEditValue] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const openEditField = (map, field) => {
    setEditId(map._id);
    setEditField(field);
    setEditValue(field === "title" ? map.title : map.description || "");
  };
  const closeEditField = () => {
    setEditId(null);
    setEditField(null);
    setEditValue("");
  };

  const apiBase = import.meta.env.VITE_BACKEND_URL || "";

  const saveEditField = async () => {
    setEditLoading(true);
    try {
      const update =
        editField === "title"
          ? { title: editValue }
          : { description: editValue };
      await axios.put(`${apiBase}/api/mindmaps/${editId}`, update);
      setMindMaps(
        mindMaps.map((m) => (m._id === editId ? { ...m, ...update } : m))
      );
      closeEditField();
    } catch (e) {
      alert("Failed to update mind map");
    }
    setEditLoading(false);
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMindMaps();
  }, []);

  const fetchMindMaps = async () => {
    try {
      const response = await axios.get(`${apiBase}/api/mindmaps/dashboard`);
      setMindMaps(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch mind maps:", error);
      setError("Failed to load mind maps");
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this mind map?")) {
      try {
        await axios.delete(`${apiBase}/api/mindmaps/${id}`);
        setMindMaps(mindMaps.filter((map) => map._id !== id));
      } catch (error) {
        console.error("Failed to delete mind map:", error);
        setError("Failed to delete mind map");
      }
    }
  };

  const handleCreateNew = async () => {
    try {
      const response = await axios.post(`${apiBase}/api/mindmaps/dashboard`, {
        title: "New Mind Map",
        description: "",
        tags: [],
      });
      window.location.href = `/mindmap/${response.data._id}`;
    } catch (error) {
      console.error("Failed to create mind map:", error);
      setError("Failed to create new mind map");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 ">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Mind Maps</h1>
        <button
          onClick={handleCreateNew}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium"
        >
          Create New
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {mindMaps.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🧠</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No mind maps yet
          </h2>
          <p className="text-gray-500 mb-4">
            Create your first mind map to get started
          </p>
          <button
            onClick={handleCreateNew}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md font-medium"
          >
            Create Your First Mind Map
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mindMaps.map((mindMap) => (
            <div
              key={mindMap._id}
              className="bg-white rounded-lg shadow-xl overflow-hidden hover:shadow-lg transition-shadow border"
            >
              <div className="p-6">
                <div className="flex items-center mb-2 justify-between">
                  {editId === mindMap._id && editField === "title" ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveEditField();
                      }}
                      className="flex items-center w-full"
                    >
                      <input
                        className="text-xl font-semibold text-gray-900 border rounded px-2 py-1 w-full"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                      />
                      <div className="flex items-center ml-2">
                        <button
                          type="submit"
                          className="text-green-600 hover:text-green-800"
                          title="Save"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                        <button
                          type="button"
                          onClick={closeEditField}
                          className="ml-2 text-gray-400 hover:text-red-600"
                          title="Cancel"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center w-full justify-between">
                      <h3
                        className="text-xl font-semibold text-gray-900 truncate cursor-pointer"
                        onClick={() => openEditField(mindMap, "title")}
                      >
                        {mindMap.title}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditField(mindMap, "title");
                        }}
                        className="ml-4 text-gray-500 hover:text-primary-600"
                        title="Edit title"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center mb-4 justify-between">
                  {editId === mindMap._id && editField === "desc" ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveEditField();
                      }}
                      className="flex items-center w-full"
                    >
                      <textarea
                        className="text-gray-600 text-sm border rounded px-2 py-1 w-full"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                        rows={2}
                      />
                      <div className="flex items-center ml-2">
                        <button
                          type="submit"
                          className="text-green-600 hover:text-green-800"
                          title="Save"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                        <button
                          type="button"
                          onClick={closeEditField}
                          className="ml-2 text-gray-400 hover:text-red-600"
                          title="Cancel"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center w-full justify-between">
                      <p
                        className="text-gray-800 text-md line-clamp-2 mr-2 my-2 cursor-pointer"
                        onClick={() => openEditField(mindMap, "desc")}
                      >
                        {mindMap.description || "No description"}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditField(mindMap, "desc");
                        }}
                        className="ml-4 text-gray-400 hover:text-primary-600"
                        title="Edit description"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>
                    Updated at: {new Date(mindMap.updatedAt).toLocaleString()}
                  </span>
                  <span>
                    {typeof mindMap.nodeCount === "number"
                      ? mindMap.nodeCount
                      : 0}{" "}
                    nodes
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                <Link
                  to={`/mindmap/${mindMap._id}`}
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(mindMap._id)}
                  className="text-red-600 hover:text-red-700 font-medium text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
