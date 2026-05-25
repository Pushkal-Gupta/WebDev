// SQL databases for the in-browser SQLite surface.
//
// Two flavors share this file:
//   - kind: 'course'      — a graded lesson set (USDA, SQL Basics drills).
//                           Each entry has `questions[]` with prompt + expected.
//                           Starter SQL is a SCAFFOLD, never the full answer.
//   - kind: 'playground'  — a free-form sample database (chinook, sakila,
//                           world, ecommerce, employees_dept). No questions —
//                           just seed SQL the learner queries against.
//
// Grading compares columns + values. Column order matters; row order matters
// unless `orderInsensitive: true` is set.

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

// ─────────────────────────────────────────────────────────────────────────
// Playground sample databases — free-form, no questions, no grading.
// Schemas stay small enough to ship inside the JS bundle (5-8 tables,
// ~10-40 rows each) while still giving JOINs and GROUP BYs something
// realistic to chew on.
// ─────────────────────────────────────────────────────────────────────────

const CHINOOK_SEED = `
CREATE TABLE artists (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE albums (id INTEGER PRIMARY KEY, title TEXT NOT NULL, artist_id INTEGER REFERENCES artists(id), year INTEGER);
CREATE TABLE genres (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE tracks (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL,
  album_id INTEGER REFERENCES albums(id),
  genre_id INTEGER REFERENCES genres(id),
  milliseconds INTEGER, unit_price REAL
);
CREATE TABLE customers (
  id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT,
  country TEXT, email TEXT
);
CREATE TABLE invoices (
  id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(id),
  invoice_date TEXT, billing_country TEXT, total REAL
);
CREATE TABLE invoice_items (
  id INTEGER PRIMARY KEY, invoice_id INTEGER REFERENCES invoices(id),
  track_id INTEGER REFERENCES tracks(id), unit_price REAL, quantity INTEGER
);

INSERT INTO artists VALUES
  (1,'AC/DC'),(2,'Queen'),(3,'Miles Davis'),(4,'Radiohead'),
  (5,'Daft Punk'),(6,'Tame Impala'),(7,'Kendrick Lamar'),(8,'Bjork');

INSERT INTO genres VALUES
  (1,'Rock'),(2,'Jazz'),(3,'Electronic'),(4,'Hip Hop'),(5,'Alternative');

INSERT INTO albums VALUES
  (1,'Back in Black',1,1980),(2,'A Night at the Opera',2,1975),
  (3,'Kind of Blue',3,1959),(4,'OK Computer',4,1997),
  (5,'Discovery',5,2001),(6,'Currents',6,2015),
  (7,'DAMN.',7,2017),(8,'Homogenic',8,1997),
  (9,'In Rainbows',4,2007),(10,'Random Access Memories',5,2013);

INSERT INTO tracks VALUES
  (1,'Hells Bells',1,1,312000,0.99),(2,'Back in Black',1,1,255000,0.99),
  (3,'Bohemian Rhapsody',2,1,355000,1.29),(4,'Love of My Life',2,1,219000,0.99),
  (5,'So What',3,2,562000,1.29),(6,'Blue in Green',3,2,337000,0.99),
  (7,'Paranoid Android',4,5,383000,1.29),(8,'No Surprises',4,5,229000,0.99),
  (9,'One More Time',5,3,320000,0.99),(10,'Harder Better Faster Stronger',5,3,224000,0.99),
  (11,'The Less I Know the Better',6,5,216000,1.29),(12,'Let It Happen',6,5,468000,1.29),
  (13,'HUMBLE.',7,4,177000,1.29),(14,'DNA.',7,4,185000,1.29),
  (15,'Joga',8,5,303000,0.99),(16,'Bachelorette',8,5,335000,0.99),
  (17,'Nude',9,5,255000,1.29),(18,'Weird Fishes',9,5,318000,1.29),
  (19,'Get Lucky',10,3,369000,1.29),(20,'Instant Crush',10,3,338000,1.29);

INSERT INTO customers VALUES
  (1,'Luis','Goncalves','Brazil','luis@example.com'),
  (2,'Leonie','Kohler','Germany','leonie@example.com'),
  (3,'Francois','Tremblay','Canada','francois@example.com'),
  (4,'Bjorn','Hansen','Norway','bjorn@example.com'),
  (5,'Frantisek','Wichterlova','Czech Republic','frantisek@example.com'),
  (6,'Helena','Holy','Czech Republic','helena@example.com'),
  (7,'Astrid','Gruber','Austria','astrid@example.com'),
  (8,'Daan','Peeters','Belgium','daan@example.com'),
  (9,'Kara','Nielsen','Denmark','kara@example.com'),
  (10,'Eduardo','Martins','Brazil','eduardo@example.com');

INSERT INTO invoices VALUES
  (1,1,'2023-01-12','Brazil',5.94),(2,2,'2023-01-18','Germany',3.96),
  (3,3,'2023-02-03','Canada',8.91),(4,4,'2023-02-14','Norway',6.93),
  (5,5,'2023-03-05','Czech Republic',1.98),(6,6,'2023-03-11','Czech Republic',5.94),
  (7,7,'2023-04-02','Austria',8.91),(8,8,'2023-04-19','Belgium',13.86),
  (9,9,'2023-05-07','Denmark',3.96),(10,10,'2023-05-22','Brazil',7.92),
  (11,1,'2023-06-04','Brazil',2.97),(12,2,'2023-06-15','Germany',9.90),
  (13,3,'2023-07-01','Canada',4.95),(14,4,'2023-07-23','Norway',11.88);

INSERT INTO invoice_items VALUES
  (1,1,1,0.99,2),(2,1,3,1.29,1),(3,1,7,1.29,1),
  (4,2,2,0.99,4),(5,3,5,1.29,3),(6,3,9,0.99,2),
  (7,4,11,1.29,2),(8,4,15,0.99,3),(9,5,16,0.99,2),
  (10,6,17,1.29,2),(11,6,18,1.29,1),(12,7,13,1.29,4),
  (13,7,19,1.29,1),(14,8,20,1.29,5),(15,8,12,1.29,3),
  (16,9,6,0.99,3),(17,10,8,0.99,4),(18,10,4,0.99,2),
  (19,11,2,0.99,1),(20,11,1,0.99,1),(21,12,3,1.29,5),
  (22,12,4,0.99,1),(23,13,5,1.29,1),(24,13,6,0.99,2),
  (25,14,7,1.29,3),(26,14,10,0.99,4);
`;

