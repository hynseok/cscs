use anyhow::{Context, Result};
use once_cell::sync::Lazy;
use quick_xml::events::Event;
use quick_xml::reader::Reader;
use serde::Deserialize;
use sqlx::postgres::PgPoolOptions;
use sqlx::{Pool, Postgres};
use std::collections::HashMap;
use std::env;
use urlencoding::{decode, encode};

static VENUE_MAP: Lazy<HashMap<String, String>> = Lazy::new(|| {
    let mut m = HashMap::new();
    let top_v_raw = vec![
        vec!["AAAI", "aaai"],
        vec!["ACL", "acl"],
        vec!["ASE", "kbse"],
        vec!["ASPLOS", "asplos"],
        vec!["CAV", "cav"],
        vec!["CCS", "ccs"],
        vec!["CHI", "chi"],
        vec!["CIKM", "cikm"],
        vec!["COLT", "colt"],
        vec!["CoNEXT", "conext"],
        vec!["CRYPTO", "crypto"],
        vec!["CVPR", "cvpr"],
        vec!["DAC", "dac"],
        vec!["ECCV", "eccv"],
        vec!["EMNLP", "emnlp"],
        vec!["EUROCRYPT", "eurocrypt"],
        vec!["EuroSys", "eurosys"],
        vec!["FAST", "fast"],
        vec!["FOCS", "focs"],
        vec!["FSE", "sigsoft"],
        vec!["HPCA", "hpca"],
        vec!["HPDC", "hpdc"],
        vec!["ICCV", "iccv"],
        vec!["ICDE", "icde"],
        vec!["ICDM", "icdm"],
        vec!["ICFP", "icfp"],
        vec!["ICLR", "iclr"],
        vec!["ICML", "icml"],
        vec!["ICSE", "icse"],
        vec!["INFOCOM", "infocom"],
        vec!["ISCA", "isca"],
        vec!["ISSTA", "issta"],
        vec!["KDD", "kdd"],
        vec!["LICS", "lics"],
        vec!["MICCAI", "miccai"],
        vec!["MICRO", "micro"],
        vec!["MobiCom", "mobicom"],
        vec!["MobiSys", "mobisys"],
        vec!["NAACL", "naacl"],
        vec!["NDSS", "ndss"],
        vec!["NeurIPS", "nips"],
        vec!["NSDI", "nsdi"],
        vec!["OOPSLA", "oopsla"],
        vec!["OSDI", "osdi"],
        vec!["PACT", "IEEEpact"],
        vec!["PLDI", "pldi"],
        vec!["PODC", "podc"],
        vec!["PODS", "pods"],
        vec!["POPL", "popl"],
        vec!["PPoPP", "ppopp"],
        vec!["RTAS", "rtas"],
        vec!["RTSS", "rtss"],
        vec!["S&P", "sp"],
        vec!["SC", "sc"],
        vec!["SenSys", "sensys"],
        vec!["SIGCOMM", "sigcomm"],
        vec!["SIGGRAPH", "siggraph"],
        vec!["SIGGRAPH Asia", "siggrapha"],
        vec!["SIGIR", "sigir"],
        vec!["SIGMETRICS", "sigmetrics"],
        vec!["SIGMOD", "sigmod"],
        vec!["SoCG", "compgeom"],
        vec!["SODA", "soda"],
        vec!["SOSP", "sosp"],
        vec!["STOC", "stoc"],
        vec!["TACAS", "tacas"],
        vec!["UbiComp", "huc"],
        vec!["UIST", "uist"],
        vec!["USENIX ATC", "usenix"],
        vec!["USENIX Security", "uss"],
        vec!["VIS", "visualization"],
        vec!["VLDB", "vldb"],
        vec!["VR", "vr"],
        vec!["WWW", "www"],
    ];
    for group in top_v_raw {
        let canonical_name = group[0].to_string();
        for alias in group {
            m.insert(alias.to_lowercase(), canonical_name.clone());
        }
    }
    m
});

struct Paper {
    title: String,
    year: i32,
    authors: Vec<String>,
    venue: String,
    dblp_key: String,
    ee_links: Vec<String>,
    citation_count: Option<i32>,
}

