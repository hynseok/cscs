CREATE TABLE IF NOT EXISTS venues (
    id SERIAL PRIMARY KEY,
    raw_name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS authors (
    id SERIAL PRIMARY KEY,
    dblp_pid TEXT UNIQUE,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS papers (
    id SERIAL PRIMARY KEY,
    venue_id INT REFERENCES venues(id),
    title TEXT NOT NULL,
    year INT,
    ee_link TEXT,
    dblp_key TEXT UNIQUE NOT NULL,
    citation_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS paper_authors (
    paper_id INT REFERENCES papers(id) ON DELETE CASCADE,
    author_id INT REFERENCES authors(id) ON DELETE CASCADE,
    author_order INT NOT NULL CHECK (author_order >= 0),
    PRIMARY KEY (paper_id, author_order),
    UNIQUE (paper_id, author_id)
);

CREATE INDEX IF NOT EXISTS idx_papers_venue ON papers(venue_id);
CREATE INDEX IF NOT EXISTS idx_papers_year ON papers(year);
CREATE INDEX IF NOT EXISTS idx_authors_name ON authors(name);
CREATE INDEX IF NOT EXISTS idx_paper_authors_author_id ON paper_authors(author_id);

CREATE TABLE IF NOT EXISTS search_queries (
    id SERIAL PRIMARY KEY,
    query TEXT UNIQUE NOT NULL
);