const SAKILA_SEED = `
CREATE TABLE actors (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT);
CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE films (
  id INTEGER PRIMARY KEY, title TEXT NOT NULL,
  release_year INTEGER, rating TEXT,
  length INTEGER, rental_rate REAL,
  category_id INTEGER REFERENCES categories(id)
);
CREATE TABLE film_actors (
  film_id INTEGER REFERENCES films(id),
  actor_id INTEGER REFERENCES actors(id),
  PRIMARY KEY (film_id, actor_id)
);
CREATE TABLE customers (
  id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT,
  email TEXT, city TEXT, active INTEGER
);
CREATE TABLE rentals (
  id INTEGER PRIMARY KEY, rental_date TEXT,
  film_id INTEGER REFERENCES films(id),
  customer_id INTEGER REFERENCES customers(id),
  return_date TEXT
);
CREATE TABLE payments (
  id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(id),
  rental_id INTEGER REFERENCES rentals(id),
  amount REAL, payment_date TEXT
);

INSERT INTO categories VALUES
  (1,'Action'),(2,'Comedy'),(3,'Drama'),(4,'Sci-Fi'),
  (5,'Horror'),(6,'Documentary'),(7,'Animation');

INSERT INTO actors VALUES
  (1,'Penelope','Guiness'),(2,'Nick','Wahlberg'),(3,'Ed','Chase'),
  (4,'Jennifer','Davis'),(5,'Johnny','Lollobrigida'),(6,'Bette','Nicholson'),
  (7,'Grace','Mostel'),(8,'Matthew','Johansson'),(9,'Joe','Swank'),
  (10,'Christian','Gable'),(11,'Zero','Cage'),(12,'Karl','Berry');

INSERT INTO films VALUES
  (1,'Academy Dinosaur',2006,'PG',86,0.99,6),
  (2,'Ace Goldfinger',2006,'G',48,4.99,5),
  (3,'Adaptation Holes',2006,'NC-17',50,2.99,6),
  (4,'Affair Prejudice',2006,'G',117,2.99,3),
  (5,'African Egg',2006,'G',130,2.99,6),
  (6,'Agent Truman',2006,'PG',169,2.99,1),
  (7,'Airplane Sierra',2006,'PG-13',62,4.99,2),
  (8,'Airport Pollock',2006,'R',54,4.99,5),
  (9,'Alabama Devil',2006,'PG-13',114,2.99,5),
  (10,'Aladdin Calendar',2006,'NC-17',63,4.99,4),
  (11,'Alamo Videotape',2006,'G',126,0.99,6),
  (12,'Alaska Phantom',2006,'PG',136,0.99,4),
  (13,'Ali Forever',2006,'PG',150,4.99,7),
  (14,'Amadeus Holy',2006,'PG',113,0.99,1),
  (15,'Amelie Hellfighters',2006,'R',79,4.99,2);

INSERT INTO film_actors VALUES
  (1,1),(1,10),(2,2),(2,11),(3,3),(4,4),(5,5),(6,6),(6,1),
  (7,7),(8,8),(9,9),(10,10),(11,11),(12,12),
  (13,1),(13,4),(14,7),(15,9),(15,2);

INSERT INTO customers VALUES
  (1,'Mary','Smith','mary@example.com','Lethbridge',1),
  (2,'Patricia','Johnson','patricia@example.com','Woodridge',1),
  (3,'Linda','Williams','linda@example.com','Nantou',1),
  (4,'Barbara','Jones','barbara@example.com','Saint-Denis',1),
  (5,'Elizabeth','Brown','elizabeth@example.com','Tianjin',1),
  (6,'Jennifer','Davis','jennifer@example.com','Asuncion',0),
  (7,'Maria','Miller','maria@example.com','Sokoto',1),
  (8,'Susan','Wilson','susan@example.com','Tokat',1);

INSERT INTO rentals VALUES
  (1,'2023-05-24',1,1,'2023-05-26'),(2,'2023-05-24',3,2,'2023-05-28'),
  (3,'2023-05-25',5,3,'2023-05-29'),(4,'2023-05-25',7,4,'2023-05-30'),
  (5,'2023-05-26',2,1,'2023-05-29'),(6,'2023-05-26',4,5,'2023-05-31'),
  (7,'2023-05-27',6,6,'2023-06-01'),(8,'2023-05-27',8,7,'2023-06-02'),
  (9,'2023-05-28',9,8,'2023-06-03'),(10,'2023-05-28',10,2,'2023-06-04'),
  (11,'2023-05-29',11,3,'2023-06-05'),(12,'2023-05-29',12,4,'2023-06-06'),
  (13,'2023-05-30',13,5,'2023-06-07'),(14,'2023-05-30',14,6,'2023-06-08'),
  (15,'2023-05-31',15,7,'2023-06-09'),(16,'2023-05-31',1,8,'2023-06-10');

INSERT INTO payments VALUES
  (1,1,1,0.99,'2023-05-24'),(2,2,2,2.99,'2023-05-24'),
  (3,3,3,2.99,'2023-05-25'),(4,4,4,4.99,'2023-05-25'),
  (5,1,5,4.99,'2023-05-26'),(6,5,6,2.99,'2023-05-26'),
  (7,6,7,2.99,'2023-05-27'),(8,7,8,4.99,'2023-05-27'),
  (9,8,9,2.99,'2023-05-28'),(10,2,10,4.99,'2023-05-28'),
  (11,3,11,0.99,'2023-05-29'),(12,4,12,0.99,'2023-05-29'),
  (13,5,13,4.99,'2023-05-30'),(14,6,14,0.99,'2023-05-30'),
  (15,7,15,4.99,'2023-05-31'),(16,8,16,0.99,'2023-05-31');
`;

