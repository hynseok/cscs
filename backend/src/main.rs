use axum::{
    Json, Router,
    extract::{Query, State},
    routing::get,
};
use meilisearch_sdk::client::Client;
use meilisearch_sdk::search::Selectors;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tower_http::cors::CorsLayer;

struct AppState {
    meili: Client,
}

#[derive(Deserialize)]
struct SearchParams {
    q: Option<String>,
    venue: Option<String>,
    year: Option<i32>,
    limit: Option<usize>,
    page: Option<usize>,
    facets: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
struct PaperHit {
    id: i32,
    title: String,
    year: i32,
    venue: String,
    authors: Vec<String>,
    ee_link: Option<String>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    let meili_url = std::env::var("MEILI_URL").unwrap_or("http://localhost:7700".into());
    let meili_key = std::env::var("MEILI_MASTER_KEY").expect("MEILI_MASTER_KEY must be set");
    
    let state = Arc::new(AppState {
        meili: Client::new(meili_url, Some(meili_key))?,
    });

    let app = Router::new()
        .route("/search", get(search_papers))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr = "0.0.0.0:8080";
    println!("High-performance Search API running on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn search_papers(
    State(state): State<Arc<AppState>>,
    Query(params): Query<SearchParams>,
) -> Json<serde_json::Value> {
    let index = state.meili.index("papers");

    let venue_filter = params.venue.as_ref().map(|v| format!("venue = \"{}\"", v));
    let year_filter = params.year.map(|y| format!("year = {}", y));

    // --- Main Search ---
    let mut main_search = index.search();
    if let Some(ref q) = params.q {
        main_search.with_query(q);
    }

    let mut main_filters = Vec::new();
    if let Some(ref f) = venue_filter { main_filters.push(f.clone()); }
    if let Some(ref f) = year_filter { main_filters.push(f.clone()); }
    
    // Join filters with AND
    let main_filter_str = main_filters.join(" AND ");
    if !main_filters.is_empty() {
        main_search.with_filter(&main_filter_str);
    }

    let limit = params.limit.unwrap_or(20);
    main_search.with_limit(limit);

    if let Some(page) = params.page {
        let offset = (page.saturating_sub(1)) * limit;
        main_search.with_offset(offset);
    }
    
    // We execute the main search
    // We only ask for facets in main search if we strictly need them, 
    // but we will overwrite them with disjunctive ones anyway.
    
    // --- Disjunctive Facet Searches ---
    // We need to check which facets are requested
    let mut requested_facets = Vec::new();
    if let Some(ref facets) = params.facets {
        requested_facets = facets.split(',').map(|s| s.trim()).collect();
    }

    let do_venue_facet = requested_facets.contains(&"venue");
    let do_year_facet = requested_facets.contains(&"year");

    // We can run these concurrently.
    // Note: 'search' builder borrows 'index'. We might need to create multiple searches.
    // Since 'index' is just a struct wrapper (cheap to clone usually, or we just create it again), we can do that.
    
    let main_fut = main_search.execute::<PaperHit>();

    let venue_fut = async {
        if !do_venue_facet { return None; }
        let mut search = index.search();
        if let Some(ref q) = params.q { search.with_query(q); }
        search.with_limit(0);
        search.with_facets(Selectors::Some(&["venue"]));
        
        // Apply all filters EXCEPT venue
        // For venue facet, we want to see distribution across ALL venues, filtered only by Year (and Query)
        if let Some(ref f) = year_filter {
            search.with_filter(f);
        }
        
        search.execute::<PaperHit>().await.ok()
    };

    let year_fut = async {
        if !do_year_facet { return None; }
        let mut search = index.search();
        if let Some(ref q) = params.q { search.with_query(q); }
        search.with_limit(0);
        search.with_facets(Selectors::Some(&["year"]));
        
        // Apply all filters EXCEPT year
        if let Some(ref f) = venue_filter {
            search.with_filter(f);
        }
        
        search.execute::<PaperHit>().await.ok()
    };

    let (main_res, venue_res, year_res) = tokio::join!(main_fut, venue_fut, year_fut);

    let mut finals = match main_res {
        Ok(r) => r,
        Err(e) => return Json(serde_json::json!({ "error": e.to_string() })),
    };

    // Merge facets
    let mut combined_facets = std::collections::HashMap::new();

    if let Some(v_res) = venue_res {
        if let Some(dist) = v_res.facet_distribution {
            if let Some(v_map) = dist.get("venue") {
                combined_facets.insert("venue".to_string(), v_map.clone());
            }
        }
    }
    
    if let Some(y_res) = year_res {
         if let Some(dist) = y_res.facet_distribution {
            if let Some(y_map) = dist.get("year") {
                combined_facets.insert("year".to_string(), y_map.clone());
            }
        }
    }

    // Since SearchResults field is private/setup in a way that might be hard to mutate directly if we don't own it fully or if struct fields are pub.
    // Meilisearch SDK SearchResults fields are public.
    finals.facet_distribution = Some(combined_facets);

    Json(serde_json::to_value(finals).unwrap())
}