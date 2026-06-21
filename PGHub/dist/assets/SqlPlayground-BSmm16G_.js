const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./sql-wasm-browser-zRtwOtG3.js","./vendor-query-FJdQ8OJm.js"])))=>i.map(i=>d[i]);
import{_ as V}from"./index-HDhqHOdn.js";import{r as n,j as e}from"./vendor-query-FJdQ8OJm.js";import{F as Ge}from"./vendor-monaco-BrjDLSos.js";import{P as Me}from"./PlaygroundSwitcher-BXMMWBkM.js";import{b as qe,u as Fe,L as f}from"./vendor-react-firagBrd.js";import{y as de,a2 as q,a3 as Te,w as ue,L as Re,a4 as me,Y as we,q as pe,a5 as Pe,s as Se,g as xe,i as je,a6 as Xe,c as He,X as Ve}from"./vendor-icons-0t9PreTK.js";import"./vendor-supabase-ClVc2H6D.js";const Ae=""+new URL("sql-wasm-UFUCzYNW.wasm",import.meta.url).href,Je=`
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
`,Ke=`
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
`,ze=`
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
`,We=`
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
`,Qe=`
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
`,$e=`
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
`,Ze=`
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
`,ea=`
CREATE TABLE authors (id INTEGER PRIMARY KEY, name TEXT NOT NULL, country TEXT, birth_year INTEGER);
CREATE TABLE books (
  id INTEGER PRIMARY KEY, title TEXT NOT NULL,
  author_id INTEGER REFERENCES authors(id),
  genre TEXT, published_year INTEGER, copies INTEGER
);
CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT NOT NULL, joined TEXT, city TEXT);
CREATE TABLE loans (
  id INTEGER PRIMARY KEY, book_id INTEGER REFERENCES books(id),
  member_id INTEGER REFERENCES members(id),
  loaned TEXT, returned TEXT
);

INSERT INTO authors VALUES
  (1,'Ursula K. Le Guin','USA',1929),(2,'Gabriel Garcia Marquez','Colombia',1927),
  (3,'Chinua Achebe','Nigeria',1930),(4,'Haruki Murakami','Japan',1949),
  (5,'Toni Morrison','USA',1931),(6,'Italo Calvino','Italy',1923),
  (7,'Octavia Butler','USA',1947),(8,'Jorge Luis Borges','Argentina',1899);

INSERT INTO books VALUES
  (1,'The Left Hand of Darkness',1,'Sci-Fi',1969,3),
  (2,'A Wizard of Earthsea',1,'Fantasy',1968,4),
  (3,'One Hundred Years of Solitude',2,'Magical Realism',1967,2),
  (4,'Love in the Time of Cholera',2,'Romance',1985,2),
  (5,'Things Fall Apart',3,'Literary',1958,5),
  (6,'Kafka on the Shore',4,'Magical Realism',2002,3),
  (7,'Norwegian Wood',4,'Literary',1987,2),
  (8,'Beloved',5,'Literary',1987,3),
  (9,'Invisible Cities',6,'Literary',1972,1),
  (10,'Kindred',7,'Sci-Fi',1979,4),
  (11,'Parable of the Sower',7,'Sci-Fi',1993,3),
  (12,'Ficciones',8,'Literary',1944,2);

INSERT INTO members VALUES
  (1,'Asha Mehta','2022-01-10','Mumbai'),(2,'Ben Carter','2022-03-22','Austin'),
  (3,'Chen Wei','2022-05-30','Shanghai'),(4,'Divya Iyer','2022-08-14','Bengaluru'),
  (5,'Eli Rodriguez','2023-02-01','Madrid'),(6,'Farah Hassan','2023-04-18','Cairo'),
  (7,'Gabriel Souza','2023-07-09','Sao Paulo'),(8,'Hannah Park','2023-09-25','Seoul');

INSERT INTO loans VALUES
  (1,3,1,'2023-09-01','2023-09-20'),(2,5,2,'2023-09-03','2023-09-18'),
  (3,6,3,'2023-09-05',NULL),(4,1,4,'2023-09-08','2023-09-28'),
  (5,8,5,'2023-09-12','2023-09-30'),(6,10,1,'2023-09-15',NULL),
  (7,3,6,'2023-09-18','2023-10-02'),(8,11,7,'2023-09-22',NULL),
  (9,5,8,'2023-09-25','2023-10-10'),(10,2,2,'2023-10-01',NULL),
  (11,6,4,'2023-10-04','2023-10-19'),(12,12,5,'2023-10-08',NULL),
  (13,8,3,'2023-10-11','2023-10-25'),(14,1,7,'2023-10-15',NULL),
  (15,5,1,'2023-10-18',NULL),(16,10,6,'2023-10-22','2023-11-05');
`,aa=`
CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT NOT NULL, major TEXT, enrolled_year INTEGER);
CREATE TABLE instructors (id INTEGER PRIMARY KEY, name TEXT NOT NULL, department TEXT);
CREATE TABLE courses (
  id INTEGER PRIMARY KEY, title TEXT NOT NULL,
  department TEXT, credits INTEGER,
  instructor_id INTEGER REFERENCES instructors(id)
);
CREATE TABLE enrollments (
  id INTEGER PRIMARY KEY, student_id INTEGER REFERENCES students(id),
  course_id INTEGER REFERENCES courses(id),
  term TEXT, grade REAL
);

INSERT INTO instructors VALUES
  (1,'Dr. Lin Chao','Computer Science'),(2,'Dr. Maya Okonkwo','Mathematics'),
  (3,'Dr. Tomas Vidal','Physics'),(4,'Dr. Sara Holm','Computer Science'),
  (5,'Dr. Raj Patel','Economics');

INSERT INTO courses VALUES
  (1,'Intro to Programming','Computer Science',4,1),
  (2,'Data Structures','Computer Science',4,4),
  (3,'Linear Algebra','Mathematics',3,2),
  (4,'Calculus II','Mathematics',4,2),
  (5,'Classical Mechanics','Physics',4,3),
  (6,'Quantum Physics','Physics',3,3),
  (7,'Microeconomics','Economics',3,5),
  (8,'Databases','Computer Science',4,4);

INSERT INTO students VALUES
  (1,'Asha Mehta','Computer Science',2021),(2,'Ben Carter','Mathematics',2021),
  (3,'Chen Wei','Physics',2022),(4,'Divya Iyer','Computer Science',2022),
  (5,'Eli Rodriguez','Economics',2020),(6,'Farah Hassan','Mathematics',2023),
  (7,'Gabriel Souza','Computer Science',2023),(8,'Hannah Park','Physics',2021),
  (9,'Ivan Petrov','Economics',2022),(10,'Jamila Karam','Computer Science',2020);

INSERT INTO enrollments VALUES
  (1,1,1,'Fall 2022',3.7),(2,1,2,'Spring 2023',4.0),(3,1,8,'Fall 2023',3.3),
  (4,2,3,'Fall 2022',3.9),(5,2,4,'Spring 2023',3.5),
  (6,3,5,'Fall 2022',2.8),(7,3,6,'Spring 2023',3.1),
  (8,4,1,'Fall 2022',3.4),(9,4,2,'Spring 2023',3.8),(10,4,8,'Fall 2023',4.0),
  (11,5,7,'Fall 2022',3.0),(12,5,3,'Spring 2023',2.5),
  (13,6,3,'Fall 2023',3.6),(14,6,4,'Fall 2023',3.2),
  (15,7,1,'Fall 2023',3.9),(16,7,2,'Fall 2023',3.7),
  (17,8,5,'Fall 2022',3.3),(18,8,6,'Spring 2023',3.5),
  (19,9,7,'Fall 2022',2.9),(20,9,1,'Spring 2023',3.1),
  (21,10,2,'Fall 2022',4.0),(22,10,8,'Spring 2023',3.8),(23,10,1,'Fall 2021',3.5);
`,sa=`
CREATE TABLE users (id INTEGER PRIMARY KEY, handle TEXT NOT NULL, name TEXT, joined TEXT, city TEXT);
CREATE TABLE follows (
  follower_id INTEGER REFERENCES users(id),
  followee_id INTEGER REFERENCES users(id),
  followed_at TEXT,
  PRIMARY KEY (follower_id, followee_id)
);
CREATE TABLE posts (
  id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id),
  body TEXT, created TEXT
);
CREATE TABLE likes (
  user_id INTEGER REFERENCES users(id),
  post_id INTEGER REFERENCES posts(id),
  liked_at TEXT,
  PRIMARY KEY (user_id, post_id)
);

INSERT INTO users VALUES
  (1,'asha_m','Asha Mehta','2022-01-05','Mumbai'),
  (2,'bcarter','Ben Carter','2022-02-11','Austin'),
  (3,'chenw','Chen Wei','2022-03-19','Shanghai'),
  (4,'divya.i','Divya Iyer','2022-05-02','Bengaluru'),
  (5,'eli_r','Eli Rodriguez','2022-06-21','Madrid'),
  (6,'farah_h','Farah Hassan','2022-08-08','Cairo'),
  (7,'gsouza','Gabriel Souza','2022-09-30','Sao Paulo'),
  (8,'hpark','Hannah Park','2022-11-14','Seoul');

INSERT INTO follows VALUES
  (1,2,'2022-03-01'),(1,3,'2022-03-05'),(1,4,'2022-04-10'),
  (2,1,'2022-03-02'),(2,5,'2022-05-01'),
  (3,1,'2022-03-06'),(3,4,'2022-06-15'),(3,7,'2022-07-20'),
  (4,1,'2022-04-12'),(4,3,'2022-06-16'),(4,8,'2022-09-01'),
  (5,2,'2022-05-03'),(5,6,'2022-08-10'),
  (6,5,'2022-08-12'),(6,7,'2022-10-01'),
  (7,3,'2022-07-22'),(7,1,'2022-08-05'),(7,6,'2022-10-03'),
  (8,4,'2022-09-02'),(8,1,'2022-10-15');

INSERT INTO posts VALUES
  (1,1,'First commit of the day done.','2023-09-01'),
  (2,1,'SQL window functions finally clicked.','2023-09-04'),
  (3,2,'Anyone up for a code review?','2023-09-02'),
  (4,3,'Shipped the new dashboard.','2023-09-03'),
  (5,4,'Indexing made the query 40x faster.','2023-09-05'),
  (6,5,'Learning Rust this month.','2023-09-06'),
  (7,3,'Caching is hard, naming is harder.','2023-09-07'),
  (8,6,'Took a long walk, debugged in my head.','2023-09-08'),
  (9,7,'Refactor day. No new features.','2023-09-09'),
  (10,4,'GROUP BY without aggregation is a trap.','2023-09-10');

INSERT INTO likes VALUES
  (2,1,'2023-09-01'),(3,1,'2023-09-01'),(4,1,'2023-09-02'),
  (1,3,'2023-09-02'),(5,3,'2023-09-02'),
  (1,4,'2023-09-03'),(2,4,'2023-09-03'),(7,4,'2023-09-03'),
  (1,5,'2023-09-05'),(3,5,'2023-09-05'),(8,5,'2023-09-06'),
  (2,2,'2023-09-04'),(3,2,'2023-09-04'),(4,2,'2023-09-04'),(7,2,'2023-09-05'),
  (6,6,'2023-09-06'),
  (1,7,'2023-09-07'),(4,7,'2023-09-08'),
  (5,8,'2023-09-08'),(7,8,'2023-09-08'),
  (3,9,'2023-09-09'),
  (1,10,'2023-09-10'),(3,10,'2023-09-10'),(8,10,'2023-09-11');
`,ta=`
CREATE TABLE airports (
  code TEXT PRIMARY KEY, name TEXT NOT NULL, city TEXT, country TEXT
);
CREATE TABLE airlines (id INTEGER PRIMARY KEY, name TEXT NOT NULL, country TEXT);
CREATE TABLE flights (
  id INTEGER PRIMARY KEY, flight_no TEXT,
  airline_id INTEGER REFERENCES airlines(id),
  origin TEXT REFERENCES airports(code),
  destination TEXT REFERENCES airports(code),
  depart TEXT, duration_min INTEGER, distance_km INTEGER
);
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY, flight_id INTEGER REFERENCES flights(id),
  passenger TEXT, seat TEXT, fare REAL
);

INSERT INTO airports VALUES
  ('JFK','John F. Kennedy Intl','New York','USA'),
  ('LHR','Heathrow','London','United Kingdom'),
  ('CDG','Charles de Gaulle','Paris','France'),
  ('DXB','Dubai Intl','Dubai','UAE'),
  ('SIN','Changi','Singapore','Singapore'),
  ('HND','Haneda','Tokyo','Japan'),
  ('DEL','Indira Gandhi Intl','Delhi','India'),
  ('GRU','Guarulhos','Sao Paulo','Brazil'),
  ('SYD','Kingsford Smith','Sydney','Australia'),
  ('FRA','Frankfurt','Frankfurt','Germany');

INSERT INTO airlines VALUES
  (1,'Atlantic Air','USA'),(2,'Albion Airways','United Kingdom'),
  (3,'Gulf Wings','UAE'),(4,'Pacific Star','Singapore'),
  (5,'Nippon Sky','Japan'),(6,'Bharat Air','India');

INSERT INTO flights VALUES
  (1,'AA101',1,'JFK','LHR','2023-09-01 21:00',420,5540),
  (2,'AW220',2,'LHR','CDG','2023-09-02 08:30',75,344),
  (3,'GW440',3,'DXB','SIN','2023-09-02 02:15',455,5841),
  (4,'PS010',4,'SIN','HND','2023-09-03 09:00',420,5312),
  (5,'NS305',5,'HND','SYD','2023-09-03 22:00',585,7822),
  (6,'BA777',6,'DEL','DXB','2023-09-04 04:30',210,2186),
  (7,'AA215',1,'JFK','GRU','2023-09-04 23:45',590,7681),
  (8,'AW118',2,'LHR','FRA','2023-09-05 11:20',95,654),
  (9,'GW012',3,'DXB','LHR','2023-09-05 03:10',445,5500),
  (10,'PS222',4,'SIN','SYD','2023-09-06 18:00',480,6300),
  (11,'NS140',5,'HND','SIN','2023-09-06 10:00',430,5312),
  (12,'BA340',6,'DEL','LHR','2023-09-07 02:00',525,6710);

INSERT INTO bookings VALUES
  (1,1,'Asha Mehta','12A',640.00),(2,1,'Ben Carter','12B',640.00),(3,1,'Chen Wei','30F',410.00),
  (4,2,'Divya Iyer','3C',120.00),(5,3,'Eli Rodriguez','22D',520.00),(6,3,'Farah Hassan','22E',520.00),
  (7,4,'Gabriel Souza','8A',480.00),(8,5,'Hannah Park','41K',910.00),(9,5,'Ivan Petrov','41J',910.00),
  (10,6,'Jamila Karam','15C',230.00),(11,7,'Asha Mehta','2A',1340.00),(12,7,'Ben Carter','2B',1340.00),
  (13,8,'Chen Wei','9D',140.00),(14,9,'Divya Iyer','18F',560.00),(15,10,'Eli Rodriguez','27A',690.00),
  (16,11,'Farah Hassan','33C',450.00),(17,12,'Gabriel Souza','5A',780.00),(18,12,'Hannah Park','5B',780.00),
  (19,2,'Ivan Petrov','3D',120.00),(20,4,'Jamila Karam','8B',480.00);
`,na=`
CREATE TABLE doctors (id INTEGER PRIMARY KEY, name TEXT NOT NULL, specialty TEXT);
CREATE TABLE patients (id INTEGER PRIMARY KEY, name TEXT NOT NULL, birth_year INTEGER, city TEXT);
CREATE TABLE visits (
  id INTEGER PRIMARY KEY, patient_id INTEGER REFERENCES patients(id),
  doctor_id INTEGER REFERENCES doctors(id),
  visit_date TEXT, reason TEXT, cost REAL
);
CREATE TABLE prescriptions (
  id INTEGER PRIMARY KEY, visit_id INTEGER REFERENCES visits(id),
  drug TEXT, days INTEGER
);

INSERT INTO doctors VALUES
  (1,'Dr. Lin Chao','Cardiology'),(2,'Dr. Maya Okonkwo','Pediatrics'),
  (3,'Dr. Tomas Vidal','Orthopedics'),(4,'Dr. Sara Holm','Dermatology'),
  (5,'Dr. Raj Patel','General Medicine'),(6,'Dr. Nour Aziz','Neurology');

INSERT INTO patients VALUES
  (1,'Asha Mehta',1989,'Mumbai'),(2,'Ben Carter',1975,'Austin'),
  (3,'Chen Wei',2001,'Shanghai'),(4,'Divya Iyer',1994,'Bengaluru'),
  (5,'Eli Rodriguez',1968,'Madrid'),(6,'Farah Hassan',2010,'Cairo'),
  (7,'Gabriel Souza',1982,'Sao Paulo'),(8,'Hannah Park',1999,'Seoul');

INSERT INTO visits VALUES
  (1,1,1,'2023-09-01','Chest pain',320.00),
  (2,2,5,'2023-09-02','Annual checkup',120.00),
  (3,3,4,'2023-09-03','Skin rash',90.00),
  (4,6,2,'2023-09-04','Fever',75.00),
  (5,4,3,'2023-09-05','Knee injury',410.00),
  (6,5,1,'2023-09-06','Hypertension',280.00),
  (7,7,6,'2023-09-07','Migraine',350.00),
  (8,1,5,'2023-09-09','Follow-up',60.00),
  (9,8,4,'2023-09-10','Acne',85.00),
  (10,3,5,'2023-09-11','Cough',70.00),
  (11,5,1,'2023-09-13','Follow-up',180.00),
  (12,2,3,'2023-09-14','Back pain',260.00),
  (13,6,2,'2023-09-15','Follow-up',55.00),
  (14,4,6,'2023-09-16','Headache',300.00);

INSERT INTO prescriptions VALUES
  (1,1,'Aspirin',30),(2,1,'Atorvastatin',90),
  (3,3,'Hydrocortisone',14),(4,4,'Paracetamol',5),
  (5,5,'Ibuprofen',10),(6,6,'Lisinopril',90),
  (7,7,'Sumatriptan',7),(8,9,'Benzoyl Peroxide',30),
  (9,10,'Dextromethorphan',7),(10,11,'Lisinopril',90),
  (11,12,'Naproxen',14),(12,14,'Sumatriptan',7),(13,2,'Multivitamin',60);
`,ia=`
CREATE TABLE branches (id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT);
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, joined TEXT, branch_id INTEGER REFERENCES branches(id));
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(id),
  type TEXT, opened TEXT, balance REAL
);
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY, account_id INTEGER REFERENCES accounts(id),
  tx_date TEXT, kind TEXT, amount REAL
);

INSERT INTO branches VALUES
  (1,'Downtown','New York'),(2,'Riverside','Austin'),
  (3,'Harbor','Singapore'),(4,'Central','London');

INSERT INTO customers VALUES
  (1,'Asha Mehta','2021-02-10',1),(2,'Ben Carter','2021-05-22',2),
  (3,'Chen Wei','2021-08-14',3),(4,'Divya Iyer','2022-01-30',1),
  (5,'Eli Rodriguez','2022-04-11',4),(6,'Farah Hassan','2022-07-19',2),
  (7,'Gabriel Souza','2022-10-05',3),(8,'Hannah Park','2023-01-25',4);

INSERT INTO accounts VALUES
  (1,1,'checking','2021-02-10',4200.00),(2,1,'savings','2021-02-10',18500.00),
  (3,2,'checking','2021-05-22',1320.00),(4,3,'savings','2021-08-14',9800.00),
  (5,4,'checking','2022-01-30',560.00),(6,4,'savings','2022-01-30',12200.00),
  (7,5,'checking','2022-04-11',3100.00),(8,6,'savings','2022-07-19',7400.00),
  (9,7,'checking','2022-10-05',880.00),(10,8,'savings','2023-01-25',5300.00);

INSERT INTO transactions VALUES
  (1,1,'2023-09-01','deposit',1500.00),(2,1,'2023-09-03','withdrawal',-200.00),
  (3,1,'2023-09-07','withdrawal',-450.00),(4,2,'2023-09-02','deposit',3000.00),
  (5,3,'2023-09-04','withdrawal',-120.00),(6,3,'2023-09-09','deposit',800.00),
  (7,4,'2023-09-05','deposit',1200.00),(8,5,'2023-09-06','withdrawal',-90.00),
  (9,6,'2023-09-08','deposit',500.00),(10,7,'2023-09-10','withdrawal',-300.00),
  (11,7,'2023-09-12','deposit',1000.00),(12,8,'2023-09-11','withdrawal',-220.00),
  (13,9,'2023-09-13','deposit',640.00),(14,10,'2023-09-14','deposit',2000.00),
  (15,2,'2023-09-15','withdrawal',-1500.00),(16,4,'2023-09-16','withdrawal',-600.00),
  (17,1,'2023-09-18','deposit',900.00),(18,5,'2023-09-19','deposit',450.00),
  (19,8,'2023-09-20','withdrawal',-180.00),(20,10,'2023-09-21','withdrawal',-700.00);
`,Le={"sql-basics":{id:"sql-basics",kind:"course",title:"SQL Basics",blurb:"Learn SQL from scratch in 10 graded lessons. Familiar employees/departments schema. SELECT, WHERE, JOIN, GROUP BY, subqueries, CTEs.",tables:["employees","departments"],seedSql:Ke,questions:[{id:"b1",title:"SELECT everything",prompt:"Return all columns of the employees table. Tip: `SELECT * FROM employees;`",starter:`-- Return every column and every row of \`employees\`
SELECT 
FROM employees
;
`,expected:{columns:["id","name","department_id","salary","hire_year"],values:[[1,"Asha Mehta",1,145e3,2021],[2,"Ben Carter",1,132e3,2022],[3,"Chen Wei",2,118e3,2020],[4,"Divya Iyer",2,124e3,2023],[5,"Eli Rodriguez",3,98e3,2019],[6,"Farah Hassan",1,158e3,2018],[7,"Gabriel Souza",3,102e3,2021],[8,"Hannah Park",4,87e3,2023],[9,"Ivan Petrov",1,141e3,2020],[10,"Jamila Karam",4,95e3,2022]]}},{id:"b2",title:"Project specific columns",prompt:"Return only the `name` and `salary` of every employee, in their natural row order.",starter:"-- Project only `name` and `salary` from `employees`\nSELECT \nFROM employees\n;\n",expected:{columns:["name","salary"],values:[["Asha Mehta",145e3],["Ben Carter",132e3],["Chen Wei",118e3],["Divya Iyer",124e3],["Eli Rodriguez",98e3],["Farah Hassan",158e3],["Gabriel Souza",102e3],["Hannah Park",87e3],["Ivan Petrov",141e3],["Jamila Karam",95e3]]}},{id:"b3",title:"Filter with WHERE",prompt:"Return the `name` and `salary` of employees in department_id = 1, alphabetically by name.",starter:`-- Filter to department_id = 1 and sort by name
SELECT 
FROM employees
WHERE 
ORDER BY 
;
`,expected:{columns:["name","salary"],values:[["Asha Mehta",145e3],["Ben Carter",132e3],["Farah Hassan",158e3],["Ivan Petrov",141e3]]}},{id:"b4",title:"ORDER BY + LIMIT",prompt:"Return the top 3 highest-paid employees as `name`, `salary`.",starter:`-- Sort by salary descending, take the first three rows
SELECT 
FROM employees
ORDER BY 
LIMIT 
;
`,expected:{columns:["name","salary"],values:[["Farah Hassan",158e3],["Asha Mehta",145e3],["Ivan Petrov",141e3]]}},{id:"b5",title:"Aggregate with COUNT",prompt:"How many employees are there? Return a single row with column `total`.",starter:"-- Count rows in `employees`; alias the result as `total`\nSELECT \nFROM employees\n;\n",expected:{columns:["total"],values:[[10]]}},{id:"b6",title:"GROUP BY with average",prompt:"Return each department_id and the AVG salary, rounded to integer, as `avg_salary`. Order by department_id.",starter:`-- One row per department_id: avg salary rounded to integer
SELECT 
FROM employees
GROUP BY 
ORDER BY 
;
`,expected:{columns:["department_id","avg_salary"],values:[[1,144e3],[2,121e3],[3,1e5],[4,91e3]]}},{id:"b7",title:"JOIN two tables",prompt:"List every employee with their department name. Columns: `name`, `department`. Order by `name`.",starter:`-- Join \`employees\` to \`departments\` on department_id
SELECT 
FROM employees e
JOIN departments d ON 
ORDER BY 
;
`,expected:{columns:["name","department"],values:[["Asha Mehta","Engineering"],["Ben Carter","Engineering"],["Chen Wei","Design"],["Divya Iyer","Design"],["Eli Rodriguez","Marketing"],["Farah Hassan","Engineering"],["Gabriel Souza","Marketing"],["Hannah Park","Operations"],["Ivan Petrov","Engineering"],["Jamila Karam","Operations"]]}},{id:"b8",title:"GROUP BY with JOIN",prompt:"Return each department name and the headcount (`n`). Order by `n` descending; break ties alphabetically by name.",starter:`-- Join + group by department name; tie-break alphabetically
SELECT 
FROM employees e
JOIN departments d ON 
GROUP BY 
ORDER BY 
;
`,expected:{columns:["name","n"],values:[["Engineering",4],["Design",2],["Marketing",2],["Operations",2]]}},{id:"b9",title:"Subquery: above-average earners",prompt:"Return the names of employees whose salary is strictly greater than the overall average salary, alphabetically.",starter:`-- Use a subquery to compute the average salary inside WHERE
SELECT 
FROM employees
WHERE salary > (
  -- subquery: overall AVG(salary)
)
ORDER BY 
;
`,expected:{columns:["name"],values:[["Asha Mehta"],["Ben Carter"],["Divya Iyer"],["Farah Hassan"],["Ivan Petrov"]]}},{id:"b10",title:"CTE: department salary spread",prompt:"Using a CTE, return per department: name, min_salary, max_salary, spread (max - min). Order by spread DESC; break ties alphabetically.",starter:`-- Build a CTE that aggregates min/max salary per department
WITH dept AS (
  -- per department: name, min_salary, max_salary
)
SELECT 
FROM dept
ORDER BY 
;
`,expected:{columns:["name","min_salary","max_salary","spread"],values:[["Engineering",132e3,158e3,26e3],["Operations",87e3,95e3,8e3],["Design",118e3,124e3,6e3],["Marketing",98e3,102e3,4e3]]}}]},usda:{id:"usda",kind:"course",title:"USDA Agricultural Production",blurb:"A real-world SQL practice course mirroring the UC Davis Coursera final project. Six commodity tables (cheese, honey, milk, coffee, eggs, yogurt) plus a state lookup. Each row is annual state-level production from the USDA NASS schema.",tables:["cheese_production","honey_production","milk_production","coffee_production","egg_production","yogurt_production","state_lookup"],seedSql:Je,questions:[{id:"q1",title:"Total cheese production by year",prompt:"Return the total cheese production for every year, sorted by year ascending. Use columns `Year` and `total`.",starter:`-- Aggregate cheese Value per Year
SELECT 
FROM cheese_production
GROUP BY 
ORDER BY 
;`,expected:{columns:["Year","total"],values:[[2020,6750],[2021,6960],[2022,7940],[2023,8075]]}},{id:"q2",title:"Top 5 milk-producing states in 2022",prompt:"Join milk_production with state_lookup to return the top 5 states by milk Value for the year 2022, with columns `State` and `Value`, sorted descending.",starter:`-- Join milk_production -> state_lookup, filter Year, sort, limit
SELECT 
FROM milk_production m
JOIN state_lookup s ON 
WHERE 
ORDER BY 
LIMIT 
;`,expected:{columns:["State","Value"],values:[["California",41980],["Wisconsin",31750],["New York",15890],["Pennsylvania",10440],["Minnesota",10180]]}},{id:"q3",title:"Average honey production per year",prompt:"Return the average honey production per year (across reporting states), rounded to the nearest integer. Columns `Year` and `avg_value`, ordered by Year.",starter:`-- Per Year, round AVG(Value) to nearest integer
SELECT 
FROM honey_production
GROUP BY 
ORDER BY 
;`,expected:{columns:["Year","avg_value"],values:[[2020,20747],[2021,20937],[2022,20790],[2023,21743]]}},{id:"q4",title:"States producing both cheese and milk in 2023",prompt:"Find the names of states that appear in both cheese_production and milk_production for the year 2023. Return one column `State`, sorted alphabetically.",starter:`-- Find State_ANSI values present in BOTH tables for 2023
SELECT 
FROM state_lookup s
WHERE 
ORDER BY 
;`,expected:{columns:["State"],values:[["California"],["Minnesota"],["New York"],["Wisconsin"]]}},{id:"q5",title:"Years where coffee production exceeded its overall average",prompt:"Return the years where coffee Value is greater than the overall average of coffee Value across all rows. Single column `Year`, ordered ascending.",starter:`-- Subquery: overall AVG(Value) from coffee_production
SELECT 
FROM coffee_production
WHERE Value > (
  -- subquery here
)
ORDER BY 
;`,expected:{columns:["Year"],values:[[2022],[2023]]}},{id:"q6",title:"Egg production rank within each year",prompt:"For each row in egg_production, return State_ANSI, Year, Value, and a rank (`rk`) of Value within that Year (highest = 1). Use a window function. Order by Year, then rk.",starter:`-- Window function: RANK() partitioned by Year, ordered by Value DESC
SELECT State_ANSI, Year, Value,
       -- RANK() OVER (PARTITION BY ... ORDER BY ...) AS rk
FROM egg_production
ORDER BY 
;`,expected:{columns:["State_ANSI","Year","Value","rk"],values:[[39,2020,8920,1],[48,2020,5510,2],[6,2020,4780,3],[17,2020,4310,4],[39,2021,9010,1],[48,2021,5640,2],[6,2021,4820,3],[17,2021,4360,4],[39,2022,9180,1],[48,2022,5780,2],[6,2022,4890,3],[17,2022,4280,4],[39,2023,9300,1],[48,2023,5910,2],[6,2023,4955,3],[17,2023,4395,4]]}},{id:"q7",title:"CTE: total dairy output by state in 2023",prompt:"Using a CTE that unions cheese, milk, and yogurt rows for 2023, return the state name and combined `total_value`, sorted descending. Use columns `State` and `total_value`.",starter:`-- CTE that UNION ALLs cheese + milk + yogurt rows for 2023
WITH dairy AS (
  -- SELECT State_ANSI, Value FROM ... WHERE Year = 2023
  -- UNION ALL ...
)
SELECT 
FROM dairy d
JOIN state_lookup s ON 
GROUP BY 
ORDER BY 
;`,expected:{columns:["State","total_value"],values:[["California",45547],["Wisconsin",36082],["New York",17735],["Minnesota",11115],["Pennsylvania",10580]],orderInsensitive:!1}},{id:"q8",title:"Running total of milk production over years (California)",prompt:"For State_ANSI = 6 (California), return Year and a running total `cum_value` of milk Value across years (ascending). Use a window function.",starter:`-- Window function: running SUM(Value) ordered by Year, for State_ANSI = 6
SELECT Year,
       -- SUM(Value) OVER (ORDER BY ...) AS cum_value
FROM milk_production
WHERE 
ORDER BY 
;`,expected:{columns:["Year","cum_value"],values:[[2020,41250],[2021,82810],[2022,124790],[2023,167020]]}}]},"employees-dept":{id:"employees-dept",kind:"playground",title:"Employees & Departments",blurb:"Classic toy schema: 10 employees across 4 departments. The simplest place to practice SELECT, WHERE, JOIN, GROUP BY.",tables:["employees","departments"],seedSql:Ze},chinook:{id:"chinook",kind:"playground",title:"Chinook (Music Store)",blurb:"Artists, albums, tracks, customers, invoices. The well-known SQLite sample database for trying JOINs across a real-shaped schema.",tables:["artists","albums","genres","tracks","customers","invoices","invoice_items"],seedSql:ze},sakila:{id:"sakila",kind:"playground",title:"Sakila (Movie Rental)",blurb:"A DVD rental store: actors, films, rentals, customers, payments. MySQL’s canonical sample database, ported to SQLite.",tables:["actors","categories","films","film_actors","customers","rentals","payments"],seedSql:We},world:{id:"world",kind:"playground",title:"World (Countries & Cities)",blurb:"Countries, cities, and spoken languages — 15 countries with GDP and population, 28 major cities, and language usage rows for HAVING and window-function drills.",tables:["countries","cities","languages"],seedSql:Qe},ecommerce:{id:"ecommerce",kind:"playground",title:"E-commerce",blurb:"Customers, products, orders, line items, reviews. Realistic order shape for aggregation, top-N per group, and review-rating queries.",tables:["customers","products","orders","line_items","reviews"],seedSql:$e},library:{id:"library",kind:"playground",title:"Library (Books & Loans)",blurb:"Authors, books, members, and loans. NULL return dates make this the natural place to practice outstanding-loan filters and LEFT JOINs.",tables:["authors","books","members","loans"],seedSql:ea},university:{id:"university",kind:"playground",title:"University (Enrollments)",blurb:"Students, instructors, courses, and enrollments with grades. GPA averages, course rosters, and per-department aggregation across terms.",tables:["students","instructors","courses","enrollments"],seedSql:aa},social:{id:"social",kind:"playground",title:"Social Network",blurb:"Users, follows, posts, and likes. A self-referencing follow graph for mutual-follow, most-liked, and follower-count queries.",tables:["users","follows","posts","likes"],seedSql:sa},flights:{id:"flights",kind:"playground",title:"Flights & Airports",blurb:"Airports, airlines, flights, and bookings. Origin/destination both point at airports — ideal for self-join routing and fare aggregation.",tables:["airports","airlines","flights","bookings"],seedSql:ta},hospital:{id:"hospital",kind:"playground",title:"Hospital (Visits)",blurb:"Doctors, patients, visits, and prescriptions. Per-specialty visit counts, cost totals, and prescription drilldowns through a visit join.",tables:["doctors","patients","visits","prescriptions"],seedSql:na},bank:{id:"bank",kind:"playground",title:"Bank (Accounts)",blurb:"Branches, customers, accounts, and signed transactions. Running balances, deposit vs withdrawal splits, and per-branch rollups.",tables:["branches","customers","accounts","transactions"],seedSql:ia}};function ra(){return Object.values(Le).filter(p=>p.kind==="playground")}function la(p,A){if(!p||p.length===0)return{ok:!1,reason:"No rows returned (your query produced an empty result)."};const c=p[p.length-1];if(!Array.isArray(c==null?void 0:c.columns)||!Array.isArray(c==null?void 0:c.values))return{ok:!1,reason:"Could not interpret the result."};const i=c.columns.map(t=>String(t)),g=A.columns.map(t=>String(t));if(i.length!==g.length||i.some((t,E)=>t!==g[E]))return{ok:!1,reason:`Column mismatch.
  expected: ${g.join(", ")}
  got:      ${i.join(", ")}`};const R=t=>t.map(E=>E.map(T=>T==null?null:typeof T=="number"?T:!isNaN(Number(T))&&/^-?\d+(\.\d+)?$/.test(String(T).trim())?Number(T):String(T).trim()));let d=R(c.values),o=R(A.values);if(A.orderInsensitive){const t=E=>JSON.stringify(E);d=[...d].sort((E,T)=>t(E).localeCompare(t(T))),o=[...o].sort((E,T)=>t(E).localeCompare(t(T)))}if(d.length!==o.length)return{ok:!1,reason:`Row count mismatch: expected ${o.length}, got ${d.length}.`};for(let t=0;t<d.length;t++)for(let E=0;E<d[t].length;E++)if(d[t][E]!==o[t][E])return{ok:!1,reason:`Row ${t+1}, column "${g[E]}" differs.
  expected: ${JSON.stringify(o[t][E])}
  got:      ${JSON.stringify(d[t][E])}`};return{ok:!0,reason:null}}const Ne={"employees-dept":`-- Try editing this query, then hit Run (Cmd/Ctrl+Enter).
SELECT d.name AS department,
       COUNT(e.id)         AS headcount,
       ROUND(AVG(e.salary)) AS avg_salary,
       MAX(e.salary)        AS top_salary
FROM employees e
JOIN departments d ON d.id = e.department_id
GROUP BY d.name
ORDER BY avg_salary DESC;
`,chinook:`-- Top 5 best-selling tracks (by quantity).
SELECT t.name AS track,
       a.name AS artist,
       SUM(ii.quantity) AS units_sold
FROM invoice_items ii
JOIN tracks  t ON t.id = ii.track_id
JOIN albums  al ON al.id = t.album_id
JOIN artists a ON a.id = al.artist_id
GROUP BY t.id
ORDER BY units_sold DESC
LIMIT 5;
`,sakila:`-- Revenue per film category.
SELECT c.name AS category,
       ROUND(SUM(p.amount), 2) AS revenue
FROM payments p
JOIN rentals    r ON r.id = p.rental_id
JOIN films      f ON f.id = r.film_id
JOIN categories c ON c.id = f.category_id
GROUP BY c.name
ORDER BY revenue DESC;
`,world:`-- Largest city in each country, ranked by city population.
SELECT co.name AS country,
       ci.name AS largest_city,
       ci.population
FROM countries co
JOIN cities    ci ON ci.country_code = co.code
GROUP BY co.code
HAVING ci.population = MAX(ci.population)
ORDER BY ci.population DESC;
`,ecommerce:`-- Top-spending customers in the last 60 days.
SELECT c.name,
       COUNT(o.id) AS orders,
       ROUND(SUM(o.total), 2) AS spent
FROM customers c
JOIN orders    o ON o.customer_id = c.id
WHERE o.status = 'shipped'
GROUP BY c.id
ORDER BY spent DESC
LIMIT 5;
`,library:`-- Books currently on loan (no return date yet).
SELECT b.title,
       a.name AS author,
       m.name AS borrower,
       l.loaned
FROM loans l
JOIN books   b ON b.id = l.book_id
JOIN authors a ON a.id = b.author_id
JOIN members m ON m.id = l.member_id
WHERE l.returned IS NULL
ORDER BY l.loaned;
`,university:`-- Average grade (GPA) per student, highest first.
SELECT s.name,
       s.major,
       ROUND(AVG(e.grade), 2) AS gpa,
       COUNT(e.id)            AS courses
FROM students s
JOIN enrollments e ON e.student_id = s.id
GROUP BY s.id
ORDER BY gpa DESC;
`,social:`-- Most-liked posts with their author.
SELECT u.handle,
       p.body,
       COUNT(lk.user_id) AS likes
FROM posts p
JOIN users u  ON u.id = p.user_id
LEFT JOIN likes lk ON lk.post_id = p.id
GROUP BY p.id
ORDER BY likes DESC
LIMIT 5;
`,flights:`-- Longest flights with airline and route.
SELECT f.flight_no,
       al.name AS airline,
       o.city  AS from_city,
       d.city  AS to_city,
       f.distance_km
FROM flights f
JOIN airlines al ON al.id = f.airline_id
JOIN airports o  ON o.code = f.origin
JOIN airports d  ON d.code = f.destination
ORDER BY f.distance_km DESC
LIMIT 5;
`,hospital:`-- Visit count and total billed per specialty.
SELECT d.specialty,
       COUNT(v.id)            AS visits,
       ROUND(SUM(v.cost), 2)  AS billed
FROM visits v
JOIN doctors d ON d.id = v.doctor_id
GROUP BY d.specialty
ORDER BY billed DESC;
`,bank:`-- Net movement per account: deposits minus withdrawals.
SELECT a.id AS account,
       c.name AS holder,
       a.type,
       ROUND(SUM(t.amount), 2) AS net_change
FROM accounts a
JOIN customers c    ON c.id = a.customer_id
JOIN transactions t ON t.account_id = a.id
GROUP BY a.id
ORDER BY net_change DESC;
`},J=`-- Pick a sample database to start writing SQL.
`,oa={"employees-dept":[{label:"All employees",sql:"SELECT * FROM employees ORDER BY salary DESC;"},{label:"Department headcount",sql:"SELECT d.name, COUNT(*) AS n FROM employees e JOIN departments d ON d.id = e.department_id GROUP BY d.name;"},{label:"Window: rank by salary",sql:"SELECT name, salary, RANK() OVER (ORDER BY salary DESC) AS rank FROM employees;"},{label:"CTE: above-avg earners",sql:`WITH avg_s AS (SELECT AVG(salary) AS a FROM employees)
SELECT name, salary FROM employees, avg_s WHERE salary > a ORDER BY salary DESC;`},{label:"Schema",sql:"SELECT name, sql FROM sqlite_master WHERE type='table';"}],chinook:[{label:"All artists",sql:"SELECT * FROM artists ORDER BY name;"},{label:"Tracks per album",sql:`SELECT a.title, COUNT(t.id) AS n_tracks
FROM albums a LEFT JOIN tracks t ON t.album_id = a.id
GROUP BY a.id ORDER BY n_tracks DESC;`},{label:"Revenue by country",sql:`SELECT billing_country, ROUND(SUM(total), 2) AS revenue
FROM invoices GROUP BY billing_country ORDER BY revenue DESC;`},{label:"Avg track length by genre",sql:`SELECT g.name, ROUND(AVG(t.milliseconds) / 1000.0) AS avg_seconds
FROM tracks t JOIN genres g ON g.id = t.genre_id
GROUP BY g.name ORDER BY avg_seconds DESC;`},{label:"Schema",sql:"SELECT name, sql FROM sqlite_master WHERE type='table';"}],sakila:[{label:"Films by rating",sql:"SELECT rating, COUNT(*) AS n FROM films GROUP BY rating ORDER BY n DESC;"},{label:"Active customers by city",sql:"SELECT city, COUNT(*) AS n FROM customers WHERE active = 1 GROUP BY city ORDER BY n DESC;"},{label:"Films per actor",sql:`SELECT a.first_name || ' ' || a.last_name AS actor, COUNT(fa.film_id) AS films
FROM actors a LEFT JOIN film_actors fa ON fa.actor_id = a.id
GROUP BY a.id ORDER BY films DESC;`},{label:"Schema",sql:"SELECT name, sql FROM sqlite_master WHERE type='table';"}],world:[{label:"Top 5 by GDP",sql:"SELECT name, gdp_billion FROM countries ORDER BY gdp_billion DESC LIMIT 5;"},{label:"Cities per continent",sql:`SELECT co.continent, COUNT(ci.id) AS n_cities
FROM countries co JOIN cities ci ON ci.country_code = co.code
GROUP BY co.continent ORDER BY n_cities DESC;`},{label:"Multilingual countries",sql:`SELECT country_code, COUNT(*) AS langs
FROM languages GROUP BY country_code
HAVING COUNT(*) > 1 ORDER BY langs DESC;`},{label:"Schema",sql:"SELECT name, sql FROM sqlite_master WHERE type='table';"}],ecommerce:[{label:"Revenue per category",sql:`SELECT p.category, ROUND(SUM(li.quantity * li.unit_price), 2) AS revenue
FROM line_items li JOIN products p ON p.id = li.product_id
GROUP BY p.category ORDER BY revenue DESC;`},{label:"Average rating per product",sql:`SELECT p.name, ROUND(AVG(r.rating), 2) AS avg_rating, COUNT(r.id) AS reviews
FROM products p LEFT JOIN reviews r ON r.product_id = p.id
GROUP BY p.id ORDER BY avg_rating DESC NULLS LAST;`},{label:"Repeat customers",sql:`SELECT c.name, COUNT(o.id) AS orders
FROM customers c JOIN orders o ON o.customer_id = c.id
GROUP BY c.id HAVING COUNT(o.id) > 1 ORDER BY orders DESC;`},{label:"Schema",sql:"SELECT name, sql FROM sqlite_master WHERE type='table';"}],library:[{label:"Books on loan now",sql:`SELECT b.title, m.name AS borrower
FROM loans l JOIN books b ON b.id = l.book_id
JOIN members m ON m.id = l.member_id
WHERE l.returned IS NULL ORDER BY l.loaned;`},{label:"Loans per book",sql:`SELECT b.title, COUNT(l.id) AS times_loaned
FROM books b LEFT JOIN loans l ON l.book_id = b.id
GROUP BY b.id ORDER BY times_loaned DESC;`},{label:"Books per genre",sql:"SELECT genre, COUNT(*) AS n FROM books GROUP BY genre ORDER BY n DESC;"},{label:"Authors by birth year",sql:"SELECT name, country, birth_year FROM authors ORDER BY birth_year;"},{label:"Schema",sql:"SELECT name, sql FROM sqlite_master WHERE type='table';"}],university:[{label:"GPA per student",sql:`SELECT s.name, ROUND(AVG(e.grade), 2) AS gpa
FROM students s JOIN enrollments e ON e.student_id = s.id
GROUP BY s.id ORDER BY gpa DESC;`},{label:"Course roster sizes",sql:`SELECT c.title, COUNT(e.id) AS enrolled
FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id
GROUP BY c.id ORDER BY enrolled DESC;`},{label:"Avg grade by department",sql:`SELECT c.department, ROUND(AVG(e.grade), 2) AS avg_grade
FROM enrollments e JOIN courses c ON c.id = e.course_id
GROUP BY c.department ORDER BY avg_grade DESC;`},{label:"Courses per instructor",sql:`SELECT i.name, COUNT(c.id) AS courses
FROM instructors i LEFT JOIN courses c ON c.instructor_id = i.id
GROUP BY i.id ORDER BY courses DESC;`},{label:"Schema",sql:"SELECT name, sql FROM sqlite_master WHERE type='table';"}],social:[{label:"Follower counts",sql:`SELECT u.handle, COUNT(f.follower_id) AS followers
FROM users u LEFT JOIN follows f ON f.followee_id = u.id
GROUP BY u.id ORDER BY followers DESC;`},{label:"Most-liked posts",sql:`SELECT u.handle, p.body, COUNT(lk.user_id) AS likes
FROM posts p JOIN users u ON u.id = p.user_id
LEFT JOIN likes lk ON lk.post_id = p.id
GROUP BY p.id ORDER BY likes DESC LIMIT 5;`},{label:"Mutual follows",sql:`SELECT a.follower_id, a.followee_id
FROM follows a JOIN follows b
  ON a.follower_id = b.followee_id AND a.followee_id = b.follower_id
WHERE a.follower_id < a.followee_id;`},{label:"Posts per user",sql:`SELECT u.handle, COUNT(p.id) AS posts
FROM users u LEFT JOIN posts p ON p.user_id = u.id
GROUP BY u.id ORDER BY posts DESC;`},{label:"Schema",sql:"SELECT name, sql FROM sqlite_master WHERE type='table';"}],flights:[{label:"Routes by distance",sql:`SELECT flight_no, origin, destination, distance_km
FROM flights ORDER BY distance_km DESC;`},{label:"Seats sold per flight",sql:`SELECT f.flight_no, COUNT(b.id) AS seats, ROUND(SUM(b.fare), 2) AS revenue
FROM flights f LEFT JOIN bookings b ON b.flight_id = f.id
GROUP BY f.id ORDER BY revenue DESC;`},{label:"Flights per airline",sql:`SELECT al.name, COUNT(f.id) AS flights
FROM airlines al LEFT JOIN flights f ON f.airline_id = al.id
GROUP BY al.id ORDER BY flights DESC;`},{label:"Departures by country",sql:`SELECT a.country, COUNT(f.id) AS departures
FROM flights f JOIN airports a ON a.code = f.origin
GROUP BY a.country ORDER BY departures DESC;`},{label:"Schema",sql:"SELECT name, sql FROM sqlite_master WHERE type='table';"}],hospital:[{label:"Visits per specialty",sql:`SELECT d.specialty, COUNT(v.id) AS visits
FROM visits v JOIN doctors d ON d.id = v.doctor_id
GROUP BY d.specialty ORDER BY visits DESC;`},{label:"Billing per doctor",sql:`SELECT d.name, ROUND(SUM(v.cost), 2) AS billed
FROM doctors d LEFT JOIN visits v ON v.doctor_id = d.id
GROUP BY d.id ORDER BY billed DESC;`},{label:"Visits per patient",sql:`SELECT p.name, COUNT(v.id) AS visits
FROM patients p LEFT JOIN visits v ON v.patient_id = p.id
GROUP BY p.id ORDER BY visits DESC;`},{label:"Most-prescribed drugs",sql:`SELECT drug, COUNT(*) AS times
FROM prescriptions GROUP BY drug ORDER BY times DESC;`},{label:"Schema",sql:"SELECT name, sql FROM sqlite_master WHERE type='table';"}],bank:[{label:"Balance per customer",sql:`SELECT c.name, ROUND(SUM(a.balance), 2) AS total_balance
FROM customers c JOIN accounts a ON a.customer_id = c.id
GROUP BY c.id ORDER BY total_balance DESC;`},{label:"Deposits vs withdrawals",sql:`SELECT kind, COUNT(*) AS n, ROUND(SUM(amount), 2) AS total
FROM transactions GROUP BY kind ORDER BY total DESC;`},{label:"Net change per account",sql:`SELECT a.id, a.type, ROUND(SUM(t.amount), 2) AS net_change
FROM accounts a JOIN transactions t ON t.account_id = a.id
GROUP BY a.id ORDER BY net_change DESC;`},{label:"Customers per branch",sql:`SELECT b.name, COUNT(c.id) AS customers
FROM branches b LEFT JOIN customers c ON c.branch_id = b.id
GROUP BY b.id ORDER BY customers DESC;`},{label:"Schema",sql:"SELECT name, sql FROM sqlite_master WHERE type='table';"}]},he=["var(--accent)","var(--hue-violet)","var(--hue-sky)","var(--hue-pink)","var(--hue-mint)"],Ea="pgcode_sql_last_playground_db",K="pgcode_sql_custom_seed",ge=`-- Your tables are loaded. List them, then query away.
SELECT name FROM sqlite_master WHERE type='table';
`;function Oe(p){const A=[],c=/CREATE\s+(?:TEMP(?:ORARY)?\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`[]?([A-Za-z_][\w$]*)["`\]]?/gi;let i;for(;(i=c.exec(p))!==null;)A.includes(i[1])||A.push(i[1]);return A}function Sa({theme:p}){var ce;const A=qe(),{courseSlug:c}=Fe(),i=c?Le[c]:null,g=c==="custom",R=(i==null?void 0:i.kind)==="course",d=(i==null?void 0:i.kind)==="playground",o=R?i:null,t=d?i:null,E=n.useMemo(()=>ra(),[]),[T,z]=n.useState(()=>{if(typeof window>"u")return"";try{return localStorage.getItem(K)||""}catch{return""}}),S=g&&!!T;n.useEffect(()=>{if(d&&c)try{localStorage.setItem(Ea,c)}catch{}},[d,c]);const[Y,W]=n.useState(0),l=(ce=o==null?void 0:o.questions)==null?void 0:ce[Y],[I,v]=n.useState(null),k=S?T:(i==null?void 0:i.seedSql)||"",F=o?`pgcode_sql_course_${o.id}_${(l==null?void 0:l.id)||"q"}`:t?`pgcode_sql_pg_${t.id}`:S?"pgcode_sql_pg_custom":"pgcode_sql_picker",Ie=R?(l==null?void 0:l.starter)||"-- write your query here":t?Ne[t.id]||J:S?ge:J,ye=typeof window<"u"&&localStorage.getItem(F)||Ie,[C,b]=n.useState(ye),Q=l==null?void 0:l.starter;n.useEffect(()=>{if(!R||!l)return;const a=`pgcode_sql_course_${o.id}_${l.id}`;b(localStorage.getItem(a)||Q||"-- write your query here"),v(null)},[R,o==null?void 0:o.id,l,Q]);const B=t==null?void 0:t.id;n.useEffect(()=>{if(!d||!B)return;const a=`pgcode_sql_pg_${B}`,s=Ne[B]||J;b(localStorage.getItem(a)||s),y([]),O(null),_(null)},[d,B]),n.useEffect(()=>{if(!S)return;b(localStorage.getItem("pgcode_sql_pg_custom")||ge),y([]),O(null),_(null)},[S]);const[D,$]=n.useState(!1),[w,Z]=n.useState(!1),[ee,O]=n.useState(null),[ae,y]=n.useState([]),[se,_]=n.useState(null),N=n.useRef(null),[te,ne]=n.useState(""),[P,Ce]=n.useState(""),[ie,h]=n.useState(null),[x,re]=n.useState(!1),j=n.useCallback(async a=>{const s=(a||"").trim();if(!s){h("Nothing to load — paste some SQL or fetch a URL first.");return}h(null);try{const r=(await V(async()=>{const{default:H}=await import("./sql-wasm-browser-zRtwOtG3.js").then(Ue=>Ue.s);return{default:H}},__vite__mapDeps([0,1]),import.meta.url)).default,u=await r({locateFile:()=>Ae}),m=new u.Database;m.run(s);const L=Oe(s).length;if(m.close(),L===0){h("No CREATE TABLE statements found. Include at least one table definition.");return}try{localStorage.setItem(K,s)}catch{}z(s)}catch(r){h(`That SQL did not load:
${(r==null?void 0:r.message)||String(r)}`)}},[]),le=n.useCallback(async()=>{const a=P.trim();if(!a){h("Enter a URL pointing at a .sql file (CREATE TABLE + INSERT statements).");return}h(null),re(!0);try{const s=await fetch(a,{method:"GET"});if(!s.ok){h(`Fetch failed: ${s.status} ${s.statusText}. Check the URL is a raw .sql file.`);return}const r=await s.text();await j(r)}catch(s){h(`Could not fetch that URL — the host may block cross-origin requests (CORS) or be unreachable. Try a raw file URL (e.g. a raw gist), or paste the SQL instead.
${(s==null?void 0:s.message)||String(s)}`)}finally{re(!1)}},[P,j]),be=n.useCallback(()=>{try{localStorage.removeItem(K)}catch{}try{localStorage.removeItem("pgcode_sql_pg_custom")}catch{}z(""),y([]),O(null),_(null),ne(""),h(null)},[]),oe="pgcode-sql-split",[U,_e]=n.useState(()=>{const a=Number(localStorage.getItem(oe));return Number.isFinite(a)&&a>=20&&a<=80?a:50}),Ee=n.useRef(null),G=n.useRef(!1);n.useEffect(()=>{const a=r=>{if(!G.current)return;const u=Ee.current;if(!u)return;const m=u.getBoundingClientRect(),L=r.clientY-m.top,H=Math.min(80,Math.max(20,L/m.height*100));_e(H)},s=()=>{if(G.current){G.current=!1,document.body.classList.remove("pg-resizing-row");try{localStorage.setItem(oe,String(U))}catch{}}};return window.addEventListener("mousemove",a),window.addEventListener("mouseup",s),()=>{window.removeEventListener("mousemove",a),window.removeEventListener("mouseup",s)}},[U]);const fe=a=>{a.preventDefault(),G.current=!0,document.body.classList.add("pg-resizing-row")};n.useEffect(()=>{if(!k){Z(!1);return}let a=!1;return(async()=>{try{const s=(await V(async()=>{const{default:m}=await import("./sql-wasm-browser-zRtwOtG3.js").then(L=>L.s);return{default:m}},__vite__mapDeps([0,1]),import.meta.url)).default,r=await s({locateFile:()=>Ae});if(a)return;const u=new r.Database;u.run(k),N.current=u,Z(!0)}catch(s){a||O((s==null?void 0:s.message)||String(s))}})(),()=>{if(a=!0,N.current){try{N.current.close()}catch{}N.current=null}}},[k]),n.useEffect(()=>{const a=setTimeout(()=>localStorage.setItem(F,C),250);return()=>clearTimeout(a)},[C,F]);const X=n.useCallback(()=>{if(!N.current)return;$(!0),O(null),y([]),v(null);const a=performance.now();try{const s=N.current.exec(C);y(s||[]),_(Math.round(performance.now()-a)),R&&(l!=null&&l.expected)&&v(la(s||[],l.expected))}catch(s){O((s==null?void 0:s.message)||String(s)),_(Math.round(performance.now()-a))}finally{$(!1)}},[C,R,l]);n.useEffect(()=>{const a=s=>{(s.metaKey||s.ctrlKey)&&s.key==="Enter"&&(s.preventDefault(),X())};return window.addEventListener("keydown",a),()=>window.removeEventListener("keydown",a)},[X]);const Ye=()=>{if(N.current)try{N.current.close()}catch{}(async()=>{const a=(await V(async()=>{const{default:u}=await import("./sql-wasm-browser-zRtwOtG3.js").then(m=>m.s);return{default:u}},__vite__mapDeps([0,1]),import.meta.url)).default,s=await a({locateFile:u=>`https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/${u}`}),r=new s.Database;r.run(k),N.current=r,O(null),y([]),v(null)})()},ve=p==="light"||p==="solarized"?"light":"vs-dark";if(g&&!S)return e.jsxs("div",{className:"sql-pg sql-pg-picker-page",children:[e.jsx("header",{className:"sql-pg-header",children:e.jsxs("div",{className:"sql-pg-title-row",children:[e.jsxs(f,{to:"/playground/sql",className:"sql-pg-back",children:[e.jsx(de,{size:12})," Back to sample databases"]}),e.jsx("h1",{className:"sql-pg-title",children:"Bring your own database"}),e.jsxs("p",{className:"sql-pg-sub",children:[e.jsx(q,{size:11})," Paste SQL or fetch a raw .sql URL — it runs in SQLite in your browser, nothing leaves the page."]})]})}),e.jsxs("div",{className:"sql-pg-custom-setup",children:[e.jsxs("div",{className:"sql-pg-custom-card",children:[e.jsxs("h3",{className:"sql-pg-side-title",children:[e.jsx(Te,{size:12})," Paste SQL"]}),e.jsx("p",{className:"sql-pg-custom-hint",children:"Drop in CREATE TABLE statements followed by INSERTs. SELECTs run later in the editor."}),e.jsx("textarea",{className:"sql-pg-custom-textarea",value:te,onChange:a=>ne(a.target.value),spellCheck:!1,placeholder:`CREATE TABLE pets (id INTEGER PRIMARY KEY, name TEXT, species TEXT);
INSERT INTO pets VALUES (1, 'Mochi', 'cat'), (2, 'Rex', 'dog');`}),e.jsxs("button",{className:"sql-pg-btn sql-pg-btn-primary",onClick:()=>j(te),children:[e.jsx(ue,{size:13})," Load & open editor"]})]}),e.jsxs("div",{className:"sql-pg-custom-card",children:[e.jsxs("h3",{className:"sql-pg-side-title",children:[e.jsx(Re,{size:12})," Fetch from a URL"]}),e.jsx("p",{className:"sql-pg-custom-hint",children:"A plain GET of a raw .sql file (e.g. a raw gist). The host must allow cross-origin reads."}),e.jsx("input",{className:"sql-pg-custom-input",type:"url",value:P,onChange:a=>Ce(a.target.value),onKeyDown:a=>{a.key==="Enter"&&le()},spellCheck:!1,placeholder:"https://gist.githubusercontent.com/.../schema.sql"}),e.jsxs("button",{className:"sql-pg-btn sql-pg-btn-primary",onClick:le,disabled:x,children:[x?e.jsx(me,{size:13,className:"sql-pg-spin"}):e.jsx(Re,{size:13}),x?"Fetching…":"Fetch & load"]}),ie&&e.jsx("pre",{className:"sql-pg-error sql-pg-custom-error",children:ie})]})]})]});if(!R&&!d&&!g)return e.jsxs("div",{className:"sql-pg sql-pg-picker-page",children:[e.jsx("header",{className:"sql-pg-header",children:e.jsxs("div",{className:"sql-pg-title-row",children:[e.jsx(Me,{current:"sql"}),e.jsx("h1",{className:"sql-pg-title",children:"SQL Playground"}),e.jsxs("p",{className:"sql-pg-sub",children:[e.jsx(q,{size:11})," Pick a sample database. Free-form editor, SQLite in your browser, results in milliseconds."]})]})}),e.jsxs("div",{className:"sql-pg-picker",children:[e.jsxs("div",{className:"sql-pg-picker-grid",children:[E.map((a,s)=>e.jsxs("button",{className:"sql-pg-picker-card",style:{"--card-accent":he[s%he.length]},onClick:()=>A(`/playground/sql/${a.id}`),children:[e.jsxs("span",{className:"sql-pg-picker-card-head",children:[e.jsx(q,{size:14}),e.jsx("span",{className:"sql-pg-picker-card-title",children:a.title})]}),e.jsx("span",{className:"sql-pg-picker-card-blurb",children:a.blurb}),e.jsxs("span",{className:"sql-pg-picker-card-tables",children:[a.tables.slice(0,5).map(r=>e.jsx("code",{children:r},r)),a.tables.length>5&&e.jsxs("code",{children:["+",a.tables.length-5]})]}),e.jsxs("span",{className:"sql-pg-picker-card-meta",children:[e.jsx(we,{size:11}),a.tables.length," table",a.tables.length===1?"":"s",e.jsxs("span",{className:"sql-pg-picker-card-cta",style:{marginLeft:"auto",marginTop:0},children:["Open ",e.jsx(pe,{size:11})]})]})]},a.id)),e.jsxs("button",{className:"sql-pg-picker-card sql-pg-picker-card-custom",onClick:()=>A("/playground/sql/custom"),children:[e.jsxs("span",{className:"sql-pg-picker-card-head",children:[e.jsx(Pe,{size:14}),e.jsx("span",{className:"sql-pg-picker-card-title",children:"Bring your own database"})]}),e.jsx("span",{className:"sql-pg-picker-card-blurb",children:"Paste your own CREATE TABLE + INSERT statements, or fetch them from a raw .sql URL, and query them in the same editor."}),e.jsxs("span",{className:"sql-pg-picker-card-tables",children:[e.jsx("code",{children:"paste SQL"}),e.jsx("code",{children:"fetch URL"})]}),e.jsxs("span",{className:"sql-pg-picker-card-meta",children:[e.jsx(Te,{size:11}),"Your schema",e.jsxs("span",{className:"sql-pg-picker-card-cta",style:{marginLeft:"auto",marginTop:0},children:["Load ",e.jsx(pe,{size:11})]})]})]})]}),e.jsxs("p",{className:"sql-pg-picker-foot",children:[e.jsx(Se,{size:11})," Looking for graded exercises? Try the ",e.jsx(f,{to:"/courses/sql-basics",children:"SQL Basics course"})," or the ",e.jsx(f,{to:"/playground/sql/usda",children:"USDA project"}),"."]})]})]});const ke=S?"Your database":i.title,Be=S?"Your pasted or fetched SQL, running in browser SQLite. Reset re-seeds from the same SQL; Replace loads new SQL.":i.blurb,M=S?Oe(T):(i==null?void 0:i.tables)||[],De=t?oa[t.id]||[]:S?[{label:"List tables",sql:"SELECT name FROM sqlite_master WHERE type='table';"},{label:"Schema",sql:"SELECT name, sql FROM sqlite_master WHERE type='table';"},...M[0]?[{label:`Rows of ${M[0]}`,sql:`SELECT * FROM ${M[0]} LIMIT 50;`}]:[]]:[];return e.jsxs("div",{className:"sql-pg",children:[e.jsxs("header",{className:"sql-pg-header",children:[e.jsxs("div",{className:"sql-pg-title-row",children:[e.jsxs(f,{to:"/playground/sql",className:"sql-pg-back",children:[e.jsx(de,{size:12})," ",R?"Pick a sample database":"Change database"]}),e.jsx("h1",{className:"sql-pg-title",children:ke}),e.jsxs("p",{className:"sql-pg-sub",children:[e.jsx(q,{size:11})," ",Be]}),d&&e.jsxs("p",{className:"sql-pg-sub",style:{marginTop:"0.25rem"},children:[e.jsx(Se,{size:11})," Want guided drills against this schema? The ",e.jsx(f,{to:"/courses/sql-basics",style:{color:"var(--accent)"},children:"SQL Basics course"})," walks ten graded steps."]})]}),e.jsxs("div",{className:"sql-pg-controls",children:[S&&e.jsxs("button",{className:"sql-pg-btn sql-pg-btn-ghost",onClick:be,title:"Discard this database and load different SQL",children:[e.jsx(xe,{size:13})," Replace"]}),e.jsxs("button",{className:"sql-pg-btn sql-pg-btn-ghost",onClick:Ye,title:"Reset to seed schema + data",children:[e.jsx(je,{size:13})," Reset DB"]}),e.jsxs("button",{className:"sql-pg-btn sql-pg-btn-primary",onClick:X,disabled:!w||D,title:"Run query (Cmd/Ctrl+Enter)",children:[D?e.jsx(me,{size:13,className:"sql-pg-spin"}):e.jsx(ue,{size:13}),D?"Running":w?"Run":"Loading SQLite…"]})]})]}),e.jsxs("div",{className:"sql-pg-body",children:[e.jsxs("aside",{className:"sql-pg-side",children:[e.jsxs("div",{className:"sql-pg-side-section",children:[e.jsxs("h3",{className:"sql-pg-side-title",children:[e.jsx(Xe,{size:11})," Tables"]}),e.jsx("ul",{className:"sql-pg-table-list",children:M.map(a=>e.jsx("li",{children:e.jsx("code",{children:a})},a))})]}),R?e.jsxs("div",{className:"sql-pg-side-section",children:[e.jsx("h3",{className:"sql-pg-side-title",children:"Questions"}),e.jsx("ol",{className:"sql-pg-q-list",children:o.questions.map((a,s)=>e.jsx("li",{children:e.jsxs("button",{className:`sql-pg-q-link ${s===Y?"active":""}`,onClick:()=>W(s),children:[e.jsxs("span",{className:"sql-pg-q-n",children:["Q",s+1]}),e.jsx("span",{className:"sql-pg-q-t",children:a.title})]})},a.id))})]}):e.jsxs("div",{className:"sql-pg-side-section",children:[e.jsx("h3",{className:"sql-pg-side-title",children:"Sample queries"}),e.jsx("ul",{className:"sql-pg-sample-list",children:De.map(a=>e.jsx("li",{children:e.jsx("button",{onClick:()=>b(a.sql),children:a.label})},a.label))})]})]}),e.jsxs("div",{className:"sql-pg-main",children:[R&&l&&e.jsxs("div",{className:"sql-pg-prompt",children:[e.jsxs("span",{className:"sql-pg-prompt-label",children:["Q",Y+1," of ",o.questions.length]}),e.jsx("h2",{className:"sql-pg-prompt-title",children:l.title}),e.jsx("p",{className:"sql-pg-prompt-text",children:l.prompt})]}),R&&I&&e.jsxs("div",{className:`sql-pg-grade ${I.ok?"ok":"bad"}`,children:[I.ok?e.jsx(He,{size:14}):e.jsx(Ve,{size:14}),I.ok?"Correct — moves to next question on demand.":e.jsx("span",{style:{whiteSpace:"pre-wrap"},children:I.reason}),I.ok&&Y+1<o.questions.length&&e.jsx("button",{className:"sql-pg-grade-next",onClick:()=>W(a=>a+1),children:"Next →"})]}),e.jsxs("div",{className:"sql-pg-split",ref:Ee,children:[e.jsx("div",{className:"sql-pg-editor",style:{flexBasis:`${U}%`},children:e.jsx(Ge,{height:"100%",language:"sql",theme:ve,value:C,onChange:a=>b(a??""),options:{fontSize:13,minimap:{enabled:!1},scrollBeyondLastLine:!1,automaticLayout:!0,padding:{top:10},tabSize:2,fontFamily:'"Space Mono", monospace'}})}),e.jsx("div",{className:"sql-pg-vsplitter",role:"separator","aria-orientation":"horizontal","aria-label":"Resize editor and results",onMouseDown:fe}),e.jsxs("div",{className:"sql-pg-output",style:{flexBasis:`${100-U}%`},children:[e.jsxs("div",{className:"sql-pg-output-head",children:[e.jsx("span",{className:"sql-pg-output-label",children:"Results"}),se!=null&&e.jsxs("span",{className:"sql-pg-output-meta",children:[se," ms"]})]}),e.jsx("div",{className:"sql-pg-output-body",children:ee?e.jsx("pre",{className:"sql-pg-error",children:ee}):ae.length===0?e.jsx("p",{className:"sql-pg-empty",children:D?"Running query…":w?"Run a query to see results.":"Loading SQLite engine…"}):ae.map((a,s)=>e.jsxs("div",{className:"sql-pg-result-block",children:[e.jsxs("table",{className:"sql-pg-table",children:[e.jsx("thead",{children:e.jsx("tr",{children:a.columns.map((r,u)=>e.jsx("th",{children:r},u))})}),e.jsx("tbody",{children:a.values.map((r,u)=>e.jsx("tr",{children:r.map((m,L)=>e.jsx("td",{children:m===null?e.jsx("em",{className:"sql-pg-null",children:"null"}):String(m)},L))},u))})]}),e.jsxs("span",{className:"sql-pg-row-count",children:[a.values.length," row",a.values.length===1?"":"s"]})]},s))})]})]})]})]})]})}export{Sa as default};
