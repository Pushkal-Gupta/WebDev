// Registry of static SVG tutorial diagrams. Kept separate from the .jsx
// component file so react-refresh's "only export components" rule stays
// satisfied — the markdown renderer reads the *names* from this file and the
// dispatcher component from `tutorialDiagrams.jsx`.

export const TUT_DIAGRAM_NAMES = new Set([
  'StdinCodeStdoutFlow',
  'IfElseBranchFlow',
  'ForLoopFlow',
  'WhileLoopFlow',
  'ClassToInstancesFlow',
  'SpaceBucketsDiagram',
  'RecursionCallTree',
  'SearchFamiliesDiagram',
  'BinarySearchSteps',
  'SlidingWindowPointers',
  'BacktrackingTree',
  'NQueensBoard',
  'SinglyLinkedListDiagram',
  'DoublyLinkedListDiagram',
  'CircularLinkedListDiagram',
  'CycleDetectionDiagram',
  'StackPushPopDiagram',
  'MinStackDiagram',
  'QueueDiagram',
  'DequeDiagram',
  'BinaryTreeLevelsDiagram',
  'BfsDfsTreeDiagram',
  'BstDiagram',
  'HeapDiagram',
  'TopoSortDiagram',
  'WeightedGraphDiagram',
  'DsuForestDiagram',
  'HuffmanTreeDiagram',
  'DpTableDiagram',
]);
