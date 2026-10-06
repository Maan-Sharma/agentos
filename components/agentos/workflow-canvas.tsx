"use client";

import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import { useMemo } from "react";

type WorkflowNodeData = { title: string; description: string; icon: string; tone: string };

function WorkflowStep({ data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <div className={`flow-step ${data.tone}`}>
      <Handle type="target" position={Position.Top} />
      <div className="flow-icon">{data.icon}</div>
      <div><strong>{data.title}</strong><span>{data.description}</span></div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodes: Node<WorkflowNodeData>[] = [
  { id: "trigger", type: "step", position: { x: 255, y: 15 }, data: { title: "New lead arrives", description: "A new person fills in your website form", icon: "↗", tone: "flow-blue" } },
  { id: "analyze", type: "step", position: { x: 255, y: 145 }, data: { title: "Analyze the lead", description: "The configured agent reviews company details", icon: "✳", tone: "flow-purple" } },
  { id: "condition", type: "step", position: { x: 255, y: 275 }, data: { title: "Is it a good fit?", description: "Checks company size and industry", icon: "◇", tone: "flow-amber" } },
  { id: "sales", type: "step", position: { x: 40, y: 435 }, data: { title: "Notify your sales team", description: "The configured agent shares a useful summary", icon: "◉", tone: "flow-green" } },
  { id: "email", type: "step", position: { x: 470, y: 435 }, data: { title: "Send a friendly email", description: "The configured agent drafts a personal reply", icon: "✉", tone: "flow-blue" } },
  { id: "crm", type: "step", position: { x: 40, y: 565 }, data: { title: "Update your CRM", description: "Adds the lead and conversation notes", icon: "▤", tone: "flow-green" } },
];
const edges: Edge[] = [
  { id: "e1", source: "trigger", target: "analyze", animated: true },
  { id: "e2", source: "analyze", target: "condition" },
  { id: "e3", source: "condition", target: "sales", label: "Good fit", labelStyle: { fill: "#16a34a", fontWeight: 600 }, labelBgStyle: { fill: "#fff" } },
  { id: "e4", source: "condition", target: "email", label: "Not a fit", labelStyle: { fill: "#64748b", fontWeight: 600 }, labelBgStyle: { fill: "#fff" } },
  { id: "e5", source: "sales", target: "crm" },
];

export function WorkflowCanvas() {
  const nodeTypes = useMemo(() => ({ step: WorkflowStep }), []);
  return (
    <div className="flow-canvas">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.2 }} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}>
        <Background color="#e9edf4" gap={22} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
