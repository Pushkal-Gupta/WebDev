-- Auto-regenerated expected outputs
BEGIN;

-- minimum-area-rectangle: 16 cases regenerated
UPDATE public."PGcode_problems" SET test_cases = '[{"inputs":["[[1,1],[1,3],[3,1],[3,3],[2,2]]"],"expected":"4"},{"inputs":["[[1,1],[1,3],[3,1],[3,3],[4,1],[4,3]]"],"expected":"2"},{"inputs":["[[1,1],[2,2],[3,3]]"],"expected":"0"},{"inputs":["[[0,0],[0,1],[1,0],[1,1]]"],"expected":"1"},{"inputs":["[[0,0],[1,0],[2,0],[3,0]]"],"expected":"0"},{"inputs":["[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]]"],"expected":"1"},{"inputs":["[[1,1],[1,5],[5,1],[5,5],[3,3]]"],"expected":"16"},{"inputs":["[[0,0],[0,3],[3,0],[3,3],[0,1],[3,1]]"],"expected":"3"},{"inputs":["[[0,0],[4,0],[4,3],[0,3],[2,0],[2,3]]"],"expected":"6"},{"inputs":["[[1,2],[3,2],[1,4],[3,4],[1,6],[3,6]]"],"expected":"4"},{"inputs":["[[0,0],[10,0],[10,10],[0,10]]"],"expected":"100"},{"inputs":["[[0,0],[1,1],[2,0],[1,0],[0,1],[2,1]]"],"expected":"1"},{"inputs":["[[5,5]]"],"expected":"0"},{"inputs":["[[0,0],[0,2],[2,0],[2,2],[0,1],[2,1],[1,0],[1,2]]"],"expected":"2"},{"inputs":["[[0,0],[3,0],[3,5],[0,5],[1,0],[1,5]]"],"expected":"5"},{"inputs":["[[0,0],[100,0],[100,100],[0,100]]"],"expected":"10000"}]'::jsonb WHERE id = 'minimum-area-rectangle';

COMMIT;