#[derive(Deserialize, Debug)]
struct OpenAlexResponse {
    results: Vec<OpenAlexWork>,
}

#[derive(Deserialize, Debug)]
struct OpenAlexWork {
    doi: Option<String>,
    cited_by_count: Option<i32>,
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();
    let db_url = env::var("DATABASE_URL").context("DATABASE_URL must be set")?;
    let pool = PgPoolOptions::new()
        .max_connections(20)
        .connect(&db_url)
        .await?;
    parse_and_insert(&pool, "dblp.xml").await?;
    Ok(())
}

async fn parse_and_insert(pool: &Pool<Postgres>, path: &str) -> Result<()> {
    const TARGET_ENTRY_TAG: &str = "inproceedings";

    let mut reader = Reader::from_file(path)?;
    reader.trim_text(true);
    let mut buf = Vec::new();
    let mut current_paper: Option<Paper> = None;
    let mut current_tag = String::new();
    let mut year_str = String::new();
    let mut batch: Vec<Paper> = Vec::with_capacity(1000);
    let skip_tags = ["i", "sub", "sup", "tt", "ref", "span", "br"];

    let http_client = reqwest::Client::new();

    println!("Start Parsing...");

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(ref e)) => {
                let tag_name = String::from_utf8_lossy(e.name().as_ref()).to_string();
                match tag_name.as_str() {
                    TARGET_ENTRY_TAG => {
                        let mut key = String::new();
                        for attr in e.attributes().flatten() {
                            if attr.key.as_ref() == b"key" {
                                key = attr.decode_and_unescape_value(&reader)?.to_string();
                            }
                        }
                        current_paper = Some(Paper {
                            title: String::new(),
                            year: 0,
                            authors: Vec::new(),
                            venue: String::new(),
                            dblp_key: key,
                            ee_links: Vec::new(),
                            citation_count: None,
                        });
                        current_tag = tag_name;
                    }
                    "author" => {
                        if let Some(ref mut p) = current_paper {
                            p.authors.push(String::new());
                        }
                        current_tag = tag_name;
                    }
                    "ee" => {
                        current_tag = "ee".to_string();
                    }
                    t if skip_tags.contains(&t) => {}
                    _ => {
                        if current_paper.is_some() {
                            current_tag = tag_name;
                        }
                    }
                }
            }
            Ok(Event::Text(ref e)) => {
                if let Some(ref mut paper) = current_paper {
                    let text =
                        html_escape::decode_html_entities(&String::from_utf8_lossy(e.as_ref()))
                            .to_string();
                    match current_tag.as_str() {
                        "author" => {
                            if let Some(last) = paper.authors.last_mut() {
                                last.push_str(&text);
                            }
                        }
                        "title" => paper.title.push_str(&text),
                        "year" => year_str.push_str(&text),
                        "booktitle" | "journal" => paper.venue.push_str(&text),
                        "ee" => paper.ee_links.push(text),
                        _ => {}
                    }
                }
            }
            Ok(Event::End(ref e)) => {
                let tag_name = String::from_utf8_lossy(e.name().as_ref()).to_string();
                if tag_name.as_str() == TARGET_ENTRY_TAG {
                    if let Some(mut paper) = current_paper.take() {
                        paper.year = year_str.parse().unwrap_or(0);
                        year_str.clear();
                        if let Some(canonical) = get_canonical(&paper) {
                            paper.venue = canonical;
                            batch.push(paper);
                            if batch.len() >= 1000 {
                                fetch_citation_counts(pool, &http_client, &mut batch).await?;
                                insert_batch(pool, &mut batch).await?;
                                print!(".");
                                std::io::Write::flush(&mut std::io::stdout())?;
                            }
                        }
                    }
                }
                if tag_name == current_tag {
                    current_tag.clear();
                }
            }
            Ok(Event::Eof) => break,
            _ => {}
        }
        buf.clear();
    }
    if !batch.is_empty() {
        fetch_citation_counts(pool, &http_client, &mut batch).await?;
        insert_batch(pool, &mut batch).await?;
    }
    Ok(())
}

