const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./sql-wasm-browser-zRtwOtG3.js","./vendor-query-FJdQ8OJm.js"])))=>i.map(i=>d[i]);
import{_ as J}from"./index-HXC7ekPh.js";import{r as i,j as e}from"./vendor-query-FJdQ8OJm.js";import{F as oe}from"./vendor-monaco-BrjDLSos.js";import{P as le}from"./PlaygroundSwitcher-ByS-nHvD.js";import{b as Ee,u as ce,L as G}from"./vendor-react-firagBrd.js";import{a2 as q,w as de,p as W,z as Te,i as ue,a3 as me,x as pe,a4 as Re,c as Ae,X as Se}from"./vendor-icons-DM9LB7jm.js";import"./vendor-supabase-ClVc2H6D.js";const Ne=""+new URL("sql-wasm-UFUCzYNW.wasm",import.meta.url).href,ge=`
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
`,he=`
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
`,Oe=`
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
`,ye=`
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
`,Le=`
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
`,Ie=`
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
`,Ce=`
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
`,Q={"sql-basics":{id:"sql-basics",kind:"course",title:"SQL Basics",blurb:"Learn SQL from scratch in 10 graded lessons. Familiar employees/departments schema. SELECT, WHERE, JOIN, GROUP BY, subqueries, CTEs.",tables:["employees","departments"],seedSql:he,questions:[{id:"b1",title:"SELECT everything",prompt:"Return all columns of the employees table. Tip: `SELECT * FROM employees;`",starter:`-- Return every column and every row of \`employees\`
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
`,expected:{columns:["name","min_salary","max_salary","spread"],values:[["Engineering",132e3,158e3,26e3],["Operations",87e3,95e3,8e3],["Design",118e3,124e3,6e3],["Marketing",98e3,102e3,4e3]]}}]},usda:{id:"usda",kind:"course",title:"USDA Agricultural Production",blurb:"A real-world SQL practice course mirroring the UC Davis Coursera final project. Six commodity tables (cheese, honey, milk, coffee, eggs, yogurt) plus a state lookup. Each row is annual state-level production from the USDA NASS schema.",tables:["cheese_production","honey_production","milk_production","coffee_production","egg_production","yogurt_production","state_lookup"],seedSql:ge,questions:[{id:"q1",title:"Total cheese production by year",prompt:"Return the total cheese production for every year, sorted by year ascending. Use columns `Year` and `total`.",starter:`-- Aggregate cheese Value per Year
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
;`,expected:{columns:["Year","cum_value"],values:[[2020,41250],[2021,82810],[2022,124790],[2023,167020]]}}]},"employees-dept":{id:"employees-dept",kind:"playground",title:"Employees & Departments",blurb:"Classic toy schema: 10 employees across 4 departments. The simplest place to practice SELECT, WHERE, JOIN, GROUP BY.",tables:["employees","departments"],seedSql:Ce},chinook:{id:"chinook",kind:"playground",title:"Chinook (Music Store)",blurb:"Artists, albums, tracks, customers, invoices. The well-known SQLite sample database for trying JOINs across a real-shaped schema.",tables:["artists","albums","genres","tracks","customers","invoices","invoice_items"],seedSql:Oe},sakila:{id:"sakila",kind:"playground",title:"Sakila (Movie Rental)",blurb:"A DVD rental store: actors, films, rentals, customers, payments. MySQL’s canonical sample database, ported to SQLite.",tables:["actors","categories","films","film_actors","customers","rentals","payments"],seedSql:ye},world:{id:"world",kind:"playground",title:"World (Countries & Cities)",blurb:"Countries, cities, and spoken languages — 15 countries with GDP and population, 28 major cities, and language usage rows for HAVING and window-function drills.",tables:["countries","cities","languages"],seedSql:Le},ecommerce:{id:"ecommerce",kind:"playground",title:"E-commerce",blurb:"Customers, products, orders, line items, reviews. Realistic order shape for aggregation, top-N per group, and review-rating queries.",tables:["customers","products","orders","line_items","reviews"],seedSql:Ie}};function _e(){return Object.values(Q).filter(R=>R.kind==="playground")}function Ye(R,g){if(!R||R.length===0)return{ok:!1,reason:"No rows returned (your query produced an empty result)."};const d=R[R.length-1];if(!Array.isArray(d==null?void 0:d.columns)||!Array.isArray(d==null?void 0:d.values))return{ok:!1,reason:"Could not interpret the result."};const o=d.columns.map(s=>String(s)),E=g.columns.map(s=>String(s));if(o.length!==E.length||o.some((s,n)=>s!==E[n]))return{ok:!1,reason:`Column mismatch.
  expected: ${E.join(", ")}
  got:      ${o.join(", ")}`};const m=s=>s.map(n=>n.map(T=>T==null?null:typeof T=="number"?T:!isNaN(Number(T))&&/^-?\d+(\.\d+)?$/.test(String(T).trim())?Number(T):String(T).trim()));let r=m(d.values),c=m(g.values);if(g.orderInsensitive){const s=n=>JSON.stringify(n);r=[...r].sort((n,T)=>s(n).localeCompare(s(T))),c=[...c].sort((n,T)=>s(n).localeCompare(s(T)))}if(r.length!==c.length)return{ok:!1,reason:`Row count mismatch: expected ${c.length}, got ${r.length}.`};for(let s=0;s<r.length;s++)for(let n=0;n<r[s].length;n++)if(r[s][n]!==c[s][n])return{ok:!1,reason:`Row ${s+1}, column "${E[n]}" differs.
  expected: ${JSON.stringify(c[s][n])}
  got:      ${JSON.stringify(r[s][n])}`};return{ok:!0,reason:null}}const z={"employees-dept":`-- Try editing this query, then hit Run (Cmd/Ctrl+Enter).
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
`},M=`-- Pick a sample database to start writing SQL.
`,be={"employees-dept":[{label:"All employees",sql:"SELECT * FROM employees ORDER BY salary DESC;"},{label:"Department headcount",sql:"SELECT d.name, COUNT(*) AS n FROM employees e JOIN departments d ON d.id = e.department_id GROUP BY d.name;"},{label:"Window: rank by salary",sql:"SELECT name, salary, RANK() OVER (ORDER BY salary DESC) AS rank FROM employees;"},{label:"CTE: above-avg earners",sql:`WITH avg_s AS (SELECT AVG(salary) AS a FROM employees)
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
GROUP BY c.id HAVING COUNT(o.id) > 1 ORDER BY orders DESC;`},{label:"Schema",sql:"SELECT name, sql FROM sqlite_master WHERE type='table';"}]},fe="pgcode_sql_last_playground_db";function Me({theme:R}){var K;const g=Ee(),{courseSlug:d}=ce(),o=d?Q[d]:null,E=(o==null?void 0:o.kind)==="course",m=(o==null?void 0:o.kind)==="playground",r=E?o:null,c=m?o:null,s=i.useMemo(()=>_e(),[]);i.useEffect(()=>{if(m&&d)try{localStorage.setItem(fe,d)}catch{}},[m,d]);const[n,T]=i.useState(0),l=(K=r==null?void 0:r.questions)==null?void 0:K[n],[N,L]=i.useState(null),I=(o==null?void 0:o.seedSql)||"",k=r?`pgcode_sql_course_${r.id}_${(l==null?void 0:l.id)||"q"}`:c?`pgcode_sql_pg_${c.id}`:"pgcode_sql_picker",$=E?(l==null?void 0:l.starter)||"-- write your query here":c&&z[c.id]||M,Z=typeof window<"u"&&localStorage.getItem(k)||$,[h,C]=i.useState(Z),U=l==null?void 0:l.starter;i.useEffect(()=>{if(!E||!l)return;const a=`pgcode_sql_course_${r.id}_${l.id}`;C(localStorage.getItem(a)||U||"-- write your query here"),L(null)},[E,r==null?void 0:r.id,l,U]);const _=c==null?void 0:c.id;i.useEffect(()=>{if(!m||!_)return;const a=`pgcode_sql_pg_${_}`,t=z[_]||M;C(localStorage.getItem(a)||t),b([]),O(null),x(null)},[m,_]);const[Y,P]=i.useState(!1),[B,w]=i.useState(!1),[F,O]=i.useState(null),[j,b]=i.useState([]),[V,x]=i.useState(null),A=i.useRef(null),H="pgcode-sql-split",[f,ee]=i.useState(()=>{const a=Number(localStorage.getItem(H));return Number.isFinite(a)&&a>=20&&a<=80?a:50}),X=i.useRef(null),v=i.useRef(!1);i.useEffect(()=>{const a=p=>{if(!v.current)return;const u=X.current;if(!u)return;const S=u.getBoundingClientRect(),y=p.clientY-S.top,ie=Math.min(80,Math.max(20,y/S.height*100));ee(ie)},t=()=>{if(v.current){v.current=!1,document.body.classList.remove("pg-resizing-row");try{localStorage.setItem(H,String(f))}catch{}}};return window.addEventListener("mousemove",a),window.addEventListener("mouseup",t),()=>{window.removeEventListener("mousemove",a),window.removeEventListener("mouseup",t)}},[f]);const ae=a=>{a.preventDefault(),v.current=!0,document.body.classList.add("pg-resizing-row")};i.useEffect(()=>{if(!I){w(!1);return}let a=!1;return(async()=>{try{const t=(await J(async()=>{const{default:S}=await import("./sql-wasm-browser-zRtwOtG3.js").then(y=>y.s);return{default:S}},__vite__mapDeps([0,1]),import.meta.url)).default,p=await t({locateFile:()=>Ne});if(a)return;const u=new p.Database;u.run(I),A.current=u,w(!0)}catch(t){a||O((t==null?void 0:t.message)||String(t))}})(),()=>{if(a=!0,A.current){try{A.current.close()}catch{}A.current=null}}},[I]),i.useEffect(()=>{const a=setTimeout(()=>localStorage.setItem(k,h),250);return()=>clearTimeout(a)},[h,k]);const D=i.useCallback(()=>{if(!A.current)return;P(!0),O(null),b([]),L(null);const a=performance.now();try{const t=A.current.exec(h);b(t||[]),x(Math.round(performance.now()-a)),E&&(l!=null&&l.expected)&&L(Ye(t||[],l.expected))}catch(t){O((t==null?void 0:t.message)||String(t)),x(Math.round(performance.now()-a))}finally{P(!1)}},[h,E,l]);i.useEffect(()=>{const a=t=>{(t.metaKey||t.ctrlKey)&&t.key==="Enter"&&(t.preventDefault(),D())};return window.addEventListener("keydown",a),()=>window.removeEventListener("keydown",a)},[D]);const te=()=>{if(A.current)try{A.current.close()}catch{}(async()=>{const a=(await J(async()=>{const{default:u}=await import("./sql-wasm-browser-zRtwOtG3.js").then(S=>S.s);return{default:u}},__vite__mapDeps([0,1]),import.meta.url)).default,t=await a({locateFile:u=>`https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/${u}`}),p=new t.Database;p.run(I),A.current=p,O(null),b([]),L(null)})()},se=R==="light"||R==="solarized"?"light":"vs-dark";if(!E&&!m)return e.jsxs("div",{className:"sql-pg sql-pg-picker-page",children:[e.jsx("header",{className:"sql-pg-header",children:e.jsxs("div",{className:"sql-pg-title-row",children:[e.jsx(le,{current:"sql"}),e.jsx("h1",{className:"sql-pg-title",children:"SQL Playground"}),e.jsxs("p",{className:"sql-pg-sub",children:[e.jsx(q,{size:11})," Pick a sample database. Free-form editor, SQLite in your browser, results in milliseconds."]})]})}),e.jsxs("div",{className:"sql-pg-picker",children:[e.jsx("div",{className:"sql-pg-picker-grid",children:s.map(a=>e.jsxs("button",{className:"sql-pg-picker-card",onClick:()=>g(`/playground/sql/${a.id}`),children:[e.jsxs("span",{className:"sql-pg-picker-card-head",children:[e.jsx(q,{size:13}),e.jsx("span",{className:"sql-pg-picker-card-title",children:a.title})]}),e.jsx("span",{className:"sql-pg-picker-card-blurb",children:a.blurb}),e.jsxs("span",{className:"sql-pg-picker-card-tables",children:[a.tables.slice(0,6).map(t=>e.jsx("code",{children:t},t)),a.tables.length>6&&e.jsxs("code",{children:["+",a.tables.length-6]})]}),e.jsxs("span",{className:"sql-pg-picker-card-cta",children:["Open ",e.jsx(de,{size:11})]})]},a.id))}),e.jsxs("p",{className:"sql-pg-picker-foot",children:[e.jsx(W,{size:11})," Looking for graded exercises? Try the ",e.jsx(G,{to:"/courses/sql-basics",children:"SQL Basics course"})," or the ",e.jsx(G,{to:"/playground/sql/usda",children:"USDA project"}),"."]})]})]});const ne=(o==null?void 0:o.tables)||[],re=c?be[c.id]||[]:[];return e.jsxs("div",{className:"sql-pg",children:[e.jsxs("header",{className:"sql-pg-header",children:[e.jsxs("div",{className:"sql-pg-title-row",children:[e.jsxs(G,{to:"/playground/sql",className:"sql-pg-back",children:[e.jsx(Te,{size:12})," ",E?"Pick a sample database":"Change database"]}),e.jsx("h1",{className:"sql-pg-title",children:o.title}),e.jsxs("p",{className:"sql-pg-sub",children:[e.jsx(q,{size:11})," ",o.blurb]}),m&&e.jsxs("p",{className:"sql-pg-sub",style:{marginTop:"0.25rem"},children:[e.jsx(W,{size:11})," Want guided drills against this schema? The ",e.jsx(G,{to:"/courses/sql-basics",style:{color:"var(--accent)"},children:"SQL Basics course"})," walks ten graded steps."]})]}),e.jsxs("div",{className:"sql-pg-controls",children:[e.jsxs("button",{className:"sql-pg-btn sql-pg-btn-ghost",onClick:te,title:"Reset to seed schema + data",children:[e.jsx(ue,{size:13})," Reset DB"]}),e.jsxs("button",{className:"sql-pg-btn sql-pg-btn-primary",onClick:D,disabled:!B||Y,title:"Run query (Cmd/Ctrl+Enter)",children:[Y?e.jsx(me,{size:13,className:"sql-pg-spin"}):e.jsx(pe,{size:13}),Y?"Running":B?"Run":"Loading SQLite…"]})]})]}),e.jsxs("div",{className:"sql-pg-body",children:[e.jsxs("aside",{className:"sql-pg-side",children:[e.jsxs("div",{className:"sql-pg-side-section",children:[e.jsxs("h3",{className:"sql-pg-side-title",children:[e.jsx(Re,{size:11})," Tables"]}),e.jsx("ul",{className:"sql-pg-table-list",children:ne.map(a=>e.jsx("li",{children:e.jsx("code",{children:a})},a))})]}),E?e.jsxs("div",{className:"sql-pg-side-section",children:[e.jsx("h3",{className:"sql-pg-side-title",children:"Questions"}),e.jsx("ol",{className:"sql-pg-q-list",children:r.questions.map((a,t)=>e.jsx("li",{children:e.jsxs("button",{className:`sql-pg-q-link ${t===n?"active":""}`,onClick:()=>T(t),children:[e.jsxs("span",{className:"sql-pg-q-n",children:["Q",t+1]}),e.jsx("span",{className:"sql-pg-q-t",children:a.title})]})},a.id))})]}):e.jsxs("div",{className:"sql-pg-side-section",children:[e.jsx("h3",{className:"sql-pg-side-title",children:"Sample queries"}),e.jsx("ul",{className:"sql-pg-sample-list",children:re.map(a=>e.jsx("li",{children:e.jsx("button",{onClick:()=>C(a.sql),children:a.label})},a.label))})]})]}),e.jsxs("div",{className:"sql-pg-main",children:[E&&l&&e.jsxs("div",{className:"sql-pg-prompt",children:[e.jsxs("span",{className:"sql-pg-prompt-label",children:["Q",n+1," of ",r.questions.length]}),e.jsx("h2",{className:"sql-pg-prompt-title",children:l.title}),e.jsx("p",{className:"sql-pg-prompt-text",children:l.prompt})]}),E&&N&&e.jsxs("div",{className:`sql-pg-grade ${N.ok?"ok":"bad"}`,children:[N.ok?e.jsx(Ae,{size:14}):e.jsx(Se,{size:14}),N.ok?"Correct — moves to next question on demand.":e.jsx("span",{style:{whiteSpace:"pre-wrap"},children:N.reason}),N.ok&&n+1<r.questions.length&&e.jsx("button",{className:"sql-pg-grade-next",onClick:()=>T(a=>a+1),children:"Next →"})]}),e.jsxs("div",{className:"sql-pg-split",ref:X,children:[e.jsx("div",{className:"sql-pg-editor",style:{flexBasis:`${f}%`},children:e.jsx(oe,{height:"100%",language:"sql",theme:se,value:h,onChange:a=>C(a??""),options:{fontSize:13,minimap:{enabled:!1},scrollBeyondLastLine:!1,automaticLayout:!0,padding:{top:10},tabSize:2,fontFamily:'"Space Mono", monospace'}})}),e.jsx("div",{className:"sql-pg-vsplitter",role:"separator","aria-orientation":"horizontal","aria-label":"Resize editor and results",onMouseDown:ae}),e.jsxs("div",{className:"sql-pg-output",style:{flexBasis:`${100-f}%`},children:[e.jsxs("div",{className:"sql-pg-output-head",children:[e.jsx("span",{className:"sql-pg-output-label",children:"Results"}),V!=null&&e.jsxs("span",{className:"sql-pg-output-meta",children:[V," ms"]})]}),e.jsx("div",{className:"sql-pg-output-body",children:F?e.jsx("pre",{className:"sql-pg-error",children:F}):j.length===0?e.jsx("p",{className:"sql-pg-empty",children:Y?"Running query…":B?"Run a query to see results.":"Loading SQLite engine…"}):j.map((a,t)=>e.jsxs("div",{className:"sql-pg-result-block",children:[e.jsxs("table",{className:"sql-pg-table",children:[e.jsx("thead",{children:e.jsx("tr",{children:a.columns.map((p,u)=>e.jsx("th",{children:p},u))})}),e.jsx("tbody",{children:a.values.map((p,u)=>e.jsx("tr",{children:p.map((S,y)=>e.jsx("td",{children:S===null?e.jsx("em",{className:"sql-pg-null",children:"null"}):String(S)},y))},u))})]}),e.jsxs("span",{className:"sql-pg-row-count",children:[a.values.length," row",a.values.length===1?"":"s"]})]},t))})]})]})]})]})]})}export{Me as default};