const WORLD_SEED = `
CREATE TABLE countries (
  code TEXT PRIMARY KEY, name TEXT NOT NULL,
  continent TEXT, region TEXT,
  population INTEGER, gdp_billion REAL,
  capital TEXT
);
CREATE TABLE cities (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL,
  country_code TEXT REFERENCES countries(code),
  population INTEGER
);
CREATE TABLE languages (
  country_code TEXT REFERENCES countries(code),
  language TEXT, is_official INTEGER, percentage REAL,
  PRIMARY KEY (country_code, language)
);

INSERT INTO countries VALUES
  ('USA','United States','North America','Northern America',331000000,25462,'Washington'),
  ('CHN','China','Asia','Eastern Asia',1411000000,17963,'Beijing'),
  ('IND','India','Asia','Southern Asia',1408000000,3385,'New Delhi'),
  ('JPN','Japan','Asia','Eastern Asia',125000000,4231,'Tokyo'),
  ('DEU','Germany','Europe','Western Europe',83200000,4072,'Berlin'),
  ('GBR','United Kingdom','Europe','Northern Europe',67500000,3070,'London'),
  ('FRA','France','Europe','Western Europe',67800000,2782,'Paris'),
  ('BRA','Brazil','South America','South America',215000000,1920,'Brasilia'),
  ('CAN','Canada','North America','Northern America',38900000,2139,'Ottawa'),
  ('AUS','Australia','Oceania','Australia and New Zealand',25700000,1675,'Canberra'),
  ('NGA','Nigeria','Africa','Western Africa',218000000,477,'Abuja'),
  ('KOR','South Korea','Asia','Eastern Asia',51700000,1665,'Seoul'),
  ('ESP','Spain','Europe','Southern Europe',47400000,1397,'Madrid'),
  ('ITA','Italy','Europe','Southern Europe',58800000,2010,'Rome'),
  ('MEX','Mexico','North America','Central America',128000000,1466,'Mexico City');

INSERT INTO cities VALUES
  (1,'New York','USA',8336000),(2,'Los Angeles','USA',3979000),(3,'Chicago','USA',2693000),
  (4,'Shanghai','CHN',24870000),(5,'Beijing','CHN',21540000),(6,'Shenzhen','CHN',17560000),
  (7,'Mumbai','IND',20410000),(8,'Delhi','IND',32070000),(9,'Bangalore','IND',13190000),
  (10,'Tokyo','JPN',13960000),(11,'Yokohama','JPN',3770000),
  (12,'Berlin','DEU',3645000),(13,'Hamburg','DEU',1841000),
  (14,'London','GBR',9540000),(15,'Manchester','GBR',553000),
  (16,'Paris','FRA',2161000),(17,'Marseille','FRA',870000),
  (18,'Sao Paulo','BRA',12330000),(19,'Rio de Janeiro','BRA',6748000),
  (20,'Toronto','CAN',2930000),(21,'Montreal','CAN',1780000),
  (22,'Sydney','AUS',5312000),(23,'Melbourne','AUS',5078000),
  (24,'Lagos','NGA',15390000),(25,'Seoul','KOR',9776000),
  (26,'Madrid','ESP',3266000),(27,'Rome','ITA',2873000),
  (28,'Mexico City','MEX',9209000);

INSERT INTO languages VALUES
  ('USA','English',1,78.2),('USA','Spanish',0,13.4),
  ('CHN','Mandarin',1,70.0),('CHN','Cantonese',0,5.0),
  ('IND','Hindi',1,43.6),('IND','English',1,10.6),('IND','Bengali',0,8.0),
  ('JPN','Japanese',1,99.0),
  ('DEU','German',1,95.0),('DEU','Turkish',0,1.8),
  ('GBR','English',1,98.0),('GBR','Welsh',1,0.9),
  ('FRA','French',1,88.0),('FRA','Arabic',0,3.0),
  ('BRA','Portuguese',1,98.0),
  ('CAN','English',1,56.0),('CAN','French',1,21.0),
  ('AUS','English',1,72.7),
  ('NGA','English',1,53.0),('NGA','Hausa',0,30.0),
  ('KOR','Korean',1,99.0),
  ('ESP','Spanish',1,82.0),('ESP','Catalan',0,9.0),
  ('ITA','Italian',1,93.0),
  ('MEX','Spanish',1,93.8);
`;