fn get_canonical(paper: &Paper) -> Option<String> {
    if !paper.dblp_key.starts_with("conf/") {
        return None;
    }
    let parts: Vec<&str> = paper.dblp_key.split('/').collect();
    if parts.len() < 2 {
        return None;
    }
    let short_name = parts[1].to_lowercase();
    if let Some(canonical) = VENUE_MAP.get(&short_name) {
        if paper.venue.to_lowercase().contains("workshop")
            || paper.title.to_lowercase().contains("workshop")
        {
            return None;
        }
        return Some(canonical.clone());
    }
    None
}

fn extract_doi(url: &str) -> Option<String> {
    let decoded = decode(url)
        .map(|d| d.into_owned())
        .unwrap_or_else(|_| url.to_string());
    let lowered = decoded.trim().to_lowercase();

    let mut candidate = lowered.as_str();
    if let Some(pos) = candidate.find("doi.org/") {
        candidate = &candidate[pos + "doi.org/".len()..];
    }
    if let Some(stripped) = candidate.strip_prefix("urn:doi:") {
        candidate = stripped;
    }
    if let Some(stripped) = candidate.strip_prefix("doi:") {
        candidate = stripped;
    }
    if !candidate.starts_with("10.") {
        if let Some(idx) = candidate.find("10.") {
            candidate = &candidate[idx..];
        } else {
            return None;
        }
    }

    let end = candidate
        .find(|c: char| c.is_whitespace() || matches!(c, '?' | '#' | '"' | '\'' | '<' | '>'))
        .unwrap_or(candidate.len());

    let doi = candidate[..end]
        .trim()
        .trim_matches(|c: char| {
            matches!(c, '.' | ',' | ';' | ':' | '(' | ')' | '[' | ']' | '{' | '}')
        })
        .trim_start_matches('/')
        .to_string();

    if doi.starts_with("10.") {
        Some(doi)
    } else {
        None
    }
}

async fn fetch_citation_counts(pool: &Pool<Postgres>, client: &reqwest::Client, batch: &mut Vec<Paper>) -> Result<()> {
    if batch.is_empty() {
        return Ok(());
    }

    let dblp_keys: Vec<String> = batch.iter().map(|p| p.dblp_key.clone()).collect();
    let existing_rows: Vec<(String,)> = sqlx::query_as("SELECT dblp_key FROM papers WHERE dblp_key = ANY($1)")
        .bind(&dblp_keys)
        .fetch_all(pool).await?;
    
    let existing_keys: std::collections::HashSet<String> = existing_rows.into_iter().map(|r| r.0).collect();

    let base_url = "https://api.openalex.org/works";

    // Chunk into 50 to avoid URL length issues
    for chunk in batch.chunks_mut(50) {
        let mut doi_to_indices: HashMap<String, Vec<usize>> = HashMap::new();

        for (i, p) in chunk.iter().enumerate() {
            if existing_keys.contains(&p.dblp_key) {
                continue;
            }
            for link in &p.ee_links {
                if let Some(doi) = extract_doi(link) {
                    doi_to_indices.entry(doi).or_default().push(i);
                    break;
                }
            }
        }

        if doi_to_indices.is_empty() {
            continue;
        }

        let mut dois: Vec<String> = doi_to_indices.keys().cloned().collect();
        dois.sort();

        let filter = format!("doi:{}", dois.join("|"));
        let per_page = dois.len().to_string();
        let mut response: Option<reqwest::Response> = None;

        for attempt in 0..3 {
            let res = client
                .get(base_url)
                .query(&[
                    ("filter", filter.as_str()),
                    ("select", "doi,cited_by_count"),
                    ("per_page", per_page.as_str()),
                ])
                .header("User-Agent", "ScholarSearch/1.0 (mailto:test@example.com)")
                .send()
                .await;

            match res {
                Ok(resp) if resp.status().is_success() => {
                    response = Some(resp);
                    break;
                }
                Ok(resp)
                    if resp.status() == reqwest::StatusCode::TOO_MANY_REQUESTS
                        || resp.status().is_server_error() =>
                {
                    let delay_ms = 200 * (1_u64 << attempt);
                    tokio::time::sleep(tokio::time::Duration::from_millis(delay_ms)).await;
                }
                Ok(resp) => {
                    eprintln!("OpenAlex request failed with status {}", resp.status());
                    break;
                }
                Err(err) => {
                    if attempt == 2 {
                        eprintln!("OpenAlex request error: {}", err);
                    } else {
                        let delay_ms = 200 * (1_u64 << attempt);
                        tokio::time::sleep(tokio::time::Duration::from_millis(delay_ms)).await;
                    }
                }
            }
        }

        if let Some(resp) = response {
            let oa_resp: OpenAlexResponse = resp
                .json()
                .await
                .unwrap_or_else(|_| OpenAlexResponse { results: vec![] });

            for work in oa_resp.results {
                if let (Some(doi_raw), Some(count)) = (work.doi.as_deref(), work.cited_by_count) {
                    if let Some(work_doi) = extract_doi(doi_raw) {
                        if let Some(indices) = doi_to_indices.get(&work_doi) {
                            for idx in indices {
                                chunk[*idx].citation_count = Some(count);
                            }
                        }
                    }
                }
            }
        }

        // Polite delay
        tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
    }
    Ok(())
}

