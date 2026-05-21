// SQL course bundles for the in-browser SQLite playground.
//
// Each course has: id, title, blurb, seedSql (CREATE TABLE + INSERT), and an
// ordered list of questions. Each question has a prompt, an optional starter
// SQL snippet, and an expected-result definition for auto-grading.
//
// Expected results are compared by columns + values. Column order matters;
// row order matters unless `orderInsensitive: true` is set.

// USDA agricultural production — schema mirrors the UC Davis SQL final-project
// dataset. Numbers are synthesized to be plausible (state-level annual production
// for 2020-2023) so queries return realistic shapes.
const USDA_SEED_SQL = `
CREATE TABLE cheese_production (
  Year INTEGER, Period TEXT, Geo_Level TEXT,
  State_ANSI INTEGER, Commodity_ID INTEGER,
  Domain TEXT, Value INTEGER
);
CREATE TABLE honey_production (
  Year INTEGER, Period TEXT, Geo_Level TEXT,
  State_ANSI INTEGER, Commodity_ID INTEGER,
  Domain TEXT, Value INTEGER
);
CREATE TABLE milk_production (
  Year INTEGER, Period TEXT, Geo_Level TEXT,
  State_ANSI INTEGER, Commodity_ID INTEGER,
  Domain TEXT, Value INTEGER
);
CREATE TABLE coffee_production (
  Year INTEGER, Period TEXT, Geo_Level TEXT,
  State_ANSI INTEGER, Commodity_ID INTEGER,
  Domain TEXT, Value INTEGER
);
CREATE TABLE egg_production (
  Year INTEGER, Period TEXT, Geo_Level TEXT,
  State_ANSI INTEGER, Commodity_ID INTEGER,
  Domain TEXT, Value INTEGER
);
CREATE TABLE yogurt_production (
  Year INTEGER, Period TEXT, Geo_Level TEXT,
  State_ANSI INTEGER, Commodity_ID INTEGER,
  Domain TEXT, Value INTEGER
);

CREATE TABLE state_lookup (
  State_ANSI INTEGER PRIMARY KEY,
  State TEXT NOT NULL
);

INSERT INTO state_lookup VALUES
  (6,'California'),(36,'New York'),(48,'Texas'),(55,'Wisconsin'),
  (12,'Florida'),(15,'Hawaii'),(42,'Pennsylvania'),(17,'Illinois'),
  (39,'Ohio'),(27,'Minnesota');

-- Cheese (million pounds, annual)
INSERT INTO cheese_production VALUES
  (2020,'YEAR','STATE',55,1001,'TOTAL',3380),
  (2020,'YEAR','STATE',6,1001,'TOTAL',2540),
  (2020,'YEAR','STATE',36,1001,'TOTAL',830),
  (2021,'YEAR','STATE',55,1001,'TOTAL',3490),
  (2021,'YEAR','STATE',6,1001,'TOTAL',2620),
  (2021,'YEAR','STATE',36,1001,'TOTAL',850),
  (2022,'YEAR','STATE',55,1001,'TOTAL',3580),
  (2022,'YEAR','STATE',6,1001,'TOTAL',2710),
  (2022,'YEAR','STATE',36,1001,'TOTAL',870),
  (2022,'YEAR','STATE',27,1001,'TOTAL',780),
  (2023,'YEAR','STATE',55,1001,'TOTAL',3640),
  (2023,'YEAR','STATE',6,1001,'TOTAL',2755),
  (2023,'YEAR','STATE',36,1001,'TOTAL',885),
  (2023,'YEAR','STATE',27,1001,'TOTAL',795);

-- Honey (1,000 pounds, annual)
INSERT INTO honey_production VALUES
  (2020,'YEAR','STATE',38,2001,'TOTAL',39450),
  (2020,'YEAR','STATE',6,2001,'TOTAL',12230),
  (2020,'YEAR','STATE',12,2001,'TOTAL',10560),
  (2021,'YEAR','STATE',38,2001,'TOTAL',40120),
  (2021,'YEAR','STATE',6,2001,'TOTAL',11890),
  (2021,'YEAR','STATE',12,2001,'TOTAL',10800),
  (2022,'YEAR','STATE',38,2001,'TOTAL',38900),
  (2022,'YEAR','STATE',6,2001,'TOTAL',12450),
  (2022,'YEAR','STATE',12,2001,'TOTAL',11020),
  (2023,'YEAR','STATE',38,2001,'TOTAL',41200),
  (2023,'YEAR','STATE',6,2001,'TOTAL',12680),
  (2023,'YEAR','STATE',12,2001,'TOTAL',11350);

-- Milk (million pounds, annual)
INSERT INTO milk_production VALUES
  (2020,'YEAR','STATE',6,3001,'TOTAL',41250),
  (2020,'YEAR','STATE',55,3001,'TOTAL',30630),
  (2020,'YEAR','STATE',36,3001,'TOTAL',15280),
  (2020,'YEAR','STATE',27,3001,'TOTAL',9890),
  (2020,'YEAR','STATE',42,3001,'TOTAL',10220),
  (2021,'YEAR','STATE',6,3001,'TOTAL',41560),
  (2021,'YEAR','STATE',55,3001,'TOTAL',31180),
  (2021,'YEAR','STATE',36,3001,'TOTAL',15510),
  (2021,'YEAR','STATE',27,3001,'TOTAL',10050),
  (2021,'YEAR','STATE',42,3001,'TOTAL',10310),
  (2022,'YEAR','STATE',6,3001,'TOTAL',41980),
  (2022,'YEAR','STATE',55,3001,'TOTAL',31750),
  (2022,'YEAR','STATE',36,3001,'TOTAL',15890),
  (2022,'YEAR','STATE',27,3001,'TOTAL',10180),
  (2022,'YEAR','STATE',42,3001,'TOTAL',10440),
  (2023,'YEAR','STATE',6,3001,'TOTAL',42230),
  (2023,'YEAR','STATE',55,3001,'TOTAL',32110),
  (2023,'YEAR','STATE',36,3001,'TOTAL',16020),
  (2023,'YEAR','STATE',27,3001,'TOTAL',10320),
  (2023,'YEAR','STATE',42,3001,'TOTAL',10580);

-- Coffee (1,000 pounds, annual; Hawaii + Puerto Rico style)
INSERT INTO coffee_production VALUES
  (2020,'YEAR','STATE',15,4001,'TOTAL',26500),
  (2021,'YEAR','STATE',15,4001,'TOTAL',27300),
  (2022,'YEAR','STATE',15,4001,'TOTAL',28100),
  (2023,'YEAR','STATE',15,4001,'TOTAL',29050);

-- Eggs (millions, annual)
INSERT INTO egg_production VALUES
  (2020,'YEAR','STATE',17,5001,'TOTAL',4310),
  (2020,'YEAR','STATE',39,5001,'TOTAL',8920),
  (2020,'YEAR','STATE',48,5001,'TOTAL',5510),
  (2020,'YEAR','STATE',6,5001,'TOTAL',4780),
  (2021,'YEAR','STATE',17,5001,'TOTAL',4360),
  (2021,'YEAR','STATE',39,5001,'TOTAL',9010),
  (2021,'YEAR','STATE',48,5001,'TOTAL',5640),
  (2021,'YEAR','STATE',6,5001,'TOTAL',4820),
  (2022,'YEAR','STATE',17,5001,'TOTAL',4280),
  (2022,'YEAR','STATE',39,5001,'TOTAL',9180),
  (2022,'YEAR','STATE',48,5001,'TOTAL',5780),
  (2022,'YEAR','STATE',6,5001,'TOTAL',4890),
  (2023,'YEAR','STATE',17,5001,'TOTAL',4395),
  (2023,'YEAR','STATE',39,5001,'TOTAL',9300),
  (2023,'YEAR','STATE',48,5001,'TOTAL',5910),
  (2023,'YEAR','STATE',6,5001,'TOTAL',4955);

-- Yogurt (million pounds, annual)
INSERT INTO yogurt_production VALUES
  (2020,'YEAR','STATE',36,6001,'TOTAL',780),
  (2020,'YEAR','STATE',6,6001,'TOTAL',520),
  (2020,'YEAR','STATE',55,6001,'TOTAL',310),
  (2021,'YEAR','STATE',36,6001,'TOTAL',795),
  (2021,'YEAR','STATE',6,6001,'TOTAL',535),
  (2021,'YEAR','STATE',55,6001,'TOTAL',318),
  (2022,'YEAR','STATE',36,6001,'TOTAL',810),
  (2022,'YEAR','STATE',6,6001,'TOTAL',548),
  (2022,'YEAR','STATE',55,6001,'TOTAL',325),
  (2023,'YEAR','STATE',36,6001,'TOTAL',830),
  (2023,'YEAR','STATE',6,6001,'TOTAL',562),
  (2023,'YEAR','STATE',55,6001,'TOTAL',332);
`;