const ECOMMERCE_SEED = `
CREATE TABLE customers (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL,
  email TEXT, city TEXT, signup_date TEXT
);
CREATE TABLE products (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL,
  category TEXT, price REAL, stock INTEGER
);
CREATE TABLE orders (
  id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(id),
  order_date TEXT, status TEXT, total REAL
);
CREATE TABLE line_items (
  id INTEGER PRIMARY KEY, order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER, unit_price REAL
);
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY, product_id INTEGER REFERENCES products(id),
  customer_id INTEGER REFERENCES customers(id),
  rating INTEGER, review_date TEXT
);

INSERT INTO customers VALUES
  (1,'Asha Mehta','asha@example.com','Mumbai','2022-04-12'),
  (2,'Ben Carter','ben@example.com','Austin','2022-06-30'),
  (3,'Chen Wei','chen@example.com','Shanghai','2022-09-15'),
  (4,'Divya Iyer','divya@example.com','Bengaluru','2023-01-08'),
  (5,'Eli Rodriguez','eli@example.com','Madrid','2023-02-21'),
  (6,'Farah Hassan','farah@example.com','Cairo','2023-03-19'),
  (7,'Gabriel Souza','gabriel@example.com','Sao Paulo','2023-05-11'),
  (8,'Hannah Park','hannah@example.com','Seoul','2023-07-04'),
  (9,'Ivan Petrov','ivan@example.com','Moscow','2023-08-22'),
  (10,'Jamila Karam','jamila@example.com','Dubai','2023-10-30');

INSERT INTO products VALUES
  (1,'Mechanical Keyboard','Electronics',129.00,42),
  (2,'Wireless Mouse','Electronics',39.00,180),
  (3,'USB-C Hub','Electronics',55.00,95),
  (4,'27" Monitor','Electronics',289.00,28),
  (5,'Standing Desk','Furniture',429.00,15),
  (6,'Ergonomic Chair','Furniture',319.00,22),
  (7,'Desk Lamp','Furniture',49.00,140),
  (8,'Notebook (A5)','Stationery',12.00,500),
  (9,'Fountain Pen','Stationery',38.00,210),
  (10,'Coffee Beans (1kg)','Grocery',24.00,320),
  (11,'Tea Sampler','Grocery',18.00,260),
  (12,'Olive Oil (500ml)','Grocery',16.00,180);

INSERT INTO orders VALUES
  (1,1,'2023-09-01','shipped',168.00),
  (2,2,'2023-09-03','shipped',289.00),
  (3,3,'2023-09-05','pending',436.00),
  (4,4,'2023-09-08','shipped',55.00),
  (5,5,'2023-09-12','shipped',74.00),
  (6,6,'2023-09-15','cancelled',129.00),
  (7,7,'2023-09-18','shipped',367.00),
  (8,8,'2023-09-21','shipped',61.00),
  (9,9,'2023-09-25','shipped',42.00),
  (10,10,'2023-09-28','shipped',748.00),
  (11,1,'2023-10-02','shipped',24.00),
  (12,2,'2023-10-05','shipped',195.00),
  (13,3,'2023-10-09','pending',79.00),
  (14,4,'2023-10-14','shipped',128.00);

INSERT INTO line_items VALUES
  (1,1,1,1,129.00),(2,1,2,1,39.00),
  (3,2,4,1,289.00),
  (4,3,5,1,429.00),(5,3,7,0,0.00),
  (6,4,3,1,55.00),
  (7,5,8,2,12.00),(8,5,11,1,18.00),(9,5,12,2,16.00),
  (10,6,1,1,129.00),
  (11,7,6,1,319.00),(12,7,7,1,49.00),
  (13,8,10,2,24.00),(14,8,11,1,18.00),
  (15,9,2,1,39.00),(16,9,8,1,12.00),
  (17,10,5,1,429.00),(18,10,6,1,319.00),
  (19,11,10,1,24.00),
  (20,12,4,1,289.00),
  (21,13,9,2,38.00),(22,13,8,1,12.00),
  (23,14,1,1,129.00);

INSERT INTO reviews VALUES
  (1,1,1,5,'2023-09-10'),(2,1,2,4,'2023-09-12'),
  (3,4,2,5,'2023-09-15'),(4,5,3,4,'2023-09-20'),
  (5,7,5,5,'2023-09-22'),(6,3,4,3,'2023-09-25'),
  (7,1,6,2,'2023-09-28'),(8,10,1,5,'2023-10-05'),
  (9,11,5,4,'2023-10-08'),(10,6,7,5,'2023-10-12'),
  (11,2,9,4,'2023-10-15'),(12,8,5,5,'2023-10-18'),
  (13,9,3,4,'2023-10-22'),(14,12,5,5,'2023-10-25');
`;

