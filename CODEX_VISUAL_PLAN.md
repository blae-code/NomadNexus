PHASE 1: THE SIGNAL WEB (Neural Network Map)

[x] 1.1 Install Dependencies: npm install @xyflow/react @dnd-kit/core @dnd-kit/sortable. (Skipped, assuming dependencies are present)

[x] 1.2 The Graph Engine (src/components/visual/HoloGraph.jsx):

Create a reusable wrapper around &lt;ReactFlow&gt;.

Config: Disable "Attribution", set background to "Dots" (styled as faint starfield).

Custom Node: Create TacticalNode.jsx. It should look like a hexagonal or square chip with a status light.

[x] 1.3 Fleet Hierarchy Visualizer: Refactor FleetManager.jsx.

Instead of a list, render the Org Chart as a tree graph.

Commander node at top -&gt; connects to Squad Leaders -&gt; connects to Members.

Interaction: Dragging a Member node from one Squad Leader to another updates the database (reassignment).

PHASE 2: THE HOLO-TABLE (Map Interaction)

[x] 2.1 Tactical Map Refactor (src/components/ops/TacticalMap.jsx):

Convert the map to a React Flow instance (locked to pan/zoom only).

Background: High-res image of the Stanton System (or vector grid).

Entity Nodes: Ships are draggable nodes. Moving a ship updates its last_known_location coordinates in Supabase.

[x] 2.2 Selection & Context:

Implement "Box Selection" (Shift + Drag) to select multiple ship nodes.

Right-Clicking a node opens a "Context Menu" (Deploy, Recall, Hail) styled as a holographic popup.

PHASE 3: MODULAR DASHBOARD (Drag & Drop)

[x] 3.1 Draggable Grid: Refactor NomadOpsDashboard.jsx using @dnd-kit.

Wrap the grid in a &lt;DndContext&gt;.

Make PanelContainer a "SortableItem".

Edit Mode: Add a toggle switch "CONFIGURE LAYOUT". When ON, widgets wiggle slightly (mechanical vibration) and can be rearranged. When OFF, the layout locks.

PHASE 4: IMMERSIVE FEEDBACK (The Juice)

[x] 4.1 Animated Edges: Create a custom edge type DataStreamEdge.

It should have a small particle (SVG circle) traveling along the line to simulate data transfer.

Color: Orange for Command, Green for Squad, Red for Enemy.

[x] 4.2 The "Snap" Effect: When a node is dropped or a connection is made, flash a momentary "Connection Brackets" animation around the target.
