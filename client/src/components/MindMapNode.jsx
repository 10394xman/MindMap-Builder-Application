const MindMapNode = ({ node, isSelected, onSelect, onUpdate }) => {
  const handleContentChange = (e) => {
    onUpdate(node.id, { content: e.target.value });
  };

  const handleColorChange = (e) => {
    onUpdate(node.id, { color: e.target.value });
  };

  return (
    <div
      className={`node absolute bg-white rounded-lg shadow-md p-4 min-w-[120px] min-h-[60px] ${
        isSelected ? "selected ring-2 ring-primary-500" : ""
      }`}
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
        backgroundColor: node.color || "#ffffff",
        transform: "translate(-50%, -50%)",
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      {isSelected ? (
        <div className="space-y-2">
          <input
            type="text"
            value={node.content}
            onChange={handleContentChange}
            className="w-full p-1 border rounded text-sm"
            placeholder="Enter node content"
            onClick={(e) => e.stopPropagation()}
          />
          <input
            type="color"
            value={node.color || "#3B82F6"}
            onChange={handleColorChange}
            className="w-full h-6 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : (
        <div className="text-sm font-medium break-words">
          {node.content || "New Node"}
        </div>
      )}
    </div>
  );
};

export default MindMapNode;
