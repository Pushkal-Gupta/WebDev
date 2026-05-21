const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./sql-wasm-browser-CBCbcW9B.js","./vendor-query-BRJAL8XB.js"])))=>i.map(i=>d[i]);
import{_ as j}from"./index-CHqPEOqx.js";import{r as T,j as e}from"./vendor-query-BRJAL8XB.js";import{F as U}from"./vendor-monaco-C7MgEFNj.js";import{P as B}from"./PlaygroundSwitcher-5CEcTELe.js";import{c as F,L as k}from"./vendor-react-CVsKg3BP.js";import{p as P,I as V,B as H,R as W,J as X,e as z,K as J,b as Q,X as K}from"./vendor-icons-7AH6yvdn.js";import"./vendor-supabase-ClVc2H6D.js";const $=""+new URL("sql-wasm-UFUCzYNW.wasm",import.meta.url).href,Z=`
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
`,ee=`
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
`,ae={"sql-basics":{id:"sql-basics",title:"SQL Basics",blurb:"Learn SQL from scratch in 10 graded lessons. Familiar employees/departments schema. SELECT, WHERE, JOIN, GROUP BY, subqueries, CTEs.",tables:["employees","departments"],seedSql:ee,questions:[{id:"b1",title:"SELECT everything",prompt:"Return all columns of the employees table. Tip: `SELECT * FROM employees;`",starter:`SELECT * FROM employees;
`,expected:{columns:["id","name","department_id","salary","hire_year"],values:[[1,"Asha Mehta",1,145e3,2021],[2,"Ben Carter",1,132e3,2022],[3,"Chen Wei",2,118e3,2020],[4,"Divya Iyer",2,124e3,2023],[5,"Eli Rodriguez",3,98e3,2019],[6,"Farah Hassan",1,158e3,2018],[7,"Gabriel Souza",3,102e3,2021],[8,"Hannah Park",4,87e3,2023],[9,"Ivan Petrov",1,141e3,2020],[10,"Jamila Karam",4,95e3,2022]]}},{id:"b2",title:"Project specific columns",prompt:"Return only the `name` and `salary` of every employee, in their natural row order.",starter:`SELECT name, salary FROM employees;
`,expected:{columns:["name","salary"],values:[["Asha Mehta",145e3],["Ben Carter",132e3],["Chen Wei",118e3],["Divya Iyer",124e3],["Eli Rodriguez",98e3],["Farah Hassan",158e3],["Gabriel Souza",102e3],["Hannah Park",87e3],["Ivan Petrov",141e3],["Jamila Karam",95e3]]}},{id:"b3",title:"Filter with WHERE",prompt:"Return the `name` and `salary` of employees in department_id = 1, alphabetically by name.",starter:`SELECT name, salary
FROM employees
WHERE department_id = 1
ORDER BY name;
`,expected:{columns:["name","salary"],values:[["Asha Mehta",145e3],["Ben Carter",132e3],["Farah Hassan",158e3],["Ivan Petrov",141e3]]}},{id:"b4",title:"ORDER BY + LIMIT",prompt:"Return the top 3 highest-paid employees as `name`, `salary`.",starter:`SELECT name, salary
FROM employees
ORDER BY salary DESC
LIMIT 3;
`,expected:{columns:["name","salary"],values:[["Farah Hassan",158e3],["Asha Mehta",145e3],["Ivan Petrov",141e3]]}},{id:"b5",title:"Aggregate with COUNT",prompt:"How many employees are there? Return a single row with column `total`.",starter:`SELECT COUNT(*) AS total FROM employees;
`,expected:{columns:["total"],values:[[10]]}},{id:"b6",title:"GROUP BY with average",prompt:"Return each department_id and the AVG salary, rounded to integer, as `avg_salary`. Order by department_id.",starter:`SELECT department_id, ROUND(AVG(salary)) AS avg_salary
FROM employees
GROUP BY department_id
ORDER BY department_id;
`,expected:{columns:["department_id","avg_salary"],values:[[1,144e3],[2,121e3],[3,1e5],[4,91e3]]}},{id:"b7",title:"JOIN two tables",prompt:"List every employee with their department name. Columns: `name`, `department`. Order by `name`.",starter:`SELECT e.name, d.name AS department
FROM employees e
JOIN departments d ON d.id = e.department_id
ORDER BY e.name;
`,expected:{columns:["name","department"],values:[["Asha Mehta","Engineering"],["Ben Carter","Engineering"],["Chen Wei","Design"],["Divya Iyer","Design"],["Eli Rodriguez","Marketing"],["Farah Hassan","Engineering"],["Gabriel Souza","Marketing"],["Hannah Park","Operations"],["Ivan Petrov","Engineering"],["Jamila Karam","Operations"]]}},{id:"b8",title:"GROUP BY with JOIN",prompt:"Return each department name and the headcount (`n`). Order by `n` descending; break ties alphabetically by name.",starter:`SELECT d.name, COUNT(*) AS n
FROM employees e
JOIN departments d ON d.id = e.department_id
GROUP BY d.name
ORDER BY n DESC, d.name ASC;
`,expected:{columns:["name","n"],values:[["Engineering",4],["Design",2],["Marketing",2],["Operations",2]]}},{id:"b9",title:"Subquery: above-average earners",prompt:"Return the names of employees whose salary is strictly greater than the overall average salary, alphabetically.",starter:`SELECT name FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees)
ORDER BY name;
`,expected:{columns:["name"],values:[["Asha Mehta"],["Ben Carter"],["Divya Iyer"],["Farah Hassan"],["Ivan Petrov"]]}},{id:"b10",title:"CTE: department salary spread",prompt:"Using a CTE, return per department: name, min_salary, max_salary, spread (max - min). Order by spread DESC; break ties alphabetically.",starter:`WITH dept AS (
  SELECT d.name AS dept, MIN(e.salary) AS min_salary, MAX(e.salary) AS max_salary
  FROM employees e JOIN departments d ON d.id = e.department_id
  GROUP BY d.name
)
SELECT dept AS name, min_salary, max_salary, max_salary - min_salary AS spread
FROM dept
ORDER BY spread DESC, dept ASC;
`,expected:{columns:["name","min_salary","max_salary","spread"],values:[["Engineering",132e3,158e3,26e3],["Operations",87e3,95e3,8e3],["Design",118e3,124e3,6e3],["Marketing",98e3,102e3,4e3]]}}]},usda:{id:"usda",title:"USDA Agricultural Production",blurb:"A real-world SQL practice course mirroring the UC Davis Coursera final project. Six commodity tables (cheese, honey, milk, coffee, eggs, yogurt) plus a state lookup. Each row is annual state-level production from the USDA NASS schema.",tables:["cheese_production","honey_production","milk_production","coffee_production","egg_production","yogurt_production","state_lookup"],seedSql:Z,questions:[{id:"q1",title:"Total cheese production by year",prompt:"Return the total cheese production for every year, sorted by year ascending. Use columns `Year` and `total`.",starter:`SELECT Year, SUM(Value) AS total
FROM cheese_production
GROUP BY Year
ORDER BY Year;`,expected:{columns:["Year","total"],values:[[2020,6750],[2021,6960],[2022,7940],[2023,8075]]}},{id:"q2",title:"Top 5 milk-producing states in 2022",prompt:"Join milk_production with state_lookup to return the top 5 states by milk Value for the year 2022, with columns `State` and `Value`, sorted descending.",starter:`SELECT s.State, m.Value
FROM milk_production m
JOIN state_lookup s ON s.State_ANSI = m.State_ANSI
WHERE m.Year = 2022
ORDER BY m.Value DESC
LIMIT 5;`,expected:{columns:["State","Value"],values:[["California",41980],["Wisconsin",31750],["New York",15890],["Pennsylvania",10440],["Minnesota",10180]]}},{id:"q3",title:"Average honey production per year",prompt:"Return the average honey production per year (across reporting states), rounded to the nearest integer. Columns `Year` and `avg_value`, ordered by Year.",starter:`SELECT Year, ROUND(AVG(Value)) AS avg_value
FROM honey_production
GROUP BY Year
ORDER BY Year;`,expected:{columns:["Year","avg_value"],values:[[2020,20747],[2021,20937],[2022,20790],[2023,21743]]}},{id:"q4",title:"States producing both cheese and milk in 2023",prompt:"Find the names of states that appear in both cheese_production and milk_production for the year 2023. Return one column `State`, sorted alphabetically.",starter:`SELECT DISTINCT s.State
FROM state_lookup s
WHERE s.State_ANSI IN (SELECT State_ANSI FROM cheese_production WHERE Year = 2023)
  AND s.State_ANSI IN (SELECT State_ANSI FROM milk_production WHERE Year = 2023)
ORDER BY s.State;`,expected:{columns:["State"],values:[["California"],["Minnesota"],["New York"],["Wisconsin"]]}},{id:"q5",title:"Years where coffee production exceeded its overall average",prompt:"Return the years where coffee Value is greater than the overall average of coffee Value across all rows. Single column `Year`, ordered ascending.",starter:`SELECT Year
FROM coffee_production
WHERE Value > (SELECT AVG(Value) FROM coffee_production)
ORDER BY Year;`,expected:{columns:["Year"],values:[[2022],[2023]]}},{id:"q6",title:"Egg production rank within each year",prompt:"For each row in egg_production, return State_ANSI, Year, Value, and a rank (`rk`) of Value within that Year (highest = 1). Use a window function. Order by Year, then rk.",starter:`SELECT State_ANSI, Year, Value,
       RANK() OVER (PARTITION BY Year ORDER BY Value DESC) AS rk
FROM egg_production
ORDER BY Year, rk;`,expected:{columns:["State_ANSI","Year","Value","rk"],values:[[39,2020,8920,1],[48,2020,5510,2],[6,2020,4780,3],[17,2020,4310,4],[39,2021,9010,1],[48,2021,5640,2],[6,2021,4820,3],[17,2021,4360,4],[39,2022,9180,1],[48,2022,5780,2],[6,2022,4890,3],[17,2022,4280,4],[39,2023,9300,1],[48,2023,5910,2],[6,2023,4955,3],[17,2023,4395,4]]}},{id:"q7",title:"CTE: total dairy output by state in 2023",prompt:"Using a CTE that unions cheese, milk, and yogurt rows for 2023, return the state name and combined `total_value`, sorted descending. Use columns `State` and `total_value`.",starter:`WITH dairy AS (
  SELECT State_ANSI, Value FROM cheese_production WHERE Year = 2023
  UNION ALL
  SELECT State_ANSI, Value FROM milk_production WHERE Year = 2023
  UNION ALL
  SELECT State_ANSI, Value FROM yogurt_production WHERE Year = 2023
)
SELECT s.State, SUM(d.Value) AS total_value
FROM dairy d
JOIN state_lookup s ON s.State_ANSI = d.State_ANSI
GROUP BY s.State
ORDER BY total_value DESC;`,expected:{columns:["State","total_value"],values:[["California",45547],["Wisconsin",36082],["New York",17735],["Minnesota",11115],["Pennsylvania",10580]],orderInsensitive:!1}},{id:"q8",title:"Running total of milk production over years (California)",prompt:"For State_ANSI = 6 (California), return Year and a running total `cum_value` of milk Value across years (ascending). Use a window function.",starter:`SELECT Year,
       SUM(Value) OVER (ORDER BY Year) AS cum_value
FROM milk_production
WHERE State_ANSI = 6
ORDER BY Year;`,expected:{columns:["Year","cum_value"],values:[[2020,41250],[2021,82810],[2022,124790],[2023,167020]]}}]}};function te(p,A){if(!p||p.length===0)return{ok:!1,reason:"No rows returned (your query produced an empty result)."};const t=p[p.length-1];if(!Array.isArray(t==null?void 0:t.columns)||!Array.isArray(t==null?void 0:t.values))return{ok:!1,reason:"Could not interpret the result."};const i=t.columns.map(r=>String(r)),c=A.columns.map(r=>String(r));if(i.length!==c.length||i.some((r,l)=>r!==c[l]))return{ok:!1,reason:`Column mismatch.
  expected: ${c.join(", ")}
  got:      ${i.join(", ")}`};const R=r=>r.map(l=>l.map(o=>o==null?null:typeof o=="number"?o:!isNaN(Number(o))&&/^-?\d+(\.\d+)?$/.test(String(o).trim())?Number(o):String(o).trim()));let s=R(t.values),E=R(A.values);if(A.orderInsensitive){const r=l=>JSON.stringify(l);s=[...s].sort((l,o)=>r(l).localeCompare(r(o))),E=[...E].sort((l,o)=>r(l).localeCompare(r(o)))}if(s.length!==E.length)return{ok:!1,reason:`Row count mismatch: expected ${E.length}, got ${s.length}.`};for(let r=0;r<s.length;r++)for(let l=0;l<s[r].length;l++)if(s[r][l]!==E[r][l])return{ok:!1,reason:`Row ${r+1}, column "${c[l]}" differs.
  expected: ${JSON.stringify(E[r][l])}
  got:      ${JSON.stringify(s[r][l])}`};return{ok:!0,reason:null}}const se=`
CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  salary INTEGER NOT NULL,
  hire_date TEXT NOT NULL
);

INSERT INTO departments (id, name) VALUES
  (1, 'Engineering'),
  (2, 'Design'),
  (3, 'Marketing'),
  (4, 'Operations');

INSERT INTO employees (id, name, department_id, salary, hire_date) VALUES
  (1, 'Asha Mehta',      1, 145000, '2021-03-15'),
  (2, 'Ben Carter',      1, 132000, '2022-07-01'),
  (3, 'Chen Wei',        2, 118000, '2020-11-22'),
  (4, 'Divya Iyer',      2, 124000, '2023-01-05'),
  (5, 'Eli Rodriguez',   3,  98000, '2019-08-30'),
  (6, 'Farah Hassan',    1, 158000, '2018-04-12'),
  (7, 'Gabriel Souza',   3, 102000, '2021-10-18'),
  (8, 'Hannah Park',     4,  87000, '2023-06-09'),
  (9, 'Ivan Petrov',     1, 141000, '2020-02-25'),
  (10,'Jamila Karam',    4,  95000, '2022-12-01');
`,ne=`-- Try editing this query, then hit Run (Cmd/Ctrl+Enter).
SELECT
  d.name AS department,
  COUNT(e.id)    AS headcount,
  ROUND(AVG(e.salary)) AS avg_salary,
  MAX(e.salary)  AS top_salary
FROM employees e
JOIN departments d ON d.id = e.department_id
GROUP BY d.name
ORDER BY avg_salary DESC;
`,re=[{label:"All employees",sql:"SELECT * FROM employees ORDER BY salary DESC;"},{label:"Department headcount",sql:"SELECT d.name, COUNT(*) AS n FROM employees e JOIN departments d ON d.id = e.department_id GROUP BY d.name;"},{label:"Window: rank by salary",sql:"SELECT name, salary, RANK() OVER (ORDER BY salary DESC) AS rank FROM employees;"},{label:"CTE: above-avg earners",sql:`WITH avg_s AS (SELECT AVG(salary) AS a FROM employees)
SELECT name, salary FROM employees, avg_s WHERE salary > a ORDER BY salary DESC;`},{label:"Schema",sql:"SELECT name, sql FROM sqlite_master WHERE type='table';"}];function me({theme:p}){var q;const{courseSlug:A}=F(),t=A?ae[A]:null,i=!!t,[c,R]=T.useState(0),s=(q=t==null?void 0:t.questions)==null?void 0:q[c],[E,r]=T.useState(null),l=t?t.seedSql:se,o=t?`pgcode_sql_course_${t.id}_${(s==null?void 0:s.id)||"q"}`:"pgcode_sql_pg",D=i?localStorage.getItem(o)||(s==null?void 0:s.starter)||"-- write your query here":localStorage.getItem(o)||ne,[h,O]=T.useState(D),I=s==null?void 0:s.starter;T.useEffect(()=>{if(!i||!s)return;const a=`pgcode_sql_course_${t.id}_${s.id}`;O(localStorage.getItem(a)||I||"-- write your query here"),r(null)},[i,t==null?void 0:t.id,s,I]);const[y,v]=T.useState(!1),[L,M]=T.useState(!1),[C,g]=T.useState(null),[f,N]=T.useState([]),[x,b]=T.useState(null),m=T.useRef(null);T.useEffect(()=>{let a=!1;return(async()=>{try{const n=(await j(async()=>{const{default:S}=await import("./sql-wasm-browser-CBCbcW9B.js").then(Y=>Y.s);return{default:S}},__vite__mapDeps([0,1]),import.meta.url)).default,u=await n({locateFile:()=>$});if(a)return;const d=new u.Database;d.run(l),m.current=d,M(!0)}catch(n){a||g((n==null?void 0:n.message)||String(n))}})(),()=>{if(a=!0,m.current){try{m.current.close()}catch{}m.current=null}}},[l]),T.useEffect(()=>{const a=setTimeout(()=>localStorage.setItem(o,h),250);return()=>clearTimeout(a)},[h,o]);const _=T.useCallback(()=>{if(!m.current)return;v(!0),g(null),N([]),r(null);const a=performance.now();try{const n=m.current.exec(h);N(n||[]),b(Math.round(performance.now()-a)),i&&(s!=null&&s.expected)&&r(te(n||[],s.expected))}catch(n){g((n==null?void 0:n.message)||String(n)),b(Math.round(performance.now()-a))}finally{v(!1)}},[h,i,s]);T.useEffect(()=>{const a=n=>{(n.metaKey||n.ctrlKey)&&n.key==="Enter"&&(n.preventDefault(),_())};return window.addEventListener("keydown",a),()=>window.removeEventListener("keydown",a)},[_]);const w=()=>{if(m.current)try{m.current.close()}catch{}(async()=>{const a=(await j(async()=>{const{default:d}=await import("./sql-wasm-browser-CBCbcW9B.js").then(S=>S.s);return{default:d}},__vite__mapDeps([0,1]),import.meta.url)).default,n=await a({locateFile:d=>`https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/${d}`}),u=new n.Database;u.run(l),m.current=u,g(null),N([]),r(null)})()},G=p==="light"||p==="solarized"?"light":"vs-dark";return e.jsxs("div",{className:"sql-pg",children:[e.jsxs("header",{className:"sql-pg-header",children:[e.jsxs("div",{className:"sql-pg-title-row",children:[i?e.jsxs(k,{to:"/playground/sql",className:"sql-pg-back",children:[e.jsx(P,{size:12})," Free playground"]}):e.jsx(B,{current:"sql"}),e.jsx("h1",{className:"sql-pg-title",children:t?t.title:"SQL Playground"}),e.jsxs("p",{className:"sql-pg-sub",children:[e.jsx(V,{size:11})," ",t?t.blurb:"SQLite (sql.js, WASM). Runs in your browser. Sample employees / departments database loaded."]}),!i&&e.jsxs("p",{className:"sql-pg-sub",style:{marginTop:"0.25rem"},children:[e.jsx(H,{size:11})," Try the ",e.jsx(k,{to:"/playground/sql/usda",style:{color:"var(--accent)"},children:"USDA agricultural production course"})," — 8 graded SQL questions on real-world tables."]})]}),e.jsxs("div",{className:"sql-pg-controls",children:[e.jsxs("button",{className:"sql-pg-btn sql-pg-btn-ghost",onClick:w,title:"Reset to seed schema + data",children:[e.jsx(W,{size:13})," Reset DB"]}),e.jsxs("button",{className:"sql-pg-btn sql-pg-btn-primary",onClick:_,disabled:!L||y,title:"Run query (Cmd/Ctrl+Enter)",children:[y?e.jsx(X,{size:13,className:"sql-pg-spin"}):e.jsx(z,{size:13}),y?"Running":L?"Run":"Loading SQLite…"]})]})]}),e.jsxs("div",{className:"sql-pg-body",children:[e.jsxs("aside",{className:"sql-pg-side",children:[e.jsxs("div",{className:"sql-pg-side-section",children:[e.jsxs("h3",{className:"sql-pg-side-title",children:[e.jsx(J,{size:11})," Tables"]}),i?e.jsx("ul",{className:"sql-pg-table-list",children:t.tables.map(a=>e.jsx("li",{children:e.jsx("code",{children:a})},a))}):e.jsxs("ul",{className:"sql-pg-table-list",children:[e.jsxs("li",{children:[e.jsx("code",{children:"departments"}),e.jsx("span",{className:"sql-pg-cols",children:"id, name"})]}),e.jsxs("li",{children:[e.jsx("code",{children:"employees"}),e.jsx("span",{className:"sql-pg-cols",children:"id, name, department_id, salary, hire_date"})]})]})]}),i?e.jsxs("div",{className:"sql-pg-side-section",children:[e.jsx("h3",{className:"sql-pg-side-title",children:"Questions"}),e.jsx("ol",{className:"sql-pg-q-list",children:t.questions.map((a,n)=>e.jsx("li",{children:e.jsxs("button",{className:`sql-pg-q-link ${n===c?"active":""}`,onClick:()=>R(n),children:[e.jsxs("span",{className:"sql-pg-q-n",children:["Q",n+1]}),e.jsx("span",{className:"sql-pg-q-t",children:a.title})]})},a.id))})]}):e.jsxs("div",{className:"sql-pg-side-section",children:[e.jsx("h3",{className:"sql-pg-side-title",children:"Sample queries"}),e.jsx("ul",{className:"sql-pg-sample-list",children:re.map(a=>e.jsx("li",{children:e.jsx("button",{onClick:()=>O(a.sql),children:a.label})},a.label))})]})]}),e.jsxs("div",{className:"sql-pg-main",children:[i&&s&&e.jsxs("div",{className:"sql-pg-prompt",children:[e.jsxs("span",{className:"sql-pg-prompt-label",children:["Q",c+1," of ",t.questions.length]}),e.jsx("h2",{className:"sql-pg-prompt-title",children:s.title}),e.jsx("p",{className:"sql-pg-prompt-text",children:s.prompt})]}),i&&E&&e.jsxs("div",{className:`sql-pg-grade ${E.ok?"ok":"bad"}`,children:[E.ok?e.jsx(Q,{size:14}):e.jsx(K,{size:14}),E.ok?"Correct — moves to next question on demand.":e.jsx("span",{style:{whiteSpace:"pre-wrap"},children:E.reason}),E.ok&&c+1<t.questions.length&&e.jsx("button",{className:"sql-pg-grade-next",onClick:()=>R(a=>a+1),children:"Next →"})]}),e.jsx("div",{className:"sql-pg-editor",children:e.jsx(U,{height:"100%",language:"sql",theme:G,value:h,onChange:a=>O(a??""),options:{fontSize:13,minimap:{enabled:!1},scrollBeyondLastLine:!1,automaticLayout:!0,padding:{top:10},tabSize:2,fontFamily:'"Space Mono", monospace'}})}),e.jsxs("div",{className:"sql-pg-output",children:[e.jsxs("div",{className:"sql-pg-output-head",children:[e.jsx("span",{className:"sql-pg-output-label",children:"Results"}),x!=null&&e.jsxs("span",{className:"sql-pg-output-meta",children:[x," ms"]})]}),e.jsx("div",{className:"sql-pg-output-body",children:C?e.jsx("pre",{className:"sql-pg-error",children:C}):f.length===0?e.jsx("p",{className:"sql-pg-empty",children:y?"Running query…":L?"Run a query to see results.":"Loading SQLite engine…"}):f.map((a,n)=>e.jsxs("div",{className:"sql-pg-result-block",children:[e.jsxs("table",{className:"sql-pg-table",children:[e.jsx("thead",{children:e.jsx("tr",{children:a.columns.map((u,d)=>e.jsx("th",{children:u},d))})}),e.jsx("tbody",{children:a.values.map((u,d)=>e.jsx("tr",{children:u.map((S,Y)=>e.jsx("td",{children:S===null?e.jsx("em",{className:"sql-pg-null",children:"null"}):String(S)},Y))},d))})]}),e.jsxs("span",{className:"sql-pg-row-count",children:[a.values.length," row",a.values.length===1?"":"s"]})]},n))})]})]})]})]})}export{me as default};