// SQL Basics — a self-contained intro using a familiar employees/departments
// toy schema. Each question is graded against a known expected result so the
// course is actually checkable end-to-end.
const SQL_BASICS_SEED = `
CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  salary INTEGER NOT NULL, hire_year INTEGER NOT NULL
);
INSERT INTO departments (id, name) VALUES
  (1, 'Engineering'), (2, 'Design'), (3, 'Marketing'), (4, 'Operations');
INSERT INTO employees (id, name, department_id, salary, hire_year) VALUES
  (1, 'Asha Mehta',      1, 145000, 2021),
  (2, 'Ben Carter',      1, 132000, 2022),
  (3, 'Chen Wei',        2, 118000, 2020),
  (4, 'Divya Iyer',      2, 124000, 2023),
  (5, 'Eli Rodriguez',   3,  98000, 2019),
  (6, 'Farah Hassan',    1, 158000, 2018),
  (7, 'Gabriel Souza',   3, 102000, 2021),
  (8, 'Hannah Park',     4,  87000, 2023),
  (9, 'Ivan Petrov',     1, 141000, 2020),
  (10,'Jamila Karam',    4,  95000, 2022);
`;

export const SQL_COURSES = {
  'sql-basics': {
    id: 'sql-basics',
    title: 'SQL Basics',
    blurb: 'Learn SQL from scratch in 10 graded lessons. Familiar employees/departments schema. SELECT, WHERE, JOIN, GROUP BY, subqueries, CTEs.',
    tables: ['employees', 'departments'],
    seedSql: SQL_BASICS_SEED,
    questions: [
      {
        id: 'b1',
        title: 'SELECT everything',
        prompt: 'Return all columns of the employees table. Tip: `SELECT * FROM employees;`',
        starter: 'SELECT * FROM employees;\n',
        expected: {
          columns: ['id', 'name', 'department_id', 'salary', 'hire_year'],
          values: [
            [1, 'Asha Mehta',    1, 145000, 2021],
            [2, 'Ben Carter',    1, 132000, 2022],
            [3, 'Chen Wei',      2, 118000, 2020],
            [4, 'Divya Iyer',    2, 124000, 2023],
            [5, 'Eli Rodriguez', 3,  98000, 2019],
            [6, 'Farah Hassan',  1, 158000, 2018],
            [7, 'Gabriel Souza', 3, 102000, 2021],
            [8, 'Hannah Park',   4,  87000, 2023],
            [9, 'Ivan Petrov',   1, 141000, 2020],
            [10,'Jamila Karam',  4,  95000, 2022],
          ],
        },
      },
      {
        id: 'b2',
        title: 'Project specific columns',
        prompt: 'Return only the `name` and `salary` of every employee, in their natural row order.',
        starter: 'SELECT name, salary FROM employees;\n',
        expected: {
          columns: ['name', 'salary'],
          values: [
            ['Asha Mehta', 145000], ['Ben Carter', 132000], ['Chen Wei', 118000],
            ['Divya Iyer', 124000], ['Eli Rodriguez', 98000], ['Farah Hassan', 158000],
            ['Gabriel Souza', 102000], ['Hannah Park', 87000], ['Ivan Petrov', 141000],
            ['Jamila Karam', 95000],
          ],
        },
      },
      {
        id: 'b3',
        title: 'Filter with WHERE',
        prompt: 'Return the `name` and `salary` of employees in department_id = 1, alphabetically by name.',
        starter: 'SELECT name, salary\nFROM employees\nWHERE department_id = 1\nORDER BY name;\n',
        expected: {
          columns: ['name', 'salary'],
          values: [
            ['Asha Mehta', 145000], ['Ben Carter', 132000],
            ['Farah Hassan', 158000], ['Ivan Petrov', 141000],
          ],
        },
      },
      {
        id: 'b4',
        title: 'ORDER BY + LIMIT',
        prompt: 'Return the top 3 highest-paid employees as `name`, `salary`.',
        starter: 'SELECT name, salary\nFROM employees\nORDER BY salary DESC\nLIMIT 3;\n',
        expected: {
          columns: ['name', 'salary'],
          values: [
            ['Farah Hassan', 158000], ['Asha Mehta', 145000], ['Ivan Petrov', 141000],
          ],
        },
      },
      {
        id: 'b5',
        title: 'Aggregate with COUNT',
        prompt: 'How many employees are there? Return a single row with column `total`.',
        starter: 'SELECT COUNT(*) AS total FROM employees;\n',
        expected: { columns: ['total'], values: [[10]] },
      },
      {
        id: 'b6',
        title: 'GROUP BY with average',
        prompt: 'Return each department_id and the AVG salary, rounded to integer, as `avg_salary`. Order by department_id.',
        starter: 'SELECT department_id, ROUND(AVG(salary)) AS avg_salary\nFROM employees\nGROUP BY department_id\nORDER BY department_id;\n',
        expected: {
          columns: ['department_id', 'avg_salary'],
          values: [[1, 144000], [2, 121000], [3, 100000], [4, 91000]],
        },
      },
      {
        id: 'b7',
        title: 'JOIN two tables',
        prompt: 'List every employee with their department name. Columns: `name`, `department`. Order by `name`.',
        starter: 'SELECT e.name, d.name AS department\nFROM employees e\nJOIN departments d ON d.id = e.department_id\nORDER BY e.name;\n',
        expected: {
          columns: ['name', 'department'],
          values: [
            ['Asha Mehta', 'Engineering'], ['Ben Carter', 'Engineering'],
            ['Chen Wei', 'Design'], ['Divya Iyer', 'Design'],
            ['Eli Rodriguez', 'Marketing'], ['Farah Hassan', 'Engineering'],
            ['Gabriel Souza', 'Marketing'], ['Hannah Park', 'Operations'],
            ['Ivan Petrov', 'Engineering'], ['Jamila Karam', 'Operations'],
          ],
        },
      },
      {
        id: 'b8',
        title: 'GROUP BY with JOIN',
        prompt:
          'Return each department name and the headcount (`n`). Order by `n` descending; break ties alphabetically by name.',
        starter:
          'SELECT d.name, COUNT(*) AS n\nFROM employees e\nJOIN departments d ON d.id = e.department_id\nGROUP BY d.name\nORDER BY n DESC, d.name ASC;\n',
        expected: {
          columns: ['name', 'n'],
          values: [['Engineering', 4], ['Design', 2], ['Marketing', 2], ['Operations', 2]],
        },
      },
      {
        id: 'b9',
        title: 'Subquery: above-average earners',
        prompt:
          'Return the names of employees whose salary is strictly greater than the overall average salary, alphabetically.',
        starter:
          'SELECT name FROM employees\nWHERE salary > (SELECT AVG(salary) FROM employees)\nORDER BY name;\n',
        expected: {
          columns: ['name'],
          values: [['Asha Mehta'], ['Ben Carter'], ['Divya Iyer'], ['Farah Hassan'], ['Ivan Petrov']],
        },
      },
      {
        id: 'b10',
        title: 'CTE: department salary spread',
        prompt:
          'Using a CTE, return per department: name, min_salary, max_salary, spread (max - min). Order by spread DESC; break ties alphabetically.',
        starter:
          'WITH dept AS (\n  SELECT d.name AS dept, MIN(e.salary) AS min_salary, MAX(e.salary) AS max_salary\n  FROM employees e JOIN departments d ON d.id = e.department_id\n  GROUP BY d.name\n)\nSELECT dept AS name, min_salary, max_salary, max_salary - min_salary AS spread\nFROM dept\nORDER BY spread DESC, dept ASC;\n',
        expected: {
          columns: ['name', 'min_salary', 'max_salary', 'spread'],
          values: [
            ['Engineering', 132000, 158000, 26000],
            ['Operations', 87000, 95000, 8000],
            ['Design', 118000, 124000, 6000],
            ['Marketing', 98000, 102000, 4000],
          ],
        },
      },
    ],
  },
  usda: {
    id: 'usda',
    title: 'USDA Agricultural Production',
    blurb:
      'A real-world SQL practice course mirroring the UC Davis Coursera final project. Six commodity tables (cheese, honey, milk, coffee, eggs, yogurt) plus a state lookup. Each row is annual state-level production from the USDA NASS schema.',
    tables: [
      'cheese_production', 'honey_production', 'milk_production',
      'coffee_production', 'egg_production', 'yogurt_production',
      'state_lookup',
    ],
    seedSql: USDA_SEED_SQL,
    questions: [
      {
        id: 'q1',
        title: 'Total cheese production by year',
        prompt:
          'Return the total cheese production for every year, sorted by year ascending. Use columns `Year` and `total`.',
        starter:
          'SELECT Year, SUM(Value) AS total\nFROM cheese_production\nGROUP BY Year\nORDER BY Year;',
        expected: {
          columns: ['Year', 'total'],
          values: [
            [2020, 6750], [2021, 6960], [2022, 7940], [2023, 8075],
          ],
        },
      },
      {
        id: 'q2',
        title: 'Top 5 milk-producing states in 2022',
        prompt:
          'Join milk_production with state_lookup to return the top 5 states by milk Value for the year 2022, with columns `State` and `Value`, sorted descending.',
        starter:
          'SELECT s.State, m.Value\nFROM milk_production m\nJOIN state_lookup s ON s.State_ANSI = m.State_ANSI\nWHERE m.Year = 2022\nORDER BY m.Value DESC\nLIMIT 5;',
        expected: {
          columns: ['State', 'Value'],
          values: [
            ['California', 41980],
            ['Wisconsin', 31750],
            ['New York', 15890],
            ['Pennsylvania', 10440],
            ['Minnesota', 10180],
          ],
        },
      },
      {
        id: 'q3',
        title: 'Average honey production per year',
        prompt:
          'Return the average honey production per year (across reporting states), rounded to the nearest integer. Columns `Year` and `avg_value`, ordered by Year.',
        starter:
          'SELECT Year, ROUND(AVG(Value)) AS avg_value\nFROM honey_production\nGROUP BY Year\nORDER BY Year;',
        expected: {
          columns: ['Year', 'avg_value'],
          values: [
            [2020, 20747], [2021, 20937], [2022, 20790], [2023, 21743],
          ],
        },
      },
      {
        id: 'q4',
        title: 'States producing both cheese and milk in 2023',
        prompt:
          'Find the names of states that appear in both cheese_production and milk_production for the year 2023. Return one column `State`, sorted alphabetically.',
        starter:
          'SELECT DISTINCT s.State\nFROM state_lookup s\nWHERE s.State_ANSI IN (SELECT State_ANSI FROM cheese_production WHERE Year = 2023)\n  AND s.State_ANSI IN (SELECT State_ANSI FROM milk_production WHERE Year = 2023)\nORDER BY s.State;',
        expected: {
          columns: ['State'],
          values: [
            ['California'], ['Minnesota'], ['New York'], ['Wisconsin'],
          ],
        },
      },
      {
        id: 'q5',
        title: 'Years where coffee production exceeded its overall average',
        prompt:
          'Return the years where coffee Value is greater than the overall average of coffee Value across all rows. Single column `Year`, ordered ascending.',
        starter:
          'SELECT Year\nFROM coffee_production\nWHERE Value > (SELECT AVG(Value) FROM coffee_production)\nORDER BY Year;',
        expected: {
          columns: ['Year'],
          values: [
            [2022], [2023],
          ],
        },
      },
      {
        id: 'q6',
        title: 'Egg production rank within each year',
        prompt:
          'For each row in egg_production, return State_ANSI, Year, Value, and a rank (`rk`) of Value within that Year (highest = 1). Use a window function. Order by Year, then rk.',
        starter:
          'SELECT State_ANSI, Year, Value,\n       RANK() OVER (PARTITION BY Year ORDER BY Value DESC) AS rk\nFROM egg_production\nORDER BY Year, rk;',
        expected: {
          columns: ['State_ANSI', 'Year', 'Value', 'rk'],
          values: [
            [39, 2020, 8920, 1], [48, 2020, 5510, 2], [6, 2020, 4780, 3], [17, 2020, 4310, 4],
            [39, 2021, 9010, 1], [48, 2021, 5640, 2], [6, 2021, 4820, 3], [17, 2021, 4360, 4],
            [39, 2022, 9180, 1], [48, 2022, 5780, 2], [6, 2022, 4890, 3], [17, 2022, 4280, 4],
            [39, 2023, 9300, 1], [48, 2023, 5910, 2], [6, 2023, 4955, 3], [17, 2023, 4395, 4],
          ],
        },
      },
      {
        id: 'q7',
        title: 'CTE: total dairy output by state in 2023',
        prompt:
          'Using a CTE that unions cheese, milk, and yogurt rows for 2023, return the state name and combined `total_value`, sorted descending. Use columns `State` and `total_value`.',
        starter:
          "WITH dairy AS (\n  SELECT State_ANSI, Value FROM cheese_production WHERE Year = 2023\n  UNION ALL\n  SELECT State_ANSI, Value FROM milk_production WHERE Year = 2023\n  UNION ALL\n  SELECT State_ANSI, Value FROM yogurt_production WHERE Year = 2023\n)\nSELECT s.State, SUM(d.Value) AS total_value\nFROM dairy d\nJOIN state_lookup s ON s.State_ANSI = d.State_ANSI\nGROUP BY s.State\nORDER BY total_value DESC;",
        expected: {
          columns: ['State', 'total_value'],
          values: [
            ['California', 45547],
            ['Wisconsin', 36082],
            ['New York', 17735],
            ['Minnesota', 11115],
            ['Pennsylvania', 10580],
          ],
          orderInsensitive: false,
        },
      },
      {
        id: 'q8',
        title: 'Running total of milk production over years (California)',
        prompt:
          'For State_ANSI = 6 (California), return Year and a running total `cum_value` of milk Value across years (ascending). Use a window function.',
        starter:
          'SELECT Year,\n       SUM(Value) OVER (ORDER BY Year) AS cum_value\nFROM milk_production\nWHERE State_ANSI = 6\nORDER BY Year;',
        expected: {
          columns: ['Year', 'cum_value'],
          values: [
            [2020, 41250], [2021, 82810], [2022, 124790], [2023, 167020],
          ],
        },
      },
    ],
  },
};