async fn insert_batch(pool: &Pool<Postgres>, batch: &mut Vec<Paper>) -> Result<()> {
    if batch.is_empty() {
        return Ok(());
    }

    let mut tx = pool.begin().await?;

    // 1. Bulk insert venues
    let mut venues_set = std::collections::HashSet::new();
    for p in batch.iter() {
        venues_set.insert(p.venue.clone());
    }
    let unique_venues: Vec<String> = venues_set.into_iter().collect();

    if !unique_venues.is_empty() {
        sqlx::query("INSERT INTO venues (raw_name) SELECT * FROM UNNEST($1::text[]) ON CONFLICT (raw_name) DO NOTHING")
            .bind(&unique_venues)
            .execute(&mut *tx).await?;
    }

    let venue_rows: Vec<(i32, String)> = sqlx::query_as("SELECT id, raw_name FROM venues WHERE raw_name = ANY($1)")
        .bind(&unique_venues)
        .fetch_all(&mut *tx).await?;
    
    let mut venue_map: HashMap<String, i32> = HashMap::new();
    for r in venue_rows {
        venue_map.insert(r.1, r.0);
    }

    // 2. Prepare papers & authors data
    let capacity = batch.len();
    let mut titles = Vec::with_capacity(capacity);
    let mut years = Vec::with_capacity(capacity);
    let mut ee_links = Vec::with_capacity(capacity);
    let mut dblp_keys = Vec::with_capacity(capacity);
    let mut cit_counts = Vec::with_capacity(capacity);
    let mut venue_ids = Vec::with_capacity(capacity);

    let mut pa_dblp_keys = Vec::new();
    let mut pa_author_orders = Vec::new();
    let mut pa_author_names = Vec::new();

    let mut unique_author_names_set = std::collections::HashSet::new();
    let mut dblp_key_seen = std::collections::HashSet::new();

    for paper in batch.drain(..) {
        if !dblp_key_seen.insert(paper.dblp_key.clone()) {
            continue;
        }

        let ee_link = if paper.ee_links.is_empty() {
            format!(
                "https://scholar.google.com/scholar?q={}",
                encode(&paper.title)
            )
        } else {
            let mut selected = None;
            for l in &paper.ee_links {
                let low = l.to_lowercase();
                if low.contains("dl.acm.org") {
                    selected = Some(l.clone());
                    break;
                }
            }
            if selected.is_none() {
                for l in &paper.ee_links {
                    let low = l.to_lowercase();
                    if low.contains("ieeexplore.ieee.org") {
                        selected = Some(l.clone());
                        break;
                    }
                }
            }
            if selected.is_none() {
                for l in &paper.ee_links {
                    if l.contains("doi.org") {
                        selected = Some(l.clone());
                        break;
                    }
                }
            }
            selected.unwrap_or_else(|| paper.ee_links[0].clone())
        };

        let v_id = venue_map.get(&paper.venue).copied().unwrap_or(0);
        let dblp_key = paper.dblp_key.clone();

        titles.push(paper.title);
        years.push(paper.year);
        ee_links.push(ee_link);
        dblp_keys.push(dblp_key.clone());
        cit_counts.push(paper.citation_count.unwrap_or(0));
        venue_ids.push(v_id);

        for (idx, name) in paper.authors.into_iter().enumerate() {
            unique_author_names_set.insert(name.clone());
            pa_dblp_keys.push(dblp_key.clone());
            pa_author_orders.push(idx as i32);
            pa_author_names.push(name);
        }
    }

    // 3. Bulk insert papers
    if !dblp_keys.is_empty() {
        sqlx::query(
            "INSERT INTO papers (venue_id, title, year, ee_link, dblp_key, citation_count) \
             SELECT * FROM UNNEST($1::int[], $2::text[], $3::int[], $4::text[], $5::text[], $6::int[]) \
             ON CONFLICT (dblp_key) DO UPDATE SET \
             title = EXCLUDED.title, \
             citation_count = COALESCE(EXCLUDED.citation_count, papers.citation_count)"
        )
        .bind(&venue_ids)
        .bind(&titles)
        .bind(&years)
        .bind(&ee_links)
        .bind(&dblp_keys)
        .bind(&cit_counts)
        .execute(&mut *tx).await?;
    }

    let paper_rows: Vec<(i32, String)> = sqlx::query_as("SELECT id, dblp_key FROM papers WHERE dblp_key = ANY($1)")
        .bind(&dblp_keys)
        .fetch_all(&mut *tx).await?;
        
    let mut paper_map: HashMap<String, i32> = HashMap::new();
    for r in paper_rows {
        paper_map.insert(r.1, r.0);
    }

    // 4. Bulk insert authors
    let unique_authors: Vec<String> = unique_author_names_set.into_iter().collect();
    if !unique_authors.is_empty() {
        sqlx::query("INSERT INTO authors (name) SELECT * FROM UNNEST($1::text[]) ON CONFLICT (name) DO NOTHING")
            .bind(&unique_authors)
            .execute(&mut *tx).await?;
    }

    let author_rows: Vec<(i32, String)> = sqlx::query_as("SELECT id, name FROM authors WHERE name = ANY($1)")
        .bind(&unique_authors)
        .fetch_all(&mut *tx).await?;
        
    let mut author_map: HashMap<String, i32> = HashMap::new();
    for r in author_rows {
        author_map.insert(r.1, r.0);
    }

    // 5. Bulk insert paper_authors
    let mut final_pa_paper_ids = Vec::with_capacity(pa_dblp_keys.len());
    let mut final_pa_author_ids = Vec::with_capacity(pa_dblp_keys.len());
    let mut final_pa_author_orders = Vec::with_capacity(pa_dblp_keys.len());
    let mut pa_set = std::collections::HashSet::new();

    for i in 0..pa_dblp_keys.len() {
        let p_id = paper_map.get(&pa_dblp_keys[i]);
        let a_id = author_map.get(&pa_author_names[i]);
        if let (Some(p), Some(a)) = (p_id, a_id) {
            if pa_set.insert((*p, *a)) {
                final_pa_paper_ids.push(*p);
                final_pa_author_ids.push(*a);
                final_pa_author_orders.push(pa_author_orders[i]);
            }
        }
    }

    if !final_pa_paper_ids.is_empty() {
        sqlx::query("INSERT INTO paper_authors (paper_id, author_id, author_order) \
                     SELECT * FROM UNNEST($1::int[], $2::int[], $3::int[]) \
                     ON CONFLICT DO NOTHING")
            .bind(&final_pa_paper_ids)
            .bind(&final_pa_author_ids)
            .bind(&final_pa_author_orders)
            .execute(&mut *tx).await?;
    }

    tx.commit().await?;
    Ok(())
}
