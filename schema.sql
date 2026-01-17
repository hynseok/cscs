DROP TABLE IF EXISTS paper_authors CASCADE;
DROP TABLE IF EXISTS papers CASCADE;
DROP TABLE IF EXISTS authors CASCADE;
DROP TABLE IF EXISTS venues CASCADE;

CREATE TABLE venues (
    id SERIAL PRIMARY KEY,
    raw_name TEXT UNIQUE NOT NULL
);

CREATE TABLE authors (
    id SERIAL PRIMARY KEY,
    dblp_pid TEXT UNIQUE,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE papers (
    id SERIAL PRIMARY KEY,
    venue_id INT REFERENCES venues(id),
    title TEXT NOT NULL,
    year INT,
    ee_link TEXT,
    dblp_key TEXT UNIQUE NOT NULL,
    citation_count INT DEFAULT 0
);

CREATE TABLE paper_authors (
    paper_id INT REFERENCES papers(id) ON DELETE CASCADE,
    author_id INT REFERENCES authors(id) ON DELETE CASCADE,
    author_order INT,
    PRIMARY KEY (paper_id, author_id)
);

CREATE INDEX idx_papers_venue ON papers(venue_id);
CREATE INDEX idx_papers_year ON papers(year);
CREATE INDEX idx_authors_name ON authors(name);