// Compare actual result rows (from sql.js exec()) to expected rows.
// Returns { ok, reason }.
export function gradeResult(actual, expected) {
  if (!actual || actual.length === 0) {
    return { ok: false, reason: 'No rows returned (your query produced an empty result).' };
  }
  const r = actual[actual.length - 1]; // grade the LAST statement's result
  if (!Array.isArray(r?.columns) || !Array.isArray(r?.values)) {
    return { ok: false, reason: 'Could not interpret the result.' };
  }
  const colsActual = r.columns.map(c => String(c));
  const colsExpected = expected.columns.map(c => String(c));
  if (colsActual.length !== colsExpected.length || colsActual.some((c, i) => c !== colsExpected[i])) {
    return {
      ok: false,
      reason: `Column mismatch.\n  expected: ${colsExpected.join(', ')}\n  got:      ${colsActual.join(', ')}`,
    };
  }
  const normalize = (rows) => rows.map(row => row.map(cell => {
    if (cell == null) return null;
    if (typeof cell === 'number') return cell;
    if (!isNaN(Number(cell)) && /^-?\d+(\.\d+)?$/.test(String(cell).trim())) return Number(cell);
    return String(cell).trim();
  }));
  let a = normalize(r.values);
  let e = normalize(expected.values);
  if (expected.orderInsensitive) {
    const k = (row) => JSON.stringify(row);
    a = [...a].sort((x, y) => k(x).localeCompare(k(y)));
    e = [...e].sort((x, y) => k(x).localeCompare(k(y)));
  }
  if (a.length !== e.length) {
    return { ok: false, reason: `Row count mismatch: expected ${e.length}, got ${a.length}.` };
  }
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a[i].length; j++) {
      if (a[i][j] !== e[i][j]) {
        return {
          ok: false,
          reason: `Row ${i + 1}, column "${colsExpected[j]}" differs.\n  expected: ${JSON.stringify(e[i][j])}\n  got:      ${JSON.stringify(a[i][j])}`,
        };
      }
    }
  }
  return { ok: true, reason: null };
}