const EMP_DEPT_PG_SEED = `
CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  salary INTEGER NOT NULL, hire_date TEXT NOT NULL
);
INSERT INTO departments (id, name) VALUES
  (1,'Engineering'),(2,'Design'),(3,'Marketing'),(4,'Operations');
INSERT INTO employees VALUES
  (1,'Asha Mehta',1,145000,'2021-03-15'),
  (2,'Ben Carter',1,132000,'2022-07-01'),
  (3,'Chen Wei',2,118000,'2020-11-22'),
  (4,'Divya Iyer',2,124000,'2023-01-05'),
  (5,'Eli Rodriguez',3,98000,'2019-08-30'),
  (6,'Farah Hassan',1,158000,'2018-04-12'),
  (7,'Gabriel Souza',3,102000,'2021-10-18'),
  (8,'Hannah Park',4,87000,'2023-06-09'),
  (9,'Ivan Petrov',1,141000,'2020-02-25'),
  (10,'Jamila Karam',4,95000,'2022-12-01');
`;

export const SQL_COURSES = {
  'sql-basics': {
    id: 'sql-basics',
    kind: 'course',
    title: 'SQL Basics',
    blurb: 'Learn SQL from scratch in 10 graded lessons. Familiar employees/departments schema. SELECT, WHERE, JOIN, GROUP BY, subqueries, CTEs.',
    tables: ['employees', 'departments'],
    seedSql: SQL_BASICS_SEED,
    questions: [
      {
        id: 'b1',
        title: 'SELECT everything',
        prompt: 'Return all columns of the employees table. Tip: `SELECT * FROM employees;`',
        starter: '-- Return every column and every row of `employees`\nSELECT \nFROM employees\n;\n',
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
        starter: '-- Project only `name` and `salary` from `employees`\nSELECT \nFROM employees\n;\n',
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
        starter: '-- Filter to department_id = 1 and sort by name\nSELECT \nFROM employees\nWHERE \nORDER BY \n;\n',
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
        starter: '-- Sort by salary descending, take the first three rows\nSELECT \nFROM employees\nORDER BY \nLIMIT \n;\n',
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
        starter: '-- Count rows in `employees`; alias the result as `total`\nSELECT \nFROM employees\n;\n',
        expected: { columns: ['total'], values: [[10]] },
      },
      {
        id: 'b6',
        title: 'GROUP BY with average',
        prompt: 'Return each department_id and the AVG salary, rounded to integer, as `avg_salary`. Order by department_id.',
        starter: '-- One row per department_id: avg salary rounded to integer\nSELECT \nFROM employees\nGROUP BY \nORDER BY \n;\n',
        expected: {
          columns: ['department_id', 'avg_salary'],
          values: [[1, 144000], [2, 121000], [3, 100000], [4, 91000]],
        },
      },
      {
        id: 'b7',
        title: 'JOIN two tables',
        prompt: 'List every employee with their department name. Columns: `name`, `department`. Order by `name`.',
        starter: '-- Join `employees` to `departments` on department_id\nSELECT \nFROM employees e\nJOIN departments d ON \nORDER BY \n;\n',
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
          '-- Join + group by department name; tie-break alphabetically\nSELECT \nFROM employees e\nJOIN departments d ON \nGROUP BY \nORDER BY \n;\n',
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
          '-- Use a subquery to compute the average salary inside WHERE\nSELECT \nFROM employees\nWHERE salary > (\n  -- subquery: overall AVG(salary)\n)\nORDER BY \n;\n',
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
          '-- Build a CTE that aggregates min/max salary per department\nWITH dept AS (\n  -- per department: name, min_salary, max_salary\n)\nSELECT \nFROM dept\nORDER BY \n;\n',
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
    kind: 'course',
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
          '-- Aggregate cheese Value per Year\nSELECT \nFROM cheese_production\nGROUP BY \nORDER BY \n;',
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
          '-- Join milk_production -> state_lookup, filter Year, sort, limit\nSELECT \nFROM milk_production m\nJOIN state_lookup s ON \nWHERE \nORDER BY \nLIMIT \n;',
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
          '-- Per Year, round AVG(Value) to nearest integer\nSELECT \nFROM honey_production\nGROUP BY \nORDER BY \n;',
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
          '-- Find State_ANSI values present in BOTH tables for 2023\nSELECT \nFROM state_lookup s\nWHERE \nORDER BY \n;',
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
          '-- Subquery: overall AVG(Value) from coffee_production\nSELECT \nFROM coffee_production\nWHERE Value > (\n  -- subquery here\n)\nORDER BY \n;',
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
          '-- Window function: RANK() partitioned by Year, ordered by Value DESC\nSELECT State_ANSI, Year, Value,\n       -- RANK() OVER (PARTITION BY ... ORDER BY ...) AS rk\nFROM egg_production\nORDER BY \n;',
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
          '-- CTE that UNION ALLs cheese + milk + yogurt rows for 2023\nWITH dairy AS (\n  -- SELECT State_ANSI, Value FROM ... WHERE Year = 2023\n  -- UNION ALL ...\n)\nSELECT \nFROM dairy d\nJOIN state_lookup s ON \nGROUP BY \nORDER BY \n;',
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
          '-- Window function: running SUM(Value) ordered by Year, for State_ANSI = 6\nSELECT Year,\n       -- SUM(Value) OVER (ORDER BY ...) AS cum_value\nFROM milk_production\nWHERE \nORDER BY \n;',
        expected: {
          columns: ['Year', 'cum_value'],
          values: [
            [2020, 41250], [2021, 82810], [2022, 124790], [2023, 167020],
          ],
        },
      },
    ],
  },

  // ── Playground sample databases (free-form, no questions) ────────────
  'employees-dept': {
    id: 'employees-dept',
    kind: 'playground',
    title: 'Employees & Departments',
    blurb: 'Classic toy schema: 10 employees across 4 departments. The simplest place to practice SELECT, WHERE, JOIN, GROUP BY.',
    tables: ['employees', 'departments'],
    seedSql: EMP_DEPT_PG_SEED,
  },
  chinook: {
    id: 'chinook',
    kind: 'playground',
    title: 'Chinook (Music Store)',
    blurb: 'Artists, albums, tracks, customers, invoices. The well-known SQLite sample database for trying JOINs across a real-shaped schema.',
    tables: ['artists', 'albums', 'genres', 'tracks', 'customers', 'invoices', 'invoice_items'],
    seedSql: CHINOOK_SEED,
  },
  sakila: {
    id: 'sakila',
    kind: 'playground',
    title: 'Sakila (Movie Rental)',
    blurb: 'A DVD rental store: actors, films, rentals, customers, payments. MySQL’s canonical sample database, ported to SQLite.',
    tables: ['actors', 'categories', 'films', 'film_actors', 'customers', 'rentals', 'payments'],
    seedSql: SAKILA_SEED,
  },
  world: {
    id: 'world',
    kind: 'playground',
    title: 'World (Countries & Cities)',
    blurb: 'Countries, cities, and spoken languages — 15 countries with GDP and population, 28 major cities, and language usage rows for HAVING and window-function drills.',
    tables: ['countries', 'cities', 'languages'],
    seedSql: WORLD_SEED,
  },
  ecommerce: {
    id: 'ecommerce',
    kind: 'playground',
    title: 'E-commerce',
    blurb: 'Customers, products, orders, line items, reviews. Realistic order shape for aggregation, top-N per group, and review-rating queries.',
    tables: ['customers', 'products', 'orders', 'line_items', 'reviews'],
    seedSql: ECOMMERCE_SEED,
  },
};

// Helpers for the playground picker.
export function listPlaygroundDbs() {
  return Object.values(SQL_COURSES).filter(c => c.kind === 'playground');
}
export function listCourseDbs() {
  return Object.values(SQL_COURSES).filter(c => c.kind === 'course');
}

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
