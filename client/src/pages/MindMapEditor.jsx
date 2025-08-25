import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import MindMapNode from "../components/MindMapNode";
import "../../public/style.css";

const MindMapEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null); // useRef returns a mutable object with a .current property.

  const [mindMap, setMindMap] = useState(null); //current state of mindmap
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [nodeStart, setNodeStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchMindMap();
  }, [id]);

  // Only set mindMap directly on initial load, do not push to history
  const fetchMindMap = async () => {
    try {
      const response = await axios.get(`/api/mindmaps/${id}`);
      setMindMap(response.data);
      setHistory([]);
      setFuture([]);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch mind map:", error);
      setError("Failed to load mind map");
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await axios.put(`/api/mindmaps/${id}`, mindMap);
      // Show success message
      setError("");
      alert("Mind map saved successfully!");
    } catch (error) {
      console.error("Failed to save mind map:", error);
      setError("Failed to save mind map");
    }
  };

  const handleAddNode = (e) => {
    if (!mindMap) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNode = {
      id: `node-${Date.now()}`,
      content: "New Node",
      position: { x, y },
      parent: selectedNode,
      connections: [],
      color: "#ffffff",
    };

    updateMindMap({
      ...mindMap,
      nodes: [...mindMap.nodes, newNode],
    });

    setSelectedNode(newNode.id);
  };

  const handleUpdateNode = (nodeId, updates) => {
    updateMindMap({
      ...mindMap,
      nodes: mindMap.nodes.map((node) =>
        node.id === nodeId ? { ...node, ...updates } : node
      ),
    });
  };

  const handleDeleteNode = (nodeId) => {
    if (window.confirm("Are you sure you want to delete this node?")) {
      updateMindMap({
        ...mindMap,
        nodes: mindMap.nodes.filter((node) => node.id !== nodeId),
      });
      if (selectedNode === nodeId) {
        setSelectedNode(null);
      }
    }
  };

  const handleNodeMouseDown = (e, nodeId) => {
    //stopPropagation() prevents the event from moving beyond the current element
    //meaning it will not trigger event handlers on parent elements in the bubbling phase or in capturing phase.
    e.stopPropagation();
    setSelectedNode(nodeId);
    setIsDragging(true);

    const node = mindMap.nodes.find((n) => n.id === nodeId);
    setDragStart({ x: e.clientX, y: e.clientY });
    setNodeStart({ x: node.position.x, y: node.position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedNode) return;

    const rect = canvasRef.current.getBoundingClientRect();

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    const updatedNodes = mindMap.nodes.map((node) => {
      if (node.id === selectedNode) {
        return {
          ...node,
          position: {
            x: nodeStart.x + dx,
            y: nodeStart.y + dy,
          },
        };
      }
      return node;
    });

    updateMindMap({ ...mindMap, nodes: updatedNodes });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleConnectNodes = () => {
    if (!selectedNode || mindMap.nodes.length < 2) return;
    // Simple connection logic - connect to a random other node
    const otherNodes = mindMap.nodes.filter((node) => node.id !== selectedNode);
    if (otherNodes.length === 0) return;
    const randomNode =
      otherNodes[Math.floor(Math.random() * otherNodes.length)];
    updateMindMap({
      ...mindMap,
      nodes: mindMap.nodes.map((node) => {
        if (node.id === selectedNode) {
          return {
            ...node,
            connections: [...new Set([...node.connections, randomNode.id])],
          };
        }
        return node;
      }),
    });
  };

  // State for connect-to dropdown
  const [connectTarget, setConnectTarget] = useState("");

  // New: Connect selected node to a user-chosen node
  const handleConnectToNode = (targetNodeId) => {
    if (!selectedNode || !targetNodeId || selectedNode === targetNodeId) return;
    updateMindMap({
      ...mindMap,
      nodes: mindMap.nodes.map((node) => {
        if (node.id === selectedNode) {
          return {
            ...node,
            connections: [...new Set([...node.connections, targetNodeId])],
          };
        }
        return node;
      }),
    });
  };

  // Only push to history if mindMap is not null (i.e., not on initial load)
  const updateMindMap = (newMindMap) => {
    setHistory((prev) => (mindMap ? [...prev, mindMap] : prev));
    setFuture([]);
    setMindMap(newMindMap);
  };

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture((fut) => [mindMap, ...fut]); // push current to future
    setHistory((hist) => hist.slice(0, hist.length - 1)); // remove last from history
    setMindMap(previous);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((hist) => [...hist, mindMap]); // push current to history
    setFuture((fut) => fut.slice(1)); // remove first from future
    setMindMap(next);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-gray-900 "></div>
      </div>
    );
  }

  if (!mindMap) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Mind map not found</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center animation">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{mindMap.title}</h1>
          <p className="text-gray-600 text-sm">{mindMap.description}</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
          >
            Back to Dashboard
          </button>
          <button
            onClick={handleSave}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
          >
            Save
          </button>
          <button
            onClick={() => {
              window.print();
            }}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md"
          >
            Print
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3">
          {error}
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 mind-map-canvas overflow-hidden relative print-area"
        onClick={handleAddNode}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Render connection lines */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {mindMap.nodes.map((node) =>
            node.connections?.map((connectionId) => {
              const targetNode = mindMap.nodes.find(
                (n) => n.id === connectionId
              );
              if (!targetNode) return null;

              return (
                <line
                  key={`${node.id}-${connectionId}`}
                  x1={node.position.x}
                  y1={node.position.y}
                  x2={targetNode.position.x}
                  y2={targetNode.position.y}
                  className="connection-line"
                />
              );
            })
          )}
        </svg>

        {/* Render nodes */}
        {mindMap.nodes.map((node) => (
          <div
            key={node.id}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
          >
            <MindMapNode
              node={node}
              isSelected={selectedNode === node.id}
              onSelect={setSelectedNode}
              onUpdate={handleUpdateNode}
            />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white border-t px-6 py-3 flex justify-between items-center animation even-print-page">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              const rect = canvasRef.current.getBoundingClientRect();
              const newNode = {
                id: `node-${Date.now()}`,
                content: "New Node",
                position: { x: rect.width / 2, y: rect.height / 2 },
                connections: [],
                color: "#ffffff",
              };
              updateMindMap({
                ...mindMap,
                nodes: [...mindMap.nodes, newNode],
              });
              setSelectedNode(newNode.id);
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
          >
            Add Node
          </button>
          {selectedNode && (
            <>
              <button
                onClick={() => handleDeleteNode(selectedNode)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Delete Node
              </button>
              <button
                onClick={handleConnectNodes}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Connect Randomly
              </button>
              {/* Connect to chosen node */}
              <select
                value={connectTarget}
                onChange={(e) => setConnectTarget(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">Connect to...</option>
                {mindMap.nodes
                  .filter((node) => node.id !== selectedNode)
                  .map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.content}
                    </option>
                  ))}
              </select>
              <button
                onClick={() => {
                  handleConnectToNode(connectTarget);
                  setConnectTarget("");
                }}
                disabled={!connectTarget}
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
              >
                Connect to Node
              </button>
              <button
                onClick={undo}
                disabled={history.length === 0}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
              >
                Undo
              </button>
              <button
                onClick={redo}
                disabled={future.length === 0}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded text-sm"
              >
                Redo
              </button>
            </>
          )}
        </div>
        <div className="text-sm text-gray-600">
          {mindMap.nodes.length} nodes |{" "}
          {selectedNode ? "Selected: " + selectedNode : "No node selected"}
        </div>
      </div>
    </div>
  );
};

export default MindMapEditor;
